import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const dataTableSource = readFileSync(
  join(ROOT, "packages/ui/src/components/data-table.tsx"),
  "utf8"
);
const exampleSource = readFileSync(
  join(ROOT, "docs/pages/components/data-table/data-table-examples.tsx"),
  "utf8"
);

describe("DataTable empty-state contract", () => {
  it("renders the shared Empty pattern instead of a bare message", () => {
    expect(dataTableSource).toContain('from "#components/empty"');
    expect(dataTableSource).toContain("emptyState ?? (");
    expect(dataTableSource).toContain('isFilteredEmpty ? "no-filter-results" : "no-data"');
    expect(dataTableSource).toContain('variant={isFilteredEmpty ? "filter" : "resources"}');
  });

  it("lets users recover from an empty filtered result", () => {
    expect(dataTableSource).toContain("table.resetColumnFilters()");
    expect(dataTableSource).toContain("Clear filters");
    expect(dataTableSource).toContain("table.getPreFilteredRowModel().rows.length > 0");
    expect(dataTableSource).toContain("announce={isFilteredEmpty}");
  });

  it("documents a resource-specific project zero state", () => {
    expect(exampleSource).toContain("No projects found.");
    expect(exampleSource).toContain('reason="first-use"');
    expect(exampleSource).toContain('variant="resources"');
    expect(exampleSource).toContain("Create project");
  });
});
