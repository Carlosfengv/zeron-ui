import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { serialize, sha256 } from "./agent-utils.mjs";
import { ConsumerExecutionError, assertConsumerManager, cliPackageInventory, consumerEntry, consumerEnvironment,
  fileInventory, fixtureManagers, materializeConsumer, runConsumerCommand } from "./published-consumer-runtime.mjs";
import { materializeExamples, verifyMaterializedExamples } from "./agent-examples.mjs";
import { exampleRegistryClosure } from "./agent-example-evidence.mjs";

const launcher = fileURLToPath(new URL("./run-verified-published-cli.mjs", import.meta.url));
const same = (left, right) => serialize(left) === serialize(right);

export async function runLoggedConsumerCommand(file, args, options) {
  let result, recorded, failure;
  try { result = await runConsumerCommand(file, args, { ...options, log: record => { recorded = record; options.log?.(record); } }); }
  catch (error) { failure = error; throw error; }
  finally {
    if (options.logs) await writeFile(path.join(options.logs, `${options.step}.json`), serialize({
      ...(recorded ?? { step: options.step, file, args, stdout: "", stderr: "", exitCode: null }), code: failure?.code ?? null,
    }), { flag: "wx", mode: 0o600 });
  }
  if (result.exitCode !== 0 && !options.allowFailure) throw new ConsumerExecutionError("COMMAND_EXIT", options.step, result.exitCode);
  return result;
}

/** Derive the reference only from the downloaded, SRI-verified official npm tarball. */
export async function prepareVerifiedCli(npm, directory, { logs } = {}) {
  if (`sha512-${createHash("sha512").update(npm.tarball).digest("base64")}` !== npm.cli.distIntegrity) {
    throw new ConsumerExecutionError("REFERENCE_CLI_INTEGRITY", "cli-reference");
  }
  await mkdir(directory);
  const env = await consumerEnvironment(path.join(directory, "environment"));
  const version = await runLoggedConsumerCommand("npm", ["--version"], { cwd: directory, env, step: "reference-manager-version", logs });
  if (version.stdout.trim() !== fixtureManagers.npm) throw new ConsumerExecutionError("MANAGER_VERSION", "reference-manager-version");
  await writeFile(path.join(directory, "package.json"), serialize({ name: "zeron-cli-reference", private: true }), { flag: "wx" });
  const tarball = path.join(directory, "zeron-ui.tgz");
  await writeFile(tarball, npm.tarball, { flag: "wx" });
  await runLoggedConsumerCommand("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", tarball], {
    cwd: directory, env, step: "cli-reference", logs,
  });
  return { ...await cliPackageInventory(path.join(directory, "node_modules", "zeron-ui"), npm.cli.version), nodeVersion: process.versions.node };
}

export function publishedCliInvocation(packageManager, version, inventory, args) {
  if (!Object.hasOwn(fixtureManagers, packageManager) || !/^\d+\.\d+\.\d+(?:-[A-Za-z0-9.-]+)?$/.test(version)) {
    throw new ConsumerExecutionError("CLI_INVOCATION_CONFIG", "cli-launch");
  }
  const target = `--package=zeron-ui@${version}`;
  return { file: packageManager, args: packageManager === "npm"
    ? ["exec", "--yes", target, "--", "node", launcher, inventory, ...args]
    : [target, "dlx", "node", launcher, inventory, ...args] };
}

async function assertTheme(consumer, framework) {
  const css = await readFile(path.join(consumer, framework === "next" ? "app/globals.css" : "src/index.css"), "utf8");
  const metadata = JSON.parse(await readFile(path.join(consumer, "package.json"), "utf8"));
  if ((css.match(/@import\s+["']tw-animate-css["'];/g) ?? []).length !== 1
    || !css.includes("--border-width-hairline") || !css.includes("--transition-duration-fast")
    || !(metadata.dependencies?.["tw-animate-css"] ?? metadata.devDependencies?.["tw-animate-css"])) {
    throw new ConsumerExecutionError("THEME_INSTALLATION", "install");
  }
  await readFile(path.join(consumer, framework === "next" ? "lib/tailwind-merge-tokens.ts" : "src/lib/tailwind-merge-tokens.ts"));
}

async function assertCompiledTheme(consumer, framework, names) {
  if (!names.includes("button")) return;
  const directory = path.join(consumer, framework === "next" ? ".next/static/css" : "dist/assets");
  const files = await fileInventory(directory, { exclude: [], maxFiles: 1024, maxTotalBytes: 32 * 1024 * 1024 });
  const css = (await Promise.all(files.filter(file => file.path.endsWith(".css")).map(file => readFile(path.join(directory, file.path), "utf8")))).join("\n");
  for (const name of ["border-hairline", "duration-fast", "animate-in", "fade-in"]) {
    if (!css.includes(`.${name}`)) throw new ConsumerExecutionError("COMPILED_THEME_UTILITY", "build");
  }
}

/** Every returned true has passed a real subprocess or byte comparison; no result injection. */
async function runConsumer(prepared, row, reference, directory, { logs, deadline = Date.now() + 30 * 60 * 1000, exampleSources } = {}) {
  const { input } = prepared;
  const names = row.testedItems.map(id => input.items.find(item => item.id === id)?.registryName);
  const entry = exampleSources ? null : consumerEntry(row.framework, names);
  const rejectionName = input.items.find(item => item.id === input.nextOnlyRejectionItem)?.registryName;
  await mkdir(directory);
  if (logs) await mkdir(logs, { recursive: true, mode: 0o700 });
  const consumer = path.join(directory, "consumer");
  const templateSha256 = await materializeConsumer(row.framework, row.packageManager, consumer);
  const envRoot = path.join(directory, "environment");
  const env = await consumerEnvironment(envRoot);
  const run = (file, args, step, extra = {}) => {
    const remaining = deadline - Date.now();
    if (remaining <= 0) throw new ConsumerExecutionError("CONSUMER_JOB_TIMEOUT", step);
    return runLoggedConsumerCommand(file, args, { cwd: consumer, env, step, logs, ...extra, timeoutMs: Math.min(300000, remaining) });
  };
  const version = await run(row.packageManager, ["--version"], "manager-version");
  if (version.stdout.trim() !== fixtureManagers[row.packageManager]) throw new ConsumerExecutionError("MANAGER_VERSION", "manager-version");
  const lockfile = row.packageManager === "npm" ? "package-lock.json" : "pnpm-lock.yaml";
  const initialLockfileSha256 = sha256(await readFile(path.join(consumer, lockfile)));
  await run(row.packageManager, row.packageManager === "npm" ? ["ci", "--ignore-scripts"]
    : ["install", "--frozen-lockfile", "--ignore-scripts"], "bootstrap");
  if (sha256(await readFile(path.join(consumer, lockfile))) !== initialLockfileSha256) {
    throw new ConsumerExecutionError("BOOTSTRAP_LOCKFILE_CHANGED", "bootstrap");
  }
  const business = await readFile(path.join(consumer, "business.ts"));
  const inventoryFile = path.join(directory, "cli-inventory.json");
  await writeFile(inventoryFile, serialize({ ...reference, allowedRoot: envRoot }), { flag: "wx" });
  const cli = (args, step, extra) => {
    const invocation = publishedCliInvocation(row.packageManager, input.cli.version, inventoryFile, args);
    return run(invocation.file, invocation.args, step, extra);
  };
  const versionResult = await cli(["--version"], "cli-version");
  if (versionResult.stdout.trim() !== input.cli.version) throw new ConsumerExecutionError("CLI_VERSION_OUTPUT", "cli-version");
  const common = ["--registry", prepared.registry.manifest.baseUrl, "--cwd", consumer, "--yes"];
  let nextOnlyRejection = null;
  if (row.framework === "vite") {
    const before = await fileInventory(consumer);
    const result = await cli(["add", rejectionName, ...common], "next-only-rejection", { allowFailure: true });
    if (result.exitCode === 0 || !`${result.stdout}\n${result.stderr}`.includes(`${rejectionName} requires Next.js`)) {
      throw new ConsumerExecutionError("WRONG_REJECTION_REASON", "next-only-rejection", result.exitCode);
    }
    if (!same(before, await fileInventory(consumer))) throw new ConsumerExecutionError("REJECTED_INSTALL_CHANGED_FILES", "next-only-rejection");
    nextOnlyRejection = { item: input.nextOnlyRejectionItem, reason: "requires-next", unchanged: true };
  }
  const before = await fileInventory(consumer);
  await cli(["add", ...names, ...common, "--dry-run"], "dry-run");
  if (!same(before, await fileInventory(consumer))) throw new ConsumerExecutionError("DRY_RUN_CHANGED_FILES", "dry-run");
  await cli(["add", ...names, ...common], "install");
  if (!business.equals(await readFile(path.join(consumer, "business.ts")))) throw new ConsumerExecutionError("BUSINESS_SOURCE_CHANGED", "install");
  const installedFiles = await fileInventory(consumer);
  await assertConsumerManager(consumer, row.packageManager, installedFiles);
  const state = JSON.parse(await readFile(path.join(consumer, ".zeron/install-state.json"), "utf8"));
  if (!state.installations?.some(record => record.cliVersion === input.cli.version && record.registryBase === prepared.registry.manifest.baseUrl
    && same([...record.items].sort(), [...row.registryClosure].sort()))) throw new ConsumerExecutionError("INSTALLED_STATE_BINDING", "install");
  await assertTheme(consumer, row.framework);
  const examples = exampleSources ? await materializeExamples(consumer, row.framework, { manifest: exampleSources }) : null;
  if (!examples) await writeFile(path.join(consumer, row.framework === "next" ? "app/page.tsx" : "src/main.tsx"), entry);
  await run(row.packageManager, ["run", "types"], "types");
  await run(row.packageManager, ["run", "build"], "build");
  await assertCompiledTheme(consumer, row.framework, names);
  if (examples) await verifyMaterializedExamples(consumer, examples);
  const frameworkVersion = JSON.parse(await readFile(path.join(consumer, "node_modules", row.framework === "next" ? "next" : "vite", "package.json"), "utf8")).version;
  const result = { framework: row.framework, packageManager: row.packageManager, nodeVersion: process.versions.node,
    frameworkVersion, packageManagerVersion: version.stdout.trim(), testedItems: row.testedItems, registryClosure: row.registryClosure,
    checks: { dryRun: true, install: true, types: true, build: true }, passed: true };
  const evidence = { schemaVersion: 1, kind: "published-consumer-evidence", scope: "actual-official-cli-and-final-registry-installation",
    source: input.source, inputSha256: sha256(serialize(input)), cli: prepared.npm.cli,
    registry: { releaseId: input.registry.releaseId, manifest: input.registry.manifest }, matrix: result,
    templateSha256, initialLockfileSha256, finalLockfileSha256: sha256(await readFile(path.join(consumer, lockfile))),
    cliOwnFilesSha256: sha256(serialize(reference.files)), finalProjectSha256: sha256(serialize(await fileInventory(consumer))),
    businessSourcePreserved: true, themeInstalled: true, compiledTheme: true, nextOnlyRejection };
  return { result, evidence, ...(examples ? { consumer, env, examples, installedStateSha256: sha256(await readFile(path.join(consumer, ".zeron/install-state.json"))) } : {}) };
}

export function runPublishedConsumerMatrix(prepared, row, reference, directory, options) {
  const { logs, deadline } = options ?? {};
  return runConsumer(prepared, row, reference, directory, { logs, deadline });
}

/** Install the actual example host closure; representative R1 items cannot stand in for it. */
export function runPublishedExampleConsumer(prepared, profile, sourceManifest, reference, directory, options = {}) {
  if (sourceManifest.declarations.examples.some(example => !example.profiles.some(row => row.framework === profile.framework && row.packageManager === profile.packageManager))) {
    throw new ConsumerExecutionError("SOURCE_PROFILE_UNDECLARED", "example-install");
  }
  const row = { ...profile, testedItems: sourceManifest.hostAdoptedItems,
    registryClosure: exampleRegistryClosure(prepared, sourceManifest, profile.framework) };
  return runConsumer(prepared, row, reference, directory, { ...options, exampleSources: sourceManifest });
}
