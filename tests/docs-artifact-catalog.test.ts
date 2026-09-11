import { describe, expect, it } from "vitest";
import { blockCatalog } from "@zeron/blocks/catalog";
import { artifactCatalog, artifactKinds, artifactProducts, artifactReadiness } from "../docs/catalog/artifacts";
import { docEntries } from "../docs/manifest";

describe("business template catalog", () => {
  it("maps every current registry asset to one discoverable artifact", () => {
    const blocksByRegistryName = new Map<string, (typeof blockCatalog)[number]>(
      blockCatalog.map((block) => [block.name, block]),
    );
    const registryNames = new Set(blocksByRegistryName.keys());
    const artifactRegistryNames = artifactCatalog.map(({ registryName }) => registryName);

    expect(artifactCatalog).toHaveLength(35);
    expect(new Set(artifactRegistryNames).size).toBe(artifactCatalog.length);
    expect(new Set(artifactRegistryNames)).toEqual(registryNames);
    for (const artifact of artifactCatalog) {
      expect(artifact.installation).toEqual(blocksByRegistryName.get(artifact.registryName)?.installation);
    }
  });

  it("labels only data-capable Blocks as data blocks", () => {
    expect(blockCatalog.filter((block) => block.installation.kind === "data-block").map((block) => block.name))
      .toEqual(["ai-gateway-overview-01", "ai-gateway-session-list-01", "file-manager-01", "agent-message-trace-01", "credit-usage-01", "rule-flow-editor-01", "resource-list-table-01", "member-department-01", "infinite-log-table-01"]);
  });

  it("keeps every business template reachable through an existing detail page", () => {
    const blockSlugs = new Set(docEntries.filter(({ collection }) => collection === "blocks").map(({ slug }) => slug));

    for (const artifact of artifactCatalog) {
      expect(blockSlugs.has(artifact.slug), artifact.slug).toBe(true);
      expect(artifactKinds).toContain(artifact.kind);
      expect(artifactProducts).toContain(artifact.product);
      expect(artifactReadiness).toContain(artifact.readiness);
      expect(artifact.searchTerms.length, artifact.slug).toBeGreaterThan(0);
    }
  });

  it("groups the Zenfuse observability blocks under the Zenfuse product", () => {
    expect(artifactProducts).toContain("zenfuse");
    expect(artifactCatalog.filter(({ product }) => product === "zenfuse").map(({ slug }) => slug))
      .toEqual(["ai-gateway-overview-01", "agent-message-trace-01", "agent-trace-01"]);
  });

  it("groups application shells under the Layout type", () => {
    expect(artifactCatalog.filter((artifact) => artifact.kind === "layout").map((artifact) => artifact.slug))
      .toEqual(["top-nav-app-shell-01", "zaiops-operations-01"]);
  });
});
