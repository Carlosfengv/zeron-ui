/**
 * Post-process the shadcn registry output so local registry dependencies are
 * emitted as absolute URLs instead of falling back to ui.shadcn.com.
 */

import { readdir, readFile, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { transformRegistryImports } from "./transform-imports.mjs";

const REGISTRY_DIR = new URL("../../../public/r", import.meta.url).pathname;
export const BASE_URL = "https://zeron-ui.vercel.app/r";

export function localItemNames(catalog) {
  return new Set(Array.isArray(catalog.items) ? catalog.items.map((item) => item.name) : []);
}

export function depUrl(dep, itemNames) {
  return itemNames.has(dep) ? `${BASE_URL}/${dep}.json` : dep;
}

function rewriteDeps(item, itemNames) {
  if (Array.isArray(item.registryDependencies)) {
    item.registryDependencies = item.registryDependencies.map((dep) => depUrl(dep, itemNames));
  }
}

function rewriteImports(item) {
  for (const file of item.files ?? []) {
    if (typeof file.content === "string" && /\.(?:[cm]?tsx?|jsx?)$/.test(file.path)) {
      file.content = transformRegistryImports(file.content, file.path);
    }
  }
}

function addRuntimeDependencies(item) {
  // shadcn injects this Tailwind v4 import when it applies a theme item but
  // does not preserve a theme item's `dependencies` field while building.
  if (item.name === "surfaces") {
    item.dependencies = [...new Set([...(item.dependencies ?? []), "tw-animate-css"])];
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf-8"));
}

async function writeJson(path, data) {
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`);
}

export async function processRegistry(registryDir = REGISTRY_DIR) {
  const staleFiles = new Set(["font-weight.json", "shape-context.json"]);
  const initialFiles = await readdir(registryDir);
  await Promise.all(
    initialFiles
      .filter((name) => staleFiles.has(name))
      .map((name) => rm(join(registryDir, name), { force: true }))
  );
  const files = initialFiles.filter((name) => !staleFiles.has(name));
  // The single-backend registry emits only flat JSON files. Remove any stale
  // nested artifact directory left by an earlier build.
  await Promise.all(
    files
      .filter((name) => !name.endsWith(".json"))
      .map((name) => rm(join(registryDir, name), { recursive: true, force: true }))
  );

  const catalog = await readJson(join(registryDir, "registry.json"));
  const itemNames = localItemNames(catalog);

  for (const file of files.filter((name) => name.endsWith(".json"))) {
    const filePath = join(registryDir, file);
    const data = await readJson(filePath);

    if (Array.isArray(data.items)) {
      for (const item of data.items) {
        rewriteDeps(item, itemNames);
        rewriteImports(item);
        addRuntimeDependencies(item);
      }
    } else {
      rewriteDeps(data, itemNames);
      rewriteImports(data);
      addRuntimeDependencies(data);
    }

    await writeJson(filePath, data);
    console.log(`  ✓ ${file}`);
  }

  // shadcn applies a registry:theme item to the generated catalog but does not
  // emit its standalone file. Components reference this compatibility URL, so
  // publish it directly from the composed catalog.
  const surfaces = catalog.items?.find((item) => item.name === "surfaces");
  if (surfaces) {
    const { type: _type, ...theme } = structuredClone(surfaces);
    theme.$schema = "https://ui.shadcn.com/schema/registry-item.json";
    rewriteDeps(theme, itemNames);
    addRuntimeDependencies(theme);
    await writeJson(join(registryDir, "surfaces.json"), theme);
    console.log("  ✓ surfaces.json");
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  processRegistry().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
