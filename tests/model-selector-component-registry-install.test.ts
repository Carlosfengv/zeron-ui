import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { checkRegistry } from "../packages/registry/scripts/registry-check.mjs";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const nameOf = (dependency: string) => dependency.split("/").at(-1)!.replace(/\.json$/, "");
function closure(name: string, items = new Map<string, ReturnType<typeof read>>()) {
  if (items.has(name)) return items;
  const item = read(`public/r/${name}.json`);
  items.set(name, item);
  for (const dependency of item.registryDependencies ?? []) closure(nameOf(dependency), items);
  return items;
}

describe("standalone AI component distribution", () => {
  it.each(["model-selector"])("installs %s without a conversation block or demo model dependency", (name) => {
    expect(read("packages/ui/package.json").exports[`./${name}`]).toBe(`./src/components/${name}.tsx`);
    const items = closure(name);
    expect(items.get(name).type).toBe("registry:ui");
    expect(items.get(name).files.map((file: { target: string }) => file.target)).toEqual(expect.arrayContaining([
      `components/ui/${name}.tsx`, `components/ui/${name}/types.ts`, `components/ui/${name}/labels.ts`,
    ]));
    for (const item of items.values()) {
      expect(item.type).not.toBe("registry:block");
      expect(item.dependencies ?? []).not.toContain("@lobehub/icons");
      for (const file of item.files ?? []) {
        expect(file.target).not.toContain("components/blocks/");
        expect(file.content).not.toContain("@zeron/blocks");
      }
    }
    expect(checkRegistry([...items.values()])).toEqual([]);
  });

  it.each(["model-selector"])("keeps %s-01 installable through the shared component", (name) => {
    const items = closure(`${name}-01`);
    const block = items.get(`${name}-01`);
    expect(block.registryDependencies.map(nameOf)).toContain(name);
    expect(items.has(name)).toBe(true);
    const adapter = block.files.find((file: { target: string }) => file.target.endsWith(`/${name}.tsx`));
    expect(adapter.content).toContain(`from "@ui/${name}"`);
    expect(checkRegistry([...items.values()])).toEqual([]);
  });
});
