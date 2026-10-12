import { execFileSync, spawnSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parse } from "yaml";
import { changedFiles, classifyChanges, detectChanges } from "../scripts/ci-changes.mjs";
import { checkCiResults } from "../scripts/check-ci-results.mjs";

const codeJobs = ["quality", "consumers", "migrations", "e2e"];

describe("CI change scope", () => {
  it("keeps the README PR and planning prose out of the code pipeline", () => {
    expect(classifyChanges(["README.md", "README.zh-CN.md", "docs/maintaining.md", "docs/plans/nested/plan.md"]))
      .toEqual({ code: false, clean: false });
  });

  it.each(["app/page.tsx", "docs/pages/components/button.tsx", "docs/agent-guides/components/button.md",
    "docs/content/en/components/button.json", "public/r/button.json", "tests/example.test.ts",
    "new-unknown-file", "packages/ui/README.md", "docs/plans/../../runtime.md"])
  ("requires code checks for %s", filename => {
    expect(classifyChanges(["README.md", filename]).code).toBe(true);
  });

  it.each(["pnpm-lock.yaml", "package.json", "packages/ui/package.json", "packages/registry/scripts/build.mjs",
    "packages/cli/src/index.js", "packages/tokens/src/index.ts", "scripts/build-site.mjs", "next.config.ts",
    "metadata-templates/AGENTS.md", ".agents/skills/zeron-page-builder/SKILL.md",
    ".github/actions/setup-workspace/action.yml", ".github/workflows/ci.yml"])
  ("requires the clean checkout for %s", filename => {
    expect(classifyChanges([filename])).toEqual({ code: true, clean: true });
  });

  it("selects all checks when no changed paths can be established", () => {
    expect(classifyChanges([])).toEqual({ code: true, clean: true });
  });
});

describe("Git comparison for CI", () => {
  let root;
  let base;
  const git = args => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();
  const commit = () => {
    git(["add", "--all"]);
    git(["-c", "user.name=CI Test", "-c", "user.email=ci@example.invalid", "commit", "--quiet", "-m", "fixture"]);
    return git(["rev-parse", "HEAD"]);
  };
  beforeEach(async () => {
    root = await mkdtemp(path.join(tmpdir(), "zeron-ci-scope-"));
    await mkdir(path.join(root, "app"));
    await writeFile(path.join(root, "README.md"), "Initial instructions\n");
    await writeFile(path.join(root, "app/page.tsx"), "Initial page\n");
    git(["init", "--quiet", "--initial-branch=main"]);
    base = commit();
  });
  afterEach(async () => { await rm(root, { recursive: true, force: true }); });

  it("includes earlier code commits in a push ending with a README commit", async () => {
    await writeFile(path.join(root, "app/page.tsx"), "Changed page\n");
    commit();
    await writeFile(path.join(root, "README.md"), "Changed instructions\n");
    const head = commit();
    expect(changedFiles(root, "push", { before: base, after: head })).toEqual(["README.md", "app/page.tsx"]);
  });

  it("compares a PR with its merge base, excluding later changes on main", async () => {
    git(["checkout", "--quiet", "-b", "feature"]);
    await writeFile(path.join(root, "README.md"), "Feature instructions\n");
    const head = commit();
    git(["checkout", "--quiet", "main"]);
    await writeFile(path.join(root, "app/page.tsx"), "Later main page\n");
    const currentBase = commit();
    const files = changedFiles(root, "pull_request", { pull_request: { base: { sha: currentBase }, head: { sha: head } } });
    expect(files).toEqual(["README.md"]);
    expect(classifyChanges(files)).toEqual({ code: false, clean: false });
  });

  it("includes a removed code path when it is renamed into a docs-only path", async () => {
    await mkdir(path.join(root, "docs/plans"), { recursive: true });
    await rename(path.join(root, "app/page.tsx"), path.join(root, "docs/plans/page.md"));
    const head = commit();
    const files = changedFiles(root, "push", { before: base, after: head });
    expect(files).toEqual(["app/page.tsx", "docs/plans/page.md"]);
    expect(classifyChanges(files).code).toBe(true);
  });

  it("uses NUL-separated names so unusual filenames do not hide a code change", async () => {
    await writeFile(path.join(root, "app/page\nREADME.md"), "New page\n");
    const head = commit();
    expect(changedFiles(root, "push", { before: base, after: head })).toEqual(["app/page\nREADME.md"]);
  });

  it.each(["missing", "new-branch", "invalid-event", "unsupported-event"])
  ("falls back to all checks for %s", async failure => {
    const eventPath = path.join(root, "event.json");
    const event = { before: failure === "new-branch" ? "0".repeat(40) : "f".repeat(40), after: base };
    await writeFile(eventPath, failure === "invalid-event" ? "invalid" : JSON.stringify(event));
    expect(await detectChanges(root, {
      GITHUB_EVENT_NAME: failure === "unsupported-event" ? "workflow_dispatch" : "push",
      GITHUB_EVENT_PATH: eventPath,
    })).toEqual({ code: true, clean: true, count: null });
  });

  it("writes documentation-only outputs without installing dependencies", async () => {
    await writeFile(path.join(root, "README.md"), "Updated instructions\n");
    const head = commit();
    const eventPath = path.join(root, "event.json");
    const output = path.join(root, "outputs");
    const summary = path.join(root, "summary");
    await writeFile(eventPath, JSON.stringify({ before: base, after: head }));
    const result = spawnSync(process.execPath, [path.resolve("scripts/ci-changes.mjs")], { cwd: root, encoding: "utf8",
      env: { ...process.env, GITHUB_EVENT_NAME: "push", GITHUB_EVENT_PATH: eventPath, GITHUB_OUTPUT: output, GITHUB_STEP_SUMMARY: summary } });
    expect(result.status, result.stderr).toBe(0);
    expect(await readFile(output, "utf8")).toBe("code=false\nclean=false\n");
    expect(await readFile(summary, "utf8")).toContain("documentation only");
  });
});

function jobResults(code, clean) {
  return {
    changes: { result: "success", outputs: { code: String(code), clean: String(clean) } },
    ...Object.fromEntries(codeJobs.map(name => [name, { result: code ? "success" : "skipped" }])),
    "agent-clean-checkout": { result: clean ? "success" : "skipped" },
  };
}

describe("required checks summary", () => {
  it.each([[false, false], [true, false], [true, true]])("accepts successful results for code=%s, clean=%s", (code, clean) => {
    expect(() => checkCiResults(jobResults(code, clean))).not.toThrow();
  });

  it.each([...codeJobs, "agent-clean-checkout"])("rejects failed, cancelled, skipped, and missing required %s", name => {
    for (const result of ["failure", "cancelled", "skipped", undefined]) {
      const jobs = jobResults(true, true);
      jobs[name] = result ? { result } : undefined;
      expect(() => checkCiResults(jobs)).toThrow(name);
    }
  });

  it("rejects failed classification, absent outputs, and contradictory outputs", () => {
    const jobs = jobResults(false, false);
    for (const changes of [undefined, { result: "failure" }, { result: "success" },
      { result: "success", outputs: { code: "", clean: "false" } },
      { result: "success", outputs: { code: "false", clean: "true" } }]) {
      expect(() => checkCiResults({ ...jobs, changes })).toThrow();
    }
  });
});

describe("CI job wiring", () => {
  it("always runs the existing required check and aggregates every scoped job", async () => {
    const ci = parse(await readFile(".github/workflows/ci.yml", "utf8"));
    expect(ci.on.pull_request).toBeNull();
    expect(ci.on.push).toEqual({ branches: ["main"] });
    expect(ci.jobs.checks.if).toBe("always()");
    expect(new Set(ci.jobs.checks.needs)).toEqual(new Set(Object.keys(ci.jobs).filter(name => name !== "checks")));
    for (const name of codeJobs) {
      expect(ci.jobs[name].needs).toBe("changes");
      expect(ci.jobs[name].if).toBe("needs.changes.outputs.code == 'true'");
    }
    expect(ci.jobs["agent-clean-checkout"].if).toBe("needs.changes.outputs.clean == 'true'");
    expect(ci.concurrency["cancel-in-progress"]).toBe("${{ github.event_name == 'pull_request' }}");
    const gate = ci.jobs.checks.steps.at(-1);
    expect(gate.env.CI_JOB_RESULTS).toBe("${{ toJSON(needs) }}");
    expect(gate.run).toBe("node scripts/check-ci-results.mjs");
  });

  it("keeps all three consumer combinations, style checks, and distinct evidence", async () => {
    const ci = parse(await readFile(".github/workflows/ci.yml", "utf8"));
    const job = ci.jobs.consumers;
    expect(job.strategy["fail-fast"]).toBe(false);
    expect(job.strategy.matrix.include).toEqual([
      { group: "next-npm", "next-managers": "npm", "vite-managers": "" },
      { group: "next-pnpm", "next-managers": "pnpm", "vite-managers": "" },
      { group: "vite-npm", "next-managers": "", "vite-managers": "npm" },
    ]);
    expect(job.env.ZERON_CONSUMER_PACKAGE_MANAGERS).toBe("${{ matrix.next-managers }}");
    expect(job.env.ZERON_VITE_CONSUMER_PACKAGE_MANAGERS).toBe("${{ matrix.vite-managers }}");
    expect(job.steps.some(step => step.run === "pnpm test:consumer:smoke")).toBe(true);
    expect(job.steps.some(step => step.run === "pnpm test:consumer:styles")).toBe(true);
    expect(job.steps.at(-1).with.name).toBe("consumer-style-evidence-${{ matrix.group }}");
  });

  it("rejects an empty consumer matrix before starting installations", () => {
    const result = spawnSync(process.execPath, ["scripts/test-consumer-installs.mjs"], { encoding: "utf8",
      env: { ...process.env, ZERON_CONSUMER_PACKAGE_MANAGERS: "", ZERON_VITE_CONSUMER_PACKAGE_MANAGERS: "" } });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Consumer matrix must select at least one installation target");
  });

  it("retains the complete nightly/manual clean check and caches only Next incremental inputs", async () => {
    const ci = parse(await readFile(".github/workflows/ci.yml", "utf8"));
    const extended = parse(await readFile(".github/workflows/e2e-extended.yml", "utf8"));
    expect(extended.on).toEqual({ workflow_dispatch: null, schedule: [{ cron: "0 18 * * *" }] });
    expect(extended.jobs["agent-clean-checkout"].if).toBeUndefined();
    expect(extended.jobs["agent-clean-checkout"].steps.some(step => step.run === "pnpm agents:verify:clean")).toBe(true);
    for (const job of [ci.jobs.e2e, extended.jobs.browsers]) {
      const cache = job.steps.find(step => step.uses === "actions/cache@v4");
      expect(cache.with.path).toBe(".next/cache");
      expect(cache.with.key).toContain("hashFiles('pnpm-lock.yaml')");
    }
  });
});
