import { setTimeout as delay } from "node:timers/promises";
import { CiTrustError, ciTrustPolicySchema, rejectCi } from "./agent-ci-contract.mjs";
import { sha256 } from "./agent-utils.mjs";

/** Actions expands a missing secret to an empty string; keep the documented workflow-token fallback. */
export const ciReadToken = (environment = process.env) => environment.AGENT_CI_READ_TOKEN || environment.GITHUB_TOKEN || undefined;

/** The API origin is fixed; archive redirects never receive the API identity. */
export function githubEvidenceClient(rawPolicy, { fetcher = fetch, token, timeoutMs = 30000, attempts = 3,
  retryDelayMs = 100, maxDurationMs = 600000, maxArchiveBytes = 768 * 1024 * 1024 } = {}) {
  const policy = ciTrustPolicySchema.parse(rawPolicy), metadata = new Map();
  if (typeof fetcher !== "function" || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 30000
    || !Number.isInteger(attempts) || attempts < 1 || attempts > 3 || !Number.isInteger(retryDelayMs) || retryDelayMs < 0 || retryDelayMs > 1000
    || !Number.isInteger(maxDurationMs) || maxDurationMs < 1 || maxDurationMs > 600000
    || !Number.isSafeInteger(maxArchiveBytes) || maxArchiveBytes < 1 || maxArchiveBytes > 768 * 1024 * 1024
    || (token !== undefined && (typeof token !== "string" || !token || /[\s\r\n]/.test(token)))) rejectCi("CI_IO_CONFIG");
  const deadline = Date.now() + maxDurationMs; let consumedArchiveBytes = 0;
  const remaining = () => { const ms = deadline - Date.now(); if (ms <= 0) rejectCi("CI_JOB_TIMEOUT"); return ms; };
  const endpointUrl = endpoint => {
    const path = typeof endpoint === "string" ? endpoint.split("?")[0] : "";
    if (typeof endpoint !== "string" || !(path === `/repos/${policy.repository}` || path.startsWith(`/repos/${policy.repository}/`)) || /[#\\\s]/.test(endpoint)) rejectCi("CI_API_ENDPOINT");
    const url = new URL(`https://api.github.com${endpoint}`);
    if (url.pathname !== endpoint.split("?")[0]) rejectCi("CI_API_ENDPOINT");
    return url.href;
  };
  const archiveUrl = value => {
    let url; try { url = new URL(value); } catch { rejectCi("CI_ARCHIVE_REDIRECT"); }
    if (url.protocol !== "https:" || url.username || url.password || url.hash || url.port || !policy.archiveDownloadHosts.some(host =>
      host.startsWith("*.") ? url.hostname.endsWith(host.slice(1)) && url.hostname.length > host.length - 1 : url.hostname === host)) rejectCi("CI_ARCHIVE_REDIRECT");
    return url.href;
  };
  async function request(url, kind, expected) {
    for (let attempt = 1; attempt <= attempts; attempt++) {
      const controller = new AbortController(); let timer, response, reader, failure;
      const requestTimeout = Math.min(timeoutMs, remaining());
      const expired = new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new CiTrustError("CI_READ_TIMEOUT", true)); }, requestTimeout); });
      const bounded = promise => Promise.race([promise, expired]);
      const cancel = () => { if (reader) void reader.cancel().catch(() => {}); else void response?.body?.cancel().catch(() => {}); };
      try {
        const api = kind !== "zip";
        response = await bounded(fetcher(url, { redirect: "manual", cache: "no-store", signal: controller.signal,
          headers: api ? { accept: "application/vnd.github+json", "x-github-api-version": "2026-03-10", ...(token ? { authorization: `Bearer ${token}` } : {}) }
            : { accept: "application/octet-stream" } }));
        if (response.url && response.url !== url) rejectCi("CI_UNEXPECTED_RESPONSE_URL");
        if (kind === "archive-location") {
          if (response.status !== 302) throw new CiTrustError(`CI_HTTP_${response.status}`, response.status === 429 || response.status >= 500);
          const location = response.headers.get("location"); cancel();
          return archiveUrl(location);
        }
        if (kind === "zip" && [301, 302, 303, 307, 308].includes(response.status)) {
          const location = response.headers.get("location"); cancel(); return { redirect: archiveUrl(location) };
        }
        if (!response.ok) throw new CiTrustError(`CI_HTTP_${response.status}`, response.status === 429 || response.status >= 500);
        if (api && response.status !== 200) rejectCi("CI_API_STATUS");
        if (!api && response.status !== 200) rejectCi("CI_ARCHIVE_STATUS");
        if (/text\/html/i.test(response.headers.get("content-type") ?? "")) rejectCi("CI_HTML_RESPONSE");
        const maxBytes = api ? 2 * 1024 * 1024 : expected.bytes;
        if (Number(response.headers.get("content-length")) > maxBytes) rejectCi("CI_BODY_TOO_LARGE");
        const chunks = []; let size = 0;
        reader = response.body?.getReader();
        if (reader) while (true) {
          const next = await bounded(reader.read()); if (next.done) break;
          if (!api) { consumedArchiveBytes += next.value.length; if (consumedArchiveBytes > maxArchiveBytes) rejectCi("CI_ARCHIVE_TOTAL_BUDGET"); }
          size += next.value.length;
          if (size > maxBytes) rejectCi("CI_BODY_TOO_LARGE");
          chunks.push(Buffer.from(next.value));
        }
        const bytes = Buffer.concat(chunks);
        if (!api && (bytes.length !== expected.bytes || sha256(bytes) !== expected.sha256)) rejectCi("CI_ARCHIVE_DIGEST");
        return bytes;
      } catch (error) { failure = error instanceof CiTrustError ? error : new CiTrustError("CI_NETWORK_FAILURE", true); }
      finally { clearTimeout(timer); controller.abort(); cancel(); }
      if (!failure.retryable || attempt === attempts) throw failure;
      await delay(Math.min(retryDelayMs, remaining()));
    }
  }
  async function json(endpoint) {
    if (!metadata.has(endpoint) && metadata.size >= 100) rejectCi("CI_METADATA_COUNT");
    const raw = await request(endpointUrl(endpoint), "json");
    let result;
    try { result = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(raw)); } catch { rejectCi("CI_API_JSON"); }
    const previous = metadata.get(endpoint);
    if (previous && !previous.equals(raw)) rejectCi("CI_METADATA_CHANGED");
    metadata.set(endpoint, raw); return result;
  }
  /** Pagination is built locally; a server-provided Link cannot redirect authentication. */
  async function list(endpoint, property = null) {
    if (endpoint.includes("?")) rejectCi("CI_LIST_ENDPOINT");
    const rows = []; let total = null;
    for (let page = 1; page <= 10; page++) {
      const data = await json(`${endpoint}?per_page=100&page=${page}`), values = property ? data?.[property] : data;
      if (!Array.isArray(values) || values.length > 100) rejectCi("CI_LIST_CONTRACT");
      if (property) {
        if (!Number.isSafeInteger(data.total_count) || data.total_count < 0 || data.total_count > 1000 || (total !== null && total !== data.total_count)) rejectCi("CI_LIST_TOTAL");
        total = data.total_count;
      }
      rows.push(...values);
      if (rows.length > 1000 || (total !== null && rows.length > total)) rejectCi("CI_LIST_TOTAL");
      if (values.length < 100 || (total !== null && rows.length === total)) {
        if (total !== null && rows.length !== total) rejectCi("CI_LIST_TOTAL");
        return rows;
      }
    }
    rejectCi("CI_LIST_PAGE_BUDGET");
  }
  async function archive(artifactId, expected) {
    if (!Number.isSafeInteger(artifactId) || artifactId < 1 || !Number.isSafeInteger(expected?.bytes) || expected.bytes < 1
      || expected.bytes > 128 * 1024 * 1024 || !/^[a-f0-9]{64}$/.test(expected.sha256 ?? "")) rejectCi("CI_ARCHIVE_DESCRIPTOR");
    for (let lease = 1; lease <= attempts; lease++) {
      let url = await request(endpointUrl(`/repos/${policy.repository}/actions/artifacts/${artifactId}/zip`), "archive-location");
      try {
        for (let redirects = 0; redirects <= 3; redirects++) {
          const result = await request(url, "zip", expected);
          if (Buffer.isBuffer(result)) return result;
          if (redirects === 3) rejectCi("CI_ARCHIVE_REDIRECT_LIMIT");
          url = result.redirect;
        }
      } catch (error) {
        // Signed locations expire; obtain another lease from the same authenticated artifact endpoint.
        if (error.code !== "CI_HTTP_403" || lease === attempts) throw error;
      }
    }
  }
  return { json, list, archive, metadata, remaining, get consumedArchiveBytes() { return consumedArchiveBytes; } };
}
