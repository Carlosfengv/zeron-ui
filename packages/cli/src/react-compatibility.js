import { readFile } from "node:fs/promises";
import path from "node:path";
import semver from "semver";
import YAML from "yaml";

const names = ["react", "react-dom"];
const supported = ">=19.0.0 <20.0.0-0";

async function readJson(filename) {
  return JSON.parse(await readFile(filename, "utf8"));
}

// Read afresh rather than using require.resolve's cached symlink resolution:
// a package manager can replace node_modules links during this very command.
async function installedVersion(cwd, name) {
  for (let directory = cwd; ; directory = path.dirname(directory)) {
    try {
      return (await readJson(path.join(directory, "node_modules", name, "package.json"))).version;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (path.dirname(directory) === directory) break;
  }
  throw new Error(`Cannot resolve the installed ${name} version; install the project's dependencies before adding Registry items`);
}

export async function assertReactRuntime(cwd) {
  const versions = {};
  for (const name of names) {
    versions[name] = await installedVersion(cwd, name);
    if (!semver.valid(versions[name]) || !semver.satisfies(versions[name], supported)) {
      throw new Error(`Zeron Registry items require React 19; resolved ${name} ${versions[name]}`);
    }
  }
  if (versions.react !== versions["react-dom"]) {
    throw new Error(`React and react-dom must have matching installed versions; resolved react ${versions.react} and react-dom ${versions["react-dom"]}`);
  }
}

async function catalogSpec(cwd, name, catalog) {
  for (let directory = cwd; ; directory = path.dirname(directory)) {
    try {
      const config = YAML.parse(await readFile(path.join(directory, "pnpm-workspace.yaml"), "utf8"));
      return (catalog ? config?.catalogs?.[catalog] : config?.catalog)?.[name];
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    if (path.dirname(directory) === directory) return undefined;
  }
}

async function effectiveSpec(cwd, name, spec, seen = new Set()) {
  if (typeof spec !== "string" || seen.has(spec)) return undefined;
  seen.add(spec);
  if (spec.startsWith("catalog:")) {
    return effectiveSpec(cwd, name, await catalogSpec(cwd, name, spec.slice(8)), seen);
  }
  if (spec.startsWith("npm:")) {
    const match = /^npm:(?:@[^/]+\/)?[^@]+@(.+)$/.exec(spec);
    return match ? effectiveSpec(cwd, name, match[1], seen) : undefined;
  }
  if (/^(file:|link:)/.test(spec)) {
    try {
      return (await readJson(path.resolve(cwd, spec.replace(/^(file:|link:)/, ""), "package.json"))).version;
    } catch (error) {
      // Tarballs and other package-manager-specific forms cannot be resolved
      // safely here. The mandatory post-install runtime check covers them.
      if (!["ENOENT", "ENOTDIR"].includes(error.code)) throw error;
      return undefined;
    }
  }
  if (spec.startsWith("workspace:")) spec = spec.slice(10);
  return semver.validRange(spec) ? spec : undefined;
}

export async function assertReactInstallIntent(cwd, packageJson, plan) {
  const declarations = [packageJson.dependencies, packageJson.devDependencies, packageJson.optionalDependencies, packageJson.peerDependencies];
  const specs = declarations.flatMap((dependencies) => names
    .filter((name) => dependencies?.[name])
    .map((name) => [name, dependencies[name]]));
  for (const dependency of [...plan.requiredDependencies, ...plan.requiredDevDependencies]) {
    const match = /^(react|react-dom)@(.+)$/.exec(dependency);
    if (match) specs.push([match[1], match[2]]);
  }
  for (const [name, spec] of specs) {
    const effective = await effectiveSpec(cwd, name, spec);
    // Do not guess a major from a catalog name, alias, workspace path or tag.
    // Unknown resolutions remain supported with pre/post runtime validation.
    if (effective !== undefined && !semver.intersects(effective, supported)) {
      throw new Error(`Zeron Registry items require React 19; ${name} declaration ${spec} resolves to incompatible ${effective}`);
    }
  }
}
