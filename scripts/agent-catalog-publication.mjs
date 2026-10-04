import { lstat, mkdir, mkdtemp, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { installationInputSchema, localRecordReferenceSchema, frozenReleaseSchema } from "./agent-release-record.mjs";
import { artifactManifestSchema, verifyArtifactDirectory } from "./agent-artifacts.mjs";
import { verifyCatalogReleaseFiles } from "./agent-catalog-release.mjs";
import { readRegularCiInput } from "./check-agent-ci-evidence.mjs";
import { ciLocatorSchema, ciVerificationReceiptSchema } from "./agent-ci-contract.mjs";
import { createAgentCatalogRelease } from "./create-agent-catalog-release.mjs";
import { validatePublicationSourceBindings } from "./publish-agent-artifacts.mjs";
import { serialize, sha256, sourceProvenance } from "./agent-utils.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const hash = z.string().regex(/^[a-f0-9]{64}$/);
const inputNames = ["installation-input.json", "verification.json", "examples-verification.json", "ci-locator.json", "ci-verification.json"];
const byteReference = z.object({ path: z.string(), bytes: z.number().int().positive().max(2 * 1024 * 1024), sha256: hash }).strict();
export const catalogCandidateReviewSchema = z.object({
  schemaVersion: z.literal(1), kind: z.literal("agent-catalog-candidate"), status: z.literal("candidate-validated-not-published"),
  scope: z.literal("fixed-source-ci-and-predecessor-checked-not-publication-or-deployment"),
  source: installationInputSchema.shape.source, catalogVersion: hash,
  manifest: byteReference.extend({ path: z.literal("payload/manifest.json") }),
  inputs: z.array(byteReference.extend({ path: z.enum([...inputNames.map(name => `review/${name}`), "review/predecessor.json"]) })).min(5).max(6),
  predecessor: z.object({ approved: localRecordReferenceSchema, applicationSelection: localRecordReferenceSchema }).strict().nullable(),
}).strict().superRefine((review, context) => {
  const expected = [...inputNames.map(name => `review/${name}`), ...(review.predecessor ? ["review/predecessor.json"] : [])];
  if (serialize(review.inputs.map(ref => ref.path)) !== serialize(expected)) context.addIssue({ code: "custom", message: "Keep exactly the ordered candidate inputs" });
});
const fail = code => { throw Object.assign(new Error(`Catalog publication rejected: ${code}`), { code }); };
const same = (a, b) => serialize(a) === serialize(b);
function canonicalInput(schema, bytes) {
  let value;
  try { value = schema.parse(JSON.parse(new TextDecoder("utf8", { fatal: true }).decode(bytes))); }
  catch { fail("CATALOG_REVIEW_INPUT_CONTRACT"); }
  if (!bytes.equals(Buffer.from(serialize(value)))) fail("CATALOG_REVIEW_INPUT_CANONICAL");
  return value;
}

/** Local bytes only. A valid review file never substitutes for a fresh production gate. */
export async function readCatalogPublicationCandidate(directory, input) {
  const manifest = artifactManifestSchema.parse(input);
  if (manifest.kind !== "catalog" || path.basename(directory) !== "payload") fail("CATALOG_CANDIDATE_LAYOUT");
  if (manifest.files.length > 1024 || manifest.files.some(file => file.bytes > 16 * 1024 * 1024)
    || manifest.files.reduce((sum, file) => sum + file.bytes, 0) > 256 * 1024 * 1024) fail("CATALOG_STAGE_BUDGET");
  const candidate = path.dirname(directory), physicalRoot = await realpath(candidate);
  for (const folder of [directory, path.join(candidate, "review")]) {
    const stat = await lstat(folder);
    if (!stat.isDirectory() || stat.isSymbolicLink()) fail("CATALOG_CANDIDATE_LAYOUT");
  }
  const read = async relative => {
    const filename = path.join(candidate, relative), physical = await realpath(filename);
    const owned = path.relative(physicalRoot, physical);
    if (owned === "" || owned.startsWith(`..${path.sep}`) || owned === ".." || path.isAbsolute(owned)) fail("CATALOG_REVIEW_LOCATION");
    return readRegularCiInput(filename);
  };
  const reviewBytes = await read("candidate-review.json"); let review;
  try { review = catalogCandidateReviewSchema.parse(JSON.parse(new TextDecoder("utf8", { fatal: true }).decode(reviewBytes))); }
  catch { fail("CATALOG_REVIEW_CONTRACT"); }
  if (!reviewBytes.equals(Buffer.from(serialize(review)))) fail("CATALOG_REVIEW_CANONICAL");
  const manifestBytes = await read("payload/manifest.json");
  if (!same(review.source, manifest.provenance) || review.catalogVersion !== manifest.releaseId
    || manifestBytes.length !== review.manifest.bytes || sha256(manifestBytes) !== review.manifest.sha256
    || !manifestBytes.equals(Buffer.from(serialize(manifest)))) fail("CATALOG_REVIEW_MANIFEST_BINDING");
  const inputs = new Map();
  for (const ref of review.inputs) {
    const bytes = await read(ref.path);
    if (bytes.length !== ref.bytes || sha256(bytes) !== ref.sha256) fail("CATALOG_REVIEW_INPUT_BYTES");
    inputs.set(ref.path, bytes);
  }
  if (review.predecessor) {
    const bytes = inputs.get("review/predecessor.json"); let record;
    try { record = frozenReleaseSchema.parse(JSON.parse(bytes.toString("utf8"))); } catch { fail("CATALOG_REVIEW_PREDECESSOR_CONTRACT"); }
    const reference = review.predecessor.approved;
    if (bytes.length !== reference.bytes || sha256(bytes) !== reference.sha256 || reference.path !== `${record.catalog.version}.json`) fail("CATALOG_REVIEW_PREDECESSOR_BYTES");
  }
  await verifyArtifactDirectory(directory, manifest);
  const files = new Map();
  const physicalPayload = await realpath(directory);
  for (const file of manifest.files) {
    const physical = await realpath(path.join(directory, file.path));
    if (!physical.startsWith(`${physicalPayload}${path.sep}`)) fail("CATALOG_PAYLOAD_LOCATION");
    const bytes = await readRegularCiInput(path.join(directory, file.path), 16 * 1024 * 1024);
    if (bytes.length !== file.bytes || sha256(bytes) !== file.sha256) fail("CATALOG_PAYLOAD_CHANGED");
    files.set(file.path, bytes);
  }
  const verified = await verifyCatalogReleaseFiles(files, manifest);
  if (!verified.examples || verified.examples.verification.rows.length !== 12
    || verified.examples.sources.manifest.declarations.examples.some(example => example.profiles.length !== 4)) fail("CATALOG_FULL_EXAMPLES_REQUIRED");
  for (const [reviewPath, payloadPath] of [["review/installation-input.json", "examples/installation-input.json"],
    ["review/verification.json", "installation-verification.json"], ["review/examples-verification.json", "examples/verification.json"]]) {
    if (!inputs.get(reviewPath).equals(files.get(payloadPath))) fail("CATALOG_REVIEW_PAYLOAD_BINDING");
  }
  const installation = canonicalInput(installationInputSchema, inputs.get("review/installation-input.json"));
  const locator = canonicalInput(ciLocatorSchema, inputs.get("review/ci-locator.json"));
  const receipt = canonicalInput(ciVerificationReceiptSchema, inputs.get("review/ci-verification.json"));
  if (!same(installation.source, manifest.provenance) || !same(receipt.source, manifest.provenance)
    || receipt.inputSha256 !== sha256(inputs.get("review/installation-input.json"))) fail("CATALOG_REVIEW_CI_BINDING");
  for (const [role, filename] of [["consumer", "verification.json"], ["examples", "examples-verification.json"]]) {
    if (["runId", "runAttempt", "jobId", "artifactId"].some(key => receipt[role][key] !== locator[role][key])
      || receipt[role].report.bytes !== inputs.get(`review/${filename}`).length
      || receipt[role].report.sha256 !== sha256(inputs.get(`review/${filename}`))) fail("CATALOG_REVIEW_CI_BINDING");
  }
  return { review, reviewSha256: sha256(reviewBytes), inputs, manifestSha256: sha256(manifestBytes), files };
}

/** Rebuild through the same closed production CLI, including real CI and public predecessor checks. */
export async function verifyCatalogPublicationSource(directory, manifest) {
  if (Number(process.versions.node.split(".")[0]) !== 22) fail("NODE_22_REQUIRED");
  validatePublicationSourceBindings(await sourceProvenance(root), manifest.provenance);
  const original = await readCatalogPublicationCandidate(directory, manifest);
  const temporary = await mkdtemp(path.join(tmpdir(), "zeron-catalog-publication-gate-"));
  try {
    const inputs = path.join(temporary, "inputs");
    // Use the captured exact review bytes, not mutable paths that could change during verification.
    await mkdir(inputs, { mode: 0o700 });
    for (const name of inputNames) await writeFile(path.join(inputs, name), original.inputs.get(`review/${name}`), { flag: "wx", mode: 0o600 });
    const output = path.join(temporary, "candidate");
    await createAgentCatalogRelease(["--input", path.join(inputs, "installation-input.json"),
      "--verification", path.join(inputs, "verification.json"), "--examples", path.join(inputs, "examples-verification.json"),
      "--ci-evidence", path.join(inputs, "ci-locator.json"), "--predecessor", original.review.predecessor
        ? path.join(root, "docs/agent-data/releases", original.review.predecessor.approved.path) : "none", "--output", output]);
    const rebuilt = await readCatalogPublicationCandidate(path.join(output, "payload"), manifest);
    if (rebuilt.manifestSha256 !== original.manifestSha256 || !same(rebuilt.review.predecessor, original.review.predecessor)) fail("CATALOG_REBUILT_BINDING");
    const final = await readCatalogPublicationCandidate(directory, manifest);
    if (final.reviewSha256 !== original.reviewSha256) fail("CATALOG_REVIEW_CHANGED");
    validatePublicationSourceBindings(await sourceProvenance(root), manifest.provenance);
    return { source: manifest.provenance, reviewSha256: original.reviewSha256, manifestSha256: original.manifestSha256 };
  } finally { await rm(temporary, { recursive: true, force: true }); }
}

/** Called after the upload controller captures immutable bodies, before its first network operation. */
export async function confirmCatalogPublicationGate(directory, manifest, gate) {
  validatePublicationSourceBindings(await sourceProvenance(root), gate.source);
  const candidate = await readCatalogPublicationCandidate(directory, manifest);
  if (gate.reviewSha256 !== candidate.reviewSha256 || gate.manifestSha256 !== candidate.manifestSha256
    || !same(gate.source, manifest.provenance)) fail("CATALOG_GATE_CHANGED");
  validatePublicationSourceBindings(await sourceProvenance(root), gate.source);
  return gate;
}
