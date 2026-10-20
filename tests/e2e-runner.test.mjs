import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { parse } from "yaml";
import { buildForE2e, captureBuildInput, evaluateReport, parseE2eArgs, runE2e, runProcess,
  selectedSuites, verifyBuild } from "../scripts/run-e2e.mjs";

let root;
beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), "zeron-e2e-runner-"));
  await mkdir(path.join(root, "app"));
  await writeFile(path.join(root, "app/page.tsx"), "export default function Page() { return null; }\n");
  await writeFile(path.join(root, "pnpm-lock.yaml"), "lockfileVersion: '9.0'\n");
  await writeFile(path.join(root, ".gitignore"), ".next/\noutput/\n.env*\n");
  const git = args => execFileSync("git", args, { cwd: root, stdio: "ignore" });
  git(["init", "--quiet"]);
  git(["add", "."]);
  git(["-c", "user.name=E2E Test", "-c", "user.email=e2e@example.invalid", "commit", "--quiet", "-m", "fixture"]);
});
afterEach(async () => { await rm(root, { recursive: true, force: true }); });

async function fakeBuild(_command, _args, { root: directory }) {
  await mkdir(path.join(directory, ".next"), { recursive: true });
  await writeFile(path.join(directory, ".next/BUILD_ID"), "fixture-build");
  return { exitCode: 0 };
}

function report(stats = {}) {
  return { suites: [], errors: [], stats: { expected: 1, unexpected: 0, flaky: 0, skipped: 0, ...stats } };
}

function reportsRunner(failingSuite, failure = "assertion", calls = []) {
  return async (_command, args, { env }) => {
    const config = args[args.indexOf("--config") + 1];
    calls.push({ config, args, env });
    if (config === failingSuite && failure === "missing") return { exitCode: 0 };
    const data = config !== failingSuite ? report() : failure === "skipped"
      ? report({ expected: 0, skipped: 2 }) : failure === "flaky"
        ? report({ expected: 0, flaky: 1 }) : report({ expected: 0, unexpected: 1 });
    await writeFile(env.PLAYWRIGHT_JSON_OUTPUT_FILE, JSON.stringify(data));
    return { exitCode: config === failingSuite && failure === "assertion" ? 1 : 0 };
  };
}

describe("E2E execution policy", () => {
  it("rejects ambiguous arguments and keeps other browsers out of PR selection", () => {
    expect(parseE2eArgs(["--mode", "full", "--build"])).toEqual({ mode: "full", build: true, buildOnly: false });
    for (const args of [["--mode"], ["--mode", "unknown"], ["--skip"], ["--build", "--build"],
      ["--build-only", "--build"], ["--build-only", "--mode", "pr"]]) expect(() => parseE2eArgs(args)).toThrow();
    expect(selectedSuites("pr")).toHaveLength(6);
    expect(selectedSuites("full").some(suite => suite.name === "grouped-table")).toBe(true);
    expect(selectedSuites("pr").find(suite => suite.name === "code-block").projects)
      .toEqual(["chromium-desktop", "chromium-mobile"]);
    expect(selectedSuites("full").find(suite => suite.name === "code-block").projects).toEqual([]);
  });

  it("selects only requested PR suites, rejects empty/unknown scope, and never narrows full mode", () => {
    expect(selectedSuites("pr", "documentation,grouped-table").map(suite => suite.name)).toEqual(["documentation", "grouped-table"]);
    for (const selection of ["", "unknown", "detail,detail", "detail,"]) expect(() => selectedSuites("pr", selection)).toThrow();
    expect(() => parseE2eArgs(["--suites"])).toThrow();
    expect(() => parseE2eArgs(["--build-only", "--suites", "detail"])).toThrow();
    expect(() => selectedSuites("full", "detail")).toThrow();
  });

  it("fails zero execution, flaky results, runner errors, invalid reports and nonzero exits", () => {
    expect(evaluateReport(report({ skipped: 2 }), 0).status).toBe("passed");
    for (const data of [report({ expected: 0, skipped: 2 }), report({ flaky: 1 }),
      report({ unexpected: 1 }), { ...report(), errors: [{ message: "worker crashed" }] }]) {
      expect(evaluateReport(data, 0).status).toBe("failed");
    }
    expect(evaluateReport(report(), 1).status).toBe("failed");
    for (const data of [null, {}, report({ expected: -1 }), report({ expected: 0.5 })]) {
      expect(() => evaluateReport(data, 0)).toThrow();
    }
  });

  it("binds the receipt to edited, added and deleted source inputs, lockfile and public environment", async () => {
    await buildForE2e(root, { run: fakeBuild });
    const initial = await captureBuildInput(root);
    await expect(verifyBuild(root, initial)).resolves.toMatchObject({ buildId: "fixture-build" });
    await writeFile(path.join(root, "app/new.tsx"), "new input");
    await expect(verifyBuild(root, await captureBuildInput(root))).rejects.toThrow("stale");
    await rm(path.join(root, "app/new.tsx"));
    await writeFile(path.join(root, "app/page.tsx"), "changed input");
    await expect(verifyBuild(root, await captureBuildInput(root))).rejects.toThrow("stale");
    await rm(path.join(root, "app/page.tsx"));
    await expect(verifyBuild(root, await captureBuildInput(root))).rejects.toThrow("stale");
    await writeFile(path.join(root, "app/page.tsx"), "export default function Page() { return null; }\n");
    await writeFile(path.join(root, "middleware.ts"), "changed locale routing");
    await expect(verifyBuild(root, await captureBuildInput(root))).rejects.toThrow("stale");
    await rm(path.join(root, "middleware.ts"));
    await writeFile(path.join(root, "pnpm-lock.yaml"), "changed lockfile");
    await expect(verifyBuild(root, await captureBuildInput(root))).rejects.toThrow("stale");
    await expect(verifyBuild(root, { ...initial, publicEnvironmentSha256: "changed" })).rejects.toThrow("stale");
    await expect(verifyBuild(root, { ...initial, nodeVersion: "v0" })).rejects.toThrow("stale");
    await expect(verifyBuild(root, { ...initial, buildMode: "release" })).rejects.toThrow("stale");
  }, 30000);

  it("rejects build reuse after public version or route environment changes", async () => {
    const env = { ...process.env };
    await buildForE2e(root, { run: fakeBuild, env });
    const initial = await captureBuildInput(root, env);
    for (const key of ["GITHUB_SHA", "VERCEL_GIT_COMMIT_SHA", "VERCEL_GIT_COMMIT_MESSAGE",
      "BUILD_COMMIT_MESSAGE", "BUILD_COMMIT_TIMESTAMP", "VERCEL_GIT_REPO_OWNER",
      "VERCEL_GIT_REPO_SLUG", "SITE_BASE_URL", "MCP_ALLOWED_ORIGINS"]) {
      const changed = await captureBuildInput(root, { ...env, [key]: "changed-public-build-input" });
      expect(changed.publicEnvironmentSha256, key).not.toBe(initial.publicEnvironmentSha256);
      await expect(verifyBuild(root, changed)).rejects.toThrow("stale");
    }
    const credentials = await captureBuildInput(root, { ...env, GH_TOKEN: "private-one", GITHUB_TOKEN: "private-two" });
    expect(credentials.publicEnvironmentSha256).toBe(initial.publicEnvironmentSha256);
    await expect(verifyBuild(root, credentials)).resolves.toMatchObject({ buildId: "fixture-build" });
  }, 15000);

  it("ignores private credentials and plan edits but detects symlinks escaping the checkout", async () => {
    const initial = await captureBuildInput(root);
    await writeFile(path.join(root, ".env.local"), "PRIVATE_TOKEN=must-not-be-read");
    await mkdir(path.join(root, "docs/plans"), { recursive: true });
    await writeFile(path.join(root, "docs/plans/record.md"), "implementation evidence");
    expect((await captureBuildInput(root)).sourceInputSha256).toBe(initial.sourceInputSha256);
    await symlink(path.join(tmpdir(), "outside-input"), path.join(root, "app/external.ts"));
    // A missing source is handled like a deletion; a readable external source must be rejected.
    const outside = await mkdtemp(path.join(tmpdir(), "zeron-e2e-external-"));
    try {
      await writeFile(path.join(outside, "file.ts"), "external source");
      await rm(path.join(root, "app/external.ts"));
      await symlink(path.join(outside, "file.ts"), path.join(root, "app/external.ts"));
      await expect(captureBuildInput(root)).rejects.toThrow("escapes");
    } finally { await rm(outside, { recursive: true, force: true }); }
  }, 15000);

  it("refuses missing or replaced builds and invalidates the old receipt when a new build fails", async () => {
    const input = await captureBuildInput(root);
    await expect(verifyBuild(root, input)).rejects.toThrow("No verified");
    await buildForE2e(root, { run: fakeBuild });
    await writeFile(path.join(root, ".next/BUILD_ID"), "different-build");
    await expect(verifyBuild(root, input)).rejects.toThrow("stale");
    await expect(buildForE2e(root, { run: async () => ({ exitCode: 1 }) })).rejects.toThrow("build failed");
    await expect(readFile(path.join(root, ".next/e2e-build.json"))).rejects.toMatchObject({ code: "ENOENT" });
  }, 15000);

  it("does not certify inputs modified while the build runs", async () => {
    await expect(buildForE2e(root, { run: async (...args) => {
      const result = await fakeBuild(...args);
      await writeFile(path.join(root, "app/page.tsx"), "edited during build");
      return result;
    } })).rejects.toThrow("inputs changed");
    await expect(readFile(path.join(root, ".next/e2e-build.json"))).rejects.toMatchObject({ code: "ENOENT" });
  }, 15000);

  it.each(["assertion", "missing", "skipped", "flaky"])("continues other suites after %s and preserves separate reports", async failure => {
    await buildForE2e(root, { run: fakeBuild });
    const calls = [];
    const summary = await runE2e(root, { mode: "pr", build: false }, {
      run: reportsRunner("playwright.focus.config.ts", failure, calls),
    });
    expect(summary.status).toBe("failed");
    expect(calls).toHaveLength(6);
    expect(summary.suites.map(suite => suite.status)).toEqual(["passed", "passed", "failed", "passed", "passed", "passed"]);
    expect(new Set(calls.map(call => call.env.PLAYWRIGHT_JSON_OUTPUT_FILE)).size).toBe(6);
    const code = calls.find(call => call.config === "playwright.code-block.config.ts");
    expect(code.args.filter(argument => argument.startsWith("--project=")))
      .toEqual(["--project=chromium-desktop", "--project=chromium-mobile"]);
    expect(JSON.parse(await readFile(path.join(root, summary.directory, "summary.json"), "utf8")).status).toBe("failed");
  }, 30000);

  it("runs a scoped CI selection against the verified production build", async () => {
    await buildForE2e(root, { run: fakeBuild });
    const calls = [];
    const summary = await runE2e(root, { mode: "pr", build: false }, {
      env: { ...process.env, ZERON_E2E_SUITES: "documentation,grouped-table" }, run: reportsRunner(undefined, undefined, calls),
    });
    expect(summary.status).toBe("passed");
    expect(calls.map(call => call.config)).toEqual(["playwright.config.ts", "playwright.grouped-data-table.config.ts"]);
    expect(calls.every(call => call.env.ZERON_E2E_PRODUCTION === "1")).toBe(true);
  }, 15000);

  it("builds once and preserves earlier run evidence when repeating the full mode", async () => {
    let builds = 0;
    const run = async (command, args, options) => {
      if (command === "pnpm") { builds++; return fakeBuild(command, args, options); }
      return reportsRunner()(command, args, options);
    };
    const first = await runE2e(root, { mode: "full", build: true }, { run });
    const second = await runE2e(root, { mode: "full", build: false }, { run });
    expect(builds).toBe(1);
    expect(first.status).toBe("passed"); expect(second.status).toBe("passed");
    expect(first.directory).not.toBe(second.directory);
    expect(JSON.parse(await readFile(path.join(root, first.directory, "summary.json"), "utf8")).status).toBe("passed");
    expect(JSON.parse(await readFile(path.join(root, "output/e2e/full/summary.json"), "utf8")).directory).toBe(second.directory);
  }, 30000);

  it("stops further suites on interruption and reports incomplete work", async () => {
    await buildForE2e(root, { run: fakeBuild });
    const controller = new AbortController();
    const summary = await runE2e(root, { mode: "pr", build: false }, {
      signal: controller.signal,
      run: async () => { controller.abort("SIGINT"); return { exitCode: 130 }; },
    });
    expect(summary.status).toBe("interrupted");
    expect(summary.suites.map(suite => suite.status)).toEqual(["interrupted", "not-run", "not-run", "not-run", "not-run", "not-run"]);
  }, 15000);

  it.each(["SIGINT", "SIGTERM"])("terminates a real child process and its server descendant on %s", async interruption => {
    const pidFile = path.join(root, "server.pid");
    const code = `const {spawn}=require('node:child_process');const fs=require('node:fs');
      process.on('SIGINT',()=>process.exit(0));process.on('SIGTERM',()=>process.exit(0));
      const child=spawn(process.execPath,['-e',"process.on('SIGINT',()=>{});process.on('SIGTERM',()=>{});setInterval(()=>{},1000)"],{stdio:'ignore'});
      fs.writeFileSync(process.argv[1],String(child.pid));setInterval(()=>{},1000);`;
    const controller = new AbortController();
    const pending = runProcess(process.execPath, ["-e", code, pidFile], { root, env: process.env, signal: controller.signal });
    let pid;
    try {
      for (let attempt = 0; attempt < 100; attempt++) {
        try { pid = Number(await readFile(pidFile, "utf8")); break; } catch { await new Promise(resolve => setTimeout(resolve, 10)); }
      }
      expect(pid).toBeGreaterThan(0);
      controller.abort(interruption);
      await pending;
      for (let attempt = 0; attempt < 100; attempt++) {
        try { process.kill(pid, 0); await new Promise(resolve => setTimeout(resolve, 10)); }
        catch (error) { expect(error.code).toBe("ESRCH"); return; }
      }
      throw new Error("Server descendant survived the runner interruption");
    } finally { controller.abort(); if (pid) { try { process.kill(pid, "SIGKILL"); } catch { /* Already stopped. */ } } }
  }, 15000);
});

describe("E2E workflow integration", () => {
  it("reuses the main CI build and runs every existing project in the extended workflow", async () => {
    const ci = parse(await readFile(".github/workflows/ci.yml", "utf8"));
    const extended = parse(await readFile(".github/workflows/e2e-extended.yml", "utf8"));
    const steps = ci.jobs.e2e.steps;
    expect(steps.find(step => step.id === "build").run).toBe("pnpm test:e2e:build");
    expect(steps.some(step => step.run === "pnpm test:e2e:run")).toBe(true);
    expect(steps.find(step => step.with?.name === "e2e-pr-evidence").if).toBe("always()");
    expect(extended.on.schedule).toEqual([{ cron: "0 18 * * *" }]);
    expect(extended.jobs.browsers["runs-on"]).toBe("ubuntu-24.04");
    expect(extended.jobs.browsers.steps.some(step => step.run === "pnpm test:e2e:full:run")).toBe(true);
    expect(extended.jobs.browsers.steps.some(step => step["continue-on-error"])).toBe(false);
  });
});
