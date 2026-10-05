import { describe, expect, it } from "vitest";
import { blockCatalog } from "@zeron/blocks/catalog";
import registry from "../packages/blocks/registry.json";

describe("GettingStarted discovery", () => {
  it("keeps catalog and installation dependencies aligned with the Stepper composition", () => {
    const catalogEntry = blockCatalog.find((entry) => entry.name === "getting-started-01")!;
    const registryEntry = registry.items.find((entry) => entry.name === "getting-started-01")!;
    expect(catalogEntry.dependencies).toEqual(registryEntry.registryDependencies);
    expect(catalogEntry.dependencies).toContain("stepper");
    expect(catalogEntry.dependencies).not.toContain("accordion");
    expect(catalogEntry.dependencies).not.toContain("badge");
    expect(catalogEntry.installation).toEqual({ framework: "react", kind: "data-block" });
  });
});
