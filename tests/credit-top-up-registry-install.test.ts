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

it("publishes a React credit top-up block with its complete control and chart closure", () => {
  const items = closure("credit-top-up-01");
  const block = items.get("credit-top-up-01");
  const dependencies = block.registryDependencies.map(nameOf);
  expect(dependencies).toEqual(expect.arrayContaining(["chart", "chart-primitives", "radio-group", "button", "container", "card"]));
  expect(blockCatalog.find(item => item.name === "credit-top-up-01")?.dependencies).toEqual([...dependencies, ...block.dependencies.map((name: string) => name.replace(/@[^@/]+$/, ""))]);
  expect(block.files).toHaveLength(8);
  expect(block.files.some((file: { target: string }) => file.target.endsWith("/credit-top-up-formatters.ts"))).toBe(true);
  expect(block.files.find((file: { target: string }) => file.target.endsWith("/credit-top-up.tsx")).content).toContain('from "@ui/radio-group"');
  expect(checkRegistry([...items.values()])).toEqual([]);
});
