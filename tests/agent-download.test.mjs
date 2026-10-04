import { describe, expect, it, vi } from "vitest";
import { downloadArtifact, downloadPublicBytes } from "../scripts/download-agent-artifact.mjs";
import { sha256 } from "../scripts/agent-utils.mjs";

const origin = "https://artifacts.example.invalid";
const url = `${origin}/file.json`;
const payload = Buffer.from('{"name":"中文"}\n');
const options = { origin, bytes: payload.length, hash: sha256(payload), retryDelayMs: 0 };
const response = () => new Response(payload, { headers: { "content-type": "application/json" } });

describe("public artifact download", () => {
  it("keeps fixed downloads strict while bounding unknown-size public npm reads", async () => {
    const fetcher = vi.fn(async () => response());
    await expect(downloadArtifact(url, { origin, fetcher })).rejects.toMatchObject({ code: "INVALID_DOWNLOAD_BUDGET" });
    expect(fetcher).not.toHaveBeenCalled();
    expect(await downloadPublicBytes(url, { origin, fetcher, maxBytes: payload.length })).toEqual(payload);
    await expect(downloadPublicBytes(url, { origin, fetcher, maxBytes: payload.length - 1 })).rejects.toMatchObject({ code: "BODY_TOO_LARGE" });
    await expect(downloadPublicBytes(url, { origin, fetcher, bytes: payload.length })).rejects.toMatchObject({ code: "INVALID_DOWNLOAD_BUDGET" });
  });
  it("verifies exact bytes without credentials and handles same-origin redirects", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: "/real.json" } })).mockResolvedValueOnce(response());
    expect(await downloadArtifact(url, { ...options, fetcher })).toEqual(payload);
    expect(fetcher.mock.calls.map(([address]) => address)).toEqual([url, `${origin}/real.json`]);
    for (const [, init] of fetcher.mock.calls) {
      expect(init).toMatchObject({ redirect: "manual", cache: "no-store", headers: { accept: "application/octet-stream" } });
      expect(init.headers.authorization).toBeUndefined();
      expect(init.signal.aborted).toBe(true);
    }
  });

  it("rejects invalid URLs, budgets and cross-origin redirect before following them", async () => {
    const fetcher = vi.fn();
    for (const address of ["invalid", "http://artifacts.example.invalid/file", `${url}?token=secret`, "https://user:secret@artifacts.example.invalid/file"]) {
      await expect(downloadArtifact(address, { ...options, fetcher })).rejects.toMatchObject({ code: "UNEXPECTED_ORIGIN_OR_URL" });
    }
    for (const change of [{ maxBytes: -1 }, { maxBytes: NaN }, { retryDelayMs: Infinity }, { attempts: 4 }, { timeoutMs: 0 }, { bytes: 1.5 }]) {
      await expect(downloadArtifact(url, { ...options, ...change, fetcher })).rejects.toMatchObject({ code: "INVALID_DOWNLOAD_BUDGET" });
    }
    expect(fetcher).not.toHaveBeenCalled();
    fetcher.mockResolvedValue(new Response(null, { status: 302, headers: { location: "https://other.invalid/file" } }));
    await expect(downloadArtifact(url, { ...options, fetcher })).rejects.toMatchObject({ code: "INVALID_REDIRECT", retryable: false });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("bounds redirect chains and validates the final response origin", async () => {
    const fetcher = vi.fn().mockImplementation(() => Promise.resolve(new Response(null, { status: 307, headers: { location: "/loop" } })));
    await expect(downloadArtifact(url, { ...options, fetcher })).rejects.toMatchObject({ code: "INVALID_REDIRECT" });
    expect(fetcher).toHaveBeenCalledTimes(4);
    const foreign = response();
    Object.defineProperty(foreign, "url", { value: "https://other.invalid/file" });
    await expect(downloadArtifact(url, { ...options, fetcher: async () => foreign })).rejects.toMatchObject({ code: "UNEXPECTED_ORIGIN_OR_URL" });
  });

  it("distinguishes an absent object from a failed read and bounds transient retries", async () => {
    const missing = vi.fn().mockImplementation(async () => new Response(null, { status: 404 }));
    expect(await downloadArtifact(url, { ...options, fetcher: missing, allowMissing: true })).toBeNull();
    expect(missing).toHaveBeenCalledTimes(1);
    missing.mockClear();
    await expect(downloadArtifact(url, { ...options, fetcher: missing })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(missing).toHaveBeenCalledTimes(3);
    const transient = vi.fn().mockRejectedValueOnce(new Error("secret")).mockResolvedValueOnce(new Response(null, { status: 503 })).mockResolvedValueOnce(response());
    expect(await downloadArtifact(url, { ...options, fetcher: transient })).toEqual(payload);
    expect(transient).toHaveBeenCalledTimes(3);
    const forbidden = vi.fn().mockImplementation(async () => new Response(null, { status: 403 }));
    await expect(downloadArtifact(url, { ...options, fetcher: forbidden })).rejects.toMatchObject({ code: "HTTP_403", retryable: false });
    expect(forbidden).toHaveBeenCalledTimes(1);
  });

  it("rejects HTML, declared or streamed excess and wrong hashes without retrying, cancelling bodies", async () => {
    for (const [result, code] of [
      [new Response("error", { headers: { "content-type": "text/html" } }), "HTML_RESPONSE"],
      [new Response(payload, { headers: { "content-length": "16777217" } }), "BODY_TOO_LARGE"],
      [new Response(Buffer.concat([payload, Buffer.from("x")])), "BODY_TOO_LARGE"],
      [new Response(Buffer.alloc(payload.length)), "HASH_OR_SIZE_MISMATCH"],
      [new Response("x"), "HASH_OR_SIZE_MISMATCH"],
    ]) {
      const fetcher = vi.fn().mockResolvedValue(result);
      await expect(downloadArtifact(url, { ...options, fetcher })).rejects.toMatchObject({ code, retryable: false });
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(result.body.locked || result.bodyUsed).toBe(true);
    }
  });

  it("enforces a deadline for headers, stalled streams and even hanging cancellation", async () => {
    const fetcher = vi.fn(() => new Promise(() => {}));
    await expect(downloadArtifact(url, { ...options, timeoutMs: 5, attempts: 1, fetcher })).rejects.toMatchObject({ code: "TIMEOUT" });
    expect(fetcher.mock.calls[0][1].signal.aborted).toBe(true);
    let cancelled = false;
    const body = new ReadableStream({ cancel() { cancelled = true; return new Promise(() => {}); } });
    await expect(downloadArtifact(url, { ...options, timeoutMs: 5, attempts: 1, fetcher: async () => new Response(body) })).rejects.toMatchObject({ code: "TIMEOUT" });
    expect(cancelled).toBe(true);
  });
});
