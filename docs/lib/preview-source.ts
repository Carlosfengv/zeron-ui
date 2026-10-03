/** Source references never carry filesystem paths or locale-specific URLs. */
export interface PreviewSourceReference {
  url: `/docs-source/${string}.txt`;
}

export type PreviewCode = string | PreviewSourceReference;

type SourceRequest = {
  controller: AbortController;
  consumers: number;
  promise: Promise<string>;
};

const requests = new Map<string, SourceRequest>();
const cache = new Map<string, string>();
const failedUrls = new Set<string>();
const MAX_CACHED_SOURCES = 32;
const MAX_CACHED_CHARACTERS = 4_000_000;
let cachedCharacters = 0;

function assertSourceUrl(url: string) {
  if (!/^\/docs-source\/[a-f0-9]{64}\.txt$/.test(url)) {
    throw new Error("Invalid preview source reference");
  }
}

function remember(url: string, source: string) {
  if (source.length > MAX_CACHED_CHARACTERS) return;
  const previous = cache.get(url);
  if (previous !== undefined) cachedCharacters -= previous.length;
  cache.delete(url);
  cache.set(url, source);
  cachedCharacters += source.length;
  while (cache.size > MAX_CACHED_SOURCES || cachedCharacters > MAX_CACHED_CHARACTERS) {
    const oldest = cache.keys().next().value!;
    cachedCharacters -= cache.get(oldest)!.length;
    cache.delete(oldest);
  }
}

export function getCachedPreviewSource(url: string): string | undefined {
  const source = cache.get(url);
  if (source !== undefined) {
    cache.delete(url);
    cache.set(url, source);
  }
  return source;
}

/** Share in-flight requests, but abort when the last interested preview leaves. */
export function requestPreviewSource(url: string): {
  promise: Promise<string>;
  release: () => void;
} {
  assertSourceUrl(url);
  const cached = getCachedPreviewSource(url);
  if (cached !== undefined) return { promise: Promise.resolve(cached), release: () => {} };

  let request = requests.get(url);
  if (!request) {
    const controller = new AbortController();
    const entry: SourceRequest = {
      controller,
      consumers: 0,
      promise: Promise.resolve(""),
    };
    entry.promise = Promise.resolve()
      .then(() => fetch(url, {
        signal: controller.signal,
        // A failed immutable request may have cached an error at the browser
        // or intermediary. Explicit retry must revalidate that response.
        cache: failedUrls.has(url) ? "reload" : "force-cache",
        credentials: "omit",
        headers: { Accept: "text/plain" },
      }))
      .then(async (response) => {
        if (!response.ok) throw new Error(`Preview source unavailable (${response.status})`);
        if (!/^text\/plain(?:;|$)/i.test(response.headers.get("content-type") ?? "")) {
          throw new Error("Unexpected preview source content type");
        }
        const source = await response.text();
        // A superseded/aborted response must not repopulate the cache.
        if (controller.signal.aborted) throw new DOMException("Source request cancelled", "AbortError");
        failedUrls.delete(url);
        remember(url, source);
        return source;
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          failedUrls.add(url);
          if (failedUrls.size > MAX_CACHED_SOURCES) failedUrls.delete(failedUrls.values().next().value!);
        }
        throw error;
      })
      .finally(() => {
        if (requests.get(url) === entry) requests.delete(url);
      });
    requests.set(url, entry);
    request = entry;
  }

  const activeRequest = request;
  activeRequest.consumers += 1;
  let released = false;
  return {
    promise: activeRequest.promise,
    release: () => {
      if (released) return;
      released = true;
      activeRequest.consumers -= 1;
      if (activeRequest.consumers === 0 && requests.get(url) === activeRequest) {
        requests.delete(url);
        activeRequest.controller.abort();
      }
    },
  };
}
