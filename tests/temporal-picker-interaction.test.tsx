// @vitest-environment jsdom

import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  DatePicker,
  DateRangePicker,
  DateTimePicker,
  DateTimeRangePicker,
  TimeField,
  TimePicker,
  TimeRangePicker,
  assertISODateTime,
  assertISOTime,
  createFixedTimeRangePreset,
  createRecentDateTimePreset,
} from "../packages/ui/src/components/temporal-picker";
import { Calendar } from "../packages/ui/src/components/calendar";

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

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("TimeField", () => {
  it("renders without a surface background, border, or rounded container", () => {
    render(<TimeField aria-label="Plain time" value={assertISOTime("09:30")} />);
    const field = document.querySelector<HTMLElement>("[data-slot='time-field']");

    expect(field?.className).not.toContain("bg-surface-base");
    expect(field?.className).not.toContain("border-border-subtle");
    expect(field?.className).not.toContain("rounded-xl");
    expect(field?.className).toContain("overflow-x-auto");
    expect(field?.querySelector("[data-slot='time-field-column']")?.className).toContain("min-w-40");
  });

  it("disables time options outside its minimum and maximum values", () => {
    render(<TimeField aria-label="Constrained time" hourCycle={24} maxValue={assertISOTime("16:08")} minValue={assertISOTime("16:08")} value={assertISOTime("16:08")} />);

    const hourColumn = screen.getByRole("group", { name: "Constrained time hour" });
    const minuteColumn = screen.getByRole("group", { name: "Constrained time minute" });
    expect(hourColumn.querySelector<HTMLButtonElement>("button[aria-label='15 HH']")?.disabled).toBe(true);
    expect(hourColumn.querySelector<HTMLButtonElement>("button[aria-label='16 HH']")?.disabled).toBe(false);
    expect(minuteColumn.querySelector<HTMLButtonElement>("button[aria-label='07 MM']")?.disabled).toBe(true);
    expect(minuteColumn.querySelector<HTMLButtonElement>("button[aria-label='08 MM']")?.disabled).toBe(false);
  });

  it("allows an invalid draft to reach a valid boundary one part at a time", () => {
    const onValueChange = vi.fn();
    render(<TimeField aria-label="Boundary time" hourCycle={24} minValue={assertISOTime("23:59")} onValueChange={onValueChange} value={assertISOTime("00:00")} />);

    const hour = screen.getByRole("button", { name: "23 HH" });
    expect(hour).toHaveProperty("disabled", false);
    fireEvent.click(hour);

    const minute = screen.getByRole("button", { name: "59 MM" });
    expect(minute).toHaveProperty("disabled", false);
    fireEvent.click(minute);
    expect(onValueChange).toHaveBeenLastCalledWith("23:59");
  });

  it("does not wrap picker time fields with p-3", () => {
    render(
      <>
        <TimePicker presentation="inline" />
        <TimeRangePicker presentation="inline" />
      </>,
    );

    const fields = Array.from(document.querySelectorAll<HTMLElement>("[data-slot='time-field']"));
    expect(fields).toHaveLength(3);
    expect(fields[0].parentElement?.className).not.toContain("p-3");
    expect(fields[1].parentElement?.className).not.toContain("p-3");
    expect(fields[2].parentElement?.className).not.toContain("p-3");
    for (const field of fields) {
      expect(field.className).toContain("w-full");
      expect(field.className).toContain("[&_[data-slot=time-field-column]]:min-w-0");
    }
    for (const field of fields.slice(1)) {
      expect(field.closest("label")?.className).toContain("min-w-0");
    }
    for (const label of fields.slice(1).map((field) => field.closest("label"))) {
      expect(label?.querySelector("span")?.className).toContain("bg-surface-base");
      expect(label?.querySelector("span")?.className).toContain("px-2");
      expect(label?.querySelector("span")?.className).toContain("py-1");
    }
  });

  it("uses a bounded width for time picker panels", () => {
    render(
      <>
        <TimePicker presentation="inline" />
        <TimeRangePicker presentation="inline" />
      </>,
    );

    expect(document.querySelector("[data-slot='time-picker-panel']")?.className).toContain("w-[18rem]");
    const timeRangePanel = document.querySelector("[data-slot='time-range-picker-panel']");
    const timeRangeGrid = Array.from(timeRangePanel?.children ?? []).find((child) => child.getAttribute("class")?.includes("sm:grid-cols-2"));
    expect(timeRangePanel?.className).toContain("w-[18rem]");
    expect(timeRangeGrid?.className).not.toContain("gap-3");
    expect(timeRangeGrid?.className).toContain("sm:divide-x");
    expect(timeRangeGrid?.className).toContain("sm:divide-border-subtle");
  });

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
  it("supports custom trigger formatting without changing the committed ISO value", () => {
    const dateTimeValue = assertISODateTime("2026-09-10T08:30:00.000Z");
    const dateTimeFormatter = vi.fn(() => "2026/09/10 16:30");
    render(
      <DateTimePicker
        formatValue={dateTimeFormatter}
        timeZone="Asia/Shanghai"
        value={dateTimeValue}
      />,
    );

    expect(screen.getByRole("button", { name: "Select date and time: 2026/09/10 16:30" }).textContent).toContain("2026/09/10 16:30");
    expect(dateTimeFormatter).toHaveBeenCalledWith(dateTimeValue, "Asia/Shanghai");
  });

  it("draws a range middle background only on the calendar cell", () => {
    render(
      <Calendar
        defaultMonth={new Date(2026, 8)}
        mode="range"
        selected={{ from: new Date(2026, 8, 1), to: new Date(2026, 8, 3) }}
      />,
    );

    const middleButton = document.querySelector<HTMLButtonElement>("button[data-range-middle='true']");
    expect(middleButton).not.toBeNull();
    expect(middleButton?.className).not.toContain("data-[range-middle=true]:bg-");
    expect(middleButton?.closest("td")?.className).toContain("bg-[color-mix(in_oklch,var(--brand)_16%,transparent)]");
  });

  it("keeps a selected today endpoint on the range track without adding a second background layer", () => {
    render(
      <Calendar
        defaultMonth={new Date(2026, 8)}
        mode="range"
        selected={{ from: new Date(2026, 8, 1), to: new Date(2026, 8, 3) }}
        today={new Date(2026, 8, 1)}
      />,
    );

    const startButton = document.querySelector<HTMLButtonElement>("button[data-range-start='true']");
    const startCell = startButton?.closest("td");
    expect(startCell?.getAttribute("data-today")).toBe("true");
    expect(startCell?.className).toContain("[&:not([data-selected=true])]:bg-emphasis");
    expect(startCell?.className).toContain("before:w-1/2");
    expect(startCell?.className).not.toContain("rounded-l-lg bg-[color-mix");
    expect(startButton?.className).toContain("aspect-square");
    expect(startButton?.className).toContain("w-full");
    expect(startButton?.querySelector("[data-slot='button-background']")).toBeNull();
  });

  it("uses the DayPicker v9 grid slots and merges consumer class names", () => {
    render(
      <Calendar
        classNames={{ day: "consumer-day", month_grid: "consumer-grid" }}
        defaultMonth={new Date(2026, 8)}
        mode="single"
      />,
    );

    const grid = screen.getByRole("grid");
    const dayCell = document.querySelector<HTMLElement>("td[data-day='2026-09-01']");
    const week = dayCell?.closest("tr");
    const dayButton = dayCell?.querySelector("button");

    expect(grid.className).toContain("rdp-month_grid");
    expect(grid.className).toContain("consumer-grid");
    expect(grid.className).toContain("table-fixed");
    expect(week?.className.split(" ")).not.toContain("flex");
    expect(dayCell?.className).toContain("rdp-day");
    expect(dayCell?.className).toContain("consumer-day");
    expect(dayButton?.className).toContain("rdp-day_button");
    expect(dayButton?.querySelector("[data-slot='button-background']")).toBeNull();
  });

  it("uses explicit panel widths without stretching standalone calendars", () => {
    render(
      <>
        <Calendar mode="single" />
        <DatePicker presentation="inline" />
        <DateRangePicker presentation="inline" />
        <DateTimePicker presentation="inline" timeZone="UTC" />
        <DateTimeRangePicker presentation="inline" timeZone="UTC" />
      </>,
    );

    const calendars = Array.from(document.querySelectorAll<HTMLElement>("[data-slot='calendar']"));
    expect(calendars).toHaveLength(5);
    expect(calendars[0].classList.contains("w-fit")).toBe(true);
    for (const calendar of calendars.slice(1)) expect(calendar.classList.contains("w-full")).toBe(true);
    expect(document.querySelector("[data-slot='date-picker-panel']")?.className).toContain("w-[18rem]");
    expect(document.querySelector("[data-slot='date-range-picker-panel']")?.className).toContain("w-[18rem]");
    expect(document.querySelector("[data-slot='date-time-picker-panel']")?.className).toContain("w-[19rem]");
    const dateTimeRangePanel = document.querySelector("[data-slot='date-time-range-picker-panel']");
    const compositeGrid = Array.from(dateTimeRangePanel?.children ?? []).find((child) => child.getAttribute("class")?.includes("md:grid-cols"));
    const timeColumn = Array.from(compositeGrid?.children ?? []).at(1) as HTMLElement | undefined;
    const activeTimeField = timeColumn?.querySelector<HTMLElement>("[data-active='true']");
    expect(dateTimeRangePanel?.className).toContain("w-[34rem]");
    expect(compositeGrid?.className).toContain("md:grid-cols-[minmax(0,1.2fr)_minmax(15rem,1fr)]");
    expect(timeColumn?.className).not.toContain("p-3");
    expect(activeTimeField?.className).not.toContain("bg-emphasis");
    expect(activeTimeField?.className).not.toContain("border");
    expect(activeTimeField?.className).not.toContain("rounded-lg");
  });

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

  it("keeps the active date endpoint stable when its time changes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-09-01T12:00:00.000Z"));
    render(
      <DateTimeRangePicker
        presentation="inline"
        timeZone="UTC"
        value={{ from: assertISODateTime("2026-09-10T09:30:00.000Z"), to: assertISODateTime("2026-09-10T10:30:00.000Z") }}
      />,
    );

    const startHour = screen.getByRole("group", { name: "Start hour" });
    fireEvent.click(startHour.querySelector<HTMLButtonElement>("button[aria-label='10 HH']")!);

    const activeFields = Array.from(document.querySelectorAll<HTMLElement>("[data-active='true']"));
    expect(activeFields).toHaveLength(1);
    expect(activeFields[0].textContent).toContain("Start");
    expect(document.querySelector("button[data-day='2026-09-10']")?.getAttribute("data-selected")).toBe("true");
  });

  it("disables same-day end times that are earlier than the start time", () => {
    render(
      <DateTimeRangePicker
        presentation="inline"
        timeZone="UTC"
        value={{ from: assertISODateTime("2026-09-10T16:08:00.000Z"), to: assertISODateTime("2026-09-10T16:30:00.000Z") }}
      />,
    );

    const endHour = screen.getByRole("group", { name: "End hour" });
    const endMinute = screen.getByRole("group", { name: "End minute" });
    expect(endHour.querySelector<HTMLButtonElement>("button[aria-label='15 HH']")?.disabled).toBe(true);
    expect(endHour.querySelector<HTMLButtonElement>("button[aria-label='16 HH']")?.disabled).toBe(false);
    expect(endMinute.querySelector<HTMLButtonElement>("button[aria-label='07 MM']")?.disabled).toBe(true);
    expect(endMinute.querySelector<HTMLButtonElement>("button[aria-label='08 MM']")?.disabled).toBe(false);
  });

  it("dynamically constrains a regular time range without constraining an overnight range", () => {
    const { rerender } = render(
      <TimeRangePicker
        hourCycle={24}
        presentation="inline"
        value={{ from: assertISOTime("09:30"), to: assertISOTime("10:30") }}
      />,
    );

    const regularEndHour = screen.getByRole("group", { name: "End hour" });
    expect(regularEndHour.querySelector<HTMLButtonElement>("button[aria-label='08 HH']")?.disabled).toBe(true);
    expect(regularEndHour.querySelector<HTMLButtonElement>("button[aria-label='09 HH']")?.disabled).toBe(false);

    rerender(
      <TimeRangePicker
        allowOvernight
        hourCycle={24}
        presentation="inline"
        value={{ from: assertISOTime("22:00"), overnight: true, to: assertISOTime("06:00") }}
      />,
    );
    const overnightEndHour = screen.getByRole("group", { name: "End hour" });
    expect(overnightEndHour.querySelector<HTMLButtonElement>("button[aria-label='05 HH']")?.disabled).toBe(false);
  });
});
