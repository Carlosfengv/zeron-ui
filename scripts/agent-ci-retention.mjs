import { z } from "zod";
import { ciLocatorSchema, ciVerificationReceiptSchema } from "./agent-ci-contract.mjs";
import { frozenReleaseSchema, installationInputSchema, releaseSelectionSchema } from "./agent-release-record.mjs";
import { unzipCiArchive } from "./safe-ci-zip.mjs";
import { serialize, sha256 } from "./agent-utils.mjs";

export const ciArchiveStoragePath = "docs/agent-data/ci-archive-storage.json";
const privateOrigin = z.string().regex(/^https:\/\/[a-z0-9]+\.private\.blob\.vercel-storage\.com$/);
export const ciArchiveStorageSchema = z.object({ schemaVersion: z.literal(1), provider: z.literal("vercel-blob"),
  access: z.literal("private"), origin: privateOrigin,
  retention: z.literal("approved-releases-no-automatic-deletion") }).strict();
const reject = code => { throw Object.assign(new Error(`CI retention rejected: ${code}`), { code }); };
const same = (a, b) => serialize(a) === serialize(b);
const descriptor = (path, bytes) => ({ path, bytes: bytes.length, sha256: sha256(bytes) });
const json = value => Buffer.from(serialize(value));

/** Byte contract only. The closed freeze CLI must obtain ci from a fresh real verification. */
export function planCiRetention({ input: rawInput, locator: rawLocator, ci, recordBytes, selectionBytes, config: rawConfig }) {
  const input = installationInputSchema.parse(rawInput), locator = ciLocatorSchema.parse(rawLocator), config = ciArchiveStorageSchema.parse(rawConfig);
  const receipt = ciVerificationReceiptSchema.parse(ci.receipt);
  const record = frozenReleaseSchema.parse(JSON.parse(recordBytes.toString("utf8")));
  const selection = releaseSelectionSchema.parse(JSON.parse(selectionBytes.toString("utf8")));
  if (!same(receipt.source, input.source) || receipt.inputSha256 !== sha256(json(input))
    || !same(record.source, input.source) || !same(record.registry, input.registry) || !same(record.skill, input.skill)
    || record.siteBaseUrl !== input.siteBaseUrl || record.artifactBaseUrl !== input.artifactBaseUrl
    || record.catalog.installationVerification.bytes !== receipt.consumer.report.bytes
    || record.catalog.installationVerification.sha256 !== receipt.consumer.report.sha256
    || !recordBytes.equals(json(record)) || !selectionBytes.equals(json(selection))
    || !same(selection.current, descriptor(`${record.catalog.version}.json`, recordBytes))) reject("CI_RETENTION_BINDING");
  const expected = new Map();
  for (const role of ["consumer", "examples"]) {
    if (Object.keys(locator[role]).some(key => receipt[role][key] !== locator[role][key])) reject("CI_RETENTION_LOCATOR");
    for (const field of ["archive", "index", "report"]) expected.set(receipt[role][field].path, receipt[role][field]);
  }
  for (const entry of receipt.metadata) {
    if (entry.file.path !== `metadata/${sha256(entry.endpoint)}.json`) reject("CI_RETENTION_METADATA");
    if (expected.has(entry.file.path)) reject("CI_RETENTION_DUPLICATE");
    expected.set(entry.file.path, entry.file);
  }
  if (!(ci.privateFiles instanceof Map) || ci.privateFiles.size !== expected.size || expected.size > 106) reject("CI_RETENTION_FILE_SET");
  const files = new Map();
  for (const [name, ref] of expected) {
    const bytes = ci.privateFiles.get(name), limit = name.startsWith("archives/") ? 128 * 1024 * 1024 : 2 * 1024 * 1024;
    if (!Buffer.isBuffer(bytes) || bytes.length < 1 || bytes.length > limit || bytes.length !== ref.bytes || sha256(bytes) !== ref.sha256) reject("CI_RETENTION_BYTES");
    if (!name.startsWith("archives/")) {
      let value;
      try { value = JSON.parse(new TextDecoder("utf8", { fatal: true }).decode(bytes)); } catch { reject("CI_RETENTION_JSON"); }
      // API responses retain their authenticated original bytes, including formatting.
      // Only our own execution indices/reports require canonical JSON.
      if (!name.startsWith("metadata/") && !bytes.equals(json(value))) reject("CI_RETENTION_JSON");
    }
    files.set(`ci/${name}`, Buffer.from(bytes));
  }
  for (const role of ["consumer", "examples"]) {
    const raw = unzipCiArchive(files.get(`ci/${receipt[role].archive.path}`));
    const index = files.get(`ci/${receipt[role].index.path}`), report = files.get(`ci/${receipt[role].report.path}`);
    const indexValue = JSON.parse(index.toString("utf8"));
    if (!raw.get("execution-index.json")?.equals(index) || !raw.get(indexValue.report.path)?.equals(report)) reject("CI_RETENTION_ARCHIVE_BINDING");
  }
  for (const [name, bytes] of [["ci-verification.json", json(receipt)], ["installation-input.json", json(input)],
    ["ci-locator.json", json(locator)], [`release/${record.catalog.version}.json`, recordBytes], ["release/current.json", selectionBytes]]) files.set(name, Buffer.from(bytes));
  if ([...files.values()].reduce((sum, bytes) => sum + bytes.length, 0) > 512 * 1024 * 1024) reject("CI_RETENTION_BUDGET");
  const inventory = [...files].sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([name, bytes]) => descriptor(name, bytes));
  const identity = { schemaVersion: 1, kind: "agent-ci-durable-archive", source: input.source, inputSha256: receipt.inputSha256,
    catalogVersion: record.catalog.version, record: selection.current, storage: config, locator, files: inventory };
  const bundleSha256 = sha256(json(identity)), prefix = `ci/releases/${record.catalog.version}/${bundleSha256}`;
  const index = { ...identity, bundleSha256, files: inventory.map(ref => ({ ...ref, url: `${config.origin}/${prefix}/${ref.path}` })) };
  const indexBytes = json(index);
  if (indexBytes.length > 2 * 1024 * 1024) reject("CI_RETENTION_BUDGET");
  const entries = [...inventory.map(ref => ({ ...ref, pathname: `${prefix}/${ref.path}`, url: `${config.origin}/${prefix}/${ref.path}` })),
    { ...descriptor("index.json", indexBytes), pathname: `${prefix}/index.json`, url: `${config.origin}/${prefix}/index.json` }];
  files.set("index.json", indexBytes);
  return { config, index, entries, files, indexReference: { url: entries.at(-1).url, bytes: indexBytes.length, sha256: sha256(indexBytes) } };
}

/** Dedicated token, fixed private origin, no implicit product-store credentials or signed URLs. */
export async function privateBlobArchiveStore(config, token, { sdk, anonymousFetcher = fetch } = {}) {
  config = ciArchiveStorageSchema.parse(config);
  const match = typeof token === "string" && /^vercel_blob_rw_([a-zA-Z0-9]+)_[^\s]+$/.exec(token);
  if (!match || config.origin !== `https://${match[1].toLowerCase()}.private.blob.vercel-storage.com`) reject("CI_RETENTION_AUTHENTICATION");
  sdk ??= await import("@vercel/blob");
  const valid = entry => {
    if (entry.url !== `${config.origin}/${entry.pathname}` || !/^ci\/releases\/[a-f0-9]{64}\/[a-f0-9]{64}\/(?:[a-zA-Z0-9._/-]+)$/.test(entry.pathname)
      || entry.pathname.split("/").some(part => !part || part === "." || part === "..")) reject("CI_RETENTION_LOCATION");
  };
  return {
    async read(entry, signal) {
      valid(entry);
      const result = await sdk.get(entry.pathname, { access: "private", useCache: false, token, abortSignal: signal });
      if (result === null) return null;
      if (result.statusCode !== 200 || result.blob?.url !== entry.url || result.blob?.pathname !== entry.pathname || result.blob?.size !== entry.bytes) {
        await result.stream?.cancel().catch(() => {}); reject("CI_RETENTION_READBACK_METADATA");
      }
      const reader = result.stream.getReader(), chunks = []; let size = 0;
      const abort = () => { void reader.cancel().catch(() => {}); };
      signal.addEventListener("abort", abort, { once: true });
      try {
        while (true) {
          if (signal.aborted) reject("CI_RETENTION_TIMEOUT");
          const chunk = await reader.read(); if (chunk.done) break;
          size += chunk.value.byteLength; if (size > entry.bytes) reject("CI_RETENTION_READBACK_BYTES");
          chunks.push(Buffer.from(chunk.value));
        }
        if (size !== entry.bytes) reject("CI_RETENTION_READBACK_BYTES");
        return Buffer.concat(chunks);
      } finally { signal.removeEventListener("abort", abort); await reader.cancel().catch(() => {}); reader.releaseLock(); }
    },
    async write(entry, body, signal) {
      valid(entry);
      const result = await sdk.put(entry.pathname, body, { access: "private", addRandomSuffix: false, allowOverwrite: false,
        contentType: entry.path.endsWith(".zip") ? "application/zip" : "application/json", cacheControlMaxAge: 60,
        token, abortSignal: signal });
      if (result?.url !== entry.url || result?.pathname !== entry.pathname) reject("CI_RETENTION_WRITE_LOCATION");
    },
    async checkPrivate(entry, signal) {
      valid(entry);
      const response = await anonymousFetcher(entry.url, { method: "GET", redirect: "manual", credentials: "omit", cache: "no-store", signal });
      await response.body?.cancel().catch(() => {});
      if (![401, 403, 404].includes(response.status)) reject("CI_RETENTION_ANONYMOUS_ACCESS");
    },
  };
}

/** Append-only byte handoff. The index is written last; no deletes or application activation. */
export async function retainVerifiedCiEvidence(material, { store, timeoutMs = 30000, maxDurationMs = 600000 } = {}) {
  if (!store || ["read", "write", "checkPrivate"].some(name => typeof store[name] !== "function")
    || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000
    || !Number.isInteger(maxDurationMs) || maxDurationMs < 1 || maxDurationMs > 600000) reject("CI_RETENTION_IO_CONFIG");
  const plan = planCiRetention(material), deadline = Date.now() + maxDurationMs;
  const completed = []; let consumedBytes = 0;
  const call = async action => {
    const remaining = Math.min(timeoutMs, deadline - Date.now()); if (remaining <= 0) reject("CI_RETENTION_TIMEOUT");
    const controller = new AbortController(); let timer;
    try { return await Promise.race([action(controller.signal), new Promise((_, fail) => {
      timer = setTimeout(() => { controller.abort(); fail(Object.assign(new Error("CI retention timeout"), { code: "CI_RETENTION_TIMEOUT" })); }, remaining);
    })]); } finally { clearTimeout(timer); controller.abort(); }
  };
  const read = async entry => {
    const body = await call(signal => store.read(entry, signal));
    if (body === null) return null;
    if (!Buffer.isBuffer(body)) reject("CI_RETENTION_READBACK_BYTES");
    consumedBytes += body.length; if (consumedBytes > 2 * 1024 * 1024 * 1024) reject("CI_RETENTION_DOWNLOAD_BUDGET");
    if (body.length !== entry.bytes || sha256(body) !== entry.sha256) reject("CI_RETENTION_READBACK_BYTES");
    return body;
  };
  for (const entry of plan.entries) {
    let action = "reused";
    if (await read(entry) === null) {
      let failure;
      try { await call(signal => store.write(entry, Buffer.from(plan.files.get(entry.path)), signal)); }
      catch (error) { failure = error; }
      if (failure?.code === "CI_RETENTION_WRITE_LOCATION") throw failure;
      if (await read(entry) === null) reject("CI_RETENTION_WRITE_NOT_CONFIRMED");
      action = failure ? "recovered-by-readback" : "uploaded";
    }
    await call(signal => store.checkPrivate(entry, signal));
    completed.push({ path: entry.path, bytes: entry.bytes, sha256: entry.sha256, action });
  }
  return { schemaVersion: 1, kind: "agent-ci-durable-handoff", status: "verified-private-copy",
    scope: "raw-ci-byte-handoff-not-approval-or-deployment", source: plan.index.source, catalogVersion: plan.index.catalogVersion,
    record: plan.index.record, storage: plan.config, index: plan.indexReference, completed, consumedBytes };
}
