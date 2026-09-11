import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
import { resolveBuildVersion } from "../docs/components/shell/site/build-version.server";

describe("build version", () => {
  it("uses deployment metadata when it is available", () => {
    const version = resolveBuildVersion({
      VERCEL_GIT_COMMIT_SHA: "1234567890abcdef",
      VERCEL_GIT_COMMIT_MESSAGE: "feat: publish version details\n\nMore detail",
      BUILD_COMMIT_TIMESTAMP: "2026-09-11T10:15:00Z",
    });

    expect(version).toEqual({
      commitId: "1234567890abcdef",
      commitMessage: "feat: publish version details",
      updatedAt: "2026-09-11T10:15:00Z",
    });
  });

  it("falls back to the current repository commit", () => {
    const version = resolveBuildVersion({}, process.cwd());
    const expectedCommitId = execFileSync("git", ["rev-parse", "HEAD"], {
      encoding: "utf8",
    }).trim();

    expect(version.commitId).toBe(expectedCommitId);
    expect(version.commitMessage).not.toBe("Development build");
    expect(version.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
