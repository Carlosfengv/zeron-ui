import { createHash } from "node:crypto";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { installationInputSchema, npmIntegritySchema } from "./agent-release-record.mjs";
import { artifactFileUrl, artifactManifestSchema, artifactManifestName } from "./agent-artifacts.mjs";
import { artifactCompletionSchema } from "./publish-agent-artifacts.mjs";
import { downloadArtifact, downloadPublicBytes } from "./download-agent-artifact.mjs";
import { serialize, sha256 } from "./agent-utils.mjs";
import { validateReleaseDependencies } from "./create-registry-release.mjs";
import { verifySkillRelease } from "./create-skill-release.mjs";
import { checkRegistry } from "../packages/registry/scripts/registry-check.mjs";

export class InstallationInputError extends Error {
  constructor(code) { super(`Published installation input failed: ${code}`); this.code = code; }
}

const same = (left, right) => serialize(left) === serialize(right);
const reference = (url, bytes) => ({ url, bytes: bytes.length, sha256: sha256(bytes) });
const sorted = values => [...values].sort();

/** Builds a descriptor, never a declaration that the objects are publicly ready. */
export function createInstallationInput({ source, siteBaseUrl, registryManifest, registryCompletion,
  skillManifest, skillCompletion, cli, items, matrices, nextOnlyRejectionItem }) {
  registryManifest = artifactManifestSchema.parse(registryManifest);
  skillManifest = artifactManifestSchema.parse(skillManifest);
  registryCompletion = artifactCompletionSchema.parse(registryCompletion);
  skillCompletion = artifactCompletionSchema.parse(skillCompletion);
  if (registryManifest.kind !== "registry" || skillManifest.kind !== "skill"
    || !same(registryManifest.provenance, source)) throw new InstallationInputError("DESCRIPTOR_STAGE_BINDING");
  for (const [manifest, completion] of [[registryManifest, registryCompletion], [skillManifest, skillCompletion]]) {
    verifyCompletion(manifest, reference(completion.manifestUrl, Buffer.from(serialize(manifest))), completion);
  }
  const skillFile = name => {
    const file = skillManifest.files.find(file => file.path === name);
    if (!file) throw new InstallationInputError("DESCRIPTOR_SKILL_REFERENCE");
    return { url: file.url, bytes: file.bytes, sha256: file.sha256 };
  };
  return installationInputSchema.parse({ schemaVersion: 1, kind: "published-installation-input", source,
    artifactBaseUrl: new URL(registryManifest.baseUrl).origin, siteBaseUrl, cli, items, matrices, nextOnlyRejectionItem,
    registry: { releaseId: registryManifest.releaseId,
      manifest: reference(`${registryManifest.baseUrl}/manifest.json`, Buffer.from(serialize(registryManifest))),
      completion: reference(`${registryManifest.baseUrl}/complete.json`, Buffer.from(serialize(registryCompletion))) },
    skill: { version: skillManifest.releaseId,
      artifacts: reference(`${skillManifest.baseUrl}/artifacts.json`, Buffer.from(serialize(skillManifest))),
      completion: reference(`${skillManifest.baseUrl}/complete.json`, Buffer.from(serialize(skillCompletion))),
      manifest: skillFile("manifest.json"), archive: skillFile("zeron-skills.zip"), guide: skillFile("install.md") },
  });
}

/** TLS provides metadata provenance; the input's pinned SRI verifies the actual tarball. */
export async function readPublishedCli(input, { fetcher = fetch, downloadOptions = {} } = {}) {
  const cli = installationInputSchema.shape.cli.parse(input);
  const origin = "https://registry.npmjs.org";
  const tarballUrl = `${origin}/zeron-ui/-/zeron-ui-${cli.version}.tgz`;
  const read = url => downloadPublicBytes(url, { ...(typeof downloadOptions === "function" ? downloadOptions() : downloadOptions), origin, fetcher, allowMissing: false,
    maxBytes: url === tarballUrl ? 16 * 1024 * 1024 : 2 * 1024 * 1024 });
  const metadataBytes = await read(`${origin}/zeron-ui/${cli.version}`);
  let metadata;
  try { metadata = JSON.parse(metadataBytes.toString("utf8")); }
  catch { throw new InstallationInputError("NPM_METADATA_JSON"); }
  if (metadata?.name !== cli.name || metadata?.version !== cli.version
    || !npmIntegritySchema.safeParse(metadata?.dist?.integrity).success
    || metadata.dist.integrity !== cli.distIntegrity || metadata.dist.tarball !== tarballUrl) {
    throw new InstallationInputError("NPM_METADATA_BINDING");
  }
  const tarball = await read(tarballUrl);
  const digest = createHash("sha512").update(tarball).digest("base64");
  if (`sha512-${digest}` !== cli.distIntegrity) throw new InstallationInputError("NPM_TARBALL_INTEGRITY");
  if (tarball.length < 2 || tarball[0] !== 0x1f || tarball[1] !== 0x8b) throw new InstallationInputError("NPM_TARBALL_FORMAT");
  return { cli: { ...cli, tarballUrl, tarballBytes: tarball.length }, tarball, tarballSha256: sha256(tarball),
    metadataSha256: sha256(metadataBytes) };
}

function verifyCompletion(manifest, manifestRef, completion) {
  if (completion.kind !== manifest.kind || completion.releaseId !== manifest.releaseId || completion.baseUrl !== manifest.baseUrl
    || completion.manifestUrl !== artifactFileUrl(manifest.baseUrl, artifactManifestName(manifest.kind))
    || completion.manifestSha256 !== manifestRef.sha256 || completion.files !== manifest.files.length
    || completion.totalBytes !== manifest.files.reduce((sum, file) => sum + file.bytes, 0)) {
    throw new InstallationInputError("STAGE_COMPLETION_BINDING");
  }
}

function registryScope(input, files, manifest) {
  let index;
  try { index = JSON.parse(files.get("registry.json")?.toString("utf8") ?? "null"); }
  catch { throw new InstallationInputError("REGISTRY_INDEX_JSON"); }
  if (!Array.isArray(index?.items) || !index.items.length) throw new InstallationInputError("REGISTRY_INDEX_ITEMS");
  validateReleaseDependencies(index.items, manifest.baseUrl);
  const names = sorted(index.items.map(item => item.name));
  if (!same(sorted([...files.keys()]), sorted(["registry.json", ...names.map(name => `${name}.json`)]))
    || !same(names, sorted(input.items.map(item => item.registryName)))) throw new InstallationInputError("REGISTRY_IDENTITY_COVERAGE");
  const byName = new Map();
  for (const name of names) {
    let item;
    try { item = JSON.parse(files.get(`${name}.json`).toString("utf8")); }
    catch { throw new InstallationInputError("REGISTRY_ITEM_JSON"); }
    if (item?.name !== name) throw new InstallationInputError("REGISTRY_ITEM_IDENTITY");
    byName.set(name, item);
  }
  const items = [...byName.values()];
  validateReleaseDependencies(items, manifest.baseUrl);
  if (checkRegistry(items).length) throw new InstallationInputError("REGISTRY_STATIC_CLOSURE");
  const byId = new Map(input.items.map(identity => [identity.id, byName.get(identity.registryName)]));
  const nextOnly = byId.get(input.nextOnlyRejectionItem);
  if (nextOnly.meta.zeron.framework !== "next" || !["data-block", "template"].includes(nextOnly.meta.zeron.kind)) {
    throw new InstallationInputError("NEXT_ONLY_REJECTION_SCOPE");
  }
  const closureFor = ids => {
    const names = new Set();
    const visit = name => {
      if (names.has(name)) return;
      names.add(name);
      for (const dependency of byName.get(name).registryDependencies ?? []) visit(dependency.slice(manifest.baseUrl.length + 1, -".json".length));
    };
    for (const id of ids) visit(byId.get(id).name);
    return sorted([...names]);
  };
  const matrices = input.matrices.map(row => {
    if (row.framework === "vite" && row.testedItems.some(id => byId.get(id).meta.zeron.framework !== "react")) {
      throw new InstallationInputError("MATRIX_FRAMEWORK_SCOPE");
    }
    if (!row.testedItems.some(id => id.startsWith("component:") && byId.get(id).meta.zeron.kind === "ui"
      && byId.get(id).meta.zeron.framework === "react")) throw new InstallationInputError("MATRIX_COMPONENT_SCOPE");
    return { ...row, registryClosure: closureFor(row.testedItems) };
  });
  return { staticCheckedItems: sorted(input.items.map(item => item.id)), matrices, items };
}

/** Full public inventory checks precede consumer execution, and cannot produce its success report. */
export async function verifyPublishedInstallationInput(value, { fetcher = fetch, timeoutMs = 12000,
  maxDurationMs = 600000, maxTotalBytes = 512 * 1024 * 1024, downloadOptions = {} } = {}) {
  const input = installationInputSchema.parse(value);
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 12000
    || !Number.isInteger(maxDurationMs) || maxDurationMs < 1 || maxDurationMs > 600000
    || !Number.isSafeInteger(maxTotalBytes) || maxTotalBytes < 1 || maxTotalBytes > 512 * 1024 * 1024) {
    throw new InstallationInputError("INPUT_CHECK_BUDGET");
  }
  const deadline = Date.now() + maxDurationMs;
  let consumedBytes = 0;
  const budget = () => {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new InstallationInputError("INPUT_CHECK_TIMEOUT");
    return { ...downloadOptions, fetcher, timeoutMs: Math.min(timeoutMs, remaining), maxDurationMs: Math.min(90000, remaining),
      onBytes: size => { consumedBytes += size; if (consumedBytes > maxTotalBytes) throw new InstallationInputError("INPUT_CHECK_BYTE_BUDGET"); } };
  };
  const read = (ref, maxBytes) => downloadArtifact(ref.url, { ...budget(), origin: input.artifactBaseUrl,
    bytes: ref.bytes, hash: ref.sha256, maxBytes, allowMissing: false });
  const stage = async kind => {
    const section = input[kind];
    const ref = kind === "skill" ? section.artifacts : section.manifest;
    const manifestBytes = await read(ref, 2 * 1024 * 1024);
    const manifest = artifactManifestSchema.parse(JSON.parse(manifestBytes.toString("utf8")));
    if (manifest.kind !== kind || manifest.releaseId !== (kind === "registry" ? section.releaseId : section.version)
      || new URL(manifest.baseUrl).origin !== input.artifactBaseUrl || manifestBytes.toString("utf8") !== serialize(manifest)
      || (kind === "registry" && !same(manifest.provenance, input.source))) throw new InstallationInputError("STAGE_SOURCE_BINDING");
    if (manifest.files.length > 1024 || manifest.files.reduce((sum, file) => sum + file.bytes, 0) > 256 * 1024 * 1024
      || manifest.files.some(file => file.bytes > 16 * 1024 * 1024)) throw new InstallationInputError("STAGE_BUDGET");
    const completionBytes = await read(section.completion, 64 * 1024);
    const completion = artifactCompletionSchema.parse(JSON.parse(completionBytes.toString("utf8")));
    if (completionBytes.toString("utf8") !== serialize(completion)) throw new InstallationInputError("COMPLETION_CANONICAL_BYTES");
    verifyCompletion(manifest, ref, completion);
    const files = new Map();
    let next = 0;
    const readers = Array.from({ length: Math.min(4, manifest.files.length) }, async () => {
      while (next < manifest.files.length) {
        const file = manifest.files[next++];
        files.set(file.path, await read(file, 16 * 1024 * 1024));
      }
    });
    const results = await Promise.allSettled(readers);
    const failed = results.find(result => result.status === "rejected");
    if (failed) throw failed.reason;
    return { manifest, files };
  };
  // Each stage is fully checked before exposing bytes to a consumer runner.
  const registry = await stage("registry");
  const scope = registryScope(input, registry.files, registry.manifest);
  const skill = await stage("skill");
  for (const [name, ref] of [["manifest.json", input.skill.manifest], ["zeron-skills.zip", input.skill.archive], ["install.md", input.skill.guide]]) {
    const file = skill.manifest.files.find(file => file.path === name);
    if (!file || !same({ url: file.url, bytes: file.bytes, sha256: file.sha256 }, ref)) throw new InstallationInputError("SKILL_REFERENCE_BINDING");
  }
  const temporary = await mkdtemp(path.join(tmpdir(), "zeron-published-skill-check-"));
  let skillRelease;
  try {
    for (const [name, bytes] of skill.files) {
      const filename = path.join(temporary, name);
      await mkdir(path.dirname(filename), { recursive: true });
      await writeFile(filename, bytes);
    }
    skillRelease = await verifySkillRelease(temporary, JSON.parse(skill.files.get("manifest.json").toString("utf8")));
    if (skillRelease.skillVersion !== input.skill.version || skillRelease.artifactBaseUrl !== input.artifactBaseUrl
      || skillRelease.siteBaseUrl !== input.siteBaseUrl) throw new InstallationInputError("SKILL_STAGE_IDENTITY");
  } finally { await rm(temporary, { recursive: true, force: true }); }
  const npm = await readPublishedCli(input.cli, { fetcher, downloadOptions: budget });
  budget();
  const report = { schemaVersion: 1, kind: "published-input-verification", status: "verified-inputs",
    scope: "public-resource-and-npm-integrity-not-consumer-installation", inputSha256: sha256(serialize(input)),
    source: input.source, cli: npm.cli, tarballSha256: npm.tarballSha256, metadataSha256: npm.metadataSha256,
    registry: { releaseId: input.registry.releaseId, baseUrl: registry.manifest.baseUrl,
      manifestSha256: input.registry.manifest.sha256, staticCheckedItems: scope.staticCheckedItems },
    skillVersion: input.skill.version, requestedMatrices: scope.matrices, consumedBytes };
  return { input, report, registry, skill, skillRelease, npm, scope };
}

export function assertInstallationIdentitySource(input, identities) {
  const registered = identities.items.filter(item => item.type === "registry" && item.status === "active")
    .map(item => ({ id: item.id, registryName: item.key }));
  const ordered = items => [...items].sort((a, b) => a.id.localeCompare(b.id, "en"));
  if (!same(ordered(input.items), ordered(registered))) throw new InstallationInputError("SOURCE_IDENTITY_MAP");
}
