// @vitest-environment jsdom

import type { ColumnDef } from "@tanstack/react-table";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { DataTable, useDataTable, type DataTableProps } from "../packages/ui/src/components/data-table";

afterEach(cleanup);

type Item = { id: string; name: string; region: string };
const data: Item[] = [{ id: "a", name: "Alpha", region: "East" }];
const backgroundColor = "var(--success-surface)";
const columns: ColumnDef<Item, unknown>[] = [
  { accessorKey: "name", header: "Name", cell: ({ row }) => <input aria-label="Edit name" defaultValue={row.original.name} /> },
  { accessorKey: "region", header: "Region" },
];

function Example({ variant, loading = false }: { variant?: DataTableProps<Item>["variant"]; loading?: boolean }) {
  const { table } = useDataTable({ data, columns, getRowId: (item) => item.id, initialState: { columnPinning: { left: ["name"] } } });
  return <DataTable table={table} activeRowId="a" showPagination={false} variant={variant} style={{ backgroundColor }} isLoading={loading} />;
}

describe("DataTable embedded surface", () => {
  it("preserves the default framed surface for existing consumers", () => {
    const { container } = render(<Example />);
    expect(container.querySelector('[data-slot="data-table"]')?.getAttribute("data-variant")).toBe("framed");
    expect(screen.getByRole("columnheader", { name: "Name" }).style.backgroundColor).toBe("var(--surface-floating)");
  });

  it("shares the supplied surface with pinned cells without remounting edited or focused content", () => {
    const { rerender } = render(<Example />);
    const table = screen.getByRole("table");
    const input = screen.getByRole("textbox", { name: "Edit name" });
    fireEvent.change(input, { target: { value: "Edited" } });
    input.focus();
    rerender(<Example variant="embedded" />);
    expect(screen.getByRole("table")).toBe(table);
    expect(screen.getByRole("textbox", { name: "Edit name" })).toBe(input);
    expect((input as HTMLInputElement).value).toBe("Edited");
    expect(document.activeElement).toBe(input);
    expect(input.closest("tr")?.getAttribute("aria-selected")).toBe("true");
    expect(input.closest("td")?.style.backgroundColor).toBe(backgroundColor);
    expect(screen.getByRole("columnheader", { name: "Name" }).style.backgroundColor).toBe(backgroundColor);
    expect(screen.getByRole("columnheader", { name: "Region" }).style.backgroundColor).toBe("");
  });

  it("keeps pinned loading placeholders on the same embedded surface", () => {
    const { container } = render(<Example variant="embedded" loading />);
    const cells = container.querySelectorAll<HTMLTableCellElement>('[data-slot="table-skeleton-body"] tr:first-child td');
    expect(cells[0].style.backgroundColor).toBe(backgroundColor);
    expect(cells[1].style.backgroundColor).toBe("");
    expect(screen.queryByRole("textbox", { name: "Edit name" })).toBeNull();
  });
});
