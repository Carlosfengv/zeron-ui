// @vitest-environment jsdom

import * as React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { Command, CommandInput, CommandItem, CommandList, CommandLoading } from "../packages/ui/src/components/command";

afterEach(cleanup);

class TestResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, "ResizeObserver", { configurable: true, value: TestResizeObserver });
Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: () => undefined });

describe("public Command", () => {
  it("keeps application-provided items visible when cmdk filtering is disabled", () => {
    render(
      <Command shouldFilter={false} vimBindings={false}>
        <CommandInput placeholder="Search" />
        <CommandList>
          <CommandLoading>Loading</CommandLoading>
          <CommandItem value="stable:paid">Paid order</CommandItem>
        </CommandList>
      </Command>,
    );

    fireEvent.change(screen.getByPlaceholderText("Search"), { target: { value: "not present" } });

    expect(screen.getByRole("option", { name: "Paid order" }).getAttribute("data-value")).toBe("stable:paid");
    expect(screen.getByText("Loading")).toBeTruthy();
  });
});
