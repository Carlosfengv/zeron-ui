import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { unificationConsumerExample, unificationConsumerItems } from "../scripts/lib/unification-consumer-examples.mjs";
import { registryMetadata } from "../packages/registry/scripts/registry-metadata.mjs";
const items = ["ui", "blocks"].flatMap(name => JSON.parse(readFileSync(`packages/${name}/registry.json`, "utf8")).items);

describe("installed examples for the frozen unification scope", () => {
  it("renders every installable entry and shared foundation through public consumer imports", () => {
    expect(unificationConsumerItems).toHaveLength(50);
    expect(new Set(unificationConsumerItems).size).toBe(50);
    expect(unificationConsumerExample("model-mcp-marketplace-01", "next")).toContain('from "@/components/blocks/resource-catalog-01"');
    expect(unificationConsumerExample("model-mcp-marketplace-01", "vite")).toContain('from "@/src/components/blocks/resource-catalog-01"');
    expect(unificationConsumerExample("resource-detail-page-01", "next")).toContain('data={defaultResourceDetailPageData}');
    for (const name of unificationConsumerItems) {
      const item = items.find(item => item.name === name);
      expect(item, name).toBeTruthy();
      expect(unificationConsumerExample(name, "next"), name).toContain(`data-consumer="${name}"`);
      if (registryMetadata(item).framework === "react") {
        const example = unificationConsumerExample(name, "vite");
        expect(example, name).toContain('createRoot(document.getElementById("root")!).render(<Demo />)');
        expect(example, name).toContain('import "./index.css"');
        expect(example, name).not.toContain("@zeron/");
      } else expect(unificationConsumerExample(name, "vite"), name).toBeNull();
    }
  });
});
