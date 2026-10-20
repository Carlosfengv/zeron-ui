// @vitest-environment jsdom

import type { ColumnDef } from "@tanstack/react-table";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SectionedDataTable } from "../packages/blocks/src/application/grouped-data-table-02/sectioned-data-table";
import { sectionedDataTableEnLabels } from "../packages/blocks/src/application/grouped-data-table-02/sectioned-data-table-labels";
import type { SectionedDataTableDimension } from "../packages/blocks/src/application/grouped-data-table-02/sectioned-data-table-types";
import { DataTableColumnHeader, DataTableFacetedFilter } from "../packages/ui/src/components/data-table";

afterEach(cleanup);
type Item = { id: string; name: string; status: string; provider: string; region: string };
const data: Item[] = [
  { id: "a", name: "Atlas", status: "running", provider: "private", region: "East" },
  { id: "b", name: "Beacon", status: "running", provider: "public", region: "East" },
  { id: "c", name: "Canvas", status: "running", provider: "private", region: "West" },
  { id: "d", name: "Drift", status: "running", provider: "public", region: "West" },
  { id: "e", name: "Ember", status: "pending", provider: "private", region: "East" },
];
const columns: ColumnDef<Item, unknown>[] = [
  { accessorKey: "name", header: ({ column }) => <DataTableColumnHeader column={column} label="Name" />, enableHiding: false },
  { accessorKey: "status", header: "Status", enableHiding: false, filterFn: (row, id, values: string[]) => values.includes(row.getValue(id)) },
  { accessorKey: "provider", header: "Provider", enableHiding: false },
  { accessorKey: "region", header: "Region", meta: { label: "Region" } },
];
const dimensions: [SectionedDataTableDimension, ...SectionedDataTableDimension[]] = [
  { columnId: "status", label: "Status", groups: [{ value: "pending", label: "Pending" }, { value: "running", label: "Running" }] },
  { columnId: "provider", label: "Provider", groups: [{ value: "private", label: "Private" }, { value: "public", label: "Public" }] },
];
const props = { data, columns, dimensions, getRowId: (item: Item) => item.id, labels: sectionedDataTableEnLabels };
const switchTo = (label: string) => fireEvent.click(screen.getByRole("tab", { name: label }));

describe("SectionedDataTable", () => {
  it("renders separate tables and headers with shared full counts and per-section previews", () => {
    const { container } = render(<SectionedDataTable {...props} />);
    expect(screen.getAllByRole("table")).toHaveLength(2);
    expect(screen.getAllByRole("columnheader", { name: /Name/ })).toHaveLength(2);
    expect(screen.queryByRole("columnheader", { name: "Status" })).toBeNull();
    expect(container.querySelector('[data-slot="table-section"]')?.textContent).toContain("Pending");
    expect(screen.queryByText("Drift")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Show 1 more in Running" }));
    expect(screen.getByText("Drift")).toBeTruthy();
    expect(screen.getByText("5 matching of 5 records")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Show less in Running" }));
    expect(screen.queryByText("Drift")).toBeNull();
  });

  it("remembers expansion and preview state separately for each dimension", () => {
    render(<SectionedDataTable {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Show 1 more in Running" }));
    fireEvent.click(screen.getByRole("button", { name: "Collapse Pending" }));
    switchTo("Provider");
    expect(screen.getAllByRole("table")).toHaveLength(2);
    expect(screen.getByText("Ember")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Collapse Public" }));
    switchTo("Status");
    expect(screen.getByText("Drift")).toBeTruthy();
    expect(screen.queryByText("Ember")).toBeNull();
    switchTo("Provider");
    expect(screen.queryByText("Beacon")).toBeNull();
    expect(screen.getByText("5 matching of 5 records")).toBeTruthy();
  });

  it("searches hidden preview records and preserves queries across dimension switches", () => {
    render(<SectionedDataTable {...props} />);
    fireEvent.change(screen.getByRole("textbox", { name: "Search records" }), { target: { value: "Drift" } });
    expect(screen.getByText("Drift")).toBeTruthy();
    switchTo("Provider");
    expect(screen.getByText("Drift")).toBeTruthy();
    expect(screen.getByText("1 matching of 5 records")).toBeTruthy();
    expect(screen.queryByText("Atlas")).toBeNull();
    fireEvent.change(screen.getByRole("textbox", { name: "Search records" }), { target: { value: "missing" } });
    expect(screen.getByText("No matching records")).toBeTruthy();
    fireEvent.click(screen.getAllByRole("button", { name: "Clear filters" })[0]);
    expect(screen.getByText("Atlas")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Provider" }).getAttribute("aria-selected")).toBe("true");
  });

  it("keeps facet filters and matching summary rows independent of preview and collapse", () => {
    const summary = vi.fn(({ rows }: { rows: unknown[] }) => <span>Metrics {rows.length}</span>);
    render(<SectionedDataTable {...props} renderStats={summary} renderFilters={(table) => <DataTableFacetedFilter column={table.getColumn("status")!} title="Filter status" options={[{ label: "Running only", value: "running" }]} />} />);
    expect(screen.getByText("Metrics 5")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Filter status" }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Running only/ }));
    expect(screen.getByText("4 matching of 5 records")).toBeTruthy();
    expect(screen.getByText("Metrics 4")).toBeTruthy();
    switchTo("Provider");
    expect(screen.queryByText("Ember")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Collapse Private" }));
    expect(screen.getByText("Metrics 4")).toBeTruthy();
  });

  it("shares sorting across tables before clipping and keeps configured group order", async () => {
    const { container } = render(<SectionedDataTable {...props} />);
    fireEvent.click(screen.getAllByRole("button", { name: "Name" })[0]);
    fireEvent.click(await screen.findByRole("menuitemradio", { name: "Descending" }));
    expect(screen.getByText("Drift")).toBeTruthy();
    expect(screen.queryByText("Atlas")).toBeNull();
    const sections = container.querySelectorAll('[data-slot="table-section"]');
    expect(sections[0].getAttribute("data-group-value")).toBe("pending");
    expect(Array.from(sections[1].querySelectorAll("tbody tr")).map((row) => row.querySelector("td")?.textContent)).toEqual(["Drift", "Canvas", "Beacon"]);
    switchTo("Provider");
    expect(container.querySelector('[data-group-value="private"] tbody tr')?.textContent).toContain("Ember");
  });

  it("shares column visibility across all sections and dimension changes", () => {
    render(<SectionedDataTable {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Customize columns" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Show Region column" }));
    expect(screen.queryByRole("columnheader", { name: "Region" })).toBeNull();
    switchTo("Provider");
    expect(screen.queryByRole("columnheader", { name: "Region" })).toBeNull();
    expect(screen.getAllByRole("columnheader", { name: "Status" })).toHaveLength(2);
    expect(screen.queryByRole("columnheader", { name: "Provider" })).toBeNull();
  });

  it("returns stable creation context and isolates row actions", () => {
    const add = vi.fn();
    const activate = vi.fn();
    const { rerender } = render(<SectionedDataTable {...props} onAddToGroup={add} onRowActivate={activate} />);
    fireEvent.click(screen.getByRole("button", { name: "Add to Pending" }));
    expect(add).toHaveBeenCalledWith({ columnId: "status", value: "pending" });
    expect(activate).not.toHaveBeenCalled();
    switchTo("Provider");
    fireEvent.click(screen.getByRole("button", { name: "Add to Public" }));
    expect(add).toHaveBeenLastCalledWith({ columnId: "provider", value: "public" });
    fireEvent.click(screen.getByText("Atlas"));
    expect(activate).toHaveBeenCalledWith(data[0]);
    rerender(<SectionedDataTable {...props} />);
    expect(screen.queryByRole("button", { name: "Add to Public" })).toBeNull();
  });

  it("waits for controlled grouping props and falls back from invalid IDs", () => {
    const change = vi.fn();
    const { rerender } = render(<SectionedDataTable {...props} groupBy="status" onGroupByChange={change} />);
    switchTo("Provider");
    expect(change).toHaveBeenCalledWith("provider");
    expect(screen.getByRole("button", { name: "Collapse Pending" })).toBeTruthy();
    rerender(<SectionedDataTable {...props} groupBy="provider" onGroupByChange={change} />);
    expect(screen.getByRole("button", { name: "Collapse Private" })).toBeTruthy();
    rerender(<SectionedDataTable {...props} groupBy="invalid" />);
    expect(screen.getByRole("button", { name: "Collapse Pending" })).toBeTruthy();
  });

  it("shows unknown groups, handles refreshes and never paginates the matching dataset", () => {
    const extra = Array.from({ length: 13 }, (_, i) => ({ ...data[0], id: `extra-${i}`, name: `Extra ${i}`, status: "unknown" }));
    const { rerender } = render(<SectionedDataTable {...props} data={[...data, ...extra]} />);
    fireEvent.click(screen.getByRole("button", { name: "Show 10 more in unknown" }));
    expect(screen.getByText("Extra 12")).toBeTruthy();
    expect(screen.getByText("18 matching of 18 records")).toBeTruthy();
    rerender(<SectionedDataTable {...props} data={[...data, ...extra, { ...data[0], id: "last", name: "Last", status: "unknown" }]} />);
    expect(screen.getByText("Last")).toBeTruthy();
    expect(screen.queryByRole("combobox", { name: "Rows per page" })).toBeNull();
  });

  it("shows loading, empty and retryable error states without mock injection", () => {
    const retry = vi.fn();
    const { container, rerender } = render(<SectionedDataTable {...props} state="loading" />);
    expect(container.querySelector('[data-slot="table-skeleton-body"]')).toBeTruthy();
    expect(screen.queryByText("Atlas")).toBeNull();
    rerender(<SectionedDataTable {...props} data={[]} />);
    expect(screen.getByText("No records yet")).toBeTruthy();
    rerender(<SectionedDataTable {...props} state="error" onRetry={retry} errorMessage="Offline" />);
    expect(within(screen.getByRole("alert")).getByText("Offline")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(retry).toHaveBeenCalledOnce();
  });
});
