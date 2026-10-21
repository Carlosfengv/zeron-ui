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

describe("ContextWindow distribution", () => {
  it("installs the UI family without a block, demo snapshot or provider dependency", () => {
    expect(read("packages/ui/package.json").exports["./context-window"]).toBe("./src/components/context-window.tsx");
    const items = closure("context-window");
    expect(items.get("context-window").type).toBe("registry:ui");
    for (const item of items.values()) {
      expect(item.type).not.toBe("registry:block");
      expect(item.dependencies ?? []).not.toContain("@lobehub/icons@^5.16.0");
      for (const file of item.files ?? []) {
        expect(file.target).not.toContain("components/blocks/");
        expect(file.content).not.toContain("@zeron/blocks");
        expect(file.content).not.toContain("createContextWindowDemoData");
        expect(file.content).not.toContain("#components/");
      }
    }
    expect(checkRegistry([...items.values()])).toEqual([]);
  });

  it("installs both legacy blocks together with one shared UI and no file conflicts", () => {
    const items = closure("context-window-01");
    closure("context-window-02", items);
    expect(items.has("context-window")).toBe(true);
    const files = new Map<string, string>();
    for (const item of items.values()) for (const file of item.files ?? []) {
      if (files.has(file.target)) expect(files.get(file.target), file.target).toBe(file.content);
      else files.set(file.target, file.content);
    }
    expect(items.get("context-window-01").files.some((file: { content: string }) => file.content.includes('from "@ui/context-window"'))).toBe(true);
    expect(items.get("context-window-02").files.some((file: { content: string }) => file.content.includes('from "@ui/context-window"'))).toBe(true);
    expect(checkRegistry([...items.values()])).toEqual([]);
  });
});
