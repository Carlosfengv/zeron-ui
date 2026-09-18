import { describe, expect, it, vi } from "vitest";
import { parseNpmRelease, readNpmRelease } from "../docs/lib/npm-release.server";

const metadata = {
  name: "zeron-ui",
  "dist-tags": { latest: "0.2.0-beta.16", beta: "0.3.0-beta.1" },
  versions: {
    "0.2.0-beta.16": { version: "0.2.0-beta.16", engines: { node: ">=20.18.1" } },
    "0.3.0-beta.1": { version: "0.3.0-beta.1" },
  },
  time: { "0.2.0-beta.16": "2026-09-14T05:47:22.594Z" },
};

describe("homepage npm release", () => {
  it("follows the npm latest tag, including when it names a prerelease", () => {
    expect(parseNpmRelease(metadata)).toEqual({ version: "0.2.0-beta.16", node: ">=20.18.1", publishedAt: "2026-09-14T05:47:22.594Z", prerelease: true });
    expect(parseNpmRelease({ ...metadata, "dist-tags": { latest: "1.0.0" }, versions: { "1.0.0": { version: "1.0.0" } } })).toEqual({ version: "1.0.0", node: null, publishedAt: null, prerelease: false });
  });

  it("does not turn unrelated, malformed or unpublished data into an install command", () => {
    for (const value of [null, {}, { ...metadata, name: "another-package" }, { ...metadata, versions: {} }, { ...metadata, "dist-tags": { latest: "1.0.0; echo injected" } }]) {
      expect(parseNpmRelease(value)).toBeNull();
    }
    expect(parseNpmRelease({ ...metadata, time: { "0.2.0-beta.16": "invalid date" } })?.publishedAt).toBeNull();
  });

  it("fetches npm with a bounded timeout and hourly revalidation", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json(metadata));
    expect((await readNpmRelease(fetcher))?.version).toBe("0.2.0-beta.16");
    expect(fetcher).toHaveBeenCalledWith("https://registry.npmjs.org/zeron-ui", expect.objectContaining({ next: { revalidate: 3600 }, signal: expect.any(AbortSignal) }));
  });

  it("keeps the page usable on HTTP, JSON and network failures without inventing a version", async () => {
    for (const response of [new Response("Unavailable", { status: 503 }), new Response("not json"), Response.json({})]) {
      expect(await readNpmRelease(vi.fn<typeof fetch>().mockResolvedValue(response))).toBeNull();
    }
    expect(await readNpmRelease(vi.fn<typeof fetch>().mockRejectedValue(new Error("timeout")))).toBeNull();
  });
});
