import { execFileSync } from "node:child_process";
import { resolveBuildVersion } from "@docs/components/shell/site/build-version.server";
import { parseCommitHistory, parseGitHubCommitHistory, readLocalCommitHistory, type CommitHistoryEntry } from "./commit-history.server";

export interface CommitActivityHistory {
  commits: CommitHistoryEntry[];
  asOf: string;
  complete: boolean;
  source: "github" | "local" | "unavailable";
}

type Environment = Readonly<Record<string, string | undefined>>;

async function fetchActivityHistory(since: string, until: string, environment: Environment, fetchImplementation: typeof fetch) {
  const owner = environment.VERCEL_GIT_REPO_OWNER?.trim() || "Carlosfengv";
  const repository = environment.VERCEL_GIT_REPO_SLUG?.trim() || "zeron-ui";
  const pinnedRevision = environment.VERCEL_GIT_COMMIT_SHA?.trim() || environment.GITHUB_SHA?.trim();
  let revision = pinnedRevision || "main";
  const token = environment.GITHUB_TOKEN?.trim() || environment.GH_TOKEN?.trim();
  const headers: Record<string, string> = { Accept: "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const commits = new Map<string, CommitHistoryEntry>();
  const signal = AbortSignal.timeout(10_000);
  const commitsUrl = () => new URL(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/commits`);

  try {
    if (!pinnedRevision) {
      // Resolve the actual branch tip before applying date filters. The first
      // in-range commit may be an ancestor on just one side of a merge.
      const tipUrl = commitsUrl();
      tipUrl.searchParams.set("sha", revision);
      tipUrl.searchParams.set("per_page", "1");
      const response = await fetchImplementation(tipUrl, { headers, signal, cache: "no-store" });
      if (!response.ok) return { commits: [], complete: false };
      const payload: unknown = await response.json();
      if (!Array.isArray(payload)) return { commits: [], complete: false };
      if (!payload.length) return { commits: [], complete: true };
      const tip = parseGitHubCommitHistory(payload);
      if (tip.length !== 1) return { commits: [], complete: false };
      revision = tip[0]!.id;
    }
    // Bound both total request time and page count. An interrupted range is
    // unavailable, never a complete grid with fabricated zero-count days.
    for (let page = 1; page <= 30; page++) {
      const url = commitsUrl();
      for (const [key, value] of Object.entries({ sha: revision, since, until, per_page: "100", page: String(page) })) url.searchParams.set(key, value);
      const response = await fetchImplementation(url, { headers, signal, cache: "no-store" });
      if (!response.ok) break;
      const payload: unknown = await response.json();
      if (!Array.isArray(payload)) break;
      const entries = parseGitHubCommitHistory(payload);
      if (entries.length !== payload.length || entries.some(entry => !Number.isFinite(Date.parse(entry.committedAt)))) break;
      for (const entry of entries) commits.set(entry.id, entry);
      if (!response.headers.get("link")?.includes('rel="next"')) return { commits: [...commits.values()], complete: true };
      if (!entries.length) break;
    }
  } catch {
    // A network failure can still leave useful recent commits for the list.
  }
  return { commits: [...commits.values()], complete: false };
}

function readLocalActivityHistory(cwd: string, since: string, until: string, revision?: string) {
  const options = { cwd, encoding: "utf8" as const, maxBuffer: 4 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"] as ["ignore", "pipe", "ignore"], timeout: 5_000 };
  try {
    if (execFileSync("git", ["rev-parse", "--is-shallow-repository"], options).trim() !== "false") return null;
    return parseCommitHistory(execFileSync("git", ["log", ...(revision ? [revision] : []), `--since-as-filter=${since}`, `--until=${until}`, "--date=iso-strict", "--pretty=format:%H%x1f%h%x1f%cI%x1f%an%x1f%s%x1e"], options));
  } catch {
    return null;
  }
}

export async function readCommitActivityHistory(
  cwd = process.cwd(),
  environment: Environment = process.env,
  fetchImplementation: typeof fetch = fetch,
  now = new Date(),
): Promise<CommitActivityHistory> {
  const asOf = now.toISOString();
  // At UTC New Year, UTC−12 visitors may still be in the previous year.
  // The extra day covers UTC+14's first midnight of that calendar year.
  const earliestYear = new Date(now.getTime() - 12 * 60 * 60 * 1_000).getUTCFullYear();
  const start = new Date(Date.UTC(earliestYear, 0, 0));
  const since = start.toISOString();
  const remote = await fetchActivityHistory(since, asOf, environment, fetchImplementation);
  const normalize = (commits: CommitHistoryEntry[]) => commits
    .filter(commit => Date.parse(commit.committedAt) >= start.getTime() && Date.parse(commit.committedAt) <= now.getTime())
    .sort((a, b) => Date.parse(b.committedAt) - Date.parse(a.committedAt));
  if (remote.complete) return { commits: normalize(remote.commits), asOf, complete: true, source: "github" };
  const revision = environment.VERCEL_GIT_COMMIT_SHA?.trim() || environment.GITHUB_SHA?.trim();
  const local = readLocalActivityHistory(cwd, since, asOf, revision);
  if (local !== null) return { commits: normalize(local), asOf, complete: true, source: "local" };
  let commits = remote.commits.length ? remote.commits : readLocalCommitHistory(cwd);
  if (!commits.length) {
    const current = resolveBuildVersion(environment, cwd);
    commits = [{ id: current.commitId, shortId: current.commitId.slice(0, 7), committedAt: current.updatedAt, author: "", message: current.commitMessage }];
  }
  return { commits, asOf, complete: false, source: "unavailable" };
}
