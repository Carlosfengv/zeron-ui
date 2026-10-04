import { setTimeout as delay } from "node:timers/promises";
import { artifactOrigin } from "./agent-artifacts.mjs";
import { sha256 } from "./agent-utils.mjs";

export class ArtifactDownloadError extends Error {
  constructor(code, retryable = false) { super(`Artifact download failed: ${code}`); this.code = code; this.retryable = retryable; }
}

function fixedUrl(value, origin) {
  let url;
  try { url = new URL(value); }
  catch { throw new ArtifactDownloadError("UNEXPECTED_ORIGIN_OR_URL"); }
  if (url.origin !== origin || url.protocol !== "https:" || url.username || url.password || url.search || url.hash) {
    throw new ArtifactDownloadError("UNEXPECTED_ORIGIN_OR_URL");
  }
  return url.href;
}

/** Fixed artifacts always require both trusted byte count and raw SHA-256. */
export async function downloadArtifact(value, options = {}) {
  if (!Number.isSafeInteger(options.bytes) || !/^[a-f0-9]{64}$/.test(options.hash ?? "")) throw new ArtifactDownloadError("INVALID_DOWNLOAD_BUDGET");
  return downloadPublicBytes(value, options);
}

/** Bounded unauthenticated reads; npm metadata/tarballs are verified by their caller. */
export async function downloadPublicBytes(value, { origin, bytes, hash, fetcher = fetch,
  maxBytes = 16 * 1024 * 1024, timeoutMs = 12000, attempts = 3, allowMissing = false, retryDelayMs = 100,
  maxDurationMs = 90000, onBytes = undefined } = {}) {
  try { origin = artifactOrigin(origin); }
  catch { throw new ArtifactDownloadError("UNEXPECTED_ORIGIN_OR_URL"); }
  const initial = fixedUrl(value, origin);
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 0 || maxBytes > 16 * 1024 * 1024
    || ((bytes === undefined) !== (hash === undefined))
    || (bytes !== undefined && (!Number.isSafeInteger(bytes) || bytes < 0 || bytes > maxBytes || !/^[a-f0-9]{64}$/.test(hash)))
    || !Number.isInteger(attempts) || attempts < 1 || attempts > 3
    || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000
    || !Number.isInteger(retryDelayMs) || retryDelayMs < 0 || retryDelayMs > 1000
    || !Number.isInteger(maxDurationMs) || maxDurationMs < 1 || maxDurationMs > 90000
    || typeof allowMissing !== "boolean" || typeof fetcher !== "function"
    || (onBytes !== undefined && typeof onBytes !== "function")) throw new ArtifactDownloadError("INVALID_DOWNLOAD_BUDGET");
  const deadline = Date.now() + maxDurationMs;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    const remainingMs = deadline - Date.now();
    if (remainingMs <= 0) throw new ArtifactDownloadError("TIMEOUT", true);
    const controller = new AbortController();
    let rejectTimeout;
    const expired = new Promise((_, reject) => { rejectTimeout = reject; });
    const timer = setTimeout(() => { controller.abort(); rejectTimeout(new ArtifactDownloadError("TIMEOUT", true)); }, Math.min(timeoutMs, remainingMs));
    const bounded = (promise) => Promise.race([promise, expired]);
    let reader;
    let response;
    let failure;
    // Cancellation is best effort and must never extend the request deadline.
    const cancelBody = () => { void response?.body?.cancel().catch(() => {}); };
    try {
      let current = initial;
      for (let redirects = 0; redirects <= 3; redirects++) {
        response = await bounded(fetcher(current, { redirect: "manual", cache: "no-store", signal: controller.signal,
          headers: { accept: "application/octet-stream" } }));
        if (response.url) fixedUrl(response.url, origin);
        if (![301, 302, 303, 307, 308].includes(response.status)) break;
        const location = response.headers.get("location");
        cancelBody();
        if (!location || redirects === 3) throw new ArtifactDownloadError("INVALID_REDIRECT");
        try { current = fixedUrl(new URL(location, current).href, origin); }
        catch { throw new ArtifactDownloadError("INVALID_REDIRECT"); }
      }
      if (response.status === 404) {
        if (allowMissing) return null;
        throw new ArtifactDownloadError("NOT_FOUND", true);
      }
      if (!response.ok) {
        throw new ArtifactDownloadError(`HTTP_${response.status}`, response.status === 429 || response.status >= 500);
      }
      if (/text\/html/i.test(response.headers.get("content-type") ?? "")) throw new ArtifactDownloadError("HTML_RESPONSE");
      const declared = Number(response.headers.get("content-length"));
      if (declared > maxBytes) throw new ArtifactDownloadError("BODY_TOO_LARGE");
      const chunks = [];
      let total = 0;
      reader = response.body?.getReader();
      if (reader) while (true) {
        const next = await bounded(reader.read());
        if (next.done) break;
        try { onBytes?.(next.value.length); }
        catch { throw new ArtifactDownloadError("TOTAL_BODY_TOO_LARGE"); }
        total += next.value.length;
        if (total > maxBytes || (bytes !== undefined && total > bytes)) throw new ArtifactDownloadError("BODY_TOO_LARGE");
        chunks.push(Buffer.from(next.value));
      }
      const result = Buffer.concat(chunks);
      if (bytes !== undefined && (result.length !== bytes || sha256(result) !== hash)) throw new ArtifactDownloadError("HASH_OR_SIZE_MISMATCH");
      return result;
    } catch (error) {
      failure = error instanceof ArtifactDownloadError ? error : new ArtifactDownloadError("NETWORK_FAILURE", true);
    } finally {
      clearTimeout(timer);
      controller.abort();
      if (reader) void reader.cancel().catch(() => {});
      else cancelBody();
    }
    if (!failure.retryable || attempt === attempts) throw failure;
    await delay(Math.min(retryDelayMs, Math.max(0, deadline - Date.now())));
  }
}
