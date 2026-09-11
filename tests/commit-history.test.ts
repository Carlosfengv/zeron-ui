import fs from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  parseCommitHistory,
  parseGitHubCommitHistory,
  readCommitHistory,
} from "../docs/lib/commit-history.server";

describe("updates commit history", () => {
  it("parses commit records in newest-first order", () => {
    const output = [
      "abc123456789\x1fabc1234\x1f2026-09-11T14:46:44+08:00\x1fCarlos\x1ffeat: add updates\x1e",
      "def987654321\x1fdef9876\x1f2026-09-10T12:30:00+08:00\x1fCarlos\x1ffix: align layout\x1e",
    ].join("\n");

    expect(parseCommitHistory(output)).toEqual([
      {
        id: "abc123456789",
        shortId: "abc1234",
        committedAt: "2026-09-11T14:46:44+08:00",
        author: "Carlos",
        message: "feat: add updates",
      },
      {
        id: "def987654321",
        shortId: "def9876",
        committedAt: "2026-09-10T12:30:00+08:00",
        author: "Carlos",
        message: "fix: align layout",
      },
    ]);
  });

  it("maps GitHub commits and keeps only the subject line", () => {
    expect(parseGitHubCommitHistory([
      {
        sha: "abc123456789",
        commit: {
          author: { date: "2026-09-11T06:46:44Z", name: "Carlos" },
          committer: { date: "2026-09-11T07:00:00Z", name: "GitHub" },
          message: "feat: add updates\n\nLong description",
        },
      },
    ])).toEqual([
      {
        id: "abc123456789",
        shortId: "abc1234",
        committedAt: "2026-09-11T07:00:00Z",
        author: "Carlos",
        message: "feat: add updates",
      },
    ]);
  });

  it("loads the deployed revision from GitHub", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify([
      {
        sha: "abc123456789",
        commit: {
          author: { date: "2026-09-11T06:46:44Z", name: "Carlos" },
          committer: { date: "2026-09-11T07:00:00Z", name: "GitHub" },
          message: "feat: add updates",
        },
      },
    ])));

    const commits = await readCommitHistory("/missing", 100, {
      VERCEL_GIT_COMMIT_SHA: "abc123456789",
      VERCEL_GIT_REPO_OWNER: "Carlosfengv",
      VERCEL_GIT_REPO_SLUG: "zeron-ui",
    }, fetchMock);

    expect(commits).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("sha=abc123456789");
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("per_page=100");
  });

  it("falls back to the current repository history", async () => {
    const unavailableFetch = vi.fn(async () => new Response(null, { status: 503 }));
    const commits = await readCommitHistory(process.cwd(), 3, {}, unavailableFetch);
    expect(commits).toHaveLength(3);
    expect(commits[0]?.id).toMatch(/^[a-f0-9]{40}$/);
  });

  it("keeps the updates content in one centered 960px PageBody", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "app/[locale]/updates/page.tsx"), "utf8");
    expect(source).toContain('<PageLayout className="h-full min-h-0 w-full" gutter="default" size="full">');
    expect(source).toContain('<PageContent className="overflow-y-auto overscroll-contain">');
    expect(source).toContain('<PageBody className="h-auto max-w-[960px] flex-none overflow-visible overscroll-auto');
    expect(source).not.toContain("<PageSidebar");
    expect(source).not.toContain("<PageColumns");
  });

  it("bounds the updates workspace so PageContent owns overflow scrolling", () => {
    const source = fs.readFileSync(path.join(process.cwd(), "docs/components/shell/site/site-shell.tsx"), "utf8");
    expect(source).toContain("const isBoundedWorkspace = isComponentsWorkspace || isUpdatesPage;");
    expect(source).toContain('isBoundedWorkspace ? "h-svh overflow-hidden"');
    expect(source).toContain('isBoundedWorkspace ? "h-full min-h-0 min-w-0 flex-1"');
  });
});
