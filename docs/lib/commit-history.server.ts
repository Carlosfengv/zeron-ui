import { execFileSync } from "node:child_process";
import { resolveBuildVersion } from "@docs/components/shell/site/build-version.server";

const FIELD_SEPARATOR = "\x1f";
const RECORD_SEPARATOR = "\x1e";
const DEFAULT_COMMIT_LIMIT = 100;
const GITHUB_API_VERSION = "2022-11-28";
const DEFAULT_REPOSITORY_OWNER = "Carlosfengv";
const DEFAULT_REPOSITORY_NAME = "zeron-ui";

type BuildEnvironment = Readonly<Record<string, string | undefined>>;
type FetchImplementation = typeof fetch;

interface GitHubCommit {
  sha?: unknown;
  commit?: {
    author?: { date?: unknown; name?: unknown } | null;
    committer?: { date?: unknown; name?: unknown } | null;
    message?: unknown;
  } | null;
}

export interface CommitHistoryEntry {
  id: string;
  shortId: string;
  committedAt: string;
  author: string;
  message: string;
}

export function parseCommitHistory(output: string): CommitHistoryEntry[] {
  return output.split(RECORD_SEPARATOR).flatMap((record) => {
    const [id, shortId, committedAt, author, message] = record.trim().split(FIELD_SEPARATOR);
    if (!id || !shortId || !committedAt || !message) return [];
    return [{ id, shortId, committedAt, author: author ?? "", message }];
  });
}

function asNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

export function parseGitHubCommitHistory(value: unknown): CommitHistoryEntry[] {
  if (!Array.isArray(value)) return [];

  return value.flatMap((entry: GitHubCommit) => {
    const id = asNonEmptyString(entry.sha);
    const message = asNonEmptyString(entry.commit?.message).split(/\r?\n/, 1)[0] ?? "";
    const committedAt = asNonEmptyString(entry.commit?.committer?.date) || asNonEmptyString(entry.commit?.author?.date);
    const author = asNonEmptyString(entry.commit?.author?.name) || asNonEmptyString(entry.commit?.committer?.name);
    if (!id || !message || !committedAt) return [];

    return [{ id, shortId: id.slice(0, 7), committedAt, author, message }];
  });
}

export async function fetchGitHubCommitHistory(
  limit = DEFAULT_COMMIT_LIMIT,
  environment: BuildEnvironment = process.env,
  fetchImplementation: FetchImplementation = fetch
): Promise<CommitHistoryEntry[]> {
  const owner = environment.VERCEL_GIT_REPO_OWNER?.trim() || DEFAULT_REPOSITORY_OWNER;
  const repository = environment.VERCEL_GIT_REPO_SLUG?.trim() || DEFAULT_REPOSITORY_NAME;
  const revision = environment.VERCEL_GIT_COMMIT_SHA?.trim() || environment.GITHUB_SHA?.trim() || "main";
  const token = environment.GITHUB_TOKEN?.trim() || environment.GH_TOKEN?.trim();
  const url = new URL(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/commits`);
  url.searchParams.set("sha", revision);
  url.searchParams.set("per_page", String(Math.min(Math.max(limit, 1), 100)));

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": GITHUB_API_VERSION,
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const response = await fetchImplementation(url, {
      cache: "force-cache",
      headers,
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) return [];
    return parseGitHubCommitHistory(await response.json());
  } catch {
    return [];
  }
}

export function readLocalCommitHistory(
  cwd = process.cwd(),
  limit = DEFAULT_COMMIT_LIMIT
): CommitHistoryEntry[] {
  try {
    const output = execFileSync(
      "git",
      [
        "log",
        `--max-count=${limit}`,
        "--date=iso-strict",
        "--pretty=format:%H%x1f%h%x1f%cI%x1f%an%x1f%s%x1e",
      ],
      {
        cwd,
        encoding: "utf8",
        maxBuffer: 2 * 1024 * 1024,
        stdio: ["ignore", "pipe", "ignore"],
        timeout: 5_000,
      }
    );
    const commits = parseCommitHistory(output);
    if (commits.length) return commits;
  } catch {
    // Deployment environments may not include the repository's .git folder.
  }

  return [];
}

export async function readCommitHistory(
  cwd = process.cwd(),
  limit = DEFAULT_COMMIT_LIMIT,
  environment: BuildEnvironment = process.env,
  fetchImplementation: FetchImplementation = fetch
): Promise<CommitHistoryEntry[]> {
  const remoteCommits = await fetchGitHubCommitHistory(limit, environment, fetchImplementation);
  if (remoteCommits.length) return remoteCommits;

  const localCommits = readLocalCommitHistory(cwd, limit);
  if (localCommits.length) return localCommits;

  const current = resolveBuildVersion(environment, cwd);
  return [{
    id: current.commitId,
    shortId: current.commitId.slice(0, 7),
    committedAt: current.updatedAt,
    author: "",
    message: current.commitMessage,
  }];
}
