import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const sourcePath = join(
  ROOT,
  "packages/blocks/src/application/resource-list-table-01/resource-list-table.tsx"
);
const source = readFileSync(sourcePath, "utf8");
const packageJson = JSON.parse(
  readFileSync(join(ROOT, "packages/blocks/package.json"), "utf8")
);
const registry = JSON.parse(
  readFileSync(join(ROOT, "packages/blocks/registry.json"), "utf8")
);

describe("Resource List Table 1 block contract", () => {
  it("is publicly exported and installable from the block registry", () => {
    expect(packageJson.exports["./resource-list-table-01"]).toBe(
      "./src/application/resource-list-table-01/index.ts"
    );

    const item = registry.items.find(
      (entry: { name: string }) => entry.name === "resource-list-table-01"
    );
    expect(item).toMatchObject({
      type: "registry:block",
      dependencies: ["tw-animate-css", "@tanstack/react-table", "@thesvg/icons"],
      registryDependencies: [
        "badge",
        "button",
        "checkbox",
        "data-table",
        "info-item",
        "input-group",
        "icon-context",
        "utils",
      ],
    });
    expect(item.files).toHaveLength(2);
  });

  it("composes only existing UI primitives and semantic design tokens", () => {
    expect(source).toContain("<DataTable");
    expect(source).toContain("<InfoItem");
    expect(source).toContain("<Badge");
    expect(source).toContain("<Checkbox");
    expect(source).toContain("<InputGroup");
    expect(source).toMatch(
      /<InputGroup\s+className="w-full max-w-md border-border hover:border-border"\s+size="md"\s*>/
    );
    expect(source).toContain('className="h-full min-h-0"');
    expect(source).toContain("<Button");
    expect(source).toContain("bg-surface-floating");
    expect(source).not.toContain("shadow-raised");
    expect(source).toContain("border-border");
    expect(source).toContain(
      'className="border-[0.5px] border-border bg-surface-overlay text-fg-brand"'
    );
    expect(source).toContain("text-fg-brand");
    expect(source).toContain("mx-auto w-full max-w-screen-2xl");
    expect(source).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
  });

  it("keeps the designed defaults while making data, labels, and actions replaceable", () => {
    expect(source).toContain("resources?: readonly ResourceListItem[]");
    expect(source).toContain("labels?: Partial<ResourceListTableLabels>");
    expect(source).toContain(
      "renderBulkActions?: ("
    );
    expect(source).toContain(
      "context: ResourceListTableBulkActionContext"
    );
    expect(source).toContain("onEdit?: (resource: ResourceListItem) => void");
    expect(source).toContain('surface?: "framed" | "plain"');
    expect(source).toContain("preset?: ResourceListTablePreset");
    expect(source).toContain("showCreateAction?: boolean");
    expect(source).toContain("isLoading?: boolean");
    expect(source).toContain("queryState?: ResourceListTableQueryState");
    expect(source).toContain("categoryId?: string");
    expect(source).toContain("categoryIds?: readonly string[]");
    expect(source).toContain("sorting?: SortingState");
    expect(source).toContain(
      "onQueryStateChange?: (queryState: ResourceListTableQueryState) => void"
    );
    expect(source).toContain('surface = "framed"');
    expect(source).toContain("showCreateAction = true");
    expect(source).toContain("resources = []");
    expect(source).toContain('name: "平台基础信息"');
    expect(source).toContain('id: "platform.mn.basic"');
    expect(source).toContain('failurePolicy: "失败后继续并记录异常"');
    expect(source).toContain('id: "platform.mn.members"');
    expect(source).toContain("defaultMcpResourceListItems");
    expect(source).toContain('name: "飞书套件"');
    expect(source).toContain('from "@thesvg/icons/chrome"');
    expect(source).toContain('brandIcon: "microsoft-word"');
    expect(source).toContain('brandIcon: "wechat"');
    expect(source).toContain("defaultMcpCategoryItems");
    expect(source).not.toContain("defaultMcpCategoryApplications");
    expect(source).toContain('brandIcon: "gitlab"');
    expect(source).toContain('brandIcon: "figma"');
    expect(source).toContain('brandIcon: "salesforce"');
    expect(source).toContain('category: "代码开发"');
    expect(source).toContain('category: "创意设计"');
    expect(source).toContain('category: "销售"');
  });

  it("supports search, status filtering, selection, pagination, and accessible actions", () => {
    expect(source).toContain("resourceSearchFilter");
    expect(source).toContain("statusFilter");
    expect(source).toContain('enableRowSelection: preset === "resource"');
    expect(source).toContain("activeRowId={activeRowId}");
    expect(source).toContain("onRowActivate(row.original)");
    expect(source).toContain("toggleAllPageRowsSelected");
    expect(source).toMatch(
      /id: "select",[\s\S]*?maxSize: 44,[\s\S]*?minSize: 44,[\s\S]*?size: 44,/
    );
    expect(source.match(/className="mx-auto"/g)).toHaveLength(2);
    expect(source).toContain("DataTableFacetedFilter");
    expect(source).toContain('variant: "multiSelect"');
    expect(source).toContain("multiple");
    expect(source).toContain("manualFiltering: Boolean(queryState)");
    expect(source).toContain("manualPagination: Boolean(queryState)");
    expect(source).toContain("manualSorting: Boolean(queryState)");
    expect(source).toContain("categoryIds,");
    expect(source).toContain("sorting,");
    expect(source).toContain("rowCount: queryState ?");
    expect(source).toContain("filterIcon: StatusIcon");
    expect(source).toContain("filterIcon: CategoryIcon");
    expect(source).toMatch(
      /id: "actions",[\s\S]*?size="sm"[\s\S]*?variant="tertiary"/
    );
    expect(source).toMatch(/table\s*\.getSelectedRowModel\(\)/);
    expect(source).toContain("table.resetRowSelection()");
    expect(source).toContain('data-slot="resource-list-bulk-actions"');
    expect(source).toContain("labels.selectedCount(selectedCount)");
    expect(source).toContain(
      'preset === "resource" && selectedCount > 0 && Boolean(renderBulkActions)'
    );
    expect(source).toMatch(
      /aria-label=\{labels\.refresh\}[\s\S]*?onClick=\{onRefresh\}[\s\S]*?iconOnly[\s\S]*?size="md"[\s\S]*?variant="tertiary"/
    );
    expect(source).toMatch(/onClick=\{onCreate\}[\s\S]*?size="md"/);
    expect(source).toContain("{showCreateAction && (");
    expect(source).toContain('surface === "framed"');
    expect(source).toContain(': "min-w-0 w-full"');
    expect(source).toContain("aria-label={ariaLabel ?? labels.ariaLabel}");
  });
});
