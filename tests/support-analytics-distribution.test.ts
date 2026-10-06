import { readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { blockCatalog } from "../packages/blocks/src/catalog";

describe("support analytics distribution", () => {
  it("publishes every block source through both Registry and documentation", async () => {
    const { previewSourceFiles } = await import("../scripts/preview-source-allowlist.mjs");
    const directory = "packages/blocks/src/application/support-analytics-01";
    const expected = readdirSync(directory).filter((name) => /\.tsx?$/.test(name)).map((name) => `${directory}/${name}`).sort();
    const registry = JSON.parse(readFileSync("packages/blocks/registry.json", "utf8"));
    const item = registry.items.find((entry: { name: string }) => entry.name === "support-analytics-01");
    expect(item.files.map((file: { path: string }) => file.path).sort()).toEqual(expected);
    expect([...previewSourceFiles["support-analytics-01"]].sort()).toEqual(expected);
  });
  it("exposes the same installation dependencies in the catalog and Registry", () => {
    const registry = JSON.parse(readFileSync("packages/blocks/registry.json", "utf8"));
    const item = registry.items.find((entry: { name: string }) => entry.name === "support-analytics-01");
    const catalog = blockCatalog.find((entry) => entry.name === "support-analytics-01")!;
    expect([...catalog.dependencies].sort()).toEqual([...item.dependencies, ...item.registryDependencies].sort());
  });
});
