import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { readCommitActivityHistory } from "@docs/lib/commit-activity.server";
import { buildCommitActivity, activityDateKey } from "@docs/lib/commit-activity";
import type { CommitHistoryEntry } from "@docs/lib/commit-history.server";

const now = new Date("2026-10-08T02:00:00Z");
const apiCommit = (id: string, date = "2026-10-07T10:00:00Z") => ({ sha: id, commit: { message: `Update ${id}`, committer: { date }, author: { name: "Carlos" } } });
const entry = (id: string, committedAt: string): CommitHistoryEntry => ({ id, shortId: id, committedAt, message: id, author: "Carlos" });

describe("complete commit activity history", () => {
  it("paginates beyond 100 commits, preserves the deployed revision and deduplicates IDs", async () => {
    const first = Array.from({ length: 100 }, (_, i) => apiCommit(`commit-${i}`));
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify(first), { headers: { link: '<https://api.github.com/next>; rel="next"' } }))
      .mockResolvedValueOnce(new Response(JSON.stringify([first[99], apiCommit("last")])));
    const result = await readCommitActivityHistory("/missing", { GITHUB_SHA: "deployed", VERCEL_GIT_REPO_OWNER: "owner", VERCEL_GIT_REPO_SLUG: "repo" }, fetchMock, now);
    expect(result).toMatchObject({ asOf: now.toISOString(), complete: true, source: "github" });
    expect(result.commits).toHaveLength(101);
    const urls = fetchMock.mock.calls.map(([url]) => new URL(String(url)));
    expect(urls[0].pathname).toBe("/repos/owner/repo/commits");
    expect(urls[0].searchParams.get("sha")).toBe("deployed");
    expect(urls[1].searchParams.get("sha")).toBe("deployed");
    expect(urls[1].searchParams.get("page")).toBe("2");
    expect(urls[0].searchParams.get("since")).toBe("2025-12-31T00:00:00.000Z");
    expect(urls[0].searchParams.get("until")).toBe(now.toISOString());
    expect(urls[0].searchParams.get("per_page")).toBe("100");
  });

  it("resolves a branch tip before filtering, even when its timestamp falls outside the range", async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify([apiCommit("tip", "2025-01-01T00:00:00Z")])))
      .mockResolvedValueOnce(new Response(JSON.stringify([apiCommit("in-range")])));
    const result = await readCommitActivityHistory("/missing", {}, fetchMock, now);
    expect(result).toMatchObject({ complete: true, source: "github" });
    expect(result.commits.map(commit => commit.id)).toEqual(["in-range"]);
    const urls = fetchMock.mock.calls.map(([url]) => new URL(String(url)));
    expect(urls[0].searchParams.get("since")).toBeNull();
    expect(urls[0].searchParams.get("per_page")).toBe("1");
    expect(urls[1].searchParams.get("sha")).toBe("tip");
  });

  it("distinguishes a complete empty response from unavailable history", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response("[]"));
    expect(await readCommitActivityHistory("/missing", {}, fetchMock, now)).toMatchObject({ commits: [], complete: true, source: "github" });
  });

  it("retains partial commits for the list but refuses an incomplete activity grid", async () => {
    const fetchMock = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response(JSON.stringify([apiCommit("partial")]), { headers: { link: '<https://untrusted.invalid>; rel="next"' } }))
      .mockResolvedValueOnce(new Response(null, { status: 503 }));
    const result = await readCommitActivityHistory("/missing", { GITHUB_SHA: "deployed" }, fetchMock, now);
    expect(result).toMatchObject({ complete: false, source: "unavailable" });
    expect(result.commits.map(commit => commit.id)).toEqual(["partial"]);
    expect(String(fetchMock.mock.calls[1][0])).toContain("https://api.github.com/repos/");
  });

  it.each(["null", "{}", '[{"sha":"invalid"}]', JSON.stringify([apiCommit("invalid", "not-a-date")])])("rejects malformed history: %s", async payload => {
    const result = await readCommitActivityHistory("/missing", {}, vi.fn<typeof fetch>(async () => new Response(payload)), now);
    expect(result.complete).toBe(false);
  });

  it("bounds pathological pagination instead of claiming a complete range", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(JSON.stringify([apiCommit("repeat")]), { headers: { link: '<https://api.github.com/next>; rel="next"' } }));
    expect((await readCommitActivityHistory("/missing", { GITHUB_SHA: "deployed" }, fetchMock, now)).complete).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(30);
  });

  it("falls back to complete local history, includes non-monotonic dates and rejects a shallow clone", async () => {
    const cwd = mkdtempSync(join(tmpdir(), "zeron-activity-"));
    const shallow = join(cwd, "shallow");
    const git = (...args: string[]) => execFileSync("git", args, { cwd, stdio: "ignore" });
    const fetchMock = vi.fn<typeof fetch>(async () => new Response(null, { status: 503 }));
    try {
      git("init", "-b", "main");
      for (const [message, date] of [["old", "2025-07-01T00:00:00Z"], ["in range", "2026-10-07T00:00:00Z"], ["backdated tip", "2025-07-01T00:00:00Z"]]) {
        execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.test", "commit", "--allow-empty", "-m", message], { cwd, stdio: "ignore", env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } });
      }
      const result = await readCommitActivityHistory(cwd, {}, fetchMock, now);
      expect(result).toMatchObject({ complete: true, source: "local" });
      expect(result.commits.map(commit => commit.message)).toEqual(["in range"]);
      git("clone", "--depth=1", `file://${cwd}`, shallow);
      expect((await readCommitActivityHistory(shallow, {}, fetchMock, now)).complete).toBe(false);
    } finally {
      rmSync(cwd, { recursive: true, force: true });
    }
  });
});

describe("daily commit calendar", () => {
  it.each([
    ["Asia/Shanghai", "2026-10-08", 281],
    ["America/Los_Angeles", "2026-10-07", 280],
  ])("builds the full calendar in %s, preserving midnight and commit identity", (zone, through, dayCount) => {
    const commits = [entry("next", "2026-10-07T16:00:00Z"), entry("before", "2026-10-07T15:59:59Z"), entry("future", "2026-10-08T03:00:00Z"), entry("bad", "bad-date")];
    const result = buildCommitActivity([...commits, commits[0]], now.toISOString(), zone);
    expect(result).toMatchObject({ start: "2026-01-01", end: "2026-12-31", through, total: 2 });
    const bins = result.columns.flatMap(column => column.bins).filter(bin => bin.count >= 0);
    expect(bins).toHaveLength(dayCount);
    expect(bins.reduce((total, bin) => total + bin.count, 0)).toBe(2);
    expect(bins.map(bin => activityDateKey(bin.date))).toEqual([...new Set(bins.map(bin => activityDateKey(bin.date)))]);
    if (zone === "Asia/Shanghai") expect([...result.groups.keys()]).toEqual(["2026-10-08", "2026-10-07"]);
    else expect(result.groups.get("2026-10-07")?.map(commit => commit.id)).toEqual(["next", "before"]);
  });

  it("uses calendar arithmetic across daylight-saving changes", () => {
    const result = buildCommitActivity([entry("after", "2026-03-08T10:01:00Z"), entry("before", "2026-03-08T09:59:00Z")], "2026-03-09T12:00:00Z", "America/Los_Angeles");
    expect(result.groups.get("2026-03-08")).toHaveLength(2);
    expect(result.activeDays).toBe(1);
    expect(result.columns.flatMap(column => column.bins).filter(bin => bin.count >= 0)).toHaveLength(68);
  });

  it("keeps true zero activity, omits padding days and excludes old commits", () => {
    const result = buildCommitActivity([entry("old", "2025-01-01T00:00:00Z")], now.toISOString(), "UTC");
    expect(result.total).toBe(0);
    expect(result.activeDays).toBe(0);
    expect(result.columns.flatMap(column => column.bins).filter(bin => bin.count >= 0).every(bin => bin.count === 0)).toBe(true);
    expect(result.columns.flatMap(column => column.bins).some(bin => bin.count === -1)).toBe(true);
  });

  it("includes leap day and excludes dates after the snapshot", () => {
    const result = buildCommitActivity([entry("leap", "2024-02-29T10:00:00Z"), entry("future", "2024-12-31T12:00:01Z")], "2024-12-31T12:00:00Z", "UTC");
    expect(result.columns.flatMap(column => column.bins).filter(bin => bin.count >= 0)).toHaveLength(366);
    expect(result.groups.get("2024-02-29")).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("uses the visitor's calendar year across UTC New Year", async () => {
    const asOf = "2026-01-01T01:00:00Z";
    const east = buildCommitActivity([], asOf, "Pacific/Kiritimati");
    const west = buildCommitActivity([], asOf, "Etc/GMT+12");
    expect(east.year).toBe("2026");
    expect(west.year).toBe("2025");
    expect(east.columns.flatMap(column => column.bins).filter(bin => bin.count >= 0)).toHaveLength(1);
    expect(west.columns.flatMap(column => column.bins).filter(bin => bin.count >= 0)).toHaveLength(365);
    const fetchMock = vi.fn<typeof fetch>(async () => new Response("[]"));
    await readCommitActivityHistory("/missing", { GITHUB_SHA: "deployed" }, fetchMock, new Date(asOf));
    expect(new URL(String(fetchMock.mock.calls[0][0])).searchParams.get("since")).toBe("2024-12-31T00:00:00.000Z");
  });
});
