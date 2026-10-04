import { constants } from "node:fs";
import { lstat, open, readdir, realpath, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { installationInputSchema, publicByteReferenceSchema, publishedInstallationVerificationSchema } from "./agent-release-record.mjs";
import { exampleVerificationSchema } from "./agent-example-evidence.mjs";
import { exampleSourcesSha256 } from "./agent-example-sources.mjs";
import { consumerEvidenceSchema } from "./published-consumer-evidence.mjs";
import { serialize, sha256 } from "./agent-utils.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const maxFileBytes = 32 * 1024 * 1024;
const maxTotalBytes = 256 * 1024 * 1024;
const hash = z.string().regex(/^[a-f0-9]{64}$/);
export const executionPathSchema = z.string().min(1).max(256).regex(/^[A-Za-z0-9._/-]+$/)
  .refine(value => !value.startsWith("/") && value.split("/").every(part => part && part !== "." && part !== ".."), "Unsafe execution path");
const file = z.object({ path: executionPathSchema, bytes: z.number().int().nonnegative().max(maxFileBytes), sha256: hash }).strict();
const locator = z.object({
  repository: z.string().max(200).regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/),
  workflowRef: z.string().max(512).regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/\.github\/workflows\/[A-Za-z0-9_.-]+\.ya?ml@refs\/[A-Za-z0-9_./-]+$/),
  runId: z.number().int().positive().max(Number.MAX_SAFE_INTEGER),
  runAttempt: z.number().int().positive().max(Number.MAX_SAFE_INTEGER), headSha: z.string().regex(/^[a-f0-9]{40}$/),
}).strict();
export const executionRoles = {
  consumer: { producer: "scripts/test-published-consumer-installs.mjs", report: "verification.json", worker: null },
  examples: { producer: "scripts/test-published-examples.mjs", report: "examples-verification.json", worker: "scripts/agent-example-browser.mjs" },
};
const publicAttachment = publicByteReferenceSchema.extend({ path: executionPathSchema }).strict();
export const executionIndexSchema = z.object({
  schemaVersion: z.literal(1), kind: z.literal("agent-release-execution-index"),
  scope: z.literal("archive-byte-binding-not-a-trusted-ci-attestation"),
  role: z.enum(["consumer", "examples"]), resultKind: z.enum(["published", "local"]),
  source: installationInputSchema.shape.source, inputSha256: hash,
  report: file.extend({ bytes: z.number().int().positive().max(2 * 1024 * 1024) }),
  producer: file, worker: file.nullable(), workflowLocator: locator.nullable(),
  outputFiles: z.array(file).min(1).max(1023), publicAttachments: z.array(publicAttachment).min(1).max(1024),
}).strict().superRefine((index, context) => {
  const issue = message => context.addIssue({ code: "custom", message });
  const role = executionRoles[index.role];
  if (index.producer.path !== role.producer || (index.worker?.path ?? null) !== role.worker) issue("Unexpected execution source path");
  if (index.report.path !== (index.resultKind === "published" ? role.report : "local-verification.json")) issue("Unexpected execution report path");
  const paths = index.outputFiles.map(item => item.path);
  if (paths.includes("execution-index.json") || new Set(paths).size !== paths.length
    || paths.some((value, i) => i && paths[i - 1] >= value)) issue("Execution output files must be unique and sorted");
  if (serialize(index.outputFiles.find(item => item.path === index.report.path)) !== serialize(index.report)) issue("Report must belong to exact output inventory");
  if (index.outputFiles.reduce((total, item) => total + item.bytes, 0) + Buffer.byteLength(serialize(index)) > maxTotalBytes) issue("Execution output byte budget");
  const directories = new Set(paths.flatMap(name => name.split("/").slice(0, -1).map((_, i) => name.split("/").slice(0, i + 1).join("/"))));
  if (paths.length + directories.size + 1 > 1024) issue("Execution ZIP entry budget including directories");
  if (paths.some(name => directories.has(name))) issue("Execution file/directory path collision");
  const urls = index.publicAttachments.map(item => item.url);
  if (new Set(urls).size !== urls.length || urls.some((value, i) => i && urls[i - 1] >= value)) issue("Attachment URLs must be unique and sorted");
  for (const attachment of index.publicAttachments) {
    const descriptor = index.outputFiles.find(item => item.path === attachment.path);
    if (!descriptor || descriptor.bytes !== attachment.bytes || descriptor.sha256 !== attachment.sha256) issue("Attachment missing from output inventory");
    const namespace = index.role === "consumer" ? "consumer" : "examples";
    const extension = index.role === "consumer" ? "json" : attachment.url.endsWith(".png") ? "png" : "json";
    if (new URL(attachment.url).pathname !== `/evidence/${namespace}/${attachment.sha256}.${extension}`) issue("Attachment content address differs");
  }
  if (index.workflowLocator && index.workflowLocator.headSha !== index.source.sourceRevision) issue("CI locator must name the same source revision");
});

export class ExecutionIndexError extends Error {
  constructor(code) { super(`Execution index rejected: ${code}`); this.code = code; }
}
const fail = code => { throw new ExecutionIndexError(code); };
const descriptor = (name, bytes) => ({ path: name, bytes: bytes.length, sha256: sha256(bytes) });
const sorted = rows => rows.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);

/** Environment fields are locators, never a statement that CI is trusted. */
export function executionWorkflowLocator(environment = process.env) {
  if (environment.GITHUB_ACTIONS !== "true") return null;
  const integer = key => /^\d+$/.test(environment[key] ?? "") ? Number(environment[key]) : NaN;
  return locator.parse({ repository: environment.GITHUB_REPOSITORY, workflowRef: environment.GITHUB_WORKFLOW_REF,
    runId: integer("GITHUB_RUN_ID"), runAttempt: integer("GITHUB_RUN_ATTEMPT"), headSha: environment.GITHUB_SHA });
}

async function readRegularFile(owner, relative) {
  executionPathSchema.parse(relative);
  const target = path.join(owner, relative);
  if (await realpath(target) !== target) fail("SOURCE_OR_OUTPUT_SYMLINK");
  const handle = await open(target, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    const before = await handle.stat();
    if (!before.isFile() || before.size > maxFileBytes) fail("FILE_BUDGET_OR_TYPE");
    const chunks = []; let size = 0;
    for await (const chunk of handle.createReadStream({ autoClose: false })) {
      size += chunk.length;
      if (size > maxFileBytes || size > before.size) fail("FILE_CHANGED_OR_BUDGET");
      chunks.push(chunk);
    }
    const after = await handle.stat();
    if (size !== before.size || after.size !== before.size || after.mtimeMs !== before.mtimeMs) fail("FILE_CHANGED_OR_BUDGET");
    return Buffer.concat(chunks);
  } finally { await handle.close(); }
}
async function outputInventory(directory) {
  const files = new Map(); let total = 0;
  async function visit(relative = "") {
    for (const entry of await readdir(path.join(directory, relative), { withFileTypes: true })) {
      const name = relative ? `${relative}/${entry.name}` : entry.name;
      executionPathSchema.parse(name);
      if (entry.isDirectory()) await visit(name);
      else {
        if (!entry.isFile()) fail("OUTPUT_NOT_REGULAR");
        if (files.size >= 1022) fail("OUTPUT_FILE_BUDGET");
        const bytes = await readRegularFile(directory, name); total += bytes.length;
        if (total > maxTotalBytes) fail("OUTPUT_BYTE_BUDGET");
        files.set(name, bytes);
      }
    }
  }
  await visit(); return files;
}

const localConsumerSchema = z.object({ schemaVersion: z.literal(1), kind: z.literal("local-consumer-verification"),
  status: z.literal("tested-local-evidence"), scope: z.literal("actual-consumers-without-public-evidence-not-a-frozen-release-input"),
  source: installationInputSchema.shape.source, matrices: z.array(consumerEvidenceSchema.shape.matrix).length(4) }).strict()
  .refine(report => new Set(report.matrices.map(row => `${row.framework}-${row.packageManager}`)).size === 4, "Complete consumer matrix required");
const localExampleSchema = z.object({ schemaVersion: z.literal(1), kind: z.literal("local-example-execution"),
  status: z.literal("actual-checks-without-public-evidence"), scope: z.literal("not-a-formal-release-or-trusted-ci-attestation"),
  verification: exampleVerificationSchema }).strict();

function verifyRequiredLogs(files, index, report, input) {
  const command = (name, step, expectedExit = 0) => {
    const bytes = files.get(name);
    let record;
    try { record = JSON.parse(bytes?.toString("utf8")); } catch { fail("EXECUTION_LOG_MISSING"); }
    if (!bytes.equals(Buffer.from(serialize(record))) || record.step !== step || typeof record.file !== "string"
      || !Array.isArray(record.args) || !record.args.every(value => typeof value === "string")
      || typeof record.stdout !== "string" || typeof record.stderr !== "string" || record.code != null
      || (expectedExit === "nonzero" ? !Number.isInteger(record.exitCode) || record.exitCode <= 0 : record.exitCode !== expectedExit)) fail("EXECUTION_LOG_RESULT");
    return record;
  };
  command("private-logs/reference-manager-version.json", "reference-manager-version");
  command("private-logs/cli-reference.json", "cli-reference");
  const profiles = index.role === "consumer" ? report.matrices : (index.resultKind === "published" ? report : report.verification).sourceManifest.declarations.examples[0].profiles;
  for (const profile of profiles) {
    const base = `private-logs/${profile.framework}-${profile.packageManager}`;
    for (const step of ["manager-version", "bootstrap", "cli-version", "dry-run", "install", "types", "build"]) {
      const record = command(`${base}/${step}.json`, step);
      if (["types", "build"].includes(step) && (record.file !== profile.packageManager || serialize(record.args) !== serialize(["run", step]))) fail("EXECUTION_LOG_COMMAND");
    }
    if (profile.framework === "vite") {
      const rejection = command(`${base}/next-only-rejection.json`, "next-only-rejection", "nonzero");
      const name = input?.items.find(item => item.id === input.nextOnlyRejectionItem)?.registryName;
      if (name && !`${rejection.stdout}\n${rejection.stderr}`.includes(`${name} requires Next.js`)) fail("EXECUTION_LOG_REJECTION");
    }
    if (index.role === "examples") {
      command(`${base}/browser-process.json`, "browser");
      if (!files.has(`${base}/preview.json`) || !files.has(`${profile.framework}-${profile.packageManager}-browser/observations.json`)) fail("EXECUTION_LOG_MISSING");
    }
  }
}

function parseReport(index, bytes, input) {
  if (bytes.length !== index.report.bytes || sha256(bytes) !== index.report.sha256) fail("REPORT_BYTES");
  let report;
  try {
    const value = JSON.parse(bytes.toString("utf8"));
    const schema = index.resultKind === "published" ? index.role === "consumer" ? publishedInstallationVerificationSchema : exampleVerificationSchema
      : index.role === "consumer" ? localConsumerSchema : localExampleSchema;
    report = schema.parse(value);
    if (!bytes.equals(Buffer.from(serialize(report)))) fail("REPORT_NON_CANONICAL");
  } catch (error) { if (error instanceof ExecutionIndexError) throw error; fail("REPORT_CONTRACT"); }
  if (index.role === "examples") {
    const value = index.resultKind === "published" ? report : report.verification;
    const key = row => `${row.exampleId}:${row.framework}:${row.packageManager}`;
    const expected = value.sourceManifest.declarations.examples.flatMap(example => example.profiles.map(profile => key({ exampleId: example.exampleId, ...profile })));
    if (serialize(value.rows.map(key)) !== serialize(expected) || value.binding.exampleSourcesSha256 !== exampleSourcesSha256(value.sourceManifest)) fail("EXAMPLE_PROFILE_SET");
    for (const row of value.rows) {
      const declaration = value.sourceManifest.declarations.examples.find(example => example.exampleId === row.exampleId);
      if (serialize(row.adoptedItems) !== serialize(declaration.adoptedItems) || serialize(row.checks.viewports.map(view => view.width)) !== serialize([390, 1440])) fail("EXAMPLE_REPORT_SCOPE");
    }
  }
  if (input) {
    if (serialize(index.source) !== serialize(input.source) || index.inputSha256 !== sha256(serialize(input))) fail("INPUT_BINDING");
    if (index.role === "examples") {
      const binding = (index.resultKind === "published" ? report : report.verification).binding;
      if (serialize(binding.source) !== serialize(input.source) || binding.inputSha256 !== index.inputSha256
        || serialize(binding.registry) !== serialize(input.registry) || serialize(binding.skill) !== serialize(input.skill)
        || Object.keys(input.cli).some(key => binding.cli[key] !== input.cli[key])) fail("EXAMPLE_REPORT_BINDING");
    } else if (index.resultKind === "published") {
      if (report.sourceRevision !== input.source.sourceRevision || Object.keys(input.cli).some(key => report.cli[key] !== input.cli[key])
        || report.registry.releaseId !== input.registry.releaseId || report.registry.manifestSha256 !== input.registry.manifest.sha256
        || report.registry.baseUrl !== `${input.artifactBaseUrl}/r/releases/${input.registry.releaseId}`) fail("CONSUMER_REPORT_BINDING");
    } else if (serialize(report.source) !== serialize(input.source)) fail("CONSUMER_REPORT_BINDING");
  }
  return report;
}

/** Pure byte verification. A platform run/attempt/job verifier must establish execution trust separately. */
export function verifyExecutionArchive(files, { role, input: rawInput, requirePublished = true, sourceFiles } = {}) {
  if (!(files instanceof Map) || files.size > 1024 || [...files].some(([name, bytes]) => !executionPathSchema.safeParse(name).success || !Buffer.isBuffer(bytes)
    || bytes.length > maxFileBytes) || [...files.values()].reduce((sum, bytes) => sum + bytes.length, 0) > maxTotalBytes) fail("ARCHIVE_BUDGET_OR_PATH");
  const bytes = files.get("execution-index.json");
  if (!bytes || bytes.length > 2 * 1024 * 1024) fail("INDEX_MISSING_OR_BUDGET");
  let index;
  try { index = executionIndexSchema.parse(JSON.parse(bytes.toString("utf8"))); }
  catch { fail("INDEX_CONTRACT"); }
  if (!bytes.equals(Buffer.from(serialize(index)))) fail("INDEX_NON_CANONICAL");
  if (role && index.role !== role) fail("INDEX_ROLE");
  if (requirePublished && index.resultKind !== "published") fail("LOCAL_RESULT_NOT_RELEASE_INPUT");
  const input = rawInput ? installationInputSchema.parse(rawInput) : null;
  if (files.size !== index.outputFiles.length + 1) fail("ARCHIVE_FILE_SET");
  for (const entry of index.outputFiles) {
    const value = files.get(entry.path);
    if (!value || value.length !== entry.bytes || sha256(value) !== entry.sha256) fail("ARCHIVE_FILE_BYTES");
  }
  for (const entry of [index.producer, index.worker].filter(Boolean)) {
    if (sourceFiles) {
      const value = sourceFiles.get(entry.path);
      if (!Buffer.isBuffer(value) || value.length !== entry.bytes || sha256(value) !== entry.sha256) fail("EXECUTION_SOURCE_BYTES");
    }
  }
  const report = parseReport(index, files.get(index.report.path), input);
  verifyRequiredLogs(files, index, report, input);
  const attachments = new Map();
  for (const attachment of index.publicAttachments) {
    if (input && new URL(attachment.url).origin !== input.artifactBaseUrl) fail("ATTACHMENT_ORIGIN");
    attachments.set(attachment.url, files.get(attachment.path));
  }
  const refs = index.role === "consumer" && index.resultKind === "published" ? report.matrices.map(row => row.evidence)
    : index.role === "examples" ? (index.resultKind === "published" ? report : report.verification).rows.flatMap(row => [row.checks.install, row.checks.types,
      row.checks.build, row.checks.states, row.checks.keyboard, ...row.checks.viewports.flatMap(viewport => [viewport.evidence, viewport.screenshot])]) : [];
  if (refs.length && (new Set(refs.map(ref => ref.url)).size !== attachments.size || refs.some(ref => {
    const value = attachments.get(ref.url); return !value || value.length !== ref.bytes || sha256(value) !== ref.sha256;
  }))) fail("REPORT_ATTACHMENT_SET");
  if (index.role === "consumer") {
    for (const row of report.matrices) {
      const value = files.get(`${row.framework}-${row.packageManager}.evidence.json`);
      let evidence;
      try { evidence = consumerEvidenceSchema.parse(JSON.parse(value?.toString("utf8"))); }
      catch { fail("CONSUMER_EVIDENCE_CONTRACT"); }
      const { evidence: _reference, ...matrix } = row;
      if (!value.equals(Buffer.from(serialize(evidence))) || serialize(evidence.matrix) !== serialize(matrix)
        || serialize(evidence.source) !== serialize(index.source) || evidence.inputSha256 !== index.inputSha256
        || (index.resultKind === "published" && (!attachments.get(row.evidence.url)?.equals(value) || serialize(evidence.cli) !== serialize(report.cli)))) fail("CONSUMER_EVIDENCE_BINDING");
      if (input && (serialize(evidence.registry) !== serialize({ releaseId: input.registry.releaseId, manifest: input.registry.manifest })
        || Object.keys(input.cli).some(key => evidence.cli[key] !== input.cli[key])
        || serialize(row.testedItems) !== serialize(input.matrices.find(profile => profile.framework === row.framework && profile.packageManager === row.packageManager)?.testedItems))) fail("CONSUMER_EVIDENCE_INPUT");
    }
  }
  return { index, report, attachments, scope: "archive-byte-binding-not-a-trusted-ci-attestation" };
}

/** Only called after actual execution and, in published mode, anonymous attachment readback. */
export async function writeExecutionResult({ output, input: rawInput, role, resultKind, report, publicAttachments }) {
  const input = installationInputSchema.parse(rawInput), paths = executionRoles[role];
  if (!paths) fail("INDEX_ROLE");
  const owner = await realpath(output);
  const reportPath = resultKind === "published" ? paths.report : "local-verification.json";
  for (const name of ["execution-index.json", reportPath]) {
    try { await lstat(path.join(owner, name)); fail("OUTPUT_ALREADY_EXISTS"); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
  }
  const reportBytes = Buffer.from(serialize(report));
  const files = await outputInventory(owner);
  files.set(reportPath, reportBytes);
  const source = async name => descriptor(name, await readRegularFile(root, name));
  const index = executionIndexSchema.parse({ schemaVersion: 1, kind: "agent-release-execution-index",
    scope: "archive-byte-binding-not-a-trusted-ci-attestation", role, resultKind, source: input.source, inputSha256: sha256(serialize(input)),
    report: descriptor(reportPath, reportBytes), producer: await source(paths.producer), worker: paths.worker ? await source(paths.worker) : null,
    workflowLocator: executionWorkflowLocator(), outputFiles: sorted([...files].map(([name, bytes]) => descriptor(name, bytes))),
    publicAttachments: [...publicAttachments].sort((a, b) => a.url < b.url ? -1 : a.url > b.url ? 1 : 0) });
  files.set("execution-index.json", Buffer.from(serialize(index)));
  verifyExecutionArchive(files, { role, input, requirePublished: false });
  // Write the index first. Exclusive report creation prevents an old result becoming this run's success.
  const handle = await open(path.join(owner, "execution-index.json"), "wx", 0o600);
  try { await handle.writeFile(serialize(index)); } finally { await handle.close(); }
  let result;
  try {
    result = await open(path.join(owner, reportPath), "wx", 0o600);
    await result.writeFile(reportBytes); await result.close(); result = null;
  } catch (error) {
    if (result) { try { await result.close(); } finally { await rm(path.join(owner, reportPath), { force: true }); } }
    throw error;
  }
  return index;
}
