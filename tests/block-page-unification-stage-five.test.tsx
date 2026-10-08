// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Badge, type BadgeStatus } from "@zeron/ui/badge";
import { ChartLegend, chartSeriesColor } from "@zeron/ui/chart-primitives";
import { foregroundColorTokens, fillColorTokens } from "../packages/ui/src/tokens/semantic-tokens.mjs";
import { AvailabilityMonitor } from "../packages/blocks/src/application/model-detail-02/model-availability";
import { FileManager } from "@zeron/blocks/file-manager-01";
import { ClusterEnvironmentDetail } from "@zeron/blocks/cluster-environment-detail-01";
import { InspectionReportList } from "@zeron/blocks/inspection-report-list-01";
import { deploymentDetailDemoData } from "../packages/blocks/src/application/deployment-detail-01/deployment-detail-demo-data";
import { DeploymentDetail } from "@zeron/blocks/deployment-detail-01";
import { ModelDetail02, defaultModelAnalyticsDetail } from "@zeron/blocks/model-detail-02";
import { infiniteLogOutcomeVisuals } from "../packages/blocks/src/application/infinite-log-table-01/infinite-log-outcome";

afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  HTMLElement.prototype.scrollIntoView = vi.fn();
  Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn((media: string) => ({ matches: false, media, addEventListener: vi.fn(), removeEventListener: vi.fn() })) });
});
function luminance(hex: string) {
  const components = [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16) / 255).map((value) => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return components[0] * .2126 + components[1] * .7152 + components[2] * .0722;
}
const statuses: BadgeStatus[] = ["danger", "warning", "success", "info", "neutral"];
describe("强强调状态的最终契约", () => {
  for (const status of statuses) for (const theme of ["light", "dark"] as const) it(`${status}/${theme} 使用配对语义色并达到 4.5:1`, () => {
    const name = status === "neutral" ? "neutral-status" : status;
    const foreground = foregroundColorTokens.find((token: { name: string }) => token.name === `fg-on-${name}-strong`)!;
    const fill = fillColorTokens.find((token: { name: string }) => token.name === `${name}-strong`)!;
    const a = luminance(foreground[theme]); const b = luminance(fill[theme]);
    expect((Math.max(a, b) + .05) / (Math.min(a, b) + .05)).toBeGreaterThanOrEqual(4.5);
    const { container } = render(<Badge status={status} variant="strong">状态</Badge>);
    const badge = container.firstElementChild as HTMLElement;
    expect(badge.dataset.status).toBe(status);
    expect(badge.style.color).toBe(`var(--fg-on-${name}-strong)`);
    expect(badge.style.backgroundColor).toBe(`var(--${name}-strong)`);
  });
  it("分类 Badge 仍支持任意分类色，HTTP 结果保持独立的领域枚举", () => {
    const { container } = render(<Badge variant="strong" color="violet">模型类型</Badge>);
    expect(container.firstElementChild?.hasAttribute("data-status")).toBe(false);
    expect(infiniteLogOutcomeVisuals.error.status).toBe("danger");
    expect(infiniteLogOutcomeVisuals.success.status).toBe("success");
    expect(infiniteLogOutcomeVisuals.warning.status).toBe("warning");
  });
});
describe("图表与原有交互", () => {
  it("图例切换保持受控，普通动作没有伪造选中态", () => {
    const select = vi.fn();
    const { rerender } = render(<ChartLegend items={[{ id: "a", label: "A", pressed: false }]} onSelect={select} />);
    fireEvent.click(screen.getByRole("button", { name: "A" }));
    expect(select).toHaveBeenCalledExactlyOnceWith("a");
    expect(screen.getByRole("button").getAttribute("aria-pressed")).toBe("false");
    rerender(<ChartLegend items={[{ id: "a", label: "A" }]} onSelect={select} />);
    expect(screen.getByRole("button").hasAttribute("aria-pressed")).toBe(false);
  });
  it("可用性保留零、缺失、时区和图例的真实开关", () => {
    render(<AvailabilityMonitor locale="en-GB" timeZone="UTC" chartData={[{ timestamp: Date.UTC(2026, 9, 5, 1), routed: 0, direct: null }]} />);
    const table = screen.getByRole("table", { hidden: true });
    expect(within(table).getAllByRole("cell", { hidden: true }).map((cell) => cell.textContent)).toEqual(["0.00%", "—"]);
    expect(table.textContent).toContain("1:00");
    const toggle = screen.getByRole("button", { name: /Without Routing/ });
    expect(toggle.getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(toggle); expect(toggle.getAttribute("aria-pressed")).toBe("false");
  });
  it("模型分析为新 provider 分配稳定色，缺失价格不显示 0，切换回调仍控制可见性", () => {
    const provider = { ...defaultModelAnalyticsDetail.pricing.providers[0], id: "new-provider", name: "New Provider" };
    const data = { ...defaultModelAnalyticsDetail, pricing: { ...defaultModelAnalyticsDetail.pricing, providers: [provider], effectiveInput: [{ date: "Oct 5", "new-provider": 0 }, { date: "Oct 6" }] } };
    const { container } = render(<ModelDetail02 data={data} defaultSection="pricing" />);
    expect(container.querySelector("style")?.textContent).toContain(chartSeriesColor(provider.id));
    const table = screen.getByRole("table", { hidden: true, name: /effective input price history/ });
    expect(within(table).getAllByRole("cell", { hidden: true }).map((cell) => cell.textContent)).toEqual(["$0", "—"]);
    const toggle = screen.getByRole("button", { name: "New Provider" });
    fireEvent.click(toggle); expect(toggle.getAttribute("aria-pressed")).toBe("false");
  });
});
describe("页面数据反馈", () => {
  it("文件首次错误保持静态，加载与无数据/无结果各有明确状态，宿主覆盖仍有效", () => {
    const { container, rerender } = render(<FileManager items={[]} error="Storage unavailable" />);
    expect(container.querySelector('[data-slot="alert"]')).toBeTruthy();
    expect(screen.queryByRole("alert")).toBeNull();
    rerender(<FileManager items={[]} loading />);
    expect(screen.getByRole("status")).toBeTruthy();
    expect(container.querySelector('[data-slot="empty"]')).toBeNull();
    rerender(<FileManager items={[]} />);
    expect(container.querySelector('[data-slot="empty"]')?.getAttribute("data-reason")).toBe("no-data");
    rerender(<FileManager items={[]} query="report" />);
    expect(container.querySelector('[data-slot="empty"]')?.getAttribute("data-reason")).toBe("no-results");
    rerender(<FileManager items={[]} error="Error" renderErrorState={() => <button>宿主重试</button>} />);
    expect(screen.getByRole("button", { name: "宿主重试" })).toBeTruthy();
    expect(container.querySelector('[data-slot="alert"]')).toBeNull();
  });
  it("空报告保留环境与外壳，运行巡检仍发送原宿主动作", () => {
    const run = vi.fn();
    const { container } = render(<ClusterEnvironmentDetail reports={[]} onRunInspection={run} />);
    expect(container.querySelector('[data-slot="operations-workspace-shell"]')).toBeTruthy();
    expect(screen.getByText("暂无巡检报告")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "触发巡检" }));
    expect(run).toHaveBeenCalledTimes(1);
  });
  it("巡检列表区分无数据与筛选无结果，分页保持零条边界", () => {
    const { container, rerender } = render(<InspectionReportList reports={[]} />);
    expect(container.querySelector('[data-slot="empty"]')?.getAttribute("data-reason")).toBe("no-data");
    rerender(<InspectionReportList />);
    fireEvent.change(screen.getByRole("textbox", { name: "搜索巡检报告" }), { target: { value: "does-not-exist" } });
    expect(container.querySelector('[data-slot="empty"]')?.getAttribute("data-reason")).toBe("no-results");
    expect(screen.getByRole("button", { name: "下一页" }).hasAttribute("disabled")).toBe(true);
  });
  it("部署首次错误不主动宣告，重试拒绝后阻止重复请求并恢复按钮", async () => {
    let reject!: (error: Error) => void;
    const retry = vi.fn(() => new Promise<void>((_, fail) => { reject = fail; }));
    render(<DeploymentDetail data={deploymentDetailDemoData} state="error" actions={{ onRetry: retry }} />);
    expect(screen.queryByRole("alert")).toBeNull();
    const button = screen.getByRole("button", { name: "重试" });
    fireEvent.click(button); fireEvent.click(button); expect(retry).toHaveBeenCalledTimes(1);
    expect(button.hasAttribute("disabled")).toBe(true); reject(new Error("unavailable"));
    await waitFor(() => expect(button.hasAttribute("disabled")).toBe(false));
    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });
});
