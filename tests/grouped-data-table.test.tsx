// @vitest-environment jsdom

import { type ColumnDef, type ExpandedState } from "@tanstack/react-table";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { GroupedDataTable } from "../packages/blocks/src/application/grouped-data-table-01/grouped-data-table";
import { groupedDataTableEnLabels } from "../packages/blocks/src/application/grouped-data-table-01/grouped-data-table-labels";
import { DataTableColumnHeader, DataTableFacetedFilter } from "../packages/ui/src/components/data-table";

afterEach(cleanup);
type Item = { id: string; name: string; stage: string; status: string };
const data: Item[] = [
  { id: "a", name: "Atlas", stage: "review", status: "active" },
  { id: "b", name: "Beacon", stage: "review", status: "draft" },
  { id: "c", name: "Canvas", stage: "review", status: "active" },
  { id: "d", name: "Drift", stage: "review", status: "active" },
  { id: "e", name: "Ember", stage: "done", status: "draft" },
];
const columns: ColumnDef<Item, unknown>[] = [
  { accessorKey: "name", header: ({ column }) => <DataTableColumnHeader column={column} label="Name" />, meta: { label: "Name" } },
  { accessorKey: "stage", header: "Stage", enableHiding: false },
  { accessorKey: "status", header: "Status", filterFn: (row, id, values: string[]) => values.includes(row.getValue(id)), meta: { label: "Status" } },
];
const groups = [{ value: "done", label: "Done", description: "Finished work" }, { value: "review", label: "Review" }];
const props = { columns, data, groupBy: "stage", getRowId: (item: Item) => item.id, groups, labels: groupedDataTableEnLabels };

describe("GroupedDataTable", () => {
  it("previews records per group, reveals and restores them without changing counts", () => {
    const { container } = render(<GroupedDataTable {...props} />);
    expect(screen.queryByText("Drift")).toBeNull();
    expect(screen.getByText("Ember")).toBeTruthy();
    expect(screen.getByText("5 matching of 5 records")).toBeTruthy();
    expect(container.querySelector('[data-slot="data-table-group"]')?.textContent).toContain("Done");
    fireEvent.click(screen.getByRole("button", { name: "Show 1 more in Review" }));
    expect(screen.getByText("Drift")).toBeTruthy();
    expect(screen.getByText("5 matching of 5 records")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Show less in Review" }));
    expect(screen.queryByText("Drift")).toBeNull();
  });

  it("collapses one group independently and supports collapse/expand all", () => {
    render(<GroupedDataTable {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Collapse Review" }));
    expect(screen.queryByText("Atlas")).toBeNull();
    expect(screen.getByText("Ember")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Expand all" }));
    expect(screen.getByText("Atlas")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Collapse all" }));
    expect(screen.queryByText("Atlas")).toBeNull();
    expect(screen.queryByText("Ember")).toBeNull();
    expect(screen.getByText("5 matching of 5 records")).toBeTruthy();
    expect(screen.queryByRole("combobox", { name: "Rows per page" })).toBeNull();
  });

  it("searches all records, recomputes group counts and clears an unmatched query", () => {
    render(<GroupedDataTable {...props} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Search records" }), { target: { value: "Drift" } });
    expect(screen.getByText("Drift")).toBeTruthy();
    expect(screen.queryByText("Atlas")).toBeNull();
    expect(screen.getByText("1 matching of 5 records")).toBeTruthy();
    const group = screen.getByRole("button", { name: "Collapse Review" }).closest("tr")!;
    expect(within(group).getByText("1")).toBeTruthy();
    fireEvent.change(screen.getByRole("textbox", { name: "Search records" }), { target: { value: "missing" } });
    expect(screen.getByText("No matching records")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Clear filters" })[0]);
    expect(screen.getByText("Atlas")).toBeTruthy();
    expect(screen.getByText("5 matching of 5 records")).toBeTruthy();
  });

  it("composes public facet filters and counts the filtered group", () => {
    render(<GroupedDataTable {...props} renderFilters={(table) => <DataTableFacetedFilter column={table.getColumn("status")!} title="Filter status" multiple labels={{ clearFilters: "清空筛选" }} options={[{ label: "Active", value: "active" }]} />} />);
    fireEvent.click(screen.getByRole("button", { name: "Filter status" }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Active/ }));
    expect(screen.queryByText("Beacon")).toBeNull();
    expect(screen.queryByText("Ember")).toBeNull();
    expect(screen.getByText("3 matching of 5 records")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Show 1 more in Review" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "清空筛选" }));
    expect(screen.getByText("5 matching of 5 records")).toBeTruthy();
  });

  it("updates group colspan through the built-in column-visibility control", () => {
    render(<GroupedDataTable {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Customize columns" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Show Status column" }));
    expect(screen.getByRole("button", { name: "Collapse Review" }).closest("td")?.colSpan).toBe(1);
    expect(screen.queryByRole("columnheader", { name: "Status" })).toBeNull();
  });

  it("sorts records within groups while preserving the configured group order", async () => {
    const { container } = render(<GroupedDataTable {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Name" }));
    fireEvent.click(await screen.findByRole("menuitemradio", { name: "Descending" }));
    const rows = Array.from(container.querySelectorAll("tbody tr")).map((row) => row.textContent);
    expect(rows[0]).toContain("Done");
    expect(screen.getByText("Drift")).toBeTruthy();
    expect(screen.queryByText("Atlas")).toBeNull();
    expect(rows.findIndex((row) => row?.includes("Drift"))).toBeLessThan(rows.findIndex((row) => row?.includes("Canvas")));
  });

  it("emits controlled expansion changes and waits for updated props", () => {
    const onExpandedChange = vi.fn();
    const { rerender } = render(<GroupedDataTable {...props} expanded={true} onExpandedChange={onExpandedChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Collapse all" }));
    expect(onExpandedChange).toHaveBeenCalled();
    expect(screen.getByText("Atlas")).toBeTruthy();
    const updater = onExpandedChange.mock.calls[0][0];
    const next: ExpandedState = typeof updater === "function" ? updater(true) : updater;
    rerender(<GroupedDataTable {...props} expanded={next} onExpandedChange={onExpandedChange} />);
    expect(screen.queryByText("Atlas")).toBeNull();
  });

  it("preserves stable expansion and preview state when data changes", () => {
    const { rerender } = render(<GroupedDataTable {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Show 1 more in Review" }));
    fireEvent.click(screen.getByRole("button", { name: "Collapse Done" }));
    rerender(<GroupedDataTable {...props} data={[...data, { id: "f", name: "Folio", stage: "review", status: "active" }]} />);
    expect(screen.getByText("Folio")).toBeTruthy();
    expect(screen.queryByText("Ember")).toBeNull();
    expect(screen.getByText("6 matching of 6 records")).toBeTruthy();
  });

  it("shows loading, empty and actionable error states without demo data", () => {
    const retry = vi.fn();
    const { container, rerender } = render(<GroupedDataTable {...props} state="loading" />);
    expect(container.querySelector('[data-slot="table-skeleton-body"]')).toBeTruthy();
    expect(screen.queryByText("Atlas")).toBeNull();
    rerender(<GroupedDataTable {...props} data={[]} />);
    expect(screen.getByText("No records yet")).toBeTruthy();
    rerender(<GroupedDataTable {...props} state="error" onRetry={retry} errorMessage="Connection failed" />);
    expect(screen.getByRole("alert").textContent).toContain("Connection failed");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
