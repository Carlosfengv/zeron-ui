// @vitest-environment jsdom

import * as React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, renderHook, screen, within } from "@testing-library/react";
import {
  DatePicker, DateRangePicker, DateTimePicker, DateTimeRangePicker, TimePicker, TimeRangePicker,
  assertISODate, assertISODateTime, assertISOTime,
} from "../packages/ui/src/components/temporal-picker";
import { FilterBuilder } from "../packages/ui/src/components/filter-builder/filter-builder";
import { useFilterQueryInput } from "../packages/ui/src/components/filter-query-core/use-filter-query-input";
import { ColorPicker } from "../packages/ui/src/components/color-picker";
import type { FilterClause, FilterField } from "../packages/ui/src/system/filter-core";

Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn().mockImplementation((query: string) => ({ addEventListener: vi.fn(), removeEventListener: vi.fn(), matches: false, media: query })) });
class ResizeObserverStub { observe() {} unobserve() {} disconnect() {} }
Object.defineProperty(globalThis, "ResizeObserver", { configurable: true, value: ResizeObserverStub });
afterEach(cleanup);

const start = assertISODateTime("2026-10-02T09:30:00.000Z");
const end = assertISODateTime("2026-10-02T11:30:00.000Z");
const timeRange = { from: assertISOTime("09:30"), to: assertISOTime("11:30") };
const dateRange = { from: assertISODate("2026-10-01"), to: assertISODate("2026-10-02") };

function selectStartHour(hour: string) {
  fireEvent.click(within(screen.getByRole("group", { name: "Start hour" })).getByRole("button", { name: `${hour} HH` }));
}

describe("review: temporal input contracts", () => {
  it("commits every complete DateTimePicker time edit", () => {
    const onValueChange = vi.fn();
    render(<DateTimePicker presentation="inline" commitMode="complete" timeZone="UTC" hourCycle={24} defaultValue={start} onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole("button", { name: "10 HH" }));
    expect(screen.queryByRole("button", { name: "Apply" })).toBeNull();
    expect(onValueChange).toHaveBeenLastCalledWith("2026-10-02T10:30:00.000Z", { source: "time-field" });
    fireEvent.click(screen.getByRole("button", { name: "11 HH" }));
    expect(onValueChange).toHaveBeenLastCalledWith("2026-10-02T11:30:00.000Z", { source: "time-field" });
    expect(onValueChange).toHaveBeenCalledTimes(2);
  });

  it("commits a valid DateTimeRangePicker endpoint edit in complete mode", () => {
    const onValueChange = vi.fn();
    render(<DateTimeRangePicker presentation="inline" commitMode="complete" timeZone="UTC" hourCycle={24} defaultValue={{ from: start, to: end }} onValueChange={onValueChange} />);
    selectStartHour("10");
    expect(onValueChange).toHaveBeenCalledWith({ from: "2026-10-02T10:30:00.000Z", to: end }, { source: "time-field" });
    expect(screen.queryByRole("button", { name: "Apply" })).toBeNull();
  });

  it("commits a valid TimeRangePicker endpoint edit in complete mode", () => {
    const onValueChange = vi.fn();
    render(<TimeRangePicker presentation="inline" commitMode="complete" hourCycle={24} defaultValue={timeRange} onValueChange={onValueChange} />);
    selectStartHour("10");
    expect(onValueChange).toHaveBeenCalledWith({ from: "10:30", to: "11:30" }, { source: "time-field" });
    expect(screen.queryByRole("button", { name: "Apply" })).toBeNull();
  });

  it("keeps apply-mode DateTimePicker edits as drafts until Apply", () => {
    const onValueChange = vi.fn();
    render(<DateTimePicker presentation="inline" timeZone="UTC" hourCycle={24} defaultValue={start} onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole("button", { name: "10 HH" }));
    expect(onValueChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(onValueChange).toHaveBeenCalledWith("2026-10-02T10:30:00.000Z", { source: "apply", presetId: undefined });
  });

  it("does not auto-commit unavailable DateTimePicker drafts", () => {
    const onValueChange = vi.fn();
    render(<DateTimePicker presentation="inline" commitMode="complete" timeZone="UTC" hourCycle={24} defaultValue={start} isTimeUnavailable={(value) => value.startsWith("10:")} onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole("button", { name: "10 HH" }));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain("unavailable");
  });

  it("enforces DateTimeRangePicker duration limits before auto-commit", () => {
    const onValueChange = vi.fn();
    render(<DateTimeRangePicker presentation="inline" commitMode="complete" timeZone="UTC" hourCycle={24} defaultValue={{ from: start, to: end }} minDurationMs={2 * 60 * 60 * 1000} onValueChange={onValueChange} />);
    selectStartHour("10");
    expect(onValueChange).not.toHaveBeenCalled();
    selectStartHour("08");
    expect(onValueChange).toHaveBeenCalledWith({ from: "2026-10-02T08:30:00.000Z", to: end }, { source: "time-field" });
  });

  it("waits for both time range endpoints before auto-commit", () => {
    const onValueChange = vi.fn();
    render(<TimeRangePicker presentation="inline" commitMode="complete" hourCycle={24} onValueChange={onValueChange} />);
    selectStartHour("10");
    fireEvent.click(within(screen.getByRole("group", { name: "Start minute" })).getByRole("button", { name: "30 MM" }));
    expect(onValueChange).not.toHaveBeenCalled();
    fireEvent.click(within(screen.getByRole("group", { name: "End hour" })).getByRole("button", { name: "11 HH" }));
    fireEvent.click(within(screen.getByRole("group", { name: "End minute" })).getByRole("button", { name: "30 MM" }));
    expect(onValueChange).toHaveBeenCalledWith({ from: "10:30", to: "11:30" }, { source: "time-field" });
  });

  it.each(["datetime", "datetime-range", "time-range"])("restores the real %s draft on repeated inline Cancel", (kind) => {
    const onValueChange = vi.fn();
    if (kind === "datetime") render(<DateTimePicker presentation="inline" timeZone="UTC" hourCycle={24} defaultValue={start} onValueChange={onValueChange} />);
    else if (kind === "datetime-range") render(<DateTimeRangePicker presentation="inline" timeZone="UTC" hourCycle={24} defaultValue={{ from: start, to: end }} onValueChange={onValueChange} />);
    else render(<TimeRangePicker presentation="inline" hourCycle={24} defaultValue={timeRange} onValueChange={onValueChange} />);
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const scope = kind === "datetime" ? screen : within(screen.getByRole("group", { name: "Start hour" }));
      fireEvent.click(scope.getByRole("button", { name: "10 HH" }));
      expect(scope.getByRole("button", { name: "10 HH" })).toHaveProperty("ariaPressed", "true");
      fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
      const restoredScope = kind === "datetime" ? screen : within(screen.getByRole("group", { name: "Start hour" }));
      expect(restoredScope.getByRole("button", { name: "09 HH" })).toHaveProperty("ariaPressed", "true");
      expect(screen.getByRole("button", { name: "Apply" })).toHaveProperty("disabled", true);
    }
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("restores an inline draft even when the controlled open prop remains true", () => {
    const onOpenChange = vi.fn();
    render(<DateTimePicker presentation="inline" open onOpenChange={onOpenChange} timeZone="UTC" hourCycle={24} defaultValue={start} />);
    fireEvent.click(screen.getByRole("button", { name: "10 HH" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("button", { name: "09 HH" })).toHaveProperty("ariaPressed", "true");
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("clears incomplete TimeField parts when cancelling an empty inline value", () => {
    const onValueChange = vi.fn();
    render(<DateTimePicker presentation="inline" timeZone="UTC" hourCycle={24} onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole("button", { name: "10 HH" }));
    expect(screen.getByRole("button", { name: "10 HH" })).toHaveProperty("ariaPressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("button", { name: "10 HH" })).toHaveProperty("ariaPressed", "false");
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("cancels an inline DateRangePicker preset draft", () => {
    const onValueChange = vi.fn();
    render(<DateRangePicker presentation="inline" commitMode="apply" defaultValue={dateRange} onValueChange={onValueChange} presets={[{ id: "later", label: "Later dates", resolve: () => ({ from: assertISODate("2026-10-03"), to: assertISODate("2026-10-04") }) }]} />);
    fireEvent.click(screen.getByRole("button", { name: "Later dates" }));
    expect(screen.getByRole("button", { name: "Apply" })).toHaveProperty("disabled", false);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("button", { name: "Apply" })).toHaveProperty("disabled", true);
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it.each(["date", "date-range", "time", "time-range", "datetime", "datetime-range"])("disables every inline %s control and action", (kind) => {
    const onValueChange = vi.fn();
    const common = { presentation: "inline" as const, disabled: true, onValueChange, commitMode: "apply" as const };
    if (kind === "date") render(<DatePicker {...common} defaultValue={dateRange.from} presets={[{ id: "date", label: "Tomorrow", resolve: () => dateRange.to }]} />);
    else if (kind === "date-range") render(<DateRangePicker {...common} defaultValue={dateRange} />);
    else if (kind === "time") render(<TimePicker {...common} hourCycle={24} defaultValue={timeRange.from} presets={[{ id: "time", label: "Later", resolve: () => timeRange.to, shortcut: { key: "l" } }]} />);
    else if (kind === "time-range") render(<TimeRangePicker {...common} hourCycle={24} defaultValue={timeRange} allowOvernight />);
    else if (kind === "datetime") render(<DateTimePicker {...common} hourCycle={24} timeZone="UTC" defaultValue={start} />);
    else render(<DateTimeRangePicker {...common} hourCycle={24} timeZone="UTC" defaultValue={{ from: start, to: end }} />);
    for (const button of screen.getAllByRole("button")) {
      expect(button.matches(":disabled")).toBe(true);
      fireEvent.click(button);
    }
    const presets = document.querySelector("[data-slot='temporal-preset-list']");
    if (presets) fireEvent.keyDown(presets, { key: "l" });
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("lets an enabled TimePicker update normally", () => {
    const onValueChange = vi.fn();
    render(<TimePicker presentation="inline" hourCycle={24} defaultValue={timeRange.from} onValueChange={onValueChange} />);
    fireEvent.click(screen.getByRole("button", { name: "10 HH" }));
    expect(onValueChange).toHaveBeenCalledWith("10:30", { source: "time-field" });
  });
});

const filterFields: readonly FilterField[] = [{ id: "name", label: "Name", type: "text" }];
const defaultFilters: FilterClause[] = [{ id: "one", field: "name", operator: "contains", value: "hello" }];

describe("review: FilterBuilder disabled contract", () => {
  it("does not clear disabled filters, then allows clearing when re-enabled", () => {
    const onFiltersChange = vi.fn();
    const { rerender } = render(<FilterBuilder disabled fields={filterFields} defaultFilters={defaultFilters} onFiltersChange={onFiltersChange} />);
    const clear = screen.getByRole("button", { name: "Clear filters" });
    expect(clear).toHaveProperty("disabled", true);
    fireEvent.click(clear);
    expect(onFiltersChange).not.toHaveBeenCalled();
    rerender(<FilterBuilder fields={filterFields} defaultFilters={defaultFilters} onFiltersChange={onFiltersChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(onFiltersChange).toHaveBeenCalledWith([]);
  });
});

describe("review: ColorPicker editing contract", () => {
  it("cancels a Hex draft on Escape without leaking a blur commit", () => {
    const onValueChange = vi.fn();
    render(<ColorPicker defaultValue="#ff0000" onValueChange={onValueChange} hideEyedropper />);
    const hex = screen.getByRole("textbox", { name: "Hex value" });
    act(() => hex.focus());
    fireEvent.change(hex, { target: { value: "00FF00" } });
    fireEvent.keyDown(hex, { key: "Escape" });
    expect(onValueChange).not.toHaveBeenCalled();
    expect(hex).toHaveProperty("value", "FF0000");
    act(() => hex.focus());
    fireEvent.change(hex, { target: { value: "0000FF" } });
    fireEvent.keyDown(hex, { key: "Enter" });
    expect(onValueChange).toHaveBeenCalledWith("#0000ff", expect.anything());
    expect(hex).toHaveProperty("value", "0000FF");
  });

  it("keeps the controlled color when the parent declines a swatch edit", () => {
    const onValueChange = vi.fn();
    render(<ColorPicker value="#ff0000" onValueChange={onValueChange} swatches={["#00ff00"]} hideEyedropper />);
    fireEvent.click(screen.getByRole("button", { name: "Select color #00ff00" }));
    expect(onValueChange).toHaveBeenCalledWith("#00ff00", expect.anything());
    expect(screen.getByRole("textbox", { name: "Hex value" })).toHaveProperty("value", "FF0000");
  });

  it("restores rejected text edits even when the controlled prop is unchanged", () => {
    const onValueChange = vi.fn();
    render(<ColorPicker value="#ff0000" onValueChange={onValueChange} hideEyedropper />);
    const hex = screen.getByRole("textbox", { name: "Hex value" });
    act(() => hex.focus());
    fireEvent.change(hex, { target: { value: "00FF00" } });
    fireEvent.keyDown(hex, { key: "Enter" });
    expect(onValueChange).toHaveBeenCalledWith("#00ff00", expect.anything());
    expect(hex).toHaveProperty("value", "FF0000");
  });

  it("reflects accepted controlled edits and subsequent external updates", () => {
    function Controlled() {
      const [value, setValue] = React.useState("#ff0000");
      return <><ColorPicker value={value} onValueChange={setValue} swatches={["#00ff00"]} hideEyedropper /><button onClick={() => setValue("#0000ff")}>External blue</button></>;
    }
    render(<Controlled />);
    fireEvent.click(screen.getByRole("button", { name: "Select color #00ff00" }));
    expect(screen.getByRole("textbox", { name: "Hex value" })).toHaveProperty("value", "00FF00");
    fireEvent.click(screen.getByRole("button", { name: "External blue" }));
    expect(screen.getByRole("textbox", { name: "Hex value" })).toHaveProperty("value", "0000FF");
  });
});

describe("review: query input uses the lossless codec", () => {
  it.each(["O'Reilly", 'a"b', String.raw`a\\b`])("escapes the selected suggestion %j", (value) => {
    const fields: FilterField[] = [{ id: "name", label: "Name", type: "select", options: [{ label: value, value }] }];
    const { result } = renderHook(() => useFilterQueryInput({ fields, defaultOpen: true, defaultDraftText: "name:" }));
    const suggestion = result.current.suggestions.find((item) => item.kind === "option");
    expect(suggestion).toBeDefined();
    act(() => result.current.selectSuggestion(suggestion!.id));
    expect(result.current.parseResult.complete).toBe(true);
    expect(result.current.parseResult.clauses[0]).toMatchObject({ value });
  });

  it("does not rewrite an unsupported operator when an existing query is submitted", () => {
    const onFiltersChange = vi.fn();
    const filters: FilterClause[] = [{ id: "not-name", field: "name", operator: "notContains", value: "secret" }];
    const { result } = renderHook(() => useFilterQueryInput({ fields: filterFields, defaultFilters: filters, onFiltersChange }));
    act(() => { result.current.commit(); });
    expect(onFiltersChange).toHaveBeenCalledWith(filters, expect.objectContaining({ preservedClauses: filters }));
  });
});
