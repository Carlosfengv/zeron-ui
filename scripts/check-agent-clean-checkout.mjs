import { execFileSync, spawn } from "node:child_process";
import { createWriteStream } from "node:fs";
import { access, chmod, cp, mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readOwnedFile, serialize, sha256 } from "./agent-utils.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
const args = process.argv.slice(2);
if (args.some((arg) => !["--core", "--keep"].includes(arg))) throw new Error("Usage: check-agent-clean-checkout.mjs [--core] [--keep]");
const directory = await mkdtemp(path.join(tmpdir(), "zeron-agent-clean-"));
const checkout = path.join(directory, "checkout");
const runId = path.basename(directory);
const output = path.join(root, "output/agent-clean", runId);
await mkdir(output, { recursive: true });
const git = (cwd, parameters) => execFileSync("git", parameters, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const report = { schemaVersion: 1, method: "fresh-clone-with-working-tree-overlay", scope: args.includes("--core") ? "core" : "full-ci", status: "running",
  node: process.version, baseRevision: git(root, ["rev-parse", "HEAD"]).trim(), checkout, inputSha256: null, catalogVersion: null, checks: [] };
const absent = ["node_modules", ".next", "public/skills", "public/ai", "docs/generated/agent-runtime", "output", "packages/registry/registry.composed.json"];
async function verifyAbsent() {
  for (const relative of absent) {
    try { await access(path.join(checkout, relative)); }
    catch (error) { if (error.code === "ENOENT") continue; throw error; }
    throw new Error(`Generated/cache input exists in the fresh checkout: ${relative}`);
  }
}
async function run(name, parameters, timeout = 600000) {
  const filename = `${String(report.checks.length + 1).padStart(2, "0")}-${name}.log`;
  const check = { name, command: ["pnpm", ...parameters], status: "running", exitCode: null, durationMs: null, log: filename };
  report.checks.push(check);
  await writeFile(path.join(output, "report.json"), serialize(report));
  const started = Date.now();
  const log = createWriteStream(path.join(output, filename));
  console.log(`[clean-checkout] ${name}: running`);
  const code = await new Promise((resolve, reject) => {
    const child = spawn("pnpm", parameters, { cwd: checkout,
      env: { ...process.env, PATH: `${path.dirname(process.execPath)}${path.delimiter}${process.env.PATH ?? ""}`, NEXT_TELEMETRY_DISABLED: "1" },
      stdio: ["ignore", "pipe", "pipe"], timeout });
    child.stdout.on("data", (data) => log.write(data));
    child.stderr.on("data", (data) => log.write(data));
    child.on("error", reject);
    child.on("close", (exitCode) => resolve(exitCode));
  }).finally(() => new Promise((resolve) => log.end(resolve)));
  check.exitCode = code;
  check.durationMs = Date.now() - started;
  check.status = code === 0 ? "passed" : "failed";
  await writeFile(path.join(output, "report.json"), serialize(report));
  console.log(`[clean-checkout] ${name}: ${check.status}`);
  if (code !== 0) throw new Error(`Clean checkout check failed: ${name}; inspect ${path.join(output, filename)}`);
}
try {
  // Clone repository history but never copy dependencies, ignored outputs or credentials.
  git(root, ["clone", "--quiet", "--no-hardlinks", root, checkout]);
  await verifyAbsent();
  const sourcePaths = [...new Set(git(root, ["ls-files", "--cached", "--others", "--exclude-standard", "-z"]).split("\0").filter(Boolean))].sort();
  const inputs = [];
  for (const relative of sourcePaths) {
    const target = path.resolve(checkout, relative);
    if (path.relative(checkout, target).startsWith("..")) throw new Error(`Invalid tracked source path: ${relative}`);
    const basename = path.basename(relative);
    if (basename === ".npmrc" || (basename.startsWith(".env") && !basename.endsWith(".example"))) {
      await rm(target, { force: true });
      continue;
    }
    let bytes;
    try { bytes = await readOwnedFile(root, relative); }
    catch (error) { if (error.code === "ENOENT") { await rm(target, { force: true }); continue; } throw error; }
    await mkdir(path.dirname(target), { recursive: true });
    // Replace a cloned file/symlink rather than writing through a source link.
    await rm(target, { force: true });
    await writeFile(target, bytes);
    await chmod(target, (await stat(path.join(root, relative))).mode & 0o777);
    inputs.push({ path: relative, bytes: bytes.length, sha256: sha256(bytes) });
  }
  await verifyAbsent();
  report.inputSha256 = sha256(serialize(inputs));
  report.sourceFiles = inputs.length;
  report.cleanInputs = absent;
  // The index is only a baseline for generated-file drift, not a release commit.
  git(checkout, ["add", "--all"]);
  await writeFile(path.join(output, "inputs.json"), serialize(inputs));
  await run("install", ["install", "--frozen-lockfile"]);
  await run("tokens", ["tokens:check"]);
  await run("routes", ["docs:routes:check"]);
  await run("preview-sources", ["docs:sources:check"]);
  await run("guides", ["agents:guides:check"]);
  await run("code-engine", ["code-engine:build"]);
  await run("guide-examples", ["agents:guides:examples:check"]);
  await run("skill-bundle", ["skills:bundle"]);
  await run("skills", ["skills:build"]);
  await run("skill-candidate", ["skills:release:check"]);
  await run("ui-types", ["--filter", "@zeron/ui", "typecheck"]);
  await run("block-types", ["--filter", "@zeron/blocks", "typecheck"]);
  await run("registry-build", ["registry:build"]);
  git(checkout, ["diff", "--exit-code", "--", "public/r"]);
  if (git(checkout, ["ls-files", "--others", "--exclude-standard", "public/r"]).trim()) throw new Error("Registry build produced unregistered files");
  await run("registry-check", ["registry:check"]);
  await run("registry-candidate", ["registry:release:check"]);
  await run("agent-check", ["agents:check"]);
  await run("agent-build", ["agents:build", "--mode", "development"]);
  await run("agent-evaluation", ["agents:evaluate"]);
  report.catalogVersion = JSON.parse(await readFile(path.join(checkout, "docs/generated/agent-runtime/current.json"), "utf8")).catalog.catalogVersion;
  await run("lint", ["lint"]);
  await run("design-lint", ["lint:design"]);
  await run("types", ["exec", "tsc", "--noEmit", "--incremental", "false"]);
  await run("unit", ["test:unit"]);
  await run("cli", ["cli:test"]);
  if (!args.includes("--core")) {
    await run("consumer", ["test:consumer:smoke"], 1800000);
    await run("browser", ["exec", "playwright", "install", "chromium"]);
    await run("migration", ["test:consumer:migrations"], 1800000);
  }
  await run("build", ["build"]);
  await run("production", ["test:production"]);
  if (!args.includes("--core")) {
    await run("navigation", ["exec", "playwright", "test", "--config", "playwright.navigation-loading.config.ts"]);
  }
  report.status = "passed";
} catch (error) {
  report.status = "failed";
  report.failure = error.message;
  process.exitCode = 1;
} finally {
  const evidence = path.join(checkout, "output/swap-validation");
  try { await cp(evidence, path.join(output, "migration-evidence"), { recursive: true }); }
  catch (error) { if (error.code !== "ENOENT") { report.status = "failed"; report.failure = error.message; process.exitCode = 1; } }
  const searchEvidence = path.join(checkout, "output/agent-access/search-evaluation.json");
  try { await cp(searchEvidence, path.join(output, "search-evaluation.json")); }
  catch (error) { if (error.code !== "ENOENT") { report.status = "failed"; report.failure = error.message; process.exitCode = 1; } }
  const guideEvidence = path.join(checkout, "output/agent-access/guide-examples.json");
  try { await cp(guideEvidence, path.join(output, "guide-examples.json")); }
  catch (error) { if (error.code !== "ENOENT") { report.status = "failed"; report.failure = error.message; process.exitCode = 1; } }
  const registryEvidence = path.join(checkout, "output/agent-access/registry-candidate.json");
  try { await cp(registryEvidence, path.join(output, "registry-candidate.json")); }
  catch (error) { if (error.code !== "ENOENT") { report.status = "failed"; report.failure = error.message; process.exitCode = 1; } }
  const skillEvidence = path.join(checkout, "output/agent-access/skill-candidate.json");
  try { await cp(skillEvidence, path.join(output, "skill-candidate.json")); }
  catch (error) { if (error.code !== "ENOENT") { report.status = "failed"; report.failure = error.message; process.exitCode = 1; } }
  for (const name of ["skill-candidate-artifacts.json", "skill-candidate-manifest.json", "registry-candidate-manifest.json", "skill-publication-plan.json", "registry-publication-plan.json"]) {
    try { await cp(path.join(checkout, "output/agent-access", name), path.join(output, name)); }
    catch (error) { if (error.code !== "ENOENT") { report.status = "failed"; report.failure = error.message; process.exitCode = 1; } }
  }
  if (report.status === "passed" && !args.includes("--keep")) {
    await rm(directory, { recursive: true, force: true });
    report.checkout = null;
  }
  await writeFile(path.join(output, "report.json"), serialize(report));
  console.log(`[clean-checkout] ${report.status}; evidence: ${path.join(output, "report.json")}`);
  if (report.failure) console.error(report.failure);
}
