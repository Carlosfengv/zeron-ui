import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const tableSource = readFileSync(
  join(ROOT, "packages/ui/src/components/table.tsx"),
  "utf8"
);
const dataTableSource = readFileSync(
  join(ROOT, "packages/ui/src/components/data-table.tsx"),
  "utf8"
);
const registry = JSON.parse(
  readFileSync(join(ROOT, "packages/ui/registry.json"), "utf8")
);

describe("table loading contract", () => {
  it("provides a semantic, composable Skeleton table body", () => {
    expect(tableSource).toContain("interface TableSkeletonBodyProps");
    expect(tableSource).toContain('data-slot="table-skeleton-body"');
    expect(tableSource).toContain('"aria-hidden": ariaHidden = true');
    expect(tableSource).toContain("renderCell?:");
    expect(tableSource).toContain("getCellProps?:");
    expect(tableSource).toContain("TableSkeletonBody,");
  });

  it("lets DataTable own the loading state without showing Empty", () => {
    expect(dataTableSource).toContain("isLoading?: boolean");
    expect(dataTableSource).toContain("loadingRowCount?: number");
    expect(dataTableSource).toContain("renderLoadingCell?:");
    expect(dataTableSource).toContain("isLoading ? (");
    expect(dataTableSource).toContain("<TableSkeletonBody");
    expect(dataTableSource).toContain('aria-atomic="true"');
    expect(dataTableSource).toContain(
      "loadingRowCount ?? table.getState().pagination.pageSize"
    );
    expect(dataTableSource).toContain(
      "aria-busy={ariaBusy ?? (isLoading || undefined)}"
    );
    expect(dataTableSource).toContain("!isLoading && actionBar");
  });

  it("ships Skeleton through the Table registry dependency", () => {
    const table = registry.items.find(
      (item: { name: string }) => item.name === "table"
    );
    expect(table.registryDependencies).toContain("skeleton");
  });
});
