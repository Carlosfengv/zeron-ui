import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import { blockCatalog } from "@zeron/blocks/catalog";
import { checkRegistry } from "../packages/registry/scripts/registry-check.mjs";

const read = (name: string) =>
  JSON.parse(readFileSync(`public/r/${name}.json`, "utf8"));
const nameOf = (name: string) =>
  name
    .split("/")
    .at(-1)!
    .replace(/\.json$/, "");
function closure(
  name: string,
  items = new Map<string, ReturnType<typeof read>>(),
) {
  if (items.has(name)) return items;
  const item = read(name);
  items.set(name, item);
  for (const dependency of item.registryDependencies ?? [])
    closure(nameOf(dependency), items);
  return items;
}
it("installs the React agent runs block with native charts and complete session dependencies", () => {
  const items = closure("agent-runs-01");
  const block = items.get("agent-runs-01");
  const dependencies = block.registryDependencies.map(nameOf);
  expect(
    blockCatalog.find((item) => item.name === "agent-runs-01")?.dependencies,
  ).toEqual([
    ...dependencies,
    ...block.dependencies.map((name: string) => name.replace(/@[^@/]+$/, "")),
  ]);
  expect(block.files).toHaveLength(8);
  expect(
    block.files.find((file: { target: string }) =>
      file.target.endsWith("/agent-runs-chart.tsx"),
    ).content,
  ).toContain('from "@ui/area-chart"');
  expect(
    block.files.find((file: { target: string }) =>
      file.target.endsWith("/agent-runs-sessions.tsx"),
    ).content,
  ).toContain('from "@ui/data-table"');
  expect(
    items
      .get("data-table")
      .files.find((file: { path: string }) =>
        file.path.endsWith("/data-table.tsx"),
      ).content,
  ).toContain("renderExpandedRow");
  for (const name of [
    "area-chart",
    "chart-core",
    "chart-primitives",
    "tabs",
    "data-table",
    "avatar",
    "badge",
  ])
    expect(items.has(name)).toBe(true);
  expect(checkRegistry([...items.values()])).toEqual([]);
});
