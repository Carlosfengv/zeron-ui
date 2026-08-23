// @vitest-environment jsdom

import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  DateTimeRangePicker,
  TimeField,
  TimePicker,
  TimeRangePicker,
  assertISOTime,
  createFixedTimeRangePreset,
  createRecentDateTimePreset,
} from "../packages/ui/src/components/temporal-picker";

Object.defineProperty(window, "matchMedia", {
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    addEventListener: vi.fn(),
    matches: false,
    media: query,
    removeEventListener: vi.fn(),
  })),
});

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, "ResizeObserver", { configurable: true, value: ResizeObserverStub });

afterEach(cleanup);

describe("TimeField", () => {
  it("uses direct scrolling project Button columns for every time part", () => {
    const onValueChange = vi.fn();
    render(<TimeField aria-label="Reminder time" granularity="second" onValueChange={onValueChange} value={assertISOTime("09:30:15")} />);
    expect(screen.getByRole("button", { name: "09 HH" })).toHaveProperty("ariaPressed", "true");
    expect(screen.getByRole("button", { name: "30 MM" })).toHaveProperty("ariaPressed", "true");
    expect(screen.getByRole("button", { name: "15 SS" })).toHaveProperty("ariaPressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "10 HH" }));
    expect(onValueChange).toHaveBeenLastCalledWith("10:30:15");
    expect(screen.queryByRole("combobox")).toBeNull();
    expect(document.querySelector('input[type="time"]')).toBeNull();
  });

  it("provides a controlled twelve-hour representation while retaining an ISO form value", () => {
    render(<TimeField aria-label="Twelve hour time" hourCycle={12} name="reminder" value={assertISOTime("13:05")} />);
    expect(screen.getByRole("button", { name: "1 HH" })).toHaveProperty("ariaPressed", "true");
    expect(screen.getByRole("button", { name: "05 MM" })).toHaveProperty("ariaPressed", "true");
    expect(screen.getByRole("button", { name: "PM AM/PM" })).toHaveProperty("ariaPressed", "true");
    expect(document.querySelector<HTMLInputElement>('input[name="reminder"]')?.value).toBe("13:05");
  });
});

describe("Temporal picker commitment", () => {
  it("forwards its trigger ref and keeps a matching controlled preset active", () => {
    const onValueChange = vi.fn();
    const ref = React.createRef<HTMLButtonElement>();
    const preset = { id: "lunch", label: "Lunch", resolve: () => assertISOTime("12:30") };
    const { rerender } = render(<TimePicker onValueChange={onValueChange} presentation="inline" presets={[preset]} ref={ref} value={undefined} />);

    // Inline has no trigger by design; the external presentation does.
    rerender(<TimePicker onValueChange={onValueChange} presets={[preset]} ref={ref} value={undefined} />);
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);

    rerender(<TimePicker onValueChange={onValueChange} presentation="inline" presets={[preset]} ref={ref} value={undefined} />);
    fireEvent.click(screen.getByRole("button", { name: "Lunch" }));
    expect(onValueChange).toHaveBeenCalledWith("12:30", { source: "preset", presetId: "lunch" });
    rerender(<TimePicker onValueChange={onValueChange} presentation="inline" presets={[preset]} ref={ref} value={assertISOTime("12:30")} />);
    expect(screen.getByRole("button", { name: "Lunch" }).querySelector("[data-slot='button-background']")?.className.split(" ")).toContain("bg-active");

    rerender(<TimePicker onValueChange={onValueChange} presentation="inline" presets={[preset]} ref={ref} value={assertISOTime("13:00")} />);
    expect(screen.getByRole("button", { name: "Lunch" }).querySelector("[data-slot='button-background']")?.className.split(" ")).not.toContain("bg-active");
  });

  it("keeps a time-range draft private until Apply", () => {
    const onValueChange = vi.fn();
    const preset = createFixedTimeRangePreset({ from: "09:00", id: "office-hours", label: "Office hours", to: "18:00" });
    render(<TimeRangePicker onValueChange={onValueChange} presentation="inline" presets={[preset]} />);
    fireEvent.click(screen.getByRole("button", { name: "Office hours" }));
    expect(onValueChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(onValueChange).toHaveBeenCalledWith({ from: "09:00", to: "18:00" }, { source: "apply", presetId: "office-hours" });
  });

  it("commits an overnight range when its preset carries explicit intent", () => {
    const onValueChange = vi.fn();
    const preset = createFixedTimeRangePreset({ from: "22:00", id: "overnight", label: "Overnight", overnight: true, to: "06:00" });
    render(<TimeRangePicker allowOvernight onValueChange={onValueChange} presentation="inline" presets={[preset]} />);
    fireEvent.click(screen.getByRole("button", { name: "Overnight" }));
    expect(onValueChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(onValueChange).toHaveBeenCalledWith({ from: "22:00", to: "06:00", overnight: true }, { source: "apply", presetId: "overnight" });
  });

  it("resolves a relative preset once and commits it only after Apply", () => {
    const onValueChange = vi.fn();
    const preset = createRecentDateTimePreset({ id: "15m", label: "Last 15 minutes", amount: 15, unit: "minute" });
    render(
      <DateTimeRangePicker
        now={() => new Date("2026-08-23T12:00:00.000Z")}
        onValueChange={onValueChange}
        presentation="inline"
        presets={[preset]}
        timeZone="UTC"
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Last 15 minutes" }));
    expect(onValueChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(onValueChange).toHaveBeenCalledWith(
      { from: "2026-08-23T11:45:00.000Z", to: "2026-08-23T12:00:00.000Z" },
      { source: "apply", presetId: "15m" },
    );
  });
});
