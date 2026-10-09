// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Badge } from "../packages/ui/src/components/badge";
import { InlineNotice, InlineNoticeContent } from "../packages/ui/src/components/inline-notice";
import { Alert, AlertTitle, AlertAction } from "../packages/ui/src/components/alert";
import { ProjectMonitor } from "../packages/blocks/src/application/project-monitor-01/project-monitor";
import { projectMonitorDemoData as project } from "../packages/blocks/src/application/project-monitor-01/project-monitor-demo-data";
import { AiGatewayOverview } from "../packages/blocks/src/application/ai-gateway-overview-01/ai-gateway-overview";
import { createAiGatewayOverviewDemoData } from "../packages/blocks/src/application/ai-gateway-overview-01/ai-gateway-overview-demo-data";
import { ClusterEnvironmentList, defaultClusterEnvironments } from "../packages/blocks/src/application/cluster-environment-list-01/cluster-environment-list";
import { MonitoringAlertList, defaultMonitoringAlertItems } from "../packages/blocks/src/application/monitoring-alert-list-01/monitoring-alert-list";

// Chart data and drawing have dedicated suites; these tests exercise feedback without canvas geometry.
vi.mock("../packages/blocks/src/application/ai-gateway-overview-01/ai-gateway-overview-charts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../packages/blocks/src/application/ai-gateway-overview-01/ai-gateway-overview-charts")>();
  const Chart = () => <div data-testid="gateway-chart" />;
  return { ...actual, CostBarChart: Chart, ErrorRateChart: Chart, LatencyDistributionChart: Chart, LatencySparkline: Chart,
    MetricSeriesChart: Chart, ProviderCostDonut: Chart, ProviderRequestsChart: Chart, RequestsAreaChart: Chart,
    TokensAreaChart: Chart, providerColors: ["var(--fg-info)"] };
});
vi.mock("../packages/blocks/src/application/storage-usage-01/storage-usage.module.css", () => ({ default: { metricTitle: "metricTitle" } }));
beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn((query: string) => ({
    matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(),
    addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
  })) });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function deferred() {
  let resolve!: () => void;
  let reject!: (cause: Error) => void;
  const promise = new Promise<void>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

describe("shared feedback primitives", () => {
  it.each(["neutral", "info", "success", "warning", "danger"] as const)("keeps %s readable and static", (status) => {
    const { container } = render(<Badge variant="plain" status={status}>Healthy</Badge>);
    expect(screen.getByText("Healthy")).toBeTruthy();
    expect(container.querySelector("[data-status]")?.getAttribute("data-status")).toBe(status);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
    expect(container.querySelector("[data-slot=badge-marker]")?.getAttribute("aria-hidden")).toBe("true");
    const badge = container.querySelector("[data-slot=badge]") as HTMLElement;
    expect(badge.style.backgroundColor).toBe("");
    expect(badge.classList.contains("border")).toBe(false);
    expect(badge.classList.contains("h-auto")).toBe(true);
    expect(badge.classList.contains("px-0")).toBe(true);
  });
  it("replaces the dot with an icon and supports standalone accessible markers", () => {
    const { container, rerender } = render(<Badge variant="plain" status="success" leadingIcon={<svg />} role="img" aria-label="Ready" />);
    expect(screen.getByRole("img", { name: "Ready" })).toBeTruthy();
    expect(container.querySelector("[data-slot=badge-marker]")).toBeNull();
    expect(container.querySelector("[data-slot=badge-label]")).toBeNull();
    expect(container.querySelector("[data-slot=badge-icon]")?.getAttribute("aria-hidden")).toBe("true");
    rerender(<Badge variant="dot" status="danger" leadingIcon={<svg />}>Failed</Badge>);
    expect(screen.getByText("Failed")).toBeTruthy();
    expect(container.querySelector("[data-slot=badge-marker]")).toBeNull();
  });
  it("uses InlineNotice for long activity text and respects reduced motion", () => {
    const { container } = render(<InlineNotice variant="emphasized" tone="info"><span aria-hidden="true" className="animate-spin motion-reduce:animate-none"><svg /></span><InlineNoticeContent>Refreshing previous results with a long explanation</InlineNoticeContent></InlineNotice>);
    expect(screen.getByText(/Refreshing previous results/)).toBeTruthy();
    expect(container.querySelector(".animate-spin")?.classList.contains("motion-reduce:animate-none")).toBe(true);
    expect(container.querySelector("[data-slot=inline-notice-content]")?.classList.contains("break-words")).toBe(true);
    expect(screen.queryByRole("status")).toBeNull();
  });
  it.each(["danger", undefined] as const)("keeps dot badges unfilled when an icon replaces the marker (%s)", (status) => {
    const { container, rerender } = render(<Badge variant="dot" status={status} color="violet">Failed</Badge>);
    const badge = container.querySelector("[data-slot=badge]") as HTMLElement;
    const originalBorder = badge.style.borderColor;
    const markerColor = (container.querySelector("[data-slot=badge-marker]") as HTMLElement).style.backgroundColor;
    rerender(<Badge variant="dot" status={status} color="violet" leadingIcon={<svg />}>Failed</Badge>);
    expect(badge.style.backgroundColor).toBe("");
    expect(badge.style.color).toBe("");
    expect(badge.style.borderColor).toBe(originalBorder);
    expect((container.querySelector("[data-slot=badge-icon]") as HTMLElement).style.color).toBe(markerColor);
  });
  it("composes confirmed failure and retry with Alert and explicit announcement ownership", () => {
    const retry = vi.fn();
    const { container, rerender } = render(<Alert status="danger" role="group"><AlertTitle>Failed</AlertTitle><AlertAction><button onClick={retry}>Retry</button></AlertAction></Alert>);
    expect(container.querySelector("[data-slot=alert]")).toBeTruthy();
    expect(container.querySelector("[data-slot=empty]")).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(retry).toHaveBeenCalledTimes(1);
    rerender(<Alert status="danger"><AlertTitle>New failure</AlertTitle></Alert>);
    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });
});

describe("project data feedback", () => {
  it("retains an existing snapshot on refresh failure and keeps the selected panel associated", () => {
    const { container } = render(<ProjectMonitor data={project} state="error" retainDataOnError defaultTab="reports" />);
    expect(container.querySelector("[data-slot=project-request-total]")).toBeTruthy();
    expect(screen.getByText(/当前显示上次获取的结果/)).toBeTruthy();
    expect(container.querySelector("[data-slot=alert]")).toBeNull();
    const tab = screen.getByRole("tab", { name: "报告" });
    expect(tab.getAttribute("aria-controls")).toBe(screen.getByRole("tabpanel", { name: "报告" }).id);
  });
  it("shows stale and refresh progress independently without discarding values", () => {
    const { container } = render(<ProjectMonitor data={project} state="stale" refreshing />);
    expect(screen.getByText("数据更新延迟，当前显示上次获取的结果。")).toBeTruthy();
    expect(screen.getByText("正在刷新，保留上次获取的结果。")).toBeTruthy();
    expect(container.querySelector("[data-slot=project-request-total]")).toBeTruthy();
    expect(container.querySelector("[data-slot=project-monitor]")?.getAttribute("aria-busy")).toBe("true");
  });
  it("guards pending, retains values after rejected refresh, and retries through the host", async () => {
    const request = deferred();
    const onRefresh = vi.fn(() => request.promise);
    const onRetry = vi.fn().mockResolvedValue(undefined);
    const { container } = render(<ProjectMonitor data={project} actions={{ onRefresh, onRetry }} />);
    const button = screen.getByRole("button", { name: "刷新数据" });
    fireEvent.click(button); fireEvent.click(button);
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(button.hasAttribute("disabled")).toBe(true);
    fireEvent.click(screen.getByRole("tab", { name: "报告" }));
    expect(screen.getByRole("tabpanel", { name: "报告" })).toBeTruthy();
    await act(async () => request.reject(new Error("Refresh denied")));
    expect(screen.getByText(/Refresh denied/)).toBeTruthy();
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(container.querySelector("[data-slot=project-request-total]")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "重新加载" }));
    await waitFor(() => expect(onRetry).toHaveBeenCalledTimes(1));
    // A successful callback does not invent a new data snapshot.
    expect(container.querySelector("[data-slot=project-request-total]")).toBeTruthy();
  });
  it("guards a first-load retry and can retry again after rejection", async () => {
    const request = deferred();
    const onRetry = vi.fn().mockImplementationOnce(() => request.promise).mockResolvedValue(undefined);
    render(<ProjectMonitor data={project} state="error" actions={{ onRetry }} />);
    const retry = screen.getByRole("button", { name: "重新加载" });
    fireEvent.click(retry); fireEvent.click(retry);
    expect(onRetry).toHaveBeenCalledTimes(1);
    await act(async () => request.reject(new Error("Retry denied")));
    expect(screen.getByText("Retry denied")).toBeTruthy();
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    fireEvent.click(retry);
    await waitFor(() => expect(onRetry).toHaveBeenCalledTimes(2));
  });
});

const gateway = createAiGatewayOverviewDemoData("30d");
describe("gateway data feedback", () => {
  it.each(["loading", "refreshing"] as const)("does not flash an empty state on initial %s", (status) => {
    const { container } = render(<AiGatewayOverview data={null} range="30d" status={status} sidebar={false} />);
    expect(screen.getByRole("status", { name: "Loading gateway overview" })).toBeTruthy();
    expect(container.querySelector("[data-slot=empty]")).toBeNull();
    expect(container.querySelector("[data-slot=alert]")).toBeNull();
  });
  it("separates initial failure, confirmed empty results, and retained failure", () => {
    const { container, rerender } = render(<AiGatewayOverview data={null} range="30d" status="error" sidebar={false} />);
    expect(container.querySelector("[data-slot=alert]")).toBeTruthy();
    expect(container.querySelector("[data-slot=empty]")).toBeNull();
    rerender(<AiGatewayOverview data={null} range="30d" sidebar={false} />);
    expect(screen.getByText("No gateway data")).toBeTruthy();
    expect(container.querySelector("[data-slot=alert]")).toBeNull();
    rerender(<AiGatewayOverview data={gateway} range="30d" status="error" sidebar={false} />);
    expect(screen.getByText(/Showing the previous results/)).toBeTruthy();
    expect(screen.getAllByTestId("gateway-chart").length).toBeGreaterThan(0);
  });
  it("keeps stale data visible while refreshing", () => {
    render(<AiGatewayOverview data={gateway} range="30d" status="refreshing" stale sidebar={false} />);
    expect(screen.getByText("Data is out of date. The previous results remain visible.")).toBeTruthy();
    expect(screen.getByText("Refreshing metrics. The previous results remain visible.")).toBeTruthy();
    expect(screen.getAllByTestId("gateway-chart").length).toBeGreaterThan(0);
  });
  it("guards pending and preserves the controlled range and data on callback failure", async () => {
    const request = deferred();
    const onRefresh = vi.fn(() => request.promise);
    const onRetry = vi.fn().mockResolvedValue(undefined);
    const onRangeChange = vi.fn();
    render(<AiGatewayOverview data={gateway} range="30d" sidebar={false} actions={{ onRefresh, onRetry, onRangeChange }} />);
    const refresh = screen.getByRole("button", { name: "Refresh metrics" });
    fireEvent.click(refresh); fireEvent.click(refresh);
    expect(onRefresh).toHaveBeenCalledTimes(1);
    expect(refresh.hasAttribute("disabled")).toBe(true);
    fireEvent.click(screen.getByRole("tab", { name: "7d" }));
    expect(onRangeChange).toHaveBeenCalledTimes(1);
    expect(onRangeChange).toHaveBeenCalledWith("7d");
    expect(screen.getByRole("tab", { name: "30d" }).getAttribute("aria-selected")).toBe("true");
    await act(async () => request.reject(new Error("Metrics denied")));
    expect(screen.getByText(/Metrics denied/)).toBeTruthy();
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(screen.getAllByTestId("gateway-chart").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await waitFor(() => expect(onRetry).toHaveBeenCalledTimes(1));
  });
  it("guards retries with no data", async () => {
    const request = deferred();
    const onRetry = vi.fn(() => request.promise);
    render(<AiGatewayOverview data={null} range="30d" status="error" sidebar={false} actions={{ onRetry }} />);
    const retry = screen.getByRole("button", { name: "Retry" });
    fireEvent.click(retry); fireEvent.click(retry);
    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(retry.hasAttribute("disabled")).toBe(true);
    await act(async () => request.resolve());
    expect(retry.hasAttribute("disabled")).toBe(false);
  });
});

describe("business status trials", () => {
  it("keeps critical health visible even when inspection data is expired", () => {
    const { container } = render(<ClusterEnvironmentList environments={[{ ...defaultClusterEnvironments[0], freshness: "expired" }]} />);
    expect(screen.getByText("P0·严重")).toBeTruthy();
    expect(screen.getByText("数据已过期 · 以下为上次巡检结果")).toBeTruthy();
    expect(container.querySelector("[data-health=critical][data-freshness=expired]")).toBeTruthy();
  });
  it("distinguishes a cluster filter miss from no data and clears all filters", () => {
    const { rerender } = render(<ClusterEnvironmentList />);
    fireEvent.change(screen.getByRole("textbox", { name: "搜索环境" }), { target: { value: "not-found" } });
    expect(screen.getByText("没有符合条件的环境")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "清空筛选" }));
    expect(screen.getByRole("textbox", { name: "搜索环境" }).getAttribute("value")).toBe("");
    expect(screen.getByText(defaultClusterEnvironments[0].name)).toBeTruthy();
    rerender(<ClusterEnvironmentList environments={[]} />);
    expect(screen.getByText("暂无集群环境")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "清空筛选" })).toBeNull();
  });
  it("keeps resolved distinct from severity and emits the original resolve payload", () => {
    const onResolve = vi.fn();
    render(<MonitoringAlertList alerts={defaultMonitoringAlertItems.slice(0, 3)} onResolve={onResolve} />);
    expect(screen.getByText("已处置").closest("[data-status]")?.getAttribute("data-status")).toBe("success");
    expect(screen.getAllByText("P0").length).toBe(2);
    fireEvent.click(screen.getByRole("button", { name: "处置2次" }));
    expect(onResolve).toHaveBeenCalledTimes(1);
    expect(onResolve).toHaveBeenCalledWith(defaultMonitoringAlertItems[1]);
    expect(screen.getByText("处置2次")).toBeTruthy();
  });
  it("distinguishes alert filter misses from no alerts and resets severity and search", () => {
    const { rerender } = render(<MonitoringAlertList />);
    fireEvent.click(screen.getByRole("button", { name: /优先级 P0/ }));
    fireEvent.change(screen.getByRole("textbox", { name: "搜索监控告警" }), { target: { value: "not-found" } });
    expect(screen.getByText("没有符合条件的监控告警")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "清空筛选" }));
    expect(screen.getByRole("button", { name: "全部" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("textbox", { name: "搜索监控告警" }).getAttribute("value")).toBe("");
    rerender(<MonitoringAlertList alerts={[]} />);
    expect(screen.getByText("暂无监控告警")).toBeTruthy();
  });
});
