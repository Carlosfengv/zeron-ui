import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const url = (index = 1) => `/docs-source/${index.toString(16).padStart(64, "0")}.txt`;
const response = (source: string) => new Response(source, { headers: { "content-type": "text/plain; charset=utf-8" } });
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

beforeEach(() => vi.resetModules());
afterEach(() => vi.unstubAllGlobals());

describe("preview source requests", () => {
  it("uses only versioned same-origin static URLs and rejects arbitrary paths", async () => {
    const fetch = vi.fn().mockResolvedValue(response("source"));
    vi.stubGlobal("fetch", fetch);
    const { requestPreviewSource } = await import("../docs/lib/preview-source");
    for (const invalid of ["/docs-source/../../secret.txt", "https://example.com/file", "/en/docs-source/a.txt", `${url()}?path=secret`, "/docs-source/source.txt"]) {
      expect(() => requestPreviewSource(invalid)).toThrow("Invalid preview source");
    }
    expect(fetch).not.toHaveBeenCalled();
    await requestPreviewSource(url()).promise;
    expect(fetch).toHaveBeenCalledWith(url(), expect.objectContaining({ cache: "force-cache", credentials: "omit", headers: { Accept: "text/plain" } }));
  });

  it("deduplicates active consumers and reuses completed immutable source", async () => {
    const pending = deferred<Response>();
    const fetch = vi.fn().mockReturnValue(pending.promise);
    vi.stubGlobal("fetch", fetch);
    const { requestPreviewSource, getCachedPreviewSource } = await import("../docs/lib/preview-source");
    const first = requestPreviewSource(url());
    const second = requestPreviewSource(url());
    await Promise.resolve();
    expect(fetch).toHaveBeenCalledTimes(1);
    first.release();
    first.release();
    expect(fetch.mock.calls[0][1].signal.aborted).toBe(false);
    pending.resolve(response(" exact source\n"));
    expect(await second.promise).toBe(" exact source\n");
    expect(getCachedPreviewSource(url())).toBe(" exact source\n");
    expect(await requestPreviewSource(url()).promise).toBe(" exact source\n");
    expect(fetch).toHaveBeenCalledTimes(1);
    second.release();
  });

  it("aborts abandoned work and ignores late results without overwriting a retry", async () => {
    const oldResponse = deferred<Response>();
    const freshResponse = deferred<Response>();
    const fetch = vi.fn().mockReturnValueOnce(oldResponse.promise).mockReturnValueOnce(freshResponse.promise);
    vi.stubGlobal("fetch", fetch);
    const { requestPreviewSource, getCachedPreviewSource } = await import("../docs/lib/preview-source");
    const old = requestPreviewSource(url());
    const oldResult = old.promise.catch((error: Error) => error.name);
    await Promise.resolve();
    old.release();
    expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
    const fresh = requestPreviewSource(url());
    freshResponse.resolve(response("current"));
    expect(await fresh.promise).toBe("current");
    oldResponse.resolve(response("obsolete"));
    expect(await oldResult).toBe("AbortError");
    expect(getCachedPreviewSource(url())).toBe("current");
  });

  it.each([
    ["network failure", () => Promise.reject(new Error("offline"))],
    ["missing source", () => Promise.resolve(new Response("missing", { status: 404 }))],
    ["HTML fallback", () => Promise.resolve(new Response("<html>fallback</html>", { headers: { "content-type": "text/html" } }))],
  ])("does not cache %s and retries cleanly", async (_name, failure) => {
    const fetch = vi.fn().mockImplementationOnce(failure).mockResolvedValueOnce(response("recovered"));
    vi.stubGlobal("fetch", fetch);
    const { requestPreviewSource, getCachedPreviewSource } = await import("../docs/lib/preview-source");
    await expect(requestPreviewSource(url()).promise).rejects.toThrow();
    expect(getCachedPreviewSource(url())).toBeUndefined();
    expect(await requestPreviewSource(url()).promise).toBe("recovered");
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch).toHaveBeenNthCalledWith(2, url(), expect.objectContaining({ cache: "reload" }));
  });

  it("bounds the in-memory cache across documentation navigation", async () => {
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(response("source"))));
    const { requestPreviewSource, getCachedPreviewSource } = await import("../docs/lib/preview-source");
    for (let index = 1; index <= 33; index += 1) await requestPreviewSource(url(index)).promise;
    expect(getCachedPreviewSource(url(1))).toBeUndefined();
    expect(getCachedPreviewSource(url(33))).toBe("source");
  });
});
