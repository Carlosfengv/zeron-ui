import { execFileSync } from "node:child_process";
import { lstat, mkdir, mkdtemp, readFile, realpath, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { artifactManifestSchema, artifactFileUrl } from "./agent-artifacts.mjs";
import { artifactCompletionSchema } from "./publish-agent-artifacts.mjs";
import { downloadArtifact } from "./download-agent-artifact.mjs";
import { frozenReleaseSchema, releaseSelectionSchema, runtimeInstallationSummary } from "./agent-release-record.mjs";
import { serialize, sha256 } from "./agent-utils.mjs";
import { loadAgentSchema } from "./load-agent-schema.mjs";
import { verifySkillRelease } from "./create-skill-release.mjs";
import { verifyCatalogReleaseFiles } from "./agent-catalog-release.mjs";
import { readSkillTexts } from "./skill-text-references.mjs";
import { readExampleVerification } from "./agent-example-evidence.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const managed = ["public/ai", "public/skills", "docs/generated/agent-runtime",
  "public/llms-small.txt", "public/llms.txt", "public/llms-full.txt"];
export class ReleaseRestoreError extends Error {
  constructor(code) { super(`Agent release restore failed: ${code}`); this.code = code; }
}

async function regularJson(filename, expected) {
  const stat = await lstat(filename);
  if (!stat.isFile() || stat.size > 2 * 1024 * 1024) throw new ReleaseRestoreError("INVALID_LOCAL_RECORD");
  const bytes = await readFile(filename);
  if (expected && (bytes.length !== expected.bytes || sha256(bytes) !== expected.sha256)) throw new ReleaseRestoreError("LOCAL_RECORD_HASH_MISMATCH");
  return { value: JSON.parse(bytes.toString("utf8")), bytes };
}

/** Follow only the selected record's two explicit history references; never a recursive chain. */
export async function readFrozenReleases(filename, { requireCommitted = false } = {}) {
  filename = path.resolve(filename);
  const directory = await realpath(path.dirname(filename));
  const touched = new Map();
  const read = async (name, reference) => {
    const { value, bytes } = await regularJson(name, reference);
    touched.set(name, bytes);
    return value;
  };
  let input = await read(filename);
  const selection = releaseSelectionSchema.safeParse(input);
  let currentFile = filename;
  if (selection.success) {
    currentFile = path.join(directory, selection.data.current.path);
    input = await read(currentFile, selection.data.current);
  }
  const current = frozenReleaseSchema.parse(input);
  if (path.basename(currentFile) !== `${current.catalog.version}.json`) throw new ReleaseRestoreError("RECORD_FILENAME_VERSION_MISMATCH");
  const records = [current];
  for (const reference of current.history) {
    const record = frozenReleaseSchema.parse(await read(path.join(directory, reference.path), reference));
    if (reference.path !== `${record.catalog.version}.json`) throw new ReleaseRestoreError("HISTORY_VERSION_MISMATCH");
    records.push(record);
  }
  if (new Set(records.map(record => record.catalog.version)).size !== records.length) throw new ReleaseRestoreError("DUPLICATE_HISTORY_VERSION");
  if (requireCommitted) {
    const allowed = path.join(root, "docs/agent-data/releases");
    if (directory !== allowed) throw new ReleaseRestoreError("RECORD_OUTSIDE_COMMITTED_RELEASES");
    for (const [filename, bytes] of touched) {
      const relative = path.relative(root, filename).split(path.sep).join("/");
      let committed;
      try { committed = execFileSync("git", ["show", `HEAD:${relative}`], { cwd: root, stdio: ["ignore", "pipe", "ignore"] }); }
      catch { throw new ReleaseRestoreError("RECORD_NOT_COMMITTED"); }
      if (!committed.equals(bytes)) throw new ReleaseRestoreError("RECORD_DIFFERS_FROM_COMMIT");
    }
  }
  return records;
}

async function writeFiles(directory, files) {
  for (const [relative, bytes] of files) {
    const filename = path.join(directory, relative);
    await mkdir(path.dirname(filename), { recursive: true });
    await writeFile(filename, bytes);
  }
}

async function outputPath(root, relative) {
  const segments = relative.split("/");
  let filename = root;
  for (const [index, segment] of segments.entries()) {
    filename = path.join(filename, segment);
    try {
      const stat = await lstat(filename);
      const expected = relative === "output" ? "directory" : managed.includes(relative) ? relative.endsWith(".txt") ? "file" : "directory" : null;
      if (stat.isSymbolicLink() || (index < segments.length - 1 && !stat.isDirectory())
        || (index === segments.length - 1 && ((!stat.isFile() && !stat.isDirectory())
          || (expected === "file" && !stat.isFile()) || (expected === "directory" && !stat.isDirectory())))) throw new ReleaseRestoreError("UNSAFE_OUTPUT_PATH");
    } catch (error) { if (error.code !== "ENOENT") throw error; }
  }
  return filename;
}

export async function activatePreparedOutput(output, stage) {
  const moved = [];
  for (const relative of managed) await outputPath(output, relative);
  try {
    for (const relative of managed) {
      const destination = await outputPath(output, relative);
      const prepared = path.join(stage, "prepared", relative);
      const backup = path.join(stage, "backups", relative);
      await mkdir(path.dirname(destination), { recursive: true });
      const entry = { destination, backup, replaced: false, installed: false };
      moved.push(entry);
      try { await mkdir(path.dirname(backup), { recursive: true }); await rename(destination, backup); entry.replaced = true; }
      catch (error) { if (error.code !== "ENOENT") throw error; }
      await rename(prepared, destination);
      entry.installed = true;
    }
  } catch (error) {
    const failures = [];
    for (const entry of moved.reverse()) {
      try {
        if (entry.installed) await rm(entry.destination, { recursive: true, force: true });
        if (entry.replaced) await rename(entry.backup, entry.destination);
      } catch (rollbackError) { failures.push(rollbackError); }
    }
    if (failures.length) {
      const failure = new ReleaseRestoreError("ACTIVATION_ROLLBACK_FAILED");
      failure.recoveryDirectory = stage;
      throw failure;
    }
    throw error;
  }
}

/** All files stay isolated until every selected version passes trust and semantic checks. */
export async function restoreAgentRelease({ release, output = root, requireCommitted = false, fetcher = fetch,
  timeoutMs = 12000, maxDurationMs = 600000, maxTotalBytes = 512 * 1024 * 1024, downloadOptions = {} } = {}) {
  if (!Number.isInteger(maxDurationMs) || maxDurationMs < 1 || maxDurationMs > 600000
    || !Number.isSafeInteger(maxTotalBytes) || maxTotalBytes < 1 || maxTotalBytes > 512 * 1024 * 1024
    || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 12000) throw new ReleaseRestoreError("INVALID_RESTORE_BUDGET");
  output = path.resolve(output);
  await mkdir(output, { recursive: true });
  output = await realpath(output);
  await outputPath(output, "output");
  await mkdir(path.join(output, "output"), { recursive: true });
  const lock = path.join(output, "output/.agent-restore.lock");
  try { await mkdir(lock); }
  catch (error) { if (error.code === "EEXIST") throw new ReleaseRestoreError("RESTORE_LOCKED"); throw error; }
  let stage;
  let preserveStage = false;
  const started = Date.now();
  let consumedBytes = 0;
  const cache = new Map();
  try {
    stage = await mkdtemp(path.join(output, "output/.agent-restore-"));
    const records = await readFrozenReleases(release, { requireCommitted });
    const schemas = await loadAgentSchema();
    const remaining = () => {
      const value = maxDurationMs - (Date.now() - started);
      if (value <= 0) throw new ReleaseRestoreError("RESTORE_TIMEOUT");
      return value;
    };
    const download = async (reference, origin, maxBytes) => {
      remaining();
      const key = `${reference.url}:${reference.sha256}:${reference.bytes}`;
      if (cache.has(key)) return cache.get(key);
      const bytes = await downloadArtifact(reference.url, { ...downloadOptions, fetcher, origin,
        bytes: reference.bytes, hash: reference.sha256, maxBytes, timeoutMs: Math.min(timeoutMs, remaining()),
        maxDurationMs: Math.min(90000, remaining()), allowMissing: false,
        onBytes: size => { consumedBytes += size; if (consumedBytes > maxTotalBytes) throw new ReleaseRestoreError("RESTORE_BYTE_BUDGET"); } });
      cache.set(key, bytes);
      return bytes;
    };
    const loadStage = async (record, kind) => {
      const section = record[kind];
      const manifestRef = kind === "skill" ? section.artifacts : section.manifest;
      const manifestBytes = await download(manifestRef, record.artifactBaseUrl, 2 * 1024 * 1024);
      const manifest = artifactManifestSchema.parse(JSON.parse(manifestBytes.toString("utf8")));
      const expectedId = kind === "registry" ? section.releaseId : section.version;
      if (manifest.kind !== kind || manifest.releaseId !== expectedId || new URL(manifest.baseUrl).origin !== record.artifactBaseUrl
        || (kind !== "skill" && serialize(manifest.provenance) !== serialize(record.source))) throw new ReleaseRestoreError("STAGE_BINDING_MISMATCH");
      const total = manifest.files.reduce((sum, file) => sum + file.bytes, 0);
      if (manifest.files.length > 1024 || total > 256 * 1024 * 1024 || manifest.files.some(file => file.bytes > 16 * 1024 * 1024)
        || manifestBytes.toString("utf8") !== serialize(manifest)) throw new ReleaseRestoreError("STAGE_BUDGET_OR_CANONICAL_BYTES");
      const completionBytes = await download(section.completion, record.artifactBaseUrl, 64 * 1024);
      const completion = artifactCompletionSchema.parse(JSON.parse(completionBytes.toString("utf8")));
      if (completion.kind !== kind || completion.releaseId !== expectedId || completion.baseUrl !== manifest.baseUrl
        || completion.manifestSha256 !== manifestRef.sha256 || completion.files !== manifest.files.length || completion.totalBytes !== total
        || completionBytes.toString("utf8") !== serialize(completion)) throw new ReleaseRestoreError("INCOMPLETE_STAGE");
      const files = new Map();
      if (kind !== "registry") {
        let next = 0;
        const workers = Array.from({ length: Math.min(4, manifest.files.length) }, async () => {
          while (next < manifest.files.length) {
            const file = manifest.files[next++];
            files.set(file.path, await download({ ...file, url: artifactFileUrl(manifest.baseUrl, file.path) }, record.artifactBaseUrl, 16 * 1024 * 1024));
          }
        });
        const results = await Promise.allSettled(workers);
        const failed = results.find(result => result.status === "rejected");
        if (failed) throw failed.reason;
      }
      return { manifest, manifestBytes, completionBytes, files };
    };
    const restored = [];
    for (const record of records) {
      const registry = await loadStage(record, "registry");
      const skill = await loadStage(record, "skill");
      for (const [name, reference] of [["manifest.json", record.skill.manifest], ["zeron-skills.zip", record.skill.archive], ["install.md", record.skill.guide]]) {
        const entry = skill.manifest.files.find(file => file.path === name);
        if (!entry || serialize({ url: entry.url, bytes: entry.bytes, sha256: entry.sha256 }) !== serialize(reference)) throw new ReleaseRestoreError("SKILL_REFERENCE_MISMATCH");
      }
      const skillDirectory = path.join(stage, "verified-skills", record.catalog.version);
      await writeFiles(skillDirectory, skill.files);
      const skillRelease = await verifySkillRelease(skillDirectory, JSON.parse(skill.files.get("manifest.json").toString("utf8")));
      if (skillRelease.skillVersion !== record.skill.version || skillRelease.siteBaseUrl !== record.siteBaseUrl
        || skillRelease.artifactBaseUrl !== record.artifactBaseUrl) throw new ReleaseRestoreError("SKILL_IDENTITY_MISMATCH");
      const catalog = await loadStage(record, "catalog");
      const verificationRef = catalog.manifest.files.find(file => file.path === "installation-verification.json");
      if (!verificationRef || serialize({ url: verificationRef.url, bytes: verificationRef.bytes, sha256: verificationRef.sha256 }) !== serialize(record.catalog.installationVerification)) throw new ReleaseRestoreError("VERIFICATION_REFERENCE_MISMATCH");
      const verified = await verifyCatalogReleaseFiles(catalog.files, catalog.manifest, { schemas });
      const { runtime, verification, identity } = verified;
      if (runtime.catalog.registryReleaseId !== record.registry.releaseId || runtime.catalog.registryManifestSha256 !== record.registry.manifest.sha256
        || runtime.catalog.skillVersion !== record.skill.version || identity.skillManifestSha256 !== record.skill.manifest.sha256
        || identity.siteBaseUrl !== record.siteBaseUrl || identity.artifactBaseUrl !== record.artifactBaseUrl
        || verification.registry.manifestSha256 !== record.registry.manifest.sha256
        || verification.registry.baseUrl !== registry.manifest.baseUrl
        || serialize(runtime.installation) !== serialize(runtimeInstallationSummary(verification))) throw new ReleaseRestoreError("CROSS_STAGE_BINDING_MISMATCH");
      const expectedSkills = await readSkillTexts(skillRelease.files, relative => skill.files.get(`sources/${relative}`));
      if (serialize(expectedSkills) !== serialize(runtime.skills)) throw new ReleaseRestoreError("HISTORICAL_SKILL_BYTES_MISMATCH");
      if (verified.examples) {
        const examples = verified.examples;
        if (serialize(examples.input.source) !== serialize(record.source) || examples.input.siteBaseUrl !== record.siteBaseUrl
          || examples.input.artifactBaseUrl !== record.artifactBaseUrl || serialize(examples.input.registry) !== serialize(record.registry)
          || serialize(examples.input.skill) !== serialize(record.skill)) throw new ReleaseRestoreError("EXAMPLE_FROZEN_RESOURCE_MISMATCH");
        const names = [...new Set(examples.verification.rows.flatMap(row => row.registryClosure))].sort();
        const items = [];
        for (const name of names) {
          const file = registry.manifest.files.find(file => file.path === `${name}.json`);
          if (!file) throw new ReleaseRestoreError("EXAMPLE_REGISTRY_SCOPE_MISMATCH");
          const item = JSON.parse((await download(file, record.artifactBaseUrl, 16 * 1024 * 1024)).toString("utf8"));
          if (item?.name !== name) throw new ReleaseRestoreError("EXAMPLE_REGISTRY_SCOPE_MISMATCH");
          items.push(item);
        }
        const available = maxTotalBytes - consumedBytes;
        if (available < 1) throw new ReleaseRestoreError("RESTORE_BYTE_BUDGET");
        const evidence = await readExampleVerification({ input: examples.input, npm: { cli: verification.cli }, scope: { items } },
          examples.sources, examples.verification, { fetcher, timeoutMs: Math.min(timeoutMs, remaining()), maxDurationMs: remaining(),
            maxTotalBytes: Math.min(128 * 1024 * 1024, available), downloadOptions });
        consumedBytes += evidence.consumedBytes;
        remaining();
      }
      for (const item of runtime.catalog.items.filter(item => item.installable)) {
        if (!registry.manifest.files.some(file => file.path === `${item.registryName}.json`)
          || !verification.registry.staticCheckedItems.includes(item.id)) throw new ReleaseRestoreError("REGISTRY_SCOPE_MISMATCH");
      }
      for (const matrix of verification.matrices) {
        if (matrix.testedItems.some(id => {
          const item = runtime.catalog.items.find(item => item.id === id);
          return !item?.installable || !item.framework || (matrix.framework === "vite" && item.framework === "next");
        }) || matrix.registryClosure.some(name => !registry.manifest.files.some(file => file.path === `${name}.json`))) throw new ReleaseRestoreError("CONSUMER_SCOPE_MISMATCH");
      }
      restored.push({ record, ...verified, skill, catalog });
    }
    for (let index = restored.length - 1; index > 0; index--) {
      schemas.validateItemIdentityEvolution(restored[index].identities, restored[index - 1].identities);
      schemas.validateGuideRouteEvolution(schemas.guideRoutesForRuntime(restored[index].runtime), schemas.guideRoutesForRuntime(restored[index - 1].runtime));
    }
    const prepared = path.join(stage, "prepared");
    const publicFiles = new Map();
    for (const entry of restored) {
      for (const [relative, bytes] of entry.catalog.files) publicFiles.set(`public/ai/releases/${entry.record.catalog.version}/${relative}`, bytes);
      publicFiles.set(`public/ai/releases/${entry.record.catalog.version}/manifest.json`, entry.catalog.manifestBytes);
      publicFiles.set(`public/ai/releases/${entry.record.catalog.version}/complete.json`, entry.catalog.completionBytes);
      for (const [relative, bytes] of entry.skill.files) publicFiles.set(`public/skills/releases/${entry.record.skill.version}/${relative}`, bytes);
      publicFiles.set(`public/skills/releases/${entry.record.skill.version}/artifacts.json`, entry.skill.manifestBytes);
      publicFiles.set(`public/skills/releases/${entry.record.skill.version}/complete.json`, entry.skill.completionBytes);
    }
    const current = restored[0];
    publicFiles.set("public/ai/catalog.json", current.catalog.files.get("catalog.json"));
    publicFiles.set("public/ai/instructions.md", current.catalog.files.get("instructions.md"));
    if (current.catalog.files.has("guide-routes.json")) publicFiles.set("public/ai/guide-routes.json", current.catalog.files.get("guide-routes.json"));
    for (const [relative, bytes] of current.catalog.files) {
      if (relative.startsWith("items/")) publicFiles.set(`public/ai/${relative}`, bytes);
      else if (relative.startsWith("ai/context/")) publicFiles.set(`public/${relative}`, bytes);
      else if (relative.startsWith("llms") && relative.endsWith(".txt")) publicFiles.set(`public/${relative}`, bytes);
    }
    for (const name of ["manifest.json", "zeron-skills.zip", "install.md"]) publicFiles.set(`public/skills/${name}`, current.skill.files.get(name));
    const bundle = { currentVersion: current.record.catalog.version, versions: restored.map(entry => entry.runtime) };
    const bundleBytes = Buffer.from(serialize(bundle));
    if (bundleBytes.length > 16 * 1024 * 1024) throw new ReleaseRestoreError("RUNTIME_BUNDLE_TOO_LARGE");
    publicFiles.set("docs/generated/agent-runtime/current.json", Buffer.from(serialize(current.runtime)));
    publicFiles.set("docs/generated/agent-runtime/bundle.json", bundleBytes);
    await writeFiles(prepared, publicFiles);
    remaining();
    await activatePreparedOutput(output, stage);
    return { schemaVersion: 1, scope: "verified-frozen-record-restoration-not-deployment", status: "passed",
      catalogVersion: current.record.catalog.version, versions: restored.map(entry => entry.record.catalog.version),
      downloadedBytes: consumedBytes, files: publicFiles.size, runtimeBytes: bundleBytes.length };
  } catch (error) {
    preserveStage = error.code === "ACTIVATION_ROLLBACK_FAILED";
    throw error;
  } finally {
    if (stage && !preserveStage) await rm(stage, { recursive: true, force: true });
    await rm(lock, { recursive: true, force: true });
  }
}
