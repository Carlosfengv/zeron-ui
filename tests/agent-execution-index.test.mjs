import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { Zip, ZipDeflate } from "fflate";
import { executionIndexSchema, executionRoles, executionWorkflowLocator, verifyExecutionArchive, writeExecutionResult } from "../scripts/agent-execution-index.mjs";
import { consumerEvidenceSchema } from "../scripts/published-consumer-evidence.mjs";
import { loadAgentSchema } from "../scripts/load-agent-schema.mjs";
import { serialize, sha256 } from "../scripts/agent-utils.mjs";
import { releaseFixture } from "./helpers/agent-release-fixture.mjs";
import { unzipCiArchive } from "../scripts/safe-ci-zip.mjs";

// Synthetic archive bytes exercise the binding contract; no official CLI, browser, public store or CI is executed.
let parent, fixture, counter = 0;
const copy = value => JSON.parse(JSON.stringify(value));
beforeAll(async () => {
  vi.stubEnv("GITHUB_ACTIONS", "false");
  parent = await mkdtemp(path.join(tmpdir(), "zeron-execution-index-tests-"));
  fixture = await releaseFixture({ directory: path.join(parent, "fixture"), label: "a", objects: new Map(), schemas: await loadAgentSchema(), includeExamples: true });
});
afterAll(async () => { await rm(parent, { recursive: true, force: true }); vi.unstubAllEnvs(); });
const describeFile = (name, bytes) => ({ path: name, bytes: bytes.length, sha256: sha256(bytes) });
async function archiveFiles(directory) {
  const files = new Map();
  async function visit(relative = "") {
    for (const entry of await readdir(path.join(directory, relative), { withFileTypes: true })) {
      const name = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory()) await visit(name);
      else files.set(name, await readFile(path.join(directory, name)));
    }
  }
  await visit(); return files;
}
function indexEdit(files, edit) {
  const result = new Map(files), index = JSON.parse(result.get("execution-index.json"));
  edit(index); result.set("execution-index.json", Buffer.from(serialize(index))); return result;
}
async function setup(role = "consumer", resultKind = "published") {
  const output = path.join(parent, `run-${++counter}`); await mkdir(output);
  const input = fixture.examples.prepared.input;
  const report = role === "consumer" ? copy(fixture.verification) : copy(fixture.examples.verification);
  const publicAttachments = [];
  if (role === "consumer") {
    for (const row of report.matrices) {
      row.packageManagerVersion = row.packageManager === "npm" ? "10.9.2" : "10.12.4";
      const { evidence: _ref, ...matrix } = row;
      const evidence = consumerEvidenceSchema.parse({ schemaVersion: 1, kind: "published-consumer-evidence",
        scope: "actual-official-cli-and-final-registry-installation", source: input.source, inputSha256: sha256(serialize(input)),
        cli: report.cli, registry: { releaseId: input.registry.releaseId, manifest: input.registry.manifest }, matrix,
        templateSha256: "1".repeat(64), initialLockfileSha256: "2".repeat(64), finalLockfileSha256: "3".repeat(64),
        cliOwnFilesSha256: "4".repeat(64), finalProjectSha256: "5".repeat(64), businessSourcePreserved: true, themeInstalled: true, compiledTheme: true,
        nextOnlyRejection: row.framework === "vite" ? { item: input.nextOnlyRejectionItem, reason: "requires-next", unchanged: true } : null });
      const bytes = Buffer.from(serialize(evidence)), name = `${row.framework}-${row.packageManager}.evidence.json`;
      row.evidence = { url: `${input.artifactBaseUrl}/evidence/consumer/${sha256(bytes)}.json`, bytes: bytes.length, sha256: sha256(bytes) };
      publicAttachments.push({ ...row.evidence, path: name }); await writeFile(path.join(output, name), bytes);
    }
  } else {
    await mkdir(path.join(output, "attachments"));
    for (const [url, bytes] of fixture.examples.attachments) {
      const name = `attachments/${new URL(url).pathname.split("/").at(-1)}`;
      publicAttachments.push({ url, ...describeFile(name, bytes) }); await writeFile(path.join(output, name), bytes);
    }
  }
  await mkdir(path.join(output, "private-logs"));
  await writeFile(path.join(output, "private-logs/run.json"), serialize({ scope: "synthetic-test-log-not-real-execution", stdout: "fixture", stderr: "" }));
  const log = async (name, step, packageManager = "npm", exitCode = 0) => writeFile(path.join(output, name), serialize({
    step, file: packageManager, args: ["types", "build"].includes(step) ? ["run", step] : ["fixture"], exitCode,
    stdout: step === "next-only-rejection" ? "login-01 requires Next.js" : "synthetic output", stderr: "", code: null }));
  await log("private-logs/reference-manager-version.json", "reference-manager-version"); await log("private-logs/cli-reference.json", "cli-reference");
  for (const profile of input.matrices) {
    const base = `private-logs/${profile.framework}-${profile.packageManager}`; await mkdir(path.join(output, base));
    for (const step of ["manager-version", "bootstrap", "cli-version", "dry-run", "install", "types", "build"]) await log(`${base}/${step}.json`, step, profile.packageManager);
    if (profile.framework === "vite") await log(`${base}/next-only-rejection.json`, "next-only-rejection", profile.packageManager, 1);
    if (role === "examples") {
      await log(`${base}/browser-process.json`, "browser");
      await writeFile(path.join(output, base, "preview.json"), serialize({ scope: "synthetic-preview-not-real-server" }));
      const browser = `${profile.framework}-${profile.packageManager}-browser`; await mkdir(path.join(output, browser));
      await writeFile(path.join(output, browser, "observations.json"), serialize({ scope: "synthetic-observations-not-real-browser" }));
    }
  }
  const local = role === "consumer" ? { schemaVersion: 1, kind: "local-consumer-verification", status: "tested-local-evidence",
    scope: "actual-consumers-without-public-evidence-not-a-frozen-release-input", source: input.source,
    matrices: report.matrices.map(({ evidence: _ref, ...matrix }) => matrix) }
    : { schemaVersion: 1, kind: "local-example-execution", status: "actual-checks-without-public-evidence",
      scope: "not-a-formal-release-or-trusted-ci-attestation", verification: report };
  return { output, input, role, resultKind, report: resultKind === "published" ? report : local, publicAttachments };
}
async function sources(role) {
  return new Map(await Promise.all([executionRoles[role].producer, executionRoles[role].worker].filter(Boolean).map(async name => [name, await readFile(name)])));
}

describe("execution archive byte bindings", () => {
  it.each(["consumer", "examples"])("writes and reads the %s archive with exact report, logs, attachments and source hashes", async role => {
    const args = await setup(role), index = await writeExecutionResult(args), files = await archiveFiles(args.output);
    expect(executionIndexSchema.parse(index)).toEqual(index);
    expect(index.workflowLocator).toBeNull();
    expect(index.outputFiles.map(file => file.path)).toContain("private-logs/run.json");
    expect(index.outputFiles).toContainEqual(describeFile(index.report.path, files.get(index.report.path)));
    expect(files.size).toBe(index.outputFiles.length + 1);
    const result = verifyExecutionArchive(files, { role, input: args.input, sourceFiles: await sources(role) });
    expect(result.report).toEqual(args.report); expect(result.attachments.size).toBe(args.publicAttachments.length);
    expect(result.scope).toBe("archive-byte-binding-not-a-trusted-ci-attestation");
  });
  it.each(["consumer", "examples"])("indexes the actual %s local wrapper but never accepts it as published evidence", async role => {
    const args = await setup(role, "local"); await writeExecutionResult(args);
    const files = await archiveFiles(args.output);
    expect(JSON.parse(files.get("execution-index.json")).report).toEqual(describeFile("local-verification.json", files.get("local-verification.json")));
    expect(() => verifyExecutionArchive(files, { role, input: args.input })).toThrow(/LOCAL_RESULT/);
    expect(verifyExecutionArchive(files, { role, input: args.input, requirePublished: false }).report).toEqual(args.report);
  });
  it.each(["consumer", "examples"])("roundtrips every %s report, log and attachment through an independent streaming ZIP", async role => {
    const args = await setup(role); await writeExecutionResult(args); const files = await archiveFiles(args.output), chunks = [];
    const zip = new Zip((error, chunk) => { if (error) throw error; chunks.push(Buffer.from(chunk)); });
    for (const [name, bytes] of files) { const entry = new ZipDeflate(name); zip.add(entry); entry.push(bytes, true); }
    zip.end();
    const restored = unzipCiArchive(Buffer.concat(chunks));
    expect(restored.size).toBe(files.size);
    for (const [name, bytes] of files) expect(restored.get(name)).toEqual(bytes);
    expect(verifyExecutionArchive(restored, { role, input: args.input, sourceFiles: await sources(role) }).report).toEqual(args.report);
  });
  it("rejects missing, substituted, extra and noncanonical archive bytes", async () => {
    const args = await setup(); await writeExecutionResult(args); const original = await archiveFiles(args.output);
    for (const change of [files => files.delete("private-logs/run.json"), files => files.set("private-logs/run.json", Buffer.from("substitution")),
      files => files.set("extra.txt", Buffer.from("extra")), files => files.set("execution-index.json", Buffer.from(JSON.stringify(JSON.parse(files.get("execution-index.json")))))]) {
      const files = new Map(original); change(files);
      expect(() => verifyExecutionArchive(files, { input: args.input })).toThrow();
    }
    expect(() => verifyExecutionArchive(original, { role: "examples", input: args.input })).toThrow(/INDEX_ROLE/);
    const wrongInput = copy(args.input); wrongInput.source.lockfileSha256 = "e".repeat(64);
    expect(() => verifyExecutionArchive(original, { input: wrongInput })).toThrow(/INPUT_BINDING/);
    const sourceFiles = await sources("consumer"); sourceFiles.set(executionRoles.consumer.producer, Buffer.from("different producer"));
    expect(() => verifyExecutionArchive(original, { input: args.input, sourceFiles })).toThrow(/EXECUTION_SOURCE_BYTES/);
  });
  it("rejects coherent replacement of consumer evidence and report against the fixed input", async () => {
    const args = await setup(); await writeExecutionResult(args); const files = await archiveFiles(args.output);
    const report = JSON.parse(files.get("verification.json")), name = "next-npm.evidence.json", evidence = JSON.parse(files.get(name));
    evidence.registry.manifest.sha256 = "e".repeat(64);
    const bytes = Buffer.from(serialize(evidence)); files.set(name, bytes);
    report.matrices[0].evidence = { url: `${args.input.artifactBaseUrl}/evidence/consumer/${sha256(bytes)}.json`, bytes: bytes.length, sha256: sha256(bytes) };
    files.set("verification.json", Buffer.from(serialize(report)));
    const changed = indexEdit(files, index => {
      index.outputFiles = index.outputFiles.map(file => [name, "verification.json"].includes(file.path) ? describeFile(file.path, files.get(file.path)) : file);
      index.report = describeFile("verification.json", files.get("verification.json"));
      index.publicAttachments = index.publicAttachments.map(ref => ref.path === name ? { path: name, ...report.matrices[0].evidence } : ref).sort((a, b) => a.url.localeCompare(b.url));
    });
    expect(() => verifyExecutionArchive(changed, { input: args.input })).toThrow(/CONSUMER_EVIDENCE_INPUT/);
  });
  it("rejects missing or foreign public attachments even when output file hashes are valid", async () => {
    const args = await setup("examples"); await writeExecutionResult(args); const original = await archiveFiles(args.output);
    expect(() => verifyExecutionArchive(indexEdit(original, index => index.publicAttachments.pop()), { input: args.input })).toThrow(/REPORT_ATTACHMENT_SET/);
    expect(() => verifyExecutionArchive(indexEdit(original, index => {
      index.publicAttachments = index.publicAttachments.map(ref => ({ ...ref, url: ref.url.replace(args.input.artifactBaseUrl, "https://foreign.example.invalid") }));
    }), { input: args.input })).toThrow(/ATTACHMENT_ORIGIN/);
  });
  it("enforces sorted unique safe paths and strict index fields", async () => {
    const args = await setup(); await writeExecutionResult(args); const files = await archiveFiles(args.output);
    for (const edit of [index => index.outputFiles.reverse(), index => index.outputFiles.push(index.outputFiles[0]),
      index => { index.outputFiles[0].path = "../escape"; }, index => { index.passed = true; },
      index => { index.producer.path = "scripts/fixture-producer.mjs"; }, index => { index.outputFiles[0].bytes = 32 * 1024 * 1024 + 1; }]) {
      expect(() => verifyExecutionArchive(indexEdit(files, edit), { input: args.input })).toThrow(/INDEX_CONTRACT/);
    }
  });
  it("rejects coherent removal of a required log and coherently recorded failed command", async () => {
    const args = await setup(); await writeExecutionResult(args); const files = await archiveFiles(args.output);
    const missing = new Map(files), name = "private-logs/next-npm/types.json"; missing.delete(name);
    expect(() => verifyExecutionArchive(indexEdit(missing, index => { index.outputFiles = index.outputFiles.filter(file => file.path !== name); }),
      { input: args.input })).toThrow(/EXECUTION_LOG_MISSING/);
    const record = JSON.parse(files.get(name)); record.exitCode = 7;
    const changed = new Map(files); changed.set(name, Buffer.from(serialize(record)));
    expect(() => verifyExecutionArchive(indexEdit(changed, index => {
      index.outputFiles = index.outputFiles.map(file => file.path === name ? describeFile(name, changed.get(name)) : file);
    }), { input: args.input })).toThrow(/EXECUTION_LOG_RESULT/);
  });
  it("rejects a coherently shortened example report even if all retained files still hash correctly", async () => {
    const args = await setup("examples"); await writeExecutionResult(args); const files = await archiveFiles(args.output);
    const name = "examples-verification.json", report = JSON.parse(files.get(name)); report.rows = report.rows.slice(0, 3);
    files.set(name, Buffer.from(serialize(report)));
    expect(() => verifyExecutionArchive(indexEdit(files, index => {
      index.report = describeFile(name, files.get(name)); index.outputFiles = index.outputFiles.map(file => file.path === name ? index.report : file);
    }), { input: args.input })).toThrow(/EXAMPLE_PROFILE_SET/);
  });
});

describe("execution result writer failure boundaries", () => {
  it("does not create a success report or index when attachment binding is wrong", async () => {
    const args = await setup(); args.publicAttachments[0].sha256 = "0".repeat(64);
    await expect(writeExecutionResult(args)).rejects.toBeDefined();
    for (const name of ["verification.json", "execution-index.json"]) await expect(readFile(path.join(args.output, name))).rejects.toMatchObject({ code: "ENOENT" });
  });
  it("does not write a success report when a required execution log was never produced", async () => {
    const args = await setup(); await rm(path.join(args.output, "private-logs/next-npm/build.json"));
    await expect(writeExecutionResult(args)).rejects.toMatchObject({ code: "EXECUTION_LOG_MISSING" });
    for (const name of ["verification.json", "execution-index.json"]) await expect(readFile(path.join(args.output, name))).rejects.toMatchObject({ code: "ENOENT" });
  });
  it("refuses old index/report collisions without overwriting either", async () => {
    for (const name of ["execution-index.json", "verification.json"]) {
      const args = await setup(); await writeFile(path.join(args.output, name), "old result");
      await expect(writeExecutionResult(args)).rejects.toMatchObject({ code: "OUTPUT_ALREADY_EXISTS" });
      expect(await readFile(path.join(args.output, name), "utf8")).toBe("old result");
      await expect(readFile(path.join(args.output, name === "execution-index.json" ? "verification.json" : "execution-index.json"))).rejects.toMatchObject({ code: "ENOENT" });
    }
  });
  it("rejects output symlinks instead of hashing outside the archive", async () => {
    const args = await setup(); await symlink(path.join(args.output, "next-npm.evidence.json"), path.join(args.output, "alias.json"));
    await expect(writeExecutionResult(args)).rejects.toMatchObject({ code: "OUTPUT_NOT_REGULAR" });
    await expect(readFile(path.join(args.output, "verification.json"))).rejects.toMatchObject({ code: "ENOENT" });
  });
  it("only records complete CI locators and does not treat them as trust", () => {
    expect(executionWorkflowLocator({ GITHUB_RUN_ID: "arbitrary" })).toBeNull();
    const env = { GITHUB_ACTIONS: "true", GITHUB_REPOSITORY: "Carlosfengv/zeron-ui",
      GITHUB_WORKFLOW_REF: "Carlosfengv/zeron-ui/.github/workflows/agent-release-validation.yml@refs/heads/main",
      GITHUB_RUN_ID: "123", GITHUB_RUN_ATTEMPT: "2", GITHUB_SHA: "a".repeat(40) };
    expect(executionWorkflowLocator(env)).toMatchObject({ runId: 123, runAttempt: 2, headSha: "a".repeat(40) });
    for (const key of Object.keys(env).filter(key => key !== "GITHUB_ACTIONS")) {
      const broken = { ...env }; delete broken[key]; expect(() => executionWorkflowLocator(broken)).toThrow();
    }
    expect(() => executionWorkflowLocator({ ...env, GITHUB_RUN_ID: "9007199254740992" })).toThrow();
  });
});
