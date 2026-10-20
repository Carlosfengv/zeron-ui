import { execFileSync, spawn } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { readOwnedFile, serialize, sha256 } from "./agent-utils.mjs";

const repositoryRoot = fileURLToPath(new URL("..", import.meta.url));
const receiptPath = ".next/e2e-build.json";
// These non-secret inputs also affect the build's public version and routes.
const buildEnvironmentKeys = new Set([
  "AGENT_CATALOG_MODE", "AGENT_RELEASE_RECORD", "GITHUB_SHA",
  "VERCEL_GIT_COMMIT_SHA", "VERCEL_GIT_COMMIT_MESSAGE",
  "BUILD_COMMIT_MESSAGE", "BUILD_COMMIT_TIMESTAMP",
  "VERCEL_GIT_REPO_OWNER", "VERCEL_GIT_REPO_SLUG",
  "SITE_BASE_URL", "MCP_ALLOWED_ORIGINS",
]);
const suites = [
  { name: "documentation", config: "playwright.config.ts" },
  { name: "navigation", config: "playwright.navigation-loading.config.ts" },
  { name: "focus", config: "playwright.focus.config.ts" },
  { name: "code-block", config: "playwright.code-block.config.ts" },
  { name: "detail", config: "playwright.detail-loading.config.ts" },
  { name: "grouped-table", config: "playwright.grouped-data-table.config.ts" },
];

export function parseE2eArgs(args) {
  const options = { mode: "pr", build: false, buildOnly: false };
  const seen = new Set();
  for (let index = 0; index < args.length; index++) {
    const argument = args[index];
    if (seen.has(argument)) throw new Error(`Duplicate E2E argument: ${argument}`);
    seen.add(argument);
    if (argument === "--mode") options.mode = args[++index];
    else if (argument === "--suites") options.suites = args[++index];
    else if (argument === "--build") options.build = true;
    else if (argument === "--build-only") options.buildOnly = true;
    else throw new Error(`Unknown E2E argument: ${argument}`);
  }
  if (!["pr", "full"].includes(options.mode)) throw new Error("E2E mode must be pr or full");
  if (seen.has("--suites")) selectedSuites(options.mode, options.suites ?? "");
  if (options.buildOnly && (options.build || seen.has("--mode") || seen.has("--suites"))) {
    throw new Error("Use --build-only without --mode or --build");
  }
  return options;
}

export function selectedSuites(mode, selection) {
  if (!["pr", "full"].includes(mode)) throw new Error("E2E mode must be pr or full");
  const names = selection?.split(",");
  if (selection !== undefined && (mode === "full" || !names.length ||
      names.some(name => !suites.some(suite => suite.name === name)) || new Set(names).size !== names.length)) {
    throw new Error("Select nonempty, unique known E2E suites in pr mode only");
  }
  return suites.filter(suite => !names || names.includes(suite.name)).map(suite => ({ ...suite, projects: suite.name === "code-block" && mode === "pr"
    ? ["chromium-desktop", "chromium-mobile"] : [] }));
}

function commandEnvironment(env = process.env) {
  return { ...env, PATH: `${path.dirname(process.execPath)}${path.delimiter}${env.PATH ?? ""}` };
}

function isBuildInput(filename) {
  const basename = path.basename(filename);
  if (basename === ".npmrc" || basename.endsWith(".pem") ||
      (basename.startsWith(".env") && !basename.endsWith(".example"))) return false;
  if (filename.startsWith("docs/plans/")) return false;
  return /^(app|docs|lib|packages|public|scripts|metadata-templates)\//.test(filename) ||
    filename.startsWith(".agents/skills/") ||
    /^(package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|tsconfig\.json|\.nvmrc|metadata\.config\.json)$/.test(filename) ||
    /^(middleware|instrumentation(?:-client)?)\.(ts|js)$/.test(filename) ||
    /^(?:next|postcss)\.config\./.test(filename) || /^playwright.*\.ts$/.test(filename);
}

export async function captureBuildInput(root, env = process.env) {
  const git = args => execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  const filenames = [...new Set(git(["ls-files", "--cached", "--others", "--exclude-standard", "-z"])
    .split("\0").filter(isBuildInput))].sort();
  const files = [];
  for (const filename of filenames) {
    try { files.push({ path: filename, sha256: sha256(await readOwnedFile(root, filename)) }); }
    catch (error) { if (error.code !== "ENOENT") throw error; }
  }
  const publicEnvironment = Object.fromEntries(Object.entries(env)
    .filter(([key]) => key.startsWith("NEXT_PUBLIC_") || buildEnvironmentKeys.has(key)).sort());
  return {
    sourceRevision: git(["rev-parse", "HEAD"]).trim(),
    sourceInputSha256: sha256(serialize(files)),
    lockfileSha256: sha256(await readOwnedFile(root, "pnpm-lock.yaml")),
    nodeVersion: process.version,
    pnpmVersion: execFileSync("pnpm", ["--version"], { cwd: root, env: commandEnvironment(env), encoding: "utf8" }).trim(),
    buildMode: env.AGENT_CATALOG_MODE ?? "development",
    publicEnvironmentSha256: sha256(serialize(publicEnvironment)),
  };
}

export async function verifyBuild(root, input) {
  let receipt;
  let buildId;
  try {
    receipt = JSON.parse(await readFile(path.join(root, receiptPath), "utf8"));
    buildId = (await readFile(path.join(root, ".next/BUILD_ID"), "utf8")).trim();
  } catch { throw new Error("No verified E2E build. Run pnpm test:e2e:build or pnpm test:e2e."); }
  if (receipt.schemaVersion !== 1 || !buildId || receipt.buildId !== buildId ||
      Object.entries(input).some(([key, value]) => receipt.input?.[key] !== value)) {
    throw new Error("E2E build is stale or its runtime changed. Run pnpm test:e2e:build again.");
  }
  return receipt;
}

/** Signal the process group so Next servers spawned by Playwright also stop. */
export function runProcess(command, args, { root, env, signal }) {
  const interruption = () => signal?.reason === "SIGTERM" ? "SIGTERM" : "SIGINT";
  if (signal?.aborted) return Promise.resolve({ exitCode: interruption() === "SIGTERM" ? 143 : 130, signal: interruption() });
  return new Promise(resolve => {
    const child = spawn(command, args, { cwd: root, env: commandEnvironment(env),
      stdio: ["ignore", "inherit", "inherit"], detached: process.platform !== "win32" });
    let spawnError;
    let killTimer;
    const kill = kind => {
      try {
        if (process.platform === "win32") child.kill(kind);
        else if (child.pid) process.kill(-child.pid, kind);
      } catch (error) { if (error.code !== "ESRCH") spawnError = error; }
    };
    const abort = () => {
      kill(interruption());
      killTimer = setTimeout(() => kill("SIGKILL"), 5000);
      killTimer.unref();
    };
    signal?.addEventListener("abort", abort, { once: true });
    child.on("error", error => { spawnError = error; });
    child.on("close", (code, childSignal) => {
      clearTimeout(killTimer);
      signal?.removeEventListener("abort", abort);
      // An interrupted runner may exit before one of its descendants does.
      if (signal?.aborted) kill("SIGKILL");
      resolve({ exitCode: code ?? 1, signal: childSignal, error: spawnError?.message });
    });
    if (signal?.aborted) abort();
  });
}

export async function buildForE2e(root, { run = runProcess, env = process.env, signal } = {}) {
  await rm(path.join(root, receiptPath), { force: true });
  const before = await captureBuildInput(root, env);
  const result = await run("pnpm", ["build"], { root, env, signal });
  if (signal?.aborted) throw new Error("E2E build interrupted");
  if (result.exitCode !== 0) throw new Error(`E2E build failed (${result.exitCode}): ${result.error ?? "see build output"}`);
  const after = await captureBuildInput(root, env);
  if (serialize(before) !== serialize(after)) throw new Error("Build inputs changed during the build; prepare generated inputs and rebuild.");
  const buildId = (await readFile(path.join(root, ".next/BUILD_ID"), "utf8")).trim();
  if (!buildId) throw new Error("Build produced no BUILD_ID");
  const receipt = { schemaVersion: 1, buildId, input: after, builtAt: new Date().toISOString() };
  await writeFile(path.join(root, receiptPath), serialize(receipt));
  return receipt;
}

export function evaluateReport(report, exitCode) {
  const keys = ["expected", "unexpected", "flaky", "skipped"];
  if (!report || !Array.isArray(report.suites) || !Array.isArray(report.errors) ||
      keys.some(key => !Number.isSafeInteger(report.stats?.[key]) || report.stats[key] < 0)) {
    throw new Error("Missing or invalid Playwright JSON results");
  }
  const counts = Object.fromEntries(keys.map(key => [key, report.stats[key]]));
  const executed = counts.expected + counts.unexpected + counts.flaky;
  return { counts, executed, status: exitCode === 0 && executed > 0 &&
    counts.unexpected === 0 && counts.flaky === 0 && report.errors.length === 0 ? "passed" : "failed" };
}

export async function runE2e(root, options, { run = runProcess, env = process.env, signal } = {}) {
  const base = path.join(root, "output/e2e", options.mode);
  await mkdir(base, { recursive: true });
  const directory = await mkdtemp(path.join(base, new Date().toISOString().replace(/[:.]/g, "-") + "-"));
  const summary = { schemaVersion: 1, mode: options.mode, startedAt: new Date().toISOString(),
    directory: path.relative(root, directory), status: "running", build: null,
    suites: selectedSuites(options.mode, options.suites ?? (options.mode === "pr" ? env.ZERON_E2E_SUITES : undefined))
      .map(suite => ({ ...suite, status: "not-run" })) };
  const save = async () => {
    const contents = serialize(summary);
    await writeFile(path.join(directory, "summary.json"), contents);
    await writeFile(path.join(base, "summary.json"), contents);
  };
  await save();
  try {
    if (options.build) await buildForE2e(root, { run, env, signal });
    summary.build = await verifyBuild(root, await captureBuildInput(root, env));
    for (const suite of summary.suites) {
      if (signal?.aborted) break;
      // Recheck between suites in case the user edits sources during a run.
      await verifyBuild(root, await captureBuildInput(root, env));
      const output = path.join(directory, suite.name);
      await mkdir(output, { recursive: true });
      const suiteEnv = { ...env, ZERON_E2E_PRODUCTION: "1", PLAYWRIGHT_HTML_OPEN: "never",
        PLAYWRIGHT_HTML_OUTPUT_DIR: path.join(output, "html"),
        PLAYWRIGHT_JUNIT_OUTPUT_FILE: path.join(output, "junit.xml"),
        PLAYWRIGHT_JSON_OUTPUT_FILE: path.join(output, "results.json") };
      const args = [path.join(root, "node_modules/@playwright/test/cli.js"), "test", "--config", suite.config,
        "--output", path.join(output, "results"), "--reporter=line,html,junit,json",
        ...suite.projects.map(project => `--project=${project}`)];
      suite.status = "running";
      suite.output = path.relative(root, output);
      await save();
      const started = Date.now();
      try {
        const result = await run(process.execPath, args, { root, env: suiteEnv, signal });
        suite.exitCode = result.exitCode;
        if (result.error) suite.error = result.error;
        if (signal?.aborted) suite.status = "interrupted";
        else {
          const report = JSON.parse(await readFile(path.join(output, "results.json"), "utf8"));
          Object.assign(suite, evaluateReport(report, result.exitCode));
        }
      } catch (error) { suite.status = signal?.aborted ? "interrupted" : "failed"; suite.error = error.message; }
      suite.durationMs = Date.now() - started;
      await save();
    }
    await verifyBuild(root, await captureBuildInput(root, env));
    summary.status = summary.suites.every(suite => suite.status === "passed") ? "passed" : "failed";
  } catch (error) { summary.status = "failed"; summary.error = error.message; }
  if (signal?.aborted) summary.status = "interrupted";
  summary.completedAt = new Date().toISOString();
  await save();
  return summary;
}

async function main() {
  const options = parseE2eArgs(process.argv.slice(2));
  const controller = new AbortController();
  const interrupt = signal => controller.abort(signal);
  const onInterrupt = () => interrupt("SIGINT");
  const onTerminate = () => interrupt("SIGTERM");
  process.on("SIGINT", onInterrupt);
  process.on("SIGTERM", onTerminate);
  try {
    if (options.buildOnly) {
      const receipt = await buildForE2e(repositoryRoot, { signal: controller.signal });
      console.log(`E2E build verified: ${receipt.buildId}`);
    } else {
      const summary = await runE2e(repositoryRoot, options, { signal: controller.signal });
      for (const suite of summary.suites) console.log(`[e2e] ${suite.name}: ${suite.status} ${suite.executed ?? 0} executed`);
      console.log(`E2E ${summary.status}: ${summary.directory}/summary.json`);
      if (summary.error) console.error(summary.error);
      process.exitCode = summary.status === "passed" ? 0 : 1;
    }
  } finally {
    process.off("SIGINT", onInterrupt);
    process.off("SIGTERM", onTerminate);
    if (controller.signal.aborted) process.exitCode = controller.signal.reason === "SIGTERM" ? 143 : 130;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode ||= 1; });
}
