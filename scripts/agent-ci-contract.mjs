import { z } from "zod";
import { installationInputSchema } from "./agent-release-record.mjs";
import { executionPathSchema } from "./agent-execution-index.mjs";

export const ciTrustPath = "docs/agent-data/ci-trust.json";
const positive = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const revision = z.string().regex(/^[a-f0-9]{40}$/);
const step = z.string().min(1).max(128).regex(/^[A-Za-z0-9 ._-]+$/);
const role = z.object({ name: step, executeStep: step, archiveCheckStep: step, uploadStep: step,
  artifactPrefix: z.string().regex(/^[a-z][a-z0-9-]{0,79}$/) }).strict();
/** Only the reviewed source tree selects these identities, never a downloaded report. */
export const ciTrustPolicySchema = z.object({
  schemaVersion: z.literal(1), provider: z.literal("github-actions"), repository: z.literal("Carlosfengv/zeron-ui"),
  branch: z.literal("main"), workflowPath: z.literal(".github/workflows/agent-release-validation.yml"),
  workflowName: z.literal("Agent release validation"),
  jobs: z.object({ consumer: role, examples: role }).strict(),
  archiveDownloadHosts: z.array(z.enum(["*.actions.githubusercontent.com", "*.blob.core.windows.net", "objects.githubusercontent.com"])).min(1).max(3),
}).strict().superRefine((policy, context) => {
  if (policy.jobs.consumer.name === policy.jobs.examples.name || policy.jobs.consumer.artifactPrefix === policy.jobs.examples.artifactPrefix
    || new Set(policy.archiveDownloadHosts).size !== policy.archiveDownloadHosts.length) context.addIssue({ code: "custom", message: "Ambiguous CI policy identity" });
  for (const job of Object.values(policy.jobs)) if (new Set([job.executeStep, job.archiveCheckStep, job.uploadStep]).size !== 3) context.addIssue({ code: "custom", message: "Execution, content check and upload must be separate steps" });
});
export const ciRoleLocatorSchema = z.object({ runId: positive, runAttempt: positive, jobId: positive, artifactId: positive }).strict();
export const ciLocatorSchema = z.object({ schemaVersion: z.literal(1), consumer: ciRoleLocatorSchema, examples: ciRoleLocatorSchema }).strict()
  .refine(value => value.consumer.jobId !== value.examples.jobId && value.consumer.artifactId !== value.examples.artifactId
    && (value.consumer.runId !== value.examples.runId || value.consumer.runAttempt === value.examples.runAttempt), "Do not mix roles or attempts");
const byteCount = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
const descriptor = z.object({ path: executionPathSchema, bytes: byteCount.max(256 * 1024 * 1024), sha256: hash }).strict();
const roleResult = z.object({ ...ciRoleLocatorSchema.shape, branch: z.literal("main"), workflowId: positive,
  archive: descriptor.extend({ bytes: positive.max(128 * 1024 * 1024) }), index: descriptor, report: descriptor,
  publicAttachments: z.number().int().positive().max(128), jobStartedAt: z.string().datetime(), jobCompletedAt: z.string().datetime(),
}).strict();
export const ciVerificationReceiptSchema = z.object({
  schemaVersion: z.literal(1), kind: z.literal("agent-ci-verification"), status: z.literal("verified-platform-archives-and-public-bytes"),
  scope: z.literal("ci-evidence-gate-not-catalog-publication-or-deployment"), provider: z.literal("github-actions"),
  repository: z.literal("Carlosfengv/zeron-ui"), source: installationInputSchema.shape.source, inputSha256: hash, policySha256: hash,
  protectedSource: z.object({ branch: z.literal("main"), branchHeadSha: revision, workflowSha256: hash,
    protection: z.enum(["classic", "ruleset"]) }).strict(),
  consumer: roleResult, examples: roleResult,
  metadata: z.array(z.object({ endpoint: z.string().min(1).max(1000), file: descriptor }).strict()).min(1).max(100),
  consumedArchiveBytes: byteCount.max(768 * 1024 * 1024), consumedPublicBytes: byteCount.max(512 * 1024 * 1024),
}).strict();
export class CiTrustError extends Error {
  constructor(code, retryable = false) { super(`CI verification rejected: ${code}`); this.code = code; this.retryable = retryable; }
}
export const rejectCi = code => { throw new CiTrustError(code); };
export const ciArtifactName = (policy, role, locator) => `${policy.jobs[role].artifactPrefix}-${locator.runId}-${locator.runAttempt}`;
