import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import { componentUrl, normalizeRegistryUrl, validateComponentName } from "./registry.js";
import { assertProjectPath } from "./project-paths.js";
import { resolveRegistryAliases } from "./resolve-registry-aliases.js";

const TARGET_PREFIXES = [
  ["components/ui/", "ui", ""],
  ["components/blocks/", "components", "blocks/"],
  ["components/", "components", ""],
  ["lib/", "lib", ""],
  ["hooks/", "hooks", ""],
];

export const digest = (content) => createHash("sha256").update(content).digest("hex");

export async function readIfPresent(file) {
  try {
    return await readFile(file, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function importDirectory(alias, imports, cwd, compilerOptions) {
  if (!alias.startsWith("#")) {
    const paths = compilerOptions?.paths ?? {};
    const match = Object.entries(paths).sort(([a], [b]) => b.length - a.length).find(([pattern]) => pattern.endsWith("/*") ? alias === pattern.slice(0, -2) || alias.startsWith(pattern.slice(0, -1)) : alias === pattern);
    if (match) {
      const [pattern, targets] = match;
      if (targets.length !== 1) throw new Error(`Ambiguous installation alias: ${alias}`);
      const suffix = pattern.endsWith("/*") ? alias.slice(pattern.length - 1) : "";
      const base = compilerOptions.baseUrl ?? compilerOptions.pathsBasePath ?? cwd;
      return path.relative(cwd, path.resolve(base, targets[0].replace("*", suffix)));
    }
    if (compilerOptions) throw new Error(`Cannot resolve installation alias ${alias} from project paths`);
    return alias.replace(/^@\//, "");
  }
  const match = Object.entries(imports ?? {}).find(([key, value]) => (
    key.endsWith("/*") && typeof value === "string" && (alias === key.slice(0, -2) || alias.startsWith(key.slice(0, -1)))
  ));
  if (!match) throw new Error(`Cannot resolve package import alias ${alias} to an install target`);
  const [pattern, target] = match;
  const suffix = alias === pattern.slice(0, -2) ? "" : alias.slice(pattern.length - 1);
  return target.replace("*", suffix).replace(/^\.\//, "").replace(/\/$/, "");
}

function targetPathFor(file, { cwd, aliases, imports, compilerOptions }) {
  const prefix = TARGET_PREFIXES.find(([candidate]) => file.target.startsWith(candidate));
  if (!prefix) throw new Error(`Unsupported Registry target: ${file.target}`);
  const [sourcePrefix, aliasName, targetPrefix] = prefix;
  const configuredAlias = aliases[aliasName];
  if (typeof configuredAlias !== "string") throw new Error(`components.json is missing aliases.${aliasName} for ${file.target}`);
  const suffix = `${targetPrefix}${file.target.slice(sourcePrefix.length)}`;
  const directory = importDirectory(configuredAlias, imports, cwd, compilerOptions);
  const target = path.resolve(cwd, directory, suffix);
  const relative = path.relative(cwd, target);
  if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
    throw new Error(`Registry target escapes the project directory: ${file.target}`);
  }
  return target;
}

async function fetchRegistryItem(url, fetchImpl) {
  const response = await fetchImpl(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Registry request failed (${response.status}) at ${url}`);
  const item = await response.json();
  if (!item || typeof item.name !== "string") throw new Error(`Registry response at ${url} is missing an item name`);
  validateComponentName(item.name);
  return structuredClone(item);
}

function dependencyUrl(dependency, baseUrl) {
  if (typeof dependency !== "string") throw new Error("Registry dependency must be a string");
  return dependency.startsWith("http") ? dependency : componentUrl(dependency, baseUrl);
}

function dependencyName(dependency) {
  if (dependency.startsWith("@")) {
    const versionMarker = dependency.indexOf("@", dependency.indexOf("/") + 1);
    return versionMarker === -1 ? dependency : dependency.slice(0, versionMarker);
  }
  return dependency.split("@")[0];
}

function projectCompilerOptions(cwd) {
  const configPath = ["tsconfig.json", "jsconfig.json"].map((file) => path.join(cwd, file)).find(ts.sys.fileExists);
  if (!configPath) return undefined;
  const parsed = ts.getParsedCommandLineOfConfigFile(configPath, {}, { ...ts.sys, onUnRecoverableConfigFileDiagnostic: (d) => { throw new Error(ts.flattenDiagnosticMessageText(d.messageText, " ")); } });
  const errors = parsed?.errors.filter((d) => d.code !== 18003) ?? [];
  if (!parsed || errors.length) throw new Error("Cannot resolve installation aliases from project configuration");
  return parsed.options;
}

/** Align freshly initialized defaults with the pinned installer's src layout.
 * Never guess for arbitrary aliases or change a project's TypeScript paths.
 */
export async function alignInitializedAliases(cwd) {
  if (!ts.sys.directoryExists(path.join(cwd, "src"))) return;
  const configPath = path.join(cwd, "components.json");
  for (const file of ["components.json", "package.json", "tsconfig.json", "jsconfig.json"]) {
    await assertProjectPath(cwd, path.join(cwd, file));
  }
  const config = JSON.parse(await readFile(configPath, "utf8"));
  const packageJson = JSON.parse(await readFile(path.join(cwd, "package.json"), "utf8"));
  const compilerOptions = projectCompilerOptions(cwd);
  const targets = { components: "components", ui: "components/ui", lib: "lib", hooks: "hooks", utils: "lib/utils" };
  let changed = false;
  for (const [name, target] of Object.entries(targets)) {
    const alias = config.aliases?.[name];
    if (typeof alias !== "string" || !alias.endsWith(`/${target}`)) continue;
    const resolve = (value) => path.resolve(cwd, importDirectory(value, packageJson.imports, cwd, compilerOptions));
    if (resolve(alias) !== path.resolve(cwd, target)) continue;
    const candidate = `${alias.slice(0, -target.length)}src/${target}`;
    const expected = path.resolve(cwd, "src", target);
    if (resolve(candidate) !== expected) continue;
    await assertProjectPath(cwd, expected);
    config.aliases[name] = candidate;
    changed = true;
  }
  if (changed) {
    await assertProjectPath(cwd, configPath);
    await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
  }
}

/**
 * Reads the recursive Registry closure and computes every consumer file before
 * invoking shadcn. This is deliberately a small, explicit plan rather than a
 * post-install project scan.
 */
export async function buildInstallPlan({ cwd, names, baseUrl, overwrite = false, fetchImpl = fetch }) {
  const controlPaths = ["components.json", "package.json", "tsconfig.json", "jsconfig.json", ".zeron/install-state.json",
    "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "bun.lock", "bun.lockb"].map((file) => path.join(cwd, file));
  for (const target of controlPaths) await assertProjectPath(cwd, target);
  const configContent = await readFile(path.join(cwd, "components.json"), "utf8");
  const packageContent = await readFile(path.join(cwd, "package.json"), "utf8");
  const config = JSON.parse(configContent);
  const packageJson = JSON.parse(packageContent);
  const configHash = digest(configContent);
  const stateContent = await readIfPresent(path.join(cwd, ".zeron/install-state.json"));
  const state = stateContent === null ? {} : JSON.parse(stateContent);
  const installedFiles = new Map();
  for (const record of state.installations ?? []) {
    for (const [target, hashes] of Object.entries(record.fileHashes ?? {})) installedFiles.set(target, hashes);
  }
  const compilerOptions = projectCompilerOptions(cwd);
  const isSrcDir = ts.sys.directoryExists(path.join(cwd, "src"));
  // The engine can use all aliases to select a workspace, even when no files
  // from that alias occur in this particular item.
  const aliasPaths = [];
  for (const alias of Object.values(config.aliases ?? {})) {
    if (typeof alias !== "string") continue;
    const target = path.resolve(cwd, importDirectory(alias, packageJson.imports, cwd, compilerOptions));
    await assertProjectPath(cwd, target);
    aliasPaths.push(target);
  }
  const auxiliaryPaths = [config.tailwind?.css, config.tailwind?.config].filter((file) => typeof file === "string" && file.length).map((file) => path.resolve(cwd, file));
  for (const target of auxiliaryPaths) await assertProjectPath(cwd, target);
  const normalizedBaseUrl = normalizeRegistryUrl(baseUrl);
  const items = [];
  const registryItems = [];
  const visiting = [];
  const seen = new Map();
  const sourcesByName = new Map();

  const visit = async (url) => {
    if (visiting.includes(url)) throw new Error(`Registry dependency cycle: ${[...visiting, url].join(" -> ")}`);
    if (seen.has(url)) return;
    visiting.push(url);
    const item = await fetchRegistryItem(url, fetchImpl);
    if (sourcesByName.has(item.name) && sourcesByName.get(item.name) !== url) {
      throw new Error(`Ambiguous Registry item name ${item.name} from multiple URLs; the pinned installer cannot safely distinguish these sources`);
    }
    sourcesByName.set(item.name, url);
    seen.set(url, item);
    if (item.envVars && Object.keys(item.envVars).length) throw new Error(`Registry item ${item.name} declares unsupported environment-file writes; no files were written`);
    const dependencies = (item.registryDependencies ?? []).map((dependency) => dependencyUrl(dependency, normalizedBaseUrl));
    for (const dependency of dependencies) await visit(dependency);
    visiting.pop();
    items.push(item);
    registryItems.push({ url, item, dependencies });
  };

  const registryRoots = names.map((name) => componentUrl(name, normalizedBaseUrl));
  for (const url of registryRoots) await visit(url);

  const fileByTarget = new Map();
  for (const item of items) {
    for (const file of item.files ?? []) {
      if (typeof file.content !== "string") throw new Error(`Registry item ${item.name} has a file without inline content`);
      if (typeof file.target !== "string") throw new Error(`Registry item ${item.name} has a file without a target`);
      if (file.type === "registry:page" || /^\.env(?:\.|$)/i.test(path.posix.basename(file.target)) || file.target.includes("\\")) {
        throw new Error(`Unsupported Registry target with installer-dependent placement: ${file.target}`);
      }
      let targetPath = targetPathFor(file, { cwd, aliases: config.aliases ?? {}, imports: packageJson.imports, compilerOptions });
      // Pinned shadcn 3 honors explicit Registry targets before aliases and
      // prefixes src when that directory exists. Reject disagreement before
      // any CSS/dependency/file mutation rather than writing a second UI tree.
      const installerPath = path.resolve(cwd, isSrcDir ? "src" : "", file.target.replace("src/", ""));
      if (targetPath !== installerPath) throw new Error(`Unsupported installation layout for ${file.target}: aliases resolve to ${path.relative(cwd, targetPath)}, but the pinned installer would write ${path.relative(cwd, installerPath)}. Align aliases with the existing root/src layout before installing; no files were written.`);
      // shadcn changes the output extension for JavaScript consumers.
      if (config.tsx === false) targetPath = targetPath.replace(/\.tsx?$/, (extension) => extension === ".tsx" ? ".jsx" : ".js");
      await assertProjectPath(cwd, targetPath);
      const expectedContent = resolveRegistryAliases(file.content, config.aliases ?? {}, file.path);
      const previous = fileByTarget.get(targetPath);
      if (previous && previous.expectedContent !== expectedContent) {
        throw new Error(`Registry target conflict at ${path.relative(cwd, targetPath)} between ${previous.item} and ${item.name}`);
      }
      const existingContent = await readIfPresent(targetPath);
      const entry = {
        item: item.name,
        sourcePath: file.path,
        registryTarget: file.target,
        sourceHash: digest(JSON.stringify({ content: expectedContent, path: file.path, type: file.type })),
        configHash,
        targetPath,
        expectedContent,
        existedBefore: existingContent !== null,
        beforeHash: existingContent === null ? null : digest(existingContent),
      };
      const installed = installedFiles.get(path.relative(cwd, targetPath));
      const unchangedInstall = installed?.sourceHash === entry.sourceHash
        && installed?.configHash === configHash && installed?.installedHash === entry.beforeHash;
      if (existingContent !== null && existingContent !== expectedContent && !unchangedInstall && !overwrite) {
        throw new Error(`Install conflict: ${path.relative(cwd, targetPath)} already exists; rerun with --overwrite to replace this planned file`);
      }
      fileByTarget.set(targetPath, entry);
    }
  }

  if (await readFile(path.join(cwd, "components.json"), "utf8") !== configContent || await readFile(path.join(cwd, "package.json"), "utf8") !== packageContent) {
    throw new Error("Project configuration changed during preflight; rerun the install");
  }
  return {
    registryItems,
    registryRoots,
    configHash,
    guardedPaths: [...new Set([...controlPaths, ...aliasPaths, ...auxiliaryPaths, ...fileByTarget.keys()])],
    inputHashes: await Promise.all(controlPaths.map(async (targetPath) => {
      const content = await readIfPresent(targetPath);
      return { targetPath, hash: content === null ? null : digest(content) };
    })),
    requestedItems: names,
    resolvedItems: items.map((item) => item.name),
    registryBase: normalizedBaseUrl,
    requiredDependencies: [...new Map(items.flatMap((item) => (item.dependencies ?? []).map((dependency) => [dependencyName(dependency), dependency]))).values()],
    requiredDevDependencies: [...new Map(items.flatMap((item) => (item.devDependencies ?? []).map((dependency) => [dependencyName(dependency), dependency]))).values()],
    requirements: items.map((item) => ({ name: item.name, ...item.meta?.zeron })),
    css: (() => {
      const css = config.tailwind?.css;
      if (typeof css !== "string") return null;
      const targetPath = path.resolve(cwd, css);
      const relative = path.relative(cwd, targetPath);
      if (relative === ".." || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
        throw new Error(`components.json Tailwind CSS target escapes the project directory: ${css}`);
      }
      return { targetPath, requestedByTheme: items.some((item) => item.type === "registry:theme" || item.name === "surfaces") };
    })(),
    files: [...fileByTarget.values()],
    conflicts: [],
    unsupportedRequirements: [],
  };
}
