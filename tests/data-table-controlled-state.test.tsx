// @vitest-environment jsdom

import {
  type ColumnDef,
  functionalUpdate,
  type PaginationState,
} from "@tanstack/react-table";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DataTableFacetedFilter,
  DataTablePagination,
  useDataTable,
} from "../packages/ui/src/components/data-table";

afterEach(cleanup);

type Item = { name: string };

const columns: ColumnDef<Item, unknown>[] = [
  { accessorKey: "name", header: "Name" },
];

function ControlledTable({
  onPaginationChange,
  pagination,
}: {
  onPaginationChange: (next: PaginationState) => void;
  pagination: PaginationState;
}) {
  const { table } = useDataTable({
    columns,
    data: [{ name: "Atlas" }],
    manualPagination: true,
    onPaginationChange: (updater) =>
      onPaginationChange(functionalUpdate(updater, pagination)),
    rowCount: 30,
    state: { pagination },
  });

  return (
    <button onClick={() => table.nextPage()} type="button">
      Page {table.getState().pagination.pageIndex + 1}
    </button>
  );
}

function PaginationControls({ disabled = false }: { disabled?: boolean }) {
  const { table } = useDataTable({
    columns,
    data: [{ name: "Atlas" }],
    manualPagination: true,
    rowCount: 30,
    state: { pagination: { pageIndex: 0, pageSize: 10 } },
  });

  return (
    <DataTablePagination
      disabled={disabled}
      labels={{
        nextPage: "下一页",
        pageSummary: (page, pageCount) => `第 ${page} 页，共 ${pageCount} 页`,
        rowsPerPage: "每页行数",
      }}
      table={table}
    />
  );
}

function ServerFacet() {
  const { table } = useDataTable({
    columns: [{ accessorKey: "name", header: "Name" }],
    data: [{ name: "Atlas" }],
  });

  return (
    <DataTableFacetedFilter
      column={table.getColumn("name")!}
      options={[{ count: 99, label: "Atlas", value: "Atlas" }]}
      title="Teams"
    />
  );
}

describe("useDataTable controlled state", () => {
  it("keeps a controlled slice external and forwards its updater", () => {
    const onPaginationChange = vi.fn();
    const pagination = { pageIndex: 0, pageSize: 10 };
    const { rerender } = render(
      <ControlledTable
        onPaginationChange={onPaginationChange}
        pagination={pagination}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Page 1" }));

    expect(onPaginationChange).toHaveBeenCalledWith({
      pageIndex: 1,
      pageSize: 10,
    });
    expect(screen.getByRole("button").textContent).toBe("Page 1");

    rerender(
      <ControlledTable
        onPaginationChange={onPaginationChange}
        pagination={{ pageIndex: 1, pageSize: 10 }}
      />
    );
    expect(screen.getByRole("button").textContent).toBe("Page 2");
  });

  it("disables and localizes the built-in pagination controls", () => {
    render(<PaginationControls disabled />);

    expect(screen.getByText("第 1 页，共 3 页")).toBeTruthy();
    expect(screen.getByText("每页行数")).toBeTruthy();
    expect(screen.getByRole("button", { name: "下一页" })).toHaveProperty(
      "disabled",
      true,
    );
  });

  it("renders an authoritative server facet count", () => {
    render(<ServerFacet />);

    fireEvent.click(screen.getByRole("button", { name: "Teams" }));
    expect(screen.getByText("99")).toBeTruthy();
  });
});
