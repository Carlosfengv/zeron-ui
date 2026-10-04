import { mkdtemp, rename, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { z } from "zod";
import { artifactFileUrl, artifactManifestSchema } from "./agent-artifacts.mjs";
import { frozenReleaseSchema, installationInputSchema, releaseSelectionSchema, localRecordReferenceSchema } from "./agent-release-record.mjs";
import { artifactCompletionSchema, validatePublicationSourceBindings } from "./publish-agent-artifacts.mjs";
import { catalogCandidateReviewSchema, readCatalogPublicationCandidate } from "./agent-catalog-publication.mjs";
import { createAgentCatalogRelease, parseCatalogReleaseArgs, writeCatalogCandidateFile } from "./create-agent-catalog-release.mjs";
import { readCommittedCatalogPredecessor } from "./agent-catalog-predecessor.mjs";
import { createInstallationOutput } from "./check-published-installation-input.mjs";
import { committedCiSourceFile, readRegularCiInput } from "./check-agent-ci-evidence.mjs";
import { ciVerificationReceiptSchema } from "./agent-ci-contract.mjs";
import { ciArchiveStoragePath, ciArchiveStorageSchema, privateBlobArchiveStore, retainVerifiedCiEvidence } from "./agent-ci-retention.mjs";
import { restoreAgentRelease } from "./restore-agent-release.mjs";
import { serialize, sha256, sourceProvenance } from "./agent-utils.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const reject = code => { throw Object.assign(new Error(`Release freeze rejected: ${code}`), { code }); };
const json = value => Buffer.from(serialize(value));
const same = (a, b) => serialize(a) === serialize(b);
const reference = (url, bytes) => ({ url, bytes: bytes.length, sha256: sha256(bytes) });
const localReference = (path, bytes) => ({ path, bytes: bytes.length, sha256: sha256(bytes) });
const hash = z.string().regex(/^[a-f0-9]{64}$/);
export const releaseFreezeReviewSchema = z.object({ schemaVersion: z.literal(1), kind: z.literal("agent-release-freeze"),
  status: z.literal("draft-verified-not-approved-or-deployed"), scope: z.literal("fresh-source-ci-public-stages-and-durable-handoff-checked"),
  source: installationInputSchema.shape.source, catalogVersion: hash, record: localRecordReferenceSchema,
  selection: localRecordReferenceSchema.extend({ path: z.literal("current.json") }),
  predecessor: catalogCandidateReviewSchema.shape.predecessor, candidateReviewSha256: hash, ciReceiptSha256: hash,
  ciArchive: z.object({ url: z.string().refine(value => !/[\r\n\0]/.test(value)), bytes: z.number().int().positive().max(2 * 1024 * 1024), sha256: hash }).strict(),
  storage: ciArchiveStorageSchema,
  restoration: z.object({ schemaVersion: z.literal(1), scope: z.literal("verified-frozen-record-restoration-not-deployment"), status: z.literal("passed"),
    catalogVersion: hash, versions: z.array(hash).min(1).max(3), downloadedBytes: z.number().int().nonnegative().max(512 * 1024 * 1024),
    files: z.number().int().positive(), runtimeBytes: z.number().int().positive().max(16 * 1024 * 1024) }).strict(),
}).strict().superRefine((review, context) => {
  if (review.record.path !== `${review.catalogVersion}.json` || review.restoration.catalogVersion !== review.catalogVersion
    || review.restoration.versions[0] !== review.catalogVersion || new Set(review.restoration.versions).size !== review.restoration.versions.length
    || !new RegExp(`^${review.storage.origin.replaceAll(".", "\\.")}/ci/releases/${review.catalogVersion}/[a-f0-9]{64}/index\\.json$`).test(review.ciArchive.url)) {
    context.addIssue({ code: "custom", message: "Freeze review must bind its private archive and restored versions" });
  }
});
function parseCanonical(schema, bytes) {
  let value;
  try { value = schema.parse(JSON.parse(new TextDecoder("utf8", { fatal: true }).decode(bytes))); }
  catch { reject("FREEZE_INPUT_CONTRACT"); }
  if (!bytes.equals(json(value))) reject("FREEZE_INPUT_CANONICAL");
  return value;
}

export function parseReleaseFreezeArgs(args) {
  const candidateArgs = []; let manifest;
  for (let index = 0; index < args.length; index += 2) {
    const name = args[index], value = args[index + 1];
    if (name === "--catalog-manifest") {
      if (manifest || !value || value.startsWith("--") || /[\r\n\0]/.test(value)) reject("FREEZE_ARGUMENTS");
      manifest = path.resolve(value);
    } else candidateArgs.push(name, value);
  }
  if (!manifest) reject("FREEZE_ARGUMENTS");
  return { ...parseCatalogReleaseArgs(candidateArgs), manifest };
}

/** Deterministic draft bytes, not source/CI approval. No timestamps or current deployment inference. */
export function assembleFrozenReleaseDraft({ input: rawInput, manifest: rawManifest, verificationBytes, baseline = null }) {
  const input = installationInputSchema.parse(rawInput), manifest = artifactManifestSchema.parse(rawManifest);
  if (manifest.kind !== "catalog" || !same(manifest.provenance, input.source)
    || new URL(manifest.baseUrl).origin !== input.artifactBaseUrl) reject("FREEZE_CATALOG_BINDING");
  const verification = manifest.files.find(file => file.path === "installation-verification.json");
  if (!verification || verification.bytes !== verificationBytes.length || verification.sha256 !== sha256(verificationBytes)) reject("FREEZE_REPORT_BYTES");
  if (manifest.files.length > 1024 || manifest.files.some(file => file.bytes > 16 * 1024 * 1024)
    || manifest.files.reduce((sum, file) => sum + file.bytes, 0) > 256 * 1024 * 1024) reject("FREEZE_STAGE_BUDGET");
  if (baseline && (!same(baseline.reference, baseline.history[0]) || !baseline.bytes.equals(json(baseline.record))
    || !same(baseline.reference, localReference(`${baseline.record.catalog.version}.json`, baseline.bytes)))) reject("FREEZE_PREDECESSOR_BINDING");
  const manifestBytes = json(manifest);
  const completion = artifactCompletionSchema.parse({ schemaVersion: 1, kind: "catalog", releaseId: manifest.releaseId,
    baseUrl: manifest.baseUrl, manifestUrl: artifactFileUrl(manifest.baseUrl, "manifest.json"), manifestSha256: sha256(manifestBytes),
    files: manifest.files.length, totalBytes: manifest.files.reduce((sum, file) => sum + file.bytes, 0) });
  const record = frozenReleaseSchema.parse({ schemaVersion: 1, source: input.source,
    artifactBaseUrl: input.artifactBaseUrl, siteBaseUrl: input.siteBaseUrl, registry: input.registry, skill: input.skill,
    catalog: { version: manifest.releaseId, manifest: reference(completion.manifestUrl, manifestBytes),
      completion: reference(artifactFileUrl(manifest.baseUrl, "complete.json"), json(completion)),
      installationVerification: reference(verification.url, verificationBytes) }, history: baseline?.history ?? [] });
  const recordBytes = json(record), recordReference = localReference(`${record.catalog.version}.json`, recordBytes);
  const selection = releaseSelectionSchema.parse({ schemaVersion: 1, current: recordReference });
  return { record, recordBytes, recordReference, selection, selectionBytes: json(selection) };
}

/** Full public restoration in a disposable directory; never activates the repository/application output. */
export async function verifyFrozenReleaseDraft(draft, historyFiles = new Map(), options = {}) {
  const record = parseCanonical(frozenReleaseSchema, draft.recordBytes);
  if (!same(record, draft.record) || !same(draft.recordReference, localReference(`${record.catalog.version}.json`, draft.recordBytes))
    || !same(parseCanonical(releaseSelectionSchema, draft.selectionBytes).current, draft.recordReference)) reject("FREEZE_DRAFT_BINDING");
  if (!(historyFiles instanceof Map) || !same([...historyFiles.keys()].sort(), record.history.map(ref => ref.path).sort())) reject("FREEZE_HISTORY_FILE_SET");
  for (const ref of record.history) {
    const bytes = historyFiles.get(ref.path);
    if (!Buffer.isBuffer(bytes) || bytes.length !== ref.bytes || sha256(bytes) !== ref.sha256) reject("FREEZE_HISTORY_BYTES");
  }
  const temporary = await mkdtemp(path.join(tmpdir(), "zeron-release-freeze-readback-"));
  try {
    for (const [name, bytes] of historyFiles) await writeCatalogCandidateFile(temporary, `records/${name}`, bytes);
    await writeCatalogCandidateFile(temporary, `records/${draft.recordReference.path}`, draft.recordBytes);
    return await restoreAgentRelease({ ...options, release: path.join(temporary, "records", draft.recordReference.path),
      output: path.join(temporary, "restored"), requireCommitted: false });
  } finally { await rm(temporary, { recursive: true, force: true }); }
}

/** Closed production CLI: fresh candidate/CI verification, durable handoff, then reviewable draft files. */
export async function freezeAgentRelease(args) {
  const options = parseReleaseFreezeArgs(args), candidateRoot = path.dirname(path.dirname(options.manifest));
  await createInstallationOutput(options.output, { excludeDirectories: [candidateRoot] });
  let phase = "runtime";
  try {
    if (Number(process.versions.node.split(".")[0]) !== 22) reject("NODE_22_REQUIRED");
    phase = "input";
    const manifest = parseCanonical(artifactManifestSchema, await readRegularCiInput(options.manifest));
    if (path.basename(options.manifest) !== "manifest.json") reject("FREEZE_CATALOG_MANIFEST");
    const candidate = await readCatalogPublicationCandidate(path.dirname(options.manifest), manifest);
    const input = parseCanonical(installationInputSchema, candidate.inputs.get("review/installation-input.json"));
    const captured = new Map();
    for (const [name, filename] of [["installation-input.json", options.input], ["verification.json", options.verification],
      ["examples-verification.json", options.examples], ["ci-locator.json", options.locator]]) {
      const bytes = await readRegularCiInput(filename);
      if (!bytes.equals(candidate.inputs.get(`review/${name}`))) reject("FREEZE_REVIEW_INPUT_BYTES");
      captured.set(name, bytes);
    }
    phase = "source";
    validatePublicationSourceBindings(await sourceProvenance(root), input.source);
    phase = "archive-configuration";
    const storage = parseCanonical(ciArchiveStorageSchema, await committedCiSourceFile(input.source.sourceRevision, ciArchiveStoragePath));
    const store = await privateBlobArchiveStore(storage, process.env.AGENT_CI_ARCHIVE_BLOB_TOKEN);
    phase = "committed-predecessor";
    const baseline = await readCommittedCatalogPredecessor(input.source, options.predecessor);
    const predecessor = baseline ? { approved: baseline.reference, applicationSelection: baseline.applicationSelection } : null;
    if (!same(candidate.review.predecessor, predecessor)) reject("FREEZE_PREDECESSOR_CHANGED");
    for (const [name, bytes] of captured) await writeCatalogCandidateFile(options.output, `review/inputs/${name}`, bytes);
    const rebuild = path.join(options.output, "review/rebuilt-candidate");
    phase = "fresh-source-ci-and-predecessor";
    await createAgentCatalogRelease(["--input", path.join(options.output, "review/inputs/installation-input.json"),
      "--verification", path.join(options.output, "review/inputs/verification.json"), "--examples", path.join(options.output, "review/inputs/examples-verification.json"),
      "--ci-evidence", path.join(options.output, "review/inputs/ci-locator.json"), "--predecessor", options.predecessor, "--output", rebuild]);
    const fresh = await readCatalogPublicationCandidate(path.join(rebuild, "payload"), manifest);
    if (candidate.manifestSha256 !== fresh.manifestSha256 || !same(fresh.review.predecessor, predecessor)) reject("FREEZE_REBUILT_BINDING");
    const ci = { receipt: parseCanonical(ciVerificationReceiptSchema, fresh.inputs.get("review/ci-verification.json")), privateFiles: new Map() };
    const ciReferences = [ci.receipt.consumer.archive, ci.receipt.consumer.index, ci.receipt.consumer.report,
      ci.receipt.examples.archive, ci.receipt.examples.index, ci.receipt.examples.report, ...ci.receipt.metadata.map(entry => entry.file)];
    for (const ref of ciReferences) {
      const bytes = await readRegularCiInput(path.join(rebuild, "review/ci", ref.path), ref.path.startsWith("archives/") ? 128 * 1024 * 1024 : 2 * 1024 * 1024);
      if (bytes.length !== ref.bytes || sha256(bytes) !== ref.sha256) reject("FREEZE_CI_OUTPUT_BYTES");
      ci.privateFiles.set(ref.path, bytes);
    }
    const draft = assembleFrozenReleaseDraft({ input, manifest, verificationBytes: captured.get("verification.json"), baseline });
    const historyFiles = new Map();
    for (const ref of draft.record.history) historyFiles.set(ref.path, await committedCiSourceFile(input.source.sourceRevision, `docs/agent-data/releases/${ref.path}`));
    phase = "public-three-stage-readback";
    const restoration = await verifyFrozenReleaseDraft(draft, historyFiles);
    await writeCatalogCandidateFile(options.output, "review/public-restoration.json", json(restoration));
    phase = "source-before-retention";
    validatePublicationSourceBindings(await sourceProvenance(root), input.source);
    if ((await readCatalogPublicationCandidate(path.dirname(options.manifest), manifest)).reviewSha256 !== candidate.reviewSha256) reject("FREEZE_CANDIDATE_CHANGED");
    phase = "durable-ci-handoff";
    const handoff = await retainVerifiedCiEvidence({ input, locator: JSON.parse(captured.get("ci-locator.json").toString("utf8")), ci,
      recordBytes: draft.recordBytes, selectionBytes: draft.selectionBytes, config: storage }, { store });
    await writeCatalogCandidateFile(options.output, "review/ci-handoff.json", json(handoff));
    phase = "source-final";
    validatePublicationSourceBindings(await sourceProvenance(root), input.source);
    if ((await readCatalogPublicationCandidate(path.dirname(options.manifest), manifest)).reviewSha256 !== candidate.reviewSha256) reject("FREEZE_CANDIDATE_CHANGED");
    const report = releaseFreezeReviewSchema.parse({ schemaVersion: 1, kind: "agent-release-freeze", status: "draft-verified-not-approved-or-deployed",
      scope: "fresh-source-ci-public-stages-and-durable-handoff-checked", source: input.source, catalogVersion: manifest.releaseId,
      record: draft.recordReference, selection: localReference("current.json", draft.selectionBytes),
      predecessor, candidateReviewSha256: candidate.reviewSha256, ciArchive: handoff.index,
      storage, restoration, ciReceiptSha256: sha256(json(ci.receipt)) });
    await writeCatalogCandidateFile(options.output, ".release-draft-stage/current.json", draft.selectionBytes);
    await writeCatalogCandidateFile(options.output, `.release-draft-stage/${draft.recordReference.path}`, draft.recordBytes);
    await writeCatalogCandidateFile(options.output, "freeze-review.json", json(report));
    await rename(path.join(options.output, ".release-draft-stage"), path.join(options.output, "releases"));
    validatePublicationSourceBindings(await sourceProvenance(root), input.source);
    if ((await readCatalogPublicationCandidate(path.dirname(options.manifest), manifest)).reviewSha256 !== candidate.reviewSha256) reject("FREEZE_CANDIDATE_CHANGED");
    return { status: report.status, scope: report.scope, catalogVersion: manifest.releaseId, output: options.output };
  } catch (error) {
    await rm(path.join(options.output, "releases"), { recursive: true, force: true });
    await rm(path.join(options.output, ".release-draft-stage"), { recursive: true, force: true });
    await rm(path.join(options.output, "freeze-review.json"), { force: true });
    const code = /^[A-Z][A-Z0-9_]{0,63}$/.test(error.code ?? "") ? error.code : "FREEZE_FAILED";
    await writeCatalogCandidateFile(options.output, "failure.json", json({ schemaVersion: 1, kind: "agent-release-freeze-failure", status: "failed", phase, code }));
    throw Object.assign(new Error(`Release freeze failed: ${code}`), { code });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  freezeAgentRelease(process.argv.slice(2)).then(result => console.log(serialize(result))).catch(error => {
    console.error(error.code ? `Release freeze failed: ${error.code}` : "Release freeze failed: INVALID_ARGUMENTS_OR_OUTPUT");
    process.exitCode = 1;
  });
}
