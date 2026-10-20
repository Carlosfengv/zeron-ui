// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { TabItem, Tabs, TabsList } from "../packages/ui/src/components/tabs";

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn(() => ({ matches: false, addEventListener() {}, removeEventListener() {} })) });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it("keeps close actions separate from selection and only tabs to the active close action", () => {
  const close = vi.fn();
  const select = vi.fn();
  const { container } = render(<Tabs defaultValue="one" onValueChange={select} variant="segment" color="default"><TabsList>
    <TabItem value="one" label="One" onClose={close} closeLabel="关闭 One" />
    <TabItem value="two" label="Two" onClose={close} />
  </TabsList></Tabs>);
  expect(container.querySelector("button button")).toBeNull();
  expect(screen.getByRole("button", { name: "关闭 One" }).tabIndex).toBe(0);
  expect(screen.getByRole("button", { name: "Close Two" }).tabIndex).toBe(-1);
  fireEvent.click(screen.getByRole("button", { name: "Close Two" }));
  expect(close).toHaveBeenCalledTimes(1);
  expect(select).not.toHaveBeenCalled();
  expect(screen.getByRole("tab", { name: "One" }).getAttribute("aria-selected")).toBe("true");
  fireEvent.click(screen.getByRole("tab", { name: "Two" }));
  expect(screen.getByRole("button", { name: "Close Two" }).tabIndex).toBe(0);
});

it("disables the close action along with a disabled tab", () => {
  const close = vi.fn();
  render(<Tabs defaultValue="one"><TabsList><TabItem value="one" label="One" /><TabItem value="two" label="Two" disabled onClose={close} /></TabsList></Tabs>);
  fireEvent.click(screen.getByRole("button", { name: "Close Two" }));
  expect(close).not.toHaveBeenCalled();
});
