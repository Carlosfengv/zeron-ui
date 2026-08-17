import { describe, expect, it } from "vitest";
import { blockCatalog } from "@zeron/blocks/catalog";
import { artifactCatalog, artifactKinds, artifactProducts, artifactReadiness } from "../docs/catalog/artifacts";
import { docEntries } from "../docs/manifest";

describe("business template catalog", () => {
  it("maps every current registry asset to one discoverable artifact", () => {
    const registryNames = new Set(blockCatalog.map(({ name }) => name));
    const artifactRegistryNames = artifactCatalog.map(({ registryName }) => registryName);

    expect(artifactCatalog).toHaveLength(14);
    expect(new Set(artifactRegistryNames).size).toBe(artifactCatalog.length);
    expect(new Set(artifactRegistryNames)).toEqual(registryNames);
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

  it("groups application shells under the Layout type", () => {
    expect(artifactCatalog.filter((artifact) => artifact.kind === "layout").map((artifact) => artifact.slug))
      .toEqual(["top-nav-app-shell-01", "zaiops-operations-01"]);
  });
});
