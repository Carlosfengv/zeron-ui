import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { installationInputSchema, publishedInstallationVerificationSchema } from "./agent-release-record.mjs";
import { artifactFileUrl, artifactFiles, artifactManifestSchema, verifyArtifactDirectory } from "./agent-artifacts.mjs";
import { assembleCatalogRelease, verifyCatalogReleaseFiles } from "./agent-catalog-release.mjs";
import { exampleVerificationSchema } from "./agent-example-evidence.mjs";
import { exampleIds } from "./agent-example-sources.mjs";
import { readCommittedCatalogPredecessor, readPublishedCatalogPredecessor } from "./agent-catalog-predecessor.mjs";
import { buildAgentCatalog } from "./build-agent-catalog.mjs";
import { createInstallationOutput, parseInstallationCheckArgs, verifyInstallationInputForExecution } from "./check-published-installation-input.mjs";
import { committedCiSourceFile, readCanonicalCiLocator, readCommittedCiPolicy, readRegularCiInput } from "./check-agent-ci-evidence.mjs";
import { ciVerificationReceiptSchema } from "./agent-ci-contract.mjs";
import { verifyCiEvidence } from "./agent-ci-trust.mjs";
import { ciReadToken } from "./agent-ci-github.mjs";
import { readExampleEvidenceSources } from "./test-published-examples.mjs";
import { loadAgentSchema } from "./load-agent-schema.mjs";
import { validatePublicationSourceBindings } from "./publish-agent-artifacts.mjs";
import { serialize, sha256, sourceProvenance } from "./agent-utils.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const reject = code => { throw Object.assign(new Error(`Catalog candidate rejected: ${code}`), { code }); };
const descriptor = (name, bytes) => ({ path: name, bytes: bytes.length, sha256: sha256(bytes) });
function canonicalJson(bytes, schema) {
  try {
    const parsed = schema.parse(JSON.parse(new TextDecoder("utf8", { fatal: true }).decode(bytes)));
    if (!bytes.equals(Buffer.from(serialize(parsed)))) reject("CATALOG_INPUT_CANONICAL");
    return parsed;
  } catch (error) { if (error.code) throw error; reject("CATALOG_INPUT_CONTRACT"); }
}

export function parseCatalogReleaseArgs(args) {
  const required = ["--input", "--verification", "--examples", "--ci-evidence", "--predecessor", "--output"];
  const flags = new Map();
  for (let index = 0; index < args.length; index += 2) {
    const name = args[index], value = args[index + 1];
    if (!required.includes(name) || flags.has(name) || !value || value.startsWith("--") || /[\r\n\0]/.test(value)) reject("CATALOG_ARGUMENTS");
    flags.set(name, value);
  }
  if (flags.size !== required.length) reject("CATALOG_ARGUMENTS");
  return { ...parseInstallationCheckArgs(["--input", flags.get("--input"), "--output", flags.get("--output")]),
    verification: path.resolve(flags.get("--verification")), examples: path.resolve(flags.get("--examples")),
    locator: path.resolve(flags.get("--ci-evidence")), predecessor: flags.get("--predecessor") };
}

/** Pure orchestration tests may supply explicit fixtures; only the production CLI establishes source/CI trust. */
export async function assembleVerifiedCatalogCandidate({ runtime, identities, prepared, sources, ci,
  verificationBytes, exampleBytes, predecessor = null, schemas = undefined }) {
  schemas ??= await loadAgentSchema();
  const receipt = ciVerificationReceiptSchema.parse(ci.receipt);
  if (serialize(receipt.source) !== serialize(prepared.input.source) || receipt.inputSha256 !== sha256(serialize(prepared.input))) reject("CATALOG_CI_INPUT_BINDING");
  for (const [role, raw] of [["consumer", verificationBytes], ["examples", exampleBytes]]) {
    const archive = ci.archives?.[role], ref = receipt[role].report;
    if (!archive || !Buffer.isBuffer(raw) || raw.length !== ref.bytes || sha256(raw) !== ref.sha256
      || !raw.equals(ci.privateFiles.get(ref.path)) || !raw.equals(Buffer.from(serialize(archive.report)))) reject("CATALOG_CI_REPORT_BYTES");
  }
  const verification = canonicalJson(verificationBytes, publishedInstallationVerificationSchema);
  const exampleVerification = canonicalJson(exampleBytes, exampleVerificationSchema);
  const declarations = sources.manifest.declarations.examples;
  const expectedProfiles = ["next:npm", "next:pnpm", "vite:npm", "vite:pnpm"];
  if (serialize(declarations.map(example => example.exampleId)) !== serialize(exampleIds)
    || declarations.some(example => serialize(example.profiles.map(row => `${row.framework}:${row.packageManager}`)) !== serialize(expectedProfiles))
    || exampleVerification.rows.length !== 12) reject("CATALOG_FULL_EXAMPLES_REQUIRED");
  if (predecessor) {
    schemas.validateItemIdentityEvolution(predecessor.identities, identities);
    schemas.validateGuideRouteEvolution(schemas.guideRoutesForRuntime(predecessor.runtime), schemas.guideRoutesForRuntime(runtime));
  }
  return assembleCatalogRelease({ runtime, identities, verification, skillRelease: prepared.skillRelease,
    source: prepared.input.source, siteBaseUrl: prepared.input.siteBaseUrl, schemas,
    examples: { prepared, sources, verification: exampleVerification, attachments: ci.archives.examples.attachments } });
}

export async function writeCatalogCandidateFile(output, relative, bytes) {
  artifactFileUrl("https://candidate.invalid", relative);
  const filename = path.join(output, relative);
  await mkdir(path.dirname(filename), { recursive: true, mode: 0o700 });
  await writeFile(filename, bytes, { flag: "wx", mode: 0o600 });
}

/** Closed production entry: fresh real CI verification, no imported receipt, fetcher, skip or mock option. */
export async function createAgentCatalogRelease(args) {
  const options = parseCatalogReleaseArgs(args);
  await createInstallationOutput(options.output);
  let phase = "runtime";
  try {
    if (Number(process.versions.node.split(".")[0]) !== 22) reject("NODE_22_REQUIRED");
    phase = "input";
    const inputBytes = await readRegularCiInput(options.input), verificationBytes = await readRegularCiInput(options.verification),
      exampleBytes = await readRegularCiInput(options.examples);
    const input = canonicalJson(inputBytes, installationInputSchema), locator = await readCanonicalCiLocator(options.locator);
    canonicalJson(verificationBytes, publishedInstallationVerificationSchema); canonicalJson(exampleBytes, exampleVerificationSchema);
    phase = "source";
    validatePublicationSourceBindings(await sourceProvenance(root), input.source);
    const schemas = await loadAgentSchema();
    const identityBytes = await committedCiSourceFile(input.source.sourceRevision, "docs/agent-data/item-identities.json");
    const identities = schemas.itemIdentitiesSchema.parse(JSON.parse(identityBytes.toString("utf8")));
    const { policy, sourceFiles } = await readCommittedCiPolicy(input.source);
    phase = "committed-predecessor";
    const baseline = await readCommittedCatalogPredecessor(input.source, options.predecessor);
    phase = "installation-input";
    const prepared = await verifyInstallationInputForExecution(input), sources = await readExampleEvidenceSources();
    phase = "platform-archives-and-public-bytes";
    const ci = await verifyCiEvidence({ prepared, sources, locator, policy, sourceFiles },
      { token: ciReadToken() });
    phase = "source-catalog";
    const { runtime } = await buildAgentCatalog({ publishedInputs: prepared, writeOutputs: false });
    phase = "published-predecessor";
    const predecessor = await readPublishedCatalogPredecessor(baseline);
    phase = "candidate-assembly";
    const candidate = await assembleVerifiedCatalogCandidate({ runtime, identities, prepared, sources, ci,
      verificationBytes, exampleBytes, predecessor, schemas });
    phase = "candidate-output";
    for (const [name, bytes] of candidate.files) await writeCatalogCandidateFile(options.output, `payload/${name}`, bytes);
    const payload = path.join(options.output, "payload");
    const manifest = artifactManifestSchema.parse({ schemaVersion: 1, kind: "catalog", releaseId: candidate.runtime.catalog.catalogVersion,
      baseUrl: candidate.baseUrl, provenance: input.source, files: await artifactFiles(payload, candidate.baseUrl, { kind: "catalog" }) });
    if (manifest.files.length > 1024 || manifest.files.some(file => file.bytes > 16 * 1024 * 1024)
      || manifest.files.reduce((sum, file) => sum + file.bytes, 0) > 256 * 1024 * 1024) reject("CATALOG_STAGE_BUDGET");
    await verifyCatalogReleaseFiles(candidate.files, manifest, { schemas });
    const manifestBytes = Buffer.from(serialize(manifest));
    for (const [name, bytes] of ci.privateFiles) await writeCatalogCandidateFile(options.output, `review/ci/${name}`, bytes);
    const receiptBytes = Buffer.from(serialize(ci.receipt));
    const reviewFiles = new Map([["installation-input.json", inputBytes], ["verification.json", verificationBytes],
      ["examples-verification.json", exampleBytes], ["ci-locator.json", Buffer.from(serialize(locator))], ["ci-verification.json", receiptBytes]]);
    if (baseline) reviewFiles.set("predecessor.json", baseline.bytes);
    for (const [name, bytes] of reviewFiles) await writeCatalogCandidateFile(options.output, `review/${name}`, bytes);
    phase = "manifest";
    await writeCatalogCandidateFile(options.output, "payload/manifest.json", manifestBytes);
    await verifyArtifactDirectory(payload, manifest);
    phase = "source-final";
    validatePublicationSourceBindings(await sourceProvenance(root), input.source);
    const report = { schemaVersion: 1, kind: "agent-catalog-candidate", status: "candidate-validated-not-published",
      scope: "fixed-source-ci-and-predecessor-checked-not-publication-or-deployment", source: input.source,
      catalogVersion: manifest.releaseId, manifest: descriptor("payload/manifest.json", manifestBytes),
      inputs: [...reviewFiles].map(([name, bytes]) => descriptor(`review/${name}`, bytes)),
      predecessor: baseline ? { approved: baseline.reference, applicationSelection: baseline.applicationSelection } : null };
    await writeCatalogCandidateFile(options.output, "candidate-review.json", Buffer.from(serialize(report)));
    return { status: report.status, scope: report.scope, catalogVersion: manifest.releaseId, output: options.output };
  } catch (error) {
    await rm(path.join(options.output, "payload/manifest.json"), { force: true });
    await rm(path.join(options.output, "candidate-review.json"), { force: true });
    const failure = { schemaVersion: 1, kind: "agent-catalog-candidate-failure", status: "failed", phase,
      code: /^[A-Z][A-Z0-9_]{0,63}$/.test(error.code ?? "") ? error.code : "CATALOG_CANDIDATE_FAILED" };
    await writeCatalogCandidateFile(options.output, "failure.json", Buffer.from(serialize(failure)));
    throw Object.assign(new Error(`Catalog candidate failed: ${failure.code}`), { code: failure.code });
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  createAgentCatalogRelease(process.argv.slice(2)).then(result => console.log(serialize(result))).catch(error => {
    console.error(error.code ? `Catalog candidate failed: ${error.code}` : "Catalog candidate failed: INVALID_ARGUMENTS_OR_OUTPUT");
    process.exitCode = 1;
  });
}
