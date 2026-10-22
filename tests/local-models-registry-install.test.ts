import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { blockCatalog } from "@zeron/blocks/catalog";
import { checkRegistry } from "../packages/registry/scripts/registry-check.mjs";

const read = (name: string) => JSON.parse(readFileSync(`public/r/${name}.json`, "utf8"));
const nameOf = (name: string) => name.split("/").at(-1)!.replace(/\.json$/, "");
function closure(name: string, items = new Map<string, ReturnType<typeof read>>()) {
  if (items.has(name)) return items;
  const item = read(name); items.set(name, item);
  for (const dependency of item.registryDependencies ?? []) closure(nameOf(dependency), items);
  return items;
}

it("installs the context field with its block and preserves catalog dependency parity", () => {
  const items = closure("local-models-01");
  const block = items.get("local-models-01");
  const dependencies = block.registryDependencies.map(nameOf);
  expect(dependencies).toContain("field");
  expect(items.get("field").files.some((file: { target: string }) => file.target === "components/ui/field.tsx")).toBe(true);
  const npm = block.dependencies.map((dependency: string) => dependency.replace(/@[^@/]+$/, ""));
  expect(blockCatalog.find((item) => item.name === "local-models-01")?.dependencies).toEqual([...dependencies, ...npm]);
  expect(block.files.find((file: { target: string }) => file.target.endsWith("/local-models.tsx")).content).toContain('from "@ui/field"');
  expect(checkRegistry([...items.values()])).toEqual([]);
});
