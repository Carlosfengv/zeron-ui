import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { githubEvidenceClient, ciReadToken } from "../scripts/agent-ci-github.mjs";
import { ciLocatorSchema, ciTrustPolicySchema, ciVerificationReceiptSchema } from "../scripts/agent-ci-contract.mjs";
import { sha256 } from "../scripts/agent-utils.mjs";

const policy = JSON.parse(await readFile("docs/agent-data/ci-trust.json", "utf8"));
const base = `/repos/${policy.repository}`, json = value => Response.json(value);
const zip = Buffer.from("explicit transport fixture, not a CI archive"), ref = { bytes: zip.length, sha256: sha256(zip) };
const signed = "https://artifact.actions.githubusercontent.com/fixture.zip?fixture-signature=opaque";
const options = { attempts: 1, retryDelayMs: 0 };

describe("fixed GitHub CI HTTP boundary (injected responses only)", () => {
  it("falls back for missing Actions secrets without hiding invalid configured identities", () => {
    expect(ciReadToken({ AGENT_CI_READ_TOKEN: "preferred-fixture", GITHUB_TOKEN: "workflow-fixture" })).toBe("preferred-fixture");
    expect(ciReadToken({ AGENT_CI_READ_TOKEN: "", GITHUB_TOKEN: "workflow-fixture" })).toBe("workflow-fixture");
    expect(ciReadToken({ GITHUB_TOKEN: "workflow-fixture" })).toBe("workflow-fixture");
    expect(ciReadToken({})).toBeUndefined(); expect(ciReadToken({ AGENT_CI_READ_TOKEN: "", GITHUB_TOKEN: "" })).toBeUndefined();
    const token = ciReadToken({ AGENT_CI_READ_TOKEN: " \n", GITHUB_TOKEN: "workflow-fixture" });
    expect(() => githubEvidenceClient(policy, { token })).toThrow("CI_IO_CONFIG");
  });
  it("reads repository metadata and binds repeated raw bytes", async () => {
    let call = 0;
    const client = githubEvidenceClient(policy, { ...options, fetcher: async () => json({ id: ++call }) });
    expect(await client.json(base)).toEqual({ id: 1 });
    expect(client.metadata.get(base)).toEqual(Buffer.from('{"id":1}'));
    await expect(client.json(base)).rejects.toHaveProperty("code", "CI_METADATA_CHANGED");
  });
  it.each(["https://evil.example/", "/repos/other/repo/jobs", `${base}/../other`, `${base}/%2e%2e/other`, `${base}/jobs#fragment`, `${base}/a\\b`, `${base}/white space`])(
    "rejects untrusted API endpoint %s before fetching", async endpoint => {
      let calls = 0;
      const client = githubEvidenceClient(policy, { ...options, fetcher: async () => { calls++; return json({}); } });
      await expect(client.json(endpoint)).rejects.toHaveProperty("code", "CI_API_ENDPOINT"); expect(calls).toBe(0);
    });
  it("sends the read identity only to the fixed API, never the signed archive host", async () => {
    const requests = [];
    const client = githubEvidenceClient(policy, { ...options, token: "fixture-read-identity", fetcher: async (url, init) => {
      requests.push({ url, init }); return url.startsWith("https://api.github.com") ? new Response(null, { status: 302, headers: { location: signed } }) : new Response(zip);
    } });
    expect(await client.archive(9, ref)).toEqual(zip);
    expect(requests[0].init.headers.authorization).toBe("Bearer fixture-read-identity");
    expect(requests[1].init.headers).toEqual({ accept: "application/octet-stream" });
    expect(requests.every(request => request.init.redirect === "manual")).toBe(true);
    expect(client.consumedArchiveBytes).toBe(zip.length);
  });
  it.each(["http://artifact.actions.githubusercontent.com/file", "https://actions.githubusercontent.com/file", "https://artifact.actions.githubusercontent.com.evil.example/file",
    "https://evil.example/file", "https://user:pass@artifact.actions.githubusercontent.com/file", "https://artifact.actions.githubusercontent.com:444/file",
    "https://artifact.actions.githubusercontent.com/file#fragment", "/relative.zip", ""]) (
    "rejects archive redirect %s", async location => {
      const client = githubEvidenceClient(policy, { ...options, fetcher: async () => new Response(null, { status: 302, headers: { location } }) });
      await expect(client.archive(9, ref)).rejects.toHaveProperty("code", "CI_ARCHIVE_REDIRECT");
    });
  it("bounds further archive redirects", async () => {
    const client = githubEvidenceClient(policy, { ...options, fetcher: async () => new Response(null, { status: 302, headers: { location: signed } }) });
    await expect(client.archive(9, ref)).rejects.toHaveProperty("code", "CI_ARCHIVE_REDIRECT_LIMIT");
  });
  it("refreshes an expired signed location at the same artifact API", async () => {
    let leases = 0;
    const client = githubEvidenceClient(policy, { attempts: 3, retryDelayMs: 0, fetcher: async url => {
      if (url.startsWith("https://api.github.com")) { leases++; return new Response(null, { status: 302, headers: { location: signed } }); }
      return leases === 1 ? new Response(null, { status: 403 }) : new Response(zip);
    } });
    expect(await client.archive(9, ref)).toEqual(zip); expect(leases).toBe(2);
  });
  it("does not refresh a forbidden API identity", async () => {
    let calls = 0;
    const client = githubEvidenceClient(policy, { attempts: 3, fetcher: async () => { calls++; return new Response(null, { status: 403 }); } });
    await expect(client.archive(9, ref)).rejects.toHaveProperty("code", "CI_HTTP_403"); expect(calls).toBe(1);
  });
  it("rejects a followed or substituted response URL", async () => {
    const client = githubEvidenceClient(policy, { ...options, fetcher: async () => {
      const response = json({}); Object.defineProperty(response, "url", { value: "https://evil.example/" }); return response;
    } });
    await expect(client.json(`${base}/x`)).rejects.toHaveProperty("code", "CI_UNEXPECTED_RESPONSE_URL");
  });
  it.each([new Response("<html>login</html>", { headers: { "content-type": "text/html" } }), new Response("not json"), new Response(Buffer.from([0xff]))])(
    "rejects malformed API bytes", async response => {
      const client = githubEvidenceClient(policy, { ...options, fetcher: async () => response });
      await expect(client.json(`${base}/x`)).rejects.toHaveProperty("code", (response.headers.get("content-type") ?? "").includes("text/html") ? "CI_HTML_RESPONSE" : "CI_API_JSON");
    });
  it("enforces streamed API byte size without trusting Content-Length", async () => {
    const client = githubEvidenceClient(policy, { ...options, fetcher: async () => new Response(Buffer.alloc(2 * 1024 * 1024 + 1)) });
    await expect(client.json(`${base}/x`)).rejects.toHaveProperty("code", "CI_BODY_TOO_LARGE");
  });
  it("times out and cancels a stalled response body", async () => {
    let cancelled = false;
    const client = githubEvidenceClient(policy, { ...options, timeoutMs: 15, fetcher: async () => new Response(new ReadableStream({ start() {}, cancel() { cancelled = true; } })) });
    await expect(client.json(`${base}/x`)).rejects.toHaveProperty("code", "CI_READ_TIMEOUT"); expect(cancelled).toBe(true);
  });
  it("limits a stalled fetch by the total deadline", async () => {
    const client = githubEvidenceClient(policy, { ...options, maxDurationMs: 15, fetcher: async () => new Promise(() => {}) });
    await expect(client.json(`${base}/x`)).rejects.toHaveProperty("code", "CI_READ_TIMEOUT");
    expect(() => client.remaining()).toThrow("CI_JOB_TIMEOUT");
  });
  it("retries a transient API response with bounded attempts", async () => {
    let calls = 0;
    const client = githubEvidenceClient(policy, { attempts: 3, retryDelayMs: 0, fetcher: async () => ++calls < 3 ? new Response(null, { status: 503 }) : json({ ok: true }) });
    expect(await client.json(`${base}/x`)).toEqual({ ok: true }); expect(calls).toBe(3);
  });
  it("counts failed streamed archive attempts against the cumulative budget", async () => {
    const client = githubEvidenceClient(policy, { attempts: 3, retryDelayMs: 0, maxArchiveBytes: 6, fetcher: async url => {
      if (url.startsWith("https://api.github.com")) return new Response(null, { status: 302, headers: { location: signed } });
      let reads = 0;
      return new Response(new ReadableStream({ pull(controller) { if (++reads === 1) controller.enqueue(Buffer.alloc(4)); else controller.error(new Error("fixture failure")); } }));
    } });
    await expect(client.archive(9, { bytes: 20, sha256: "a".repeat(64) })).rejects.toHaveProperty("code", "CI_ARCHIVE_TOTAL_BUDGET");
    expect(client.consumedArchiveBytes).toBe(8);
  });
  it("rejects substituted archive bytes without retrying digest errors", async () => {
    let downloads = 0;
    const client = githubEvidenceClient(policy, { attempts: 3, fetcher: async url => url.startsWith("https://api.github.com")
      ? new Response(null, { status: 302, headers: { location: signed } }) : (downloads++, new Response(Buffer.alloc(zip.length))) });
    await expect(client.archive(9, ref)).rejects.toHaveProperty("code", "CI_ARCHIVE_DIGEST"); expect(downloads).toBe(1);
  });
  it("builds pagination locally and never follows the Link header", async () => {
    const urls = [];
    const client = githubEvidenceClient(policy, { ...options, fetcher: async url => {
      urls.push(url); const values = url.endsWith("page=1") ? Array.from({ length: 100 }, (_, id) => ({ id })) : [{ id: 100 }];
      return new Response(JSON.stringify({ total_count: 101, jobs: values }), { headers: { link: '<https://evil.example/>; rel="next"' } });
    } });
    expect(await client.list(`${base}/jobs`, "jobs")).toHaveLength(101);
    expect(urls).toEqual([`https://api.github.com${base}/jobs?per_page=100&page=1`, `https://api.github.com${base}/jobs?per_page=100&page=2`]);
  });
  it.each([null, {}, { total_count: 4, jobs: [] }, { total_count: 1001, jobs: [] }, { total_count: 0, jobs: [1] }])(
    "rejects invalid or inconsistent paginated metadata", async value => {
      const client = githubEvidenceClient(policy, { ...options, fetcher: async () => json(value) });
      await expect(client.list(`${base}/jobs`, "jobs")).rejects.toHaveProperty("code", value === null || !Array.isArray(value.jobs) ? "CI_LIST_CONTRACT" : "CI_LIST_TOTAL");
    });
  it("refuses unlimited metadata retention", async () => {
    const client = githubEvidenceClient(policy, { ...options, fetcher: async () => json({}) });
    for (let index = 0; index < 100; index++) await client.json(`${base}/metadata/${index}`);
    await expect(client.json(`${base}/metadata/100`)).rejects.toHaveProperty("code", "CI_METADATA_COUNT");
  });
  it("rejects runtime budget enlargement and foreign policies", () => {
    for (const value of [{ timeoutMs: 30001 }, { attempts: 4 }, { maxDurationMs: 600001 }, { maxArchiveBytes: 768 * 1024 * 1024 + 1 }, { token: "unsafe\nidentity" }]) {
      expect(() => githubEvidenceClient(policy, value)).toThrow("CI_IO_CONFIG");
    }
    expect(ciTrustPolicySchema.safeParse({ ...policy, repository: "other/repo" }).success).toBe(false);
    expect(ciLocatorSchema.safeParse({ schemaVersion: 1, consumer: { runId: 1, runAttempt: 1, jobId: 2, artifactId: 3 },
      examples: { runId: 1, runAttempt: 2, jobId: 4, artifactId: 5 } }).success).toBe(false);
  });
  it("gives aggregate receipt counts their own documented limits", () => {
    expect(ciVerificationReceiptSchema.shape.consumedArchiveBytes.safeParse(768 * 1024 * 1024).success).toBe(true);
    expect(ciVerificationReceiptSchema.shape.consumedPublicBytes.safeParse(512 * 1024 * 1024).success).toBe(true);
    expect(ciVerificationReceiptSchema.shape.consumedPublicBytes.safeParse(512 * 1024 * 1024 + 1).success).toBe(false);
    const pathSchema = ciVerificationReceiptSchema.shape.consumer.shape.archive.shape.path;
    for (const path of ["../escape", "/absolute", "a//b", "a/../b"]) expect(pathSchema.safeParse(path).success).toBe(false);
  });
});
