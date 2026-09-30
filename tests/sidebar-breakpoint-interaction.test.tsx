// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SidebarProvider, useSidebar } from "../packages/ui/src/components/sidebar";

function SidebarState() {
  const { state, toggle } = useSidebar();
  return <button onClick={toggle} type="button">{state === "collapsed" ? "Expand navigation" : "Collapse navigation"}</button>;
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("SidebarProvider compact collapse", () => {
  it("uses the same collapsed state at the breakpoint and lets the user expand temporarily", () => {
    let compact = false;
    const listeners = new Set<() => void>();
    vi.stubGlobal("matchMedia", () => ({
      get matches() { return compact; },
      addEventListener: (_: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
    }));
    const setCompact = (next: boolean) => act(() => {
      compact = next;
      listeners.forEach((listener) => listener());
    });

    render(<SidebarProvider breakpointBehavior="collapse" defaultOpen><SidebarState /></SidebarProvider>);
    expect(screen.getByRole("button", { name: "Collapse navigation" })).toBeTruthy();

    setCompact(true);
    fireEvent.click(screen.getByRole("button", { name: "Expand navigation" }));
    expect(screen.getByRole("button", { name: "Collapse navigation" })).toBeTruthy();

    setCompact(false);
    expect(screen.getByRole("button", { name: "Collapse navigation" })).toBeTruthy();
    setCompact(true);
    expect(screen.getByRole("button", { name: "Expand navigation" })).toBeTruthy();

    setCompact(false);
    fireEvent.click(screen.getByRole("button", { name: "Collapse navigation" }));
    setCompact(true);
    fireEvent.click(screen.getByRole("button", { name: "Expand navigation" }));
    setCompact(false);
    expect(screen.getByRole("button", { name: "Expand navigation" })).toBeTruthy();
  });
});
