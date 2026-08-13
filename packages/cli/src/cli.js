import { access, readFile } from "node:fs/promises";
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
  --path <dir>      Override the component output path
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
    const urls = names.map((name) => componentUrl(name, baseUrl));

    if (values["dry-run"]) {
      stdout.write("Preview only; no files will be written.\n");
      return runShadcnImpl(["view", ...urls, "--cwd", cwd], { cwd });
    }

    const status = runShadcnImpl(
      ["add", ...urls, "--cwd", cwd, ...forwardSharedOptions(values, { includePath: true })],
      { cwd },
    );
    if (status === 0) await resolveInstalledRegistryAliases(cwd);
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
      [`Node.js ${process.versions.node}`, isSupportedNodeVersion()],
      ["package.json", await fileExists(path.join(cwd, "package.json"))],
      ["components.json", await fileExists(path.join(cwd, "components.json"))],
    ];

    try {
      const catalog = await fetchCatalog(baseUrl, fetchImpl);
      checks.push([`Registry (${catalog.items.length} items)`, true]);
    } catch {
      checks.push(["Registry", false]);
    }

    for (const [label, ok] of checks) {
      stdout.write(`${ok ? "✓" : "✗"} ${label}\n`);
    }
    return checks.every(([, ok]) => ok) ? 0 : 1;
  }

  throw new Error(`unknown command "${command}"`);
}

export { HELP };
