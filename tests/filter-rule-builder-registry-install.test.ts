import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "..");

describe("Filter Rule Builder registry item", () => {
  it("installs its complete data-block contract and Zeron dependencies", () => {
    const registry = JSON.parse(readFileSync(resolve(root, "packages/blocks/registry.json"), "utf8"));
    const item = registry.items.find((entry: { name: string }) => entry.name === "filter-rule-builder-01");
    const targets = item.files.map((file: { target: string }) => file.target);

    expect(item.registryDependencies).toEqual(expect.arrayContaining([
      "badge",
      "button",
      "card",
      "combobox",
      "container",
      "field",
      "filter-core",
      "input-group",
      "select",
    ]));
    expect(targets).toEqual(expect.arrayContaining([
      "components/blocks/filter-rule-builder-01/filter-rule-builder-types.ts",
      "components/blocks/filter-rule-builder-01/filter-rule-builder-demo-data.ts",
      "components/blocks/filter-rule-builder-01/filter-rule-builder.tsx",
      "components/blocks/filter-rule-builder-01/index.ts",
    ]));
  });

  it("publishes a React data-block capability", () => {
    const capabilities = JSON.parse(readFileSync(resolve(root, "packages/blocks/block-capabilities.json"), "utf8"));
    expect(capabilities["filter-rule-builder-01"]).toEqual({ framework: "react", kind: "data-block" });
  });
});
