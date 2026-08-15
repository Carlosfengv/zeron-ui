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
const pageSource = readFileSync(
  join(ROOT, "docs/pages/components/data-table/page.tsx"),
  "utf8"
);

describe("DataTable pinned-column contract", () => {
  it("documents two pinned columns on the left and the last column on the right", () => {
    expect(exampleSource).toContain(
      'columnPinning: { left: ["select", "name"], right: ["budget"] }'
    );
    expect(exampleSource).toContain(
      'className={forceHorizontalScroll ? "[&_table]:min-w-[960px]" : undefined}'
    );
    expect(pageSource).toContain('<DocSection title={t("pinnedColumns")}>');
    expect(pageSource).toContain("<PinnedProjectsTable />");
    expect(pageSource).toContain(
      'const pinnedColumnsCode = `"use client";'
    );
    expect(pageSource).toContain("export function PinnedProjectsTable() {");
    expect(pageSource).toContain(
      '<DataTableToolbar table={table} />'
    );
  });

  it("shows pinned-column shadows only when content remains beyond that edge", () => {
    expect(dataTableSource).toContain("scrollContainer.scrollWidth");
    expect(dataTableSource).toContain("scrollContainer.clientWidth");
    expect(dataTableSource).toContain("scrollContainer.scrollLeft > 1");
    expect(dataTableSource).toContain(
      "scrollContainer.scrollLeft < maxScrollLeft - 1"
    );
    expect(dataTableSource).toContain(
      "isLastLeftPinnedColumn && showLeftShadow"
    );
    expect(dataTableSource).toContain(
      "isFirstRightPinnedColumn && showRightShadow"
    );
  });

  it("remeasures scroll edges when the container or table changes size", () => {
    expect(dataTableSource).toContain("new ResizeObserver(updateScrollEdges)");
    expect(dataTableSource).toContain(
      "resizeObserver.observe(scrollContainer)"
    );
    expect(dataTableSource).toContain("resizeObserver.observe(tableElement)");
  });

  it("vertically centers header, body, and empty-state cells", () => {
    expect(dataTableSource).toContain(
      'className="h-control-md align-middle whitespace-nowrap [&>[data-slot=checkbox]]:block"'
    );
    expect(dataTableSource).toContain(
      '"align-middle whitespace-nowrap [&>[data-slot=checkbox]]:block"'
    );
    expect(dataTableSource).toContain(
      'className="h-24 align-middle text-center text-fg-muted"'
    );
  });
});
