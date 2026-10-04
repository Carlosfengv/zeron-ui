import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createHash } from "node:crypto";
import { mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { zipSync } from "fflate";
import { readCompletedPublicationReview } from "../scripts/agent-publication-review.mjs";
import { comparePublicationControls, publicationWorkflowPath } from "../scripts/agent-publication-workflow.mjs";
import { ciEvidenceFixture } from "./helpers/agent-ci-fixture.mjs";
import { serialize, sha256 } from "../scripts/agent-utils.mjs";

// Every platform response, resource, successful run and review below is synthetic.
// This suite performs no GitHub, Blob, actual approval, build, install or deployment.
const json = value => Buffer.from(serialize(value));
const descriptor = (path, bytes) => ({ path, bytes: bytes.length, sha256: sha256(bytes) });
let parent, fixture, record, workflowBytes;
beforeAll(async () => {
  parent = await mkdtemp(path.join(tmpdir(), "zeron-publication-review-"));
  fixture = await ciEvidenceFixture(parent); workflowBytes = await readFile(publicationWorkflowPath);
  const name = (await readdir(parent)).find(name => /^[a-f0-9]{64}\.json$/.test(name)); record = JSON.parse(await readFile(path.join(parent, name)));
}, 20000);
afterAll(async () => { await rm(parent, { recursive: true, force: true }); });
const stamp = seconds => new Date(Date.UTC(2020, 0, 1, 0, 0, seconds)).toISOString();
const content = (path, bytes) => ({ type: "file", path, encoding: "base64", size: bytes.length, content: bytes.toString("base64"),
  sha: createHash("sha1").update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes])).digest("hex") });
const resolverSteps = ["Resolve completed validation source and compare release controls", "Upload checked publication dispatch"];
const publisherSteps = ["Prepare exact content source and public installation input", "Reverify completed CI archives and public evidence",
  "Build Catalog candidate from verified source and reports", "Publish Catalog after fresh source CI and predecessor checks",
  "Freeze published stages and retain original CI archives privately", "Check and copy only the fixed public review files", "Upload checked freeze draft for review"];
function scenario(launch = record.source.sourceRevision) {
  const { base } = fixture, source = record.source.sourceRevision, metadata = new Map([...fixture.metadata].map(([key, value]) => [key, structuredClone(value)]));
  const controls = new Map(["package.json", "pnpm-lock.yaml", "vercel.json", "docs/agent-data/installation-config.json", "docs/agent-data/ci-archive-storage.json", "scripts/release.mjs"]
    .map(name => [name, Buffer.from(`explicit synthetic control ${name}\n`)]));
  controls.set("docs/agent-data/ci-trust.json", json(fixture.context.policy));
  controls.set(fixture.context.policy.workflowPath, fixture.context.sourceFiles.get(fixture.context.policy.workflowPath)); controls.set(publicationWorkflowPath, workflowBytes);
  metadata.get(`${base}/branches/main`).commit.sha = launch;
  metadata.set(`${base}/compare/${launch}...${launch}`, { status: "identical", merge_base_commit: { sha: launch } });
  metadata.set(`${base}/compare/${source}...${launch}`, { status: source === launch ? "identical" : "ahead", merge_base_commit: { sha: source } });
  metadata.set(`${base}/contents/${fixture.context.policy.workflowPath}?ref=${launch}`, content(fixture.context.policy.workflowPath, controls.get(fixture.context.policy.workflowPath)));
  metadata.set(`${base}/contents/${publicationWorkflowPath}?ref=${launch}`, content(publicationWorkflowPath, workflowBytes));
  metadata.set(`${base}/actions/workflows/agent-release-publication.yml`, { id: 14, name: "Agent release publication", path: publicationWorkflowPath, state: "active" });
  metadata.get(`${base}/actions/runs/101/attempts/2`).updated_at = stamp(121);
  const run = { id: 401, run_attempt: 1, workflow_id: 14, name: "Agent release publication", path: `${publicationWorkflowPath}@main`,
    head_sha: launch, head_branch: "main", event: "workflow_dispatch", status: "completed", conclusion: "success", run_started_at: stamp(300), updated_at: stamp(600),
    repository: { id: 17, full_name: fixture.context.policy.repository }, head_repository: { id: 17, full_name: fixture.context.policy.repository } };
  metadata.set(`${base}/actions/runs/401/attempts/1`, run);
  const job = (id, name, start, end, steps) => ({ id, run_id: 401, head_sha: launch, head_branch: "main", workflow_name: run.name, name,
    status: "completed", conclusion: "success", started_at: stamp(start), completed_at: stamp(end), labels: ["ubuntu-24.04"],
    steps: steps.map((name, index) => ({ name, number: index + 2, status: "completed", conclusion: "success",
      started_at: stamp(start + index * 20), completed_at: stamp(start + (index + 1) * 20) })) });
  const jobs = [job(601, "Resolve completed validation and release controls", 300, 360, resolverSteps),
    job(602, "Verify and publish Catalog with durable freeze draft", 360, 600, publisherSteps)];
  metadata.set(`${base}/actions/runs/401/attempts/1/jobs?per_page=100&page=1`, { total_count: 2, jobs });
  const artifact = { id: 501, name: "agent-publication-review-401-1", expired: false, created_at: stamp(485), updated_at: stamp(495), expires_at: "2099-01-01T00:00:00Z",
    workflow_run: { id: 401, repository_id: 17, head_repository_id: 17, head_branch: "main", head_sha: launch } };
  metadata.set(`${base}/actions/artifacts/501`, artifact);
  metadata.set(`${base}/actions/runs/401/artifacts?per_page=100&page=1`, { total_count: 1, artifacts: [artifact] });
  const dispatch = { schemaVersion: 1, kind: "agent-publication-dispatch", scope: "resolved-platform-identities-not-ci-byte-verification",
    launchRevision: launch, contentRevision: source, launchRunId: 401, launchRunAttempt: 1, registryReleaseId: record.registry.releaseId,
    predecessor: "none", locator: fixture.context.locator, controls: comparePublicationControls(controls, controls) };
  const s = { base, metadata, run, jobs, artifact, dispatch, record: structuredClone(record), requests: [], controls,
    input: { source: record.source, publication: { runId: 401, runAttempt: 1 }, controls } };
  s.material = () => {
    const bytes = json(s.record), selection = json({ schemaVersion: 1, current: descriptor(`${s.record.catalog.version}.json`, bytes) });
    const freeze = { schemaVersion: 1, kind: "agent-release-freeze", status: "draft-verified-not-approved-or-deployed",
      scope: "fresh-source-ci-public-stages-and-durable-handoff-checked", source: s.record.source, catalogVersion: s.record.catalog.version,
      record: descriptor(`${s.record.catalog.version}.json`, bytes), selection: descriptor("current.json", selection), predecessor: null,
      candidateReviewSha256: "1".repeat(64), ciReceiptSha256: "2".repeat(64),
      ciArchive: { url: `https://fixture.private.blob.vercel-storage.com/ci/releases/${s.record.catalog.version}/${"3".repeat(64)}/index.json`, bytes: 100, sha256: "4".repeat(64) },
      storage: { schemaVersion: 1, provider: "vercel-blob", access: "private", origin: "https://fixture.private.blob.vercel-storage.com", retention: "approved-releases-no-automatic-deletion" },
      restoration: { schemaVersion: 1, scope: "verified-frozen-record-restoration-not-deployment", status: "passed", catalogVersion: s.record.catalog.version,
        versions: [s.record.catalog.version], downloadedBytes: 123, files: 10, runtimeBytes: 100 } };
    return new Map([["publication-dispatch.json", json(s.dispatch)], ["freeze-review.json", json(freeze)], [`releases/${s.record.catalog.version}.json`, bytes], ["releases/current.json", selection]]);
  };
  s.files = s.material();
  s.refresh = () => { s.archive = Buffer.from(zipSync(Object.fromEntries(s.files))); artifact.size_in_bytes = s.archive.length; artifact.digest = `sha256:${sha256(s.archive)}`; };
  s.refresh();
  s.fetcher = async (url, init) => {
    s.requests.push({ url, init });
    if (url === "https://objects.githubusercontent.com/publication-review-fixture") return new Response(s.archive);
    const parsed = new URL(url);
    if (parsed.origin !== "https://api.github.com") throw new Error("reader must not request Blob, npm or an arbitrary origin");
    if (parsed.pathname === `${base}/actions/artifacts/501/zip`) return new Response(null, { status: 302, headers: { location: "https://objects.githubusercontent.com/publication-review-fixture" } });
    const value = metadata.get(parsed.pathname + parsed.search); return value === undefined ? new Response(null, { status: 404 }) : Response.json(value);
  };
  s.read = () => readCompletedPublicationReview(s.input, { fetcher: s.fetcher, attempts: 1, token: "fixture-ci-read-identity" });
  return s;
}

describe("completed publication draft platform and ZIP binding", () => {
  it.each(["a", "b"])("reads exact public review bytes when P=%s and preserves S without approving", async label => {
    const s = scenario(label.repeat(40)), result = await s.read();
    expect(result.files).toEqual(s.files); expect(result.archive).toEqual(s.archive);
    expect(result.receipt.source).toEqual(record.source); expect(result.receipt.launchRevision).toBe(label.repeat(40));
    expect(result.receipt.status).toBe("verified-platform-and-draft-bytes-not-approved"); expect(result.receipt.approved).toBeUndefined();
    expect(result.receipt.reviewFiles).toHaveLength(4); expect(result.receipt.artifact.sha256).toBe(sha256(s.archive));
    expect(result.metadata).toBeInstanceOf(Map); expect(result.receipt.downloadedBytes).toBe(s.archive.length);
    expect(s.requests.filter(r => !r.url.startsWith("https://api.github.com")).every(r => !r.init.headers.authorization)).toBe(true);
    expect(s.requests.filter(r => r.url.endsWith("/zip"))).toHaveLength(1);
  });
  it.each([
    ["unfinished publication", s => s.run.status = "in_progress", "PUBLICATION_REVIEW_RUN_IDENTITY"],
    ["failed publication", s => s.run.conclusion = "failure", "PUBLICATION_REVIEW_RUN_IDENTITY"],
    ["wrong attempt", s => s.run.run_attempt = 2, "PUBLICATION_REVIEW_RUN_IDENTITY"],
    ["fork", s => s.run.head_repository.id = 18, "PUBLICATION_REVIEW_RUN_IDENTITY"],
    ["foreign workflow", s => s.metadata.get(`${s.base}/actions/workflows/agent-release-publication.yml`).path = ".github/workflows/other.yml", "PUBLICATION_REVIEW_WORKFLOW"],
    ["pull request event", s => s.run.event = "pull_request", "PUBLICATION_REVIEW_RUN_IDENTITY"],
    ["unsafe workflow suffix", s => s.run.path = `${publicationWorkflowPath}@main/evil`, "PUBLICATION_REVIEW_RUN_IDENTITY"],
    ["unprotected main", s => s.metadata.get(`${s.base}/branches/main`).protected = false, "CI_BRANCH_CONTRACT"],
    ["S not ancestral to P", s => s.metadata.get(`${s.base}/compare/${record.source.sourceRevision}...${s.run.head_sha}`).merge_base_commit.sha = "c".repeat(40), "PUBLICATION_REVIEW_SOURCE_ANCESTRY"],
    ["changed publication workflow bytes", s => s.metadata.set(`${s.base}/contents/${publicationWorkflowPath}?ref=${s.run.head_sha}`, content(publicationWorkflowPath, Buffer.from("changed source\n"))), "CI_WORKFLOW_SOURCE"],
    ["missing resolver", s => { s.jobs.splice(0, 1); s.metadata.get(`${s.base}/actions/runs/401/attempts/1/jobs?per_page=100&page=1`).total_count = 1; }, "PUBLICATION_REVIEW_JOB_IDENTITY"],
    ["duplicate resolver", s => { s.jobs.push(structuredClone(s.jobs[0])); s.metadata.get(`${s.base}/actions/runs/401/attempts/1/jobs?per_page=100&page=1`).total_count++; }, "PUBLICATION_REVIEW_JOB_IDENTITY"],
    ["self hosted", s => s.jobs[1].labels.push("self-hosted"), "PUBLICATION_REVIEW_JOB_IDENTITY"],
    ["publisher head S instead of platform P", s => s.jobs[1].head_sha = record.source.sourceRevision, "PUBLICATION_REVIEW_JOB_IDENTITY"],
    ["skipped input prepare", s => s.jobs[1].steps[0].conclusion = "skipped", "PUBLICATION_REVIEW_REQUIRED_STEP"],
    ["skipped freeze", s => s.jobs[1].steps[4].conclusion = "skipped", "PUBLICATION_REVIEW_REQUIRED_STEP"],
    ["failed resolve step", s => s.jobs[0].steps[0].conclusion = "failure", "PUBLICATION_REVIEW_REQUIRED_STEP"],
    ["incorrect publisher step order", s => s.jobs[1].steps[0].number = 30, "PUBLICATION_REVIEW_STEP_ORDER"],
    ["overlapping resolver and publisher", s => s.jobs[0].completed_at = stamp(400), "PUBLICATION_REVIEW_JOB_TIMING"],
    ["old review attempt name", s => s.artifact.name = "agent-publication-review-401-2", "PUBLICATION_REVIEW_ARTIFACT_IDENTITY"],
    ["duplicate review artifact", s => { const page = s.metadata.get(`${s.base}/actions/runs/401/artifacts?per_page=100&page=1`); page.artifacts.push(structuredClone(s.artifact)); page.total_count++; }, "PUBLICATION_REVIEW_ARTIFACT_IDENTITY"],
    ["expired review", s => s.artifact.expired = true, "CI_ARTIFACT_CONTRACT"],
    ["expired time", s => s.artifact.expires_at = stamp(600), "CI_ARTIFACT_TIMING"],
    ["foreign artifact source", s => s.artifact.workflow_run.head_sha = "c".repeat(40), "CI_ARTIFACT_IDENTITY"],
    ["oversized ZIP", s => s.artifact.size_in_bytes = 16 * 1024 * 1024 + 1, "PUBLICATION_REVIEW_ZIP_BUDGET"],
    ["substituted ZIP digest", s => s.artifact.digest = `sha256:${"0".repeat(64)}`, "CI_ARCHIVE_DIGEST"],
    ["validation completed after publication began", s => s.metadata.get(`${s.base}/actions/runs/101/attempts/2`).updated_at = stamp(700), "PUBLICATION_REVIEW_VALIDATION_TIMING"],
    ["skipped consumer validation", s => s.metadata.get(`${s.base}/actions/runs/101/attempts/2/jobs?per_page=100&page=1`).jobs[0].steps[0].conclusion = "skipped", "CI_REQUIRED_STEP"],
  ])("rejects %s", async (_name, mutate, code) => {
    const s = scenario("b".repeat(40)); mutate(s); await expect(s.read()).rejects.toHaveProperty("code", code);
  });
  it("does not treat missing protection read permissions as an approval", async () => {
    const s = scenario(), fetcher = s.fetcher; s.fetcher = (url, init) => url.endsWith("/protection") ? new Response(null, { status: 403 }) : fetcher(url, init);
    await expect(s.read()).rejects.toHaveProperty("code", "CI_HTTP_403");
  });
  it.each(["missing", "extra", "extra-directory", "noncanonical", "different-attempt", "different-controls", "different-source", "wrong-selection", "oversized-json"])("rejects archive %s even with its platform digest recomputed", async change => {
    const s = scenario();
    if (change === "missing") s.files.delete("freeze-review.json");
    if (change === "extra") s.files.set("notes.json", json({ ignored: true }));
    if (change === "extra-directory") s.files.set("unexpected/", Buffer.alloc(0));
    if (change === "noncanonical") s.files.set("publication-dispatch.json", Buffer.from(JSON.stringify(s.dispatch)));
    if (change === "different-attempt") { s.dispatch.launchRunAttempt = 2; s.files = s.material(); }
    if (change === "different-controls") { s.dispatch.controls[0].sha256 = "0".repeat(64); s.files = s.material(); }
    if (change === "different-source") { s.record.source.sourceInputSha256 = "0".repeat(64); s.files = s.material(); }
    if (change === "wrong-selection") { const value = JSON.parse(s.files.get("releases/current.json")); value.current.sha256 = "0".repeat(64); s.files.set("releases/current.json", json(value)); }
    if (change === "oversized-json") s.files.set("freeze-review.json", Buffer.alloc(2 * 1024 * 1024 + 1, 32));
    const codes = { missing: "PUBLICATION_REVIEW_FILE_SET", extra: "ZIP_ENTRY_PATH", "extra-directory": "ZIP_ENTRY_PATH",
      noncanonical: "PUBLICATION_REVIEW_CANONICAL", "different-attempt": "PUBLICATION_REVIEW_DISPATCH_BINDING",
      "different-controls": "PUBLICATION_REVIEW_DISPATCH_BINDING", "different-source": "PUBLICATION_REVIEW_SOURCE_BINDING",
      "wrong-selection": "PUBLICATION_REVIEW_BINDING", "oversized-json": "ZIP_ENTRY_BUDGET" };
    s.refresh(); await expect(s.read()).rejects.toHaveProperty("code", codes[change]);
  });
  it("rejects known credentials in otherwise schema-valid review bytes", async () => {
    const s = scenario(); s.record.siteBaseUrl = "https://fixture-ci-read-identity.example.invalid"; s.files = s.material(); s.refresh();
    await expect(s.read()).rejects.toHaveProperty("code", "CI_ARCHIVE_CREDENTIAL_CONTENT");
  });
  it.each([null, [], { skip: true }])("rejects invalid I/O options %j before HTTP", async options => {
    const s = scenario(); await expect(readCompletedPublicationReview(s.input, options)).rejects.toHaveProperty("code", "PUBLICATION_REVIEW_INPUT");
    expect(s.requests).toEqual([]);
  });
  it("refuses caller supplied approval, repository, archive URL or skip flags before HTTP", async () => {
    for (const field of ["approved", "repository", "archiveUrl", "skip"]) {
      const s = scenario(); await expect(readCompletedPublicationReview({ ...s.input, [field]: true }, { fetcher: s.fetcher })).rejects.toHaveProperty("code", "PUBLICATION_REVIEW_INPUT");
      expect(s.requests).toEqual([]);
    }
  });
});
