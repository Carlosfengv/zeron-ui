// @vitest-environment jsdom

import {
  type ColumnDef,
  functionalUpdate,
  type PaginationState,
} from "@tanstack/react-table";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useDataTable } from "../packages/ui/src/components/data-table";

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
});
