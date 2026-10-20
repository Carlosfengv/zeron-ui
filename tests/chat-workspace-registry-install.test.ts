import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { checkRegistry } from "../packages/registry/scripts/registry-check.mjs";
import { blockCatalog } from "../packages/blocks/src/catalog";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => JSON.parse(readFileSync(resolve(root, file), "utf8"));

describe("chat-workspace-01 distribution", () => {
  it("ships the independent panel, lazy viewer and public entrypoint with its React dependencies", () => {
    expect(read("packages/blocks/package.json").exports["./chat-workspace-01"]).toBe("./src/application/chat-workspace-01/index.ts");
    expect(read("packages/blocks/block-capabilities.json")["chat-workspace-01"]).toEqual({ framework: "react", kind: "data-block" });
    const item = read("public/r/chat-workspace-01.json");
    const targets = item.files.map((file: { target: string }) => file.target);
    expect(targets).toEqual(expect.arrayContaining([
      "components/blocks/chat-workspace-01/index.ts",
      "components/blocks/chat-workspace-01/artifact-panel.tsx",
      "components/blocks/chat-workspace-01/artifact-code-preview.tsx",
      "components/blocks/chat-workspace-01/artifact-preview.tsx",
    ]));
    const entry = item.files.find((file: { target: string }) => file.target.endsWith("/index.ts")).content;
    expect(entry).toContain("export { ArtifactPanel }");
    expect(entry).toContain("export { ChatWorkspace }");
    const dependencies = item.registryDependencies.map((dependency: string) => dependency.split("/").at(-1)!.replace(/\.json$/, ""));
    expect(dependencies).toEqual(expect.arrayContaining(["chat-thread-01", "resizable", "code-block", "markdown", "info-item"]));
    expect(blockCatalog.find((block) => block.name === "chat-workspace-01")?.dependencies).toEqual(dependencies);
  });

  it("installs a complete dependency closure without workspace-only imports", () => {
    const visited = new Map<string, unknown>();
    function collect(name: string) {
      if (visited.has(name)) return;
      const item = read(`public/r/${name}.json`);
      visited.set(name, item);
      for (const dependency of item.registryDependencies ?? []) {
        collect(dependency.startsWith("http") ? new URL(dependency).pathname.split("/").at(-1)!.replace(/\.json$/, "") : dependency);
      }
    }
    collect("chat-workspace-01");
    expect(checkRegistry([...visited.values()])).toEqual([]);
  });
});
