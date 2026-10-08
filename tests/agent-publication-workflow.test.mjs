import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { parse } from "yaml";
import { comparePublicationControls, parsePublicationWorkflowArgs, publicationDispatchSchema, publicationLaunch,
  publicationRequestedRuns, publicationReviewFiles, publicationWorkflowPath, readPublicationGitControls,
  resolvePublicationPlatform, runPublicationWorkflow } from "../scripts/agent-publication-workflow.mjs";
import { releaseFreezeReviewSchema } from "../scripts/freeze-agent-release.mjs";
import { checkPublicCiJson } from "../scripts/check-agent-ci-archive.mjs";
import { ciEvidenceFixture } from "./helpers/agent-ci-fixture.mjs";
import { serialize, sha256 } from "../scripts/agent-utils.mjs";

// Platform responses, successful records and storage references below are explicit fixtures.
// No positive test runs Actions, the official CLI, Blob or a release/deployment entry point.
const json = value => Buffer.from(serialize(value));
const ref = (path, bytes) => ({ path, bytes: bytes.length, sha256: sha256(bytes) });
let parent, fixture, record, recordBytes;
beforeAll(async () => {
  parent = await mkdtemp(path.join(tmpdir(), "zeron-publication-workflow-"));
  fixture = await ciEvidenceFixture(path.join(parent, "fixture"));
  const name = (await readdir(path.join(parent, "fixture"))).find(name => /^[a-f0-9]{64}\.json$/.test(name));
  recordBytes = await readFile(path.join(parent, "fixture", name)); record = JSON.parse(recordBytes);
}, 20000);
afterAll(async () => { await rm(parent, { recursive: true, force: true }); });

const controls = () => new Map(["package.json", "pnpm-lock.yaml", "vercel.json", "docs/agent-data/ci-trust.json", "docs/agent-data/installation-config.json",
  "docs/agent-data/ci-archive-storage.json", ".github/workflows/agent-release-validation.yml", publicationWorkflowPath,
  "scripts/release.mjs", "lib/contracts.ts", "packages/registry/scripts/build.mjs"].map(name => [name, name === "vercel.json"
    ? json({ $schema: "https://openapi.vercel.sh/vercel.json", git: { deploymentEnabled: { main: false } } })
    : Buffer.from(`synthetic control ${name}\n`)]));
function scenario(revision = record.source.sourceRevision) {
  const metadata = new Map([...fixture.metadata].map(([key, value]) => [key, structuredClone(value)])), requests = [];
  const { base } = fixture, source = record.source.sourceRevision;
  metadata.get(`${base}/branches/main`).commit.sha = revision;
  metadata.set(`${base}/compare/${revision}...${revision}`, { status: "identical", merge_base_commit: { sha: revision } });
  metadata.set(`${base}/contents/${fixture.context.policy.workflowPath}?ref=${revision}`,
    structuredClone(metadata.get(`${base}/contents/${fixture.context.policy.workflowPath}?ref=${source}`)));
  metadata.get(`${base}/actions/runs/101/attempts/2`).updated_at = "2020-01-01T00:03:00Z";
  metadata.set(`${base}/actions/workflows/agent-release-publication.yml`, { id: 14, name: "Agent release publication", path: publicationWorkflowPath, state: "active" });
  metadata.set(`${base}/actions/runs/401/attempts/1`, { id: 401, run_attempt: 1, workflow_id: 14, name: "Agent release publication", path: publicationWorkflowPath,
    head_sha: revision, head_branch: "main", event: "workflow_dispatch", status: "in_progress", conclusion: null, run_started_at: "2020-01-01T00:04:00Z",
    repository: { id: 17, full_name: fixture.context.policy.repository }, head_repository: { id: 17, full_name: fixture.context.policy.repository } });
  const fetcher = async (url, init) => {
    requests.push({ url, init }); const parsed = new URL(url);
    if (parsed.origin !== "https://api.github.com") throw new Error("resolver must never download public bytes or ZIPs");
    const value = metadata.get(parsed.pathname + parsed.search);
    return value === undefined ? new Response(null, { status: 404 }) : Response.json(value);
  };
  return { metadata, requests, fetcher, context: { policy: fixture.context.policy, sourceFiles: fixture.context.sourceFiles,
    launch: { revision, runId: 401, runAttempt: 1 }, requested: { consumer: { runId: 101, runAttempt: 2 }, examples: { runId: 101, runAttempt: 2 } } } };
}
const resolve = s => resolvePublicationPlatform(s.context, { fetcher: s.fetcher, attempts: 1, token: "fixture-ci-read-identity" });
const dispatch = () => publicationDispatchSchema.parse({ schemaVersion: 1, kind: "agent-publication-dispatch",
  scope: "resolved-platform-identities-not-ci-byte-verification", launchRevision: "b".repeat(40), contentRevision: record.source.sourceRevision,
  launchRunId: 401, launchRunAttempt: 1, registryReleaseId: record.registry.releaseId, predecessor: "none", locator: fixture.context.locator,
  controls: comparePublicationControls(controls(), controls()) });
function reviewMaterial() {
  const selectionBytes = json({ schemaVersion: 1, current: ref(`${record.catalog.version}.json`, recordBytes) });
  const review = releaseFreezeReviewSchema.parse({ schemaVersion: 1, kind: "agent-release-freeze", status: "draft-verified-not-approved-or-deployed",
    scope: "fresh-source-ci-public-stages-and-durable-handoff-checked", source: record.source, catalogVersion: record.catalog.version,
    record: ref(`${record.catalog.version}.json`, recordBytes), selection: ref("current.json", selectionBytes), predecessor: null,
    candidateReviewSha256: "1".repeat(64), ciReceiptSha256: "2".repeat(64),
    ciArchive: { url: `https://fixture.private.blob.vercel-storage.com/ci/releases/${record.catalog.version}/${"3".repeat(64)}/index.json`, bytes: 100, sha256: "4".repeat(64) },
    storage: { schemaVersion: 1, provider: "vercel-blob", access: "private", origin: "https://fixture.private.blob.vercel-storage.com", retention: "approved-releases-no-automatic-deletion" },
    restoration: { schemaVersion: 1, scope: "verified-frozen-record-restoration-not-deployment", status: "passed", catalogVersion: record.catalog.version,
      versions: [record.catalog.version], downloadedBytes: 123, files: 10, runtimeBytes: 100 } });
  return { review, selectionBytes };
}

describe("publication identity resolution uses completed independent validation", () => {
  it.each(["a", "b"])("derives exact role IDs without ZIP requests when P=%s", async label => {
    const s = scenario(label.repeat(40)), result = await resolve(s);
    expect(result.contentRevision).toBe(record.source.sourceRevision); expect(result.locator).toEqual(fixture.context.locator);
    expect(result.metadata).toBeInstanceOf(Map);
    expect(s.requests.every(request => !request.url.endsWith("/zip"))).toBe(true);
    expect(s.requests.filter(request => request.url.includes("/actions/runs/401/")).map(request => request.url)).toEqual([
      `https://api.github.com${fixture.base}/actions/runs/401/attempts/1`]);
  });
  it("rejects missing/extra role input and self references before any HTTP", async () => {
    for (const requested of [null, {}, { consumer: { runId: 101, runAttempt: 2 } }, { ...scenario().context.requested, other: { runId: 3, runAttempt: 1 } },
      { consumer: { runId: 401, runAttempt: 1 }, examples: { runId: 101, runAttempt: 2 } }]) {
      const s = scenario(); s.context.requested = requested;
      await expect(resolve(s)).rejects.toHaveProperty("code", "PUBLICATION_RUN_INPUT"); expect(s.requests).toEqual([]);
    }
  });
  it.each([
    ["wrong current attempt", s => { s.metadata.get(`${fixture.base}/actions/runs/401/attempts/1`).run_attempt = 2; }, "PUBLICATION_LAUNCH_IDENTITY"],
    ["completed current run", s => { s.metadata.get(`${fixture.base}/actions/runs/401/attempts/1`).status = "completed"; }, "PUBLICATION_LAUNCH_IDENTITY"],
    ["fork publication", s => { s.metadata.get(`${fixture.base}/actions/runs/401/attempts/1`).head_repository.id = 18; }, "PUBLICATION_LAUNCH_IDENTITY"],
    ["foreign publication workflow", s => { s.metadata.get(`${fixture.base}/actions/workflows/agent-release-publication.yml`).path = "other.yml"; }, "PUBLICATION_WORKFLOW_IDENTITY"],
    ["unfinished validation", s => { s.metadata.get(`${fixture.base}/actions/runs/101/attempts/2`).status = "in_progress"; }, "CI_RUN_CONTRACT"],
    ["failed validation", s => { s.metadata.get(`${fixture.base}/actions/runs/101/attempts/2`).conclusion = "failure"; }, "CI_RUN_CONTRACT"],
    ["wrong validation attempt", s => { s.metadata.get(`${fixture.base}/actions/runs/101/attempts/2`).run_attempt = 3; }, "CI_RUN_IDENTITY"],
    ["different validation source", s => { s.metadata.get(`${fixture.base}/actions/runs/101/attempts/2`).head_sha = "c".repeat(40); }, "CI_JOB_IDENTITY"],
    ["late validation", s => { s.metadata.get(`${fixture.base}/actions/runs/101/attempts/2`).updated_at = "2020-01-01T00:05:00Z"; }, "PUBLICATION_VALIDATION_NOT_PRIOR"],
    ["skipped execution", s => { s.metadata.get(`${fixture.base}/actions/runs/101/attempts/2/jobs?per_page=100&page=1`).jobs[0].steps[0].conclusion = "skipped"; }, "CI_REQUIRED_STEP"],
    ["duplicate job", s => { const page = s.metadata.get(`${fixture.base}/actions/runs/101/attempts/2/jobs?per_page=100&page=1`); page.jobs.push(structuredClone(page.jobs[0])); page.total_count++; }, "PUBLICATION_ROLE_AMBIGUOUS"],
    ["duplicate archive", s => { const page = s.metadata.get(`${fixture.base}/actions/runs/101/artifacts?per_page=100&page=1`); page.artifacts.push(structuredClone(page.artifacts[0])); page.total_count++; }, "PUBLICATION_ROLE_AMBIGUOUS"],
    ["expired archive", s => { s.metadata.get(`${fixture.base}/actions/artifacts/301`).expired = true; }, "CI_ARTIFACT_CONTRACT"],
  ])("rejects %s before publication", async (_name, mutate, code) => {
    const s = scenario(); mutate(s); await expect(resolve(s)).rejects.toHaveProperty("code", code);
    expect(s.requests.every(request => !request.url.endsWith("/zip"))).toBe(true);
  });
  it("does not accept missing protection-read permission", async () => {
    const s = scenario(), fetcher = s.fetcher;
    s.fetcher = (url, init) => url.endsWith("/protection") ? new Response(null, { status: 403 }) : fetcher(url, init);
    await expect(resolve(s)).rejects.toHaveProperty("code", "CI_HTTP_403");
  });
  it("rejects sources mixed between independent validation runs", async () => {
    const s = scenario(), { base } = fixture;
    s.context.requested.examples.runId = 102;
    s.metadata.set(`${base}/actions/runs/102/attempts/2`, { ...structuredClone(s.metadata.get(`${base}/actions/runs/101/attempts/2`)), id: 102, head_sha: "c".repeat(40) });
    await expect(resolve(s)).rejects.toHaveProperty("code", "PUBLICATION_CONTENT_SOURCE");
  });
});

describe("strict publication controls and checked public draft", () => {
  it("binds all control files by raw bytes in stable order", () => {
    const result = comparePublicationControls(controls(), new Map([...controls()].reverse()));
    expect(result.map(file => file.path)).toEqual([...controls().keys()].sort());
    expect(result.find(file => file.path === "lib/contracts.ts").sha256).toBe(sha256(controls().get("lib/contracts.ts")));
    expect(publicationDispatchSchema.parse(dispatch())).toEqual(dispatch());
  });
  it("reads actual isolated Git trees, enforces ancestry and compares the complete control closure", async () => {
    const repositoryRoot = path.join(parent, "git-controls"); await mkdir(repositoryRoot);
    const git = args => execFileSync("git", args, { cwd: repositoryRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
    git(["init", "--quiet"]); git(["config", "user.name", "Explicit contract fixture"]); git(["config", "user.email", "fixture@example.invalid"]);
    const write = async (name, bytes) => { const target = path.join(repositoryRoot, name); await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, bytes); };
    for (const [name, bytes] of controls()) await write(name, bytes);
    const commit = message => { git(["add", "."]); git(["-c", "commit.gpgsign=false", "commit", "--quiet", "-m", message]); return git(["rev-parse", "HEAD"]); };
    const source = commit("Synthetic control fixture S");
    expect(readPublicationGitControls(source, source, { repositoryRoot })).toEqual(comparePublicationControls(controls(), controls()));
    await write("docs/notes.md", "unrelated launch metadata\n"); const launch = commit("Synthetic P with identical controls");
    expect(readPublicationGitControls(source, launch, { repositoryRoot })).toEqual(readPublicationGitControls(source, source, { repositoryRoot }));
    expect(() => readPublicationGitControls(launch, source, { repositoryRoot })).toThrow("PUBLICATION_CONTENT_ANCESTRY");
    await write("lib/contracts.ts", "changed control\n"); const changed = commit("Changed library control");
    expect(() => readPublicationGitControls(source, changed, { repositoryRoot })).toThrow("PUBLICATION_CONTROL_BYTES");
    await write("lib/contracts.ts", controls().get("lib/contracts.ts")); await write("packages/registry/scripts/new.mjs", "new control\n");
    const added = commit("Added dependency control");
    expect(() => readPublicationGitControls(source, added, { repositoryRoot })).toThrow("PUBLICATION_CONTROL_FILE_SET");
    await rm(path.join(repositoryRoot, "packages/registry/scripts/new.mjs"));
    await rm(path.join(repositoryRoot, "scripts/release.mjs")); await symlink("../docs/notes.md", path.join(repositoryRoot, "scripts/release.mjs"));
    const linked = commit("Linked control is not a regular blob");
    expect(() => readPublicationGitControls(source, linked, { repositoryRoot })).toThrow("PUBLICATION_CONTROL_FILE_TYPE");
  }, 15000);
  it("rejects changed, missing, additional, non-buffer and unsafe controls", () => {
    for (const change of [map => map.set("scripts/release.mjs", Buffer.from("changed")), map => map.delete("lib/contracts.ts"),
      map => map.set("scripts/new.mjs", Buffer.from("new")), map => map.set("scripts/release.mjs", "not bytes")]) {
      const next = controls(); change(next); expect(() => comparePublicationControls(controls(), next)).toThrow(/PUBLICATION_CONTROL/);
    }
    const unsafe = controls(); unsafe.set("scripts/../escape", Buffer.from("bad"));
    expect(() => comparePublicationControls(unsafe, unsafe)).toThrow("PUBLICATION_CONTROL_BYTES");
    const missing = controls(); missing.delete("pnpm-lock.yaml"); expect(() => comparePublicationControls(missing, missing)).toThrow("PUBLICATION_CONTROL_FILE_SET");
  });
  it.each(["changed", "deleted", "linked"])("rejects %s Vercel deployment control between actual S and P Git trees", async change => {
    const repositoryRoot = await mkdtemp(path.join(parent, "vercel-control-"));
    const git = args => execFileSync("git", args, { cwd: repositoryRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
    git(["init", "--quiet"]); git(["config", "user.name", "Explicit Vercel control fixture"]); git(["config", "user.email", "fixture@example.invalid"]);
    for (const [name, bytes] of controls()) {
      const target = path.join(repositoryRoot, name); await mkdir(path.dirname(target), { recursive: true }); await writeFile(target, bytes);
    }
    const commit = message => { git(["add", "."]); git(["-c", "commit.gpgsign=false", "commit", "--quiet", "-m", message]); return git(["rev-parse", "HEAD"]); };
    const source = commit("Synthetic S with main deployment disabled");
    const initial = readPublicationGitControls(source, source, { repositoryRoot });
    expect(initial.find(file => file.path === "vercel.json").sha256).toBe(sha256(controls().get("vercel.json")));
    const config = path.join(repositoryRoot, "vercel.json");
    if (change === "changed") await writeFile(config, json({ git: { deploymentEnabled: { main: true } } }));
    else { await rm(config); if (change === "linked") await symlink("package.json", config); }
    const launch = commit("Synthetic P changes deployment controls");
    const code = change === "changed" ? "PUBLICATION_CONTROL_BYTES" : change === "deleted" ? "PUBLICATION_CONTROL_FILE_SET" : "PUBLICATION_CONTROL_FILE_TYPE";
    expect(() => readPublicationGitControls(source, launch, { repositoryRoot })).toThrow(code);
  });
  it("requires Vercel controls in both compared sources and dispatch descriptors", () => {
    const files = controls(); files.delete("vercel.json");
    expect(() => comparePublicationControls(files, files)).toThrow("PUBLICATION_CONTROL_FILE_SET");
    const value = dispatch(); value.controls = value.controls.filter(file => file.path !== "vercel.json");
    expect(publicationDispatchSchema.safeParse(value).success).toBe(false);
  });
  it("rejects changed descriptor ordering, file set, total budget and current run", () => {
    for (const mutate of [value => value.controls.reverse(), value => value.controls = value.controls.filter(file => file.path !== "pnpm-lock.yaml"), value => value.controls[0].bytes = 32 * 1024 * 1024,
      value => value.locator.consumer.runId = value.launchRunId, value => value.controls.push(value.controls[0]), value => value.passed = true]) {
      const value = dispatch(); mutate(value); expect(publicationDispatchSchema.safeParse(value).success).toBe(false);
    }
    expect(() => readPublicationGitControls("main", "b".repeat(40))).toThrow("PUBLICATION_GIT_REVISION");
    expect(() => readPublicationGitControls("0".repeat(40), "1".repeat(40))).toThrow("PUBLICATION_CONTENT_ANCESTRY");
  });
  it("copies exactly four canonical public review files with no raw CI bytes", () => {
    const { review, selectionBytes } = reviewMaterial(), files = publicationReviewFiles(dispatch(), json(review), recordBytes, selectionBytes);
    expect([...files.keys()]).toEqual(["publication-dispatch.json", "freeze-review.json", `releases/${record.catalog.version}.json`, "releases/current.json"]);
    expect(files.get(`releases/${record.catalog.version}.json`)).toEqual(recordBytes);
    expect(JSON.parse(files.get("freeze-review.json")).status).toBe("draft-verified-not-approved-or-deployed");
  });
  it("preserves explicit approved history without confusing it with the application selection", () => {
    const prior = ref(`${"5".repeat(64)}.json`, Buffer.from("synthetic previous record descriptor\n"));
    const currentRecord = { ...record, history: [prior] }, bytes = json(currentRecord);
    const selectionBytes = json({ schemaVersion: 1, current: ref(`${record.catalog.version}.json`, bytes) });
    const { review } = reviewMaterial(); review.record = ref(`${record.catalog.version}.json`, bytes); review.selection = ref("current.json", selectionBytes);
    review.predecessor = { approved: prior, applicationSelection: { ...prior, path: `${"6".repeat(64)}.json` } };
    review.restoration.versions.push("5".repeat(64)); const target = dispatch(); target.predecessor = prior.path;
    expect(publicationReviewFiles(target, json(review), bytes, selectionBytes).get(`releases/${record.catalog.version}.json`)).toEqual(bytes);
    review.predecessor.approved.sha256 = "7".repeat(64);
    expect(() => publicationReviewFiles(target, json(review), bytes, selectionBytes)).toThrow("PUBLICATION_REVIEW_BINDING");
    review.predecessor = null; target.predecessor = "none";
    expect(() => publicationReviewFiles(target, json(review), bytes, selectionBytes)).toThrow("PUBLICATION_REVIEW_BINDING");
  });
  it.each(["source", "record-hash", "selection-hash", "registry", "predecessor", "restored-history", "extra-field", "noncanonical"])("rejects %s in a review handoff", kind => {
    const { review, selectionBytes } = reviewMaterial(), target = dispatch(); let bytes;
    if (kind === "source") target.contentRevision = "c".repeat(40);
    if (kind === "record-hash") review.record.sha256 = "5".repeat(64);
    if (kind === "selection-hash") review.selection.sha256 = "5".repeat(64);
    if (kind === "registry") target.registryReleaseId = "other-registry";
    if (kind === "predecessor") target.predecessor = `${"5".repeat(64)}.json`;
    if (kind === "restored-history") review.restoration.versions.push("5".repeat(64));
    if (kind === "extra-field") review.passed = true;
    bytes = kind === "noncanonical" ? Buffer.from(JSON.stringify(review)) : json(review);
    expect(() => publicationReviewFiles(target, bytes, recordBytes, selectionBytes)).toThrow(/PUBLICATION_(?:REVIEW_BINDING|INPUT_CONTRACT|INPUT_CANONICAL)/);
  });
  it("rejects foreign, signed and newline private index URLs, not just valid-looking hashes", () => {
    const { review } = reviewMaterial();
    for (const url of [review.ciArchive.url + "?token=fixture", review.ciArchive.url + "\n", review.ciArchive.url.replace("fixture.private", "other.private"),
      review.ciArchive.url.replace(record.catalog.version, "5".repeat(64)), review.ciArchive.url.replace("index.json", "other.json")]) {
      expect(releaseFreezeReviewSchema.safeParse({ ...review, ciArchive: { ...review.ciArchive, url } }).success).toBe(false);
    }
  });
  it("checks known credential bytes and preserves the existing JSON budget for archive callers", () => {
    const { review, selectionBytes } = reviewMaterial();
    expect(() => publicationReviewFiles(dispatch(), json(review), recordBytes, selectionBytes, [record.catalog.version])).toThrow("CI_ARCHIVE_CREDENTIAL_CONTENT");
    expect(() => checkPublicCiJson(json({ url: "https://host.invalid/file?sig=opaque" }))).toThrow("CI_ARCHIVE_CREDENTIAL_CONTENT");
    const large = json({ text: "x".repeat(2 * 1024 * 1024) });
    expect(() => checkPublicCiJson(large)).toThrow("CI_ARCHIVE_BYTE_BUDGET");
    expect(checkPublicCiJson(large, [], 32 * 1024 * 1024).text.length).toBe(2 * 1024 * 1024);
  });
});

describe("closed publication workflow runtime and YAML", () => {
  it("accepts only exact mode flags, positive environment IDs and fixed launch identity", () => {
    const output = path.join(parent, "args");
    expect(parsePublicationWorkflowArgs(["resolve", "--output", output])).toEqual({ mode: "resolve", output });
    expect(parsePublicationWorkflowArgs(["prepare", "--output", output, "--dispatch", "input.json"]).dispatch).toBe(path.resolve("input.json"));
    expect(parsePublicationWorkflowArgs(["stage", "--output", output, "--dispatch", "input.json", "--freeze", "freeze"]).freeze).toBe(path.resolve("freeze"));
    for (const args of [["resolve"], ["resolve", "--output", output, "--skip", "yes"], ["prepare", "--output", output],
      ["stage", "--output", output, "--dispatch", "input.json"], ["resolve", "--output", "dir\nevil"], ["resolve", "--output", output, "--output", output]]) {
      expect(() => parsePublicationWorkflowArgs(args)).toThrow("PUBLICATION_ARGUMENTS");
    }
    const env = { GITHUB_ACTIONS: "true", GITHUB_EVENT_NAME: "workflow_dispatch", GITHUB_REPOSITORY: "Carlosfengv/zeron-ui", GITHUB_REF: "refs/heads/main",
      GITHUB_WORKFLOW_REF: `Carlosfengv/zeron-ui/${publicationWorkflowPath}@refs/heads/main`, GITHUB_SHA: "a".repeat(40), GITHUB_WORKFLOW_SHA: "a".repeat(40), GITHUB_RUN_ID: "401", GITHUB_RUN_ATTEMPT: "1" };
    expect(publicationLaunch(env)).toEqual({ revision: "a".repeat(40), runId: 401, runAttempt: 1 });
    for (const patch of [{ GITHUB_REF: "refs/heads/other" }, { GITHUB_EVENT_NAME: "pull_request" }, { GITHUB_WORKFLOW_SHA: "b".repeat(40) }, { GITHUB_RUN_ID: "01" }]) {
      expect(() => publicationLaunch({ ...env, ...patch })).toThrow(/PUBLICATION_(?:WORKFLOW_CONTEXT|INTEGER_INPUT)/);
    }
    const requestedEnv = { PUBLICATION_CONSUMER_RUN_ID: "101", PUBLICATION_CONSUMER_RUN_ATTEMPT: "2", PUBLICATION_EXAMPLES_RUN_ID: "101", PUBLICATION_EXAMPLES_RUN_ATTEMPT: "2" };
    expect(publicationRequestedRuns(requestedEnv).consumer.runId).toBe(101);
    for (const value of ["1;evil", "0", "-1", "01", "1\n", "9007199254740992", ""]) {
      expect(() => publicationRequestedRuns({ ...requestedEnv, PUBLICATION_CONSUMER_RUN_ID: value })).toThrow("PUBLICATION_INTEGER_INPUT");
    }
  });
  it("actually refuses uncontrolled runtime/source/workflow context before network and leaves only safe failure", async () => {
    const fetcher = vi.spyOn(globalThis, "fetch").mockImplementation(async () => { throw new Error("must never reach HTTP"); });
    vi.stubEnv("GITHUB_ACTIONS", "false"); const output = path.join(parent, "closed-refusal");
    try {
      const allowedRefusals = process.platform === "linux" && Number(process.versions.node.split(".")[0]) === 22
        ? ["DIRTY_SOURCE", "PUBLICATION_WORKFLOW_CONTEXT"] : ["PUBLICATION_RUNTIME"];
      await expect(runPublicationWorkflow(["resolve", "--output", output])).rejects.toHaveProperty("code", expect.toBeOneOf(allowedRefusals));
      expect(fetcher).not.toHaveBeenCalled(); expect(await readdir(output)).toEqual(["failure.json"]);
      const failure = JSON.parse(await readFile(path.join(output, "failure.json"))); expect(failure.status).toBe("failed");
      expect(serialize(failure)).not.toMatch(/https:|TOKEN|secret|passed/);
      await expect(runPublicationWorkflow(["resolve", "--output", output])).rejects.toHaveProperty("code", "EEXIST");
    } finally { fetcher.mockRestore(); vi.unstubAllEnvs(); }
  });
  it("the real subprocess terminates on refusal without producing descriptors or release records", async () => {
    const output = path.join(parent, "subprocess-refusal"); let result;
    try { execFileSync(process.execPath, ["scripts/agent-publication-workflow.mjs", "resolve", "--output", output],
      { encoding: "utf8", timeout: 15000, stdio: "pipe", env: { ...process.env, GITHUB_ACTIONS: "false" } }); }
    catch (error) { result = error; }
    expect(result.status).toBe(1); expect(result.signal).toBeNull(); expect(result.stderr).toMatch(/PUBLICATION_RUNTIME|DIRTY_SOURCE|PUBLICATION_WORKFLOW_CONTEXT/);
    expect(await readdir(output)).toEqual(["failure.json"]);
  });
  it("pins exact control jobs, source checkouts, transport and independent step order", async () => {
    const wf = parse(await readFile(publicationWorkflowPath, "utf8"));
    expect(wf.name).toBe("Agent release publication"); expect(Object.keys(wf.on)).toEqual(["workflow_dispatch"]);
    expect(Object.keys(wf.on.workflow_dispatch.inputs)).toEqual(["consumer_run_id", "consumer_run_attempt", "examples_run_id", "examples_run_attempt", "registry_release_id", "predecessor"]);
    expect(wf.permissions).toEqual({ contents: "read", actions: "read" }); expect(wf.concurrency).toEqual({ group: "agent-release-publication", "cancel-in-progress": false });
    for (const job of Object.values(wf.jobs)) {
      expect(job.if).toBe("github.repository == 'Carlosfengv/zeron-ui' && github.ref == 'refs/heads/main'");
      expect(job.environment).toBe("agent-artifact-publication"); expect(job["runs-on"]).toBe("ubuntu-24.04");
      for (const step of job.steps.filter(step => step.uses)) expect(step.uses).toMatch(/^[\w-]+\/[\w-]+@[a-f0-9]{40}$/);
      const checkout = job.steps.find(step => step.uses?.startsWith("actions/checkout@"));
      expect(checkout.with["fetch-depth"]).toBe(0); expect(checkout.with["persist-credentials"]).toBe(false);
      expect(job.steps.find(step => step.uses?.startsWith("actions/setup-node@")).with["node-version"]).toBe(22);
      expect(job.steps.find(step => step.uses?.startsWith("pnpm/action-setup@")).with.version).toBe("10.12.4");
      expect(job.steps.some(step => step.run?.includes("npm install --global npm@10.9.2\npnpm install --frozen-lockfile"))).toBe(true);
      expect(job.steps.some(step => /\$\{\{\s*inputs\./.test(step.run ?? ""))).toBe(false);
      expect(job.steps.some(step => /(?:git (?:push|commit)|vercel deploy|--skip|import-pass|eval )/.test(step.run ?? ""))).toBe(false);
    }
    expect(wf.jobs.resolve.steps[0].with.ref).toBe("${{ github.sha }}");
    expect(wf.jobs.publish.steps[0].with.ref).toBe("${{ needs.resolve.outputs.source-revision }}"); expect(wf.jobs.publish.needs).toBe("resolve");
    const download = wf.jobs.publish.steps.find(step => step.uses?.startsWith("actions/download-artifact@"));
    expect(download.with["artifact-ids"]).toBe("${{ needs.resolve.outputs.dispatch-artifact-id }}"); expect(download.with.name).toBeUndefined();
    const runs = wf.jobs.publish.steps.filter(step => step.run).map(step => step.run).join("\n"); let position = -1;
    for (const name of ["PUBLICATION_DISPATCH_TRANSPORT_BYTES", "agent-publication-workflow.mjs prepare", "pnpm agents:ci:check", "pnpm agents:catalog:release",
      "pnpm agents:publish", "pnpm agents:release:freeze", "agent-publication-workflow.mjs stage"]) {
      const next = runs.indexOf(name); expect(next).toBeGreaterThan(position); position = next;
    }
  });
  it("limits identity injection and the final public artifact to the checked review set", async () => {
    const wf = parse(await readFile(publicationWorkflowPath, "utf8"));
    expect(wf.jobs.resolve.steps.some(step => Object.keys(step.env ?? {}).some(name => name.includes("BLOB")))).toBe(false);
    const steps = wf.jobs.publish.steps;
    expect(steps.filter(step => step.env?.BLOB_READ_WRITE_TOKEN).map(step => step.name)).toEqual([
      "Publish Catalog after fresh source CI and predecessor checks", "Check and copy only the fixed public review files"]);
    expect(steps.filter(step => step.env?.AGENT_CI_ARCHIVE_BLOB_TOKEN).map(step => step.name)).toEqual([
      "Freeze published stages and retain original CI archives privately", "Check and copy only the fixed public review files"]);
    const upload = steps.at(-1); expect(upload.if).toBe("success() && steps.public-review.outcome == 'success'");
    expect(upload.with.path).toBe("${{ runner.temp }}/agent-publication-public-review"); expect(upload.with["include-hidden-files"]).toBe(false);
    expect(upload.with["retention-days"]).toBe(90); expect(upload.with["if-no-files-found"]).toBe("error");
  });
});
