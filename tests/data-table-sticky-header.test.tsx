// @vitest-environment jsdom
import type { ColumnDef } from "@tanstack/react-table";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  DataTable,
  useDataTable,
} from "../packages/ui/src/components/data-table";

afterEach(cleanup);
const data = [{ id: "one", name: "Alpha" }];
const columns: ColumnDef<(typeof data)[number], unknown>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: () => <input aria-label="Session name" defaultValue="Alpha" />,
  },
];
function Example({
  stickyHeader = false,
  height,
}: {
  stickyHeader?: boolean;
  height?: number;
}) {
  const { table } = useDataTable({
    data,
    columns,
    getRowId: (item) => item.id,
    initialState: { columnPinning: { left: ["name"] } },
  });
  return (
    <DataTable
      table={table}
      stickyHeader={stickyHeader}
      scrollAreaMaxHeight={height}
      variant="embedded"
      style={{ backgroundColor: "var(--surface-floating)" }}
    >
      <button>Toolbar action</button>
    </DataTable>
  );
}
describe("DataTable bounded header scrolling", () => {
  it("keeps existing tables unbounded and applies a bounded scroll area only when opted in", () => {
    const { container, rerender } = render(<Example />);
    const area = container.querySelector<HTMLElement>(
      '[data-slot="data-table-scroll-area"]',
    )!;
    expect(area.style.maxHeight).toBe("");
    rerender(<Example stickyHeader />);
    expect(area.style.maxHeight).toBe("min(65dvh, 40rem)");
    expect(
      area.contains(screen.getByRole("columnheader", { name: "Name" })),
    ).toBe(true);
    expect(
      area.contains(screen.getByRole("button", { name: "Toolbar action" })),
    ).toBe(false);
    expect(
      area.contains(screen.getByRole("combobox", { name: "Rows per page" })),
    ).toBe(false);
    rerender(<Example stickyHeader height={320} />);
    expect(area.style.maxHeight).toBe("320px");
    rerender(<Example height={240} />);
    expect(area.style.maxHeight).toBe("240px");
  });
  it("preserves edited controls, focus and the pinned-column surface when toggled", () => {
    const { rerender } = render(<Example />);
    const input = screen.getByRole("textbox", { name: "Session name" });
    fireEvent.change(input, { target: { value: "Edited" } });
    input.focus();
    rerender(<Example stickyHeader />);
    expect(screen.getByRole("textbox", { name: "Session name" })).toBe(input);
    expect((input as HTMLInputElement).value).toBe("Edited");
    expect(document.activeElement).toBe(input);
    expect(
      screen.getByRole("columnheader", { name: "Name" }).style.backgroundColor,
    ).toBe("var(--surface-floating)");
    expect(input.closest("td")?.style.backgroundColor).toBe(
      "var(--surface-floating)",
    );
    expect(
      input.closest("table")?.querySelector("thead")?.style.backgroundColor,
    ).toBe("var(--surface-floating)");
  });
});
