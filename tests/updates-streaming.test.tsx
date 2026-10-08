import { PassThrough } from "node:stream";
import { renderToPipeableStream, renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CommitHistoryEntry } from "@docs/lib/commit-history.server";
import type { CommitActivityHistory } from "@docs/lib/commit-activity.server";

const { readCommitActivityHistory, getLocale } = vi.hoisted(() => ({
  readCommitActivityHistory: vi.fn(),
  getLocale: vi.fn(),
}));
vi.mock("@docs/lib/commit-activity.server", () => ({ readCommitActivityHistory }));
vi.mock("next/cache", () => ({ unstable_cache: (reader: () => Promise<CommitActivityHistory>) => reader }));
vi.mock("next-intl/server", () => ({ setRequestLocale: vi.fn(), getLocale }));

import UpdatesPage from "@/app/[locale]/updates/page";
import UpdatesLoading from "@/app/[locale]/updates/loading";

const commits: CommitHistoryEntry[] = [
  { id: "abc123456", shortId: "abc1234", committedAt: "2026-09-11T14:46:44+08:00", author: "Carlos", message: "First update" },
  { id: "def123456", shortId: "def1234", committedAt: "2026-09-11T12:00:00+08:00", author: "Carlos", message: "Second update" },
  { id: "ghi123456", shortId: "ghi1234", committedAt: "2026-09-10T12:00:00+08:00", author: "", message: "Earlier update" },
];

beforeEach(() => vi.resetAllMocks());

describe("Updates streaming", () => {
  it.each([
    ["en", "Updates", "Loading updates…", "Recent 3 commits", "Latest"],
    ["zh-CN", "更新日志", "正在加载更新日志…", "最近 3 条提交", "最新"],
  ])("streams the %s shell before history and reveals count/list together", async (locale, title, loading, count, latest) => {
    let resolveHistory!: (value: CommitActivityHistory) => void;
    readCommitActivityHistory.mockReturnValue(new Promise<CommitActivityHistory>((resolve) => { resolveHistory = resolve; }));
    const page = await UpdatesPage({ params: Promise.resolve({ locale }) });
    expect(readCommitActivityHistory).not.toHaveBeenCalled();
    let html = "";
    const output = new PassThrough();
    output.on("data", (chunk) => { html += chunk.toString(); });
    const finished = new Promise<void>((resolve, reject) => {
      output.on("end", resolve);
      output.on("error", reject);
    });
    let shellReady!: () => void;
    const shell = new Promise<void>((resolve) => { shellReady = resolve; });
    const stream = renderToPipeableStream(page, {
      onShellReady() { stream.pipe(output); shellReady(); },
      onShellError(error) { output.destroy(error instanceof Error ? error : new Error(String(error))); },
    });
    try {
      await shell;
      expect(readCommitActivityHistory).toHaveBeenCalledOnce();
      expect(html).toContain(`id="updates-title">${title}</h1>`);
      expect(html).toContain(loading);
      expect(html).toContain('data-slot="skeleton"');
      expect(html).not.toContain(count);
      expect(html).not.toContain("First update");
      resolveHistory({ commits, asOf: "2026-09-12T00:00:00Z", complete: true, source: "github" });
      await finished;
      expect(html).toContain(count);
      expect(html).toContain("First update");
      expect(html).toContain("Second update");
      expect(html).toContain("Earlier update");
      expect(html.match(/id="updates-2026-09-11"/g)).toHaveLength(1);
      expect(html.match(/id="updates-2026-09-10"/g)).toHaveLength(1);
      expect(html).toContain('dateTime="2026-09-11T14:46:44+08:00"');
      expect(html).toContain("06:46");
      expect(html).toContain(locale === "en" ? "Time zone: UTC" : "时区：UTC");
      expect(html).toContain("https://github.com/Carlosfengv/zeron-ui/commit/abc123456");
      expect(html.match(new RegExp(`>${latest}<`, "g"))).toHaveLength(1);
    } finally {
      stream.abort();
      output.destroy();
    }
  });

  it.each([["en", "Updates"], ["zh-CN", "更新日志"]])("uses a lightweight localized %s route fallback without reading history", async (locale, title) => {
    getLocale.mockResolvedValue(locale);
    const html = renderToStaticMarkup(await UpdatesLoading());
    expect(html).toContain(`id="updates-title">${title}</h1>`);
    expect(html).toContain('data-slot="page-layout"');
    expect(html).toContain('data-slot="page-content"');
    expect(html).toContain('data-slot="skeleton"');
    expect(html.match(/role="status"/g)).toHaveLength(1);
    expect(readCommitActivityHistory).not.toHaveBeenCalled();
  });
});
