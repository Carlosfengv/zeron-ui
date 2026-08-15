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
      dependencies: ["tw-animate-css", "@tanstack/react-table"],
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
    expect(source).toContain('className="h-control-sm w-full max-w-[450px] border-border hover:border-border"');
    expect(source).toContain('className="h-full min-h-0"');
    expect(source).toContain("<Button");
    expect(source).toContain("bg-surface-floating");
    expect(source).not.toContain("shadow-raised");
    expect(source).toContain("border-border");
    expect(source).toContain("text-fg-brand");
    expect(source).toContain("mx-auto w-full max-w-[1620px]");
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
    expect(source).toContain('name: "平台基础信息"');
    expect(source).toContain('id: "platform.mn.basic"');
    expect(source).toContain('failurePolicy: "失败后继续并记录异常"');
    expect(source).toContain('id: "platform.mn.members"');
  });

  it("supports search, status filtering, selection, pagination, and accessible actions", () => {
    expect(source).toContain("resourceSearchFilter");
    expect(source).toContain("statusFilter");
    expect(source).toContain("enableRowSelection: true");
    expect(source).toContain("toggleAllPageRowsSelected");
    expect(source).toContain("DataTableFacetedFilter");
    expect(source).toContain('variant: "multiSelect"');
    expect(source).toContain("multiple");
    expect(source).toContain("filterIcon: StatusIcon");
    expect(source).toMatch(/table\s*\.getSelectedRowModel\(\)/);
    expect(source).toContain("table.resetRowSelection()");
    expect(source).toContain('data-slot="resource-list-bulk-actions"');
    expect(source).toContain("labels.selectedCount(selectedCount)");
    expect(source).toContain(
      "showBulkToolbar = selectedCount > 0 && Boolean(renderBulkActions)"
    );
    expect(source).toMatch(
      /aria-label=\{labels\.refresh\}[\s\S]*?onClick=\{onRefresh\}[\s\S]*?size="icon-sm"[\s\S]*?variant="tertiary"/
    );
    expect(source).toMatch(/onClick=\{onCreate\}[\s\S]*?size="md"/);
    expect(source).toContain("aria-label={ariaLabel ?? labels.ariaLabel}");
  });
});
