// @vitest-environment jsdom

import type { ColumnDef } from "@tanstack/react-table";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  DataTable,
  DataTableViewOptions,
  useDataTable,
} from "../packages/ui/src/components/data-table";

afterEach(cleanup);

type Record = {
  name: string;
  owner: string;
  status: string;
};

const columns: ColumnDef<Record, unknown>[] = [
  { id: "select", header: "Select", enableHiding: false },
  { accessorKey: "name", header: "Name", meta: { label: "Name" } },
  { accessorKey: "owner", header: "Owner", meta: { label: "Owner" } },
  { accessorKey: "status", header: "Status", meta: { label: "Status" } },
];

function ReorderableTable() {
  const { table } = useDataTable({
    columns,
    data: [{ name: "Atlas", owner: "Maya", status: "Active" }],
  });

  return (
    <DataTable table={table}>
      <DataTableViewOptions table={table} />
    </DataTable>
  );
}

describe("DataTable column ordering", () => {
  it("reorders columns with the keyboard and keeps visibility independently controlled", async () => {
    render(<ReorderableTable />);

    fireEvent.click(screen.getByRole("button", { name: "Customize columns" }));

    const statusHandle = await screen.findByRole("button", {
      name: "Reorder Status",
    });
    const statusRow = statusHandle.closest<HTMLElement>(
      '[data-slot="sortable-collection-item"]'
    );
    const statusLeading = statusRow?.querySelector(
      '[data-slot="sortable-collection-leading-actions"]'
    );
    const statusContent = statusRow?.querySelector(
      '[data-slot="sortable-collection-content"]'
    );
    const rowChildren = Array.from(statusRow?.children ?? []);

    expect(statusLeading).not.toBeNull();
    expect(statusContent).not.toBeNull();
    expect(rowChildren.indexOf(statusLeading as Element)).toBeLessThan(
      rowChildren.indexOf(statusContent as Element)
    );
    expect(rowChildren.indexOf(statusContent as Element)).toBeLessThan(
      rowChildren.indexOf(statusHandle)
    );

    fireEvent.keyDown(statusHandle, { key: " " });
    fireEvent.keyDown(statusHandle, { key: "ArrowUp" });
    fireEvent.keyDown(statusHandle, { key: "Enter" });

    await waitFor(() => {
      expect(
        screen.getAllByRole("columnheader").map((header) => header.textContent)
      ).toEqual(["Select", "Name", "Status", "Owner"]);
    });

    const ownerCheckbox = screen.getByRole("checkbox", {
      name: "Show Owner column",
    });
    fireEvent.click(ownerCheckbox);

    await waitFor(() => {
      expect(
        screen.getAllByRole("columnheader").map((header) => header.textContent)
      ).toEqual(["Select", "Name", "Status"]);
    });
  });
});
