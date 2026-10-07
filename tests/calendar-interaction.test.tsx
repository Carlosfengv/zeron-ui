// @vitest-environment jsdom
import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Calendar } from "../packages/ui/src/components/calendar";

afterEach(cleanup);

describe("Calendar rendering", () => {
  it("preserves the calendar DOM and focused day across parent updates", () => {
    const month = new Date(2026, 2, 1);
    const onSelect = vi.fn();
    const { container, rerender } = render(<Calendar mode="single" month={month}
      selected={new Date(2026, 2, 12)} onSelect={onSelect} />);
    const root = container.querySelector('[data-slot="calendar"]');
    const day = container.querySelector<HTMLButtonElement>('button[data-day="2026-03-12"]')!;
    act(() => day.focus());
    rerender(<Calendar mode="single" month={month} className="m-1"
      selected={new Date(2026, 2, 12)} onSelect={onSelect} />);
    expect(container.querySelector('[data-slot="calendar"]')).toBe(root);
    expect(container.querySelector('button[data-day="2026-03-12"]')).toBe(day);
    expect(document.activeElement).toBe(day);
    rerender(<Calendar mode="single" month={month}
      selected={new Date(2026, 2, 13)} onSelect={onSelect} />);
    expect(container.querySelector('button[data-day="2026-03-13"]')?.getAttribute("data-selected")).toBe("true");
  });

  it("keeps caller-provided month formatting and components", () => {
    render(<Calendar month={new Date(2026, 2, 1)} captionLayout="dropdown"
      formatters={{ formatMonthDropdown: (date) => `Month ${date.getMonth() + 1}` }}
      components={{ Root: ({ children }) => <section aria-label="Custom calendar">{children}</section> }} />);
    expect(screen.getByRole("region", { name: "Custom calendar" })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Month 3" })).toBeTruthy();
  });
});
