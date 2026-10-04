import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { chmod, mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { checkDeploymentGitInputs } from "../scripts/agent-deployment-git.mjs";
import { frozenReleaseSchema } from "../scripts/agent-release-record.mjs";
import { comparePublicationControls, publicationDispatchSchema } from "../scripts/agent-publication-workflow.mjs";
import { releaseFreezeReviewSchema } from "../scripts/freeze-agent-release.mjs";
import { serialize, sha256, sourceProvenance } from "../scripts/agent-utils.mjs";

// Actual isolated Git commits, but all public resources, runs and reviews are synthetic.
// Positive cases prove only the library's Git/byte foundation, never a G0 approval or deployment.
const json = value => Buffer.from(serialize(value));
const ref = (path, bytes) => ({ path, bytes: bytes.length, sha256: sha256(bytes) });
const releaseDir = "docs/agent-data/releases";
let parent;
beforeAll(async () => { parent = await mkdtemp(path.join(tmpdir(), "zeron-deployment-git-tests-")); });
afterAll(async () => { vi.unstubAllEnvs(); await rm(parent, { recursive: true, force: true }); });

function record(source, label = "a", history = []) {
  const origin = "https://artifacts.example.invalid", skill = "f".repeat(64), catalog = label.repeat(64);
  const resource = url => ({ url, bytes: 100, sha256: "1".repeat(64) });
  const registryBase = `${origin}/r/releases/fixture-release`, skillBase = `${origin}/skills/releases/${skill}`, catalogBase = `${origin}/ai/releases/${catalog}`;
  return frozenReleaseSchema.parse({ schemaVersion: 1, source, artifactBaseUrl: origin, siteBaseUrl: "https://docs.example.invalid",
    registry: { releaseId: "fixture-release", manifest: resource(`${registryBase}/manifest.json`), completion: resource(`${registryBase}/complete.json`) },
    skill: { version: skill, artifacts: resource(`${skillBase}/artifacts.json`), manifest: resource(`${skillBase}/manifest.json`),
      archive: resource(`${skillBase}/zeron-skills.zip`), guide: resource(`${skillBase}/install.md`), completion: resource(`${skillBase}/complete.json`) },
    catalog: { version: catalog, manifest: resource(`${catalogBase}/manifest.json`), completion: resource(`${catalogBase}/complete.json`),
      installationVerification: resource(`${catalogBase}/installation-verification.json`) }, history });
}
function reviews(f) {
  const recordBytes = json(f.record), selectionBytes = json({ schemaVersion: 1, current: ref(`${f.record.catalog.version}.json`, recordBytes) });
  const freeze = releaseFreezeReviewSchema.parse({ schemaVersion: 1, kind: "agent-release-freeze", status: "draft-verified-not-approved-or-deployed",
    scope: "fresh-source-ci-public-stages-and-durable-handoff-checked", source: f.record.source, catalogVersion: f.record.catalog.version,
    record: ref(`${f.record.catalog.version}.json`, recordBytes), selection: ref("current.json", selectionBytes), predecessor: f.predecessor,
    candidateReviewSha256: "2".repeat(64), ciReceiptSha256: "3".repeat(64),
    ciArchive: { url: `https://fixture.private.blob.vercel-storage.com/ci/releases/${f.record.catalog.version}/${"4".repeat(64)}/index.json`, bytes: 100, sha256: "5".repeat(64) },
    storage: { schemaVersion: 1, provider: "vercel-blob", access: "private", origin: "https://fixture.private.blob.vercel-storage.com", retention: "approved-releases-no-automatic-deletion" },
    restoration: { schemaVersion: 1, scope: "verified-frozen-record-restoration-not-deployment", status: "passed", catalogVersion: f.record.catalog.version,
      versions: [f.record.catalog.version, ...f.record.history.map(item => item.path.slice(0, -5))], downloadedBytes: 100, files: 10, runtimeBytes: 100 } });
  return new Map([["publication-dispatch.json", json(f.dispatch)], ["freeze-review.json", json(freeze)],
    [`releases/${f.record.catalog.version}.json`, recordBytes], ["releases/current.json", selectionBytes]]);
}
async function fixture({ history = 0, rollback = false, linkedSource = false } = {}) {
  const owner = await mkdtemp(path.join(parent, "repository-"));
  const git = (args, input) => execFileSync("git", args, { cwd: owner, input, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  const write = async (name, bytes) => { const filename = path.join(owner, name); await mkdir(path.dirname(filename), { recursive: true }); await writeFile(filename, bytes); };
  const commit = message => { git(["add", "."]); git(["-c", "commit.gpgsign=false", "commit", "--quiet", "-m", message]); return git(["rev-parse", "HEAD"]); };
  git(["init", "--quiet"]); git(["config", "user.name", "Explicit Git contract fixture"]); git(["config", "user.email", "fixture@example.invalid"]);
  const controls = new Map(["package.json", "pnpm-lock.yaml", "vercel.json", "docs/agent-data/ci-trust.json", "docs/agent-data/installation-config.json",
    "docs/agent-data/ci-archive-storage.json", ".github/workflows/agent-release-validation.yml", ".github/workflows/agent-release-publication.yml",
    "scripts/release.mjs"].map(name => [name, Buffer.from(`explicit synthetic control ${name}\n`)]));
  for (const [name, bytes] of controls) await write(name, bytes);
  await write("app/source.ts", "export const fixture = 1;\n"); await write(".gitignore", "ignored-output/\n");
  if (linkedSource) await symlink("app/source.ts", path.join(owner, "source-link.ts"));
  const oldRecords = [], syntheticSource = { sourceRevision: "e".repeat(40), sourceInputSha256: "e".repeat(64), lockfileSha256: "e".repeat(64), sourceClean: true };
  for (let index = 0; index < history; index++) {
    const old = record(syntheticSource, ["b", "c", "d"][index], oldRecords.slice(-2).reverse().map(item => item.reference));
    const bytes = json(old), reference = ref(`${old.catalog.version}.json`, bytes);
    await write(`${releaseDir}/${reference.path}`, bytes); oldRecords.push({ old, bytes, reference });
  }
  const chosen = oldRecords[rollback ? 0 : oldRecords.length - 1];
  if (chosen) await write(`${releaseDir}/current.json`, json({ schemaVersion: 1, current: chosen.reference }));
  const sourceRevision = commit("Synthetic clean content S"), source = await sourceProvenance(owner);
  const predecessor = oldRecords.length ? { approved: oldRecords.at(-1).reference, applicationSelection: chosen.reference } : null;
  const currentRecord = record(source, "a", oldRecords.slice(-2).reverse().map(item => item.reference));
  const dispatch = publicationDispatchSchema.parse({ schemaVersion: 1, kind: "agent-publication-dispatch", scope: "resolved-platform-identities-not-ci-byte-verification",
    launchRevision: sourceRevision, contentRevision: sourceRevision, launchRunId: 401, launchRunAttempt: 1, registryReleaseId: "fixture-release",
    predecessor: predecessor?.approved.path ?? "none", locator: { schemaVersion: 1,
      consumer: { runId: 101, runAttempt: 2, jobId: 201, artifactId: 301 }, examples: { runId: 101, runAttempt: 2, jobId: 202, artifactId: 302 } },
    controls: comparePublicationControls(controls, controls) });
  const f = { owner, git, write, commit, sourceRevision, record: currentRecord, dispatch, predecessor, oldRecords };
  f.reviewFiles = reviews(f);
  for (const [name, bytes] of f.reviewFiles) if (name.startsWith("releases/")) await write(`docs/agent-data/${name}`, bytes);
  f.deploymentRevision = commit("Synthetic record-only D");
  f.input = () => ({ sourceRevision: f.sourceRevision, deploymentRevision: f.deploymentRevision, reviewFiles: f.reviewFiles });
  f.check = () => checkDeploymentGitInputs(f.input(), { repositoryRoot: owner });
  return f;
}
async function recommit(f, name, bytes) {
  await f.write(name, bytes); f.deploymentRevision = f.commit("Synthetic changed D");
}

describe("deployment Git and frozen draft foundation", () => {
  it("checks real first-release S/D and reports bytes without approving or activating", async () => {
    const f = await fixture(), before = await readFile(path.join(f.owner, "app/source.ts")), report = await f.check();
    expect(report.source).toEqual(f.record.source); expect(report.deploymentRevision).toBe(f.deploymentRevision);
    expect(report.scope).toBe("git-source-record-and-draft-bytes-not-g0-approval-or-deployment");
    expect(report.status).toBe("verified-inputs"); expect(report.approved).toBeUndefined(); expect(report.passed).toBeUndefined();
    expect(report.records).toEqual([ref(`${f.record.catalog.version}.json`, json(f.record))]); expect(report.reviewFiles).toHaveLength(4);
    expect(report.deploymentTree.files).toBe(report.sourceTree.files + 2); expect(report.sourceTree.sha256).not.toBe(report.deploymentTree.sha256);
    expect(report.tool.sha256).toBe(sha256(await readFile("scripts/agent-deployment-git.mjs")));
    expect(await readFile(path.join(f.owner, "app/source.ts"))).toEqual(before); expect(f.git(["status", "--porcelain"])).toBe("");
    expect(f.git(["worktree", "list", "--porcelain"]).match(/^worktree /gm)).toHaveLength(1);
  });
  it("retains all immutable records, binds two latest predecessors and separates rollback selection", async () => {
    const f = await fixture({ history: 3, rollback: true }), report = await f.check();
    expect(report.records).toHaveLength(4); expect(report.predecessor).toEqual(f.oldRecords.at(-1).reference);
    expect(f.record.history).toEqual(f.oldRecords.slice(-2).reverse().map(item => item.reference));
    expect(f.predecessor.applicationSelection).toEqual(f.oldRecords[0].reference);
  });
  it("allows identical in-root source symlinks and ignored output without making D the source", async () => {
    const f = await fixture({ linkedSource: true }); await f.write("ignored-output/check.log", "ignored local output\n");
    const report = await f.check(); expect(report.source.sourceRevision).toBe(f.sourceRevision); expect(report.source.sourceClean).toBe(true);
    expect((await sourceProvenance(f.owner)).sourceInputSha256).not.toBe(report.source.sourceInputSha256);
  });
  it.each(["main", "a".repeat(39), "A".repeat(40), "a".repeat(40) + "\n"])("rejects an unfixed source identity %s", async sourceRevision => {
    const f = await fixture(); await expect(checkDeploymentGitInputs({ ...f.input(), sourceRevision }, { repositoryRoot: f.owner })).rejects.toHaveProperty("code", "DEPLOYMENT_INPUT_CONTRACT");
  });
  it("rejects caller-supplied approval and unknown input switches", async () => {
    const f = await fixture(); await expect(checkDeploymentGitInputs({ ...f.input(), approved: true }, { repositoryRoot: f.owner })).rejects.toHaveProperty("code", "DEPLOYMENT_INPUT_CONTRACT");
  });
  it("rejects an absent commit object", async () => {
    const f = await fixture(); await expect(checkDeploymentGitInputs({ ...f.input(), deploymentRevision: "0".repeat(40) }, { repositoryRoot: f.owner })).rejects.toHaveProperty("code", "DEPLOYMENT_GIT_READ");
  });
  it("rejects a deployment checkout that is not D", async () => {
    const f = await fixture(); f.git(["checkout", "--quiet", "--detach", f.sourceRevision]); await expect(f.check()).rejects.toHaveProperty("code", "DEPLOYMENT_CHECKOUT_REVISION");
  });
  it.each(["app/source.ts", "untracked.txt"])("rejects dirty or untracked checkout input %s", async name => {
    const f = await fixture(); await f.write(name, "uncommitted change\n"); await expect(f.check()).rejects.toHaveProperty("code", "DEPLOYMENT_CHECKOUT_DIRTY");
  });
  it.each(["--assume-unchanged", "--skip-worktree"])("rejects Git index flag %s hiding modified deployment code", async flag => {
    const f = await fixture(); f.git(["update-index", flag, "app/source.ts"]); await f.write("app/source.ts", "hidden modification\n");
    expect(f.git(["status", "--porcelain"])).toBe(""); await expect(f.check()).rejects.toHaveProperty("code", "DEPLOYMENT_CHECKOUT_INDEX_FLAGS");
  });
  it("rejects non-ancestor S even when D's entire tree matches", async () => {
    const f = await fixture(), tree = f.git(["rev-parse", `${f.deploymentRevision}^{tree}`]);
    f.deploymentRevision = f.git(["-c", "commit.gpgsign=false", "commit-tree", tree], "Synthetic unrelated tree\n");
    f.git(["checkout", "--quiet", "--detach", f.deploymentRevision]); await expect(f.check()).rejects.toHaveProperty("code", "DEPLOYMENT_SOURCE_ANCESTRY");
  });
  it.each(["app/source.ts", "pnpm-lock.yaml", ".env.local"])("rejects any non-record byte change, including provenance exclusions: %s", async name => {
    const f = await fixture(); await recommit(f, name, "changed content\n"); await expect(f.check()).rejects.toHaveProperty("code", "DEPLOYMENT_NON_RECORD_CHANGE");
  });
  it("rejects mode changes with identical source bytes", async () => {
    const f = await fixture(); await chmod(path.join(f.owner, "app/source.ts"), 0o755); f.deploymentRevision = f.commit("Synthetic mode change");
    await expect(f.check()).rejects.toHaveProperty("code", "DEPLOYMENT_NON_RECORD_CHANGE");
  });
  it("rejects a non-record deletion", async () => {
    const f = await fixture(); await rm(path.join(f.owner, "app/source.ts")); f.deploymentRevision = f.commit("Synthetic deletion");
    await expect(f.check()).rejects.toHaveProperty("code", "DEPLOYMENT_NON_RECORD_CHANGE");
  });
  it("rejects a new empty Git tree even though recursive blob lists are unchanged", async () => {
    const f = await fixture(), empty = f.git(["mktree"], "");
    const tree = f.git(["mktree"], `${f.git(["ls-tree", f.deploymentRevision])}\n040000 tree ${empty}\tempty-unrelated\n`);
    f.deploymentRevision = f.git(["-c", "commit.gpgsign=false", "commit-tree", tree, "-p", f.deploymentRevision], "Synthetic empty tree insertion\n");
    f.git(["checkout", "--quiet", "--detach", f.deploymentRevision]); await expect(f.check()).rejects.toHaveProperty("code", "DEPLOYMENT_NON_RECORD_CHANGE");
  });
  it("rejects a source file replaced by a link in D", async () => {
    const f = await fixture(); await rm(path.join(f.owner, "app/source.ts")); await symlink("../pnpm-lock.yaml", path.join(f.owner, "app/source.ts"));
    f.deploymentRevision = f.commit("Synthetic file type replacement"); await expect(f.check()).rejects.toHaveProperty("code", "DEPLOYMENT_NON_RECORD_CHANGE");
  });
  it("rejects an unrelated but schema-valid additional release record", async () => {
    const f = await fixture(), extra = record(f.record.source, "b");
    await recommit(f, `${releaseDir}/${extra.catalog.version}.json`, json(extra)); await expect(f.check()).rejects.toHaveProperty("code", "DEPLOYMENT_RECORD_HANDOFF");
  });
  it.each(["edit", "delete"])("rejects immutable historical record %s", async action => {
    const f = await fixture({ history: 1 }), filename = `${releaseDir}/${f.oldRecords[0].reference.path}`;
    if (action === "delete") await rm(path.join(f.owner, filename)); else await f.write(filename, Buffer.concat([f.oldRecords[0].bytes, Buffer.from("\n")]));
    f.deploymentRevision = f.commit("Synthetic historical record change"); await expect(f.check()).rejects.toHaveProperty("code", "DEPLOYMENT_OLD_RECORD_IMMUTABLE");
  });
  it.each([`${releaseDir}/notes.json`, `${releaseDir}/nested/notes.json`])("rejects arbitrary record-directory additions: %s", async name => {
    const f = await fixture(); await recommit(f, name, "{}\n"); await expect(f.check()).rejects.toHaveProperty("code", "DEPLOYMENT_RECORD_NAME");
  });
  it("rejects executable record mode", async () => {
    const f = await fixture(); await chmod(path.join(f.owner, releaseDir, "current.json"), 0o755); f.deploymentRevision = f.commit("Synthetic executable JSON");
    await expect(f.check()).rejects.toHaveProperty("code", "DEPLOYMENT_RECORD_FILE_TYPE");
  });
  it("rejects a substituted selection even if the historical reference is valid", async () => {
    const f = await fixture({ history: 1 }); await recommit(f, `${releaseDir}/current.json`, json({ schemaVersion: 1, current: f.oldRecords[0].reference }));
    await expect(f.check()).rejects.toHaveProperty("code", "DEPLOYMENT_RECORD_HANDOFF");
  });
  it("rejects forged history hashes before passing the input foundation", async () => {
    const f = await fixture({ history: 1 }); f.record.history[0].sha256 = "0".repeat(64); f.predecessor.approved = f.record.history[0]; f.reviewFiles = reviews(f);
    await expect(f.check()).rejects.toHaveProperty("code", "DEPLOYMENT_PREDECESSOR_HANDOFF");
  });
  it("rejects a review's incorrect application selection after rollback", async () => {
    const f = await fixture({ history: 3, rollback: true }); f.predecessor.applicationSelection = f.oldRecords.at(-1).reference; f.reviewFiles = reviews(f);
    await expect(f.check()).rejects.toHaveProperty("code", "DEPLOYMENT_PREDECESSOR_HANDOFF");
  });
  it("rejects dropping a required second history record", async () => {
    const f = await fixture({ history: 3 }); f.record.history = f.record.history.slice(0, 1); f.reviewFiles = reviews(f);
    await expect(f.check()).rejects.toHaveProperty("code", "DEPLOYMENT_HISTORY_BINDING");
  });
  it("rejects fabricated source input hash even when D exactly contains the rewritten draft", async () => {
    const f = await fixture(); f.record.source.sourceInputSha256 = "0".repeat(64); f.reviewFiles = reviews(f);
    for (const [name, bytes] of f.reviewFiles) if (name.startsWith("releases/")) await f.write(`docs/agent-data/${name}`, bytes);
    f.deploymentRevision = f.commit("Synthetic internally consistent forged provenance"); await expect(f.check()).rejects.toHaveProperty("code", "DEPLOYMENT_SOURCE_BINDING");
  });
  it("rejects a dispatch control digest that is not the actual S byte set", async () => {
    const f = await fixture(); f.dispatch.controls[0].sha256 = "0".repeat(64); f.reviewFiles = reviews(f);
    await expect(f.check()).rejects.toHaveProperty("code", "DEPLOYMENT_SOURCE_CONTROLS");
  });
  it.each(["missing", "extra", "noncanonical", "invalid-source"])("rejects review material %s", async action => {
    const f = await fixture();
    if (action === "missing") f.reviewFiles.delete("freeze-review.json");
    if (action === "extra") f.reviewFiles.set("approval.json", json({ approved: true }));
    if (action === "noncanonical") f.reviewFiles.set("publication-dispatch.json", Buffer.from(JSON.stringify(f.dispatch)));
    if (action === "invalid-source") { f.dispatch.contentRevision = "b".repeat(40); f.reviewFiles.set("publication-dispatch.json", json(f.dispatch)); }
    await expect(f.check()).rejects.toHaveProperty("code", action === "missing" || action === "extra" ? "DEPLOYMENT_REVIEW_FILES"
      : action === "noncanonical" ? "DEPLOYMENT_REVIEW_CANONICAL" : "DEPLOYMENT_REVIEW_CONTRACT");
  });
  it("cannot be redirected by ambient Git/Node injection variables", async () => {
    const f = await fixture();
    vi.stubEnv("GIT_DIR", path.join(parent, "nonexistent-git")); vi.stubEnv("GIT_WORK_TREE", parent);
    vi.stubEnv("NODE_OPTIONS", "--require=/fixture-must-not-load.cjs");
    try { expect((await f.check()).source).toEqual(f.record.source); } finally { vi.unstubAllEnvs(); }
  });
  it("cleans isolated source checkout after late provenance failure", async () => {
    const f = await fixture(); f.record.source.lockfileSha256 = "0".repeat(64); f.reviewFiles = reviews(f);
    for (const [name, bytes] of f.reviewFiles) if (name.startsWith("releases/")) await f.write(`docs/agent-data/${name}`, bytes);
    f.deploymentRevision = f.commit("Synthetic bad lock binding");
    const before = (await readdir(tmpdir())).filter(name => name.startsWith("zeron-deployment-source-"));
    await expect(f.check()).rejects.toHaveProperty("code", "DEPLOYMENT_SOURCE_BINDING");
    expect((await readdir(tmpdir())).filter(name => name.startsWith("zeron-deployment-source-"))).toEqual(before);
  });
  it.each(["../outside-source.txt", ".git/HEAD", "missing-source.txt"])("rejects nonportable source link %s", async destination => {
    const f = await fixture(); f.git(["checkout", "--quiet", "--detach", f.sourceRevision]);
    await writeFile(path.join(parent, "outside-source.txt"), "explicit external fixture, never a user's file\n");
    await symlink(destination, path.join(f.owner, "escape-link.ts")); f.sourceRevision = f.commit("Synthetic invalid source link S");
    f.record.source.sourceRevision = f.sourceRevision; f.dispatch.contentRevision = f.sourceRevision; f.dispatch.launchRevision = f.sourceRevision;
    f.reviewFiles = reviews(f);
    for (const [name, bytes] of f.reviewFiles) if (name.startsWith("releases/")) await f.write(`docs/agent-data/${name}`, bytes);
    f.deploymentRevision = f.commit("Synthetic record D for invalid link source");
    await expect(f.check()).rejects.toHaveProperty("code", "DEPLOYMENT_SOURCE_FILE_REFERENCE");
  });
});
