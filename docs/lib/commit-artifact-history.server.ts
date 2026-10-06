import { execFileSync } from "node:child_process";

export type CommitArtifactAdditions = Record<string, string[]>;

/** Track the first added documentation page, ignoring edits and later route moves. */
export function parseCommitArtifactAdditions(output: string): CommitArtifactAdditions {
  const additions: CommitArtifactAdditions = {};
  const seen = new Set<string>();
  for (const record of output.split("\x1e")) {
    const [header, ...files] = record.trim().split("\n");
    const [id, parents] = (header ?? "").split("\x1f");
    // A shallow checkout's boundary looks like a root: its files are not new additions.
    if (!id || !parents) continue;
    for (const file of files) {
      const path = file.startsWith("A\t") ? file.slice(2).trim() : "";
      const slug = path.match(/^docs\/pages\/(?:blocks|pages)\/([a-z0-9-]+)\/page\.tsx$/)?.[1]
        ?? path.match(/^app\/\(internal\)\/([a-z0-9-]+)\/page\.tsx$/)?.[1];
      if (!slug || seen.has(slug)) continue;
      seen.add(slug);
      (additions[id] ??= []).push(slug);
    }
  }
  return additions;
}

export function readCommitArtifactAdditions(cwd = process.cwd()): CommitArtifactAdditions {
  try {
    return parseCommitArtifactAdditions(execFileSync("git", [
      "log", "--reverse", "--find-renames", "--name-status", "--format=%x1e%H%x1f%P",
      "--", "docs/pages/blocks", "docs/pages/pages", "app/(internal)",
    ], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], maxBuffer: 2 * 1024 * 1024, timeout: 5_000 }));
  } catch {
    return {};
  }
}
