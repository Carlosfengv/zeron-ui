import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { verifyEvidenceIndex } from "../.agents/skills/swap-to-zeronui/scripts/verify-evidence.mjs";
import { verifyEvidence, validatePlan } from "../packages/cli/src/swap/state.js";
import { fixture, validPlan } from "../packages/cli/tests/swap/helpers.js";

const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
const execute = promisify(execFile);
const script = fileURLToPath(new URL("../.agents/skills/swap-to-zeronui/scripts/verify-evidence.mjs", import.meta.url));
const cleanups = [];
afterEach(async () => { for (const cleanup of cleanups.splice(0)) await cleanup(); });

async function evidenceFiles(cwd) {
  cwd ??= await mkdtemp(path.join(tmpdir(), "zeron-skill-evidence-"));
  cleanups.push(() => rm(cwd, { recursive: true, force: true }));
  const indexPath = ".zeron/migrations/test/evidence-index.json";
  const files = {
    ".zeron/migrations/test/report.md": "Contract review: see regions.md; browser evidence: output/workspace.png",
    ".zeron/migrations/test/regions.md": "Workspace uses one page body scroll owner. Inspected in browser.",
    "output/workspace.png": Buffer.from([137, 80, 78, 71, 13, 10]),
  };
  for (const [file, content] of Object.entries(files)) {
    await mkdir(path.dirname(path.join(cwd, file)), { recursive: true });
    await writeFile(path.join(cwd, file), content);
  }
  const index = { formatVersion: 1, files: Object.entries(files).map(([file, bytes]) => ({ path: file, sha256: hash(bytes) })) };
  const save = () => writeFile(path.join(cwd, indexPath), JSON.stringify(index));
  await save();
  return { cwd, indexPath, index, save };
}

describe("skill evidence attachments", () => {
  it("uses existing closed plan evidence fields without a schema change", async () => {
    const cwd = await fixture({ after: (cleanup) => cleanups.push(cleanup) });
    const plan = await validPlan(cwd);
    const { indexPath } = await evidenceFiles(cwd);
    const bytes = await readFile(path.join(cwd, indexPath));
    plan.checks.forEach((check) => { check.evidence = { path: indexPath, sha256: hash(bytes) }; });
    expect(validatePlan(plan)).toEqual([]);
    expect(await verifyEvidence(cwd, plan.checks[0].evidence)).toBe(true);
    expect(await verifyEvidenceIndex(cwd, indexPath)).toEqual({ status: "passed", checked: 3, diagnostics: [] });
    expect(await readFile(path.join(cwd, indexPath))).toEqual(bytes);
  });

  it.each([".zeron/migrations/test/regions.md", "output/workspace.png"])("detects changed attachment %s even while the direct CLI evidence hash still passes", async (file) => {
    const { cwd, indexPath } = await evidenceFiles();
    const proof = { path: indexPath, sha256: hash(await readFile(path.join(cwd, indexPath))) };
    await writeFile(path.join(cwd, file), "changed after verification");
    expect(await verifyEvidence(cwd, proof)).toBe(true);
    const result = await verifyEvidenceIndex(cwd, indexPath);
    expect(result.status).toBe("failed");
    expect(result.diagnostics).toEqual([{ path: file, detail: "Evidence hash mismatch" }]);
  });

  it("rejects a missing attachment", async () => {
    const { cwd, indexPath } = await evidenceFiles();
    await rm(path.join(cwd, "output/workspace.png"));
    expect((await verifyEvidenceIndex(cwd, indexPath)).status).toBe("failed");
  });

  it("rejects duplicates, self references and directories", async () => {
    const { cwd, indexPath, index, save } = await evidenceFiles();
    index.files.push(index.files[0], { path: indexPath, sha256: hash("") }, { path: "output", sha256: hash("") });
    await save();
    const result = await verifyEvidenceIndex(cwd, indexPath);
    expect(result.status).toBe("failed");
    expect(result.diagnostics.map((d) => d.detail)).toEqual(["Duplicate evidence file", "Index cannot include itself", "Not a regular file: output"]);
  });

  it("rejects path traversal and symlinks escaping the application", async () => {
    const { cwd, indexPath, index, save } = await evidenceFiles();
    const outside = await mkdtemp(path.join(tmpdir(), "zeron-outside-evidence-"));
    cleanups.push(() => rm(outside, { recursive: true, force: true }));
    const external = path.join(outside, "external.md");
    await writeFile(external, "outside");
    await symlink(external, path.join(cwd, "linked.md"));
    index.files = ["../external.md", external, "C:/external.md", "linked.md"].map((file) => ({ path: file, sha256: hash("outside") }));
    await save();
    expect((await verifyEvidenceIndex(cwd, indexPath)).diagnostics).toHaveLength(4);
    await symlink(external, path.join(cwd, "linked-index.json"));
    expect((await verifyEvidenceIndex(cwd, "linked-index.json")).status).toBe("failed");
  });

  it.each([null, {}, { formatVersion: 2, files: [] }, { formatVersion: 1, files: [] }, { formatVersion: 1, files: [null] }, { formatVersion: 1, files: [{ path: "output/workspace.png", sha256: 123 }] }])("rejects malformed indexes: %j", async (content) => {
    const { cwd, indexPath } = await evidenceFiles();
    await writeFile(path.join(cwd, indexPath), JSON.stringify(content));
    expect((await verifyEvidenceIndex(cwd, indexPath)).status).toBe("failed");
  });

  it("provides standalone JSON output and nonzero exit on failure", async () => {
    const { cwd, indexPath } = await evidenceFiles();
    const args = [script, "--cwd", cwd, "--index", indexPath];
    expect(JSON.parse((await execute(process.execPath, args)).stdout).status).toBe("passed");
    await writeFile(path.join(cwd, indexPath), "not JSON");
    await expect(execute(process.execPath, args)).rejects.toMatchObject({ code: 1, stdout: expect.stringContaining('"status": "failed"') });
    await expect(execute(process.execPath, [script])).rejects.toMatchObject({ code: 1, stderr: expect.stringContaining("Usage:") });
  });
});
