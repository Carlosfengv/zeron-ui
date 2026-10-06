import fs from "node:fs";
import path from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { describe, expect, it, vi } from "vitest";
import { parseCommitArtifactAdditions, readCommitArtifactAdditions } from "@docs/lib/commit-artifact-history.server";
import { withCommitArtifacts } from "@docs/lib/commit-artifacts.server";
import type { CommitHistoryEntry } from "@docs/lib/commit-history.server";

const commit = (id: string): CommitHistoryEntry => ({
  id, shortId: id.slice(0, 7), committedAt: "2026-10-05T17:19:55Z", author: "Carlos", message: "New interfaces",
});

describe("new artifact commit associations", () => {
  it("uses added pages, deduplicates artifacts and ignores edits, route moves and shallow roots", () => {
    const history = [
      "\x1eroot\x1f\nA\tdocs/pages/blocks/existing-01/page.tsx",
      "\x1efirst\x1froot\nA\tdocs/pages/blocks/cost-estimate-01/page.tsx\nA\tdocs/pages/pages/agent-trace-01/page.tsx\nA\tapp/(internal)/workflow/page.tsx",
      "\x1esecond\x1ffirst\nM\tdocs/pages/blocks/cost-estimate-01/page.tsx\nA\tdocs/pages/pages/agent-trace-01/page.tsx\nA\tdocs/pages/components/button/page.tsx\nA\tdocs/pages/blocks/cost-estimate-01/Demo.tsx",
      "\x1ethird\x1fsecond\nR100\tdocs/pages/blocks/agent-trace-01/page.tsx\tdocs/pages/pages/agent-trace-01/page.tsx",
    ].join("\n");
    expect(parseCommitArtifactAdditions(history)).toEqual({ first: ["cost-estimate-01", "agent-trace-01", "workflow"] });
  });

  it("reads additions from real Git history independently of commit messages", () => {
    const cwd = fs.mkdtempSync(path.join(tmpdir(), "zeron-artifact-history-"));
    const git = (...args: string[]) => execFileSync("git", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const save = () => git("-c", "user.name=Test", "-c", "user.email=test@example.test", "commit", "--allow-empty", "-m", "General changes");
    try {
      git("init", "-b", "main"); save();
      const file = path.join(cwd, "docs/pages/blocks/cost-estimate-01/page.tsx");
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, "new page\n"); git("add", "."); save();
      const introduction = git("rev-parse", "HEAD").trim();
      fs.writeFileSync(file, "updated page\n"); git("add", "."); save();
      expect(readCommitArtifactAdditions(cwd)).toEqual({ [introduction]: ["cost-estimate-01"] });
      expect(readCommitArtifactAdditions(path.join(cwd, "missing"))).toEqual({});
    } finally {
      fs.rmSync(cwd, { recursive: true, force: true });
    }
  });

  it("resolves current block/page destinations and excludes removed or unknown artifacts", () => {
    const ordinary = commit("other");
    const result = withCommitArtifacts([commit("new"), ordinary], { new: ["cost-estimate-01", "agent-trace-01", "workflow", "removed-01"] });
    expect(result[0].artifacts).toEqual([
      expect.objectContaining({ slug: "cost-estimate-01", collection: "blocks", href: "/docs/blocks/cost-estimate-01" }),
      expect.objectContaining({ slug: "agent-trace-01", collection: "pages", href: "/docs/pages/agent-trace-01" }),
      expect.objectContaining({ slug: "workflow", collection: "pages", href: "/workflow" }),
    ]);
    expect(result[1]).toBe(ordinary);
    expect(result[0].committedAt).toBe("2026-10-05T17:19:55Z");
  });

  it("uses the build snapshot when the deployment has no Git checkout", () => {
    vi.stubEnv("UPDATES_ARTIFACT_ADDITIONS", JSON.stringify({ deployed: ["cost-estimate-01"] }));
    try {
      expect(withCommitArtifacts([commit("deployed")])[0].artifacts?.[0].slug).toBe("cost-estimate-01");
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
