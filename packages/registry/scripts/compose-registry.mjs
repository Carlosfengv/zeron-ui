import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { withRegistryMetadata } from "./registry-metadata.mjs";

const root = fileURLToPath(new URL("../../..", import.meta.url));
const sources = [
  `${root}/packages/ui/registry.json`,
  `${root}/packages/blocks/registry.json`,
];
const destination = `${root}/packages/registry/registry.composed.json`;

export async function composeRegistry(output = destination) {
  const catalogs = await Promise.all(sources.map(async (path) => JSON.parse(await readFile(path, "utf8"))));
  const [base] = catalogs;
  const items = catalogs.flatMap((catalog) => (catalog.items ?? []).map(withRegistryMetadata));
  const names = new Set();
  for (const item of items) {
    if (names.has(item.name)) throw new Error(`Duplicate Registry item: ${item.name}`);
    names.add(item.name);
  }
  const catalog = { ...base, items };
  await writeFile(output, `${JSON.stringify(catalog, null, 2)}\n`);
  return catalog;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await composeRegistry();
}
