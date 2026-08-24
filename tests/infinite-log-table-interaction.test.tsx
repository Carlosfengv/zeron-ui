// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { InfiniteLogTable } from "../packages/blocks/src/application/infinite-log-table-01/infinite-log-table";
import { createInfiniteLogMetadata } from "../packages/blocks/src/application/infinite-log-table-01/infinite-log-data-source";
import { createMockLogRecords } from "../packages/blocks/src/application/infinite-log-table-01/infinite-log-mocks";
import { defaultInfiniteLogFilters, type InfiniteLogDataSource, type InfiniteLogLiveBatch } from "../packages/blocks/src/application/infinite-log-table-01/infinite-log-types";

vi.mock("@zeron/ui/resizable", () => ({
  ResizablePanelGroup: ({ children, className, id }: { children?: ReactNode; className?: string; id?: string }) => <div className={className} data-slot="resizable-panel-group" id={id}>{children}</div>,
  ResizablePanel: ({ children, className, id }: { children?: ReactNode; className?: string; id?: string }) => <div className={className} data-slot="resizable-panel" id={id}>{children}</div>,
  ResizableHandle: ({ "aria-label": ariaLabel, id }: { "aria-label"?: string; id?: string }) => <div aria-label={ariaLabel} data-slot="resizable-handle" id={id} role="separator" />,
}));

class TestResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {}

  observe(target: Element) {
    this.callback([{ contentRect: { height: 112, width: target.getBoundingClientRect().width || 1024 } } as ResizeObserverEntry], this as unknown as ResizeObserver);
  }
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(globalThis, "ResizeObserver", { value: TestResizeObserver, writable: true });
Object.defineProperty(Element.prototype, "getAnimations", {
  configurable: true,
  value: vi.fn(() => []),
  writable: true,
});
Object.defineProperty(window, "matchMedia", {
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    addEventListener: vi.fn(),
    matches: false,
    media: query,
    removeEventListener: vi.fn(),
  })),
  writable: true,
});
Object.defineProperty(HTMLElement.prototype, "scrollTo", {
  configurable: true,
  value: vi.fn(),
  writable: true,
});
Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
  configurable: true,
  value: vi.fn(),
  writable: true,
});
Object.defineProperty(HTMLElement.prototype, "hasPointerCapture", {
  configurable: true,
  value: vi.fn(() => true),
  writable: true,
});
Object.defineProperty(HTMLElement.prototype, "releasePointerCapture", {
  configurable: true,
  value: vi.fn(),
  writable: true,
});

afterEach(cleanup);

describe("InfiniteLogTable", () => {
  it("derives generic columns and filters from arbitrary log data", async () => {
    const records = [
      { id: "job-1", timestamp: "2026-08-22T00:00:00.000Z", service: "billing", event: "invoice.created", duration: 18, successful: true },
      { id: "job-2", timestamp: "2026-08-22T00:01:00.000Z", service: "search", event: "index.updated", duration: 52, successful: false },
    ];
    render(<div style={{ height: 640 }}><InfiniteLogTable enableLive={false} records={records} /></div>);

    const grid = await screen.findByRole("grid", { name: "Log table" });
    expect(within(grid).getByRole("button", { name: "Filter and sort Service" })).toBeTruthy();
    expect(within(grid).getByRole("button", { name: "Duration" })).toBeTruthy();
    expect(within(grid).getByText("invoice.created")).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "billing" })).toBeTruthy();

    fireEvent.click(screen.getByRole("checkbox", { name: "billing" }));
    await waitFor(() => expect(within(grid).queryByText("index.updated")).toBeNull());
    fireEvent.click(screen.getByRole("checkbox", { name: "billing" }));
    await waitFor(() => expect(within(grid).getByText("index.updated")).toBeTruthy());

    const rows = within(grid).getAllByRole("row");
    expect(rows[0]?.classList.contains("h-control-md")).toBe(true);
    expect(rows[0]?.style.gridTemplateColumns).toContain("minmax(");
    const genericPinnedHeaders = rows[0]?.querySelectorAll('[data-sticky-column]');
    expect(genericPinnedHeaders).toHaveLength(2);
    expect(genericPinnedHeaders?.[0]?.classList.contains("sticky")).toBe(true);
    expect(genericPinnedHeaders?.[1]?.classList.contains("left-[44px]")).toBe(true);
    const row = within(grid).getByText("invoice.created").closest<HTMLElement>('[role="row"]')!;
    expect(row.style.height).toBe("32px");
    const genericPinnedCells = row.querySelectorAll('[data-sticky-column]');
    expect(genericPinnedCells).toHaveLength(2);
    expect(genericPinnedCells[0]?.classList.contains("left-0")).toBe(true);
    expect(genericPinnedCells[1]?.classList.contains("left-[44px]")).toBe(true);
    expect(genericPinnedCells[1]?.classList.contains("bg-surface-floating")).toBe(true);
    expect(genericPinnedCells[1]?.classList.contains("before:bg-hover")).toBe(false);
    expect(genericPinnedCells[1]?.classList.contains("group-hover/log-row:bg-hover")).toBe(true);
    fireEvent.keyDown(row, { key: "Enter" });
    const detail = await screen.findByRole("complementary", { name: /job-1 details/i });
    expect(within(detail).getByText("Service")).toBeTruthy();
    expect(within(detail).getByText("billing")).toBeTruthy();
    const previousRecord = within(detail).getByRole<HTMLButtonElement>("button", { name: "Previous record" });
    const nextRecord = within(detail).getByRole<HTMLButtonElement>("button", { name: "Next record" });
    expect(previousRecord.disabled && nextRecord.disabled).toBe(false);
    fireEvent.click(previousRecord.disabled ? nextRecord : previousRecord);
    const nextDetail = await screen.findByRole("complementary", { name: /job-2 details/i });
    const nextPreviousRecord = within(nextDetail).getByRole<HTMLButtonElement>("button", { name: "Previous record" });
    const nextNextRecord = within(nextDetail).getByRole<HTMLButtonElement>("button", { name: "Next record" });
    expect(nextPreviousRecord.disabled && nextNextRecord.disabled).toBe(false);
    fireEvent.click(nextPreviousRecord.disabled ? nextNextRecord : nextPreviousRecord);
    expect(await screen.findByRole("complementary", { name: /job-1 details/i })).toBeTruthy();
  });

  it("renders a virtualized HTTP request log explorer with static records", async () => {
    render(<div style={{ height: 640 }}><InfiniteLogTable enableLive={false} records={createMockLogRecords({ days: 2 })} /></div>);

    await waitFor(() => expect(screen.getByRole("grid", { name: "HTTP request log table" })).toBeTruthy());
    const openedInput = screen.getByRole<HTMLInputElement>("combobox", { name: "Filters" });
    expect(openedInput.placeholder).toMatch(/search request id/i);
    const openedControl = openedInput?.closest('[data-slot="input-group"]');
    expect(openedControl?.getAttribute("data-size")).toBe("md");
    expect(openedControl?.classList.contains("h-control-md")).toBe(true);
    expect(openedControl?.classList.contains("min-w-0")).toBe(true);
    const toolbar = openedInput.closest("header");
    expect(toolbar?.classList.contains("flex-nowrap")).toBe(true);
    expect(screen.getByRole("button", { name: "Refresh" }).parentElement?.classList.contains("shrink-0")).toBe(true);
    const timelineSlider = screen.getByRole("slider", { name: "Request trend time range" });
    expect(timelineSlider).toBeTruthy();
    expect(timelineSlider.closest("section")?.parentElement?.classList.contains("z-action")).toBe(true);
    expect(timelineSlider.querySelector("[data-chart]")?.className).toContain("[&_.recharts-tooltip-wrapper]:!z-tooltip");
    expect(screen.getByText("Live").closest("button")?.hasAttribute("disabled")).toBe(true);
    expect(document.querySelectorAll('[role="row"]').length).toBeLessThan(90);
    const firstLogRow = screen.getAllByRole("checkbox", { name: /Select req_/ })[0]?.closest<HTMLElement>('[role="row"]');
    expect(firstLogRow?.style.height).toBe("32px");
    const pinnedCells = firstLogRow?.querySelectorAll('[data-sticky-column]');
    expect(pinnedCells).toHaveLength(2);
    expect(pinnedCells?.[0]?.classList.contains("sticky")).toBe(true);
    expect(pinnedCells?.[1]?.classList.contains("left-[44px]")).toBe(true);
    expect(pinnedCells?.[1]?.classList.contains("bg-surface-floating")).toBe(true);
    expect(pinnedCells?.[1]?.classList.contains("before:bg-hover")).toBe(false);
    expect(pinnedCells?.[1]?.classList.contains("group-hover/log-row:bg-hover")).toBe(true);

    const grid = screen.getByRole("grid", { name: "HTTP request log table" });
    expect(within(grid).getAllByRole("row")[0]?.classList.contains("h-control-md")).toBe(true);
    const httpGridTemplateColumns = within(grid).getAllByRole("row")[0]?.querySelector<HTMLElement>(".grid")?.style.gridTemplateColumns;
    expect(httpGridTemplateColumns).toContain("minmax(");
    expect(httpGridTemplateColumns).toContain("120px 120px");
    const pinnedHeaders = within(grid).getAllByRole("row")[0]?.querySelectorAll('[data-sticky-column]');
    expect(pinnedHeaders).toHaveLength(2);
    expect(pinnedHeaders?.[0]?.classList.contains("left-0")).toBe(true);
    expect(pinnedHeaders?.[1]?.classList.contains("left-[44px]")).toBe(true);
    const titledHeaders = within(grid).getAllByRole("columnheader").slice(1);
    expect(titledHeaders).toHaveLength(9);
    expect(titledHeaders.every((header) => Boolean(header.querySelector("svg")))).toBe(true);
    expect(grid.querySelector("time")?.textContent).toMatch(/^\d{4} \d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    const successBadge = grid.querySelector<HTMLElement>('[data-outcome="success"]');
    const successFilter = screen.getByRole("checkbox", { name: "success" });
    const successTrendMarker = screen.getByText("Success").querySelector("span");
    expect(successBadge?.getAttribute("style")).toContain("var(--fg-brand)");
    expect(successBadge?.getAttribute("style")).toContain("var(--brand)");
    expect(successFilter.querySelector(".bg-brand")).toBeTruthy();
    expect(successTrendMarker?.getAttribute("style")).toContain("var(--brand)");
    const staticHeader = within(grid).getByRole("columnheader", { name: /Outcome/ }).querySelector("span");
    const sortableHeader = within(grid).getByRole("columnheader", { name: /Status/ }).querySelector("span");
    for (const header of [staticHeader, sortableHeader]) {
      expect(header?.classList.contains("text-body")).toBe(true);
      expect(header?.classList.contains("font-medium")).toBe(true);
      expect(header?.classList.contains("text-fg-default")).toBe(true);
    }

    fireEvent.focus(openedInput);
    const hostSuggestion = await screen.findByRole("option", { name: /Host/ });
    expect(hostSuggestion.querySelector("svg")).toBeTruthy();
    fireEvent.click(hostSuggestion);
    expect(openedInput.value).toBe("host:");
    expect(await screen.findByRole("option", { name: /api\.zeron\.dev/ })).toBeTruthy();
    expect(screen.getByText("Values", { selector: "[cmdk-group-heading]" })).toBeTruthy();
    expect(screen.queryByText("Filters", { selector: "[cmdk-group-heading]" })).toBeNull();
  });

  it("filters HTTP columns from their header dropdown with multiple checkbox selections", async () => {
    const onStateChange = vi.fn();
    render(<div style={{ height: 640 }}><InfiniteLogTable enableLive={false} onStateChange={onStateChange} records={createMockLogRecords({ days: 2 })} /></div>);
    const grid = await screen.findByRole("grid", { name: "HTTP request log table" });

    fireEvent.click(within(grid).getByRole("button", { name: "Filter Outcome" }));
    const outcomeOptions = await screen.findByRole("group", { name: "Filter Outcome" });
    fireEvent.click(within(outcomeOptions).getByRole("checkbox", { name: "success" }));
    await waitFor(() => expect(grid.querySelector('[aria-label="Outcome active filters: 1"]')?.textContent).toBe("1"));
    fireEvent.click(within(outcomeOptions).getByRole("checkbox", { name: "warning" }));

    await waitFor(() => expect(onStateChange).toHaveBeenLastCalledWith(expect.objectContaining({
      filters: expect.objectContaining({ outcomes: ["success", "warning"] }),
    })));
    expect(within(grid).getByRole("button", { name: "Filter Outcome" })).toBeTruthy();
    await waitFor(() => expect(grid.querySelector('[aria-label="Outcome active filters: 2"]')?.textContent).toBe("2"));

    fireEvent.click(within(grid).getByRole("button", { name: "Filter and sort Status" }));
    fireEvent.click(screen.getByRole("button", { name: "Sort ascending" }));
    await waitFor(() => expect(onStateChange).toHaveBeenLastCalledWith(expect.objectContaining({
      sort: { direction: "asc", field: "status" },
    })));
    await waitFor(() => expect(grid.querySelector('[aria-label="Status sorted ascending"] svg')).toBeTruthy());

    fireEvent.click(within(grid).getByRole("button", { name: "Filter Method" }));
    const methodOptions = await screen.findByRole("group", { name: "Filter Method" });
    const methodScrollArea = methodOptions.closest<HTMLElement>('[data-slot="scroll-area"]');
    expect(methodScrollArea?.classList.contains("h-52")).toBe(true);
    expect(methodScrollArea?.querySelector('[data-slot="scroll-area-viewport"]')?.classList.contains("overscroll-contain")).toBe(true);
  });

  it("filters generic multi-select fields from their header dropdown", async () => {
    const onStateChange = vi.fn();
    const records = [
      { id: "job-1", timestamp: "2026-08-22T00:00:00.000Z", service: "billing", event: "invoice.created" },
      { id: "job-2", timestamp: "2026-08-22T00:01:00.000Z", service: "search", event: "index.updated" },
    ];
    render(<div style={{ height: 640 }}><InfiniteLogTable enableLive={false} onStateChange={onStateChange} records={records} /></div>);
    const grid = await screen.findByRole("grid", { name: "Log table" });

    fireEvent.click(within(grid).getByRole("button", { name: "Filter and sort Service" }));
    const serviceOptions = await screen.findByRole("group", { name: "Filter Service" });
    fireEvent.click(within(serviceOptions).getByRole("checkbox", { name: "billing" }));
    fireEvent.click(within(serviceOptions).getByRole("checkbox", { name: "search" }));

    await waitFor(() => expect(onStateChange).toHaveBeenLastCalledWith(expect.objectContaining({
      filters: expect.objectContaining({
        fields: expect.objectContaining({ service: { operator: "isAnyOf", value: ["billing", "search"] } }),
      }),
    })));
  });

  it("filters to a selected trend range and pauses Live", async () => {
    const onStateChange = vi.fn();
    render(<div style={{ height: 640 }}><InfiniteLogTable onStateChange={onStateChange} records={createMockLogRecords({ days: 2 })} /></div>);
    const slider = await screen.findByRole("slider", { name: "Request trend time range" });
    vi.spyOn(slider, "getBoundingClientRect").mockReturnValue({
      bottom: 56,
      height: 56,
      left: 0,
      right: 600,
      top: 0,
      width: 600,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });

    fireEvent.pointerDown(slider, { button: 0, clientX: 450, pointerId: 1 });
    fireEvent.pointerUp(slider, { button: 0, clientX: 450, pointerId: 1 });

    await waitFor(() => expect(onStateChange).toHaveBeenLastCalledWith(expect.objectContaining({
      filters: expect.objectContaining({
        timeRange: expect.objectContaining({ from: expect.any(String), to: expect.any(String) }),
      }),
      live: false,
    })));
    const selectedRange = onStateChange.mock.lastCall?.[0]?.filters.timeRange;
    expect(Date.parse(selectedRange.to) - Date.parse(selectedRange.from)).toBeLessThan(2 * 24 * 60 * 60 * 1000);
    await waitFor(() => {
      const trigger = screen.getByRole("combobox", { name: "Time range" });
      expect(trigger.textContent).not.toContain("Select time range");
      expect(trigger.textContent).not.toContain("Custom");
      expect(trigger.textContent).toMatch(/^\d{4} \d{2}-\d{2} \d{2}:\d{2}:\d{2} – \d{4} \d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
      expect(trigger.classList.contains("overflow-hidden")).toBe(true);
      expect(trigger.parentElement?.classList.contains("min-w-0")).toBe(true);

      const queryInput = screen.getByRole<HTMLInputElement>("combobox", { name: "Filters" });
      expect(queryInput.value).toMatch(/^time:"\d{4} \d{2}-\d{2} \d{2}:\d{2}:\d{2}\.\.\d{4} \d{2}-\d{2} \d{2}:\d{2}:\d{2}"$/);
      expect(queryInput.value).not.toMatch(/[TZ]/);
    });
    expect(screen.queryByRole("button", { name: /select date and time/i })).toBeNull();
  });

  it("offers and applies common time ranges", async () => {
    const onStateChange = vi.fn();
    const records = createMockLogRecords({ days: 2 });
    render(<div style={{ height: 640 }}><InfiniteLogTable enableLive={false} onStateChange={onStateChange} records={records} /></div>);
    await waitFor(() => expect(screen.getByRole("grid", { name: "HTTP request log table" })).toBeTruthy());

    const timeRangeSelect = screen.getByRole("combobox", { name: "Time range" });
    fireEvent.click(timeRangeSelect);
    for (const label of ["Last 30 minutes", "Last hour", "Last 12 hours", "Last day", "Last 3 days", "Last week", "Last 2 weeks", "Custom"]) {
      expect(await screen.findByRole("option", { name: label })).toBeTruthy();
    }

    fireEvent.click(screen.getByRole("option", { name: "Last 30 minutes" }));
    await waitFor(() => expect(onStateChange).toHaveBeenLastCalledWith(expect.objectContaining({
      filters: expect.objectContaining({ timeRange: expect.objectContaining({ from: expect.any(String), to: expect.any(String) }) }),
    })));
    const presetRange = onStateChange.mock.lastCall?.[0]?.filters.timeRange;
    expect(Date.parse(presetRange.to) - Date.parse(presetRange.from)).toBe(30 * 60_000);
    expect(Date.parse(presetRange.to)).toBeGreaterThanOrEqual(Math.max(...records.map((record) => Date.parse(record.timestamp))));
    await waitFor(() => expect(within(screen.getByRole("grid", { name: "HTTP request log table" })).getAllByRole("row").length).toBeGreaterThan(1));
    await waitFor(() => {
      const selection = document.querySelector<HTMLElement>('[data-slot="time-range-histogram-selection"]');
      expect(selection?.style.width).not.toBe("100%");
    });
  });

  it("opens the request detail from a keyboard-operable virtual row", async () => {
    const records = createMockLogRecords({ days: 1 });
    render(<div style={{ height: 640 }}><InfiniteLogTable enableLive={false} records={records} /></div>);
    await waitFor(() => expect(screen.getAllByRole("row").length).toBeGreaterThan(1));

    const row = screen.getAllByRole("row")[1]!;
    fireEvent.keyDown(row, { key: "Enter" });

    const detail = await screen.findByRole("complementary", { name: /request details/i });
    expect(screen.getByRole("separator", { name: "Resize log details" })).toBeTruthy();
    expect(detail.classList.contains("w-full")).toBe(true);
    expect(row.getAttribute("aria-selected")).toBe("true");
    expect(row.hasAttribute("data-detail-active")).toBe(true);
    expect(row.classList.contains("shadow-[inset_2px_0_0_var(--brand)]")).toBe(true);
    const detailPanel = detail.closest<HTMLElement>('[data-slot="resizable-panel"]');
    expect(detailPanel?.classList.contains("size-full")).toBe(true);
    const grid = screen.getByRole("grid", { name: "HTTP request log table" });
    expect(grid.classList.contains("overflow-x-auto")).toBe(true);
    const resultsPanel = grid.closest<HTMLElement>('[data-slot="resizable-panel"]');
    expect(resultsPanel?.firstElementChild?.classList.contains("w-full")).toBe(true);
    await waitFor(() => expect(screen.getByText("Headers")).toBeTruthy());
    const initialRecordId = detail.querySelector("header p")?.textContent;
    const previousRequest = within(detail).getByRole<HTMLButtonElement>("button", { name: "Previous request" });
    const nextRequest = within(detail).getByRole<HTMLButtonElement>("button", { name: "Next request" });
    expect(previousRequest.disabled).toBe(true);
    expect(nextRequest.disabled).toBe(false);
    expect(previousRequest.querySelector('[data-slot="button-background"]')?.classList.contains("border")).toBe(true);
    expect(nextRequest.querySelector('[data-slot="button-background"]')?.classList.contains("border")).toBe(true);
    fireEvent.click(nextRequest);
    await waitFor(() => expect(detail.querySelector("header p")?.textContent).not.toBe(initialRecordId));
    expect(row.getAttribute("aria-selected")).not.toBe("true");
    const nextRow = screen.getAllByRole("row")[2]!;
    expect(nextRow.getAttribute("aria-selected")).toBe("true");
    expect(previousRequest.disabled).toBe(false);
    fireEvent.click(previousRequest);
    await waitFor(() => expect(detail.querySelector("header p")?.textContent).toBe(initialRecordId));
    fireEvent.click(screen.getByRole("button", { name: "Copy JSON" }));
    await waitFor(() => expect(screen.getByText("Copied")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Close request details" }));
    await waitFor(() => expect(screen.queryByRole("complementary", { name: /request details/i })).toBeNull());
    expect(row.hasAttribute("data-detail-active")).toBe(false);
  });

  it("batches facet changes before refreshing the result query", async () => {
    const onStateChange = vi.fn();
    render(<div style={{ height: 640 }}><InfiniteLogTable enableLive={false} onStateChange={onStateChange} records={createMockLogRecords({ days: 2 })} /></div>);
    await waitFor(() => expect(screen.getByRole("grid", { name: "HTTP request log table" })).toBeTruthy());

    const filters = screen.getByRole("complementary", { name: "Log filters" });
    const successOption = screen.getByRole("checkbox", { name: "success" });
    const warningOption = screen.getByRole("checkbox", { name: "warning" });
    expect(filters.contains(successOption)).toBe(true);
    expect(filters.contains(warningOption)).toBe(true);
    fireEvent.click(successOption);
    fireEvent.click(warningOption);
    expect(onStateChange).not.toHaveBeenCalled();

    await waitFor(() => expect(onStateChange).toHaveBeenLastCalledWith(expect.objectContaining({
      filters: expect.objectContaining({ outcomes: ["success", "warning"] }),
    })));
    expect(onStateChange).toHaveBeenCalledTimes(1);
  });

  it("uses the shared range slider for latency and commits only after dragging", async () => {
    const onStateChange = vi.fn();
    render(<div style={{ height: 640 }}><InfiniteLogTable enableLive={false} onStateChange={onStateChange} records={createMockLogRecords({ days: 2 })} /></div>);
    await waitFor(() => expect(screen.getByRole("grid", { name: "HTTP request log table" })).toBeTruthy());

    const filters = screen.getByRole("complementary", { name: "Log filters" });
    fireEvent.click(within(filters).getByRole("button", { name: "Latency" }));
    const latencyPanel = screen.getByRole("region", { name: "Latency" });
    const minimum = screen.getByRole("slider", { name: "Latency minimum" });
    const maximum = screen.getByRole("slider", { name: "Latency maximum" });
    const latencyField = minimum.closest("[data-slot='field']") as HTMLElement;
    const pointerTrack = minimum.closest("[role='group']")?.nextElementSibling as HTMLElement;
    expect(within(latencyField).getByText("Min.")).toBeTruthy();
    expect(within(latencyField).getByText("Max.")).toBeTruthy();
    expect(maximum).toBeTruthy();
    expect(within(latencyPanel).queryByRole("button", { name: "Apply" })).toBeNull();

    Object.defineProperty(pointerTrack, "offsetWidth", { configurable: true, value: 200 });
    vi.spyOn(pointerTrack, "getBoundingClientRect").mockReturnValue({
      bottom: 32,
      height: 32,
      left: 0,
      right: 200,
      top: 0,
      width: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    const callsBeforeDrag = onStateChange.mock.calls.length;
    fireEvent.pointerDown(pointerTrack, { button: 0, clientX: 10, pointerId: 1 });
    fireEvent.pointerMove(pointerTrack, { clientX: 100, pointerId: 1 });
    const previewMinimum = Number((minimum as HTMLInputElement).value);
    expect(previewMinimum).toBeGreaterThan(0);
    expect(within(latencyField).getByText(`${previewMinimum} ms`)).toBeTruthy();
    expect(onStateChange).toHaveBeenCalledTimes(callsBeforeDrag);
    fireEvent.pointerUp(pointerTrack, { clientX: 100, pointerId: 1 });

    await waitFor(() => expect(onStateChange).toHaveBeenLastCalledWith(expect.objectContaining({
      filters: expect.objectContaining({ latency: { min: previewMinimum } }),
    })));
  });

  it("shows flat timing phase range filters and commits only after dragging", async () => {
    const onStateChange = vi.fn();
    render(<div style={{ height: 640 }}><InfiniteLogTable enableLive={false} onStateChange={onStateChange} records={createMockLogRecords({ days: 2 })} /></div>);
    await waitFor(() => expect(screen.getByRole("grid", { name: "HTTP request log table" })).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: "Timing phases" }));
    const timingPanel = screen.getByRole("region", { name: "Timing phases" });
    const minimum = screen.getByRole("slider", { name: "DNS lookup minimum" });
    const timingField = minimum.closest("[data-slot='field']") as HTMLElement;
    const pointerTrack = minimum.closest("[role='group']")?.nextElementSibling as HTMLElement;
    expect(within(timingField).getByText("Min.")).toBeTruthy();
    expect(within(timingField).getByText("Max.")).toBeTruthy();
    expect(within(timingField).getByText("0 ms")).toBeTruthy();
    expect(within(timingField).getByText("200 ms")).toBeTruthy();
    expect(screen.getByRole("slider", { name: "DNS lookup maximum" })).toBeTruthy();
    expect(screen.getByRole("slider", { name: "TCP connection minimum" })).toBeTruthy();
    expect(screen.getByRole("slider", { name: "TLS handshake minimum" })).toBeTruthy();
    expect(screen.getByRole("slider", { name: "Time to first byte minimum" })).toBeTruthy();
    expect(screen.getByRole("slider", { name: "Response transfer minimum" })).toBeTruthy();
    expect(within(timingPanel).queryByRole("button")).toBeNull();

    Object.defineProperty(pointerTrack, "offsetWidth", { configurable: true, value: 200 });
    vi.spyOn(pointerTrack, "getBoundingClientRect").mockReturnValue({
      bottom: 32,
      height: 32,
      left: 0,
      right: 200,
      top: 0,
      width: 200,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    const callsBeforeDrag = onStateChange.mock.calls.length;
    fireEvent.pointerDown(pointerTrack, { button: 0, clientX: 10, pointerId: 1 });
    fireEvent.pointerMove(pointerTrack, { clientX: 60, pointerId: 1 });
    expect(onStateChange).toHaveBeenCalledTimes(callsBeforeDrag);
    expect(within(timingField).getByText("60 ms")).toBeTruthy();
    fireEvent.pointerUp(pointerTrack, { clientX: 60, pointerId: 1 });

    await waitFor(() => expect(onStateChange).toHaveBeenLastCalledWith(expect.objectContaining({
      filters: expect.objectContaining({ timing: { dns: { min: 60 } } }),
    })));
  });

  it("customizes visible columns and reorders them from the columns dropdown", async () => {
    render(<div style={{ height: 640 }}><InfiniteLogTable enableLive={false} records={createMockLogRecords({ days: 1 })} /></div>);
    await waitFor(() => expect(screen.getByRole("grid", { name: "HTTP request log table" })).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: "Customize columns" }));
    const hostVisibility = await screen.findByRole("checkbox", { name: "Show Host column" });
    fireEvent.click(hostVisibility);
    await waitFor(() => expect(screen.queryByRole("columnheader", { name: /Host/ })).toBeNull());

    const outcomeHandle = screen.getByRole("button", { name: "Reorder Outcome" });
    fireEvent.keyDown(outcomeHandle, { key: " " });
    fireEvent.keyDown(outcomeHandle, { key: "ArrowUp" });
    fireEvent.keyDown(outcomeHandle, { key: " " });

    await waitFor(() => {
      const headers = screen.getAllByRole("columnheader");
      expect(headers[1]?.textContent).toContain("Outcome");
      expect(headers[2]?.textContent).toContain("Time range");
    });
  });

  it("keeps one anchored boundary row for Live requests added since the last viewed position", async () => {
    const template = createMockLogRecords({ days: 1 })[0]!;
    const historical = [
      { ...template, id: "seen-latest", timestamp: "2026-08-22T12:00:00.000Z" },
      { ...template, id: "seen-older", timestamp: "2026-08-22T11:59:00.000Z" },
    ];
    const firstLive = { ...template, id: "live-1", timestamp: "2026-08-22T12:01:00.000Z" };
    const secondLive = { ...template, id: "live-2", timestamp: "2026-08-22T12:02:00.000Z" };
    let emit: ((batch: InfiniteLogLiveBatch) => void) | undefined;
    const metadata = createInfiniteLogMetadata(historical, defaultInfiniteLogFilters);
    const dataSource: InfiniteLogDataSource = {
      loadPage: vi.fn(async () => ({
        metadata,
        newerCheckpoint: "checkpoint-1",
        rows: historical,
        snapshotRevision: "revision-1",
      })),
      loadMetadata: vi.fn(async () => metadata),
      subscribeNewer: vi.fn((options) => {
        emit = options.onBatch;
        return () => {};
      }),
    };

    render(<div style={{ height: 640 }}><InfiniteLogTable dataSource={dataSource} /></div>);
    await waitFor(() => expect(emit).toBeTypeOf("function"));
    expect(screen.getByRole("button", { name: "Pause" }).querySelector('[data-slot="button-background"]')?.classList.contains("bg-inverse-background")).toBe(true);

    emit?.({ metadata, rows: [firstLive] });
    await waitFor(() => {
      expect(screen.getByRole("row", { name: "1 new request above" })).toBeTruthy();
      const liveRow = screen.getByRole("row", { name: /Select live-1/ });
      expect(liveRow.hasAttribute("data-live-new")).toBe(true);
      expect(liveRow.classList.contains("bg-[color-mix(in_oklch,var(--info-surface)_50%,var(--surface-floating))]")).toBe(true);
      for (const stickyCell of liveRow.querySelectorAll("[data-sticky-column]")) {
        expect(stickyCell.classList.contains("bg-[color-mix(in_oklch,var(--info-surface)_50%,var(--surface-floating))]")).toBe(true);
        expect(stickyCell.classList.contains("group-hover/log-row:bg-[color-mix(in_oklch,var(--info-surface)_70%,var(--surface-floating))]")).toBe(true);
      }
    });

    const grid = screen.getByRole("grid", { name: "HTTP request log table" });
    grid.scrollTop = 120;
    fireEvent.scroll(grid);

    emit?.({ metadata, rows: [secondLive] });
    fireEvent.click(await screen.findByRole("button", { name: "1 new request" }));
    await waitFor(() => {
      expect(screen.getByRole("row", { name: "2 new requests above" })).toBeTruthy();
      expect(screen.getAllByRole("row", { name: /new requests? above/ })).toHaveLength(1);
    });
  });
});
