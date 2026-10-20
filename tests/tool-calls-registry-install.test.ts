import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { checkRegistry } from "../packages/registry/scripts/registry-check.mjs";

const read = (path: string) => JSON.parse(readFileSync(path, "utf8"));

describe("Tool Calls distribution", () => {
  it("installs the block with its shared conversation and code dependencies", () => {
    expect(read("packages/blocks/package.json").exports["./tool-calls-01"]).toBe("./src/application/tool-calls-01/index.ts");
    expect(read("packages/blocks/block-capabilities.json")["tool-calls-01"]).toEqual({ framework: "react", kind: "data-block" });
    const items = new Map<string, unknown>();
    function collect(name: string) {
      if (items.has(name)) return;
      const item = read(`public/r/${name}.json`);
      items.set(name, item);
      for (const dependency of item.registryDependencies ?? []) collect(dependency.split("/").at(-1)!.replace(/\.json$/, ""));
    }
    collect("tool-calls-01");
    expect(items.has("chat-thread-01")).toBe(true);
    expect(items.has("accordion")).toBe(true);
    expect(items.has("code-block")).toBe(true);
    expect(checkRegistry([...items.values()])).toEqual([]);
  }, 20_000);
});
