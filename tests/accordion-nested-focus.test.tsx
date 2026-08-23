// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import {
  AccordionContent,
  AccordionGroup,
  AccordionItem,
  AccordionTrigger,
} from "../packages/ui/src/components/accordion";
import {
  CheckboxGroup,
  CheckboxItem,
} from "../packages/ui/src/components/checkbox-group";

class TestResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {}

  observe(target: Element) {
    this.callback(
      [{ contentRect: { height: (target as HTMLElement).offsetHeight, width: 240 } } as ResizeObserverEntry],
      this as unknown as ResizeObserver
    );
  }

  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, "ResizeObserver", {
  configurable: true,
  value: TestResizeObserver,
  writable: true,
});
Object.defineProperty(Element.prototype, "getAnimations", {
  configurable: true,
  value: vi.fn(() => []),
  writable: true,
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function mockLayout(element: HTMLElement, top: number, height = 40) {
  Object.defineProperties(element, {
    offsetHeight: { configurable: true, value: height },
    offsetLeft: { configurable: true, value: 0 },
    offsetTop: { configurable: true, value: top },
    offsetWidth: { configurable: true, value: 240 },
  });
}

function mockKeyboardFocus(element: HTMLElement) {
  const nativeMatches = element.matches.bind(element);
  vi.spyOn(element, "matches").mockImplementation((selector) =>
    selector === ":focus-visible" ? document.activeElement === element : nativeMatches(selector)
  );
}

describe("AccordionGroup nested focus", () => {
  it("removes the accordion ring when focus moves into a nested checkbox group", async () => {
    render(
      <AccordionGroup defaultValue={["outcome"]} type="multiple">
        <AccordionItem index={0} value="outcome">
          <AccordionTrigger>Outcome</AccordionTrigger>
          <AccordionContent>
            <CheckboxGroup aria-label="Outcome" checkedIndices={new Set([0, 1])}>
              <CheckboxItem checked index={0} label="success" onToggle={() => {}} />
              <CheckboxItem checked index={1} label="warning" onToggle={() => {}} />
            </CheckboxGroup>
          </AccordionContent>
        </AccordionItem>
      </AccordionGroup>
    );

    const outcomeTrigger = screen.getByRole("button", { name: "Outcome" });
    const warningOption = screen.getByRole("checkbox", { name: "warning" });
    const triggerLayout = outcomeTrigger.parentElement?.parentElement;
    expect(triggerLayout).toBeTruthy();

    mockLayout(triggerLayout as HTMLElement, 0);
    mockLayout(screen.getByRole("checkbox", { name: "success" }), 0);
    mockLayout(warningOption, 40);
    mockKeyboardFocus(outcomeTrigger);
    mockKeyboardFocus(warningOption);

    outcomeTrigger.focus();
    await waitFor(() => {
      expect(document.querySelectorAll(".outline-focus-ring")).toHaveLength(1);
    });

    warningOption.focus();
    await waitFor(() => {
      expect(document.activeElement).toBe(warningOption);
      expect(document.querySelectorAll(".outline-focus-ring")).toHaveLength(1);
    });
  });
});
