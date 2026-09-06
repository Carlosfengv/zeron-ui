import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { parseArgs } from "node:util";
import {
  DEFAULT_REGISTRY_URL,
  componentUrl,
  fetchCatalog,
  normalizeRegistryUrl,
} from "./registry.js";
import { runShadcn } from "./run-shadcn.js";
import { resolveInstalledRegistryAliases } from "./resolve-registry-aliases.js";
import { buildInstallPlan } from "./install-plan.js";

const HELP = `zeron-ui

Usage:
  zeron-ui init [options]
  zeron-ui add <component...> [options]
  zeron-ui list [options]
  zeron-ui view <component...> [options]
  zeron-ui doctor [options]

Options:
  --cwd <dir>       Target project directory. Default: current directory
  --overwrite       Replace files that already exist
  --yes             Skip confirmation prompts
  --path <dir>      Temporarily unsupported; configure components.json instead
  --dry-run         Inspect resolved items without writing files
  --registry <url>  Registry base URL. Default: ${DEFAULT_REGISTRY_URL}
  --json            Emit JSON from list
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
  const match = version.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function projectDependencies(packageJson) {
  return {
    ...(packageJson.dependencies ?? {}),
    ...(packageJson.devDependencies ?? {}),
    ...(packageJson.peerDependencies ?? {}),
  };
}

function assertInstallCompatibility(plan, packageJson) {
  const dependencies = projectDependencies(packageJson);
  const nextItems = plan.requirements.filter((requirement) => requirement.framework === "next");
  if (nextItems.length && !dependencies.next) {
    throw new Error(`${nextItems.map((item) => item.name).join(", ")} requires Next.js; this project is not a supported Next consumer`);
  }
  const reactRequirements = plan.requirements.filter((requirement) => requirement.react);
  if (reactRequirements.length && major(dependencies.react) !== 19) {
    throw new Error(`Zeron Registry items require React 19; found ${dependencies.react ?? "no react dependency"}`);
  }
  for (const requirement of plan.requiredDependencies) {
    const name = requirement.startsWith("@")
      ? requirement.slice(0, requirement.indexOf("@", requirement.indexOf("/") + 1))
      : requirement.split("@")[0];
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
    dependencies: plan.requiredDependencies,
  };
  const installations = (current.installations ?? []).filter((entry) => entry.registryBase !== record.registryBase || entry.items.join(",") !== record.items.join(","));
  await mkdir(stateDir, { recursive: true });
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
  const baseUrl = registryUrl(values.registry, env);

  if (command === "init") {
    if (names.length > 0) throw new Error("init does not accept component names");
    await assertProject(cwd, { requireConfig: false });
    const initOptions = [];
    if (values.yes) initOptions.push("--yes");
    if (values.overwrite) initOptions.push("--force");
    return runShadcnImpl(
      ["init", "--cwd", cwd, ...initOptions],
      { cwd },
    );
  }

  if (command === "add") {
    if (names.length === 0) throw new Error("missing component name. Example: zeron-ui add button");
    await assertProject(cwd);
    if (values.path) {
      throw new Error("--path is temporarily unsupported; configure component targets in components.json instead");
    }
    const urls = names.map((name) => componentUrl(name, baseUrl));
    const plan = await buildInstallPlan({
      cwd,
      names,
      baseUrl,
      overwrite: values.overwrite,
      fetchImpl,
    });
    const project = JSON.parse(await readFile(path.join(cwd, "package.json"), "utf8"));
    assertInstallCompatibility(plan, project);
    if (plan.css?.requestedByTheme && !(await fileExists(plan.css.targetPath))) {
      throw new Error(`Theme installation needs the configured CSS file ${path.relative(cwd, plan.css.targetPath)}; no files were written`);
    }

    if (values["dry-run"]) {
      stdout.write(`${JSON.stringify({
        requestedItems: plan.requestedItems,
        resolvedItems: plan.resolvedItems,
        files: plan.files.map(({ targetPath, existedBefore }) => ({ targetPath, existedBefore })),
        css: plan.css && { targetPath: plan.css.targetPath, exists: await fileExists(plan.css.targetPath), requestedByTheme: plan.css.requestedByTheme },
      }, null, 2)}\n`);
      return 0;
    }

    const status = runShadcnImpl(
      ["add", ...urls, "--cwd", cwd, ...forwardSharedOptions(values, { includePath: true })],
      { cwd },
    );
    if (status === 0) {
      await resolveInstalledRegistryAliases(
        cwd,
        plan.files
          .filter((file) => !file.existedBefore || values.overwrite),
      );
      await writeInstallState(cwd, plan);
    }
    return status;
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
