// @vitest-environment jsdom
import type { ColumnDef } from "@tanstack/react-table";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { DataTable, useDataTable } from "../packages/ui/src/components/data-table";

afterEach(cleanup);
type Resource = { id: string; name: string };
const data = [{ id: "gpu", name: "GPU" }];
const columns: ColumnDef<Resource, unknown>[] = [{ accessorKey: "name", header: "Resource" }];

function ResourceTable({ showPagination = false, isLoading = false }: { showPagination?: boolean; isLoading?: boolean }) {
  const { table } = useDataTable({ data, columns, getRowId: (row) => row.id, manualPagination: true });
  return <DataTable table={table} showPagination={showPagination} isLoading={isLoading} actionBar={<button onClick={() => table.resetRowSelection()}>Clear selection</button>}>
    <button onClick={() => table.setRowSelection({ gpu: true })}>Select GPU</button>
  </DataTable>;
}

it("omits an empty footer but restores it for selected-row actions and pagination", () => {
  const { container, rerender } = render(<ResourceTable />);
  const root = container.querySelector('[data-slot="data-table"]')!;
  expect(root.lastElementChild?.contains(screen.getByRole("table"))).toBe(true);

  fireEvent.click(screen.getByRole("button", { name: "Select GPU" }));
  expect(root.lastElementChild?.contains(screen.getByRole("button", { name: "Clear selection" }))).toBe(true);
  rerender(<ResourceTable isLoading />);
  expect(screen.queryByRole("button", { name: "Clear selection" })).toBeNull();
  expect(root.lastElementChild?.contains(screen.getByRole("table"))).toBe(true);

  rerender(<ResourceTable />);
  fireEvent.click(screen.getByRole("button", { name: "Clear selection" }));
  expect(root.lastElementChild?.contains(screen.getByRole("table"))).toBe(true);

  rerender(<ResourceTable showPagination />);
  expect(root.lastElementChild?.contains(screen.getByRole("combobox", { name: "Rows per page" }))).toBe(true);
});
