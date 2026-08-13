import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../..", import.meta.url));
const sources = [
  `${root}/packages/ui/registry.json`,
  `${root}/packages/blocks/registry.json`,
];
const destination = `${root}/packages/registry/registry.composed.json`;

const catalogs = await Promise.all(sources.map(async (path) => JSON.parse(await readFile(path, "utf8"))));
const [base] = catalogs;
const items = catalogs.flatMap((catalog) => catalog.items ?? []);
const names = new Set();
for (const item of items) {
  if (names.has(item.name)) throw new Error(`Duplicate Registry item: ${item.name}`);
  names.add(item.name);
}

await writeFile(destination, `${JSON.stringify({ ...base, items }, null, 2)}\n`);
