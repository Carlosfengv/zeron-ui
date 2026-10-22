import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { checkRegistry } from "../packages/registry/scripts/registry-check.mjs";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const nameOf = (name: string) => name.split("/").at(-1)!.replace(/\.json$/, "");
function closure(name: string, items = new Map<string, ReturnType<typeof read>>()) {
  if (items.has(name)) return items;
  const item = read(`public/r/${name}.json`); items.set(name, item);
  for (const dep of item.registryDependencies ?? []) closure(nameOf(dep), items);
  return items;
}

describe("artifact card distribution", () => {
  it.each(["artifact-card"])("installs %s without a block or model dependency", (name) => {
    expect(read("packages/ui/package.json").exports[`./${name}`]).toBe(`./src/components/${name}.tsx`);
    const items = closure(name);
    expect(items.get(name).type).toBe("registry:ui");
    for (const item of items.values()) {
      expect(item.type).not.toBe("registry:block");
      for (const file of item.files ?? []) { expect(file.target).not.toContain("components/blocks/"); expect(file.content).not.toContain("@zeron/blocks"); }
    }
    expect(checkRegistry([...items.values()])).toEqual([]);
  });

  it.each(["chat-workspace-01", "artifact-01"])("keeps the %s block installable", (name) => {
    const items = closure(name);
    expect(items.has("artifact-card")).toBe(true);
    expect(checkRegistry([...items.values()])).toEqual([]);
  });
});
