import { z } from "zod";
import { artifactFileUrl, artifactOrigin, registryReleaseBase } from "./agent-artifacts.mjs";

const hash = z.string().regex(/^[a-f0-9]{64}$/);
const revision = z.string().regex(/^[a-f0-9]{40}$/);
const origin = z.string().refine(value => {
  try { return artifactOrigin(value) === value; } catch { return false; }
}, "Expected normalized HTTPS origin");
const id = z.string().regex(/^[a-z][a-z-]*:[a-z0-9][a-z0-9-]*$/);
const version = z.string().regex(/^\d+\.\d+\.\d+(?:-[a-zA-Z0-9.-]+)?$/);
const uniqueIds = z.array(id).min(1).max(1024).refine(values => new Set(values).size === values.length, "Duplicate item ID");
export const npmIntegritySchema = z.string().regex(/^sha512-[A-Za-z0-9+/]{85}[AQgw]==$/);
export const publicByteReferenceSchema = z.object({
  url: z.string().url().refine(value => {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash;
  }), bytes: z.number().int().positive().max(16 * 1024 * 1024), sha256: hash,
}).strict();
const manifestRef = publicByteReferenceSchema.extend({ bytes: z.number().int().positive().max(2 * 1024 * 1024) });
const completionRef = publicByteReferenceSchema.extend({ bytes: z.number().int().positive().max(64 * 1024) });
export const localRecordReferenceSchema = z.object({
  path: z.string().regex(/^[a-f0-9]{64}\.json$/),
  bytes: z.number().int().positive().max(2 * 1024 * 1024), sha256: hash,
}).strict();
export const releaseSelectionSchema = z.object({ schemaVersion: z.literal(1), current: localRecordReferenceSchema }).strict();
export const frozenReleaseSchema = z.object({
  schemaVersion: z.literal(1),
  source: z.object({ sourceRevision: revision, sourceInputSha256: hash, lockfileSha256: hash, sourceClean: z.literal(true) }).strict(),
  artifactBaseUrl: origin, siteBaseUrl: origin,
  registry: z.object({ releaseId: z.string().regex(/^[a-z0-9][a-z0-9._-]{0,63}$/), manifest: manifestRef, completion: completionRef }).strict(),
  skill: z.object({ version: hash, artifacts: manifestRef, completion: completionRef,
    manifest: manifestRef, archive: publicByteReferenceSchema, guide: publicByteReferenceSchema }).strict(),
  catalog: z.object({ version: hash, manifest: manifestRef, completion: completionRef,
    installationVerification: manifestRef }).strict(),
  history: z.array(localRecordReferenceSchema).max(2),
}).strict().superRefine((record, context) => {
  const issue = message => context.addIssue({ code: "custom", message });
  checkInstallationResourceLocations(record, issue);
  const origin = record.artifactBaseUrl;
  const catalogBase = `${origin}/ai/releases/${record.catalog.version}`;
  for (const [reference, base, name] of [
    [record.catalog.manifest, catalogBase, "manifest.json"], [record.catalog.completion, catalogBase, "complete.json"],
    [record.catalog.installationVerification, catalogBase, "installation-verification.json"],
  ]) if (reference.url !== artifactFileUrl(base, name)) issue(`Release reference must match its fixed stage: ${name}`);
  const names = record.history.map(reference => reference.path);
  if (new Set(names).size !== names.length || names.includes(`${record.catalog.version}.json`)) issue("Duplicate or self-referencing history");
});

function checkInstallationResourceLocations(record, issue) {
  let registryBase;
  try { registryBase = registryReleaseBase(record.artifactBaseUrl, record.registry.releaseId); }
  catch { issue("Invalid Registry release identity"); return; }
  const skillBase = `${record.artifactBaseUrl}/skills/releases/${record.skill.version}`;
  for (const [reference, base, name] of [
    [record.registry.manifest, registryBase, "manifest.json"], [record.registry.completion, registryBase, "complete.json"],
    [record.skill.artifacts, skillBase, "artifacts.json"], [record.skill.completion, skillBase, "complete.json"],
    [record.skill.manifest, skillBase, "manifest.json"], [record.skill.archive, skillBase, "zeron-skills.zip"], [record.skill.guide, skillBase, "install.md"],
  ]) if (reference.url !== artifactFileUrl(base, name)) issue(`Release reference must match its fixed stage: ${name}`);
}

/** Installation resources precede Catalog construction; no success declaration belongs here. */
export const installationInputSchema = z.object({
  schemaVersion: z.literal(1), kind: z.literal("published-installation-input"),
  source: frozenReleaseSchema.shape.source,
  artifactBaseUrl: origin, siteBaseUrl: origin,
  registry: frozenReleaseSchema.shape.registry, skill: frozenReleaseSchema.shape.skill,
  cli: z.object({ name: z.literal("zeron-ui"), version, distIntegrity: npmIntegritySchema }).strict(),
  items: z.array(z.object({ id, registryName: z.string().regex(/^[a-z0-9][a-z0-9-]*$/) }).strict()).min(1).max(1024),
  matrices: z.array(z.object({ framework: z.enum(["next", "vite"]), packageManager: z.enum(["npm", "pnpm"]),
    testedItems: uniqueIds.refine(values => values.length <= 20, "At most 20 representative items per matrix"),
  }).strict()).length(4),
  nextOnlyRejectionItem: id,
}).strict().superRefine((input, context) => {
  const issue = message => context.addIssue({ code: "custom", message });
  checkInstallationResourceLocations(input, issue);
  const ids = new Set(input.items.map(item => item.id));
  if (ids.size !== input.items.length || new Set(input.items.map(item => item.registryName)).size !== input.items.length) issue("Duplicate installation identity");
  if (new Set(input.matrices.map(row => `${row.framework}:${row.packageManager}`)).size !== 4) issue("All four consumer combinations are required");
  if (!ids.has(input.nextOnlyRejectionItem)) issue("Next-only rejection item must belong to the fixed input");
  for (const row of input.matrices) {
    if (row.testedItems.some(value => !ids.has(value))) issue("Consumer representative must belong to the fixed input");
    if (row.framework === "next" && !row.testedItems.includes(input.nextOnlyRejectionItem)) issue("Next matrices must also consume the rejection representative");
    if (row.framework === "vite" && row.testedItems.includes(input.nextOnlyRejectionItem)) issue("Vite cannot consume the rejection representative");
  }
});

export const publishedInstallationVerificationSchema = z.object({
  schemaVersion: z.literal(1), kind: z.literal("published-consumer-verification"),
  sourceRevision: revision,
  cli: z.object({ name: z.literal("zeron-ui"), version,
    distIntegrity: npmIntegritySchema,
    tarballUrl: z.string().url(), tarballBytes: z.number().int().positive().max(16 * 1024 * 1024) }).strict(),
  registry: z.object({ releaseId: z.string(), baseUrl: z.string().url(), manifestSha256: hash, staticCheckedItems: uniqueIds }).strict(),
  matrices: z.array(z.object({ framework: z.enum(["next", "vite"]), packageManager: z.enum(["npm", "pnpm"]),
    nodeVersion: version, frameworkVersion: version, packageManagerVersion: version,
    testedItems: uniqueIds, registryClosure: z.array(z.string().regex(/^[a-z0-9][a-z0-9-]*$/)).min(1).max(1024),
    checks: z.object({ dryRun: z.literal(true), install: z.literal(true), types: z.literal(true), build: z.literal(true) }).strict(),
    passed: z.literal(true), evidence: publicByteReferenceSchema,
  }).strict()).length(4),
}).strict().superRefine((verification, context) => {
  const issue = message => context.addIssue({ code: "custom", message });
  if (verification.cli.tarballUrl !== `https://registry.npmjs.org/zeron-ui/-/zeron-ui-${verification.cli.version}.tgz`) issue("Use the exact official npm tarball URL");
  const matrices = new Set(verification.matrices.map(row => `${row.framework}:${row.packageManager}`));
  if (matrices.size !== 4) issue("All four npm/pnpm and Next/Vite combinations are required");
  try {
    const origin = new URL(verification.registry.baseUrl).origin;
    if (registryReleaseBase(origin, verification.registry.releaseId) !== verification.registry.baseUrl) issue("Verification Registry base differs from its release");
  } catch { issue("Invalid verification Registry base"); }
  for (const row of verification.matrices) {
    if (row.testedItems.some(item => !verification.registry.staticCheckedItems.includes(item))
      || new Set(row.registryClosure).size !== row.registryClosure.length) issue("Consumer scope differs from static closure or contains duplicates");
  }
});

export function runtimeInstallationSummary(input) {
  const verification = publishedInstallationVerificationSchema.parse(input);
  return { cliVersion: verification.cli.version, cliDistIntegrity: verification.cli.distIntegrity,
    registryBase: verification.registry.baseUrl, registryManifestSha256: verification.registry.manifestSha256,
    staticCheckedItems: verification.registry.staticCheckedItems,
    matrices: verification.matrices.map(row => ({ framework: row.framework, packageManager: row.packageManager,
      testedItems: row.testedItems, passed: true })) };
}
