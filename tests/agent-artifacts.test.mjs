import { afterEach, describe, expect, it } from "vitest";
import { lstat, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { artifactFileUrl, artifactFiles, artifactManifestSchema, artifactOrigin, commitArtifactCandidate, registryReleaseBase, verifyArtifactDirectory } from "../scripts/agent-artifacts.mjs";
import { validateReleaseDependencies } from "../scripts/create-registry-release.mjs";
import { serialize, sha256 } from "../scripts/agent-utils.mjs";

const baseUrl = "https://artifacts.example.invalid/r/releases/test-01";
const provenance = { sourceRevision: "a".repeat(40), sourceInputSha256: "b".repeat(64), lockfileSha256: "c".repeat(64), sourceClean: false };
const owned = [];
async function directory() {
  const result = await mkdtemp(path.join(tmpdir(), "zeron-artifact-test-"));
  owned.push(result);
  return result;
}
async function candidate(parent, name, content = '{"name":"button"}\n') {
  const dir = path.join(parent, name);
  await mkdir(dir);
  await writeFile(path.join(dir, "button.json"), content);
  const manifest = artifactManifestSchema.parse({ schemaVersion: 1, kind: "registry", releaseId: "test-01", baseUrl,
    files: await artifactFiles(dir, baseUrl), provenance });
  await writeFile(path.join(dir, "manifest.json"), serialize(manifest));
  return { dir, manifest };
}
afterEach(async () => { await Promise.all(owned.splice(0).map((dir) => rm(dir, { recursive: true, force: true }))); });

describe("fixed artifact source and Registry closure", () => {
  it("requires an explicit origin and safe release identity", () => {
    expect(registryReleaseBase("https://artifacts.example.invalid/", "candidate-01")).toBe("https://artifacts.example.invalid/r/releases/candidate-01");
    for (const origin of [undefined, "http://localhost", "https://user:secret@host", "https://host/path", "https://host?preview=1", "https://host/#fragment"]) {
      expect(() => artifactOrigin(origin)).toThrow();
    }
    for (const id of [undefined, "..", "a..b", "a/b", "a%2Fb", "UPPER", "x".repeat(65)]) {
      expect(() => registryReleaseBase("https://host", id)).toThrow();
    }
  });

  it("rejects foreign, mutable, encoded or missing Registry dependencies", () => {
    const items = [{ name: "button" }, { name: "dialog", registryDependencies: [`${baseUrl}/button.json`] }];
    expect(() => validateReleaseDependencies(items, baseUrl)).not.toThrow();
    for (const dependency of ["button", "utils", "https://foreign.invalid/r/releases/test-01/button.json", "https://artifacts.example.invalid/r/button.json", `${baseUrl}/missing.json`, `${baseUrl}/%62utton.json`, `${baseUrl}/button.json?version=other`]) {
      expect(() => validateReleaseDependencies([items[0], { ...items[1], registryDependencies: [dependency] }], baseUrl)).toThrow(/outside/);
    }
  });
});

describe("raw-byte artifact manifest", () => {
  it("encodes a raw stable item identity once in its public URL", () => {
    expect(artifactFileUrl(baseUrl, "items/component:button.json")).toBe(`${baseUrl}/items/component%3Abutton.json`);
    expect(() => artifactFileUrl(baseUrl, "items/component%3Abutton.json")).toThrow();
  });
  it("covers every distributed byte without including its own hash", async () => {
    const { dir, manifest } = await candidate(await directory(), "stage", '{"title":"中文"}\n');
    expect(manifest.files[0]).toMatchObject({ bytes: Buffer.byteLength('{"title":"中文"}\n'), sha256: sha256('{"title":"中文"}\n'), contentType: "application/json" });
    const result = await verifyArtifactDirectory(dir, manifest);
    expect(result.manifestSha256).toBe(sha256(await readFile(path.join(dir, "manifest.json"))));
    expect(manifest.files).toHaveLength(1);
  });

  it("rejects duplicate, reserved, traversal and inconsistent URL paths", async () => {
    const { manifest } = await candidate(await directory(), "stage");
    expect(artifactManifestSchema.safeParse({ ...manifest, files: [...manifest.files, manifest.files[0]] }).success).toBe(false);
    for (const file of [
      { ...manifest.files[0], path: "manifest.json", url: `${baseUrl}/manifest.json` },
      { ...manifest.files[0], path: "complete.json", url: `${baseUrl}/complete.json` },
      { ...manifest.files[0], path: "../button.json", url: `${baseUrl}/../button.json` },
      { ...manifest.files[0], path: "a//button.json", url: `${baseUrl}/a//button.json` },
      { ...manifest.files[0], path: "button%2Ejson", url: `${baseUrl}/button%2Ejson` },
      { ...manifest.files[0], url: "https://foreign.invalid/button.json" },
    ]) expect(artifactManifestSchema.safeParse({ ...manifest, files: [file] }).success).toBe(false);
    expect(artifactManifestSchema.safeParse({ ...manifest, releaseId: "different-id" }).success).toBe(false);
  });

  it("detects tampered bytes, unexpected files and noncanonical manifests", async () => {
    const { dir, manifest } = await candidate(await directory(), "stage");
    await writeFile(path.join(dir, "button.json"), '{"name":"switch"}\n');
    await expect(verifyArtifactDirectory(dir, manifest)).rejects.toThrow(/hash\/size/);
    await writeFile(path.join(dir, "button.json"), '{"name":"button"}\n');
    await writeFile(path.join(dir, "extra.json"), "{}");
    await expect(verifyArtifactDirectory(dir, manifest)).rejects.toThrow(/file set/);
    await rm(path.join(dir, "extra.json"));
    await writeFile(path.join(dir, "manifest.json"), JSON.stringify(manifest));
    await expect(verifyArtifactDirectory(dir, manifest)).rejects.toThrow(/canonical/);
  });

  it("refuses symlinks instead of hashing or distributing outside files", async () => {
    const parent = await directory();
    const { dir, manifest } = await candidate(parent, "stage");
    const external = path.join(parent, "external.json");
    await writeFile(external, '{"name":"button"}\n');
    await rm(path.join(dir, "button.json"));
    await symlink(external, path.join(dir, "button.json"));
    await expect(verifyArtifactDirectory(dir, manifest)).rejects.toThrow(/Non-regular/);
    await expect(artifactFiles(dir, baseUrl)).rejects.toThrow(/Non-regular/);
  });
});

describe("append-only local candidate", () => {
  it("atomically creates a release and reuses identical bytes", async () => {
    const parent = await directory();
    const first = await candidate(parent, "first");
    const destination = path.join(parent, "release");
    const created = await commitArtifactCandidate(first.dir, destination, first.manifest);
    await expect(lstat(first.dir)).rejects.toMatchObject({ code: "ENOENT" });
    const retry = await candidate(parent, "retry");
    expect((await commitArtifactCandidate(retry.dir, destination, retry.manifest)).manifestSha256).toBe(created.manifestSha256);
    expect((await lstat(retry.dir)).isDirectory()).toBe(true);
    await expect(lstat(`${destination}.lock`)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("keeps old bytes on conflict and rejects a damaged existing release", async () => {
    const parent = await directory();
    const first = await candidate(parent, "first");
    const destination = path.join(parent, "release");
    await commitArtifactCandidate(first.dir, destination, first.manifest);
    const changed = await candidate(parent, "changed", '{"name":"new"}\n');
    await expect(commitArtifactCandidate(changed.dir, destination, changed.manifest)).rejects.toThrow(/different bytes/);
    expect(await readFile(path.join(destination, "button.json"), "utf8")).toBe('{"name":"button"}\n');
    await rm(path.join(destination, "manifest.json"));
    await expect(commitArtifactCandidate(changed.dir, destination, changed.manifest)).rejects.toMatchObject({ code: "ENOENT" });
    expect(await readFile(path.join(destination, "button.json"), "utf8")).toBe('{"name":"button"}\n');
  });

  it("does not steal another writer's lock", async () => {
    const parent = await directory();
    const stage = await candidate(parent, "stage");
    const destination = path.join(parent, "release");
    await mkdir(`${destination}.lock`);
    await expect(commitArtifactCandidate(stage.dir, destination, stage.manifest)).rejects.toMatchObject({ code: "EEXIST" });
    expect((await lstat(`${destination}.lock`)).isDirectory()).toBe(true);
    await expect(lstat(destination)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("does not follow an existing release root symlink", async () => {
    const parent = await directory();
    const stage = await candidate(parent, "stage");
    const destination = path.join(parent, "release");
    await symlink(stage.dir, destination);
    await expect(commitArtifactCandidate(stage.dir, destination, stage.manifest)).rejects.toThrow(/regular directory/);
    expect((await lstat(destination)).isSymbolicLink()).toBe(true);
  });
});
