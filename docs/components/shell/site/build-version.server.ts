import { execFileSync } from "node:child_process";

export interface BuildVersion {
  commitId: string;
  commitMessage: string;
  updatedAt: string;
}

type BuildEnvironment = Readonly<Record<string, string | undefined>>;

function readGit(cwd: string, args: string[]) {
  try {
    return execFileSync("git", args, {
      cwd,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
      timeout: 2_000,
    }).trim();
  } catch {
    return "";
  }
}

function firstLine(value: string | undefined) {
  return value?.trim().split(/\r?\n/, 1)[0] ?? "";
}

export function resolveBuildVersion(
  environment: BuildEnvironment = process.env,
  cwd = process.cwd()
): BuildVersion {
  const repositoryCommitId = readGit(cwd, ["rev-parse", "HEAD"]);
  const commitId =
    environment.VERCEL_GIT_COMMIT_SHA?.trim() ||
    environment.GITHUB_SHA?.trim() ||
    repositoryCommitId ||
    "development";
  const commitMessage =
    firstLine(environment.VERCEL_GIT_COMMIT_MESSAGE) ||
    firstLine(environment.BUILD_COMMIT_MESSAGE) ||
    firstLine(readGit(cwd, ["show", "-s", "--format=%s", commitId])) ||
    "Development build";
  const updatedAt =
    environment.BUILD_COMMIT_TIMESTAMP?.trim() ||
    readGit(cwd, ["show", "-s", "--format=%cI", commitId]) ||
    new Date().toISOString();

  return { commitId, commitMessage, updatedAt };
}
