// @vitest-environment jsdom

import * as React from "react";
import type { ColumnDef, Table } from "@tanstack/react-table";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { DataTableToolbar, useDataTable } from "../packages/ui/src/components/data-table";
import { SortableCollection } from "../packages/ui/src/components/sortable-collection";
import { Stepper, StepperContent, StepperItem, StepperList, StepperTrigger } from "../packages/ui/src/components/stepper";

beforeAll(() => {
  window.matchMedia = vi.fn().mockImplementation(() => ({ matches: false,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
  }));
});
afterEach(cleanup);

describe("DataTable numeric toolbar", () => {
  it("uses an exact numeric range for the default filter and clears cleanly", () => {
    const values = [{ amount: 1 }, { amount: 2 }, { amount: 12 }, { amount: 30 }, { amount: -12.5 }];
    let table: Table<(typeof values)[number]>;
    const columns: ColumnDef<(typeof values)[number]>[] = [{ accessorKey: "amount", meta: { variant: "number", label: "Amount" } }];
    function Demo() {
      ({ table } = useDataTable({ columns, data: values }));
      return <DataTableToolbar table={table} showViewOptions={false} />;
    }
    render(<Demo />);
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "12" } });
    expect(table!.getRowModel().rows.map((row) => row.original.amount)).toEqual([12]);
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "-12.5" } });
    expect(table!.getRowModel().rows.map((row) => row.original.amount)).toEqual([-12.5]);
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "" } });
    expect(table!.getRowModel().rows).toHaveLength(5);
  });

  it("preserves a custom filter function's scalar input contract", () => {
    const filterFn = vi.fn(() => true);
    const values = [{ amount: 12 }];
    const columns: ColumnDef<(typeof values)[number]>[] = [{ accessorKey: "amount", filterFn, meta: { variant: "number" } }];
    function Demo() {
      const { table } = useDataTable({ columns, data: values });
      table.getRowModel();
      return <DataTableToolbar table={table} showViewOptions={false} />;
    }
    render(<Demo />);
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "12" } });
    expect(filterFn.mock.calls.some((call: unknown[]) => call[2] === "12")).toBe(true);
  });
});

describe("SortableCollection keyboard reorder", () => {
  it("moves down and then back up in a controlled collection", () => {
    function Demo() {
      const [items, setItems] = React.useState([{ id: "a", title: "A" }, { id: "b", title: "B" }, { id: "c", title: "C" }]);
      return <><SortableCollection items={items} onItemsChange={setItems} /><output>{items.map((item) => item.id).join(",")}</output></>;
    }
    render(<Demo />);
    const handle = screen.getByRole("button", { name: "Reorder A" });
    fireEvent.keyDown(handle, { key: " " });
    fireEvent.keyDown(handle, { key: "ArrowDown" });
    expect(screen.getByRole("status").textContent).toBe("b,a,c");
    fireEvent.keyDown(handle, { key: "ArrowUp" });
    expect(screen.getByRole("status").textContent).toBe("a,b,c");
    fireEvent.keyDown(handle, { key: "ArrowUp" });
    expect(screen.getByRole("status").textContent).toBe("a,b,c");
  });
});

function Steps({ value, onValueChange }: { value?: string; onValueChange: (value: string) => void }) {
  return <Stepper value={value} defaultValue="a" onValueChange={onValueChange}>
    <StepperList>
      <StepperItem value="a"><StepperTrigger>A</StepperTrigger></StepperItem>
      <StepperItem value="b"><StepperTrigger>B</StepperTrigger></StepperItem>
    </StepperList>
    <StepperContent value="a">Page A</StepperContent>
    <StepperContent value="b">Page B</StepperContent>
  </Stepper>;
}

describe("Stepper controlled value", () => {
  it("requests a change but displays the accepted parent value", async () => {
    const onValueChange = vi.fn();
    const { rerender } = render(<Steps value="a" onValueChange={onValueChange} />);
    await act(async () => fireEvent.click(screen.getByText("B")));
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith("b");
    expect(screen.getByText("Page A")).toBeTruthy();
    expect(screen.queryByText("Page B")).toBeNull();
    rerender(<Steps value="b" onValueChange={onValueChange} />);
    expect(screen.getByText("Page B")).toBeTruthy();
    expect(onValueChange).toHaveBeenCalledTimes(1);
  });
  it("still changes internally when uncontrolled", async () => {
    const onValueChange = vi.fn();
    render(<Steps onValueChange={onValueChange} />);
    await act(async () => fireEvent.click(screen.getByText("B")));
    expect(onValueChange).toHaveBeenCalledWith("b");
    expect(screen.getByText("Page B")).toBeTruthy();
  });
});
