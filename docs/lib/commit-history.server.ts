import { execFileSync } from "node:child_process";
import { resolveBuildVersion } from "@docs/components/shell/site/build-version.server";

const FIELD_SEPARATOR = "\x1f";
const RECORD_SEPARATOR = "\x1e";
const DEFAULT_COMMIT_LIMIT = 100;

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

export function readCommitHistory(
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

  const current = resolveBuildVersion(process.env, cwd);
  return [{
    id: current.commitId,
    shortId: current.commitId.slice(0, 7),
    committedAt: current.updatedAt,
    author: "",
    message: current.commitMessage,
  }];
}
