/**
 * Post-process the shadcn registry output so local registry dependencies are
 * emitted as absolute URLs instead of falling back to ui.shadcn.com.
 */

import { readdir, readFile, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const REGISTRY_DIR = new URL("../public/r", import.meta.url).pathname;
export const BASE_URL = "https://www.zerondesign.com/r";

// All custom items in registry.json. "utils" intentionally stays a bare
// dependency so the shadcn CLI resolves it from its default registry.
export const CUSTOM_ITEMS = new Set([
  "shape-context",
  "surface-context",
  "portal-container-context",
  "surface-classes",
  "icon-context",
  "pro-icon-provider",
  "springs",
  "use-proximity-hover",
  "use-merge-split",
  "use-touch-primary",
  "elevated",
  "surfaces",
  "accordion",
  "button",
  "checkbox",
  "checkbox-group",
  "dialog",
  "dropdown",
  "mobile-drawer",
  "popover",
  "radio-group",
  "scroll-area",
  "select",
  "slider",
  "stepper",
  "switch",
  "tabs",
  "tabs-subtle",
  "thinking-steps",
  "tooltip",
  "badge",
  "badge-overflow",
  "breadcrumb",
  "chat-message",
  "color-picker",
  "data-table",
  "data-grid",
  "file-thumbnail",
  "input",
  "input-copy",
  "input-group",
  "kbd",
  "table",
  "thinking-indicator",
  "ask-user-questions",
  "app-shell",
  "page-layout",
  "nav-menu",
  "nav-item",
  "sidebar",
  "top-nav",
]);

export function depUrl(dep) {
  return CUSTOM_ITEMS.has(dep) ? `${BASE_URL}/${dep}.json` : dep;
}

function rewriteDeps(item) {
  if (Array.isArray(item.registryDependencies)) {
    item.registryDependencies = item.registryDependencies.map(depUrl);
  }
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf-8"));
}

async function writeJson(path, data) {
  await writeFile(path, `${JSON.stringify(data, null, 2)}\n`);
}

export async function processRegistry(registryDir = REGISTRY_DIR) {
  const staleFiles = new Set(["font-weight.json"]);
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

  for (const file of files.filter((name) => name.endsWith(".json"))) {
    const filePath = join(registryDir, file);
    const data = await readJson(filePath);

    if (Array.isArray(data.items)) {
      for (const item of data.items) rewriteDeps(item);
    } else {
      rewriteDeps(data);
    }

    await writeJson(filePath, data);
    console.log(`  ✓ ${file}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  processRegistry().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
