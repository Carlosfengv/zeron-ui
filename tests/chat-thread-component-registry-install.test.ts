import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { blockCatalog } from "@zeron/blocks/catalog";
import { checkRegistry } from "../packages/registry/scripts/registry-check.mjs";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));
const nameOf = (name: string) => name.split("/").at(-1)!.replace(/\.json$/, "");
function closure(name: string, items = new Map<string, ReturnType<typeof read>>()) {
  if (items.has(name)) return items;
  const item = read(`public/r/${name}.json`); items.set(name, item);
  for (const dependency of item.registryDependencies ?? []) closure(nameOf(dependency), items);
  return items;
}

describe("ChatThread distribution", () => {
  it("installs a complete UI conversation without a block, composer or demo dependency", () => {
    const exports = read("packages/ui/package.json").exports;
    expect(exports["./chat-thread"]).toBe("./src/components/chat-thread.tsx");
    expect(exports["./chat-thread/labels"]).toBe("./src/components/chat-thread/labels.ts");
    expect(exports["./chat-thread/history"]).toBe("./src/components/chat-thread/history.ts");
    const items = closure("chat-thread");
    expect(items.get("chat-thread").type).toBe("registry:ui");
    expect(items.has("input-message")).toBe(false);
    const targets = items.get("chat-thread").files.map((file: { target: string }) => file.target);
    for (const path of ["context.ts", "types.ts", "labels.ts", "history.ts", "messages.tsx", "markdown.tsx", "use-thread-scroll.ts"]) {
      expect(targets).toContain(`components/ui/chat-thread/${path}`);
    }
    for (const item of items.values()) {
      expect(item.type).not.toBe("registry:block");
      for (const file of item.files ?? []) {
        expect(file.target).not.toContain("components/blocks/");
        expect(file.content).not.toContain("@zeron/blocks");
        expect(file.content).not.toContain("createChatThreadDemoData");
        expect(file.content).not.toContain("#components/");
      }
    }
    expect(checkRegistry([...items.values()])).toEqual([]);
  });

  it("keeps all legacy modules and fixtures on one shared context", () => {
    const items = closure("chat-thread-01");
    const block = items.get("chat-thread-01");
    expect(block.registryDependencies.map(nameOf)).toEqual(["chat-thread"]);
    expect(block.dependencies).toEqual([]);
    expect(blockCatalog.find((item) => item.name === "chat-thread-01")?.dependencies).toEqual(["chat-thread"]);
    expect(block.files.some((file: { path: string }) => file.path.endsWith("chat-thread-demo-data.ts"))).toBe(true);
    const context = block.files.find((file: { path: string }) => file.path.endsWith("chat-thread-context.ts"));
    expect(context.content).toContain('from "@ui/chat-thread/context"');
    expect(context.content).not.toContain("createContext");
    expect(checkRegistry([...items.values()])).toEqual([]);
  });

});
