// @vitest-environment jsdom
import { createRef } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, type TableProps } from "@zeron/ui/table";

afterEach(cleanup);

describe("Table presentation integration", () => {
  it("preserves the native table ref, attributes and state when presentation changes", () => {
    const ref = createRef<HTMLTableElement>();
    const example = (variant: TableProps["variant"], size: TableProps["size"]) => (
      <Table ref={ref} variant={variant} size={size} containerClassName="my-3" aria-label="Editable records" className="w-full">
        <TableHeader><TableRow><TableHead>Name</TableHead></TableRow></TableHeader>
        <TableBody><TableRow><TableCell><input aria-label="Name" defaultValue="Initial" /></TableCell></TableRow></TableBody>
      </Table>
    );
    const { rerender } = render(example("plain", "md"));
    const table = screen.getByRole("table", { name: "Editable records" });
    const input = screen.getByRole("textbox", { name: "Name" });
    expect(ref.current).toBe(table);
    expect(table.getAttribute("variant")).toBeNull();
    expect(table.getAttribute("size")).toBeNull();
    expect(table.parentElement?.classList.contains("my-3")).toBe(true);
    fireEvent.change(input, { target: { value: "Edited" } });
    rerender(example("bordered", "sm"));
    expect(screen.getByRole("table", { name: "Editable records" })).toBe(table);
    expect(screen.getByRole("textbox", { name: "Name" })).toBe(input);
    expect((input as HTMLInputElement).value).toBe("Edited");
  });
});
