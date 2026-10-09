// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectMonitor } from "../packages/blocks/src/application/project-monitor-01/project-monitor";
import { summarizeWindow } from "../packages/blocks/src/application/project-monitor-01/project-monitor-data";
import { projectMonitorDemoData as data } from "../packages/blocks/src/application/project-monitor-01/project-monitor-demo-data";

// jsdom 验证行为；存储组件的 CSS module 在浏览器中单独验证。
vi.mock("../packages/blocks/src/application/storage-usage-01/storage-usage.module.css", () => ({ default: { metricTitle: "metricTitle" } }));

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    unobserve() {}
    disconnect() {}
  });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("项目监控的数据口径", () => {
  it("总数、趋势、分类与状态计数来自同一组数据", () => {
    for (const window of data.windows) {
      const summary = summarizeWindow(window);
      expect(summary.complete).toBe(true);
      expect(summary.total).toBe(summary.points.reduce((sum, point) => sum + point.requests!, 0));
      expect(summary.total).toBe(summary.services.reduce((sum, service) => sum + service.total!, 0));
      expect(summary.total).toBe(Object.values(summary.totals).reduce((sum, count) => sum + count, 0));
    }
    expect(data.storage.categories.reduce((sum, category) => sum + category.bytes!, 0)).toBe(data.storage.buckets.reduce((sum, bucket) => sum + bucket.bytes!, 0));
  });

  it("缺失和负数不是零，也不跨不同粒度汇总", () => {
    const window = data.windows[0];
    const missing = { ...window, services: window.services.map((service, index) => index ? service : { ...service, buckets: [null, ...service.buckets.slice(1)] }) };
    expect(summarizeWindow(missing).total).toBeNull();
    expect(summarizeWindow(missing).points[0].requests).toBeNull();
    const negative = { ...window, services: [{ ...window.services[0], buckets: [{ success: -1, warning: 0, errors: 0 }] }] };
    expect(summarizeWindow(negative).total).toBeNull();
    const mismatched = { ...window, services: [window.services[0], { ...window.services[1], buckets: [] }] };
    expect(summarizeWindow(mismatched).points).toEqual([]);
    expect(summarizeWindow(mismatched).total).toBeNull();
  });

  it("已确认的零请求保留零，空窗口保持未知", () => {
    const window = data.windows[0];
    const zero = { ...window, services: [{ ...window.services[0], buckets: [{ success: 0, warning: 0, errors: 0 }] }] };
    expect(summarizeWindow(zero).total).toBe(0);
    expect(summarizeWindow({ ...window, services: [] }).total).toBeNull();
    expect(summarizeWindow({ ...window, end: window.start }).total).toBeNull();
  });
});

describe("项目监控的中文交互", () => {
  it.each(["overview", "reports"] as const)("%s 的受控窗口失效后仍能选择可用窗口", async (tab) => {
    const onRangeChange = vi.fn();
    render(<ProjectMonitor data={data} tab={tab} range="removed" onRangeChange={onRangeChange} />);
    fireEvent.click(screen.getByRole("combobox", { name: "统计时间范围" }));
    fireEvent.click(await screen.findByRole("option", { name: data.windows[0].label }));
    expect(onRangeChange).toHaveBeenCalledWith(data.windows[0].id);
    expect(screen.getByText("暂无可用数据")).toBeTruthy();
  });

  it("超出日期范围的时间戳显示未知，保留其他可用内容", () => {
    const invalid = { ...data, updatedAt: 1e20,
      storage: { ...data.storage, buckets: data.storage.buckets.map((bucket) => ({ ...bucket, updatedAt: -1e20 })) },
      windows: data.windows.map((window) => ({ ...window, start: 1e20, end: 2e20 })),
    };
    const { container } = render(<ProjectMonitor data={invalid} />);
    expect(screen.getByText("更新于 —")).toBeTruthy();
    expect(container.querySelector('[data-slot="project-request-total"]')!.textContent).toBe("—");
    fireEvent.click(screen.getByRole("tab", { name: "存储" }));
    expect(screen.getByText("avatars")).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "报告" }));
    expect(screen.getByText("暂无可用数据")).toBeTruthy();
  });

  it("滚动窗口刷新后，键盘焦点仍指向同一时段", () => {
    const { rerender } = render(<ProjectMonitor data={data} />);
    const grid = screen.getByRole("grid", { name: "Gateway · 服务活动" });
    fireEvent.keyDown(grid, { key: "ArrowRight" });
    const activeId = grid.getAttribute("aria-activedescendant")!;
    const activeLabel = document.getElementById(activeId)!.getAttribute("aria-label");
    const windows = data.windows.map((window) => {
      const step = (window.end - window.start) / window.services[0].buckets.length;
      return { ...window, start: window.start + step, end: window.end + step,
        services: window.services.map((service) => ({ ...service, buckets: [...service.buckets.slice(1), null] })),
      };
    });
    rerender(<ProjectMonitor data={{ ...data, windows }} />);
    expect(document.getElementById(grid.getAttribute("aria-activedescendant")!)!.getAttribute("aria-label")).toBe(activeLabel);
  });

  it.each(["loading", "error"] as const)("%s 状态保留选中标签与面板的关联", (state) => {
    render(<ProjectMonitor data={data} state={state} defaultTab="reports" />);
    const tab = screen.getByRole("tab", { name: "报告" });
    const panel = screen.getByRole("tabpanel", { name: "报告" });
    expect(tab.getAttribute("aria-controls")).toBe(panel.id);
  });

  it("切换报告保留总数，存储显示中文权限、容量和文件数", () => {
    const { container } = render(<ProjectMonitor data={data} />);
    const total = container.querySelector('[data-slot="project-request-total"]')!.textContent;
    fireEvent.click(screen.getByRole("tab", { name: "报告" }));
    expect(container.querySelector('[data-slot="project-request-total"]')!.textContent).toBe(total);
    expect(screen.getByText("服务占比")).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: "存储" }));
    expect(screen.getByText("avatars")).toBeTruthy();
    expect(screen.getByText(/公开 · 1,284 个文件/)).toBeTruthy();
    expect(screen.getByText("已用 2.41 GB / 共 8 GB")).toBeTruthy();
    expect(screen.queryByRole("tab", { name: "优化建议" })).toBeNull();
  });

  it("受控视图只发出回调，受控时间窗口选择正确的数据", () => {
    const onTabChange = vi.fn();
    const { rerender, container } = render(<ProjectMonitor data={data} tab="overview" range="360m" onTabChange={onTabChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "报告" }));
    expect(onTabChange).toHaveBeenCalledWith("reports");
    expect(screen.getByRole("tab", { name: "概览" }).getAttribute("aria-selected")).toBe("true");
    expect(container.querySelector('[data-slot="project-request-total"]')!.textContent).toBe(summarizeWindow(data.windows[1]).total!.toLocaleString("zh-CN"));
    rerender(<ProjectMonitor data={data} tab="reports" range="not-loaded" />);
    expect(screen.getByText("暂无可用数据")).toBeTruthy();
    expect(container.querySelector('[data-slot="project-request-total"]')).toBeNull();
  });

  it("项目切换重置非受控视图，移除优化建议后返回概览", () => {
    const { rerender } = render(<ProjectMonitor data={data} advisor={<p>当前没有待处理建议</p>} />);
    fireEvent.click(screen.getByRole("tab", { name: "优化建议" }));
    expect(screen.getByText("当前没有待处理建议")).toBeTruthy();
    rerender(<ProjectMonitor data={data} />);
    expect(screen.getByRole("tab", { name: "概览" }).getAttribute("aria-selected")).toBe("true");
    fireEvent.click(screen.getByRole("tab", { name: "存储" }));
    rerender(<ProjectMonitor data={{ ...data, project: { ...data.project, id: "another" } }} />);
    expect(screen.getByRole("tab", { name: "概览" }).getAttribute("aria-selected")).toBe("true");
  });

  it("复制成功和拒绝访问均显示中文反馈", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
    render(<ProjectMonitor data={data} />);
    fireEvent.click(screen.getByRole("button", { name: "复制项目地址" }));
    await waitFor(() => expect(screen.getByText("项目地址已复制")).toBeTruthy());
    expect(writeText).toHaveBeenCalledWith(data.project.endpoint);
    writeText.mockRejectedValueOnce(new Error("denied"));
    fireEvent.click(screen.getByRole("button", { name: "复制项目地址" }));
    await waitFor(() => expect(screen.getByText("复制失败，请选择地址后手动复制")).toBeTruthy());
  });

  it("加载和失败不显示旧指标，过期提示保留快照，重试交给宿主", () => {
    const onRetry = vi.fn();
    const { rerender, container } = render(<ProjectMonitor data={data} state="loading" />);
    expect(screen.getByText("正在加载项目数据")).toBeTruthy();
    expect(container.querySelector('[data-slot="project-request-total"]')).toBeNull();
    rerender(<ProjectMonitor data={data} state="error" actions={{ onRetry }} />);
    fireEvent.click(screen.getByRole("button", { name: "重新加载" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(container.querySelector('[data-slot="project-request-total"]')).toBeNull();
    rerender(<ProjectMonitor data={data} state="stale" />);
    expect(screen.getByText("数据更新延迟，当前显示上次获取的结果。")).toBeTruthy();
    expect(container.querySelector('[data-slot="project-request-total"]')).toBeTruthy();
  });
});
