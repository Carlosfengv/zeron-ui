// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SecurityOverview } from "../packages/blocks/src/application/security-overview-01/security-overview";
import { createSecurityOverviewDemoData } from "../packages/blocks/src/application/security-overview-01/security-overview-demo-data";
import { SecurityOverviewDemo } from "../docs/components/blocks/SecurityOverviewDemo";

vi.mock("next-intl", () => ({ useLocale: () => "zh-CN" }));

// Chart geometry is checked in the browser; these tests cover state and actions.
vi.mock("../packages/blocks/src/application/security-overview-01/security-overview-charts", () => ({
  SecurityScore: () => <div>Score ring</div>,
  SecurityTrend: ({ data }: { data: { range: string } }) => <div data-testid="trend">{data.range} trend</div>,
  SecurityPostureRadar: () => <div>Posture chart</div>,
}));

afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });
const data = createSecurityOverviewDemoData();
const base = { scopeId: "northwind", data, range: "30d" as const, onRangeChange: () => {} };

describe("security overview state and interaction", () => {
  it("renders authoritative totals with a three-item preview and stable detail IDs", () => {
    const onOpenFinding = vi.fn();
    render(<SecurityOverview {...base} defaultView="findings" data={{ ...data, findings: data.findings!.slice(0, 3) }} actions={{ onOpenFinding }} />);
    expect(screen.getByRole("tab", { name: /风险项\s*13/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "路径遍历可能读取任意文件" }));
    expect(onOpenFinding).toHaveBeenCalledWith("finding-0");
    expect(screen.queryByRole("button", { name: /查看全部风险项/ })).toBeNull();
  });

  it("does not show another scope or another range as current results", () => {
    const { rerender } = render(<SecurityOverview {...base} range="7d" />);
    expect(screen.queryByTestId("trend")).toBeNull();
    expect(screen.getByText("正在加载安全概览")).toBeTruthy();
    rerender(<SecurityOverview {...base} scopeId="another" />);
    expect(screen.queryByTestId("trend")).toBeNull();
    expect(screen.getByText("暂无可用数据")).toBeTruthy();
  });

  it("keeps controlled view changes as callbacks and resets local view on scope changes", () => {
    const onViewChange = vi.fn();
    const { rerender } = render(<SecurityOverview {...base} view="trend" onViewChange={onViewChange} />);
    fireEvent.click(screen.getByRole("tab", { name: "态势" }));
    expect(onViewChange).toHaveBeenCalledWith("posture");
    expect(screen.getByTestId("trend")).toBeTruthy();
    rerender(<SecurityOverview {...base} />);
    fireEvent.click(screen.getByRole("tab", { name: "态势" }));
    expect(screen.getByText("Posture chart")).toBeTruthy();
    rerender(<SecurityOverview {...base} scopeId="another" data={{ ...data, scopeId: "another" }} />);
    expect(screen.getByTestId("trend")).toBeTruthy();
  });

  it("guards immediate duplicate scan/export actions and binds export to the displayed snapshot", () => {
    const onRunScan = vi.fn(); const onExport = vi.fn();
    render(<SecurityOverview {...base} actions={{ onRunScan, onExport }} />);
    const scan = screen.getByRole("button", { name: "开始扫描" });
    const report = screen.getByRole("button", { name: "导出报告" });
    fireEvent.click(scan); fireEvent.click(scan); fireEvent.click(report); fireEvent.click(report);
    expect(onRunScan).toHaveBeenCalledTimes(1);
    expect(onExport).toHaveBeenCalledTimes(1);
    expect(onExport).toHaveBeenCalledWith({ scopeId: "northwind", snapshotId: data.id, range: "30d" });
  });

  it("waits for the matching completed snapshot and preserves the old score while scanning", () => {
    const onRunScan = vi.fn();
    const { rerender, container } = render(<SecurityOverview {...base} scan={{ status: "succeeded", jobId: "job", snapshotId: "new", newFindingCount: 1 }} actions={{ onRunScan }} />);
    expect(screen.getByText("正在更新结果")).toBeTruthy();
    expect(container.querySelector('[data-slot="security-score-value"]')!.textContent).toBe("77");
    rerender(<SecurityOverview {...base} data={{ ...data, id: "new", score: 75 }} scan={{ status: "succeeded", jobId: "job", snapshotId: "new", newFindingCount: 1 }} actions={{ onRunScan }} />);
    expect(screen.getByRole("button", { name: "开始扫描" })).toBeTruthy();
    expect(container.querySelector('[data-slot="security-score-value"]')!.textContent).toBe("75");
  });

  it("keeps failed/loading panels linked to the selected tab and exposes retry", () => {
    const onRetry = vi.fn();
    const { rerender } = render(<SecurityOverview {...base} defaultView="assets" state="error" actions={{ onRetry }} />);
    const panel = screen.getByRole("tabpanel", { name: /资产/ });
    expect(screen.getByRole("tab", { name: /资产/ }).getAttribute("aria-controls")).toBe(panel.id);
    fireEvent.click(screen.getByRole("button", { name: "重试" }));
    expect(onRetry).toHaveBeenCalledOnce();
    rerender(<SecurityOverview {...base} defaultView="assets" state="loading" />);
    expect(screen.getByRole("tabpanel", { name: "资产" })).toBeTruthy();
  });

  it("simulates a complete scan and cleans up scheduled updates on unmount", async () => {
    vi.useFakeTimers();
    const { container, unmount } = render(<SecurityOverviewDemo />);
    fireEvent.click(screen.getByRole("button", { name: "开始扫描" }));
    await act(async () => { vi.advanceTimersByTime(3500); });
    expect(container.querySelector('[data-slot="security-score-value"]')!.textContent).toBe("75");
    expect(screen.getByRole("tab", { name: /风险项\s*14/ })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "开始扫描" }));
    unmount();
    await act(async () => { vi.advanceTimersByTime(5000); });
    expect(container.innerHTML).toBe("");
  });
});
