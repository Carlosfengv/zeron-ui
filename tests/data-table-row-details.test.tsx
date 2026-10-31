// @vitest-environment jsdom
import type { ColumnDef } from "@tanstack/react-table";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DataTable,
  useDataTable,
  type DataTableProps,
} from "../packages/ui/src/components/data-table";

afterEach(cleanup);
type Item = { id: string; name: string; day: string };
const items: Item[] = [
  { id: "a", name: "Alpha", day: "Monday" },
  { id: "b", name: "Beta", day: "Monday" },
  { id: "c", name: "Gamma", day: "Monday" },
  { id: "d", name: "Delta", day: "Tuesday" },
];
const columns: ColumnDef<Item, unknown>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <button
        onClick={() => row.toggleExpanded()}
        aria-expanded={row.getIsExpanded()}
      >
        {row.original.name}
      </button>
    ),
  },
  { accessorKey: "day", header: "Day" },
];
function Example({
  loading = false,
  data = items,
  renderExpandedRow,
}: {
  loading?: boolean;
  data?: Item[];
  renderExpandedRow?: DataTableProps<Item>["renderExpandedRow"];
}) {
  const { table } = useDataTable({
    data,
    columns,
    getRowId: (item) => item.id,
    getRowCanExpand: () => true,
    initialState: { pagination: { pageIndex: 0, pageSize: 2 } },
  });
  return (
    <DataTable
      table={table}
      isLoading={loading}
      onRowActivate={(row) => row.toggleExpanded()}
      renderRowHeader={({ row, previousRow }) =>
        previousRow?.original.day !== row.original.day
          ? row.original.day + " sessions"
          : null
      }
      renderExpandedRow={
        renderExpandedRow ?? (({ row }) => "Details for " + row.original.id)
      }
    >
      <button onClick={() => table.getColumn("day")?.toggleVisibility()}>
        Toggle day column
      </button>
    </DataTable>
  );
}
describe("DataTable presentation rows", () => {
  it("keeps headers and expanded details out of pagination counts and repeats a date header on page boundaries", () => {
    const { container } = render(<Example />);
    expect(screen.getByText("Page 1 of 2")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Alpha" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Beta" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Alpha" }));
    expect(screen.getByText("Details for a")).toBeTruthy();
    expect(
      container
        .querySelector('[data-slot="table-row"][data-row-id="a"]')
        ?.getAttribute("aria-expanded"),
    ).toBe("true");
    expect(screen.getByText("Page 1 of 2")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Go to next page" }));
    expect(screen.queryByText("Details for a")).toBeNull();
    expect(screen.getByText("Monday sessions")).toBeTruthy();
    expect(screen.getByText("Tuesday sessions")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Gamma" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Delta" })).toBeTruthy();
    expect(screen.getByText("Page 2 of 2")).toBeTruthy();
  });
  it("uses visible-column spans and does not double-toggle a nested control", () => {
    const { container } = render(<Example />);
    fireEvent.click(screen.getByRole("button", { name: "Alpha" }));
    const detail = screen.getByText("Details for a");
    expect(detail.closest("td")?.colSpan).toBe(2);
    fireEvent.click(screen.getByRole("button", { name: "Toggle day column" }));
    expect(screen.getByText("Details for a").closest("td")?.colSpan).toBe(1);
    expect(
      container.querySelector<HTMLTableCellElement>(
        '[data-slot="data-table-row-header"] td',
      )?.colSpan,
    ).toBe(1);
    const row = container.querySelector(
      '[data-slot="table-row"][data-row-id="a"]',
    )!;
    fireEvent.keyDown(row, { key: "Enter" });
    expect(screen.queryByText("Details for a")).toBeNull();
  });
  it("passes the original record to details and omits null detail content", () => {
    const renderExpandedRow = vi.fn<
      NonNullable<DataTableProps<Item>["renderExpandedRow"]>
    >(({ row }) =>
      row.original.id === "a" ? null : "Details for " + row.original.id,
    );
    const { container } = render(
      <Example renderExpandedRow={renderExpandedRow} />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Alpha" }));
    expect(renderExpandedRow.mock.calls.at(-1)?.[0].row.original).toBe(
      items[0],
    );
    expect(
      container.querySelector('[data-slot="data-table-expanded-row"]'),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Beta" }));
    expect(screen.getByText("Details for b")).toBeTruthy();
  });
  it("does not render presentation or detail rows during loading or for an empty dataset", () => {
    const { container, rerender } = render(<Example loading />);
    expect(
      container.querySelector('[data-slot="data-table-row-header"]'),
    ).toBeNull();
    expect(
      container.querySelector('[data-slot="data-table-expanded-row"]'),
    ).toBeNull();
    rerender(<Example data={[]} />);
    expect(screen.getByText("No results.")).toBeTruthy();
    expect(
      container.querySelector('[data-slot="data-table-row-header"]'),
    ).toBeNull();
  });
});
