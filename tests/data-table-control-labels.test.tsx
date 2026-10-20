// @vitest-environment jsdom

import type { ColumnDef } from "@tanstack/react-table";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DataTable, DataTableColumnHeader, DataTableFacetedFilter, useDataTable } from "../packages/ui/src/components/data-table";

afterEach(cleanup);
type Item = { name: string; status: string };
const data = [{ name: "Atlas", status: "running" }, { name: "Orion", status: "pending" }];
const copy = {
  en: { ascending: "Ascending", descending: "Descending", resetSorting: "Reset sorting", hideColumn: "Hide column", clearFilters: "Clear filters" },
  zh: { ascending: "升序", descending: "降序", resetSorting: "清除排序", hideColumn: "隐藏此列", clearFilters: "清空筛选" },
};

function Example({ localized }: { localized: boolean }) {
  const labels = localized ? copy.zh : undefined;
  const columns: ColumnDef<Item, unknown>[] = [
    { accessorKey: "name", header: ({ column }) => <DataTableColumnHeader column={column} label="Resource" labels={labels} /> },
    { accessorKey: "status", header: "Status", filterFn: (row, id, values: string[]) => values.includes(row.getValue(id)) },
  ];
  const { table } = useDataTable({ data, columns });
  return <DataTable table={table} showPagination={false}>
    <DataTableFacetedFilter column={table.getColumn("status")!} multiple title="Filter status" labels={labels} options={[{ value: "running", label: "Running" }]} />
  </DataTable>;
}

describe.each(["en", "zh"] as const)("DataTable controls: %s", (locale) => {
  it("localizes menus and facet clearing while retaining English defaults", async () => {
    const labels = copy[locale];
    render(<Example localized={locale === "zh"} />);
    fireEvent.click(screen.getByRole("button", { name: "Resource" }));
    expect(screen.getByRole("menuitemradio", { name: labels.ascending })).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: labels.hideColumn })).toBeTruthy();
    fireEvent.click(screen.getByRole("menuitemradio", { name: labels.descending }));
    fireEvent.click(screen.getByRole("button", { name: "Resource" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: labels.resetSorting }));
    fireEvent.click(screen.getByRole("button", { name: "Filter status" }));
    fireEvent.click(screen.getByRole("checkbox", { name: /Running/ }));
    expect(screen.queryByText("Orion")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: labels.clearFilters }));
    expect(screen.getByText("Orion")).toBeTruthy();
  });
});
