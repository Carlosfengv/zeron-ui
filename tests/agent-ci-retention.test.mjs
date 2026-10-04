import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { mkdtemp, rm, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { ciArchiveStorageSchema, planCiRetention, privateBlobArchiveStore, retainVerifiedCiEvidence } from "../scripts/agent-ci-retention.mjs";
import { verifyCiEvidence } from "../scripts/agent-ci-trust.mjs";
import { releaseSelectionSchema } from "../scripts/agent-release-record.mjs";
import { ciEvidenceFixture } from "./helpers/agent-ci-fixture.mjs";
import { serialize, sha256 } from "../scripts/agent-utils.mjs";

// The platform, successful executions, private SDK/store and access denials are explicit fixtures.
// These tests establish local byte/control behavior, not an actual durable handoff or CI approval.
let directory, fixture, ci, material;
const json = value => Buffer.from(serialize(value));
const config = { schemaVersion: 1, provider: "vercel-blob", access: "private", origin: "https://fixture.private.blob.vercel-storage.com",
  retention: "approved-releases-no-automatic-deletion" };
beforeAll(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "zeron-ci-retention-"));
  fixture = await ciEvidenceFixture(path.join(directory, "fixture"));
  ci = await verifyCiEvidence(fixture.context, { fetcher: fixture.fetcher, attempts: 1 });
  const recordName = (await readdir(path.join(directory, "fixture"))).find(name => /^[a-f0-9]{64}\.json$/.test(name));
  const record = JSON.parse(await readFile(path.join(directory, "fixture", recordName), "utf8"));
  // Byte-contract fixture only: the freezer separately verifies real Catalog manifest/report bindings.
  record.catalog.installationVerification.bytes = ci.receipt.consumer.report.bytes;
  record.catalog.installationVerification.sha256 = ci.receipt.consumer.report.sha256;
  const recordBytes = json(record);
  const selectionBytes = json(releaseSelectionSchema.parse({ schemaVersion: 1,
    current: { path: recordName, bytes: recordBytes.length, sha256: sha256(recordBytes) } }));
  material = { input: fixture.context.prepared.input, locator: fixture.context.locator, ci, recordBytes, selectionBytes, config };
}, 20000);
afterAll(async () => { await rm(directory, { recursive: true, force: true }); });

function memoryStore() {
  const objects = new Map(), events = [];
  const read = vi.fn(async entry => { events.push(["read", entry.path]); return objects.get(entry.url) ?? null; });
  const write = vi.fn(async (entry, bytes) => {
    events.push(["write", entry.path]);
    if (objects.has(entry.url)) throw new Error("append-only conflict");
    objects.set(entry.url, Buffer.from(bytes));
  });
  const checkPrivate = vi.fn(async entry => { events.push(["denied", entry.path]); });
  return { objects, events, read, write, checkPrivate };
}

describe("CI durable archive byte contract", () => {
  it("pins two original ZIPs, metadata, receipt, input and exact draft bytes; index last", () => {
    const plan = planCiRetention(material);
    expect(plan.entries.at(-1).path).toBe("index.json");
    expect(plan.entries.filter(entry => entry.path.endsWith(".zip")).map(entry => entry.path)).toEqual(["ci/archives/consumer.zip", "ci/archives/examples.zip"]);
    expect(plan.index.record.sha256).toBe(sha256(material.recordBytes));
    expect(plan.index.files.every(ref => ref.url.startsWith(`${config.origin}/ci/releases/`))).toBe(true);
    expect(plan.files.get("ci/archives/consumer.zip")).toEqual(ci.privateFiles.get(ci.receipt.consumer.archive.path));
    for (const metadata of ci.receipt.metadata) expect(plan.files.get(`ci/${metadata.file.path}`)).toEqual(ci.privateFiles.get(metadata.file.path));
    expect(planCiRetention(material).indexReference).toEqual(plan.indexReference);
  });
  it("rejects missing, extra, changed archive/metadata bytes and cross-source/role bindings", () => {
    for (const mode of ["missing", "extra", "changed"]) {
      const files = new Map(ci.privateFiles), name = ci.receipt.consumer.archive.path;
      if (mode === "missing") files.delete(name);
      if (mode === "extra") files.set("unlisted.json", json({}));
      if (mode === "changed") files.set(name, Buffer.from("wrong zip"));
      expect(() => planCiRetention({ ...material, ci: { ...ci, privateFiles: files } })).toThrow(/CI_RETENTION_/);
    }
    const receipt = structuredClone(ci.receipt); receipt.inputSha256 = "0".repeat(64);
    expect(() => planCiRetention({ ...material, ci: { ...ci, receipt } })).toThrow(/CI_RETENTION_BINDING/);
    const locator = structuredClone(material.locator); locator.consumer.jobId += 1000;
    expect(() => planCiRetention({ ...material, locator })).toThrow(/CI_RETENTION_LOCATOR/);
  });
  it("rejects a recomputed descriptor when ZIP/index/report bytes no longer agree", () => {
    const receipt = structuredClone(ci.receipt), files = new Map(ci.privateFiles), ref = receipt.consumer.index;
    const bytes = json({ report: { path: "wrong.json" } }); ref.bytes = bytes.length; ref.sha256 = sha256(bytes); files.set(ref.path, bytes);
    expect(() => planCiRetention({ ...material, ci: { ...ci, receipt, privateFiles: files } })).toThrow(/CI_RETENTION_ARCHIVE_BINDING/);
  });
  it("retains raw bytes, checks authenticated readback and denial before the index, and reuses an identical retry", async () => {
    const store = memoryStore(), plan = planCiRetention(material);
    const report = await retainVerifiedCiEvidence(material, { store });
    expect(report.status).toBe("verified-private-copy"); expect(report.index).toEqual(plan.indexReference);
    const indexWrite = store.events.findIndex(([kind, name]) => kind === "write" && name === "index.json");
    for (const entry of plan.entries.slice(0, -1)) expect(store.events.slice(0, indexWrite)).toContainEqual(["denied", entry.path]);
    const count = store.write.mock.calls.length;
    const retry = await retainVerifiedCiEvidence(material, { store });
    expect(store.write).toHaveBeenCalledTimes(count);
    expect(retry.completed.every(entry => entry.action === "reused")).toBe(true);
  });
  it("stops on conflicts or anonymous readability without creating an index", async () => {
    for (const mode of ["conflict", "public"]) {
      const store = memoryStore(), plan = planCiRetention(material);
      if (mode === "conflict") store.objects.set(plan.entries[0].url, Buffer.from("wrong existing bytes"));
      else store.checkPrivate.mockRejectedValue(Object.assign(new Error("readable"), { code: "CI_RETENTION_ANONYMOUS_ACCESS" }));
      await expect(retainVerifiedCiEvidence(material, { store })).rejects.toHaveProperty("code", mode === "conflict" ? "CI_RETENTION_READBACK_BYTES" : "CI_RETENTION_ANONYMOUS_ACCESS");
      expect(store.objects.has(plan.indexReference.url)).toBe(false);
    }
  });
  it("can resume a partial copy and confirms a write whose response was lost by exact readback", async () => {
    const store = memoryStore(), plan = planCiRetention(material), original = store.write.getMockImplementation(); let first = true;
    store.write.mockImplementation(async (...args) => { await original(...args); if (first) { first = false; throw new Error("lost response"); } });
    const partial = new Map([[plan.entries[0].url, Buffer.from(plan.files.get(plan.entries[0].path))]]);
    for (const [url, bytes] of partial) store.objects.set(url, bytes);
    const result = await retainVerifiedCiEvidence(material, { store });
    expect(result.completed[0].action).toBe("reused");
    expect(result.completed[1].action).toBe("recovered-by-readback");
  });
  it("enforces a deadline even when the injected storage ignores cancellation", async () => {
    const store = memoryStore(); store.read.mockImplementation(() => new Promise(() => {}));
    await expect(retainVerifiedCiEvidence(material, { store, timeoutMs: 10, maxDurationMs: 50 })).rejects.toHaveProperty("code", "CI_RETENTION_TIMEOUT");
    expect(store.write).not.toHaveBeenCalled();
  });
});

describe("private Blob adapter", () => {
  it("requires a canonical private store and its separate matching token before I/O", async () => {
    expect(ciArchiveStorageSchema.safeParse({ ...config, origin: "https://fixture.public.blob.vercel-storage.com" }).success).toBe(false);
    expect(ciArchiveStorageSchema.safeParse({ ...config, origin: `${config.origin}/` }).success).toBe(false);
    const sdk = { get: vi.fn(), put: vi.fn() };
    for (const token of [undefined, "vercel_blob_rw_other_secret", "wrong-token"]) {
      await expect(privateBlobArchiveStore(config, token, { sdk })).rejects.toHaveProperty("code", "CI_RETENTION_AUTHENTICATION");
    }
    expect(sdk.get).not.toHaveBeenCalled(); expect(sdk.put).not.toHaveBeenCalled();
  });
  it("uses authenticated uncached SDK reads, append-only private writes and unauthenticated denial probes", async () => {
    const entry = planCiRetention(material).entries[0], body = planCiRetention(material).files.get(entry.path), token = "vercel_blob_rw_fixture_test-secret";
    const sdk = {
      get: vi.fn(async () => ({ statusCode: 200, blob: { url: entry.url, pathname: entry.pathname, size: body.length }, stream: new Response(body).body })),
      put: vi.fn(async () => ({ url: entry.url, pathname: entry.pathname })),
    };
    const anonymousFetcher = vi.fn(async () => new Response(null, { status: 403 }));
    const store = await privateBlobArchiveStore(config, token, { sdk, anonymousFetcher }), signal = new AbortController().signal;
    expect(await store.read(entry, signal)).toEqual(body); await store.write(entry, body, signal); await store.checkPrivate(entry, signal);
    expect(sdk.get).toHaveBeenCalledWith(entry.pathname, expect.objectContaining({ access: "private", useCache: false, token }));
    expect(sdk.put).toHaveBeenCalledWith(entry.pathname, body, expect.objectContaining({ access: "private", addRandomSuffix: false, allowOverwrite: false, token }));
    expect(anonymousFetcher).toHaveBeenCalledWith(entry.url, expect.objectContaining({ credentials: "omit", redirect: "manual" }));
    expect(anonymousFetcher.mock.calls[0][1].headers).toBeUndefined();
  });
  it("rejects wrong returned stores/paths, oversized streams, redirects and public reads", async () => {
    const entry = planCiRetention(material).entries[0], body = planCiRetention(material).files.get(entry.path), signal = new AbortController().signal;
    const sdk = { get: vi.fn(), put: vi.fn() }, anonymousFetcher = vi.fn();
    const store = await privateBlobArchiveStore(config, "vercel_blob_rw_fixture_secret", { sdk, anonymousFetcher });
    sdk.get.mockResolvedValue({ statusCode: 200, blob: { url: entry.url.replace("fixture.", "other."), pathname: entry.pathname, size: body.length }, stream: new Response(body).body });
    await expect(store.read(entry, signal)).rejects.toHaveProperty("code", "CI_RETENTION_READBACK_METADATA");
    sdk.get.mockResolvedValue({ statusCode: 200, blob: { url: entry.url, pathname: entry.pathname, size: body.length }, stream: new Response(Buffer.concat([body, Buffer.from("x")])).body });
    await expect(store.read(entry, signal)).rejects.toHaveProperty("code", "CI_RETENTION_READBACK_BYTES");
    sdk.put.mockResolvedValue({ url: entry.url, pathname: "different" });
    await expect(store.write(entry, body, signal)).rejects.toHaveProperty("code", "CI_RETENTION_WRITE_LOCATION");
    for (const status of [200, 302, 500]) {
      anonymousFetcher.mockResolvedValue(new Response(null, { status }));
      await expect(store.checkPrivate(entry, signal)).rejects.toHaveProperty("code", "CI_RETENTION_ANONYMOUS_ACCESS");
    }
  });
});
