import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { checkRegistry } from "../packages/registry/scripts/registry-check.mjs";

const root = resolve(import.meta.dirname, "..");
type RegistryItem = { name: string; registryDependencies?: string[]; files: { target: string; content: string }[] };
const read = (name: string): RegistryItem => JSON.parse(readFileSync(resolve(root, `public/r/${name}.json`), "utf8"));

describe("chat-markdown-01 distribution", () => {
  it("ships the response, demo text and public entrypoint with its complete dependency closure", () => {
    const items = new Map<string, RegistryItem>();
    function collect(name: string) {
      if (items.has(name)) return;
      const item = read(name);
      items.set(name, item);
      for (const dependency of item.registryDependencies ?? []) {
        const basename = dependency.startsWith("http") ? new URL(dependency).pathname.split("/").at(-1)! : dependency;
        collect(basename.replace(/\.json$/, ""));
      }
    }
    collect("chat-markdown-01");
    expect(checkRegistry([...items.values()])).toEqual([]);
    expect(read("chat-markdown-01").files.map((file) => file.target)).toEqual(expect.arrayContaining([
      "components/blocks/chat-markdown-01/index.ts",
      "components/blocks/chat-markdown-01/chat-markdown-response.tsx",
      "components/blocks/chat-markdown-01/chat-markdown-demo-data.ts",
    ]));
    expect(items.has("markdown")).toBe(true);
    expect(items.has("table")).toBe(true);
    expect(items.has("code-block")).toBe(true);
    expect(items.has("checkbox")).toBe(true);
    expect(read("chat-message").files.some((file) => file.target.endsWith("/scroll-to-latest.tsx"))).toBe(true);
  });
});
