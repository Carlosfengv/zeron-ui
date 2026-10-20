// @vitest-environment jsdom

import { getExpandedRowModel, getGroupedRowModel, type ColumnDef, type Table } from "@tanstack/react-table";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DataTable, useDataTable, type DataTableGroupingOptions } from "../packages/ui/src/components/data-table";

afterEach(cleanup);

type Item = { id: string; name: string; team: string; status: string };
const data: Item[] = [
  { id: "a", name: "Atlas", team: "Design", status: "Active" },
  { id: "b", name: "Beacon", team: "Design", status: "Active" },
  { id: "c", name: "Canvas", team: "Engineering", status: "Draft" },
];
const columns: ColumnDef<Item, unknown>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "team", header: "Team" },
  { accessorKey: "status", header: "Status" },
];

function Example({ grouping, nested = false, loading = false, onActivate, expose, density, items = data, paginated = false }: {
  grouping?: DataTableGroupingOptions<Item>;
  nested?: boolean;
  loading?: boolean;
  onActivate?: (name: string) => void;
  expose?: (table: Table<Item>) => void;
  density?: "comfortable" | "compact";
  items?: Item[];
  paginated?: boolean;
}) {
  const { table } = useDataTable({
    columns, data: items, getRowId: (item) => item.id,
    getGroupedRowModel: getGroupedRowModel(), getExpandedRowModel: getExpandedRowModel(),
    initialState: { grouping: nested ? ["team", "status"] : ["team"], expanded: true, pagination: { pageIndex: 0, pageSize: 2 } },
    groupedColumnMode: "remove", manualPagination: !paginated,
  });
  expose?.(table);
  return <DataTable table={table} grouping={grouping} density={density} showPagination={false} isLoading={loading}
    onRowActivate={onActivate ? (row) => onActivate(row.original.name) : undefined}>
    <button onClick={() => table.getColumn("status")?.toggleVisibility()}>Toggle status</button>
    {paginated && <button onClick={() => table.nextPage()}>Next page</button>}
  </DataTable>;
}

describe("DataTable grouped row rendering", () => {
  it("renders spanning group headers with filtered leaf counts and independent expansion", () => {
    const { container } = render(<Example />);
    expect(container.querySelectorAll('[data-slot="data-table-group"]')).toHaveLength(2);
    const design = screen.getByRole("button", { name: "Collapse Design" });
    expect(design.getAttribute("aria-expanded")).toBe("true");
    expect(within(design.closest("tr")!).getByText("2")).toBeTruthy();
    expect(design.closest("td")?.colSpan).toBe(2);
    fireEvent.click(design);
    expect(screen.queryByText("Atlas")).toBeNull();
    expect(screen.queryByText("Beacon")).toBeNull();
    expect(screen.getByText("Canvas")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Expand Design" }));
    expect(screen.getByText("Atlas")).toBeTruthy();
  });

  it("recalculates group and footer colspan when visible columns change", () => {
    render(<Example grouping={{ renderFooter: () => "Group end" }} />);
    fireEvent.click(screen.getByRole("button", { name: "Toggle status" }));
    expect(screen.getByRole("button", { name: "Collapse Design" }).closest("td")?.colSpan).toBe(1);
    for (const footer of screen.getAllByText("Group end")) expect(footer.closest("td")?.colSpan).toBe(1);
  });

  it("limits presentation without altering source rows, counts or other groups", () => {
    let table: Table<Item> | undefined;
    render(<Example expose={(value) => { table = value; }} grouping={{
      getRowLimit: () => 1,
      renderFooter: ({ leafRowCount, visibleRowCount }) => `${visibleRowCount} shown of ${leafRowCount}`,
    }} />);
    expect(screen.queryByText("Beacon")).toBeNull();
    expect(screen.getByText("1 shown of 2")).toBeTruthy();
    expect(screen.getByText("Canvas")).toBeTruthy();
    expect(table!.getFilteredRowModel().rows).toHaveLength(3);
  });

  it("counts only records in nested groups and hides descendants and footers on collapse", () => {
    render(<Example nested grouping={{ renderFooter: ({ row }) => `End ${row.id}` }} />);
    const design = screen.getByRole("button", { name: "Collapse Design" });
    expect(within(design.closest("tr")!).getByText("2")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Collapse Active" })).toBeTruthy();
    fireEvent.click(design);
    expect(screen.queryByRole("button", { name: "Collapse Active" })).toBeNull();
    expect(screen.queryByText("Atlas")).toBeNull();
    expect(screen.queryByText("End team:Design")).toBeNull();
    expect(screen.getByText("Canvas")).toBeTruthy();
  });

  it("keeps group interactions separate from record activation and customizes labels", () => {
    const activate = vi.fn();
    render(<Example onActivate={activate} grouping={{ labels: { collapseGroup: (label) => `收起 ${label}` } }} />);
    fireEvent.click(screen.getByRole("button", { name: "收起 Design" }));
    expect(activate).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Canvas"));
    expect(activate).toHaveBeenCalledWith("Canvas");
  });

  it("supports stable group order and header content with aggregate access", () => {
    const { container } = render(<Example grouping={{
      getOrder: (row) => row.groupingValue === "Engineering" ? 0 : 1,
      renderHeader: ({ row, leafRowCount }) => `Team ${String(row.groupingValue)} (${leafRowCount})`,
    }} />);
    expect(container.querySelector('[data-slot="data-table-group"]')?.textContent).toContain("Team Engineering (1)");
  });

  it("orders nested groups before applying a direct-child preview limit", () => {
    render(<Example nested items={data.map((item) => item.id === "b" ? { ...item, status: "Draft" } : item)} grouping={{
      getOrder: (row) => row.groupingValue === "Draft" ? 0 : 1,
      getRowLimit: (row) => row.depth === 0 ? 1 : undefined,
    }} />);
    expect(screen.getByText("Beacon")).toBeTruthy();
    expect(screen.queryByText("Atlas")).toBeNull();
    expect(screen.queryByRole("button", { name: "Collapse Active" })).toBeNull();
  });

  it("does not reintroduce off-page records when groups span global pages", () => {
    render(<Example paginated />);
    expect(screen.getByText("Atlas")).toBeTruthy();
    expect(screen.queryByText("Beacon")).toBeNull();
    expect(screen.queryByText("Canvas")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.queryByText("Atlas")).toBeNull();
    expect(screen.getByText("Beacon")).toBeTruthy();
    expect(screen.queryByText("Canvas")).toBeNull();
  });

  it("preserves loading and exposes density through a public recipe", () => {
    const { container, rerender } = render(<Example density="compact" />);
    expect(container.querySelector('[data-slot="data-table"]')?.getAttribute("data-density")).toBe("compact");
    expect(screen.getByText("Atlas").closest("td")?.className).toContain("py-1");
    rerender(<Example density="compact" loading />);
    expect(screen.queryByRole("button", { name: "Collapse Design" })).toBeNull();
    expect(container.querySelector('[data-slot="table-skeleton-body"]')).toBeTruthy();
  });
});
