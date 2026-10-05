/** Local development consumer: source CLI + local Registry, never published installation evidence. */
import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { lstat, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createInstallationOutput } from "./check-published-installation-input.mjs";
import { assertConsumerManager, consumerEnvironment, fileInventory, fixtureManagers, materializeConsumer, runConsumerCommand } from "./published-consumer-runtime.mjs";
import { readOwnedFile, serialize, sha256, sourceProvenance } from "./agent-utils.mjs";
import { adaptExampleImports, assertExampleSourcesUnchanged, exampleHostEntry, exampleSourceDirectory, exampleSourcesSha256, readExampleSourceManifest } from "./agent-example-sources.mjs";
import { examplePreviewInvocation, startExamplePreview } from "./agent-example-preview.mjs";
import { runExampleBrowserChecks } from "./agent-example-browser.mjs";

const root = fileURLToPath(new URL("..", import.meta.url));
export function parseExampleArgs(args) {
  const options = { framework: "vite", packageManager: "pnpm", serve: false, port: 4187 };
  const seen = new Set();
  for (let index = 0; index < args.length; index++) {
    const flag = args[index];
    if (seen.has(flag)) throw new Error("Duplicate example option");
    seen.add(flag);
    if (flag === "--serve") options.serve = true;
    else if (flag === "--check-browser") options.checkBrowser = true;
    else {
      if (!["--framework", "--package-manager", "--output", "--port"].includes(flag) || !args[index + 1] || args[index + 1].startsWith("--")) throw new Error("Invalid example arguments");
      const value = args[++index];
      if (flag === "--framework") options.framework = value;
      if (flag === "--package-manager") options.packageManager = value;
      if (flag === "--output") options.output = path.resolve(value);
      if (flag === "--port") options.port = /^\d+$/.test(value) ? Number(value) : NaN;
    }
  }
  if ((options.serve && options.checkBrowser) || !options.output || !["next", "vite"].includes(options.framework) || !Object.hasOwn(fixtureManagers, options.packageManager)
    || !Number.isInteger(options.port) || options.port < 1024 || options.port > 65535) throw new Error("Use --output <new-isolated-dir>, --framework next|vite and --package-manager npm|pnpm");
  return options;
}

export async function materializeExamples(consumer, framework, { manifest, sourceRoot = root, schemas } = {}) {
  if (!["next", "vite"].includes(framework)) throw new Error("Invalid example framework");
  manifest ??= await readExampleSourceManifest({ root: sourceRoot, schemas });
  await assertExampleSourcesUnchanged(manifest, { root: sourceRoot, schemas });
  const source = path.join(sourceRoot, exampleSourceDirectory);
  const files = [];
  for (const file of manifest.files) {
    const targetPath = `examples/${file.path}`;
    const target = path.join(consumer, targetPath);
    const bytes = await readOwnedFile(source, file.path);
    if (bytes.length !== file.bytes || sha256(bytes) !== file.sha256) throw Object.assign(new Error("Example sources changed during materialization"), { code: "SOURCE_CHANGED" });
    const mapped = /\.(ts|tsx)$/.test(file.path) ? adaptExampleImports(bytes, file.path, framework) : bytes;
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, mapped, { flag: "wx" });
    files.push({ sourcePath: file.path, path: targetPath, bytes: mapped.length, sha256: sha256(mapped) });
  }
  const entry = exampleHostEntry(manifest, framework);
  await writeFile(path.join(consumer, entry.path), entry.content);
  await assertExampleSourcesUnchanged(manifest, { root: sourceRoot, schemas });
  return { files, entry: { path: entry.path, bytes: entry.content.length, sha256: sha256(entry.content) } };
}

export async function verifyMaterializedExamples(consumer, materialized) {
  const directory = await lstat(path.join(consumer, "examples"));
  if (!directory.isDirectory() || directory.isSymbolicLink()) throw Object.assign(new Error("Materialized example directory is not owned"), { code: "MATERIALIZED_DIRECTORY_CHANGED" });
  const actual = await fileInventory(path.join(consumer, "examples"), { exclude: [] });
  const expected = materialized.files.map(file => ({ path: file.sourcePath, bytes: file.bytes, sha256: file.sha256 }));
  if (serialize(actual.sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0)) !== serialize(expected)) throw Object.assign(new Error("Materialized examples changed during execution"), { code: "MATERIALIZED_SOURCE_CHANGED" });
  const entry = await readOwnedFile(consumer, materialized.entry.path);
  if (entry.length !== materialized.entry.bytes || sha256(entry) !== materialized.entry.sha256) throw Object.assign(new Error("Consumer example entry changed during execution"), { code: "MATERIALIZED_ENTRY_CHANGED" });
}

async function registryServer() {
  let origin;
  const server = createServer(async (request, response) => {
    const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
    if (!/^\/r\/[a-z0-9-]+\.json$/.test(pathname)) return void response.writeHead(404).end();
    try {
      const bytes = await readOwnedFile(root, `public${pathname}`);
      const text = bytes.toString("utf8").replaceAll("https://zeron-ui.vercel.app/r", `${origin}/r`);
      response.writeHead(200, { "content-type": "application/json" }).end(text);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  origin = `http://127.0.0.1:${server.address().port}`;
  return { server, baseUrl: `${origin}/r` };
}

export async function prepareExamples(options) {
  if (Number(process.versions.node.split(".")[0]) !== 22) throw new Error("Node 22 is required");
  await createInstallationOutput(options.output);
  const consumer = path.join(options.output, "consumer");
  const env = await consumerEnvironment(path.join(options.output, "environment"));
  const logs = path.join(options.output, "logs");
  await mkdir(logs);
  let source, exampleSources;
  let local;
  const steps = [];
  const commandTimeouts = { bootstrap: 600000, other: 300000 };
  const run = async (file, args, step) => {
    console.log(`Example consumer: ${options.framework} × ${options.packageManager}; ${step}`);
    let completed;
    let result;
    const timeoutMs = step === "bootstrap" ? commandTimeouts.bootstrap : commandTimeouts.other;
    try { result = await runConsumerCommand(file, args, { cwd: consumer, env, step, timeoutMs, log: record => { completed = { stdout: record.stdout, stderr: record.stderr, exitCode: record.exitCode }; } }); }
    catch (error) {
      await writeFile(path.join(logs, `${step}.json`), serialize({ ...(completed ?? { exitCode: null, stdout: "", stderr: "" }), timeoutMs, code: error.code ?? "COMMAND_FAILED" }), { flag: "wx" });
      throw error;
    }
    await writeFile(path.join(logs, `${step}.json`), serialize({ ...result, timeoutMs }), { flag: "wx" });
    if (result.exitCode !== 0) throw Object.assign(new Error(`Example ${step} failed`), { step });
    steps.push(step); return result;
  };
  try {
    source = await sourceProvenance(root);
    exampleSources = await readExampleSourceManifest();
    if (exampleSources.declarations.examples.some(example => !example.profiles.some(profile => profile.framework === options.framework && profile.packageManager === options.packageManager))) throw Object.assign(new Error("The consumer profile is not declared for every hosted example"), { code: "SOURCE_PROFILE_UNDECLARED" });
    const registryFiles = await fileInventory(path.join(root, "public/r"), { exclude: [] });
    const cliFiles = await fileInventory(path.join(root, "packages/cli/src"), { exclude: [] });
    const templateSha256 = await materializeConsumer(options.framework, options.packageManager, consumer);
    const version = await run(options.packageManager, ["--version"], "manager-version");
    if (version.stdout.trim() !== fixtureManagers[options.packageManager]) throw new Error("Example package manager differs from the pinned template");
    const initialLockfile = await assertConsumerManager(consumer, options.packageManager);
    await run(options.packageManager, options.packageManager === "npm" ? ["ci", "--ignore-scripts"] : ["install", "--frozen-lockfile", "--ignore-scripts"], "bootstrap");
    if (serialize(initialLockfile) !== serialize(await assertConsumerManager(consumer, options.packageManager))) throw Object.assign(new Error("Example bootstrap changed the pinned lockfile"), { code: "BOOTSTRAP_LOCKFILE_CHANGED" });
    await assertExampleSourcesUnchanged(exampleSources);
    local = await registryServer();
    const businessBefore = await readFile(path.join(consumer, "business.ts"));
    const before = await fileInventory(consumer);
    const args = [path.join(root, "packages/cli/src/index.js"), "add", ...exampleSources.hostRegistryItems.map(item => item.registryName), "--cwd", consumer, "--registry", local.baseUrl, "--yes"];
    await run(process.execPath, [...args, "--dry-run"], "dry-run");
    if (serialize(before) !== serialize(await fileInventory(consumer))) throw new Error("Example dry run changed consumer files");
    await run(process.execPath, args, "install");
    await assertConsumerManager(consumer, options.packageManager);
    if (!(await readFile(path.join(consumer, "business.ts"))).equals(businessBefore)) throw new Error("Example install rewrote unrelated business files");
    const examples = await materializeExamples(consumer, options.framework, { manifest: exampleSources });
    await run(options.packageManager, ["run", "types"], "types");
    await run(options.packageManager, ["run", "build"], "build");
    await verifyMaterializedExamples(consumer, examples);
    await assertExampleSourcesUnchanged(exampleSources);
    if (serialize(registryFiles) !== serialize(await fileInventory(path.join(root, "public/r"), { exclude: [] }))
      || serialize(cliFiles) !== serialize(await fileInventory(path.join(root, "packages/cli/src"), { exclude: [] }))) throw new Error("Registry or source CLI changed during example execution");
    const css = await readFile(path.join(consumer, options.framework === "next" ? "app/globals.css" : "src/index.css"), "utf8");
    if ((css.match(/@import\s+["']tw-animate-css["'];/g) ?? []).length !== 1) throw new Error("Example theme import is missing or duplicated");
    if (serialize(source) !== serialize(await sourceProvenance(root))) throw Object.assign(new Error("Source checkout changed during example execution"), { code: "SOURCE_CHECKOUT_CHANGED" });
    const consumerInventory = await fileInventory(consumer);
    const finalLockfile = await assertConsumerManager(consumer, options.packageManager, consumerInventory);
    const report = { schemaVersion: 1, kind: "agent-examples-local-consumer", mode: "development", status: "passed", source,
      framework: options.framework, frameworkVersion: JSON.parse(await readFile(path.join(consumer, "node_modules", options.framework === "next" ? "next" : "vite", "package.json"), "utf8")).version,
      packageManager: options.packageManager, packageManagerVersion: version.stdout.trim(), nodeVersion: process.versions.node, templateSha256,
      initialLockfile, finalLockfile,
      exampleIds: exampleSources.declarations.examples.map(example => example.exampleId), examples, adoptedItems: exampleSources.hostAdoptedItems,
      exampleSources, exampleSourcesSha256: exampleSourcesSha256(exampleSources),
      registryFiles, cli: { kind: "workspace-source-not-published", files: cliFiles }, steps, commandTimeouts,
      consumerInventory, installedState: JSON.parse(await readFile(path.join(consumer, ".zeron/install-state.json"), "utf8")),
      behaviorEvidence: null, browserEvidence: null, publishedInstallation: false };
    await writeFile(path.join(options.output, "local-verification.json"), serialize(report), { flag: "wx" });
    return { consumer, env, report };
  } catch (error) {
    await writeFile(path.join(options.output, "failure.json"), serialize({ schemaVersion: 1, kind: "agent-examples-local-failure", status: "failed", code: error.code ?? "EXAMPLE_VERIFICATION_FAILED", step: error.step ?? "verification", steps,
      source: source ?? null, exampleSourcesSha256: exampleSources ? exampleSourcesSha256(exampleSources) : null }), { flag: "wx" });
    throw error;
  } finally { if (local) await new Promise(resolve => local.server.close(resolve)); }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const options = parseExampleArgs(process.argv.slice(2));
  const { consumer, env, report } = await prepareExamples(options);
  console.log(`Local examples built: ${consumer}`);
  if (options.checkBrowser) {
    const preview = await startExamplePreview(consumer, options, env, path.join(options.output, "browser-preview.log.json"));
    try {
      const browser = await runExampleBrowserChecks(preview.origin, report.exampleSources.declarations, path.join(options.output, "browser"));
      preview.assertAlive();
      await writeFile(path.join(options.output, "local-browser-verification.json"), serialize({ schemaVersion: 1, status: "passed", scope: "local-consumer-not-published-installation-or-independent-agent-evaluation",
        framework: options.framework, packageManager: options.packageManager, exampleSourcesSha256: report.exampleSourcesSha256,
        localVerificationSha256: sha256(await readFile(path.join(options.output, "local-verification.json"))), browser }), { flag: "wx" });
      console.log(`Local browser checks passed: ${options.output}`);
    } finally { await preview.stop(); }
  }
  if (options.serve) {
    const invocation = examplePreviewInvocation(options, options.port);
    const child = spawn(invocation.file, invocation.args, { cwd: consumer, env, stdio: "inherit" });
    const stop = () => child.kill("SIGTERM");
    process.once("SIGINT", stop); process.once("SIGTERM", stop);
    await new Promise((resolve, reject) => { child.once("error", reject); child.once("close", code => code ? reject(new Error("Example server failed")) : resolve()); });
  }
}
