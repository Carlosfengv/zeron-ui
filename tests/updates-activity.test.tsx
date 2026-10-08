// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { hydrateRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HeatmapChart, HeatmapCells, type HeatmapColumn } from "@zeron/ui/heatmap-chart";
import { UpdatesList } from "@/app/[locale]/updates/updates-list";
import type { CommitHistoryEntry } from "@docs/lib/commit-history.server";

const resolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"] });
  vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockImplementation(function (this: Intl.DateTimeFormat) { return { ...resolvedOptions.call(this), timeZone: "UTC" }; });
  window.matchMedia = () => ({ matches: true, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList;
  vi.stubGlobal("ResizeObserver", class {
    constructor(private callback: ResizeObserverCallback) {}
    observe(target: Element) { this.callback([{ target, contentRect: { width: 360, height: 200 } } as unknown as ResizeObserverEntry], this as unknown as ResizeObserver); }
    unobserve() {} disconnect() {}
  });
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => window.setTimeout(() => callback(performance.now()), 16));
  vi.stubGlobal("cancelAnimationFrame", (id: number) => window.clearTimeout(id));
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });
const settle = async () => { await act(async () => { vi.advanceTimersByTime(200); }); };
const history = { asOf: "2026-10-08T02:00:00Z", complete: true };
const commits: CommitHistoryEntry[] = Array.from({ length: 105 }, (_, index) => ({ id: `id-${index}`, shortId: String(index), committedAt: "2026-10-07T16:00:00Z", message: `Update ${index}`, author: "Carlos" }));
const cells: HeatmapColumn[] = [{ bin: 0, bins: [{ bin: 0, date: new Date("2026-10-04"), count: 1 }, { bin: 1, date: new Date("2026-10-05"), count: 2 }] }];
const dataCells = (container: HTMLElement) => Array.from(container.querySelectorAll('rect[data-slot="heatmap-cell"]')).filter(rect => rect.getAttribute("pointer-events") !== "none");

describe("heatmap selection", () => {
  it("selects exact bins via pointer click, Enter and Space without adding tab stops", async () => {
    const select = vi.fn();
    const view = render(<HeatmapChart animate={false} data={cells} onCellSelect={select}><HeatmapCells /></HeatmapChart>);
    await settle();
    fireEvent.click(dataCells(view.container)[1]);
    expect(select).toHaveBeenLastCalledWith(cells[0].bins[1]);
    const group = view.getByRole("group");
    fireEvent.keyDown(group, { key: "Home" });
    fireEvent.keyDown(group, { key: "Enter" });
    expect(select).toHaveBeenLastCalledWith(cells[0].bins[0]);
    fireEvent.keyDown(group, { key: "End" });
    fireEvent.keyDown(group, { key: " " });
    expect(select).toHaveBeenLastCalledWith(cells[0].bins[1]);
    fireEvent.keyDown(group, { key: "Escape" });
    fireEvent.keyDown(group, { key: "Enter" });
    expect(select).toHaveBeenCalledTimes(3);
    expect(view.container.querySelectorAll('[tabindex="0"]')).toHaveLength(1);
  });

  it.each([{ interactive: false, status: "ready" as const }, { interactive: true, status: "loading" as const }])("guards selection for %j", async ({ interactive, status }) => {
    const select = vi.fn();
    const view = render(<HeatmapChart animate={false} data={cells} onCellSelect={select} status={status}><HeatmapCells interactive={interactive} /></HeatmapChart>);
    await settle();
    fireEvent.click(dataCells(view.container)[0]);
    fireEvent.keyDown(view.getByRole("group"), { key: "End" });
    fireEvent.keyDown(view.getByRole("group"), { key: "Enter" });
    expect(select).not.toHaveBeenCalled();
    expect(view.getByRole("group").tabIndex).toBe(-1);
  });
});

describe("updates activity integration", () => {
  it("limits initial rendering, loads more, filters the full selected day and resets", async () => {
    const view = render(<UpdatesList activityHistory={history} commits={commits} locale="en" />);
    await settle();
    expect(view.getByText("Time zone: UTC")).toBeTruthy();
    expect(view.container.querySelectorAll("article")).toHaveLength(100);
    fireEvent.click(view.getByRole("button", { name: "Show more commits" }));
    expect(view.container.querySelectorAll("article")).toHaveLength(105);
    const group = view.getByRole("group");
    fireEvent.keyDown(group, { key: "End" });
    fireEvent.keyDown(group, { key: "ArrowLeft" }); // Oct 7 in UTC.
    expect(group.querySelector('[role="status"]')?.textContent).toBe("2026-10-07T00:00:00.000Z: 105");
    fireEvent.keyDown(group, { key: "Enter" });
    expect(view.getByRole("button", { name: "Show recent commits" })).toBeTruthy();
    expect(view.container.querySelectorAll("article")).toHaveLength(105);
    expect(view.container.querySelector('[data-slot="updates-activity-selection"]')).not.toBeNull();
    fireEvent.keyDown(group, { key: "End" });
    fireEvent.keyDown(group, { key: " " }); // Oct 8 has no commits.
    expect(view.getByText("No commits on this day.")).toBeTruthy();
    expect(view.container.querySelectorAll("article")).toHaveLength(0);
    fireEvent.click(view.getByRole("button", { name: "Show recent commits" }));
    expect(view.container.querySelectorAll("article")).toHaveLength(105);
  });

  it("shows unavailable history without a misleading zero-activity grid", async () => {
    const view = render(<UpdatesList activityHistory={{ ...history, complete: false }} commits={commits.slice(0, 1)} locale="zh-CN" />);
    await settle();
    expect(view.getByText("活跃度数据暂不可用，下方仍展示最近提交。")).toBeTruthy();
    expect(view.container.querySelector('[data-slot="heatmap-chart"]')).toBeNull();
    expect(view.container.querySelectorAll("article")).toHaveLength(1);
  });

  it("renders full-year activity with zero-count past days and blank future dates", async () => {
    const view = render(<UpdatesList activityHistory={history} commits={[]} locale="zh-CN" />);
    await settle();
    expect(view.getByText("今年暂无提交。")).toBeTruthy();
    expect(dataCells(view.container)).toHaveLength(281);
    expect(view.getByText("0 次提交")).toBeTruthy();
  });

  it("hydrates activity and list together before regrouping into the browser zone", async () => {
    const content = <UpdatesList activityHistory={history} commits={commits.slice(0, 1)} locale="zh-CN" />;
    const container = document.createElement("div");
    container.innerHTML = renderToString(content);
    expect(container.textContent).toContain("时区：UTC");
    document.body.append(container);
    vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockImplementation(function (this: Intl.DateTimeFormat) { return { ...resolvedOptions.call(this), timeZone: "Asia/Shanghai" }; });
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const recoverable: unknown[] = [];
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      await act(async () => { root = hydrateRoot(container, content, { onRecoverableError: error => recoverable.push(error) }); });
      await settle();
      expect(errors.mock.calls).toEqual([]);
      expect(recoverable).toEqual([]);
      expect(container.textContent).toContain("时区：Asia/Shanghai");
      expect(container.querySelector("section")?.getAttribute("aria-labelledby")).toBe("updates-2026-10-08");
      expect(dataCells(container)).toHaveLength(281);
    } finally {
      await act(async () => root?.unmount());
      container.remove();
    }
  });
});
