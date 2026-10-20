import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { expect, it } from "vitest";
import { checkRegistry } from "../packages/registry/scripts/registry-check.mjs";
import { blockCatalog } from "../packages/blocks/src/catalog";

const root = resolve(import.meta.dirname, "..");
const read = (file: string) => JSON.parse(readFileSync(resolve(root, file), "utf8"));

it("distributes the Artifact block and its complete shared-workspace dependency closure", () => {
  expect(read("packages/blocks/package.json").exports["./artifact-01"]).toBe("./src/application/artifact-01/index.ts");
  expect(read("packages/blocks/block-capabilities.json")["artifact-01"]).toEqual({ framework: "react", kind: "data-block" });
  const visited = new Map<string, unknown>();
  function collect(name: string) {
    if (visited.has(name)) return;
    const item = read(`public/r/${name}.json`);
    visited.set(name, item);
    for (const dependency of item.registryDependencies ?? []) collect(dependency.split("/").at(-1)!.replace(/\.json$/, ""));
  }
  collect("artifact-01");
  expect(checkRegistry([...visited.values()])).toEqual([]);
  const item = read("public/r/artifact-01.json");
  expect(item.files.map((file: { target: string }) => file.target)).toEqual(expect.arrayContaining([
    "components/blocks/artifact-01/artifact-content.tsx", "components/blocks/artifact-01/artifact-preview-panel.tsx", "components/blocks/artifact-01/index.ts",
  ]));
  const dependencies = item.registryDependencies.map((value: string) => value.split("/").at(-1)!.replace(/\.json$/, ""));
  expect(dependencies).toContain("chat-workspace-01");
  expect(blockCatalog.find((block) => block.name === "artifact-01")?.dependencies).toEqual(dependencies);
});
