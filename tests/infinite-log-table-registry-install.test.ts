import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("Infinite log table registry item", () => {
  it("ships every schema-driven implementation file and UI dependency", () => {
    const registry = JSON.parse(readFileSync(resolve(root, "packages/blocks/registry.json"), "utf8"));
    const item = registry.items.find((entry: { name: string }) => entry.name === "infinite-log-table-01");
    const targets = item.files.map((file: { target: string }) => file.target);

    expect(item.registryDependencies).toEqual(expect.arrayContaining([
      "dialog",
      "filter-query-input",
      "select",
      "temporal-picker",
    ]));
    expect(targets).toEqual(expect.arrayContaining([
      "components/blocks/infinite-log-table-01/infinite-log-fields.ts",
      "components/blocks/infinite-log-table-01/infinite-log-query-adapter.ts",
      "components/blocks/infinite-log-table-01/infinite-log-generic-filters.tsx",
      "components/blocks/infinite-log-table-01/infinite-log-generic-table-view.tsx",
      "components/blocks/infinite-log-table-01/infinite-log-generic-detail.tsx",
    ]));
  });

  it("publishes the complete standalone artifact", () => {
    const artifact = JSON.parse(readFileSync(resolve(root, "public/r/infinite-log-table-01.json"), "utf8"));
    const targets = artifact.files.map((file: { target: string }) => file.target);
    expect(artifact.registryDependencies).toContain("https://zeron-ui.vercel.app/r/filter-query-input.json");
    expect(targets).toContain("components/blocks/infinite-log-table-01/infinite-log-query-adapter.ts");
  });
});
