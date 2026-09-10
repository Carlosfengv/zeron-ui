import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const source = readFileSync(
  join(
    ROOT,
    "packages/blocks/src/application/resource-detail-page-01/resource-detail-page.tsx"
  ),
  "utf8"
);
const layoutSource = readFileSync(
  join(ROOT, "packages/ui/src/components/resource-detail-layout.tsx"),
  "utf8"
);
const blockPreviewSource = readFileSync(
  join(ROOT, "docs/components/blocks/BlockPreview.tsx"),
  "utf8"
);
const packageJson = JSON.parse(
  readFileSync(join(ROOT, "packages/blocks/package.json"), "utf8")
);
const uiPackageJson = JSON.parse(
  readFileSync(join(ROOT, "packages/ui/package.json"), "utf8")
);
const registry = JSON.parse(
  readFileSync(join(ROOT, "packages/blocks/registry.json"), "utf8")
);

describe("Resource Detail Page 1 block contract", () => {
  it("is exported as an installable Block with its shared layout dependencies", () => {
    expect(packageJson.exports["./resource-detail-page-01"]).toBe(
      "./src/application/resource-detail-page-01/index.ts"
    );
    expect(packageJson.exports["./resource-workspace-shell-01"]).toBe(
      "./src/application/resource-workspace-shell-01/index.ts"
    );
    expect(uiPackageJson.exports["./resource-detail-layout"]).toBe(
      "./src/components/resource-detail-layout.tsx"
    );

    const item = registry.items.find(
      (entry: { name: string }) => entry.name === "resource-detail-page-01"
    );
    expect(item).toMatchObject({
      type: "registry:block",
      dependencies: expect.arrayContaining([
        "react-markdown",
        "remark-breaks",
        "remark-gfm",
      ]),
      registryDependencies: expect.arrayContaining([
        "resource-detail-layout",
        "resource-workspace-shell-01",
        "detail-list",
        "select",
        "tabs",
        "switch",
      ]),
    });
    expect(item.files).toHaveLength(6);
  });

  it("uses the shared shell, overview-only metadata rail, and unrestricted detail body", () => {
    expect(source).toContain("<ResourceWorkspaceShell");
    expect(source).toContain("<ResourceDetailLayout");
    expect(source).toContain('asideSide="left"');
    expect(source).toContain('asideWidth="25rem"');
    expect(source).toContain(
      'section === "overview" ? resolvedOverviewAside : undefined'
    );
    expect(source).toContain(
      'scrollMode={section === "overview" ? "columns" : "body"}'
    );
    expect(source).toContain('variant="pill"');
    expect(source).toContain("onValueChange={onSecurityLevelChange}");
    expect(source).toContain("aria-label={labels.securityLevel}");
    expect(source).toContain(
      'className="flex min-h-control-lg w-full items-center gap-3 px-3 py-2"'
    );
    expect(source.match(/variant="tertiary"/g)?.length).toBeGreaterThanOrEqual(4);
    expect(source).toContain("{data.recordTotal} {resolvedLabels.recordUnit}");
    expect(layoutSource).toContain('className="justify-start p-0"');
    expect(source).not.toContain("max-w-[1620px]");
    expect(layoutSource).toContain(
      '<PageBody className={cn("max-w-none p-3", columnScroll?.body)}>'
    );
    expect(layoutSource).toContain(
      'pane: "xl:min-h-0 xl:overflow-y-auto xl:overscroll-contain"'
    );
    expect(layoutSource).not.toContain("max-w-[1620px]");
    expect(source).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
    expect(layoutSource).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
  });

  it("keeps business state and tab content replaceable", () => {
    expect(source).toContain("data: ResourceDetailPageData");
    expect(source).toContain("onSectionChange?: (section: ResourceDetailPageSection) => void");
    expect(source).toContain("onPublishedChange?: (published: boolean) => void");
    expect(source).toContain(
      "onCategoriesChange?: (categories: readonly string[]) => void"
    );
    expect(source).toContain(
      "onProtectionChange?: (settings: ResourceProtectionSettings) => void"
    );
    expect(source).toContain(
      "sectionContent?: Partial<Record<ResourceDetailPageSection, ReactNode>>"
    );
    expect(source).toContain(
      "onResourceChange?: (change: ResourceDetailPageChange) => void"
    );
    expect(source).toContain("labels?: ResourceDetailPageLabelOverrides");
    expect(source).toContain("resourceIcon?: ReactNode");
    expect(source).toContain("sourceIcon?: ReactNode");
    expect(source).toContain("detailActions?: ReactNode");
    expect(source).toContain("detailNavigation?: ReactNode");
    expect(source).toContain("detailStatus?: ReactNode");
    expect(source).toContain("recordNavigation?: ReactNode");
    expect(source).toContain("overviewAside?:");
    expect(source).toContain(
      "onPublishedChange: (published: boolean) => void"
    );
    expect(source).toContain("disabled={!onEdit}");
    expect(source).toContain("disabled={!onClose}");
  });

  it("renders the real detail workspace on its catalog cover", () => {
    expect(blockPreviewSource).toContain(
      '"resource-detail-page-01": () => import("@zeron/blocks/resource-detail-page-01")'
    );
    expect(blockPreviewSource).toContain(
      "<ResponsivePreview canvasHeight={900} canvasWidth={1440}>"
    );
    expect(blockPreviewSource).toContain("data={defaultResourceDetailPageData}");
  });
});
