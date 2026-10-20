import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { checkRegistry } from "../packages/registry/scripts/registry-check.mjs";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => JSON.parse(readFileSync(resolve(root, file), "utf8"));

describe.each(["grouped-data-table-01"])("%s distribution", (slug) => {
  it("exports a React data-block with all implementation files", () => {
    expect(read("packages/blocks/package.json").exports[`./${slug}`]).toBe(`./src/application/${slug}/index.ts`);
    expect(read("packages/blocks/block-capabilities.json")[slug]).toEqual({ framework: "react", kind: "data-block" });
    const item = read("packages/blocks/registry.json").items.find((entry: { name: string }) => entry.name === slug);
    const prefix = slug === "grouped-data-table-01" ? "grouped-data-table" : "sectioned-data-table";
    expect(item.files.map((file: { target: string }) => file.target)).toEqual(expect.arrayContaining([
      `components/blocks/${slug}/index.ts`,
      `components/blocks/${slug}/${prefix}.tsx`,
      `components/blocks/${slug}/${prefix}-types.ts`,
      `components/blocks/${slug}/${prefix}-labels.ts`,
    ]));
    expect(item.registryDependencies).toContain("data-table");
  });

  it("ships a complete installable dependency closure without workspace imports", () => {
    const visited = new Map<string, unknown>();
    function collect(name: string) {
      if (visited.has(name)) return;
      const item = read(`public/r/${name}.json`);
      visited.set(name, item);
      for (const dependency of item.registryDependencies ?? []) {
        collect(dependency.startsWith("http") ? new URL(dependency).pathname.split("/").at(-1)!.replace(/\.json$/, "") : dependency);
      }
    }
    collect(slug);
    expect(checkRegistry([...visited.values()])).toEqual([]);
    expect(read("public/r/data-table.json").files.some((file: { content: string }) => file.content.includes("DataTableGroupingOptions"))).toBe(true);
  });
});
