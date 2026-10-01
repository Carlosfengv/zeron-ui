// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StorageUsage, storageUsageDemoData } from "@zeron/blocks/storage-usage-01";
import { MetricCard } from "@zeron/ui/metric-card";

afterEach(cleanup);

// Typography is verified in the browser; this suite exercises data and state behavior.
vi.mock("../packages/blocks/src/application/storage-usage-01/storage-usage.module.css", () => ({
  default: { metricTitle: "metricTitle" },
}));

describe("Storage Usage", () => {
  it("keeps the summary, category proportions and remainder consistent", () => {
    const { container } = render(<StorageUsage data={storageUsageDemoData} />);
    expect(screen.getByText("94%")).toBeTruthy();
    expect(screen.getByText("18.8 GB used of 20 GB")).toBeTruthy();
    expect(screen.getByText("1.2 GB remaining")).toBeTruthy();
    const bar = screen.getByRole("progressbar", { name: "Storage Usage" });
    expect(Number(bar.getAttribute("aria-valuenow"))).toBeCloseTo(18.8);
    expect(bar.getAttribute("aria-valuemax")).toBe("20");
    expect(screen.getAllByRole("listitem")).toHaveLength(6);
    const widths = [...container.querySelectorAll<HTMLSpanElement>("[data-slot=storage-usage-bar]>span")]
      .map((node) => Number(node.style.flexGrow));
    expect(widths.reduce((sum, width) => sum + width, 0)).toBeCloseTo(1);
    expect(widths[0]).toBeCloseTo(5.27 / 20);
    expect(widths[6]).toBeCloseTo(1.2 / 20);
  });

  it("normalizes invalid input and preserves actual over-capacity usage", () => {
    const { rerender, container } = render(<StorageUsage data={{ capacity: 0, items: [] }} />);
    expect(screen.getByText("0%")).toBeTruthy();
    expect(screen.queryByRole("list")).toBeNull();
    rerender(<StorageUsage data={{ capacity: 10, items: [
      { id: "a", label: "A", value: 15, color: "cyan" },
      { id: "b", label: "B", value: -1, color: "red" },
      { id: "c", label: "C", value: NaN, color: "gray" },
    ] }} />);
    expect(screen.getByText("150%")).toBeTruthy();
    expect(screen.getByText("15 GB used of 10 GB")).toBeTruthy();
    expect(screen.getByText("0 GB remaining")).toBeTruthy();
    expect(container.querySelector("[data-slot=storage-usage-remaining]")).toBeNull();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuemax")).toBe("15");
    rerender(<StorageUsage data={{ capacity: Infinity, items: [{ id: "a", label: "A", value: 1, color: "cyan" }] }} />);
    expect(screen.getByText("—")).toBeTruthy();
    expect(screen.getByText("1 GB used of 0 GB")).toBeTruthy();
  });

  it("hides unavailable figures and distribution while exposing loading and error states", () => {
    const { container, rerender } = render(<StorageUsage data={storageUsageDemoData} state="loading" />);
    expect(container.querySelector("[aria-busy=true]")).toBeTruthy();
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.queryByText("18.8 GB used of 20 GB")).toBeNull();
    rerender(<StorageUsage data={storageUsageDemoData} state="error" statusMessage="Storage failed" />);
    expect(screen.getByRole("alert").textContent).toBe("Storage failed");
    expect(screen.queryByText("1.2 GB remaining")).toBeNull();
    expect(screen.queryByRole("progressbar")).toBeNull();
    rerender(<StorageUsage data={storageUsageDemoData} state="stale" statusMessage="Updated yesterday" />);
    expect(screen.getByRole("status").textContent).toBe("Updated yesterday");
    expect(screen.getByRole("progressbar")).toBeTruthy();
  });

  it("supports localized summaries and the public whole-card action", () => {
    const onClick = vi.fn();
    render(<StorageUsage data={storageUsageDemoData} label="存储用量" onClick={onClick} actionLabel="查看存储详情" formatters={{
      usageSummary: (used, capacity, unit) => `已使用 ${used} / ${capacity} ${unit}`,
      remaining: (value, unit) => `剩余 ${value} ${unit}`,
    }} />);
    expect(screen.getByText("已使用 18.8 / 20 GB")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "查看存储详情" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("retains MetricCard's default stacked layout and existing breakdown", () => {
    const { container } = render(<MetricCard label="Calls" value={42} meta="Today" content={{ type: "breakdown", items: [{ label: "Success", value: 40 }] }} />);
    expect(container.querySelector("[data-slot=metric-card]")?.getAttribute("data-layout")).toBe("stacked");
    expect(screen.getByText("42")).toBeTruthy();
    expect(screen.getByText("Today")).toBeTruthy();
    expect(screen.getByRole("listitem").textContent).toBe("Success40");
  });
});
