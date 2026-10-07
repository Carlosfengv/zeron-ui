// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { DesignStack, designStackDemoItems, useDesignStackHistory } from "../packages/blocks/src/application/design-stack-01";

beforeAll(() => {
  window.matchMedia = vi.fn().mockImplementation(() => ({ matches: false,
    addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {},
  }));
  globalThis.ResizeObserver = class { observe() {} unobserve() {} disconnect() {} };
  HTMLElement.prototype.scrollIntoView = vi.fn();
});
afterEach(cleanup);

function Demo() {
  const { items, onItemsChange, history } = useDesignStackHistory(designStackDemoItems);
  return <DesignStack items={items} onItemsChange={onItemsChange} history={history} />;
}

describe("design stack history", () => {
  it("restores edits, additions and deletion without mutating the fixture", () => {
    const { result } = renderHook(() => useDesignStackHistory(designStackDemoItems));
    const edited = designStackDemoItems.map((item) => item.id === "loom" ? { ...item, category: "hosting" } : item);
    act(() => result.current.onItemsChange(edited));
    act(() => result.current.onItemsChange([...result.current.items, { id: "new", tool: "New", category: "", website: "", renews: "" }]));
    act(() => result.current.onItemsChange(result.current.items.filter((item) => item.id !== "linear")));
    expect(result.current.items.map((item) => item.id)).not.toContain("linear");
    act(() => result.current.history.onUndo());
    expect(result.current.items.map((item) => item.id)).toContain("linear");
    act(() => result.current.history.onUndo());
    expect(result.current.items).toEqual(edited);
    act(() => result.current.history.onUndo());
    expect(result.current.items).toEqual(designStackDemoItems);
    act(() => result.current.history.onRedo());
    expect(result.current.items.find((item) => item.id === "loom")?.category).toBe("hosting");
    expect(designStackDemoItems.find((item) => item.id === "loom")?.category).toBe("video");
  });

  it("skips no-op snapshots and clears redo after an alternate edit", () => {
    const { result } = renderHook(() => useDesignStackHistory(designStackDemoItems));
    act(() => result.current.onItemsChange(designStackDemoItems.map((item) => ({ ...item }))));
    expect(result.current.history.canUndo).toBe(false);
    act(() => result.current.onItemsChange(designStackDemoItems.slice(1)));
    act(() => result.current.history.onUndo());
    expect(result.current.history.canRedo).toBe(true);
    act(() => result.current.onItemsChange(designStackDemoItems.slice(0, 1)));
    expect(result.current.history.canRedo).toBe(false);
    act(() => result.current.history.onRedo());
    expect(result.current.items).toHaveLength(1);
  });

  it("isolates external input mutation and resets history with a replacement", () => {
    const input = designStackDemoItems.map((item) => ({ ...item }));
    const { result } = renderHook(() => useDesignStackHistory(input));
    input[0].tool = "Mutated";
    expect(result.current.items[0].tool).toBe("Figma");
    act(() => result.current.onItemsChange(input));
    input[0].tool = "Changed again";
    expect(result.current.items[0].tool).toBe("Mutated");
    act(() => result.current.reset([]));
    expect(result.current.items).toEqual([]);
    expect(result.current.history.canUndo).toBe(false);
    expect(result.current.history.canRedo).toBe(false);
  });
});

describe("design stack controls", () => {
  it("uses the external Add row action without an inert grid footer", () => {
    const update = vi.fn();
    const { container } = render(<DesignStack items={designStackDemoItems} onItemsChange={update} />);
    expect(container.querySelector('[data-slot="grid-footer"]')).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Add row" }));
    const next = update.mock.calls[0][0];
    expect(next).toHaveLength(6);
    expect(next[5].id).toBeTruthy();
    expect(designStackDemoItems.some((item) => item.id === next[5].id)).toBe(false);
    expect(next[5].tool).toBe("New tool");
  });

  it("deletes selected stable IDs, then restores with undo and redo", async () => {
    render(<Demo />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Select all tools" }));
    expect(screen.getByText("5 selected")).toBeTruthy();
    fireEvent.mouseDown(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByText("5 selected")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(screen.queryByText("5 selected")).toBeNull());
    expect(screen.getByRole("button", { name: "Undo" }).hasAttribute("disabled")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select all tools" }));
    expect(screen.getByText("5 selected")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    fireEvent.click(screen.getByRole("button", { name: "Redo" }));
    expect(screen.getByRole("checkbox", { name: "Select all tools" }).getAttribute("aria-disabled")).toBe("true");
  });

  it("supports keyboard history and leaves editable targets to native undo", () => {
    const undo = vi.fn();
    const redo = vi.fn();
    const { container } = render(<DesignStack items={[]} onItemsChange={vi.fn()} history={{ canUndo: true, canRedo: true, onUndo: undo, onRedo: redo }} />);
    const root = container.querySelector('[data-slot="container"]')!;
    fireEvent.keyDown(root, { key: "z", ctrlKey: true });
    fireEvent.keyDown(root, { key: "z", metaKey: true, shiftKey: true });
    expect(undo).toHaveBeenCalledTimes(1);
    expect(redo).toHaveBeenCalledTimes(1);
    const editor = document.createElement("input"); root.append(editor);
    fireEvent.keyDown(editor, { key: "z", ctrlKey: true });
    expect(undo).toHaveBeenCalledTimes(1);
  });

  it("preserves selection when the requested history action is unavailable", () => {
    const undo = vi.fn();
    const redo = vi.fn();
    const { container } = render(<DesignStack items={designStackDemoItems} onItemsChange={vi.fn()}
      history={{ canUndo: false, canRedo: false, onUndo: undo, onRedo: redo }} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Select all tools" }));
    const root = container.querySelector('[data-slot="container"]')!;
    fireEvent.keyDown(root, { key: "z", ctrlKey: true });
    expect(screen.getByText("5 selected")).toBeTruthy();
    fireEvent.keyDown(root, { key: "y", ctrlKey: true });
    expect(screen.getByText("5 selected")).toBeTruthy();
    expect(undo).not.toHaveBeenCalled();
    expect(redo).not.toHaveBeenCalled();
  });

  it("deletes rows selected from a sorted view by their stable IDs", async () => {
    render(<Demo />);
    const category = screen.getByRole("button", { name: "Category" });
    category.focus();
    fireEvent.keyDown(category, { key: "ArrowDown" });
    fireEvent.click(await screen.findByRole("menuitemradio", { name: "Sort asc" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select all tools" }));
    fireEvent.mouseDown(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    await waitFor(() => expect(screen.getByRole("checkbox", { name: "Select all tools" }).getAttribute("aria-disabled")).toBe("true"));
    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    expect(screen.getByRole("checkbox", { name: "Select all tools" }).getAttribute("aria-disabled")).not.toBe("true");
  });

  it("retains selection in read-only mode while suppressing mutations", () => {
    render(<DesignStack items={designStackDemoItems} />);
    expect(screen.queryByRole("button", { name: "Add row" })).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: "Select all tools" }));
    expect(screen.getByText("5 selected")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.queryByText("5 selected")).toBeNull();
  });

  it("clears selection when the host removes all selected rows", async () => {
    const update = vi.fn();
    const { rerender } = render(<DesignStack items={designStackDemoItems} onItemsChange={update} />);
    fireEvent.click(screen.getByRole("checkbox", { name: "Select all tools" }));
    rerender(<DesignStack items={[]} onItemsChange={update} />);
    await waitFor(() => expect(screen.queryByText("5 selected")).toBeNull());
    rerender(<DesignStack items={designStackDemoItems} onItemsChange={update} />);
    expect(screen.queryByText("5 selected")).toBeNull();
  });
});
