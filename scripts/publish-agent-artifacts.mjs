import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { lstat, mkdir, mkdtemp, readFile, realpath, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { z } from "zod";
import { artifactFileUrl, artifactManifestName, artifactManifestSchema, validateArtifactBase, verifyArtifactDirectory } from "./agent-artifacts.mjs";
import { readOwnedFile, serialize, sha256, sourceProvenance } from "./agent-utils.mjs";
import { assembleSkillRelease, verifySkillRelease } from "./create-skill-release.mjs";
import { buildSkillArchive } from "./skill-archive.mjs";
import { createRegistryRelease, validateReleaseDependencies } from "./create-registry-release.mjs";
import { checkRegistry } from "../packages/registry/scripts/registry-check.mjs";
import { ArtifactDownloadError, downloadArtifact } from "./download-agent-artifact.mjs";

const hash = z.string().regex(/^[a-f0-9]{64}$/);
export const artifactCompletionSchema = z.object({
  schemaVersion: z.literal(1), kind: z.enum(["registry", "skill", "catalog"]),
  releaseId: z.string().min(1).max(64), baseUrl: z.string().url(),
  manifestUrl: z.string().url(), manifestSha256: hash,
  files: z.number().int().positive(), totalBytes: z.number().int().nonnegative(),
}).strict().superRefine((completion, context) => {
  try { validateArtifactBase(completion); }
  catch { context.addIssue({ code: "custom", path: ["baseUrl"], message: "Completion must use its fixed HTTPS release base" }); }
  if (completion.manifestUrl !== artifactFileUrl(completion.baseUrl, artifactManifestName(completion.kind))) {
    context.addIssue({ code: "custom", path: ["manifestUrl"], message: "Completion must bind its exact stage manifest URL" });
  }
});

async function reportOutsideCandidate(output, directory) {
  const candidate = await realpath(directory);
  let existing = output;
  const suffix = [];
  while (true) {
    try {
      const resolved = path.join(await realpath(existing), ...suffix);
      const relative = path.relative(candidate, resolved);
      if (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative)) throw new Error("Publication report must be outside the candidate directory");
      break;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      suffix.unshift(path.basename(existing));
      const parent = path.dirname(existing);
      if (parent === existing) throw error;
      existing = parent;
    }
  }
  try { if (!(await lstat(output)).isFile()) throw new Error("Publication report must be a regular file"); }
  catch (error) { if (error.code !== "ENOENT") throw error; }
}

/** Validate payload semantics as well as the raw-byte inventory. */
async function verifyRegistryRelease(directory, manifest) {
  const index = JSON.parse(await readOwnedFile(directory, "registry.json"));
  if (!Array.isArray(index.items) || !index.items.length) throw new Error("Registry index must have items");
  validateReleaseDependencies(index.items, manifest.baseUrl);
  const names = index.items.map((item) => item.name).sort();
  if (serialize(manifest.files.map((file) => file.path).sort()) !== serialize(["registry.json", ...names.map((name) => `${name}.json`)].sort())) {
    throw new Error("Registry publication files differ from its full index");
  }
  const items = await Promise.all(names.map(async (name) => {
    const item = JSON.parse(await readOwnedFile(directory, `${name}.json`));
    if (item.name !== name) throw new Error(`Registry publication item identity mismatch: ${name}`);
    return item;
  }));
  validateReleaseDependencies(items, manifest.baseUrl);
  const errors = checkRegistry(items);
  if (errors.length) throw new Error(`Registry publication closure failed:\n${errors.join("\n")}`);
}

export async function planArtifactPublication(directory, input) {
  const declaration = artifactManifestSchema.parse(input);
  if (declaration.files.length > 1024 || declaration.files.some(file => file.bytes > 16 * 1024 * 1024)
    || declaration.files.reduce((total, file) => total + file.bytes, 0) > 256 * 1024 * 1024) throw new Error("Artifact publication exceeds its fixed budget");
  const { manifest, manifestSha256 } = await verifyArtifactDirectory(directory, input);
  let catalogReviewSha256;
  if (manifest.kind === "registry") await verifyRegistryRelease(directory, manifest);
  else if (manifest.kind === "skill") {
    const release = await verifySkillRelease(directory, JSON.parse(await readOwnedFile(directory, "manifest.json")));
    if (release.skillVersion !== manifest.releaseId || `${release.artifactBaseUrl}/skills/releases/${release.skillVersion}` !== manifest.baseUrl) {
      throw new Error("Skill publication differs from its release identity");
    }
  } else {
    const { readCatalogPublicationCandidate } = await import("./agent-catalog-publication.mjs");
    catalogReviewSha256 = (await readCatalogPublicationCandidate(directory, manifest)).reviewSha256;
  }

  const manifestPath = artifactManifestName(manifest.kind);
  const manifestBytes = await readOwnedFile(directory, manifestPath);
  const files = [...manifest.files].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  const totalBytes = files.reduce((total, file) => total + file.bytes, 0);
  if (files.length > 1024 || totalBytes > 256 * 1024 * 1024 || files.some((file) => file.bytes > 16 * 1024 * 1024)
    || manifestBytes.length > 2 * 1024 * 1024) throw new Error("Artifact publication exceeds its fixed budget");
  const completion = artifactCompletionSchema.parse({ schemaVersion: 1, kind: manifest.kind, releaseId: manifest.releaseId,
    baseUrl: manifest.baseUrl, manifestUrl: artifactFileUrl(manifest.baseUrl, manifestPath), manifestSha256,
    files: files.length, totalBytes });
  const completionBytes = Buffer.from(serialize(completion));
  const entries = [...files.map((file) => ({ ...file, role: "payload" })),
    { role: "manifest", path: manifestPath, bytes: manifestBytes.length, sha256: manifestSha256,
      url: completion.manifestUrl, contentType: "application/json" },
    { role: "completion", path: "complete.json", bytes: completionBytes.length, sha256: sha256(completionBytes),
      url: artifactFileUrl(manifest.baseUrl, "complete.json"), contentType: "application/json" }];
  return { schemaVersion: 1, mode: "dry-run", scope: "validated-local-bytes-no-network-no-upload", kind: manifest.kind,
    releaseId: manifest.releaseId, baseUrl: manifest.baseUrl, manifestSha256,
    completion, entries, totalUploadBytes: entries.reduce((total, entry) => total + entry.bytes, 0),
    uploadOptions: { access: "public", addRandomSuffix: false, allowOverwrite: false, cacheControlMaxAge: 31536000 },
    ...(catalogReviewSha256 ? { catalogReviewSha256 } : {}),
    requiredReadback: "Every payload and manifest raw-byte hash must pass before completion; completion must also be read back and hashed" };
}

export class ArtifactPublicationError extends Error {
  constructor(code, report) { super(`Artifact publication failed: ${code}`); this.code = code; this.report = report; }
}

export class PublicationGateError extends Error {
  constructor(code) { super(`Publication gate failed: ${code}`); this.code = code; }
}

function publicationGateCode(error) {
  if (error instanceof PublicationGateError || error instanceof ArtifactPublicationError) return error.code;
  return /^(?:CATALOG_|CI_|PREDECESSOR_)[A-Z0-9_]{1,50}$/.test(error.code ?? "") || error.code === "NODE_22_REQUIRED"
    ? error.code : "INPUT_OR_IO_INVALID";
}

const provenanceSchema = z.object({ sourceRevision: z.string().regex(/^[a-f0-9]{40}$/),
  sourceInputSha256: hash, lockfileSha256: hash, sourceClean: z.literal(true) }).strict();

export function validatePublicationSourceBindings(actual, expected) {
  if (!actual.sourceClean) throw new PublicationGateError("DIRTY_SOURCE");
  const parsed = provenanceSchema.safeParse(expected);
  if (!parsed.success || serialize(actual) !== serialize(parsed.data)) throw new PublicationGateError("SOURCE_BINDING_MISMATCH");
  return parsed.data;
}

export async function verifyPublicationSource(directory, manifest, provenanceFile) {
  const root = fileURLToPath(new URL("..", import.meta.url));
  const actual = await sourceProvenance(root);
  if (!actual.sourceClean) throw new PublicationGateError("DIRTY_SOURCE");
  let expected = manifest.provenance;
  if (manifest.kind === "skill") {
    if (!provenanceFile) throw new PublicationGateError("SKILL_PROVENANCE_REQUIRED");
    const evidence = JSON.parse(await readFile(provenanceFile, "utf8"));
    expected = evidence.provenance ?? evidence;
    if (evidence.provenance && (evidence.kind !== "skill" || evidence.releaseId !== manifest.releaseId
      || evidence.manifestSha256 !== sha256(await readOwnedFile(directory, "artifacts.json")))) throw new PublicationGateError("SKILL_PROVENANCE_MANIFEST_MISMATCH");
  }
  validatePublicationSourceBindings(actual, expected);
  if (manifest.kind === "catalog") throw new PublicationGateError("CATALOG_REBUILD_GATE_REQUIRED");
  if (manifest.kind === "registry") {
    const temporary = await mkdtemp(path.join(tmpdir(), "zeron-registry-source-proof-"));
    try {
      const rebuilt = await createRegistryRelease({ releaseId: manifest.releaseId, artifactBaseUrl: new URL(manifest.baseUrl).origin,
        requireClean: true, outputBase: temporary });
      if (rebuilt.manifestSha256 !== sha256(await readOwnedFile(directory, "manifest.json"))) throw new PublicationGateError("REGISTRY_SOURCE_MISMATCH");
    } finally { await rm(temporary, { recursive: true, force: true }); }
  } else if (manifest.kind === "skill") {
    const release = await verifySkillRelease(directory, JSON.parse(await readOwnedFile(directory, "manifest.json")));
    const bundle = await buildSkillArchive();
    const rebuilt = assembleSkillRelease({ ...bundle, template: await readOwnedFile(root, "docs/skills/install.md").then(bytes => bytes.toString("utf8")),
      artifactBaseUrl: release.artifactBaseUrl, siteBaseUrl: release.siteBaseUrl });
    if (serialize(rebuilt.release) !== serialize(release)
      || !Buffer.from(rebuilt.guide).equals(await readOwnedFile(directory, "install.md"))) throw new PublicationGateError("SKILL_SOURCE_MISMATCH");
  }
  validatePublicationSourceBindings(await sourceProvenance(root), actual);
  return actual;
}

export function validatePublicationEnvironment(manifest, environment = process.env) {
  let origin;
  try { origin = new URL(manifest.baseUrl).origin; }
  catch { throw new PublicationGateError("ARTIFACT_ORIGIN_REQUIRED"); }
  if (environment.ARTIFACT_BASE_URL !== origin || origin.startsWith("http:")
    || /(?:\.invalid|\.example|\.test|\.localhost)$/.test(new URL(origin).hostname)
    || ["localhost", "example.com", "example.net", "example.org"].includes(new URL(origin).hostname)) {
    throw new PublicationGateError("ARTIFACT_ORIGIN_MISMATCH_OR_RESERVED");
  }
  if (!environment.BLOB_READ_WRITE_TOKEN && !(environment.BLOB_STORE_ID && environment.VERCEL_OIDC_TOKEN)) {
    throw new PublicationGateError("BLOB_AUTHENTICATION_REQUIRED");
  }
}

export async function blobArtifactWriter(pathname, bytes, options) {
  const { put } = await import("@vercel/blob");
  return put(pathname, bytes, options);
}

export function matchingArtifactUploadUrl(value, expected) {
  try {
    if (typeof value !== "string") return false;
    const actual = new URL(value), target = new URL(expected);
    return actual.origin === target.origin && !actual.username && !actual.password && !actual.search && !actual.hash
      && actual.pathname.split("/").map(part => encodeURIComponent(decodeURIComponent(part))).join("/") === target.pathname;
  } catch { return false; }
}

/** Injected I/O allows fault testing; the CLI separately enforces source and credential gates. */
export async function publishArtifactPublication(directory, input, { writer, fetcher = fetch, timeoutMs = 12000,
  downloadOptions = {}, maxDurationMs = 600000, verifyCatalogGate = undefined } = {}) {
  if (typeof writer !== "function" || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000
    || !Number.isInteger(maxDurationMs) || maxDurationMs < 1 || maxDurationMs > 600000) throw new Error("Invalid publication I/O configuration");
  const report = { schemaVersion: 1, mode: "upload", scope: "public-object-readback-not-application-activation",
    status: "running", kind: input.kind, releaseId: input.releaseId, completed: [] };
  let locked = false;
  let current;
  const lock = `${await realpath(directory)}.publish.lock`;
  const deadline = Date.now() + maxDurationMs;
  const remaining = () => {
    const value = deadline - Date.now();
    if (value <= 0) throw new ArtifactPublicationError("PUBLICATION_TIMEOUT", report);
    return Math.min(value, timeoutMs);
  };
  try {
    await mkdir(lock);
    locked = true;
    const plan = await planArtifactPublication(directory, input);
    report.manifestSha256 = plan.manifestSha256;
    report.baseUrl = plan.baseUrl;
    const origin = new URL(plan.baseUrl).origin;
    // Freeze and verify all upload bytes before any network write, avoiding local TOCTOU drift.
    const bodies = new Map();
    for (const entry of plan.entries) {
      const body = entry.role === "completion" ? Buffer.from(serialize(plan.completion)) : await readOwnedFile(directory, entry.path);
      if (body.length !== entry.bytes || sha256(body) !== entry.sha256) throw new ArtifactPublicationError("LOCAL_BYTES_CHANGED", report);
      bodies.set(entry.path, body);
    }
    if (plan.kind === "catalog") {
      if (typeof verifyCatalogGate !== "function") throw new ArtifactPublicationError("CATALOG_REBUILD_GATE_REQUIRED", report);
      const gate = await verifyCatalogGate();
      if (serialize(gate?.source) !== serialize(input.provenance) || gate?.reviewSha256 !== plan.catalogReviewSha256
        || gate?.manifestSha256 !== plan.manifestSha256) throw new ArtifactPublicationError("CATALOG_GATE_CHANGED", report);
      report.catalogReviewSha256 = gate.reviewSha256;
    }
    const readback = async (entry, allowMissing) => downloadArtifact(entry.url, {
      ...downloadOptions, fetcher, origin, bytes: entry.bytes, hash: entry.sha256, allowMissing,
      maxBytes: entry.role === "manifest" ? 2 * 1024 * 1024 : entry.role === "completion" ? 64 * 1024 : 16 * 1024 * 1024,
      timeoutMs: remaining(),
      maxDurationMs: Math.min(90000, deadline - Date.now()),
    });
    for (const entry of plan.entries) {
      current = entry;
      let action = "reused";
      if (!await readback(entry, true)) {
        const controller = new AbortController();
        let timer;
        let writeFailed = false;
        try {
          const expiry = new Promise((_, reject) => {
            timer = setTimeout(() => { controller.abort(); reject(new Error("Write deadline")); }, remaining());
          });
          const result = await Promise.race([writer(decodeURIComponent(new URL(entry.url).pathname.slice(1)), bodies.get(entry.path),
            { ...plan.uploadOptions, contentType: entry.contentType, abortSignal: controller.signal }), expiry]);
          if (!matchingArtifactUploadUrl(result?.url, entry.url)) throw new ArtifactPublicationError("UNEXPECTED_UPLOAD_URL", report);
        } catch (error) {
          if (error instanceof ArtifactPublicationError) throw error;
          writeFailed = true;
        } finally { clearTimeout(timer); controller.abort(); }
        // A timeout or conflict can mean the write succeeded; recover only by exact public bytes.
        try { await readback(entry, false); }
        catch (error) {
          if (writeFailed && error.code === "NOT_FOUND") throw new ArtifactPublicationError("WRITE_NOT_CONFIRMED", report);
          throw error;
        }
        action = writeFailed ? "recovered-by-readback" : "uploaded";
      }
      report.completed.push({ path: entry.path, role: entry.role, bytes: entry.bytes, sha256: entry.sha256, action });
    }
    report.status = "completed";
    report.totalBytes = plan.totalUploadBytes;
    return report;
  } catch (error) {
    report.status = "failed";
    report.error = { code: error instanceof ArtifactPublicationError ? error.code
      : error.code === "EEXIST" && !locked ? "PUBLICATION_LOCKED"
        : error instanceof ArtifactDownloadError ? error.code : "PUBLICATION_VALIDATION_OR_IO_FAILED",
    ...(current ? { path: current.path, role: current.role } : {}) };
    throw new ArtifactPublicationError(report.error.code, report);
  } finally { if (locked) await rm(lock, { recursive: true, force: true }); }
}

async function main() {
  const args = process.argv.slice(2);
  const options = {};
  for (let index = 0; index < args.length; index++) {
    const key = args[index];
    if (key === "--dry-run" && !options.dryRun) options.dryRun = true;
    else if (key === "--upload" && !options.upload) options.upload = true;
    else if (["--manifest", "--output", "--provenance"].includes(key) && args[index + 1] && !args[index + 1].startsWith("--")) {
      const name = key.slice(2);
      if (options[name]) throw new Error(`Duplicate option: ${key}`);
      options[name] = args[++index];
    } else throw new PublicationGateError("INVALID_ARGUMENTS");
  }
  if (Boolean(options.dryRun) === Boolean(options.upload) || !options.manifest || (options.dryRun && options.provenance)) throw new PublicationGateError("EXPLICIT_PUBLICATION_MODE_REQUIRED");
  const manifestFile = path.resolve(options.manifest);
  const manifestStat = await lstat(manifestFile);
  if (!manifestStat.isFile() || manifestStat.size > 2 * 1024 * 1024) throw new PublicationGateError("INVALID_MANIFEST_FILE");
  const manifestBytes = await readFile(manifestFile);
  if (manifestBytes.length > 2 * 1024 * 1024) throw new PublicationGateError("INVALID_MANIFEST_FILE");
  const manifest = artifactManifestSchema.parse(JSON.parse(manifestBytes.toString("utf8")));
  if (path.basename(manifestFile) !== artifactManifestName(manifest.kind)) throw new Error("Use the stage's artifact manifest, not an inner Skill manifest");
  const plan = await planArtifactPublication(path.dirname(manifestFile), manifest);
  const root = fileURLToPath(new URL("..", import.meta.url));
  const output = path.resolve(options.output ?? path.join(root, "output/agent-access", `${plan.kind}-publication-${options.upload ? "result" : "plan"}.json`));
  await reportOutsideCandidate(output, path.dirname(manifestFile));
  let result = plan;
  if (options.upload) {
    let provenance;
    try {
      let verifyCatalogGate;
      if (manifest.kind === "catalog") {
        if (options.provenance) throw new PublicationGateError("CATALOG_PROVENANCE_ARGUMENT_FORBIDDEN");
        validatePublicationSourceBindings(await sourceProvenance(root), manifest.provenance);
        validatePublicationEnvironment(manifest);
        const { verifyCatalogPublicationSource, confirmCatalogPublicationGate } = await import("./agent-catalog-publication.mjs");
        const gate = await verifyCatalogPublicationSource(path.dirname(manifestFile), manifest);
        provenance = gate.source;
        verifyCatalogGate = () => confirmCatalogPublicationGate(path.dirname(manifestFile), manifest, gate);
      } else {
        provenance = await verifyPublicationSource(path.dirname(manifestFile), manifest, options.provenance);
        validatePublicationEnvironment(manifest);
      }
      result = { ...await publishArtifactPublication(path.dirname(manifestFile), manifest, { writer: blobArtifactWriter, verifyCatalogGate }), provenance };
    }
    catch (error) {
      const failure = error instanceof ArtifactPublicationError ? error.report : {
        schemaVersion: 1, mode: "upload", scope: "publication-gate-rejected-no-network-write", status: "failed",
        kind: plan.kind, releaseId: plan.releaseId, manifestSha256: plan.manifestSha256, completed: [],
        error: { code: publicationGateCode(error) },
      };
      await mkdir(path.dirname(output), { recursive: true });
      await writeFile(output, serialize({ ...failure, ...(provenance ? { provenance } : {}) }));
      throw error;
    }
  }
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, serialize(result));
  console.log(options.upload ? `Publication readback completed: ${plan.kind} ${plan.releaseId}; application version not activated`
    : `Publication dry-run: ${plan.kind} ${plan.releaseId}; ${plan.entries.length} objects, ${plan.totalUploadBytes} bytes; no network or upload`);
  console.log(`Evidence: ${output}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(`Publication failed: ${publicationGateCode(error)}`);
    process.exitCode = 1;
  });
}
