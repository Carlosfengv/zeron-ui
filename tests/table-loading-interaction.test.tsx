// @vitest-environment jsdom

import type { ColumnDef } from "@tanstack/react-table";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  DataTable,
  useDataTable,
} from "../packages/ui/src/components/data-table";
import { TableSkeletonBody } from "../packages/ui/src/components/table";

afterEach(cleanup);

type Project = {
  id: string;
  name: string;
  status: string;
};

const data: Project[] = [
  { id: "prj-1", name: "Atlas", status: "Active" },
  { id: "prj-2", name: "Beacon", status: "Paused" },
  { id: "prj-3", name: "Canvas", status: "Draft" },
];

const columns: ColumnDef<Project, unknown>[] = [
  { accessorKey: "name", header: "Project" },
  { accessorKey: "status", header: "Status" },
];

function LoadingDataTable({ isLoading }: { isLoading: boolean }) {
  const { table } = useDataTable({
    columns,
    data,
    enableRowSelection: true,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 3 },
      rowSelection: { "0": true },
    },
  });

  return (
    <DataTable
      actionBar={<div data-testid="selection-action">Selection action</div>}
      isLoading={isLoading}
      loadingMessage="Loading projects"
      table={table}
    />
  );
}

describe("Table loading behavior", () => {
  it("honors null from renderCell while undefined keeps the default Skeleton", () => {
    const { container } = render(
      <table>
        <TableSkeletonBody
          columns={2}
          rows={2}
          renderCell={(_, columnIndex) =>
            columnIndex === 0 ? null : undefined
          }
        />
      </table>
    );

    expect(container.querySelectorAll("tbody tr")).toHaveLength(2);
    expect(container.querySelectorAll('[data-slot="skeleton"]')).toHaveLength(2);
    expect(container.querySelectorAll("tbody td")).toHaveLength(4);
    expect(container.querySelector("tbody td")?.textContent).toBe("");
  });

  it("uses the current page size, keeps status outside busy content, and replaces data and actions", () => {
    const { container, rerender } = render(<LoadingDataTable isLoading />);
    const root = container.querySelector<HTMLElement>(
      '[data-slot="data-table"]'
    );
    const status = screen.getByRole("status");
    const busyRegion = root?.querySelector<HTMLElement>(
      'div[aria-busy="true"]'
    );

    expect(root?.getAttribute("aria-busy")).toBeNull();
    expect(status.textContent).toBe("Loading projects");
    expect(busyRegion).not.toBeNull();
    expect(busyRegion?.contains(status)).toBe(false);
    expect(
      container.querySelectorAll('[data-slot="table-skeleton-body"] tr')
    ).toHaveLength(3);
    expect(screen.queryByText("Atlas")).toBeNull();
    expect(screen.queryByTestId("selection-action")).toBeNull();

    rerender(<LoadingDataTable isLoading={false} />);

    expect(status.textContent).toBe("");
    expect(
      container.querySelector('[data-slot="table-skeleton-body"]')
    ).toBeNull();
    expect(screen.getByText("Atlas")).toBeTruthy();
    expect(screen.getByTestId("selection-action")).toBeTruthy();
  });
});
