import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { buildSkillRelease } from "../scripts/create-skill-release.mjs";
import { artifactFiles, verifyArtifactDirectory } from "../scripts/agent-artifacts.mjs";
import { artifactCompletionSchema, planArtifactPublication, publishArtifactPublication, validatePublicationEnvironment,
  validatePublicationSourceBindings } from "../scripts/publish-agent-artifacts.mjs";
import { serialize, sha256 } from "../scripts/agent-utils.mjs";

let parent;
let skill;
const baseUrl = "https://artifacts.example.invalid/r/releases/test-01";
const provenance = { sourceRevision: "a".repeat(40), sourceInputSha256: "b".repeat(64), lockfileSha256: "c".repeat(64), sourceClean: false };
const meta = { zeron: { framework: "react", react: "^19.0.0", tailwind: "^4.0.0", kind: "ui" } };
async function registry(name, dependency = `${baseUrl}/utils.json`) {
  const directory = path.join(parent, name);
  await mkdir(directory);
  const items = [{ name: "utils", meta, files: [{ path: "utils.ts", target: "lib/utils.ts", content: 'export const id = "x";' }] },
    { name: "button", meta, registryDependencies: [dependency], files: [{ path: "button.ts", target: "components/ui/button.ts", content: 'import {id} from "@lib/utils"; export {id};' }] }];
  await writeFile(path.join(directory, "registry.json"), serialize({ items }));
  for (const item of items) await writeFile(path.join(directory, `${item.name}.json`), serialize(item));
  const manifest = { schemaVersion: 1, kind: "registry", releaseId: "test-01", baseUrl, files: await artifactFiles(directory, baseUrl), provenance };
  await writeFile(path.join(directory, "manifest.json"), serialize(manifest));
  return { directory, manifest };
}
beforeAll(async () => {
  parent = await mkdtemp(path.join(tmpdir(), "zeron-publication-test-"));
  skill = await buildSkillRelease({ artifactBaseUrl: "https://artifacts.example.invalid", siteBaseUrl: "https://docs.example.invalid", outputBase: path.join(parent, "skills") });
}, 10000);
afterAll(async () => { await rm(parent, { recursive: true, force: true }); });

describe("publication dry-run", () => {
  it("verifies every Skill file and places manifest then completion last without network or candidate writes", async () => {
    const before = (await readdir(skill.directory)).sort();
    const fetcher = vi.spyOn(globalThis, "fetch").mockImplementation(() => { throw new Error("Dry-run must not make a network call"); });
    let plan;
    try { plan = await planArtifactPublication(skill.directory, skill.manifest); }
    finally { fetcher.mockRestore(); }
    expect(plan.scope).toBe("validated-local-bytes-no-network-no-upload");
    expect(plan.entries.slice(-2).map((entry) => [entry.role, entry.path])).toEqual([["manifest", "artifacts.json"], ["completion", "complete.json"]]);
    expect(plan.entries.filter((entry) => entry.role === "payload")).toHaveLength(skill.manifest.files.length);
    expect(plan.uploadOptions).toMatchObject({ access: "public", addRandomSuffix: false, allowOverwrite: false });
    expect(plan.completion.manifestSha256).toBe(skill.manifestSha256);
    expect(plan.entries.at(-1).sha256).toBe(sha256(serialize(plan.completion)));
    expect(plan.totalUploadBytes).toBe(plan.entries.reduce((total, entry) => total + entry.bytes, 0));
    expect((await readdir(skill.directory)).sort()).toEqual(before);
    expect((await verifyArtifactDirectory(skill.directory, skill.manifest)).manifestSha256).toBe(skill.manifestSha256);
  });

  it("checks the complete Registry dependency closure before planning publication", async () => {
    const valid = await registry("valid");
    const plan = await planArtifactPublication(valid.directory, valid.manifest);
    expect(plan.completion.files).toBe(3);
    expect(plan.entries.slice(-2).map((entry) => entry.path)).toEqual(["manifest.json", "complete.json"]);
    const invalid = await registry("foreign", "https://foreign.invalid/r/releases/test-01/utils.json");
    await verifyArtifactDirectory(invalid.directory, invalid.manifest);
    await expect(planArtifactPublication(invalid.directory, invalid.manifest)).rejects.toThrow(/outside the fixed release/);
  });

  it("rejects changed payload bytes before emitting completion metadata", async () => {
    const valid = await registry("tampered");
    await writeFile(path.join(valid.directory, "button.json"), "{}");
    await expect(planArtifactPublication(valid.directory, valid.manifest)).rejects.toThrow(/hash\/size/);
    expect(await readFile(path.join(valid.directory, "manifest.json"), "utf8")).toBe(serialize(valid.manifest));
    expect((await readdir(valid.directory)).includes("complete.json")).toBe(false);
  });

  it("rejects completion metadata for a crossed release, foreign manifest or non-HTTPS base", async () => {
    const valid = await registry("completion");
    const { completion } = await planArtifactPublication(valid.directory, valid.manifest);
    expect(artifactCompletionSchema.safeParse(completion).success).toBe(true);
    for (const change of [{ releaseId: "other" }, { manifestUrl: "https://foreign.invalid/manifest.json" },
      { baseUrl: "http://artifacts.example.invalid/r/releases/test-01", manifestUrl: "http://artifacts.example.invalid/r/releases/test-01/manifest.json" },
    ]) expect(artifactCompletionSchema.safeParse({ ...completion, ...change }).success).toBe(false);
  });
});

function publicStore() {
  const objects = new Map();
  const events = [];
  const fetcher = vi.fn(async (url, init) => {
    events.push(["read", url]);
    expect(init.headers.authorization).toBeUndefined();
    return objects.has(url) ? new Response(objects.get(url)) : new Response(null, { status: 404 });
  });
  const writer = vi.fn(async (pathname, body, options) => {
    const url = `https://artifacts.example.invalid/${pathname.split("/").map(encodeURIComponent).join("/")}`;
    events.push(["write", url]);
    expect(options).toMatchObject({ access: "public", addRandomSuffix: false, allowOverwrite: false, cacheControlMaxAge: 31536000 });
    if (objects.has(url)) throw new Error("Conflict");
    objects.set(url, Buffer.from(body));
    return { url };
  });
  return { objects, events, fetcher, writer, downloadOptions: { attempts: 1, retryDelayMs: 0 } };
}

describe("append-only publication controller", () => {
  it("reads every payload and manifest before writing completion, then verifies completion itself", async () => {
    const candidate = await registry("upload-first");
    const store = publicStore();
    const plan = await planArtifactPublication(candidate.directory, candidate.manifest);
    const result = await publishArtifactPublication(candidate.directory, candidate.manifest, store);
    expect(result.status).toBe("completed");
    expect(result.completed.map(x => x.path)).toEqual(plan.entries.map(x => x.path));
    expect(result.completed.every(x => x.action === "uploaded")).toBe(true);
    const completionWrite = store.events.findIndex(([action, url]) => action === "write" && url.endsWith("complete.json"));
    for (const entry of plan.entries.slice(0, -1)) {
      expect(store.events.slice(0, completionWrite).filter(([action, url]) => action === "read" && url === entry.url)).toHaveLength(2);
    }
    expect(store.events.at(-1)).toEqual(["read", plan.entries.at(-1).url]);
    expect((await readdir(candidate.directory)).includes("complete.json")).toBe(false);
    store.writer.mockClear();
    const reused = await publishArtifactPublication(candidate.directory, candidate.manifest, store);
    expect(reused.completed.every(x => x.action === "reused")).toBe(true);
    expect(store.writer).not.toHaveBeenCalled();
  });

  it("rejects different existing bytes before any write and leaves a failed report", async () => {
    const candidate = await registry("upload-conflict");
    const store = publicStore();
    store.objects.set(`${baseUrl}/button.json`, Buffer.from("{}"));
    await expect(publishArtifactPublication(candidate.directory, candidate.manifest, store)).rejects.toMatchObject({
      code: "HASH_OR_SIZE_MISMATCH", report: { status: "failed", completed: [], error: { path: "button.json" } },
    });
    expect(store.writer).not.toHaveBeenCalled();
  });

  it("retains a partial candidate and resumes missing identical objects without writing completion early", async () => {
    const candidate = await registry("upload-interrupted");
    const store = publicStore();
    const write = store.writer.getMockImplementation();
    store.writer.mockImplementation(async (...args) => {
      if (args[0].endsWith("registry.json")) throw new Error("secret credential must not enter report");
      return write(...args);
    });
    let failure;
    try { await publishArtifactPublication(candidate.directory, candidate.manifest, store); }
    catch (error) { failure = error; }
    expect(failure.report).toMatchObject({ status: "failed", completed: [{ path: "button.json", action: "uploaded" }], error: { code: "WRITE_NOT_CONFIRMED" } });
    expect(JSON.stringify(failure.report)).not.toContain("secret");
    expect(store.objects.has(`${baseUrl}/complete.json`)).toBe(false);
    store.writer.mockImplementation(write);
    const result = await publishArtifactPublication(candidate.directory, candidate.manifest, store);
    expect(result.status).toBe("completed");
    expect(result.completed[0].action).toBe("reused");
  });

  it("recovers an uncertain write or concurrent conflict only by matching public readback", async () => {
    const candidate = await registry("upload-uncertain");
    const store = publicStore();
    const write = store.writer.getMockImplementation();
    store.writer.mockImplementation(async (...args) => { await write(...args); throw new Error("Unknown write result"); });
    const result = await publishArtifactPublication(candidate.directory, candidate.manifest, store);
    expect(result.completed.every(x => x.action === "recovered-by-readback")).toBe(true);
    expect(result.status).toBe("completed");
  });

  it("rejects bad readback and a wrong SDK URL without publishing completion", async () => {
    for (const mode of ["bytes", "url"]) {
      const candidate = await registry(`upload-bad-${mode}`);
      const store = publicStore();
      const write = store.writer.getMockImplementation();
      store.writer.mockImplementation(async (...args) => {
        const result = await write(...args);
        if (mode === "bytes") store.objects.set(result.url, Buffer.from("bad"));
        else result.url = "https://wrong.invalid/file";
        return result;
      });
      await expect(publishArtifactPublication(candidate.directory, candidate.manifest, store)).rejects.toMatchObject({ report: { status: "failed" } });
      expect(store.objects.has(`${baseUrl}/complete.json`)).toBe(false);
    }
  });

  it("verifies existing completion bytes too and prevents concurrent local jobs", async () => {
    const candidate = await registry("upload-lock");
    const store = publicStore();
    await publishArtifactPublication(candidate.directory, candidate.manifest, store);
    store.objects.set(`${baseUrl}/complete.json`, Buffer.from("{}"));
    await expect(publishArtifactPublication(candidate.directory, candidate.manifest, store)).rejects.toMatchObject({ report: { status: "failed", error: { role: "completion" } } });
    await mkdir(`${candidate.directory}.publish.lock`);
    await expect(publishArtifactPublication(candidate.directory, candidate.manifest, store)).rejects.toMatchObject({ code: "PUBLICATION_LOCKED" });
    expect(await readdir(`${candidate.directory}.publish.lock`)).toEqual([]);
    await rm(`${candidate.directory}.publish.lock`, { recursive: true });
  });

  it("rejects tampered local inputs before writes and releases its own lock", async () => {
    const candidate = await registry("upload-local-change");
    const store = publicStore();
    await writeFile(path.join(candidate.directory, "button.json"), "{}");
    await expect(publishArtifactPublication(candidate.directory, candidate.manifest, store)).rejects.toMatchObject({ report: { status: "failed", completed: [] } });
    expect(store.fetcher).not.toHaveBeenCalled();
    expect(store.writer).not.toHaveBeenCalled();
    await expect(readdir(`${candidate.directory}.publish.lock`)).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("bounds a hanging write and never writes completion after the failure", async () => {
    const candidate = await registry("upload-timeout");
    const store = publicStore();
    store.writer.mockImplementation(() => new Promise(() => {}));
    await expect(publishArtifactPublication(candidate.directory, candidate.manifest, { ...store, timeoutMs: 5 })).rejects.toMatchObject({ code: "WRITE_NOT_CONFIRMED" });
    expect(store.writer).toHaveBeenCalledTimes(1);
    expect(store.writer.mock.calls[0][2].abortSignal.aborted).toBe(true);
  });
});

describe("real publisher gates", () => {
  it("requires the exact clean revision, source and lockfile bindings", () => {
    const clean = { ...provenance, sourceClean: true };
    expect(validatePublicationSourceBindings(clean, clean)).toEqual(clean);
    expect(() => validatePublicationSourceBindings(provenance, clean)).toThrow("DIRTY_SOURCE");
    for (const change of [{ sourceRevision: "d".repeat(40) }, { sourceInputSha256: "e".repeat(64) },
      { lockfileSha256: "f".repeat(64) }, { sourceClean: false }, { secret: "untrusted" }]) {
      expect(() => validatePublicationSourceBindings(clean, { ...clean, ...change })).toThrow("SOURCE_BINDING_MISMATCH");
    }
  });

  it("requires explicit real origin and either publishing token or platform OIDC without exposing values", () => {
    const manifest = { baseUrl: "https://store.public.blob.vercel-storage.com/r/releases/test-01" };
    const origin = new URL(manifest.baseUrl).origin;
    expect(() => validatePublicationEnvironment(manifest, { ARTIFACT_BASE_URL: origin })).toThrow("BLOB_AUTHENTICATION_REQUIRED");
    for (const credentials of [{ BLOB_READ_WRITE_TOKEN: "test-secret" }, { BLOB_STORE_ID: "store", VERCEL_OIDC_TOKEN: "test-secret" }]) {
      expect(() => validatePublicationEnvironment(manifest, { ARTIFACT_BASE_URL: origin, ...credentials })).not.toThrow();
      expect(() => validatePublicationEnvironment(manifest, credentials)).toThrow("ARTIFACT_ORIGIN_MISMATCH_OR_RESERVED");
    }
    expect(() => validatePublicationEnvironment({ baseUrl }, { ARTIFACT_BASE_URL: "https://artifacts.example.invalid", BLOB_READ_WRITE_TOKEN: "test-secret" })).toThrow("ARTIFACT_ORIGIN_MISMATCH_OR_RESERVED");
  });

  it("executes actual CLI dry-run but rejects an unbound upload before any credentials could be used", async () => {
    const candidate = await registry("cli-gates");
    const manifestFile = path.join(candidate.directory, "manifest.json");
    const output = path.join(parent, "cli-plan.json");
    const args = ["scripts/publish-agent-artifacts.mjs", "--manifest", manifestFile];
    const text = execFileSync(process.execPath, [...args, "--dry-run", "--output", output], { encoding: "utf8" });
    expect(text).toContain("no network or upload");
    expect(JSON.parse(await readFile(output, "utf8")).mode).toBe("dry-run");
    let failure;
    try {
      execFileSync(process.execPath, [...args, "--upload", "--output", path.join(parent, "cli-result.json")], {
        encoding: "utf8", stdio: "pipe", env: { ...process.env, ARTIFACT_BASE_URL: "https://artifacts.example.invalid", BLOB_READ_WRITE_TOKEN: "test-secret" },
      });
    } catch (error) { failure = error; }
    expect(failure.status).toBe(1);
    expect(String(failure.stderr)).toMatch(/DIRTY_SOURCE|SOURCE_BINDING_MISMATCH/);
    expect(String(failure.stderr)).not.toContain("test-secret");
    const rejected = JSON.parse(await readFile(path.join(parent, "cli-result.json"), "utf8"));
    expect(rejected).toMatchObject({ status: "failed", scope: "publication-gate-rejected-no-network-write", completed: [] });
    expect(rejected.error.code).toMatch(/DIRTY_SOURCE|SOURCE_BINDING_MISMATCH/);
    expect(JSON.stringify(rejected)).not.toContain("test-secret");
  }, 10000);
});
