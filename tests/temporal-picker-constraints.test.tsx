// @vitest-environment jsdom

import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import {
  DatePicker, DateRangePicker, DateTimePicker, DateTimeRangePicker, TimePicker, TimeRangePicker,
  assertISODate, assertISODateTime, assertISOTime,
  type DateTimePickerProps, type DateTimeRangePickerProps, type TemporalPickerCommonProps,
} from "../packages/ui/src/components/temporal-picker";
import { usePickerCore } from "../packages/ui/src/components/temporal-picker/date-and-time-pickers";

Object.defineProperty(window, "matchMedia", {
  configurable: true,
  value: vi.fn().mockImplementation(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
});
afterEach(cleanup);

const instant = assertISODateTime("2026-09-10T02:00:00.000Z");
const range = { from: instant, to: assertISODateTime("2026-09-10T03:00:00.000Z") };
const modes = [
  { commitMode: "complete" },
  { commitMode: "apply", presetBehavior: "commit" },
  { commitMode: "apply", presetBehavior: "draft" },
] as const;

function activatePreset() {
  const button = screen.getByRole("button", { name: /Test preset/ });
  fireEvent.click(button);
  fireEvent.keyDown(button, { key: "p", altKey: true });
  return button;
}

describe.each(modes)("date-time presets with %j", (mode) => {
  const singleConstraints: [string, Partial<DateTimePickerProps>][] = [
    ["minimum", { minValue: range.to }],
    ["maximum", { maxValue: assertISODateTime("2026-09-10T01:00:00.000Z") }],
    ["local date", { isDateUnavailable: (date) => date === "2026-09-09" }],
    ["local time", { isTimeUnavailable: (time, context) => time === "22:00:00" && context.date === "2026-09-09" && context.timeZone === "America/New_York" }],
    ["instant", { isDateTimeUnavailable: () => true }],
  ];
  it.each(singleConstraints)("rejects a single preset blocked by %s", (_label, constraints) => {
    const onValueChange = vi.fn();
    render(<DateTimePicker {...mode} {...constraints} onValueChange={onValueChange} presentation="inline" timeZone="America/New_York" presets={[{ id: "test", label: "Test preset", shortcut: { key: "p", altKey: true }, resolve: () => instant }]} />);
    expect(activatePreset().querySelector("[data-slot='button-background']")?.className.split(" ")).not.toContain("bg-active");
    const apply = screen.queryByRole("button", { name: "Apply" });
    if (apply) { expect(apply).toHaveProperty("disabled", true); fireEvent.click(apply); }
    expect(onValueChange).not.toHaveBeenCalled();
  });

  const rangeConstraints: [string, Partial<DateTimeRangePickerProps>][] = [
    ["minimum", { minValue: range.to }],
    ["maximum", { maxValue: range.from }],
    ["minimum duration", { minDurationMs: 7_200_000 }],
    ["maximum duration", { maxDurationMs: 1_800_000 }],
    ...(["start", "end"] as const).flatMap((endpoint): [string, Partial<DateTimeRangePickerProps>][] => [
      [`${endpoint} local date`, { isDateUnavailable: (date, current) => current === endpoint && date === "2026-09-09" }],
      [`${endpoint} local time`, { isTimeUnavailable: (_time, context) => context.endpoint === endpoint && context.date === "2026-09-09" && context.timeZone === "America/New_York" }],
      [`${endpoint} instant`, { isDateTimeUnavailable: (_value, current) => current === endpoint }],
    ]),
  ];
  it.each(rangeConstraints)("rejects a range preset blocked by %s", (_label, constraints) => {
    const onValueChange = vi.fn();
    render(<DateTimeRangePicker {...mode} {...constraints} onValueChange={onValueChange} presentation="inline" timeZone="America/New_York" presets={[{ id: "test", label: "Test preset", shortcut: { key: "p", altKey: true }, resolve: () => range }]} />);
    expect(activatePreset().querySelector("[data-slot='button-background']")?.className.split(" ")).not.toContain("bg-active");
    const apply = screen.queryByRole("button", { name: "Apply" });
    if (apply) { expect(apply).toHaveProperty("disabled", true); fireEvent.click(apply); }
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("accepts an available single instant", () => {
    const onValueChange = vi.fn();
    render(<DateTimePicker {...mode} minValue={instant} maxValue={instant} onValueChange={onValueChange} presentation="inline" presets={[{ id: "test", label: "Test preset", resolve: () => instant }]} />);
    fireEvent.click(screen.getByRole("button", { name: "Test preset" }));
    if (mode.commitMode === "apply" && mode.presetBehavior === "draft") {
      expect(onValueChange).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    }
    expect(onValueChange).toHaveBeenCalledWith(instant, { source: mode.commitMode === "apply" && mode.presetBehavior === "draft" ? "apply" : "preset", presetId: "test" });
  });

  it("accepts a valid range at the exact bounds and duration", () => {
    const onValueChange = vi.fn();
    render(<DateTimeRangePicker {...mode} minValue={range.from} maxValue={range.to} minDurationMs={3_600_000} maxDurationMs={3_600_000} onValueChange={onValueChange} presentation="inline" presets={[{ id: "test", label: "Test preset", resolve: () => range }]} />);
    fireEvent.click(screen.getByRole("button", { name: "Test preset" }));
    if (mode.commitMode === "apply" && mode.presetBehavior === "draft") {
      expect(onValueChange).not.toHaveBeenCalled();
      fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    }
    expect(onValueChange).toHaveBeenCalledWith(range, { source: mode.commitMode === "apply" && mode.presetBehavior === "draft" ? "apply" : "preset", presetId: "test" });
  });
});

const date = assertISODate("2026-09-10");
const time = assertISOTime("09:30");
type ClearProps = TemporalPickerCommonProps & { onValueChange: (value: unknown, context: unknown) => void };
const pickers: [string, (props: ClearProps) => React.ReactElement][] = [
  ["DatePicker", (props) => <DatePicker {...props} defaultValue={date} />],
  ["DateRangePicker", (props) => <DateRangePicker {...props} defaultValue={{ from: date, to: date }} />],
  ["TimePicker", (props) => <TimePicker {...props} defaultValue={time} />],
  ["TimeRangePicker", (props) => <TimeRangePicker {...props} defaultValue={{ from: time, to: time }} />],
  ["DateTimePicker", (props) => <DateTimePicker {...props} defaultValue={instant} />],
  ["DateTimeRangePicker", (props) => <DateTimeRangePicker {...props} defaultValue={range} />],
];

describe.each(pickers)("%s clearability", (_name, picker) => {
  it("prevents clearing when clearable is false and permits it after enabling", () => {
    const onValueChange = vi.fn();
    const props = { onValueChange, presentation: "inline" as const };
    const { rerender } = render(picker({ ...props, clearable: false }));
    expect(screen.getByRole("button", { name: "Clear" })).toHaveProperty("disabled", true);
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onValueChange).not.toHaveBeenCalled();
    rerender(picker({ ...props, clearable: true }));
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith(undefined, { source: "clear" });
  });
});

it("guards clearable=false at the commit boundary for alternate clear paths", () => {
  const onValueChange = vi.fn();
  function Harness() {
    const core = usePickerCore({ clearable: false, defaultValue: time, onValueChange }, "complete");
    return <button onClick={() => core.submit(undefined, { source: "time-field" })}>Alternate clear</button>;
  }
  render(<Harness />);
  fireEvent.click(screen.getByRole("button", { name: "Alternate clear" }));
  expect(onValueChange).not.toHaveBeenCalled();
});
