import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { componentUrl, normalizeRegistryUrl } from "./registry.js";
import { resolveRegistryAliases } from "./resolve-registry-aliases.js";

const TARGET_PREFIXES = [
  ["components/ui/", "ui", ""],
  ["components/blocks/", "components", "blocks/"],
  ["components/", "components", ""],
  ["lib/", "lib", ""],
  ["hooks/", "hooks", ""],
];

const digest = (content) => createHash("sha256").update(content).digest("hex");

async function readIfPresent(file) {
  try {
    return await readFile(file, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

function importDirectory(alias, imports) {
  if (!alias.startsWith("#")) return alias.replace(/^@\//, "");
  const match = Object.entries(imports ?? {}).find(([key, value]) => (
    key.endsWith("/*") && typeof value === "string" && (alias === key.slice(0, -2) || alias.startsWith(key.slice(0, -1)))
  ));
  if (!match) throw new Error(`Cannot resolve package import alias ${alias} to an install target`);
  const [pattern, target] = match;
  const suffix = alias === pattern.slice(0, -2) ? "" : alias.slice(pattern.length - 1);
  return target.replace("*", suffix).replace(/^\.\//, "").replace(/\/$/, "");
}

function targetPathFor(file, { cwd, aliases, imports }) {
  const prefix = TARGET_PREFIXES.find(([candidate]) => file.target.startsWith(candidate));
  if (!prefix) throw new Error(`Unsupported Registry target: ${file.target}`);
  const [sourcePrefix, aliasName, targetPrefix] = prefix;
  const configuredAlias = aliases[aliasName];
  if (typeof configuredAlias !== "string") throw new Error(`components.json is missing aliases.${aliasName} for ${file.target}`);
  const suffix = `${targetPrefix}${file.target.slice(sourcePrefix.length)}`;
  const directory = importDirectory(configuredAlias, imports);
  const target = path.resolve(cwd, directory, suffix);
  const relative = path.relative(cwd, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Registry target escapes the project directory: ${file.target}`);
  }
  return target;
}

async function fetchRegistryItem(url, fetchImpl) {
  const response = await fetchImpl(url, { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Registry request failed (${response.status}) at ${url}`);
  const item = await response.json();
  if (!item || typeof item.name !== "string") throw new Error(`Registry response at ${url} is missing an item name`);
  return item;
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

/**
 * Reads the recursive Registry closure and computes every consumer file before
 * invoking shadcn. This is deliberately a small, explicit plan rather than a
 * post-install project scan.
 */
export async function buildInstallPlan({ cwd, names, baseUrl, overwrite = false, fetchImpl = fetch }) {
  const config = JSON.parse(await readFile(path.join(cwd, "components.json"), "utf8"));
  const packageJson = JSON.parse(await readFile(path.join(cwd, "package.json"), "utf8"));
  const normalizedBaseUrl = normalizeRegistryUrl(baseUrl);
  const items = [];
  const visiting = [];
  const seen = new Map();

  const visit = async (url) => {
    if (seen.has(url)) return;
    if (visiting.includes(url)) throw new Error(`Registry dependency cycle: ${[...visiting, url].join(" -> ")}`);
    visiting.push(url);
    const item = await fetchRegistryItem(url, fetchImpl);
    seen.set(url, item);
    for (const dependency of item.registryDependencies ?? []) {
      await visit(dependencyUrl(dependency, normalizedBaseUrl));
    }
    visiting.pop();
    items.push(item);
  };

  for (const name of names) await visit(componentUrl(name, normalizedBaseUrl));

  const fileByTarget = new Map();
  for (const item of items) {
    for (const file of item.files ?? []) {
      if (typeof file.content !== "string") continue;
      if (typeof file.target !== "string") throw new Error(`Registry item ${item.name} has a file without a target`);
      const targetPath = targetPathFor(file, { cwd, aliases: config.aliases ?? {}, imports: packageJson.imports });
      const expectedContent = resolveRegistryAliases(file.content, config.aliases ?? {}, targetPath);
      const previous = fileByTarget.get(targetPath);
      if (previous && previous.expectedContent !== expectedContent) {
        throw new Error(`Registry target conflict at ${path.relative(cwd, targetPath)} between ${previous.item} and ${item.name}`);
      }
      const existingContent = await readIfPresent(targetPath);
      const entry = {
        item: item.name,
        sourcePath: file.path,
        targetPath,
        expectedContent,
        existedBefore: existingContent !== null,
        beforeHash: existingContent === null ? null : digest(existingContent),
      };
      if (existingContent !== null && existingContent !== expectedContent && !overwrite) {
        throw new Error(`Install conflict: ${path.relative(cwd, targetPath)} already exists; rerun with --overwrite to replace this planned file`);
      }
      fileByTarget.set(targetPath, entry);
    }
  }

  return {
    requestedItems: names,
    resolvedItems: items.map((item) => item.name),
    registryBase: normalizedBaseUrl,
    requiredDependencies: [...new Map(items.flatMap((item) => (item.dependencies ?? []).map((dependency) => [dependencyName(dependency), dependency]))).values()],
    requirements: items.map((item) => ({ name: item.name, ...item.meta?.zeron })),
    css: (() => {
      const css = config.tailwind?.css;
      if (typeof css !== "string") return null;
      const targetPath = path.resolve(cwd, css);
      const relative = path.relative(cwd, targetPath);
      if (relative.startsWith("..") || path.isAbsolute(relative)) {
        throw new Error(`components.json Tailwind CSS target escapes the project directory: ${css}`);
      }
      return { targetPath, requestedByTheme: items.some((item) => item.type === "registry:theme" || item.name === "surfaces") };
    })(),
    files: [...fileByTarget.values()],
    conflicts: [],
    unsupportedRequirements: [],
  };
}
