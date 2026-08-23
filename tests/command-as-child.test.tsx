// @vitest-environment jsdom

import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { Command, CommandInput } from "../packages/ui/src/components/command";

describe("CommandInput asChild", () => {
  it("uses the consumer input without rendering the default search wrapper", () => {
    const onValueChange = vi.fn();
    render(
      <Command label="Filters" shouldFilter={false}>
        <CommandInput asChild onValueChange={onValueChange} value="">
          <input aria-label="Filter query" data-testid="consumer-input" />
        </CommandInput>
      </Command>,
    );

    const input = screen.getByTestId("consumer-input");
    expect(input.getAttribute("cmdk-input")).not.toBeNull();
    expect(document.querySelector("[data-slot=command-input-wrapper]")).toBeNull();
    fireEvent.change(input, { target: { value: "status:500" } });
    expect(onValueChange).toHaveBeenCalledWith("status:500");
  });
});
