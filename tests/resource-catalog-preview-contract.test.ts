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

describe("Resource Catalog gallery preview", () => {
  it("renders a scaled ResourceCatalog preview instead of an empty card", () => {
    expect(blockPreview).toContain(
      'import { ResourceCatalog } from "@zeron/blocks/resource-catalog-01";'
    );
    expect(blockPreview).toContain('if (name === "resource-catalog-01")');
    expect(blockPreview).toContain('<ResourceCatalog />');
    expect(blockPreview).toContain('w-[1560px] origin-top scale-[0.32]');
  });

  it("uses a wider content area and four cards on wide displays", () => {
    expect(resourceCatalog).toContain(
      '<PageBody className="max-w-[1620px] p-4 sm:px-[18px] sm:py-5">'
    );
    expect(resourceCatalog).toContain('window.matchMedia("(min-width: 1536px)")');
    expect(resourceCatalog).toContain('return 4;');
    expect(resourceCatalog).toContain(
      'style={{ gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))" }}'
    );
  });
});
