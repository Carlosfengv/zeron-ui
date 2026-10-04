import { z } from "zod";
import { ciTrustPath, ciTrustPolicySchema } from "./agent-ci-contract.mjs";
import { githubEvidenceClient } from "./agent-ci-github.mjs";
import { ciJobMetadataSchema, verifyProtectedSource, verifyRoleMetadata, verifyWorkflowSource } from "./agent-ci-trust.mjs";
import { publicationDispatchSchema, publicationReviewFiles, comparePublicationControls, publicationWorkflowPath } from "./agent-publication-workflow.mjs";
import { frozenReleaseSchema } from "./agent-release-record.mjs";
import { unzipCiArchive } from "./safe-ci-zip.mjs";
import { serialize, sha256 } from "./agent-utils.mjs";

const positive = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const revision = z.string().regex(/^[a-f0-9]{40}$/), timestamp = z.string().datetime({ offset: true });
const runInputSchema = z.object({ runId: positive, runAttempt: positive }).strict();
const workflowName = "Agent release publication";
const resolveName = "Resolve completed validation and release controls";
const publishName = "Verify and publish Catalog with durable freeze draft";
const resolveSteps = ["Resolve completed validation source and compare release controls", "Upload checked publication dispatch"];
const publishSteps = ["Prepare exact content source and public installation input", "Reverify completed CI archives and public evidence",
  "Build Catalog candidate from verified source and reports", "Publish Catalog after fresh source CI and predecessor checks",
  "Freeze published stages and retain original CI archives privately", "Check and copy only the fixed public review files", "Upload checked freeze draft for review"];
const json = value => Buffer.from(serialize(value)), same = (a, b) => serialize(a) === serialize(b);
const descriptor = (path, bytes) => ({ path, bytes: bytes.length, sha256: sha256(bytes) });
const reject = code => { throw Object.assign(new Error(`Publication review rejected: ${code}`), { code }); };
const parse = (schema, value, code) => { const result = schema.safeParse(value); if (!result.success) reject(code); return result.data; };
const canonical = (schema, bytes) => {
  let value;
  try { value = schema.parse(JSON.parse(new TextDecoder("utf8", { fatal: true }).decode(bytes))); } catch { reject("PUBLICATION_REVIEW_CONTRACT"); }
  if (!Buffer.isBuffer(bytes) || !bytes.equals(json(value))) reject("PUBLICATION_REVIEW_CANONICAL");
  return value;
};
function requiredSteps(job, names) {
  const start = Date.parse(job.started_at), end = Date.parse(job.completed_at);
  if (end < start || new Set(job.steps.map(step => step.number)).size !== job.steps.length) reject("PUBLICATION_REVIEW_JOB_TIMING");
  const selected = names.map(name => {
    const matches = job.steps.filter(step => step.name === name);
    if (matches.length !== 1) reject("PUBLICATION_REVIEW_REQUIRED_STEP");
    const step = matches[0];
    if (step.status !== "completed" || step.conclusion !== "success" || !step.started_at || !step.completed_at
      || Date.parse(step.started_at) < start || Date.parse(step.completed_at) > end || Date.parse(step.completed_at) < Date.parse(step.started_at)) {
      reject("PUBLICATION_REVIEW_REQUIRED_STEP");
    }
    return step;
  });
  if (selected.slice(1).some((step, index) => selected[index].number >= step.number
    || Date.parse(selected[index].completed_at) > Date.parse(step.started_at))) reject("PUBLICATION_REVIEW_STEP_ORDER");
  return selected;
}
function fixedJob(raw, name, publication, launchRevision, repository) {
  const job = parse(ciJobMetadataSchema, raw, "PUBLICATION_REVIEW_JOB_CONTRACT");
  if (job.name !== name || job.run_id !== publication.runId || job.head_sha !== launchRevision || job.head_branch !== "main"
    || job.workflow_name !== workflowName || job.labels.includes("self-hosted") || !job.labels.includes("ubuntu-24.04")
    || repository.full_name !== "Carlosfengv/zeron-ui") reject("PUBLICATION_REVIEW_JOB_IDENTITY");
  return job;
}

/**
 * Read a completed publication's platform-bound draft. This is never an approval or activation.
 * The future closed deployment caller supplies actual S controls/provenance; injected I/O is fixture-only.
 */
export async function readCompletedPublicationReview(input, options = {}) {
  if (!input || typeof input !== "object" || Array.isArray(input) || !options || typeof options !== "object" || Array.isArray(options) || Object.keys(input).sort().join(",") !== "controls,publication,source"
    || !(input.controls instanceof Map) || Object.keys(options).some(key => !["fetcher", "token", "timeoutMs", "attempts", "retryDelayMs", "maxDurationMs"].includes(key))) {
    reject("PUBLICATION_REVIEW_INPUT");
  }
  const source = parse(frozenReleaseSchema.shape.source, input.source, "PUBLICATION_REVIEW_SOURCE");
  const publication = parse(runInputSchema, input.publication, "PUBLICATION_REVIEW_RUN_INPUT");
  const controls = new Map([...input.controls].map(([name, bytes]) => [name, Buffer.isBuffer(bytes) ? Buffer.from(bytes) : bytes]));
  const controlRefs = comparePublicationControls(controls, controls);
  const policy = canonical(ciTrustPolicySchema, controls.get(ciTrustPath));
  const client = githubEvidenceClient(policy, { ...options, maxArchiveBytes: 48 * 1024 * 1024 });
  const base = `/repos/${policy.repository}`;
  const run = await client.json(`${base}/actions/runs/${publication.runId}/attempts/${publication.runAttempt}`);
  const launchRevision = parse(revision, run?.head_sha, "PUBLICATION_REVIEW_RUN_IDENTITY");
  const trusted = await verifyProtectedSource(client, policy, { sourceRevision: launchRevision }, controls);
  const ancestry = await client.json(`${base}/compare/${source.sourceRevision}...${launchRevision}`);
  if (!["identical", "ahead"].includes(ancestry?.status) || ancestry?.merge_base_commit?.sha !== source.sourceRevision) reject("PUBLICATION_REVIEW_SOURCE_ANCESTRY");
  const workflow = await client.json(`${base}/actions/workflows/agent-release-publication.yml`);
  if (!positive.safeParse(workflow?.id).success || workflow?.name !== workflowName || workflow?.path !== publicationWorkflowPath || workflow?.state !== "active") {
    reject("PUBLICATION_REVIEW_WORKFLOW");
  }
  if (run?.id !== publication.runId || run?.run_attempt !== publication.runAttempt || run?.workflow_id !== workflow.id || run?.name !== workflowName
    || run?.head_branch !== "main" || run?.event !== "workflow_dispatch" || run?.status !== "completed" || run?.conclusion !== "success"
    || ![publicationWorkflowPath, `${publicationWorkflowPath}@main`, `${publicationWorkflowPath}@refs/heads/main`].includes(run?.path)
    || [run?.repository, run?.head_repository].some(repo => repo?.id !== trusted.repository.id || repo?.full_name?.toLowerCase() !== policy.repository.toLowerCase())
    || !timestamp.safeParse(run?.run_started_at).success || !timestamp.safeParse(run?.updated_at).success || Date.parse(run.updated_at) < Date.parse(run.run_started_at)) {
    reject("PUBLICATION_REVIEW_RUN_IDENTITY");
  }
  await verifyWorkflowSource(client, { repository: policy.repository, workflowPath: publicationWorkflowPath }, launchRevision, controls.get(publicationWorkflowPath));
  const jobs = await client.list(`${base}/actions/runs/${publication.runId}/attempts/${publication.runAttempt}/jobs`, "jobs");
  const pick = name => { const matches = jobs.filter(job => job?.name === name); if (matches.length !== 1) reject("PUBLICATION_REVIEW_JOB_IDENTITY"); return matches[0]; };
  const resolveJob = fixedJob(pick(resolveName), resolveName, publication, launchRevision, trusted.repository);
  const publishJob = fixedJob(pick(publishName), publishName, publication, launchRevision, trusted.repository);
  if (resolveJob.id === publishJob.id || new Set(jobs.map(job => job?.id)).size !== jobs.length) reject("PUBLICATION_REVIEW_JOB_IDENTITY");
  requiredSteps(resolveJob, resolveSteps); requiredSteps(publishJob, publishSteps);
  if (Date.parse(resolveJob.started_at) < Date.parse(run.run_started_at) || Date.parse(resolveJob.completed_at) > Date.parse(publishJob.started_at)
    || Date.parse(publishJob.completed_at) > Date.parse(run.updated_at)) reject("PUBLICATION_REVIEW_JOB_TIMING");
  const artifactName = `agent-publication-review-${publication.runId}-${publication.runAttempt}`;
  const listed = await client.list(`${base}/actions/runs/${publication.runId}/artifacts`, "artifacts");
  const matches = listed.filter(artifact => artifact?.name === artifactName);
  if (matches.length !== 1 || !positive.safeParse(matches[0].id).success) reject("PUBLICATION_REVIEW_ARTIFACT_IDENTITY");
  // The existing metadata verifier is parameterized by a caller's fixed role identities.
  const artifactPolicy = { repository: policy.repository, branch: policy.branch, workflowPath: publicationWorkflowPath, workflowName,
    jobs: { publication: { name: publishName, executeStep: publishSteps[4], archiveCheckStep: publishSteps[5], uploadStep: publishSteps[6], artifactPrefix: "agent-publication-review" } } };
  const { artifact } = await verifyRoleMetadata(client, artifactPolicy, "publication",
    { ...publication, jobId: publishJob.id, artifactId: matches[0].id }, { sourceRevision: launchRevision }, trusted.repository, workflow);
  if (artifact.size_in_bytes > 16 * 1024 * 1024) reject("PUBLICATION_REVIEW_ZIP_BUDGET");
  const archive = await client.archive(artifact.id, { bytes: artifact.size_in_bytes, sha256: artifact.digest.slice(7) });
  const files = unzipCiArchive(archive, { maxInputBytes: 16 * 1024 * 1024, maxEntries: 5,
    maxFileBytes: 2 * 1024 * 1024, maxDecodedBytes: 8 * 1024 * 1024,
    allowedEntry: (name, directory) => directory ? name === "releases/" : ["publication-dispatch.json", "freeze-review.json", "releases/current.json"].includes(name)
      || /^releases\/[a-f0-9]{64}\.json$/.test(name) });
  if (files.size !== 4) reject("PUBLICATION_REVIEW_FILE_SET");
  const dispatch = canonical(publicationDispatchSchema, files.get("publication-dispatch.json"));
  if (dispatch.launchRevision !== launchRevision || dispatch.contentRevision !== source.sourceRevision || dispatch.launchRunId !== publication.runId
    || dispatch.launchRunAttempt !== publication.runAttempt || !same(dispatch.controls, controlRefs)) reject("PUBLICATION_REVIEW_DISPATCH_BINDING");
  const names = [...files.keys()].filter(name => /^releases\/[a-f0-9]{64}\.json$/.test(name));
  if (names.length !== 1) reject("PUBLICATION_REVIEW_FILE_SET");
  const record = canonical(frozenReleaseSchema, files.get(names[0]));
  if (!same(record.source, source)) reject("PUBLICATION_REVIEW_SOURCE_BINDING");
  const verified = publicationReviewFiles(dispatch, files.get("freeze-review.json"), files.get(names[0]), files.get("releases/current.json"), [options.token].filter(Boolean));
  if ([...verified].some(([name, bytes]) => !files.get(name)?.equals(bytes))) reject("PUBLICATION_REVIEW_CANONICAL");
  // A workflow run's P remains its platform identity even when a job checks out content S.
  for (const role of ["consumer", "examples"]) {
    const metadata = await verifyRoleMetadata(client, policy, role, dispatch.locator[role], source, trusted.repository, trusted.workflow);
    const locator = dispatch.locator[role], selectedRun = JSON.parse(client.metadata.get(`${base}/actions/runs/${locator.runId}/attempts/${locator.runAttempt}`).toString("utf8"));
    if (!timestamp.safeParse(selectedRun.updated_at).success || Date.parse(selectedRun.updated_at) > Date.parse(run.run_started_at)
      || Date.parse(metadata.job.completed_at) > Date.parse(run.run_started_at)) reject("PUBLICATION_REVIEW_VALIDATION_TIMING");
  }
  client.remaining();
  return { files, archive, metadata: client.metadata,
    receipt: { schemaVersion: 1, kind: "agent-publication-review-bytes", status: "verified-platform-and-draft-bytes-not-approved",
      scope: "completed-publication-review-transport-not-g0-approval-or-deployment", source, launchRevision, ...publication,
      jobs: { resolve: resolveJob.id, publish: publishJob.id }, protectedSource: trusted.protectedSource,
      artifact: { id: artifact.id, name: artifact.name, ...descriptor("publication-review.zip", archive) },
      reviewFiles: [...verified].map(([name, bytes]) => descriptor(name, bytes)).sort((a, b) => a.path < b.path ? -1 : 1),
      apiFiles: [...client.metadata].map(([endpoint, bytes]) => ({ endpoint, bytes: bytes.length, sha256: sha256(bytes) })).sort((a, b) => a.endpoint < b.endpoint ? -1 : 1),
      downloadedBytes: client.consumedArchiveBytes } };
}
