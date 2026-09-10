import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const dataTableSource = readFileSync(
  join(ROOT, "packages/ui/src/components/data-table.tsx"),
  "utf8"
);
const personalSettingsSource = readFileSync(
  join(
    ROOT,
    "packages/blocks/src/application/personal-settings-01/personal-settings.tsx"
  ),
  "utf8"
);

describe("DataTable pagination contract", () => {
  it("keeps a controlled page size available in the rows-per-page select", () => {
    expect(dataTableSource).toContain(
      "const pageSize = table.getState().pagination.pageSize;"
    );
    expect(dataTableSource).toContain("const resolvedPageSizeOptions = pageSizeOptions.includes(pageSize)");
    expect(dataTableSource).toContain("[...pageSizeOptions, pageSize].sort((left, right) => left - right)");
    expect(dataTableSource).toContain("resolvedPageSizeOptions.map((option) =>");
  });

  it("supports disabled and localized pagination through public props", () => {
    expect(dataTableSource).toContain("disabled?: boolean");
    expect(dataTableSource).toContain("labels?: Partial<DataTablePaginationLabels>");
    expect(dataTableSource).toContain("disabled={disabled || !table.getCanNextPage()}");
    expect(dataTableSource).toContain("{labels.pageSummary(");
    expect(dataTableSource).toContain("px-2 py-1 text-body");
  });

  it("keeps externally supplied settings table data stable while pagination updates", () => {
    expect(personalSettingsSource).toContain(
      "const data = useMemo(() => [...apiKeys], [apiKeys]);"
    );
    expect(personalSettingsSource).toContain(
      "const data = useMemo(() => [...credentials], [credentials]);"
    );
    expect(personalSettingsSource).not.toContain("data: [...apiKeys]");
    expect(personalSettingsSource).not.toContain("data: [...credentials]");
  });
});
