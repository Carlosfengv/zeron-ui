import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const blockPreview = readFileSync(
  join(ROOT, "docs/components/blocks/BlockPreview.tsx"),
  "utf8"
);
const resourceCatalog = readFileSync(
  join(ROOT, "packages/blocks/src/application/resource-catalog-01/resource-catalog.tsx"),
  "utf8"
);
const blockCatalog = readFileSync(join(ROOT, "packages/blocks/src/catalog.ts"), "utf8");
const blockRegistry = readFileSync(join(ROOT, "packages/blocks/registry.json"), "utf8");
const blocksPackage = readFileSync(join(ROOT, "packages/blocks/package.json"), "utf8");
const blockDetailPage = readFileSync(
  join(ROOT, "docs/components/blocks/BlockDetailPage.tsx"),
  "utf8"
);
const blocksGallery = readFileSync(join(ROOT, "docs/components/blocks/BlocksGallery.tsx"), "utf8");
const artifactCatalog = readFileSync(join(ROOT, "docs/catalog/artifacts.ts"), "utf8");
const resourceCatalogDoc = readFileSync(
  join(ROOT, "docs/pages/blocks/resource-catalog-01/ResourceCatalogBlockDocClient.tsx"),
  "utf8"
);

describe("Resource Catalog gallery preview", () => {
  it("renders a scaled ResourceCatalog preview instead of an empty card", () => {
    expect(blockPreview).toContain(
      'import("@zeron/blocks/resource-catalog-01")'
    );
    expect(blockPreview).toContain('"resource-catalog-01": () =>');
    expect(blockPreview).toContain('<ResourceCatalog />');
    expect(blockPreview).toContain('ResponsivePreview canvasHeight={900} canvasWidth={1560}><ResourceCatalog /></ResponsivePreview>');
    expect(blockPreview).toContain('container.clientWidth / canvasWidth');
  });

  it("keeps the documentation route while using the marketplace installation name", () => {
    expect(blockCatalog).toContain('name: "model-mcp-marketplace-01"');
    expect(blockCatalog).toContain('slug: "resource-catalog-01"');
    expect(blockRegistry).toContain('"name": "model-mcp-marketplace-01"');
    expect(blockDetailPage).toContain('registryName = slug');
    expect(blockDetailPage).toContain('npx zeron-ui add ${registryName}');
    expect(resourceCatalogDoc).toContain('registryName="model-mcp-marketplace-01"');
    expect(artifactCatalog).toContain('slug: "resource-catalog-01", registryName: "model-mcp-marketplace-01"');
    expect(blocksGallery).toContain("artifactCatalog");
    expect(blocksGallery).toContain('<BlockPreview name={artifact.slug} />');
    expect(blocksGallery).toContain('className="overflow-hidden overscroll-auto p-1"');
    expect(blocksGallery).toContain('<div className="pointer-events-none">');
    expect(blocksGallery).toContain('aria-label={artifact.title}');
    expect(blocksGallery).toContain('href={`${localePrefix}/docs/blocks/${artifact.slug}`}');
    expect(blocksGallery).toContain('className="grid grid-cols-1 gap-4 xl:grid-cols-2"');
  });

  it("uses a wider content area and four cards on wide displays", () => {
    expect(resourceCatalog).toContain(
      '<PageBody className="max-w-[1620px] p-4 sm:px-[18px] sm:py-5">'
    );
    expect(resourceCatalog).toContain('window.matchMedia("(min-width: 1536px)")');
    expect(resourceCatalog).toContain('return 4;');
    expect(resourceCatalog).toContain('label: "模型广场"');
    expect(resourceCatalog).toContain(
      'style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}'
    );
  });

  it("uses one mutually exclusive sort selection for newest and most used", () => {
    expect(resourceCatalog).toContain(
      'const [sort, setSort] = useState<SortOrder>("newest");'
    );
    expect(resourceCatalog).toContain('activeValue={sort}');
    expect(resourceCatalog).toContain('setSort("newest")');
    expect(resourceCatalog).toContain('setSort("most-used")');
    expect(resourceCatalog).toContain(".toSorted(");
    expect(resourceCatalog).not.toContain(".filter((item) => sort");
  });

  it("filters model results by every provider represented in the current data", () => {
    expect(resourceCatalog).toContain('const [provider, setProvider] = useState("all");');
    expect(resourceCatalog).toContain(
      'sourceItems.filter((item) => item.kind === "model").map((item) => item.provider)'
    );
    expect(resourceCatalog).toContain('aria-label="模型厂商筛选"');
    expect(resourceCatalog).toContain('kind === "model" && (');
    expect(resourceCatalog).toContain("const modelProviderIcons = {");
    expect(resourceCatalog).toContain('<ModelProviderMark provider={value} size={16} />');
    expect(resourceCatalog).toContain(
      '.filter((item) => provider === "all" || item.provider === provider)'
    );
  });

  it("uses the subtle foreground token for model and MCP card descriptions", () => {
    expect(resourceCatalog).toContain(
      'className="mt-1 line-clamp-3 text-label leading-5 text-fg-subtle"'
    );
  });

  it("uses Empty for search, filter, and source-data zero states", () => {
    expect(resourceCatalog).toContain('from "@zeron/ui/empty"');
    expect(resourceCatalog).toContain("const hasSearchQuery = normalizedQuery.length > 0;");
    expect(resourceCatalog).toMatch(
      /hasActiveFilters\s*\? "no-filter-results"/
    );
    expect(resourceCatalog).toContain('? "search"');
    expect(resourceCatalog).toContain('? "filter"');
    expect(resourceCatalog).toContain(': "resources"');
    expect(resourceCatalog).toContain("清空搜索");
    expect(resourceCatalog).toContain("清除筛选");
    expect(resourceCatalog).toContain("清除全部条件");
    expect(resourceCatalog).toContain(
      'aria-live={visibleItems.length > 0 ? "polite" : "off"}'
    );
    expect(resourceCatalog).not.toContain("rounded-xl border border-dashed");
  });

  it("declares Empty as an install dependency", () => {
    expect(blockRegistry).toContain('"card", "empty", "icon-context"');
  });

  it("declares every brand-icon dependency used by the catalog and its install artifact", () => {
    expect(resourceCatalog).toContain('from "@thesvg/icons/supabase"');
    expect(blocksPackage).toContain('"@thesvg/icons": "^3.2.15"');
    expect(blockRegistry).toContain('"dependencies": ["tw-animate-css", "@lobehub/icons", "@thesvg/icons"]');
  });
});
