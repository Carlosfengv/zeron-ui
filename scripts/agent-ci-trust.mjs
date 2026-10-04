import { createHash } from "node:crypto";
import { z } from "zod";
import { ciArtifactName, ciLocatorSchema, ciTrustPath, ciTrustPolicySchema, ciVerificationReceiptSchema, rejectCi } from "./agent-ci-contract.mjs";
import { githubEvidenceClient } from "./agent-ci-github.mjs";
import { executionRoles, verifyExecutionArchive } from "./agent-execution-index.mjs";
import { checkCiArchiveContent } from "./check-agent-ci-archive.mjs";
import { unzipCiArchive } from "./safe-ci-zip.mjs";
import { assembleConsumerVerification, consumerEvidenceSchema } from "./published-consumer-evidence.mjs";
import { validateExampleEvidenceBatch } from "./agent-example-evidence.mjs";
import { downloadArtifact } from "./download-agent-artifact.mjs";
import { installationInputSchema } from "./agent-release-record.mjs";
import { fixtureManagers } from "./published-consumer-runtime.mjs";
import { serialize, sha256 } from "./agent-utils.mjs";

const positive = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const revision = z.string().regex(/^[a-f0-9]{40}$/);
const timestamp = z.string().datetime({ offset: true });
const repositorySchema = z.object({ id: positive, full_name: z.string() }).passthrough();
const workflowSchema = z.object({ id: positive, name: z.string(), path: z.string(), state: z.literal("active") }).passthrough();
const runSchema = z.object({ id: positive, run_attempt: positive, workflow_id: positive, name: z.string(), path: z.string(),
  head_sha: revision, head_branch: z.string(), event: z.string(), status: z.literal("completed"), conclusion: z.literal("success"),
  repository: repositorySchema, head_repository: repositorySchema }).passthrough();
const stepSchema = z.object({ name: z.string(), number: positive, status: z.string(), conclusion: z.string().nullable(),
  started_at: timestamp.nullable(), completed_at: timestamp.nullable() }).passthrough();
export const ciJobMetadataSchema = z.object({ id: positive, run_id: positive, head_sha: revision, head_branch: z.string(), workflow_name: z.string(),
  name: z.string(), status: z.literal("completed"), conclusion: z.literal("success"), started_at: timestamp, completed_at: timestamp,
  steps: z.array(stepSchema).min(2).max(100), labels: z.array(z.string()).min(1).max(32) }).passthrough();
const artifactSchema = z.object({ id: positive, name: z.string(), size_in_bytes: positive.max(128 * 1024 * 1024),
  digest: z.string().regex(/^sha256:[a-f0-9]{64}$/), expired: z.literal(false), created_at: timestamp, updated_at: timestamp, expires_at: timestamp,
  workflow_run: z.object({ id: positive, repository_id: positive, head_repository_id: positive, head_branch: z.string(), head_sha: revision }).passthrough() }).passthrough();
const parse = (schema, value, code) => { const result = schema.safeParse(value); if (!result.success) rejectCi(code); return result.data; };
const same = (a, b) => serialize(a) === serialize(b);
const descriptor = (path, bytes) => ({ path, bytes: bytes.length, sha256: sha256(bytes) });
const milliseconds = value => Date.parse(value);

export async function verifyProtectedSource(client, policy, source, sourceFiles) {
  const base = `/repos/${policy.repository}`;
  const repository = parse(repositorySchema, await client.json(base), "CI_REPOSITORY_CONTRACT");
  if (repository.full_name.toLowerCase() !== policy.repository.toLowerCase()) rejectCi("CI_REPOSITORY_IDENTITY");
  const branch = parse(z.object({ name: z.string(), protected: z.literal(true), commit: z.object({ sha: revision }).passthrough() }).passthrough(),
    await client.json(`${base}/branches/${policy.branch}`), "CI_BRANCH_CONTRACT");
  if (branch.name !== policy.branch) rejectCi("CI_BRANCH_IDENTITY");
  const compare = parse(z.object({ status: z.enum(["identical", "ahead"]), merge_base_commit: z.object({ sha: revision }).passthrough() }).passthrough(),
    await client.json(`${base}/compare/${source.sourceRevision}...${branch.commit.sha}`), "CI_SOURCE_ANCESTRY");
  if (compare.merge_base_commit.sha !== source.sourceRevision) rejectCi("CI_SOURCE_ANCESTRY");

  const rules = await client.list(`${base}/rules/branches/${policy.branch}`);
  const requiredRules = ["non_fast_forward", "deletion"].map(type => rules.find(rule => rule?.type === type));
  let protection;
  if (requiredRules.every(Boolean)) {
    for (const rule of requiredRules) {
      if (!Number.isSafeInteger(rule.ruleset_id) || rule.ruleset_id < 1 || rule.ruleset_source_type !== "Repository"
        || rule.ruleset_source?.toLowerCase() !== policy.repository.toLowerCase()) rejectCi("CI_RULESET_SOURCE");
    }
    for (const id of new Set(requiredRules.map(rule => rule.ruleset_id))) {
      const ruleSet = parse(z.object({ id: positive, target: z.literal("branch"), enforcement: z.literal("active"),
        bypass_actors: z.array(z.unknown()).max(0), rules: z.array(z.object({ type: z.string() }).passthrough()).max(100) }).passthrough(),
      await client.json(`${base}/rulesets/${id}`), "CI_RULESET_CONTRACT");
      if (ruleSet.id !== id || requiredRules.filter(rule => rule.ruleset_id === id).some(rule => !ruleSet.rules.some(value => value.type === rule.type))) rejectCi("CI_RULESET_CONTRACT");
    }
    protection = "ruleset";
  } else {
    parse(z.object({ enforce_admins: z.object({ enabled: z.literal(true) }).passthrough(),
      allow_force_pushes: z.object({ enabled: z.literal(false) }).passthrough(), allow_deletions: z.object({ enabled: z.literal(false) }).passthrough() }).passthrough(),
    await client.json(`${base}/branches/${policy.branch}/protection`), "CI_PROTECTION_CONTRACT");
    protection = "classic";
  }
  const workflow = parse(workflowSchema, await client.json(`${base}/actions/workflows/${policy.workflowPath.split("/").at(-1)}`), "CI_WORKFLOW_CONTRACT");
  if (workflow.name !== policy.workflowName || workflow.path !== policy.workflowPath) rejectCi("CI_WORKFLOW_IDENTITY");
  const bytes = await verifyWorkflowSource(client, policy, source.sourceRevision, sourceFiles.get(policy.workflowPath));
  await verifyPublicationEnvironment(client, policy);
  return { repository, workflow, protectedSource: { branch: policy.branch, branchHeadSha: branch.commit.sha,
    workflowSha256: sha256(bytes), protection } };
}

/** Fixed publication environment restrictions are technical evidence, never human release approval. */
export async function verifyPublicationEnvironment(client, policy) {
  const name = "agent-artifact-publication", endpoint = `/repos/${policy.repository}/environments/${name}`;
  const environment = parse(z.object({ id: positive, name: z.literal(name), url: z.literal(`https://api.github.com${endpoint}`),
    deployment_branch_policy: z.object({ protected_branches: z.literal(false), custom_branch_policies: z.literal(true) }).passthrough(),
    protection_rules: z.array(z.object({ id: positive, type: z.string() }).passthrough()).max(100) }).passthrough(),
  await client.json(endpoint), "CI_PUBLICATION_ENVIRONMENT_CONTRACT");
  if (environment.protection_rules.filter(rule => rule.type === "branch_policy").length !== 1
    || new Set(environment.protection_rules.map(rule => rule.id)).size !== environment.protection_rules.length) rejectCi("CI_PUBLICATION_ENVIRONMENT_RULES");
  const policies = await client.list(`${endpoint}/deployment-branch-policies`, "branch_policies");
  if (policies.length !== 1) rejectCi("CI_PUBLICATION_ENVIRONMENT_BRANCHES");
  parse(z.object({ id: positive, name: z.literal("main"), type: z.literal("branch") }).passthrough(), policies[0], "CI_PUBLICATION_ENVIRONMENT_BRANCHES");
}

/** A caller's fixed workflow identity and actual source bytes, never a path selected by a report. */
export async function verifyWorkflowSource(client, policy, sourceRevision, expected) {
  if (!revision.safeParse(sourceRevision).success) rejectCi("CI_WORKFLOW_SOURCE");
  const base = `/repos/${policy.repository}`;
  const content = parse(z.object({ type: z.literal("file"), path: z.string(), encoding: z.literal("base64"),
    size: positive.max(128 * 1024), sha: revision, content: z.string().max(256 * 1024) }).passthrough(),
  await client.json(`${base}/contents/${policy.workflowPath}?ref=${sourceRevision}`), "CI_WORKFLOW_SOURCE");
  const encoded = content.content.replace(/\n/g, "");
  if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) rejectCi("CI_WORKFLOW_SOURCE");
  const bytes = Buffer.from(encoded, "base64");
  const blobSha = createHash("sha1").update(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`), bytes])).digest("hex");
  if (content.path !== policy.workflowPath || bytes.length !== content.size || blobSha !== content.sha || encoded !== bytes.toString("base64")
    || !Buffer.isBuffer(expected) || !bytes.equals(expected)) rejectCi("CI_WORKFLOW_SOURCE");
  return bytes;
}

export async function verifyRoleMetadata(client, policy, role, locator, source, repository, workflow) {
  const base = `/repos/${policy.repository}`;
  const run = parse(runSchema, await client.json(`${base}/actions/runs/${locator.runId}/attempts/${locator.runAttempt}`), "CI_RUN_CONTRACT");
  if (run.id !== locator.runId || run.run_attempt !== locator.runAttempt || run.workflow_id !== workflow.id || run.name !== policy.workflowName
    || run.head_sha !== source.sourceRevision || run.head_branch !== policy.branch || run.event !== "workflow_dispatch"
    || ![policy.workflowPath, `${policy.workflowPath}@${policy.branch}`, `${policy.workflowPath}@refs/heads/${policy.branch}`].includes(run.path)
    || [run.repository, run.head_repository].some(value => value.id !== repository.id || value.full_name.toLowerCase() !== policy.repository.toLowerCase())) rejectCi("CI_RUN_IDENTITY");
  const jobs = await client.list(`${base}/actions/runs/${locator.runId}/attempts/${locator.runAttempt}/jobs`, "jobs");
  const matches = jobs.filter(value => value?.name === policy.jobs[role].name);
  if (matches.length !== 1 || matches[0].id !== locator.jobId || jobs.filter(value => value?.id === locator.jobId).length !== 1) rejectCi("CI_JOB_IDENTITY");
  const job = parse(ciJobMetadataSchema, matches[0], "CI_JOB_CONTRACT");
  if (job.run_id !== locator.runId || job.head_sha !== source.sourceRevision || job.head_branch !== policy.branch || job.workflow_name !== policy.workflowName
    || job.labels.includes("self-hosted") || !job.labels.some(label => ["ubuntu-latest", "ubuntu-24.04", "ubuntu-22.04"].includes(label))) rejectCi("CI_JOB_IDENTITY");
  const start = milliseconds(job.started_at), end = milliseconds(job.completed_at);
  if (end < start || new Set(job.steps.map(step => step.number)).size !== job.steps.length) rejectCi("CI_JOB_TIMING");
  const mandatory = [policy.jobs[role].executeStep, policy.jobs[role].archiveCheckStep, policy.jobs[role].uploadStep].map(name => {
    const matches = job.steps.filter(step => step.name === name);
    if (matches.length !== 1) rejectCi("CI_REQUIRED_STEP");
    const step = matches[0];
    if (step.status !== "completed" || step.conclusion !== "success" || !step.started_at || !step.completed_at
      || milliseconds(step.started_at) < start || milliseconds(step.completed_at) > end || milliseconds(step.completed_at) < milliseconds(step.started_at)) rejectCi("CI_REQUIRED_STEP");
    return step;
  });
  if (mandatory.slice(1).some((step, index) => mandatory[index].number >= step.number
    || milliseconds(mandatory[index].completed_at) > milliseconds(step.started_at))) rejectCi("CI_STEP_ORDER");
  const artifact = parse(artifactSchema, await client.json(`${base}/actions/artifacts/${locator.artifactId}`), "CI_ARTIFACT_CONTRACT");
  const artifacts = await client.list(`${base}/actions/runs/${locator.runId}/artifacts`, "artifacts");
  const name = ciArtifactName(policy, role, locator), listed = artifacts.filter(value => value?.name === name || value?.id === locator.artifactId);
  if (listed.length !== 1 || !same(artifact, parse(artifactSchema, listed[0], "CI_ARTIFACT_CONTRACT"))) rejectCi("CI_ARTIFACT_LIST_BINDING");
  const binding = artifact.workflow_run;
  if (artifact.id !== locator.artifactId || artifact.name !== name || binding.id !== locator.runId || binding.repository_id !== repository.id
    || binding.head_repository_id !== repository.id || binding.head_branch !== policy.branch || binding.head_sha !== source.sourceRevision) rejectCi("CI_ARTIFACT_IDENTITY");
  if (milliseconds(artifact.created_at) < milliseconds(mandatory[2].started_at) || milliseconds(artifact.updated_at) < milliseconds(artifact.created_at)
    || milliseconds(artifact.updated_at) > end || milliseconds(artifact.expires_at) <= Date.now()) rejectCi("CI_ARTIFACT_TIMING");
  return { artifact, job };
}

function verifyReportSemantics(prepared, sources, role, archive) {
  if (role === "examples") {
    validateExampleEvidenceBatch(prepared, sources, archive.report, archive.attachments);
  } else {
    const completed = archive.report.matrices.map(({ evidence: reference, ...result }) => ({ result,
      evidence: consumerEvidenceSchema.parse(JSON.parse(archive.attachments.get(reference.url).toString("utf8"))) }));
    const rebuilt = assembleConsumerVerification(prepared, completed, archive.report.matrices.map(row => row.evidence));
    if (!same(rebuilt, archive.report)) rejectCi("CI_CONSUMER_SCOPE");
  }
  const rows = role === "examples" ? archive.report.rows : archive.report.matrices;
  if (rows.some(row => !/^22\./.test(row.nodeVersion) || row.packageManagerVersion !== fixtureManagers[row.packageManager])) rejectCi("CI_RUNTIME_VERSION");
}

/** Only the production caller supplies verified input and actual Git S bytes. Injected I/O is for explicit contract fixtures. */
export async function verifyCiEvidence({ prepared, sources, locator: rawLocator, policy: rawPolicy, sourceFiles }, options = {}) {
  const input = installationInputSchema.parse(prepared.input), locator = ciLocatorSchema.parse(rawLocator), policy = ciTrustPolicySchema.parse(rawPolicy);
  if (!(sourceFiles instanceof Map) || !Buffer.isBuffer(sourceFiles.get(ciTrustPath)) || !sourceFiles.get(ciTrustPath).equals(Buffer.from(serialize(policy)))
    || Object.values(executionRoles).flatMap(value => [value.producer, value.worker]).filter(Boolean).some(name => !Buffer.isBuffer(sourceFiles.get(name)))) rejectCi("CI_TRUSTED_SOURCE_INPUT");
  const { maxPublicBytes = 512 * 1024 * 1024, ...clientOptions } = options;
  if (!Number.isSafeInteger(maxPublicBytes) || maxPublicBytes < 1 || maxPublicBytes > 512 * 1024 * 1024) rejectCi("CI_IO_CONFIG");
  const client = githubEvidenceClient(policy, clientOptions);
  const { repository, workflow, protectedSource } = await verifyProtectedSource(client, policy, input.source, sourceFiles);
  const privateFiles = new Map(), results = {}, archives = {}; let consumedPublicBytes = 0;
  for (const role of ["consumer", "examples"]) {
    client.remaining();
    const { artifact, job } = await verifyRoleMetadata(client, policy, role, locator[role], input.source, repository, workflow);
    const zip = await client.archive(artifact.id, { bytes: artifact.size_in_bytes, sha256: artifact.digest.slice(7) });
    const files = unzipCiArchive(zip), archive = verifyExecutionArchive(files, { role, input, sourceFiles, requirePublished: true });
    checkCiArchiveContent(files, { role, input, outcome: "success", secrets: [options.token].filter(Boolean) });
    const expectedLocator = { repository: policy.repository, workflowRef: `${policy.repository}/${policy.workflowPath}@refs/heads/${policy.branch}`,
      runId: locator[role].runId, runAttempt: locator[role].runAttempt, headSha: input.source.sourceRevision };
    if (!same(archive.index.workflowLocator, expectedLocator)) rejectCi("CI_INDEX_LOCATOR");
    verifyReportSemantics(prepared, sources, role, archive); client.remaining();
    for (const attachment of archive.index.publicAttachments) {
      const raw = await downloadArtifact(attachment.url, { fetcher: clientOptions.fetcher ?? fetch, origin: input.artifactBaseUrl,
        bytes: attachment.bytes, hash: attachment.sha256, maxBytes: 16 * 1024 * 1024, attempts: clientOptions.attempts ?? 3,
        timeoutMs: Math.min(12000, clientOptions.timeoutMs ?? 30000, client.remaining()), maxDurationMs: Math.min(90000, client.remaining()),
        onBytes: size => { consumedPublicBytes += size; if (consumedPublicBytes > maxPublicBytes) rejectCi("CI_PUBLIC_TOTAL_BUDGET"); } });
      if (!raw.equals(archive.attachments.get(attachment.url))) rejectCi("CI_PUBLIC_BYTES");
    }
    archives[role] = archive;
    const archivePath = `archives/${role}.zip`, indexPath = `${role}/execution-index.json`, reportPath = `${role}/${archive.index.report.path}`;
    privateFiles.set(archivePath, zip); privateFiles.set(indexPath, files.get("execution-index.json")); privateFiles.set(reportPath, files.get(archive.index.report.path));
    results[role] = { ...locator[role], branch: policy.branch, workflowId: workflow.id, archive: descriptor(archivePath, zip),
      index: descriptor(indexPath, files.get("execution-index.json")), report: descriptor(reportPath, files.get(archive.index.report.path)),
      publicAttachments: archive.index.publicAttachments.length, jobStartedAt: new Date(job.started_at).toISOString(), jobCompletedAt: new Date(job.completed_at).toISOString() };
  }
  const metadata = [...client.metadata].sort(([a], [b]) => a.localeCompare(b, "en")).map(([endpoint, bytes]) => {
    const path = `metadata/${sha256(endpoint)}.json`; privateFiles.set(path, bytes); return { endpoint, file: descriptor(path, bytes) };
  });
  client.remaining();
  const receipt = ciVerificationReceiptSchema.parse({ schemaVersion: 1, kind: "agent-ci-verification", status: "verified-platform-archives-and-public-bytes",
    scope: "ci-evidence-gate-not-catalog-publication-or-deployment", provider: policy.provider, repository: policy.repository,
    source: input.source, inputSha256: sha256(serialize(input)), policySha256: sha256(sourceFiles.get(ciTrustPath)), protectedSource,
    ...results, metadata, consumedArchiveBytes: client.consumedArchiveBytes, consumedPublicBytes });
  return { receipt, privateFiles, archives };
}
