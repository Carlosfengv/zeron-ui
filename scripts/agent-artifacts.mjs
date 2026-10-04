import { lstat, mkdir, readdir, rename, rm } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { readOwnedFile, serialize, sha256 } from "./agent-utils.mjs";

const hash = z.string().regex(/^[a-f0-9]{64}$/);
const safePath = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._:/-]*$/).refine((value) => (
  value.split("/").every((part) => part && part !== "." && part !== "..")
), "Artifact paths must be unencoded relative paths without traversal");

export const artifactFileUrl = (baseUrl, relative) => `${baseUrl}/${safePath.parse(relative).split("/").map(encodeURIComponent).join("/")}`;

export function artifactOrigin(value) {
  if (typeof value !== "string") throw new Error("ARTIFACT_BASE_URL must be an explicit HTTPS origin");
  const url = new URL(value);
  if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || url.pathname !== "/") {
    throw new Error("ARTIFACT_BASE_URL must be an explicit HTTPS origin without credentials, path, query or fragment");
  }
  return url.origin;
}

export function registryReleaseBase(origin, releaseId) {
  if (typeof releaseId !== "string" || !/^[a-z0-9][a-z0-9._-]{0,63}$/.test(releaseId) || releaseId.includes("..")) {
    throw new Error("Registry release ID must be 1–64 lowercase safe characters without traversal");
  }
  return `${artifactOrigin(origin)}/r/releases/${releaseId}`;
}

export const artifactManifestName = (kind) => kind === "skill" ? "artifacts.json" : "manifest.json";

export function validateArtifactBase({ kind, releaseId, baseUrl }) {
  const url = new URL(baseUrl);
  artifactOrigin(url.origin);
  if (url.username || url.password || url.search || url.hash || url.href !== baseUrl || /%|\/\/$/.test(baseUrl)) throw new Error("Invalid artifact base");
  safePath.parse(url.pathname.slice(1));
  if (kind === "registry" && baseUrl !== registryReleaseBase(url.origin, releaseId)) throw new Error("Registry release/base mismatch");
  if (kind !== "registry" && (!/^[a-f0-9]{64}$/.test(releaseId) || baseUrl !== `${url.origin}/${kind === "skill" ? "skills" : "ai"}/releases/${releaseId}`)) throw new Error("Artifact release/base mismatch");
  return url;
}

export const artifactManifestSchema = z.object({
  schemaVersion: z.literal(1),
  kind: z.enum(["registry", "skill", "catalog"]),
  releaseId: z.string().min(1).max(64),
  baseUrl: z.string().url(),
  files: z.array(z.object({
    path: safePath,
    bytes: z.number().int().nonnegative(),
    sha256: hash,
    url: z.string().url(),
    contentType: z.enum(["application/json", "application/zip", "text/markdown; charset=utf-8", "text/plain; charset=utf-8"]),
  }).strict()).min(1),
  provenance: z.object({
    sourceRevision: z.string().regex(/^[a-f0-9]{40}$/),
    sourceInputSha256: hash,
    lockfileSha256: hash,
    sourceClean: z.boolean(),
  }).strict().optional(),
}).strict().superRefine((manifest, context) => {
  const names = new Set();
  for (const [index, file] of manifest.files.entries()) {
    if (names.has(file.path) || file.path === artifactManifestName(manifest.kind) || file.path === "complete.json") {
      context.addIssue({ code: "custom", path: ["files", index, "path"], message: "Duplicate or reserved artifact path" });
    }
    names.add(file.path);
    if (safePath.safeParse(file.path).success && file.url !== artifactFileUrl(manifest.baseUrl, file.path)) {
      context.addIssue({ code: "custom", path: ["files", index, "url"], message: "Artifact URL must match its fixed base and exact path" });
    }
  }
  try {
    validateArtifactBase(manifest);
  } catch {
    context.addIssue({ code: "custom", path: ["baseUrl"], message: "Invalid fixed HTTPS artifact base" });
  }
  if (manifest.kind === "skill" ? manifest.provenance !== undefined : !manifest.provenance) {
    context.addIssue({ code: "custom", path: ["provenance"], message: "Registry/Catalog provenance is required; content-addressed Skill provenance belongs in the outer release record" });
  }
});

export async function artifactFiles(directory, baseUrl, { kind = "registry" } = {}) {
  const result = [];
  async function visit(relative = "") {
    for (const entry of await readdir(path.join(directory, relative), { withFileTypes: true })) {
      const name = relative ? `${relative}/${entry.name}` : entry.name;
      safePath.parse(name);
      if (entry.isDirectory()) await visit(name);
      else {
        if (!entry.isFile()) throw new Error(`Non-regular artifact: ${name}`);
        if (name === artifactManifestName(kind) || name === "complete.json") throw new Error(`Reserved artifact name: ${name}`);
        const bytes = await readOwnedFile(directory, name);
        const contentType = name.endsWith(".json") ? "application/json" : name.endsWith(".zip") ? "application/zip"
          : name.endsWith(".md") ? "text/markdown; charset=utf-8" : "text/plain; charset=utf-8";
        result.push({ path: name, bytes: bytes.length, sha256: sha256(bytes), url: artifactFileUrl(baseUrl, name), contentType });
      }
    }
  }
  await visit();
  return result.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
}

/** Verify exactly the declared bytes, including the absence of unlisted files. */
export async function verifyArtifactDirectory(directory, input) {
  const manifest = artifactManifestSchema.parse(input);
  const actual = [];
  async function visit(relative = "") {
    for (const entry of await readdir(path.join(directory, relative), { withFileTypes: true })) {
      const name = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory()) await visit(name);
      else {
        if (!entry.isFile()) throw new Error(`Non-regular artifact: ${name}`);
        if (name !== artifactManifestName(manifest.kind)) actual.push(name);
      }
    }
  }
  if (!(await lstat(directory)).isDirectory()) throw new Error("Artifact root must be a regular directory");
  await visit();
  const expected = manifest.files.map((file) => file.path).sort();
  if (serialize(actual.sort()) !== serialize(expected)) throw new Error("Artifact file set does not match manifest");
  for (const file of manifest.files) {
    const bytes = await readOwnedFile(directory, file.path);
    if (bytes.length !== file.bytes || sha256(bytes) !== file.sha256) throw new Error(`Artifact hash/size mismatch: ${file.path}`);
  }
  const manifestBytes = await readOwnedFile(directory, artifactManifestName(manifest.kind));
  if (manifestBytes.toString("utf8") !== serialize(manifest)) throw new Error("Artifact manifest is not its canonical frozen bytes");
  return { manifest, manifestSha256: sha256(manifestBytes) };
}

/** Append a local candidate atomically; retries may reuse only identical bytes. */
export async function commitArtifactCandidate(stage, destination, input) {
  const verified = await verifyArtifactDirectory(stage, input);
  const lock = `${destination}.lock`;
  await mkdir(lock);
  try {
    let exists = false;
    try {
      if (!(await lstat(destination)).isDirectory()) throw new Error("Existing release root must be a regular directory");
      exists = true;
    }
    catch (error) { if (error.code !== "ENOENT") throw error; }
    if (exists) {
      const previous = await verifyArtifactDirectory(destination, JSON.parse(await readOwnedFile(destination, artifactManifestName(verified.manifest.kind))));
      if (previous.manifestSha256 !== verified.manifestSha256) throw new Error("Release path already contains different bytes; use a new release ID");
    } else {
      await rename(stage, destination);
    }
    return verified;
  } finally { await rm(lock, { recursive: true, force: true }); }
}
