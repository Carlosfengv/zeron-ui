import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { parseArgs } from "node:util";
import {
  DEFAULT_REGISTRY_URL,
  componentUrl,
  fetchCatalog,
  normalizeRegistryUrl,
} from "./registry.js";
import { runShadcn } from "./run-shadcn.js";
import { assertReactInstallIntent, assertReactRuntime } from "./react-compatibility.js";
import { resolveInstalledRegistryAliases } from "./resolve-registry-aliases.js";
import { assertProjectPath } from "./project-paths.js";
import { createInstallSnapshot } from "./install-snapshot.js";
import { alignInitializedAliases, buildInstallPlan, digest, readBytesIfPresent } from "./install-plan.js";
import { adaptNextStarterStyles } from "./initialize-styles.js";

const HELP = `zeron-ui

Usage:
  zeron-ui init [options]
  zeron-ui add <component...> [options]
  zeron-ui list [options]
  zeron-ui view <component...> [options]
  zeron-ui doctor [options]
  zeron-ui swap scan [--cwd <dir>] [--json]
  zeron-ui swap check --plan <file> [--cwd <dir>] [--json]

Options:
  --cwd <dir>       Target project directory. Default: current directory
  --overwrite       Replace files that already exist
  --yes             Skip confirmation prompts
  --path <dir>      Temporarily unsupported; configure components.json instead
  --dry-run         Preview add without writing files (not supported by init)
  --registry <url>  Registry base URL. Default: ${DEFAULT_REGISTRY_URL}
  --json            Emit JSON from list
  --plan <file>     Project-relative migration plan for swap check
  -h, --help        Show help
  -v, --version     Show version
`;

const ARG_OPTIONS = {
  cwd: { type: "string" },
  overwrite: { type: "boolean" },
  yes: { type: "boolean" },
  path: { type: "string" },
  "dry-run": { type: "boolean" },
  check: { type: "boolean" },
  registry: { type: "string" },
  json: { type: "boolean" },
  plan: { type: "string" },
  help: { type: "boolean", short: "h" },
  version: { type: "boolean", short: "v" },
};

export function parseCliArgs(args) {
  return parseArgs({
    args,
    allowPositionals: true,
    options: ARG_OPTIONS,
    strict: true,
  });
}

export function isSupportedNodeVersion(version = process.versions.node) {
  const [major, minor] = version.split(".").map(Number);
  return major > 20 || (major === 20 && minor >= 18);
}

async function packageVersion() {
  const value = await readFile(new URL("../package.json", import.meta.url), "utf8");
  return JSON.parse(value).version;
}

function targetCwd(value, processCwd) {
  return path.resolve(processCwd, value ?? ".");
}

function registryUrl(value, env) {
  return normalizeRegistryUrl(value ?? env.ZERON_UI_REGISTRY_URL ?? DEFAULT_REGISTRY_URL);
}

function forwardSharedOptions(values, { includePath = false } = {}) {
  const args = [];
  if (values.yes) args.push("--yes");
  if (values.overwrite) args.push("--overwrite");
  if (includePath && values.path) args.push("--path", values.path);
  return args;
}

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function dependencyVersion(dependency) {
  if (dependency.startsWith("@")) {
    const marker = dependency.indexOf("@", dependency.indexOf("/") + 1);
    return marker === -1 ? "" : dependency.slice(marker + 1);
  }
  return dependency.split("@").slice(1).join("@");
}

function major(version) {
  const match = String(version ?? "").match(/\d+/);
  return match ? Number(match[0]) : null;
}

function projectDependencies(packageJson) {
  return {
    ...(packageJson.dependencies ?? {}),
    ...(packageJson.devDependencies ?? {}),
    ...(packageJson.peerDependencies ?? {}),
  };
}

async function assertInstallCompatibility(plan, packageJson, cwd) {
  const dependencies = projectDependencies(packageJson);
  const nextItems = plan.requirements.filter((requirement) => requirement.framework === "next");
  if (nextItems.length && !dependencies.next) {
    throw new Error(`${nextItems.map((item) => item.name).join(", ")} requires Next.js; this project is not a supported Next consumer`);
  }
  const reactRequirements = plan.requirements.filter((requirement) => requirement.react);
  if (reactRequirements.length) {
    try {
      await assertReactRuntime(cwd);
      await assertReactInstallIntent(cwd, packageJson, plan);
    } catch (error) {
      throw new Error(`${error.message}. No files were written`, { cause: error });
    }
  }
  const tailwindRequirements = plan.requirements.filter((requirement) => requirement.tailwind);
  if (tailwindRequirements.length) {
    let installed;
    try {
      const require = createRequire(path.join(cwd, "package.json"));
      installed = JSON.parse(await readFile(require.resolve("tailwindcss/package.json"), "utf8")).version;
    } catch {
      throw new Error("Cannot resolve the installed Tailwind CSS version; install the project's dependencies before adding Registry items");
    }
    for (const requirement of tailwindRequirements) {
      // Published Zeron metadata uses a stable major caret range. Fail closed
      // for a custom constraint we cannot prove, rather than guessing from a
      // manifest range which may disagree with node_modules.
      const range = /^\^([1-9]\d*)\.(\d+)\.(\d+)$/.exec(requirement.tailwind);
      const version = /^(\d+)\.(\d+)\.(\d+)(?:\+.*)?$/.exec(installed);
      if (!range || !version || Number(range[1]) !== Number(version[1])
        || Number(version[2]) < Number(range[2])
        || (Number(version[2]) === Number(range[2]) && Number(version[3]) < Number(range[3]))) {
        throw new Error(`${requirement.name} requires Tailwind CSS ${requirement.tailwind}; resolved ${installed}. No files were written`);
      }
    }
  }
  for (const requirement of [...plan.requiredDependencies, ...plan.requiredDevDependencies]) {
    const marker = requirement.startsWith("@") ? requirement.indexOf("@", requirement.indexOf("/") + 1) : requirement.indexOf("@");
    const name = marker === -1 ? requirement : requirement.slice(0, marker);
    if (reactRequirements.length && ["react", "react-dom"].includes(name)) continue;
    const expectedMajor = major(dependencyVersion(requirement));
    const installedMajor = major(dependencies[name] ?? "");
    if (expectedMajor !== null && installedMajor !== null && expectedMajor !== installedMajor) {
      throw new Error(`${name} ${dependencies[name]} conflicts with Registry requirement ${requirement}; no files were written`);
    }
  }
}

async function writeInstallState(cwd, plan) {
  const stateDir = path.join(cwd, ".zeron");
  const statePath = path.join(stateDir, "install-state.json");
  await assertProjectPath(cwd, statePath);
  let current = { version: 1, installations: [] };
  try {
    current = JSON.parse(await readFile(statePath, "utf8"));
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }
  const packageVersionValue = await packageVersion();
  const record = {
    items: plan.resolvedItems,
    registryBase: plan.registryBase,
    cliVersion: packageVersionValue,
    files: plan.files.map((file) => path.relative(cwd, file.targetPath)),
    fileHashes: Object.fromEntries(await Promise.all(plan.files.map(async (file) => {
      await assertProjectPath(cwd, file.targetPath);
      return [path.relative(cwd, file.targetPath), {
        sourceHash: file.sourceHash,
        configHash: file.configHash,
        installedHash: digest(await readFile(file.targetPath)),
      }];
    }))),
    dependencies: plan.requiredDependencies,
    devDependencies: plan.requiredDevDependencies,
  };
  const installations = (current.installations ?? []).filter((entry) => entry.registryBase !== record.registryBase || entry.items.join(",") !== record.items.join(","));
  await mkdir(stateDir, { recursive: true });
  await assertProjectPath(cwd, statePath);
  await writeFile(statePath, `${JSON.stringify({ version: 1, installations: [...installations, record] }, null, 2)}\n`);
}

async function assertProject(cwd, { requireConfig = true } = {}) {
  if (!(await fileExists(path.join(cwd, "package.json")))) {
    throw new Error(`no package.json found in ${cwd}`);
  }

  if (requireConfig && !(await fileExists(path.join(cwd, "components.json")))) {
    throw new Error(
      `no components.json found in ${cwd}; run "npx zeron-ui init" first`,
    );
  }
}

export async function runCli(
  args,
  {
    processCwd = process.cwd(),
    env = process.env,
    stdout = process.stdout,
    fetchImpl = fetch,
    runShadcnImpl = runShadcn,
  } = {},
) {
  const { positionals, values } = parseCliArgs(args);
  const [command, ...names] = positionals;

  if (values.version || command === "version") {
    stdout.write(`${await packageVersion()}\n`);
    return 0;
  }

  if (values.help || command === "help" || !command) {
    stdout.write(HELP);
    return 0;
  }

  const cwd = targetCwd(values.cwd, processCwd);
  if (command === "swap") {
    if (names.length !== 1 || !["scan", "check"].includes(names[0])) throw new Error("Usage: zeron-ui swap scan | swap check --plan <file>");
    if (values.overwrite || values.yes || values.path || values["dry-run"] || values.registry || values.check || (names[0] === "scan" && values.plan)) throw new Error("swap scan/check are read-only and do not accept installation options");
    const { scanProject } = await import("./swap/scan.js");
    let result;
    let exitCode;
    if (names[0] === "scan") {
      result = await scanProject(cwd);
      exitCode = result.status === "passed" ? 0 : 2;
    } else {
      if (!values.plan) throw new Error("swap check requires --plan <project-relative file>");
      const { readProjectFile } = await import("./swap/project.js");
      const { checkMigration } = await import("./swap/check.js");
      result = await checkMigration(cwd, JSON.parse((await readProjectFile(cwd, values.plan)).toString("utf8")));
      exitCode = result.exitCode;
    }
    stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return exitCode;
  }
  if (values.plan) throw new Error("--plan is only supported by swap check");
  const baseUrl = registryUrl(values.registry, env);

  if (command === "init") {
    if (names.length > 0) throw new Error("init does not accept component names");
    if (values["dry-run"]) throw new Error("init does not support --dry-run; no files were written. Use add --dry-run after initialization to preview an install");
    await assertProject(cwd, { requireConfig: false });
    const initOptions = [];
    if (values.yes) initOptions.push("--yes", "--defaults");
    if (values.overwrite) initOptions.push("--force");
    // Bootstrap configuration only: the default shadcn style also installs
    // its own utils and radius scale, which conflict with Zeron's foundations.
    const status = await runShadcnImpl(
      ["init", "--no-base-style", "--cwd", cwd, ...initOptions],
      { cwd },
    );
    if (status !== 0) return status;
    let foundationStatus;
    try {
      await alignInitializedAliases(cwd);
      foundationStatus = await runCli(
        ["add", "surfaces", "utils", "--cwd", cwd, "--registry", baseUrl, ...forwardSharedOptions(values)],
        { processCwd, env, stdout, fetchImpl, runShadcnImpl },
      );
    } catch (error) {
      throw new Error(`${error.message}. Project configuration was initialized, but Zeron foundations were not completed. Fix the error and run "zeron-ui add surfaces utils" with the same --registry option to retry`, { cause: error });
    }
    if (foundationStatus !== 0) {
      stdout.write('Zeron initialization is incomplete. Fix the installation error and retry "zeron-ui add surfaces utils" with the same --registry option.\n');
      return foundationStatus;
    }
    try {
      await adaptNextStarterStyles(cwd);
    } catch (error) {
      throw new Error(`${error.message}. Zeron foundations were installed, but Next starter style adaptation failed. Check the configured stylesheet and update its default body colors to var(--surface-base) and var(--fg-default)`, { cause: error });
    }
    return 0;
  }

  if (command === "add") {
    if (names.length === 0) throw new Error("missing component name. Example: zeron-ui add button");
    await assertProject(cwd);
    if (values.path) {
      throw new Error("--path is temporarily unsupported; configure component targets in components.json instead");
    }
    const plan = await buildInstallPlan({
      cwd,
      names,
      baseUrl,
      overwrite: values.overwrite,
      fetchImpl,
    });
    const project = JSON.parse(await readFile(path.join(cwd, "package.json"), "utf8"));
    await assertInstallCompatibility(plan, project, cwd);
    if (plan.css?.requestedByTheme && !(await fileExists(plan.css.targetPath))) {
      throw new Error(`Theme installation needs the configured CSS file ${path.relative(cwd, plan.css.targetPath)}; no files were written`);
    }

    if (values["dry-run"]) {
      stdout.write(`${JSON.stringify({
        requestedItems: plan.requestedItems,
        resolvedItems: plan.resolvedItems,
        dependencies: plan.requiredDependencies,
        devDependencies: plan.requiredDevDependencies,
        files: plan.files.map(({ targetPath, existedBefore }) => ({ targetPath, existedBefore })),
        css: plan.css && { targetPath: plan.css.targetPath, exists: await fileExists(plan.css.targetPath), requestedByTheme: plan.css.requestedByTheme },
      }, null, 2)}\n`);
      return 0;
    }

    const snapshot = await createInstallSnapshot(plan, { overwrite: values.overwrite });
    let installerStarted = false;
    try {
      await snapshot.verify();
      // Recheck immediately before handing control to the installation engine.
      for (const target of plan.guardedPaths) await assertProjectPath(cwd, target);
      for (const { targetPath, hash } of [
        ...plan.inputHashes,
        ...plan.files.map((file) => ({ targetPath: file.targetPath, hash: file.beforeHash })),
      ]) {
        const content = await readBytesIfPresent(targetPath);
        if ((content === null ? null : digest(content)) !== hash) throw new Error(`Project file changed during preflight: ${path.relative(cwd, targetPath)}; rerun the install`);
      }
      installerStarted = true;
      const status = await runShadcnImpl(
        ["add", ...snapshot.paths, "--cwd", cwd, ...forwardSharedOptions(values, { includePath: true })],
        { cwd },
      );
      if (status === 0) {
        if (plan.requirements.some((requirement) => requirement.react)) await assertReactRuntime(cwd);
        for (const target of plan.guardedPaths) await assertProjectPath(cwd, target);
        if (digest(await readFile(path.join(cwd, "components.json"))) !== plan.configHash) throw new Error("Project configuration changed during installation; installation was not recorded");
        await resolveInstalledRegistryAliases(
          cwd,
          plan.files.filter((file) => !file.existedBefore || values.overwrite),
        );
        for (const file of plan.files.filter((file) => file.existedBefore && !values.overwrite)) {
          if (digest(await readFile(file.targetPath)) !== file.beforeHash) throw new Error(`Preserved file changed during installation: ${path.relative(cwd, file.targetPath)}; installation was not recorded`);
        }
        await writeInstallState(cwd, plan);
      }
      if (status !== 0) stdout.write("Installation failed; files and dependencies may have changed. Changes were not rolled back and installation was not recorded.\n");
      return status;
    } catch (error) {
      if (installerStarted) {
        throw new Error(`${error.message}. Files and dependencies may have changed; changes were not rolled back and installation was not recorded`, { cause: error });
      }
      throw error;
    } finally {
      await snapshot.cleanup();
    }
  }

  if (command === "view") {
    if (names.length === 0) throw new Error("missing component name. Example: zeron-ui view button");
    const urls = names.map((name) => componentUrl(name, baseUrl));
    return runShadcnImpl(["view", ...urls, "--cwd", cwd], { cwd });
  }

  if (command === "list") {
    if (names.length > 0) throw new Error("list does not accept component names");
    const catalog = await fetchCatalog(baseUrl, fetchImpl);
    if (values.json) {
      stdout.write(`${JSON.stringify(catalog.items, null, 2)}\n`);
      return 0;
    }

    for (const item of catalog.items) {
      const detail = item.title && item.title !== item.name ? ` — ${item.title}` : "";
      stdout.write(`${item.name}${detail}\n`);
    }
    return 0;
  }

  if (command === "doctor") {
    if (names.length > 0) throw new Error("doctor does not accept component names");
    const checks = [
      [`Node.js ${process.versions.node}`, isSupportedNodeVersion(), "pass"],
      ["package.json", await fileExists(path.join(cwd, "package.json")), "pass"],
      ["components.json", await fileExists(path.join(cwd, "components.json")), "pass"],
    ];

    if (await fileExists(path.join(cwd, "components.json"))) {
      try {
        const config = JSON.parse(await readFile(path.join(cwd, "components.json"), "utf8"));
        const aliases = config.aliases ?? {};
        const validAliases = ["ui", "components", "lib", "hooks"].every((name) => typeof aliases[name] === "string");
        checks.push(["components.json aliases", validAliases, validAliases ? "pass" : "fail"]);
      } catch {
        checks.push(["components.json aliases", false, "fail"]);
      }
    }

    try {
      const catalog = await fetchCatalog(baseUrl, fetchImpl);
      checks.push([`Registry (${catalog.items.length} items)`, true, "pass"]);
    } catch {
      checks.push(["Registry", false, "fail"]);
    }

    if (values.check) {
      const statePath = path.join(cwd, ".zeron", "install-state.json");
      try {
        const state = JSON.parse(await readFile(statePath, "utf8"));
        const files = state.installations?.flatMap((entry) => entry.files ?? []) ?? [];
        const missing = [];
        for (const file of files) if (!(await fileExists(path.join(cwd, file)))) missing.push(file);
        checks.push(["recorded installation files", missing.length === 0, missing.length === 0 ? "pass" : "fail"]);
        if (missing.length) stdout.write(`✗ missing: ${missing.join(", ")}\n`);
      } catch (error) {
        if (error?.code === "ENOENT") {
          checks.push(["installation record", false, "unchecked"]);
        } else {
          checks.push(["installation record", false, "fail"]);
        }
      }
    }

    for (const [label, ok, state] of checks) {
      const marker = state === "unchecked" ? "?" : ok ? "✓" : "✗";
      stdout.write(`${marker} ${label}\n`);
    }
    return checks.every(([, ok, state]) => ok && state !== "unchecked") ? 0 : 1;
  }

  throw new Error(`unknown command "${command}"`);
}

export { HELP };
