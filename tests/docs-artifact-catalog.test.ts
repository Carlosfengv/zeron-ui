import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import ts from "typescript";
import { blockCatalog } from "@zeron/blocks/catalog";
import { artifactCatalog, artifactKinds, artifactProducts, artifactReadiness } from "../docs/catalog/artifacts";
import { contentKeyOf, getDocEntry, legacyBlockRedirects, pathnameOf } from "../docs/manifest";
import { artifactPathname, pageArtifactSlugs } from "../docs/catalog/artifact-collections";

const blockPreviewSource = readFileSync(
  new URL("../docs/components/blocks/BlockPreview.tsx", import.meta.url),
  "utf8",
);
const blockCapabilities = JSON.parse(readFileSync(new URL("../packages/blocks/block-capabilities.json", import.meta.url), "utf8")) as Record<string, { kind: string }>;

describe("business template catalog", () => {
  it("maps every current registry asset to one discoverable artifact", () => {
    const blocksByRegistryName = new Map<string, (typeof blockCatalog)[number]>(
      blockCatalog.map((block) => [block.name, block]),
    );
    const registryNames = new Set(blocksByRegistryName.keys());
    const artifactRegistryNames = artifactCatalog.map(({ registryName }) => registryName);

    expect(artifactCatalog.length).toBeGreaterThan(0);
    expect(new Set(artifactRegistryNames).size).toBe(artifactCatalog.length);
    expect(new Set(artifactRegistryNames)).toEqual(registryNames);
    for (const artifact of artifactCatalog) {
      expect(artifact.installation).toEqual(blocksByRegistryName.get(artifact.registryName)?.installation);
    }
  });

  it("labels only data-capable Blocks as data blocks", () => {
    const declared = Object.entries(blockCapabilities).filter(([, capability]) => capability.kind === "data-block").map(([name]) => name);
    expect(new Set(blockCatalog.filter((block) => block.installation.kind === "data-block").map((block) => block.name)))
      .toEqual(new Set(declared));
  });
  it("keeps cost estimate discovery dependencies aligned with its billing control", () => {
    const dependencies = blockCatalog.find((block) => block.name === "cost-estimate-01")!.dependencies;
    expect(dependencies).toContain("tabs");
    expect(dependencies).not.toContain("radio-group");
    expect(dependencies).not.toContain("select");
  });

  it("keeps every business template reachable through an existing detail page", () => {
    for (const artifact of artifactCatalog) {
      const entry = getDocEntry(artifact.collection, artifact.slug);
      expect(entry, artifact.slug).toBeDefined();
      expect(pathnameOf(entry!)).toBe(artifactPathname(artifact.slug));
      expect(artifactKinds).toContain(artifact.kind);
      expect(artifactProducts).toContain(artifact.product);
      expect(artifactReadiness).toContain(artifact.readiness);
      expect(artifact.searchTerms.length, artifact.slug).toBeGreaterThan(0);
    }
  });

  it("provides a gallery cover loader for every discoverable artifact", () => {
    // A cover can load a local adapter (e.g. controlled account settings),
    // rather than importing the registry module directly in this file.
    const source = ts.createSourceFile("BlockPreview.tsx", blockPreviewSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const loaders = new Map<string, ts.Expression>();
    function visit(node: ts.Node) {
      if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === "previewLoaders"
        && node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
        for (const property of node.initializer.properties) {
          if (ts.isPropertyAssignment(property) && (ts.isStringLiteral(property.name) || ts.isIdentifier(property.name))) {
            loaders.set(property.name.text, property.initializer);
          }
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(source);
    for (const artifact of artifactCatalog) {
      const loader = loaders.get(artifact.slug);
      expect(loader, artifact.slug).toBeDefined();
      expect(loader && ts.isArrowFunction(loader), artifact.slug).toBe(true);
      expect(loader?.getText(source), artifact.slug).toContain("import(");
    }
  });

  it("separates full pages from embeddable blocks without losing or duplicating assets", () => {
    const pages = artifactCatalog.filter(({ collection }) => collection === "pages");
    const blocks = artifactCatalog.filter(({ collection }) => collection === "blocks");
    expect(pages.length).toBeGreaterThan(0);
    expect(blocks.length).toBeGreaterThan(0);
    expect(pages.length + blocks.length).toBe(artifactCatalog.length);
    expect(blocks.find(({ slug }) => slug === "local-models-01")).toMatchObject({
      registryName: "local-models-01",
      kind: "block",
      dataMode: "controlled",
      installation: { framework: "react", kind: "data-block" },
    });
    expect(blocks.some(({ slug }) => slug === "plan-usage-01")).toBe(true);
    expect(new Set(pages.map(({ slug }) => slug))).toEqual(new Set(pageArtifactSlugs));
    expect(blocks.some(({ slug }) => pageArtifactSlugs.includes(slug as typeof pageArtifactSlugs[number]))).toBe(false);
    expect(getDocEntry("pages", "resource-list-page-01")).toBeDefined();
    expect(getDocEntry("blocks", "resource-list-table-01")).toBeDefined();
    expect(getDocEntry("blocks", "resource-list-page-01")).toBeUndefined();
    expect(getDocEntry("pages", "resource-list-table-01")).toBeUndefined();
    for (const slug of ["agent-trace-01", "infinite-log-table-01"]) {
      expect(getDocEntry("pages", slug)).toBeDefined();
      expect(getDocEntry("blocks", slug)).toBeUndefined();
      expect(artifactCatalog.find((artifact) => artifact.slug === slug)?.kind).toBe("page");
    }
  });

  it("redirects every moved page while retaining source messages and registry installation names", () => {
    expect(legacyBlockRedirects).toHaveLength(pageArtifactSlugs.length);
    for (const slug of pageArtifactSlugs) {
      const entry = getDocEntry("pages", slug)!;
      expect(contentKeyOf(entry)).toBe(`blocks/${slug}`);
      expect(entry.registryItem?.type).toBe("registry:block");
      expect(legacyBlockRedirects).toContainEqual({ source: `/docs/blocks/${slug}`, destination: `/docs/pages/${slug}` });
    }
    expect(getDocEntry("pages", "resource-catalog-01")?.registryItem?.name).toBe("model-mcp-marketplace-01");
  });

  it("groups the Zenfuse observability blocks under the Zenfuse product", () => {
    expect(artifactProducts).toContain("zenfuse");
    expect(artifactCatalog.filter(({ product }) => product === "zenfuse").map(({ slug }) => slug))
      .toEqual(["ai-gateway-overview-01", "agent-message-trace-01", "agent-trace-01"]);
  });

  it("keeps the composable shell under Layout and the operations dashboard under Pages", () => {
    expect(artifactCatalog.filter((artifact) => artifact.kind === "layout").map((artifact) => artifact.slug))
      .toEqual(["top-nav-app-shell-01"]);
    expect(artifactCatalog.find(({ slug }) => slug === "zaiops-operations-01")?.kind).toBe("page");
  });
});
