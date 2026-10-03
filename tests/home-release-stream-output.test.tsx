import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { beforeEach, expect, it, vi } from "vitest";
import type { NpmRelease } from "../docs/lib/npm-release.server";

const mocks = vi.hoisted(() => ({ readNpmRelease: vi.fn(), setRequestLocale: vi.fn() }));
vi.mock("@docs/lib/npm-release.server", () => ({ readNpmRelease: mocks.readNpmRelease }));
vi.mock("next-intl/server", () => ({ setRequestLocale: mocks.setRequestLocale }));
vi.mock("../docs/pages/home.module.css", () => ({ default: {} }));
vi.mock("@zeron/icons/context", () => ({ useIcon: () => () => null }));
// The interactive showcase is unrelated to release data. Keep the real HomeContent,
// release slots, next-intl provider, and InstallCommand/InputCopy tree in this test.
vi.mock("@docs/components/content/HomePreview", () => ({ HomePreview: () => <div>Interactive preview</div> }));

import HomePage from "../app/[locale]/page";

const published: NpmRelease = { version: "0.2.0-beta.16", publishedAt: "2026-09-14T05:47:22.594Z", node: ">=20.18.1", prerelease: true };
beforeEach(() => vi.clearAllMocks());

// This verifies React's actual streamed output, rather than replacing Suspense
// with fallbacks by hand. Next Flight and browser navigation need separate E2E coverage.
it.each(["en", "zh-CN"])("streams the full %s shell before npm and resolves all four release boundaries", async locale => {
  let resolveRelease!: (value: NpmRelease | null) => void;
  const release = new Promise<NpmRelease | null>(resolve => { resolveRelease = resolve; });
  mocks.readNpmRelease.mockReturnValue(release);
  const page = await HomePage({ params: Promise.resolve({ locale }) });
  let html = "";
  const output = new PassThrough();
  output.on("data", chunk => { html += chunk.toString(); });
  const finished = new Promise<void>((resolve, reject) => { output.on("end", resolve); output.on("error", reject); });
  let shellReady!: () => void;
  const shell = new Promise<void>(resolve => { shellReady = resolve; });
  const errors: unknown[] = [];
  const stream = renderToPipeableStream(page, {
    onShellReady() { stream.pipe(output); shellReady(); },
    onError(error) { errors.push(error); },
    onShellError(error) { output.destroy(error instanceof Error ? error : new Error(String(error))); }
  });
  try {
    await shell;
    expect(html).toContain('id="install"');
    expect(html).toContain('id="skills"');
    expect(html).toContain("Interactive preview");
    expect(html).not.toContain("npx zeron-ui@");
    expect(html).not.toContain("0.2.0-beta.16");
    expect(html.match(/<!--\$\?-->/g)).toHaveLength(4);
    resolveRelease(published);
    await finished;
    expect(html).toContain("npx zeron-ui@0.2.0-beta.16 init");
    expect(html).toContain("npx zeron-ui@0.2.0-beta.16 add button");
    expect(html).toContain("v0.2.0-beta.16");
    expect(html).toContain('dateTime="2026-09-14T05:47:22.594Z"');
    expect(errors).toEqual([]);
  } finally { stream.abort(); output.destroy(); }
});
