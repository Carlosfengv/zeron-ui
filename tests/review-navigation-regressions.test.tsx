// @vitest-environment jsdom
import * as React from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { Stepper, StepperContent, StepperItem, StepperList, StepperNext, StepperPrev, StepperTrigger, type StepperProps } from "../packages/ui/src/components/stepper";
import { SortableCollection } from "../packages/ui/src/components/sortable-collection";

beforeAll(() => {
  window.matchMedia = vi.fn().mockImplementation(() => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} }));
});
afterEach(cleanup);

function Steps({ disabledB = false, showB = true, ...props }: StepperProps & { disabledB?: boolean; showB?: boolean }) {
  return <Stepper defaultValue="a" {...props}>
    <StepperList>
      <StepperItem value="a"><StepperTrigger>A</StepperTrigger></StepperItem>
      {showB && <StepperItem value="b" disabled={disabledB}><StepperTrigger>B</StepperTrigger></StepperItem>}
      <StepperItem value="c"><StepperTrigger>C</StepperTrigger></StepperItem>
    </StepperList>
    <StepperContent value="a">Page A</StepperContent>
    <StepperContent value="b">Page B</StepperContent>
    <StepperContent value="c">Page C</StepperContent>
    <StepperPrev>Previous</StepperPrev><StepperNext>Next</StepperNext>
  </Stepper>;
}
function deferred() {
  let resolve!: (value: boolean) => void;
  const promise = new Promise<boolean>((r) => { resolve = r; });
  return { promise, resolve };
}

describe("Stepper interrupted navigation", () => {
  it("only commits the newest validation even when requests finish out of order", async () => {
    const b = deferred(); const c = deferred(); const changed = vi.fn();
    render(<Steps onValueChange={changed} onValidate={(value) => value === "b" ? b.promise : c.promise} />);
    fireEvent.click(screen.getByRole("tab", { name: "B" }));
    fireEvent.click(screen.getByRole("tab", { name: "C" }));
    await act(async () => { c.resolve(true); });
    await act(async () => { b.resolve(true); });
    expect(changed.mock.calls).toEqual([["c"]]);
    expect(screen.getByRole("tabpanel").textContent).toBe("Page C");
  });
  it("a newer rejected request still cancels older accepted requests", async () => {
    const b = deferred(); const c = deferred(); const changed = vi.fn();
    render(<Steps onValueChange={changed} onValidate={(value) => value === "b" ? b.promise : c.promise} />);
    fireEvent.click(screen.getByRole("tab", { name: "B" }));
    fireEvent.click(screen.getByRole("tab", { name: "C" }));
    await act(async () => { c.resolve(false); b.resolve(true); });
    expect(changed).not.toHaveBeenCalled();
  });
  it("Previous interrupts a pending Next validation", async () => {
    const pending = deferred(); const changed = vi.fn();
    render(<Steps defaultValue="b" onValueChange={changed} onValidate={() => pending.promise} />);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    await act(async () => { pending.resolve(true); });
    expect(changed.mock.calls).toEqual([["a"]]);
  });
  it.each(["disabled", "removed", "rootDisabled", "controlled"])("ignores validation after the target becomes %s", async (change) => {
    const pending = deferred(); const changed = vi.fn();
    const props = { onValueChange: changed, onValidate: () => pending.promise };
    const view = render(<Steps {...props} />);
    fireEvent.click(screen.getByRole("tab", { name: "B" }));
    view.rerender(<Steps {...props} disabledB={change === "disabled"} showB={change !== "removed"} disabled={change === "rootDisabled"} value={change === "controlled" ? "c" : undefined} />);
    await act(async () => { pending.resolve(true); });
    expect(changed).not.toHaveBeenCalled();
  });
  it("does not revive a pending transition after its target is disabled and re-enabled", async () => {
    const pending = deferred(); const changed = vi.fn();
    const props = { onValueChange: changed, onValidate: () => pending.promise };
    const view = render(<Steps {...props} />);
    fireEvent.click(screen.getByRole("tab", { name: "B" }));
    view.rerender(<Steps {...props} disabledB />);
    view.rerender(<Steps {...props} />);
    await act(async () => { pending.resolve(true); });
    expect(changed).not.toHaveBeenCalled();
  });
  it("does not call the consumer after unmount", async () => {
    const pending = deferred(); const changed = vi.fn();
    const view = render(<Steps onValueChange={changed} onValidate={() => pending.promise} />);
    fireEvent.click(screen.getByRole("tab", { name: "B" }));
    view.unmount();
    await act(async () => { pending.resolve(true); });
    expect(changed).not.toHaveBeenCalled();
  });
  it("disables root navigation and skips disabled steps in both directions without changing registration order", () => {
    const changed = vi.fn(); const view = render(<Steps disabled onValueChange={changed} />);
    expect((screen.getByRole("button", { name: "Next" }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(changed).not.toHaveBeenCalled();
    view.rerender(<Steps disabledB onValueChange={changed} />);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("tabpanel").textContent).toBe("Page C");
    fireEvent.click(screen.getByRole("button", { name: "Previous" }));
    expect(screen.getByRole("tabpanel").textContent).toBe("Page A");
    view.rerender(<Steps onValueChange={changed} />);
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("tabpanel").textContent).toBe("Page B");
  });
  it("does not validate an accepted controlled keyboard transition twice", async () => {
    const validate = vi.fn(() => true); const changed = vi.fn();
    render(<Steps value="a" onValidate={validate} onValueChange={changed} />);
    const a = screen.getByRole("tab", { name: "A" });
    act(() => a.focus());
    fireEvent.keyDown(a, { key: "ArrowRight" });
    await act(async () => {});
    expect(validate.mock.calls).toHaveLength(1);
    expect(changed.mock.calls).toEqual([["b"]]);
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "B" }));
  });
  it("manual arrow navigation only moves focus even with validation installed", async () => {
    const validate = vi.fn(() => true); const changed = vi.fn();
    render(<Steps activationMode="manual" onValidate={validate} onValueChange={changed} />);
    const a = screen.getByRole("tab", { name: "A" });
    act(() => a.focus());
    fireEvent.keyDown(a, { key: "ArrowRight" });
    await act(async () => {});
    expect(document.activeElement).toBe(screen.getByRole("tab", { name: "B" }));
    expect(validate).not.toHaveBeenCalled();
    expect(changed).not.toHaveBeenCalled();
  });
});

describe("SortableCollection keyboard cancellation", () => {
  function Collection({ reordered = () => {} }: { reordered?: (items: { id: string; title: string }[]) => void }) {
    const [items, setItems] = React.useState([{ id: "a", title: "A" }, { id: "b", title: "B" }, { id: "c", title: "C" }]);
    return <><SortableCollection items={items} onItemsChange={setItems} onReorder={reordered} /><output>{items.map((item) => item.id).join(",")}</output><button>Outside</button></>;
  }
  it("keeps the moving row and focused handle visible and restores order on Escape", () => {
    render(<Collection />);
    const handle = screen.getByRole("button", { name: "Reorder A" });
    act(() => handle.focus());
    fireEvent.keyDown(handle, { key: " " });
    expect(handle.classList.contains("invisible")).toBe(false);
    expect(handle.closest("[data-sortable-item-id]")!.querySelector("[data-slot='sortable-collection-content']")!.classList.contains("invisible")).toBe(false);
    fireEvent.keyDown(handle, { key: "ArrowDown" });
    fireEvent.keyDown(handle, { key: "ArrowDown" });
    expect(screen.getByRole("status").textContent).toBe("b,c,a");
    fireEvent.keyDown(handle, { key: "Escape" });
    expect(screen.getByRole("status").textContent).toBe("a,b,c");
    expect(document.activeElement).toBe(handle);
    expect(handle.getAttribute("aria-pressed")).not.toBe("true");
  });
  it("starts each drag from the last committed order and cancels interrupted moves on blur", () => {
    render(<Collection />);
    const handle = screen.getByRole("button", { name: "Reorder A" });
    act(() => handle.focus());
    fireEvent.keyDown(handle, { key: "Enter" });
    fireEvent.keyDown(handle, { key: "ArrowDown" });
    fireEvent.keyDown(handle, { key: "Enter" });
    expect(screen.getByRole("status").textContent).toBe("b,a,c");
    fireEvent.keyDown(handle, { key: " " });
    fireEvent.keyDown(handle, { key: "ArrowDown" });
    act(() => screen.getByRole("button", { name: "Outside" }).focus());
    expect(screen.getByRole("status").textContent).toBe("b,a,c");
    fireEvent.keyDown(handle, { key: "ArrowDown" });
    expect(screen.getByRole("status").textContent).toBe("b,a,c");
  });
});
