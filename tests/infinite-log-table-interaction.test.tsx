// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { InfiniteLogTable } from "../packages/blocks/src/application/infinite-log-table-01/infinite-log-table";
import { createInfiniteLogMetadata } from "../packages/blocks/src/application/infinite-log-table-01/infinite-log-data-source";
import { createMockLogRecords } from "../packages/blocks/src/application/infinite-log-table-01/infinite-log-mocks";
import { defaultInfiniteLogFilters, type InfiniteLogDataSource, type InfiniteLogLiveBatch } from "../packages/blocks/src/application/infinite-log-table-01/infinite-log-types";

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
    expect(within(grid).getByRole("button", { name: "Service" })).toBeTruthy();
    expect(within(grid).getByRole("button", { name: "Duration" })).toBeTruthy();
    expect(within(grid).getByText("invoice.created")).toBeTruthy();
    expect(screen.getByRole("checkbox", { name: "billing" })).toBeTruthy();

    fireEvent.click(screen.getByRole("checkbox", { name: "billing" }));
    await waitFor(() => expect(within(grid).queryByText("index.updated")).toBeNull());

    const row = within(grid).getAllByRole("row")[1]!;
    fireEvent.keyDown(row, { key: "Enter" });
    const dialog = await screen.findByRole("dialog", { name: /job-1 details/i });
    expect(within(dialog).getByText("Service")).toBeTruthy();
    expect(within(dialog).getByText("billing")).toBeTruthy();
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
    expect(screen.getByRole("slider", { name: "Request trend time range" })).toBeTruthy();
    expect(screen.getByText("Live").closest("button")?.hasAttribute("disabled")).toBe(true);
    expect(document.querySelectorAll('[role="row"]').length).toBeLessThan(90);

    const grid = screen.getByRole("grid", { name: "HTTP request log table" });
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
    const sortableHeader = within(grid).getByRole("button", { name: "Status" });
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
    render(<div style={{ height: 640 }}><InfiniteLogTable enableLive={false} onStateChange={onStateChange} records={createMockLogRecords({ days: 2 })} /></div>);
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
    await waitFor(() => {
      const selection = document.querySelector<HTMLElement>('[data-slot="time-range-histogram-selection"]');
      expect(selection?.style.width).not.toBe("100%");
    });
  });

  it("opens the request detail from a keyboard-operable virtual row", async () => {
    render(<div style={{ height: 640 }}><InfiniteLogTable enableLive={false} records={createMockLogRecords({ days: 1 })} /></div>);
    await waitFor(() => expect(screen.getAllByRole("row").length).toBeGreaterThan(1));

    const row = screen.getAllByRole("row")[1]!;
    fireEvent.keyDown(row, { key: "Enter" });

    await waitFor(() => expect(screen.getByRole("dialog", { name: /request details/i })).toBeTruthy());
    await waitFor(() => expect(screen.getByText("Headers")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Copy JSON" }));
    await waitFor(() => expect(screen.getByText("Copied")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Close request details" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: /request details/i })).toBeNull());
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

  it("shows flat timing phase range filters and commits only after dragging", async () => {
    const onStateChange = vi.fn();
    render(<div style={{ height: 640 }}><InfiniteLogTable enableLive={false} onStateChange={onStateChange} records={createMockLogRecords({ days: 2 })} /></div>);
    await waitFor(() => expect(screen.getByRole("grid", { name: "HTTP request log table" })).toBeTruthy());

    fireEvent.click(screen.getByRole("button", { name: "Timing phases" }));
    const timingPanel = screen.getByRole("region", { name: "Timing phases" });
    const minimum = screen.getByRole("slider", { name: "DNS lookup minimum" });
    const rangeControl = minimum.closest("[role='group']")?.parentElement;
    expect(rangeControl?.textContent).toContain("0 ms–200 ms");
    expect(rangeControl?.textContent).not.toContain("DNS lookup");
    expect(screen.getByRole("slider", { name: "DNS lookup maximum" })).toBeTruthy();
    expect(screen.getByRole("slider", { name: "TCP connection minimum" })).toBeTruthy();
    expect(screen.getByRole("slider", { name: "TLS handshake minimum" })).toBeTruthy();
    expect(screen.getByRole("slider", { name: "Time to first byte minimum" })).toBeTruthy();
    expect(screen.getByRole("slider", { name: "Response transfer minimum" })).toBeTruthy();
    expect(within(timingPanel).queryByRole("button")).toBeNull();

    vi.spyOn(rangeControl as HTMLElement, "getBoundingClientRect").mockReturnValue({
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
    fireEvent.pointerDown(rangeControl as HTMLElement, { button: 0, clientX: 0, pointerId: 1 });
    fireEvent.pointerMove(rangeControl as HTMLElement, { clientX: 50, pointerId: 1 });
    expect(onStateChange).toHaveBeenCalledTimes(callsBeforeDrag);
    fireEvent.pointerUp(rangeControl as HTMLElement, { clientX: 50, pointerId: 1 });

    await waitFor(() => expect(onStateChange).toHaveBeenLastCalledWith(expect.objectContaining({
      filters: expect.objectContaining({ timing: { dns: { min: 50 } } }),
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

    emit?.({ metadata, rows: [firstLive] });
    await waitFor(() => {
      expect(screen.getByRole("row", { name: "1 new request above" })).toBeTruthy();
      expect(screen.getByRole("row", { name: /Select live-1/ }).hasAttribute("data-live-new")).toBe(true);
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
