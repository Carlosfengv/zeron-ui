import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { lstat, mkdir, readFile, readdir, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { serialize } from "./agent-utils.mjs";

const fixtureRoot = fileURLToPath(new URL("../tests/fixtures/published-consumers/", import.meta.url));
export const sha = bytes => createHash("sha256").update(bytes).digest("hex");
export const fixtureManagers = { npm: "10.9.2", pnpm: "10.12.4" };
export class ConsumerExecutionError extends Error {
  constructor(code, step, exitCode = null) { super(`Published consumer failed: ${code}`); this.code = code; this.step = step; this.exitCode = exitCode; }
}

/** No inherited npm authentication, Blob identity, workspace caches or Node injection. */
export async function consumerEnvironment(directory, parent = process.env) {
  await mkdir(directory, { recursive: true });
  for (const name of ["user.npmrc", "global.npmrc"]) await writeFile(path.join(directory, name), "", { flag: "wx" });
  const environment = {};
  for (const name of ["PATH", "TMPDIR", "TMP", "TEMP", "SystemRoot", "COMSPEC", "LANG", "LC_ALL"]) {
    if (parent[name]) environment[name] = parent[name];
  }
  return { ...environment, PATH: `${path.dirname(process.execPath)}${path.delimiter}${environment.PATH ?? ""}`,
    CI: "true", NEXT_TELEMETRY_DISABLED: "1", npm_config_registry: "https://registry.npmjs.org/",
    npm_config_userconfig: path.join(directory, "user.npmrc"), npm_config_globalconfig: path.join(directory, "global.npmrc"),
    npm_config_cache: path.join(directory, "npm-cache"), npm_config_store_dir: path.join(directory, "pnpm-store"),
    npm_config_ignore_scripts: "true", npm_config_audit: "false", npm_config_fund: "false",
    XDG_CACHE_HOME: path.join(directory, "cache"), XDG_CONFIG_HOME: path.join(directory, "config"),
    XDG_DATA_HOME: path.join(directory, "data"), PNPM_HOME: path.join(directory, "pnpm-home") };
}

/** Kill the process group on timeout so a build/installer cannot outlive its failed gate. */
export function runConsumerCommand(file, args, { cwd, env, step, timeoutMs = 300000, maxBytes = 4 * 1024 * 1024, log } = {}) {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 600000 || !Number.isSafeInteger(maxBytes) || maxBytes < 1 || maxBytes > 4 * 1024 * 1024) {
    throw new ConsumerExecutionError("COMMAND_BUDGET", step);
  }
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, { cwd, env, shell: false, detached: process.platform !== "win32", stdio: ["ignore", "pipe", "pipe"] });
    let total = 0;
    let failure;
    const stdout = [];
    const stderr = [];
    const stop = code => {
      failure ??= new ConsumerExecutionError(code, step);
      try { if (process.platform === "win32") child.kill("SIGKILL"); else process.kill(-child.pid, "SIGKILL"); }
      catch { /* Process may have already exited. Wait for close before continuing. */ }
    };
    const timer = setTimeout(() => stop("COMMAND_TIMEOUT"), timeoutMs);
    const collect = (chunks, chunk) => {
      total += chunk.length;
      if (total > maxBytes) { stop("COMMAND_OUTPUT_BUDGET"); return; }
      chunks.push(Buffer.from(chunk));
    };
    child.stdout.on("data", chunk => collect(stdout, chunk));
    child.stderr.on("data", chunk => collect(stderr, chunk));
    child.on("error", () => { failure ??= new ConsumerExecutionError("COMMAND_START_FAILED", step); });
    child.on("close", code => {
      clearTimeout(timer);
      const result = { stdout: Buffer.concat(stdout).toString("utf8"), stderr: Buffer.concat(stderr).toString("utf8"), exitCode: code };
      try { log?.({ step, file, args, ...result }); }
      catch { failure ??= new ConsumerExecutionError("COMMAND_LOG_FAILED", step); }
      if (failure) reject(failure);
      else resolve(result);
    });
  });
}

export async function fileInventory(directory, { exclude = ["node_modules", ".next", "dist"], maxFiles = 4096, maxTotalBytes = 64 * 1024 * 1024 } = {}) {
  const files = [];
  let total = 0;
  async function visit(relative = "") {
    for (const entry of await readdir(path.join(directory, relative), { withFileTypes: true })) {
      if (!relative && exclude.includes(entry.name)) continue;
      const name = relative ? `${relative}/${entry.name}` : entry.name;
      if (entry.isDirectory()) await visit(name);
      else {
        if (!entry.isFile()) throw new ConsumerExecutionError("NON_REGULAR_CONSUMER_FILE", "inventory");
        const stat = await lstat(path.join(directory, name));
        total += stat.size;
        if (files.length >= maxFiles || total > maxTotalBytes) throw new ConsumerExecutionError("INVENTORY_BUDGET", "inventory");
        const bytes = await readFile(path.join(directory, name));
        if (bytes.length !== stat.size || !stat.isFile()) throw new ConsumerExecutionError("CONSUMER_FILE_CHANGED", "inventory");
        files.push({ path: name, bytes: bytes.length, sha256: sha(bytes) });
      }
    }
  }
  await visit();
  return files.sort((a, b) => a.path.localeCompare(b.path, "en"));
}

export async function cliPackageInventory(directory, version) {
  directory = await realpath(directory);
  const metadata = JSON.parse(await readFile(path.join(directory, "package.json"), "utf8"));
  const bin = typeof metadata.bin === "string" ? metadata.bin : metadata.bin?.["zeron-ui"];
  if (metadata.name !== "zeron-ui" || metadata.version !== version || typeof bin !== "string"
    || !/^[a-zA-Z0-9._/-]+$/.test(bin) || bin.startsWith("/") || bin.split("/").some(part => !part || part === ".." || part === ".")
    || metadata.bundleDependencies || metadata.bundledDependencies) throw new ConsumerExecutionError("CLI_PACKAGE_IDENTITY", "cli-inventory");
  const files = await fileInventory(directory, { exclude: ["node_modules"], maxFiles: 256, maxTotalBytes: 32 * 1024 * 1024 });
  if (!files.some(file => file.path === bin)) throw new ConsumerExecutionError("CLI_BIN_MISSING", "cli-inventory");
  return { name: metadata.name, version, bin, files };
}

/** PATH is supplied by npm exec/pnpm dlx; resolve their actual package before executing it. */
export async function resolveVerifiedCli(inventory, { searchPath = process.env.PATH ?? "" } = {}) {
  if (process.platform === "win32") throw new ConsumerExecutionError("UNSUPPORTED_CONSUMER_PLATFORM", "cli-launch");
  if (inventory.nodeVersion !== process.versions.node) throw new ConsumerExecutionError("CLI_NODE_VERSION", "cli-launch");
  const owner = await realpath(inventory.allowedRoot);
  for (const directory of searchPath.split(path.delimiter)) {
    if (!directory) continue;
    let binary;
    try { binary = await realpath(path.join(directory, process.platform === "win32" ? "zeron-ui.cmd" : "zeron-ui")); }
    catch (error) { if (error.code === "ENOENT" || error.code === "ENOTDIR") continue; throw error; }
    const suffix = `${path.sep}${inventory.bin.split("/").join(path.sep)}`;
    let packageRoot;
    if (binary.endsWith(suffix)) packageRoot = binary.slice(0, -suffix.length);
    else {
      // pnpm creates a regular shell shim, not npm's symlink. Never execute or interpret it.
      const binDirectory = await realpath(directory);
      if (path.basename(binDirectory) !== ".bin" || binary !== path.join(binDirectory, "zeron-ui")
        || !(await lstat(binary)).isFile()) throw new ConsumerExecutionError("CLI_BIN_IDENTITY", "cli-launch");
      packageRoot = await realpath(path.join(binDirectory, "..", "zeron-ui"));
      binary = await realpath(path.join(packageRoot, inventory.bin));
      if (!binary.startsWith(`${packageRoot}${path.sep}`)) throw new ConsumerExecutionError("CLI_BIN_IDENTITY", "cli-launch");
    }
    const relative = path.relative(owner, packageRoot);
    if (!relative || relative.startsWith(`..${path.sep}`) || relative === ".." || path.isAbsolute(relative)) throw new ConsumerExecutionError("CLI_OUTSIDE_ISOLATED_CACHE", "cli-launch");
    const actual = await cliPackageInventory(packageRoot, inventory.version);
    if (serialize(actual) !== serialize({ name: inventory.name, version: inventory.version, bin: inventory.bin, files: inventory.files })) {
      throw new ConsumerExecutionError("CLI_SOURCE_BYTES_MISMATCH", "cli-launch");
    }
    return binary;
  }
  throw new ConsumerExecutionError("CLI_BIN_NOT_FOUND", "cli-launch");
}

export async function materializeConsumer(framework, packageManager, destination) {
  if (!["next", "vite"].includes(framework) || !Object.hasOwn(fixtureManagers, packageManager)) throw new ConsumerExecutionError("FIXTURE_PROFILE", "fixture");
  await mkdir(destination);
  const sources = [path.join(fixtureRoot, "common"), path.join(fixtureRoot, framework), path.join(fixtureRoot, `${framework}-${packageManager}`)];
  const identity = [];
  for (const directory of sources) {
    const files = await fileInventory(directory, { exclude: [] });
    for (const file of files) {
      const filename = path.join(destination, file.path.replace(/\.txt$/, ""));
      await mkdir(path.dirname(filename), { recursive: true });
      await writeFile(filename, await readFile(path.join(directory, file.path)), { flag: "wx" });
    }
    identity.push(...files.map(file => ({ ...file, path: `${path.basename(directory)}/${file.path}` })));
  }
  return sha(serialize(identity));
}

/** A workspace boundary must not silently switch an npm consumer to pnpm. */
export async function assertConsumerManager(directory, packageManager, files) {
  if (!Object.hasOwn(fixtureManagers, packageManager)) throw new ConsumerExecutionError("FIXTURE_PROFILE", "fixture");
  const metadata = JSON.parse(await readFile(path.join(directory, "package.json"), "utf8"));
  if (metadata.packageManager !== `${packageManager}@${fixtureManagers[packageManager]}`) throw new ConsumerExecutionError("CONSUMER_MANAGER_DECLARATION", "install");
  files ??= await fileInventory(directory);
  const lockfile = packageManager === "npm" ? "package-lock.json" : "pnpm-lock.yaml";
  const other = packageManager === "npm" ? "pnpm-lock.yaml" : "package-lock.json";
  const lock = files.find(file => file.path === lockfile);
  if (!lock || files.some(file => file.path === other)) throw new ConsumerExecutionError("INSTALL_LOCKFILE_MANAGER", "install");
  return lock;
}

const examples = {
  button: { imports: 'import { Button } from "@/components/ui/button";', element: '<Button className="border-hairline border-border animate-in fade-in duration-fast">Install verified</Button>' },
  card: { imports: 'import { Card, CardContent, CardTitle } from "@/components/ui/card";', element: '<Card><CardContent><CardTitle>Install verified</CardTitle></CardContent></Card>' },
  "login-01": { nextOnly: true, imports: 'import { Login01 } from "@/components/blocks/login-01";', element: '<Login01 onSubmit={async () => undefined} />' },
  "signup-01": { nextOnly: true, imports: 'import { Signup01 } from "@/components/blocks/signup-01";', element: '<Signup01 />' },
};
export function consumerEntry(framework, names) {
  if (!names.length || names.some(name => !Object.hasOwn(examples, name) || (framework === "vite" && examples[name].nextOnly))) {
    throw new ConsumerExecutionError("REPRESENTATIVE_ENTRY_MISSING", "fixture-entry");
  }
  const normalize = text => framework === "vite" ? text.replaceAll('"@/components/', '"@/src/components/') : text;
  return [framework === "next" ? '"use client";' : 'import { createRoot } from "react-dom/client";\nimport "./index.css";',
    ...names.map(name => normalize(examples[name].imports)),
    `function VerifiedPage() { return <main>${names.map(name => examples[name].element).join("")}</main>; }`,
    framework === "next" ? "export default VerifiedPage;" : 'createRoot(document.getElementById("root")!).render(<VerifiedPage />);', ""].join("\n");
}
