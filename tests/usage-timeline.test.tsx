// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { UsageTimeline, usageTimelineDemoNow, usageTimelineDemoProviders, usageTimelineZhLabels } from "@zeron/blocks/usage-timeline-01";
import { usageTimelineDay } from "../packages/blocks/src/application/usage-timeline-01/usage-timeline-data";

beforeEach(() => {
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true, addEventListener() {}, removeEventListener() {} })));
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const props = { providers: usageTimelineDemoProviders, now: usageTimelineDemoNow, timeZone: "Asia/Shanghai" };

describe("UsageTimeline", () => {
  it("shows all ten accounts and preserves risk colors when displaying remaining quota", () => {
    const { container } = render(<UsageTimeline {...props} />);
    expect(screen.getAllByRole("meter")).toHaveLength(10);
    expect(screen.getByText("Oct 8 – Oct 21", { exact: false })).toBeTruthy();
    const warning = container.querySelector('[data-slot="time-window-interval"][data-tone="warning"]');
    expect(warning?.getAttribute("aria-valuenow")).toBe("82");
    fireEvent.click(screen.getByRole("button", { name: "Left" }));
    expect(warning?.getAttribute("aria-valuenow")).toBe("18");
    expect(warning?.getAttribute("data-tone")).toBe("warning");
    expect(screen.getByRole("button", { name: "Left" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("meter", { name: /Starter|Disconnected/ })).toBeTruthy();
  });

  it("navigates dates, returns to today and changes period data and zoom", () => {
    const { container } = render(<UsageTimeline {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "Next period" }));
    expect(screen.getByText("Oct 15 – Oct 28", { exact: false })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Today" }));
    expect(screen.getByText("Oct 8 – Oct 21", { exact: false })).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "5-Hour" }));
    expect(container.querySelectorAll('[data-slot="time-window-tick"]')).toHaveLength(12);
    expect(screen.getByText(/24h/)).toBeTruthy();
    expect(screen.getByRole("meter", { name: /codex-personal|24% Used/ })).toBeTruthy();
  });

  it("calls controlled callbacks without mutating controlled values", () => {
    const onMeasureChange = vi.fn(); const onModeChange = vi.fn(); const onRangeStartChange = vi.fn();
    const start = usageTimelineDay(usageTimelineDemoNow, -7, "Asia/Shanghai");
    render(<UsageTimeline {...props} mode="weekly" measure="used" rangeStart={start}
      onMeasureChange={onMeasureChange} onModeChange={onModeChange} onRangeStartChange={onRangeStartChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Left" }));
    expect(onMeasureChange).toHaveBeenCalledWith("left");
    expect(screen.getByRole("button", { name: "Used" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(screen.getByRole("button", { name: "Next period" }));
    expect(onRangeStartChange).toHaveBeenCalledWith(usageTimelineDay(start, 7, "Asia/Shanghai"));
    expect(screen.getByText("Oct 8 – Oct 21", { exact: false })).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "Cycle" }));
    expect(onModeChange).toHaveBeenCalledWith("cycle");
    expect(screen.getByRole("tab", { name: "Weekly" }).getAttribute("aria-selected")).toBe("true");
  });

  it("preserves the navigated range when a controlled mode request is not accepted", () => {
    const onModeChange = vi.fn();
    const onRangeStartChange = vi.fn();
    render(<UsageTimeline {...props} mode="weekly" onModeChange={onModeChange} onRangeStartChange={onRangeStartChange} />);
    fireEvent.click(screen.getByRole("button", { name: "Next period" }));
    expect(screen.getByText("Oct 15 – Oct 28", { exact: false })).toBeTruthy();
    onRangeStartChange.mockClear();
    fireEvent.click(screen.getByRole("tab", { name: "5-Hour" }));
    expect(onModeChange).toHaveBeenCalledWith("five-hour");
    expect(onRangeStartChange).not.toHaveBeenCalled();
    expect(screen.getByText("Oct 15 – Oct 28", { exact: false })).toBeTruthy();
    expect(screen.getByRole("tab", { name: "Weekly" }).getAttribute("aria-selected")).toBe("true");
  });

  it("renders a previous window only when its real start is supplied", () => {
    const weekly = { start: Date.parse("2026-10-14T00:00:00+08:00"), end: Date.parse("2026-10-21T00:00:00+08:00"), usedPercent: 30 };
    const account = { ...props.providers[0].accounts[0], windows: { weekly } };
    const providers = [{ ...props.providers[0], accounts: [account] }];
    const { container, rerender } = render(<UsageTimeline {...props} providers={providers} />);
    expect(container.querySelector('[data-variant="earlier"]')).toBeNull();
    rerender(<UsageTimeline {...props} providers={[{ ...providers[0], accounts: [{ ...account, windows: { weekly: { ...weekly, previousStart: Date.parse("2026-10-11T00:00:00+08:00") } } }] }]} />);
    const earlier = container.querySelector<HTMLElement>('[data-variant="earlier"]');
    expect(earlier?.style.left).toBe(`${3 / 14 * 100}%`);
    expect(earlier?.style.width).toBe(`${3 / 14 * 100}%`);
  });

  it.each([Number.MAX_VALUE, -Number.MAX_VALUE, 8_640_000_000_000_000])("reports an unusable snapshot date %s without crashing", (now) => {
    render(<UsageTimeline {...props} now={now} />);
    expect(screen.getByRole("alert").textContent).toBe("Account usage data is invalid.");
  });

  it("rejects out-of-range window dates and viewport anchors", () => {
    const account = { ...props.providers[0].accounts[0], windows: { weekly: { start: 1e20, end: 1e20 + 1e10, usedPercent: 20 } } };
    const { rerender } = render(<UsageTimeline {...props} providers={[{ ...props.providers[0], accounts: [account] }]} />);
    expect(screen.getByRole("alert")).toBeTruthy();
    rerender(<UsageTimeline {...props} rangeStart={1e20} />);
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("handles empty, loading, error/retry, missing windows and localized labels", () => {
    const onRetry = vi.fn();
    const { rerender } = render(<UsageTimeline {...props} providers={[]} />);
    expect(screen.getByRole("status").textContent).toBe("No accounts to display");
    rerender(<UsageTimeline {...props} state="loading" />);
    expect(screen.getByRole("status").textContent).toBe("Loading account usage…");
    rerender(<UsageTimeline {...props} state="error" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
    rerender(<UsageTimeline {...props} providers={[{ ...props.providers[0], accounts: [{ ...props.providers[0].accounts[0], windows: {} }] }]} labels={usageTimelineZhLabels} locale="zh-CN" />);
    expect(screen.getByText("暂无该周期数据")).toBeTruthy();
    expect(screen.queryByRole("meter")).toBeNull();
    expect(screen.getByRole("button", { name: "今天" })).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "5 小时" }));
    expect(screen.getByText(/24小时/)).toBeTruthy();
  });

  it("rejects duplicate accounts, invalid percentages and unknown time zones", () => {
    const { rerender } = render(<UsageTimeline {...props} providers={[{ ...props.providers[0], accounts: [props.providers[0].accounts[0], props.providers[0].accounts[0]] }]} />);
    expect(screen.getByRole("alert").textContent).toBe("Account usage data is invalid.");
    rerender(<UsageTimeline {...props} timeZone="Invalid/Zone" />);
    expect(screen.getByRole("alert")).toBeTruthy();
    rerender(<UsageTimeline {...props} rangeStart={NaN} />);
    expect(screen.getByRole("alert")).toBeTruthy();
  });

  it("uses calendar days across 23-hour and 25-hour DST days", () => {
    const spring = Date.parse("2026-03-08T12:00:00-04:00");
    const fall = Date.parse("2026-11-01T12:00:00-05:00");
    expect(usageTimelineDay(spring, 1, "America/New_York") - usageTimelineDay(spring, 0, "America/New_York")).toBe(23 * 3_600_000);
    expect(usageTimelineDay(fall, 1, "America/New_York") - usageTimelineDay(fall, 0, "America/New_York")).toBe(25 * 3_600_000);
  });

  it("starts at the first valid instant when a time zone skips midnight", () => {
    const day = Date.parse("2018-11-04T12:00:00-02:00");
    expect(usageTimelineDay(day, 0, "America/Sao_Paulo")).toBe(Date.parse("2018-11-04T01:00:00-02:00"));
  });

  it("rejects a previous-window start that does not precede the current window", () => {
    const weekly = props.providers[0].accounts[0].windows.weekly!;
    const account = { ...props.providers[0].accounts[0], windows: { weekly: { ...weekly, previousStart: weekly.start } } };
    render(<UsageTimeline {...props} providers={[{ ...props.providers[0], accounts: [account] }]} />);
    expect(screen.getByRole("alert").textContent).toBe("Account usage data is invalid.");
  });
});
