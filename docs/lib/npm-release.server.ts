export interface NpmRelease {
  version: string;
  publishedAt: string | null;
  node: string | null;
  prerelease: boolean;
}

function record(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

export function parseNpmRelease(value: unknown): NpmRelease | null {
  const metadata = record(value);
  const version = record(metadata["dist-tags"]).latest;
  if (metadata.name !== "zeron-ui" || typeof version !== "string"
    || !/^\d+\.\d+\.\d+(?:-[\da-zA-Z.-]+)?(?:\+[\da-zA-Z.-]+)?$/.test(version)) return null;
  const release = record(record(metadata.versions)[version]);
  if (release.version !== version) return null;
  const publishedAt = record(metadata.time)[version];
  const node = record(release.engines).node;
  return {
    version,
    publishedAt: typeof publishedAt === "string" && Number.isFinite(Date.parse(publishedAt)) ? publishedAt : null,
    node: typeof node === "string" ? node : null,
    prerelease: version.split("+")[0].includes("-"),
  };
}

export async function readNpmRelease(fetcher: typeof fetch = fetch): Promise<NpmRelease | null> {
  try {
    const response = await fetcher("https://registry.npmjs.org/zeron-ui", {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(5000),
    });
    return response.ok ? parseNpmRelease(await response.json()) : null;
  } catch {
    // Keep the homepage usable when npm is unavailable. Never substitute the
    // workspace version: local source is not evidence of a published release.
    return null;
  }
}
