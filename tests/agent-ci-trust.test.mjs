import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { ciEvidenceFixture } from "./helpers/agent-ci-fixture.mjs";
import { verifyCiEvidence, verifyPublicationEnvironment } from "../scripts/agent-ci-trust.mjs";
import { githubEvidenceClient } from "../scripts/agent-ci-github.mjs";
import { ciVerificationReceiptSchema } from "../scripts/agent-ci-contract.mjs";
import { serialize, sha256 } from "../scripts/agent-utils.mjs";

let parent, sequence = 0;
beforeAll(async () => { parent = await mkdtemp(path.join(tmpdir(), "zeron-ci-trust-fixtures-")); });
afterAll(async () => { await rm(parent, { recursive: true, force: true }); });
const create = () => ciEvidenceFixture(path.join(parent, `fixture-${++sequence}`));
const verify = fixture => verifyCiEvidence(fixture.context, { fetcher: fixture.fetcher, token: "fixture-read-identity", attempts: 1, retryDelayMs: 0 });
const jsonEdit = (files, filename, edit) => { const value = JSON.parse(files.get(filename)); edit(value); files.set(filename, Buffer.from(serialize(value))); };
function reindex(fixture, role) {
  jsonEdit(fixture.files[role], "execution-index.json", index => {
    index.outputFiles = [...fixture.files[role]].filter(([name]) => name !== "execution-index.json").sort(([a], [b]) => a.localeCompare(b, "en"))
      .map(([path, bytes]) => ({ path, bytes: bytes.length, sha256: sha256(bytes) }));
    index.report = index.outputFiles.find(file => file.path === index.report.path);
  });
  fixture.refresh(role);
}

describe("platform, archive, source and anonymous public byte gate (explicit injected fixtures)", () => {
  it("verifies both actual ZIP byte streams and preserves raw metadata without claiming publication", async () => {
    const fixture = await create(), result = await verify(fixture);
    expect(ciVerificationReceiptSchema.parse(result.receipt)).toEqual(result.receipt);
    expect(result.receipt.scope).toBe("ci-evidence-gate-not-catalog-publication-or-deployment");
    expect(result.receipt.protectedSource.protection).toBe("classic");
    for (const role of ["consumer", "examples"]) {
      const row = result.receipt[role]; expect(result.privateFiles.get(row.archive.path)).toEqual(fixture.archives[role]);
      expect(sha256(result.privateFiles.get(row.report.path))).toBe(row.report.sha256);
    }
    for (const metadata of result.receipt.metadata) expect(sha256(result.privateFiles.get(metadata.file.path))).toBe(metadata.file.sha256);
    expect(result.receipt.consumedArchiveBytes).toBe(fixture.archives.consumer.length + fixture.archives.examples.length);
    expect(result.receipt.consumedPublicBytes).toBeGreaterThan(0);
    expect(fixture.requests.filter(request => !request.url.startsWith("https://api.github.com")).every(request => !request.init.headers?.authorization)).toBe(true);
    expect("sourceReview" in result.receipt).toBe(false);
    expect(result.receipt.metadata.some(ref => ref.endpoint.endsWith("/environments/agent-artifact-publication"))).toBe(true);
    expect(result.receipt.metadata.some(ref => ref.endpoint.includes("/deployment-branch-policies?"))).toBe(true);
  });
  it("accepts additional environment reviewers without treating them as a release approval", async () => {
    const fixture = await create();
    fixture.metadata.get(`${fixture.base}/environments/agent-artifact-publication`).protection_rules.push({ id: 21, type: "required_reviewers", reviewers: [{ type: "User", reviewer: { login: "fixture-reviewer" } }] });
    const result = await verify(fixture); expect("approved" in result.receipt).toBe(false);
  });
  it.each([
    ["missing environment", f => f.metadata.delete(`${f.base}/environments/agent-artifact-publication`), "CI_HTTP_404"],
    ["wrong environment", f => f.metadata.get(`${f.base}/environments/agent-artifact-publication`).name = "Production", "CI_PUBLICATION_ENVIRONMENT_CONTRACT"],
    ["foreign repository environment", f => f.metadata.get(`${f.base}/environments/agent-artifact-publication`).url = "https://api.github.com/repos/other/repo/environments/agent-artifact-publication", "CI_PUBLICATION_ENVIRONMENT_CONTRACT"],
    ["unrestricted environment", f => f.metadata.get(`${f.base}/environments/agent-artifact-publication`).deployment_branch_policy = null, "CI_PUBLICATION_ENVIRONMENT_CONTRACT"],
    ["all protected branches", f => f.metadata.get(`${f.base}/environments/agent-artifact-publication`).deployment_branch_policy = { protected_branches: true, custom_branch_policies: false }, "CI_PUBLICATION_ENVIRONMENT_CONTRACT"],
    ["disabled custom policies", f => f.metadata.get(`${f.base}/environments/agent-artifact-publication`).deployment_branch_policy.custom_branch_policies = false, "CI_PUBLICATION_ENVIRONMENT_CONTRACT"],
    ["missing branch protection marker", f => f.metadata.get(`${f.base}/environments/agent-artifact-publication`).protection_rules = [], "CI_PUBLICATION_ENVIRONMENT_RULES"],
    ["duplicate branch marker", f => f.metadata.get(`${f.base}/environments/agent-artifact-publication`).protection_rules.push({ id: 21, type: "branch_policy" }), "CI_PUBLICATION_ENVIRONMENT_RULES"],
    ["duplicate protection ID", f => f.metadata.get(`${f.base}/environments/agent-artifact-publication`).protection_rules.push({ id: 19, type: "wait_timer" }), "CI_PUBLICATION_ENVIRONMENT_RULES"],
    ["no allowed branch", f => f.metadata.set(`${f.base}/environments/agent-artifact-publication/deployment-branch-policies?per_page=100&page=1`, { total_count: 0, branch_policies: [] }), "CI_PUBLICATION_ENVIRONMENT_BRANCHES"],
    ["wildcard", f => f.metadata.get(`${f.base}/environments/agent-artifact-publication/deployment-branch-policies?per_page=100&page=1`).branch_policies[0].name = "*", "CI_PUBLICATION_ENVIRONMENT_BRANCHES"],
    ["another branch", f => f.metadata.get(`${f.base}/environments/agent-artifact-publication/deployment-branch-policies?per_page=100&page=1`).branch_policies[0].name = "develop", "CI_PUBLICATION_ENVIRONMENT_BRANCHES"],
    ["tag named main", f => f.metadata.get(`${f.base}/environments/agent-artifact-publication/deployment-branch-policies?per_page=100&page=1`).branch_policies[0].type = "tag", "CI_PUBLICATION_ENVIRONMENT_BRANCHES"],
    ["unspecified branch or tag", f => delete f.metadata.get(`${f.base}/environments/agent-artifact-publication/deployment-branch-policies?per_page=100&page=1`).branch_policies[0].type, "CI_PUBLICATION_ENVIRONMENT_BRANCHES"],
    ["extra rule", f => { const page = f.metadata.get(`${f.base}/environments/agent-artifact-publication/deployment-branch-policies?per_page=100&page=1`); page.branch_policies.push({ id: 22, name: "release/*", type: "branch" }); page.total_count++; }, "CI_PUBLICATION_ENVIRONMENT_BRANCHES"],
  ])("rejects publication environment %s before archive download", async (_name, mutate, code) => {
    const fixture = await create(); mutate(fixture); await expect(verify(fixture)).rejects.toHaveProperty("code", code);
    expect(fixture.requests.some(request => request.url.endsWith("/zip"))).toBe(false);
  });
  it("fails closed when publication environment permissions cannot be read", async () => {
    const fixture = await create(), fetcher = (url, init) => url.endsWith("/environments/agent-artifact-publication") ? new Response(null, { status: 403 }) : fixture.fetcher(url, init);
    await expect(verifyCiEvidence(fixture.context, { fetcher, attempts: 1 })).rejects.toHaveProperty("code", "CI_HTTP_403");
  });
  it("reads every branch-policy page and rejects an extra later-page rule", async () => {
    const fixture = await create(), endpoint = `${fixture.base}/environments/agent-artifact-publication/deployment-branch-policies`;
    const metadata = new Map();
    const client = githubEvidenceClient(fixture.context.policy, { attempts: 1, fetcher: async url => {
      const parsed = new URL(url), page = parsed.searchParams.get("page");
      if (!parsed.search) return Response.json(fixture.metadata.get(parsed.pathname));
      if (page === "1") return Response.json({ total_count: 101, branch_policies: Array.from({ length: 100 }, (_, i) => ({ id: i + 1, name: "main", type: "branch" })) });
      metadata.set('later-page-read', true); return Response.json({ total_count: 101, branch_policies: [{ id: 101, name: "*", type: "tag" }] });
    } });
    await expect(verifyPublicationEnvironment(client, fixture.context.policy)).rejects.toHaveProperty("code", "CI_PUBLICATION_ENVIRONMENT_BRANCHES");
    expect(metadata.get('later-page-read')).toBe(true); expect(client.metadata.has(`${endpoint}?per_page=100&page=2`)).toBe(true);
  });
  it("accepts an active applicable repository ruleset without a classic-protection read", async () => {
    const fixture = await create();
    fixture.metadata.set(`${fixture.base}/rules/branches/main?per_page=100&page=1`, ["non_fast_forward", "deletion"].map(type => ({ type,
      ruleset_id: 9, ruleset_source_type: "Repository", ruleset_source: fixture.context.policy.repository })));
    fixture.metadata.set(`${fixture.base}/rulesets/9`, { id: 9, target: "branch", enforcement: "active", bypass_actors: [], rules: [{ type: "non_fast_forward" }, { type: "deletion" }] });
    expect((await verify(fixture)).receipt.protectedSource.protection).toBe("ruleset");
    expect(fixture.requests.some(request => request.url.endsWith("/protection"))).toBe(false);
  });
  it.each(["evaluate", "disabled", "bypass", "missing-rule"])("rejects ineffective ruleset %s", async kind => {
    const fixture = await create();
    fixture.metadata.set(`${fixture.base}/rules/branches/main?per_page=100&page=1`, ["non_fast_forward", "deletion"].map(type => ({ type,
      ruleset_id: 9, ruleset_source_type: "Repository", ruleset_source: fixture.context.policy.repository })));
    fixture.metadata.set(`${fixture.base}/rulesets/9`, { id: 9, target: "branch", enforcement: ["evaluate", "disabled"].includes(kind) ? kind : "active",
      bypass_actors: kind === "bypass" ? [{ actor_type: "Integration", actor_id: 1 }] : [], rules: kind === "missing-rule" ? [] : [{ type: "non_fast_forward" }, { type: "deletion" }] });
    await expect(verify(fixture)).rejects.toHaveProperty("code", "CI_RULESET_CONTRACT");
  });
  it("requires S in the allowed protected source history", async () => {
    const fixture = await create();
    fixture.metadata.get(`${fixture.base}/compare/${fixture.context.prepared.input.source.sourceRevision}...${fixture.context.prepared.input.source.sourceRevision}`).merge_base_commit.sha = "b".repeat(40);
    await expect(verify(fixture)).rejects.toHaveProperty("code", "CI_SOURCE_ANCESTRY");
  });
  it("does not infer protection from a label or inaccessible metadata", async () => {
    const fixture = await create(); fixture.metadata.delete(`${fixture.base}/branches/main/protection`);
    await expect(verify(fixture)).rejects.toHaveProperty("code", "CI_HTTP_404");
  });
  it("rejects admin bypass of classic force-push/deletion protections", async () => {
    const fixture = await create(); fixture.metadata.get(`${fixture.base}/branches/main/protection`).enforce_admins.enabled = false;
    await expect(verify(fixture)).rejects.toHaveProperty("code", "CI_PROTECTION_CONTRACT");
  });
  it.each(["source", "path", "encoding", "blob-hash"])("rejects workflow %s substitution", async kind => {
    const fixture = await create(), content = fixture.metadata.get(`${fixture.base}/contents/${fixture.context.policy.workflowPath}?ref=${fixture.context.prepared.input.source.sourceRevision}`);
    if (kind === "source") fixture.context.sourceFiles.set(fixture.context.policy.workflowPath, Buffer.from("different maintained source"));
    if (kind === "path") content.path = ".github/workflows/other.yml";
    if (kind === "encoding") content.content = "%%%";
    if (kind === "blob-hash") content.sha = "b".repeat(40);
    await expect(verify(fixture)).rejects.toHaveProperty("code", "CI_WORKFLOW_SOURCE");
  });
  it.each(["fork", "event", "sha", "attempt", "workflow", "path"])("rejects run %s mismatch", async kind => {
    const fixture = await create(), run = fixture.metadata.get(`${fixture.base}/actions/runs/101/attempts/2`);
    if (kind === "fork") run.head_repository.id = 999;
    if (kind === "event") run.event = "pull_request";
    if (kind === "sha") run.head_sha = "b".repeat(40);
    if (kind === "attempt") run.run_attempt = 1;
    if (kind === "workflow") run.workflow_id = 14;
    if (kind === "path") run.path += "/suffix";
    await expect(verify(fixture)).rejects.toHaveProperty("code", "CI_RUN_IDENTITY");
  });
  it.each(["failure", "in_progress"])("rejects run status %s", async kind => {
    const fixture = await create(), run = fixture.metadata.get(`${fixture.base}/actions/runs/101/attempts/2`);
    if (kind === "failure") run.conclusion = "failure"; else run.status = "in_progress";
    await expect(verify(fixture)).rejects.toHaveProperty("code", "CI_RUN_CONTRACT");
  });
  it.each(["executeStep", "archiveCheckStep", "uploadStep"].flatMap(step => ["skipped", "failure", "cancelled"].map(conclusion => ({ step, conclusion }))))("rejects $step $conclusion despite successful job and uploaded artifact", async ({ step, conclusion }) => {
    const fixture = await create(); fixture.jobs[0].steps.find(value => value.name === fixture.context.policy.jobs.consumer[step]).conclusion = conclusion;
    await expect(verify(fixture)).rejects.toHaveProperty("code", "CI_REQUIRED_STEP");
  });
  it("rejects duplicate role jobs and ambiguous locators", async () => {
    const fixture = await create(); fixture.jobs.push(structuredClone(fixture.jobs[0]));
    fixture.metadata.get(`${fixture.base}/actions/runs/101/attempts/2/jobs?per_page=100&page=1`).total_count++;
    await expect(verify(fixture)).rejects.toHaveProperty("code", "CI_JOB_IDENTITY");
  });
  it("rejects upload-before-execution timing", async () => {
    const fixture = await create(); fixture.jobs[0].steps[2].started_at = "2020-01-01T00:00:30Z";
    await expect(verify(fixture)).rejects.toHaveProperty("code", "CI_STEP_ORDER");
  });
  it("rejects a missing content gate despite a successful job", async () => {
    const fixture = await create(); fixture.jobs[0].steps.splice(1, 1);
    await expect(verify(fixture)).rejects.toHaveProperty("code", "CI_REQUIRED_STEP");
  });
  it("requires the content gate to finish before upload starts", async () => {
    const fixture = await create(); fixture.jobs[0].steps[1].completed_at = "2020-01-01T00:01:05Z";
    await expect(verify(fixture)).rejects.toHaveProperty("code", "CI_STEP_ORDER");
  });
  it("rejects artifacts created before the actual upload step", async () => {
    const fixture = await create(); fixture.artifacts.consumer.created_at = "2020-01-01T00:01:00Z";
    await expect(verify(fixture)).rejects.toHaveProperty("code", "CI_ARTIFACT_TIMING");
  });
  it.each(["expired", "missing-digest", "old-attempt", "different-source", "outside-job", "duplicate-list"])("rejects artifact %s", async kind => {
    const fixture = await create(), artifact = fixture.artifacts.consumer;
    if (kind === "expired") artifact.expired = true;
    if (kind === "missing-digest") delete artifact.digest;
    if (kind === "old-attempt") artifact.name = "agent-consumer-evidence-101-1";
    if (kind === "different-source") artifact.workflow_run.head_sha = "b".repeat(40);
    if (kind === "outside-job") artifact.created_at = "2019-01-01T00:00:00Z";
    if (kind === "duplicate-list") {
      const list = fixture.metadata.get(`${fixture.base}/actions/runs/101/artifacts?per_page=100&page=1`); list.artifacts.push(structuredClone(artifact)); list.total_count++;
    }
    const code = ["expired", "missing-digest"].includes(kind) ? "CI_ARTIFACT_CONTRACT" : kind === "outside-job" ? "CI_ARTIFACT_TIMING" : kind === "duplicate-list" ? "CI_ARTIFACT_LIST_BINDING" : "CI_ARTIFACT_IDENTITY";
    await expect(verify(fixture)).rejects.toHaveProperty("code", code);
  });
  it("rejects differing artifact get/list metadata", async () => {
    const fixture = await create(), list = fixture.metadata.get(`${fixture.base}/actions/runs/101/artifacts?per_page=100&page=1`);
    list.artifacts = structuredClone(list.artifacts); list.artifacts[0].size_in_bytes++;
    await expect(verify(fixture)).rejects.toHaveProperty("code", "CI_ARTIFACT_LIST_BINDING");
  });
  it("rejects downloaded ZIP substitution", async () => {
    const fixture = await create(); fixture.archives.consumer[20] ^= 1;
    await expect(verify(fixture)).rejects.toHaveProperty("code", "CI_ARCHIVE_DIGEST");
  });
  it("rejects a coherently rehashed index from another attempt", async () => {
    const fixture = await create(); jsonEdit(fixture.files.consumer, "execution-index.json", index => { index.workflowLocator.runAttempt = 1; }); fixture.refresh("consumer");
    await expect(verify(fixture)).rejects.toHaveProperty("code", "CI_INDEX_LOCATOR");
  });
  it("compares producer bytes to trusted S, not to the report's claimed source", async () => {
    const fixture = await create(); fixture.context.sourceFiles.set("scripts/test-published-consumer-installs.mjs", Buffer.from("different producer"));
    await expect(verify(fixture)).rejects.toHaveProperty("code", "EXECUTION_SOURCE_BYTES");
  });
  it("rejects coherently rewritten consumer scope even with valid raw attachments", async () => {
    const fixture = await create(); jsonEdit(fixture.files.consumer, "verification.json", report => { report.registry.staticCheckedItems = ["block:login-01", "component:button"]; });
    reindex(fixture, "consumer"); await expect(verify(fixture)).rejects.toHaveProperty("code", "CI_CONSUMER_SCOPE");
  });
  it("validates example declaration and raw source graph against trusted source", async () => {
    const fixture = await create(), sources = fixture.context.sources;
    sources.files = new Map(sources.files); sources.files.set(sources.manifest.files[0].path, Buffer.from("different maintained example"));
    await expect(verify(fixture)).rejects.toThrow();
    expect(fixture.requests.some(request => request.url.includes("/evidence/examples/"))).toBe(false);
  });
  it("rejects missing mandatory logs even after rebuilding inventory and platform digest", async () => {
    const fixture = await create(); fixture.files.consumer.delete("private-logs/next-npm/build.json"); reindex(fixture, "consumer");
    await expect(verify(fixture)).rejects.toHaveProperty("code", "EXECUTION_LOG_MISSING");
  });
  it("rejects reindexed credential logs even when the platform content step is successful", async () => {
    const fixture = await create(); jsonEdit(fixture.files.consumer, "private-logs/next-npm/build.json", log => { log.stdout = "Authorization: Bearer fixture-only-opaque"; });
    reindex(fixture, "consumer"); await expect(verify(fixture)).rejects.toHaveProperty("code", "CI_ARCHIVE_CREDENTIAL_CONTENT");
  });
  it("rejects an extra private file even when archive hashes and the index agree", async () => {
    const fixture = await create(); fixture.files.consumer.set(".env", Buffer.from("fixture-only-data")); reindex(fixture, "consumer");
    await expect(verify(fixture)).rejects.toHaveProperty("code", "CI_ARCHIVE_PATH_OR_TYPE");
  });
  it("anonymously rechecks archive attachments and rejects public byte substitution", async () => {
    const fixture = await create(), url = [...fixture.publicObjects.keys()].find(url => url.includes("/evidence/consumer/"));
    fixture.publicObjects.set(url, Buffer.alloc(fixture.publicObjects.get(url).length));
    await expect(verify(fixture)).rejects.toHaveProperty("code", "HASH_OR_SIZE_MISMATCH");
  });
  it("enforces cumulative public and raw archive budgets", async () => {
    const fixture = await create();
    await expect(verifyCiEvidence(fixture.context, { fetcher: fixture.fetcher, attempts: 1, maxPublicBytes: 1 })).rejects.toHaveProperty("code", "TOTAL_BODY_TOO_LARGE");
    await expect(verifyCiEvidence(fixture.context, { fetcher: fixture.fetcher, attempts: 1, maxArchiveBytes: 1 })).rejects.toHaveProperty("code", "CI_ARCHIVE_TOTAL_BUDGET");
  });
  it("cannot replace the canonical policy with a downloaded or mutated policy", async () => {
    const fixture = await create(); fixture.context.policy.jobs.consumer.name = "Other consumers";
    await expect(verify(fixture)).rejects.toHaveProperty("code", "CI_TRUSTED_SOURCE_INPUT"); expect(fixture.requests).toHaveLength(0);
  });
});
