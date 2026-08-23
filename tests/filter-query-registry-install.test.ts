import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("Filter Query registry item", () => {
  it("installs the complete default UI without a business adapter", () => {
    const registry = JSON.parse(readFileSync(resolve(root, "packages/ui/registry.json"), "utf8"));
    const item = registry.items.find((entry: { name: string }) => entry.name === "filter-query-input");
    const targets = item.files.map((file: { target: string }) => file.target);

    expect(item.registryDependencies).toContain("filter-query-core");
    expect(targets).toEqual(expect.arrayContaining([
      "components/ui/filter-query-input/filter-query-input.tsx",
      "components/ui/filter-query-input/filter-query-history.ts",
      "components/ui/filter-query-input/filter-query-slots.tsx",
    ]));
  });

  it("keeps business field IDs out of core installation artifacts", () => {
    const core = readFileSync(resolve(root, "public/r/filter-query-core.json"), "utf8");

    expect(core).not.toMatch(/infinite-log|pathname|timing\.ttfb/);
  });
});
