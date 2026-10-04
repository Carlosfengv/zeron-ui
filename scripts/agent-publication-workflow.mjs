import { appendFile, rm } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { z } from "zod";
import { ciArtifactName, ciLocatorSchema, ciTrustPath, ciTrustPolicySchema } from "./agent-ci-contract.mjs";
import { githubEvidenceClient, ciReadToken } from "./agent-ci-github.mjs";
import { verifyProtectedSource, verifyRoleMetadata } from "./agent-ci-trust.mjs";
import { createInstallationOutput } from "./check-published-installation-input.mjs";
import { committedCiSourceFile, readRegularCiInput } from "./check-agent-ci-evidence.mjs";
import { buildAgentCiInstallationInput, ciInstallationConfigPath } from "./prepare-agent-ci-input.mjs";
import { installationConfigurationSchema } from "./prepare-published-installation-input.mjs";
import { frozenReleaseSchema, releaseSelectionSchema } from "./agent-release-record.mjs";
import { ciArchiveStoragePath } from "./agent-ci-retention.mjs";
import { releaseFreezeReviewSchema } from "./freeze-agent-release.mjs";
import { checkPublicCiJson } from "./check-agent-ci-archive.mjs";
import { writeCatalogCandidateFile } from "./create-agent-catalog-release.mjs";
import { validatePublicationSourceBindings } from "./publish-agent-artifacts.mjs";
import { serialize, sha256, sourceProvenance } from "./agent-utils.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
export const publicationWorkflowPath = ".github/workflows/agent-release-publication.yml";
const workflowName = "Agent release publication";
const requiredControls = ["package.json", "pnpm-lock.yaml", "vercel.json", ciTrustPath, ciInstallationConfigPath, ciArchiveStoragePath,
  ".github/workflows/agent-release-validation.yml", publicationWorkflowPath];
const controlPath = z.string().regex(/^(?:(?:scripts|lib|packages\/registry\/scripts)\/[A-Za-z0-9._/-]+|package\.json|pnpm-lock\.yaml|vercel\.json|\.github\/workflows\/agent-release-(?:validation|publication)\.yml|docs\/agent-data\/(?:ci-trust|installation-config|ci-archive-storage)\.json)$/)
  .refine(value => value.split("/").every(part => part && part !== "." && part !== ".."));
const hash = z.string().regex(/^[a-f0-9]{64}$/), revision = z.string().regex(/^[a-f0-9]{40}$/);
const positive = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const control = z.object({ path: controlPath, bytes: positive.max(32 * 1024 * 1024), sha256: hash }).strict();
export const publicationDispatchSchema = z.object({ schemaVersion: z.literal(1), kind: z.literal("agent-publication-dispatch"),
  scope: z.literal("resolved-platform-identities-not-ci-byte-verification"),
  launchRevision: revision, contentRevision: revision, launchRunId: positive, launchRunAttempt: positive,
  registryReleaseId: z.string().regex(/^[a-z0-9][a-z0-9._-]{0,63}$/).refine(value => !value.includes("..")),
  predecessor: z.union([z.literal("none"), z.string().regex(/^[a-f0-9]{64}\.json$/)]), locator: ciLocatorSchema,
  controls: z.array(control).min(8).max(1024),
}).strict().superRefine((value, context) => {
  const names = value.controls.map(file => file.path);
  if (requiredControls.some(name => !names.includes(name)) || new Set(names).size !== names.length
    || names.some((name, index) => index > 0 && names[index - 1] >= name)
    || value.controls.reduce((sum, file) => sum + file.bytes, 0) > 32 * 1024 * 1024
    || [value.locator.consumer.runId, value.locator.examples.runId].includes(value.launchRunId)) context.addIssue({ code: "custom", message: "Keep exact sorted controls and separate completed validation runs" });
});
const reject = code => { throw Object.assign(new Error(`Publication workflow rejected: ${code}`), { code }); };
const json = value => Buffer.from(serialize(value));
const same = (a, b) => serialize(a) === serialize(b);
const descriptor = (path, bytes) => ({ path, bytes: bytes.length, sha256: sha256(bytes) });
function canonical(schema, bytes) {
  let value; try { value = schema.parse(JSON.parse(new TextDecoder("utf8", { fatal: true }).decode(bytes))); }
  catch { reject("PUBLICATION_INPUT_CONTRACT"); }
  if (!bytes.equals(json(value))) reject("PUBLICATION_INPUT_CANONICAL");
  return value;
}
const number = value => {
  if (typeof value !== "string" || !/^[1-9][0-9]{0,15}$/.test(value) || !positive.safeParse(Number(value)).success) reject("PUBLICATION_INTEGER_INPUT");
  return Number(value);
};
export function publicationLaunch(environment = process.env) {
  if (environment.GITHUB_ACTIONS !== "true" || environment.GITHUB_EVENT_NAME !== "workflow_dispatch"
    || environment.GITHUB_REPOSITORY !== "Carlosfengv/zeron-ui" || environment.GITHUB_REF !== "refs/heads/main"
    || environment.GITHUB_WORKFLOW_REF !== `Carlosfengv/zeron-ui/${publicationWorkflowPath}@refs/heads/main`
    || !revision.safeParse(environment.GITHUB_SHA).success || environment.GITHUB_WORKFLOW_SHA !== environment.GITHUB_SHA) reject("PUBLICATION_WORKFLOW_CONTEXT");
  return { revision: environment.GITHUB_SHA, runId: number(environment.GITHUB_RUN_ID), runAttempt: number(environment.GITHUB_RUN_ATTEMPT) };
}
export function publicationRequestedRuns(environment = process.env) {
  return { consumer: { runId: number(environment.PUBLICATION_CONSUMER_RUN_ID), runAttempt: number(environment.PUBLICATION_CONSUMER_RUN_ATTEMPT) },
    examples: { runId: number(environment.PUBLICATION_EXAMPLES_RUN_ID), runAttempt: number(environment.PUBLICATION_EXAMPLES_RUN_ATTEMPT) } };
}

/** Reuse exact platform gates. Injected HTTP is for explicit fixtures, never a CLI option. */
export async function resolvePublicationPlatform({ policy, launch, requested, sourceFiles }, options = {}) {
  policy = ciTrustPolicySchema.parse(policy);
  const requestedSchema = z.object({ consumer: z.object({ runId: positive, runAttempt: positive }).strict(),
    examples: z.object({ runId: positive, runAttempt: positive }).strict() }).strict();
  if (!revision.safeParse(launch?.revision).success || !positive.safeParse(launch?.runId).success || !positive.safeParse(launch?.runAttempt).success
    || !requestedSchema.safeParse(requested).success
    || [requested.consumer, requested.examples].some(run => run.runId === launch.runId)) reject("PUBLICATION_RUN_INPUT");
  const client = githubEvidenceClient(policy, options), base = `/repos/${policy.repository}`;
  const trusted = await verifyProtectedSource(client, policy, { sourceRevision: launch.revision }, sourceFiles);
  const publicationWorkflow = await client.json(`${base}/actions/workflows/${publicationWorkflowPath.split("/").at(-1)}`);
  if (publicationWorkflow?.name !== workflowName || publicationWorkflow?.path !== publicationWorkflowPath || publicationWorkflow?.state !== "active"
    || !positive.safeParse(publicationWorkflow.id).success) reject("PUBLICATION_WORKFLOW_IDENTITY");
  const current = await client.json(`${base}/actions/runs/${launch.runId}/attempts/${launch.runAttempt}`);
  if (current?.id !== launch.runId || current?.run_attempt !== launch.runAttempt || current?.head_sha !== launch.revision
    || current?.workflow_id !== publicationWorkflow.id || current?.name !== workflowName || current?.head_branch !== policy.branch
    || current?.event !== "workflow_dispatch" || ![publicationWorkflowPath, `${publicationWorkflowPath}@main`, `${publicationWorkflowPath}@refs/heads/main`].includes(current?.path)
    || !["queued", "in_progress"].includes(current?.status) || current?.conclusion !== null
    || !z.string().datetime({ offset: true }).safeParse(current?.run_started_at).success
    || [current?.repository, current?.head_repository].some(repo => repo?.id !== trusted.repository.id || repo?.full_name?.toLowerCase() !== policy.repository.toLowerCase())) reject("PUBLICATION_LAUNCH_IDENTITY");
  const locator = { schemaVersion: 1 }; let contentRevision;
  for (const role of ["consumer", "examples"]) {
    const requestedRun = requested[role], run = await client.json(`${base}/actions/runs/${requestedRun.runId}/attempts/${requestedRun.runAttempt}`);
    if (!revision.safeParse(run?.head_sha).success || (contentRevision && run.head_sha !== contentRevision)) reject("PUBLICATION_CONTENT_SOURCE");
    contentRevision = run.head_sha;
    if (!z.string().datetime({ offset: true }).safeParse(run?.updated_at).success || Date.parse(run.updated_at) > Date.parse(current.run_started_at)) reject("PUBLICATION_VALIDATION_NOT_PRIOR");
    const jobs = await client.list(`${base}/actions/runs/${requestedRun.runId}/attempts/${requestedRun.runAttempt}/jobs`, "jobs");
    const matches = jobs.filter(job => job?.name === policy.jobs[role].name);
    const artifacts = await client.list(`${base}/actions/runs/${requestedRun.runId}/artifacts`, "artifacts");
    const named = artifacts.filter(artifact => artifact?.name === ciArtifactName(policy, role, requestedRun));
    if (matches.length !== 1 || named.length !== 1) reject("PUBLICATION_ROLE_AMBIGUOUS");
    locator[role] = { ...requestedRun, jobId: matches[0].id, artifactId: named[0].id };
    const verified = await verifyRoleMetadata(client, policy, role, locator[role], { sourceRevision: contentRevision }, trusted.repository, trusted.workflow);
    if (Date.parse(verified.job.completed_at) > Date.parse(current.run_started_at)) reject("PUBLICATION_VALIDATION_NOT_PRIOR");
  }
  return { contentRevision, locator: ciLocatorSchema.parse(locator), metadata: client.metadata };
}

/** Compare the whole release-control closure; changed/missing controls require a new validated S. */
export function comparePublicationControls(content, launch) {
  if (!(content instanceof Map) || !(launch instanceof Map) || !same([...content.keys()].sort(), [...launch.keys()].sort())
    || requiredControls.some(name => !content.has(name)) || content.size < 8 || content.size > 1024) reject("PUBLICATION_CONTROL_FILE_SET");
  const files = [];
  for (const name of [...content.keys()].sort()) {
    if (!controlPath.safeParse(name).success || !Buffer.isBuffer(content.get(name)) || !Buffer.isBuffer(launch.get(name))
      || !content.get(name).equals(launch.get(name))) reject("PUBLICATION_CONTROL_BYTES");
    files.push(control.parse(descriptor(name, content.get(name))));
  }
  if (files.reduce((sum, file) => sum + file.bytes, 0) > 32 * 1024 * 1024) reject("PUBLICATION_CONTROL_BUDGET");
  return files;
}
/** Alternate repository roots are only for explicit local Git fixtures, never a workflow CLI flag. */
export function readPublicationGitControls(contentRevision, launchRevision, { repositoryRoot = root, gitEnvironment = process.env } = {}) {
  if (!revision.safeParse(contentRevision).success || !revision.safeParse(launchRevision).success) reject("PUBLICATION_GIT_REVISION");
  const git = args => execFileSync("git", args, { cwd: repositoryRoot, env: gitEnvironment, maxBuffer: 32 * 1024 * 1024, stdio: ["ignore", "pipe", "pipe"] });
  try { git(["merge-base", "--is-ancestor", contentRevision, launchRevision]); } catch { reject("PUBLICATION_CONTENT_ANCESTRY"); }
  const read = commit => {
    const lines = git(["ls-tree", "-r", "-z", commit, "--", "scripts", "lib", "packages/registry/scripts", ...requiredControls]).toString("utf8").split("\0").filter(Boolean);
    if (lines.length > 1024) reject("PUBLICATION_CONTROL_FILE_SET");
    const files = new Map(); let total = 0;
    for (const line of lines) {
      const match = /^(100644|100755) blob [a-f0-9]{40}\t(.+)$/.exec(line);
      if (!match || !controlPath.safeParse(match[2]).success) reject("PUBLICATION_CONTROL_FILE_TYPE");
      const bytes = git(["show", `${commit}:${match[2]}`]); total += bytes.length;
      if (total > 32 * 1024 * 1024) reject("PUBLICATION_CONTROL_BUDGET"); files.set(match[2], bytes);
    }
    return files;
  };
  return comparePublicationControls(read(contentRevision), read(launchRevision));
}

export function parsePublicationWorkflowArgs(args) {
  const mode = args[0], allowed = mode === "resolve" ? ["--output"] : mode === "prepare" ? ["--dispatch", "--output"] : mode === "stage" ? ["--dispatch", "--freeze", "--output"] : [];
  const flags = new Map();
  for (let index = 1; index < args.length; index += 2) {
    if (!allowed.includes(args[index]) || flags.has(args[index]) || !args[index + 1] || args[index + 1].startsWith("--") || /[\r\n\0]/.test(args[index + 1])) reject("PUBLICATION_ARGUMENTS");
    flags.set(args[index], path.resolve(args[index + 1]));
  }
  if (!allowed.length || flags.size !== allowed.length) reject("PUBLICATION_ARGUMENTS");
  return { mode, ...Object.fromEntries([...flags].map(([name, value]) => [name.slice(2), value])) };
}

/** Only a small fixed JSON set is ever eligible for the public publication artifact. */
export function publicationReviewFiles(dispatch, reviewBytes, recordBytes, selectionBytes, secrets = []) {
  dispatch = publicationDispatchSchema.parse(dispatch);
  const review = canonical(releaseFreezeReviewSchema, reviewBytes), record = canonical(frozenReleaseSchema, recordBytes), selection = canonical(releaseSelectionSchema, selectionBytes);
  if (review.source.sourceRevision !== dispatch.contentRevision || !same(review.source, record.source)
    || review.catalogVersion !== record.catalog.version || record.registry.releaseId !== dispatch.registryReleaseId
    || !same(review.record, descriptor(`${record.catalog.version}.json`, recordBytes)) || !same(selection.current, review.record)
    || !same(review.selection, descriptor("current.json", selectionBytes))
    || (review.predecessor?.approved.path ?? "none") !== dispatch.predecessor
    || !same(review.predecessor?.approved ?? null, record.history[0] ?? null)
    || !same(review.restoration.versions.slice(1), record.history.map(ref => ref.path.slice(0, -5)))) reject("PUBLICATION_REVIEW_BINDING");
  const files = new Map([["publication-dispatch.json", json(dispatch)], ["freeze-review.json", reviewBytes],
    [`releases/${review.record.path}`, recordBytes], ["releases/current.json", selectionBytes]]);
  for (const bytes of files.values()) checkPublicCiJson(bytes, secrets);
  return files;
}

/** Closed workflow CLI. Neither resolve nor prepare can write product resources. */
export async function runPublicationWorkflow(args) {
  const options = parsePublicationWorkflowArgs(args);
  await createInstallationOutput(options.output, { excludeDirectories: [options.freeze, options.dispatch && path.dirname(options.dispatch)].filter(Boolean) });
  let phase = "runtime";
  try {
    if (Number(process.versions.node.split(".")[0]) !== 22 || process.platform !== "linux") reject("PUBLICATION_RUNTIME");
    phase = "source";
    const actual = await sourceProvenance(root); validatePublicationSourceBindings(actual, actual);
    const launch = publicationLaunch();
    if (options.mode === "resolve") {
      if (actual.sourceRevision !== launch.revision) reject("PUBLICATION_LAUNCH_CHECKOUT");
      const policy = canonical(ciTrustPolicySchema, await committedCiSourceFile(actual.sourceRevision, ciTrustPath));
      const sourceFiles = new Map([[policy.workflowPath, await committedCiSourceFile(actual.sourceRevision, policy.workflowPath)]]);
      phase = "platform-identities";
      const target = await resolvePublicationPlatform({ policy, launch, requested: publicationRequestedRuns(), sourceFiles },
        { token: ciReadToken() });
      phase = "control-closure";
      const controls = readPublicationGitControls(target.contentRevision, launch.revision);
      const dispatch = publicationDispatchSchema.parse({ schemaVersion: 1, kind: "agent-publication-dispatch", scope: "resolved-platform-identities-not-ci-byte-verification",
        launchRevision: launch.revision, contentRevision: target.contentRevision, launchRunId: launch.runId, launchRunAttempt: launch.runAttempt,
        registryReleaseId: process.env.PUBLICATION_REGISTRY_RELEASE_ID, predecessor: process.env.PUBLICATION_PREDECESSOR, locator: target.locator, controls });
      phase = "source-final"; validatePublicationSourceBindings(await sourceProvenance(root), actual);
      const filename = path.join(options.output, "publication-dispatch.json"), bytes = json(dispatch);
      checkPublicCiJson(bytes, [process.env.AGENT_CI_READ_TOKEN, process.env.GITHUB_TOKEN].filter(Boolean));
      await writeCatalogCandidateFile(options.output, "publication-dispatch.json", bytes);
      if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT,
        `source-revision=${target.contentRevision}\ndispatch-file=${filename}\ndispatch-bytes=${bytes.length}\ndispatch-sha256=${sha256(bytes)}\n`);
    } else {
      phase = "dispatch";
      const bytes = await readRegularCiInput(options.dispatch), dispatch = canonical(publicationDispatchSchema, bytes);
      if (dispatch.launchRevision !== launch.revision || dispatch.launchRunId !== launch.runId || dispatch.launchRunAttempt !== launch.runAttempt
        || dispatch.contentRevision !== actual.sourceRevision || dispatch.registryReleaseId !== process.env.PUBLICATION_REGISTRY_RELEASE_ID
        || dispatch.predecessor !== process.env.PUBLICATION_PREDECESSOR
        || !same(readPublicationGitControls(actual.sourceRevision, launch.revision), dispatch.controls)) reject("PUBLICATION_DISPATCH_SOURCE");
      if (options.mode === "prepare") {
        phase = "installation-input";
        const config = canonical(installationConfigurationSchema, await committedCiSourceFile(actual.sourceRevision, ciInstallationConfigPath));
        if (config.siteBaseUrl !== process.env.SITE_BASE_URL) reject("PUBLICATION_SITE_CONFIGURATION");
        await buildAgentCiInstallationInput({ releaseId: dispatch.registryReleaseId, output: options.output,
          siteBaseUrl: config.siteBaseUrl, artifactBaseUrl: process.env.ARTIFACT_BASE_URL });
        validatePublicationSourceBindings(await sourceProvenance(root), actual);
        await writeCatalogCandidateFile(options.output, "ci-locator.json", json(dispatch.locator));
        await writeCatalogCandidateFile(options.output, "publication-dispatch.json", bytes);
      } else {
        phase = "public-review";
        const reviewBytes = await readRegularCiInput(path.join(options.freeze, "freeze-review.json"));
        const review = canonical(releaseFreezeReviewSchema, reviewBytes);
        const files = publicationReviewFiles(dispatch, reviewBytes, await readRegularCiInput(path.join(options.freeze, "releases", review.record.path)),
          await readRegularCiInput(path.join(options.freeze, "releases/current.json")), [process.env.AGENT_CI_READ_TOKEN, process.env.GITHUB_TOKEN,
            process.env.BLOB_READ_WRITE_TOKEN, process.env.AGENT_CI_ARCHIVE_BLOB_TOKEN].filter(Boolean));
        if (!same(review.source, actual)) reject("PUBLICATION_REVIEW_SOURCE");
        for (const [name, bytes] of files) { await writeCatalogCandidateFile(options.output, name, bytes);
          if (!(await readRegularCiInput(path.join(options.output, name))).equals(bytes)) reject("PUBLICATION_STAGE_BYTES"); }
        validatePublicationSourceBindings(await sourceProvenance(root), actual);
      }
    }
    return { status: options.mode === "stage" ? "checked-public-review-not-approval" : `${options.mode}-completed-not-publication-pass`, output: options.output };
  } catch (error) {
    for (const name of ["publication-dispatch.json", "ci-locator.json", "freeze-review.json", "releases"]) await rm(path.join(options.output, name), { recursive: true, force: true });
    const code = /^[A-Z][A-Z0-9_]{0,63}$/.test(error.code ?? "") ? error.code : "PUBLICATION_WORKFLOW_FAILED";
    await writeCatalogCandidateFile(options.output, "failure.json", json({ schemaVersion: 1, kind: "agent-publication-workflow-failure", status: "failed", phase, code }));
    throw Object.assign(new Error(`Publication workflow failed: ${code}`), { code });
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runPublicationWorkflow(process.argv.slice(2)).then(result => console.log(serialize(result))).catch(error => {
    console.error(error.code ? `Publication workflow failed: ${error.code}` : "Publication workflow failed: INVALID_ARGUMENTS_OR_OUTPUT"); process.exitCode = 1;
  });
}
