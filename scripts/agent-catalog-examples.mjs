import { exampleEvidenceBinding, exampleVerificationSchema, validateExampleEvidenceBatch } from "./agent-example-evidence.mjs";
import { createExampleSourceManifest, exampleSourceManifestSchema } from "./agent-example-sources.mjs";
import { installationInputSchema } from "./agent-release-record.mjs";
import { serialize, sha256 } from "./agent-utils.mjs";

const same = (a, b) => serialize(a) === serialize(b);
const descriptor = (path, bytes) => ({ path, bytes: bytes.length, sha256: sha256(bytes) });
const json = value => Buffer.from(serialize(value));

function resourceBinding(input, report, { source, verification, skillManifestSha256, siteBaseUrl, artifactBaseUrl, skillVersion }) {
  if (!same(input.source, source) || source.sourceClean !== true || verification.sourceRevision !== source.sourceRevision
    || input.siteBaseUrl !== siteBaseUrl || input.artifactBaseUrl !== artifactBaseUrl || input.skill.version !== skillVersion
    || !same(report.binding, exampleEvidenceBinding({ input, npm: { cli: verification.cli } }, report.sourceManifest))
    || input.registry.releaseId !== verification.registry.releaseId || input.registry.manifest.sha256 !== verification.registry.manifestSha256
    || verification.registry.baseUrl !== `${input.artifactBaseUrl}/r/releases/${input.registry.releaseId}`
    || input.skill.manifest.sha256 !== skillManifestSha256) throw new Error("Catalog example resource binding mismatch");
}

function payload(input, sources, verification, schemas) {
  const files = new Map([
    ["examples/installation-input.json", json(input)], ["examples/declarations.json", Buffer.from(sources.declaration)],
    ["examples/source-manifest.json", json(sources.manifest)], ["examples/verification.json", json(verification)],
    ...sources.manifest.files.map(file => [`examples/sources/${file.path}`, Buffer.from(sources.files.get(file.path))]),
  ]);
  const ref = name => descriptor(name, files.get(name));
  const metadata = schemas.catalogExamplesSchema.parse({ schemaVersion: 1, sourceRevision: input.source.sourceRevision,
    inputSha256: sha256(serialize(input)), registryReleaseId: input.registry.releaseId, registryManifestSha256: input.registry.manifest.sha256,
    skillVersion: input.skill.version, installationInput: ref("examples/installation-input.json"), declaration: ref("examples/declarations.json"),
    sourceManifest: ref("examples/source-manifest.json"), verification: ref("examples/verification.json"),
    instructions: ref(`examples/sources/${sources.manifest.declarations.instructions}`),
    sources: sources.manifest.files.map(file => ref(`examples/sources/${file.path}`)),
    entries: sources.manifest.declarations.examples.map(example => ({ exampleId: example.exampleId, entry: `examples/sources/${example.entry}`,
      adoptedItems: example.adoptedItems, profiles: example.profiles })) });
  return { metadata, files };
}

/** Pure candidate assembly validates bytes; release workflow trust remains a separate mandatory gate. */
export function assembleCatalogExamples({ prepared, sources, verification, attachments }, context) {
  const input = installationInputSchema.parse(prepared.input);
  const checked = validateExampleEvidenceBatch(prepared, sources, verification, attachments);
  resourceBinding(input, checked.report, context);
  return { ...payload(input, sources, checked.report, context.schemas), input, sources, verification: checked.report,
    scope: "assembled-example-content-not-publication-or-trusted-ci-proof" };
}

/** Read only archived source bytes; the caller must also verify public attachments before activation. */
export function readCatalogExamples(files, metadata, context) {
  metadata = context.schemas.catalogExamplesSchema.parse(metadata);
  const read = ref => {
    const bytes = files.get(ref.path);
    if (!Buffer.isBuffer(bytes) || bytes.length !== ref.bytes || sha256(bytes) !== ref.sha256) throw new Error("Catalog example bytes mismatch");
    return bytes;
  };
  const canonical = (ref, schema) => {
    const bytes = read(ref), value = schema.parse(JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)));
    if (!bytes.equals(json(value))) throw new Error("Catalog example JSON is not canonical");
    return value;
  };
  const input = canonical(metadata.installationInput, installationInputSchema);
  const manifest = canonical(metadata.sourceManifest, exampleSourceManifestSchema);
  const verification = canonical(metadata.verification, exampleVerificationSchema);
  const sources = { manifest, declaration: read(metadata.declaration), files: new Map(metadata.sources.map(ref => [ref.path.slice("examples/sources/".length), read(ref)])) };
  if (!same(createExampleSourceManifest(sources.declaration, sources.files, manifest.hostRegistryItems), manifest)
    || !same(verification.sourceManifest, manifest)) throw new Error("Catalog example source graph mismatch");
  resourceBinding(input, verification, context);
  const expected = payload(input, sources, verification, context.schemas);
  if (!same(metadata, expected.metadata)) throw new Error("Catalog example metadata mismatch");
  const expectedRows = manifest.declarations.examples.flatMap(example => example.profiles.map(profile => `${example.exampleId}:${profile.framework}:${profile.packageManager}`));
  if (!same(verification.rows.map(row => `${row.exampleId}:${row.framework}:${row.packageManager}`), expectedRows)
    || verification.rows.some(row => !same(row.adoptedItems, manifest.declarations.examples.find(example => example.exampleId === row.exampleId).adoptedItems))) {
    throw new Error("Catalog example declaration coverage mismatch");
  }
  return { ...expected, input, sources, verification, scope: "archived-example-content-needs-public-attachment-verification" };
}
