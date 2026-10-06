// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IntegrationMonitors } from "../packages/blocks/src/application/integration-monitors-01/integration-monitors";
import { createIntegrationMonitorsDemoData } from "../packages/blocks/src/application/integration-monitors-01/integration-monitors-demo-data";
import { defaultIntegrationMonitorsQuery } from "../packages/blocks/src/application/integration-monitors-01/integration-monitors-data";
import type { IntegrationMonitorResult } from "../packages/blocks/src/application/integration-monitors-01/integration-monitors-types";

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() })) });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const data = createIntegrationMonitorsDemoData();
const base = { scopeId: data.scopeId, data };

describe("integration monitor interactions", () => {
  it("renders unexpected check results as unknown, including inherited object keys", () => {
    render(<IntegrationMonitors {...base} data={{ ...data, items: [{ ...data.items[0], checks: ["toString", "constructor", "active"].map((result) => ({ id: result, name: result, result: result as IntegrationMonitorResult, checkedAt: null })) }] }} />);
    expect(screen.getByText("检查数据不完整")).toBeTruthy();
    for (const [index, cell] of screen.getAllByRole("gridcell").entries()) {
      expect(cell.getAttribute("data-status")).toBe("unknown");
      expect(cell.getAttribute("aria-label")).toBe(`${["toString", "constructor", "active"][index]} · 未知 · —`);
    }
  });
  it("keeps known failures visible when some checks remain unknown", () => {
    render(<IntegrationMonitors {...base} data={{ ...data, items: [{ ...data.items[0], checks: [{ id: "failed", name: "Failed", result: "failed", checkedAt: null }, { id: "unknown", name: "Unknown", result: "unknown", checkedAt: null }] }] }} />);
    expect(screen.getByText("1 / 2 项检查失败 · 检查数据不完整")).toBeTruthy();
    expect(screen.getByRole("tab", { name: /存在失败/ }).textContent).toContain("1");
  });
  it("searches all pages, resets pagination and keeps global category counts", () => {
    render(<IntegrationMonitors {...base} defaultQuery={{ pageIndex: 5 }} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Merc" } });
    expect(screen.getByText("ury")).toBeTruthy(); expect(screen.getByText("Square")).toBeTruthy();
    expect(screen.getByText("2 条匹配结果")).toBeTruthy(); expect(screen.getByRole("button", { name: "1 页" }).getAttribute("aria-current")).toBe("page");
    expect(screen.getByRole("tab", { name: /存在失败/ }).textContent).toContain("6");
  });
  it("does not mutate controlled query until the host accepts a change", () => {
    const change = vi.fn();
    render(<IntegrationMonitors {...base} query={defaultIntegrationMonitorsQuery} onQueryChange={change} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Merc" } });
    expect(change).toHaveBeenCalledWith({ ...defaultIntegrationMonitorsQuery, search: "Merc", pageIndex: 0 });
    expect((screen.getByRole("searchbox") as HTMLInputElement).value).toBe("");
  });
  it("clamps an out-of-range controlled page and requests one correction", async () => {
    const change = vi.fn();
    render(<IntegrationMonitors {...base} data={{ ...data, items: data.items.slice(0, 4) }} query={{ ...defaultIntegrationMonitorsQuery, pageIndex: 5 }} onQueryChange={change} />);
    await waitFor(() => expect(change).toHaveBeenCalledTimes(1)); expect(change.mock.calls[0][0].pageIndex).toBe(1);
    expect(screen.getByText("Stripe")).toBeTruthy();
  });
  it("distinguishes mismatched scope, loading, initial failure and retained refresh failure", () => {
    const { container, rerender } = render(<IntegrationMonitors {...base} scopeId="other" />);
    expect(screen.queryByText("Mercury")).toBeNull(); expect(screen.getByText("尚未添加监控")).toBeTruthy();
    rerender(<IntegrationMonitors {...base} state="loading" />); expect(screen.queryByText("Mercury")).toBeNull(); expect(screen.getByText("正在加载集成监控")).toBeTruthy();
    rerender(<IntegrationMonitors {...base} data={null} state="error" />); expect(container.querySelector('[data-slot="alert"]')).toBeTruthy();
    rerender(<IntegrationMonitors {...base} state="error" />); expect(screen.getByText("Mercury")).toBeTruthy(); expect(screen.getByText("集成监控加载失败")).toBeTruthy();
    rerender(<IntegrationMonitors {...base} state="error" retainDataOnError={false} />); expect(screen.queryByText("Mercury")).toBeNull();
  });
  it("hides unavailable actions and exports every matched row rather than one page", async () => {
    const { rerender } = render(<IntegrationMonitors {...base} />);
    expect(screen.queryByRole("button", { name: "添加监控" })).toBeNull(); expect(screen.queryByRole("button", { name: "导出 CSV" })).toBeNull();
    const exporting = vi.fn(); rerender(<IntegrationMonitors {...base} actions={{ onExport: exporting }} />);
    fireEvent.click(screen.getByRole("button", { name: "导出 CSV" })); await waitFor(() => expect(exporting).toHaveBeenCalledTimes(1));
    expect(exporting.mock.calls[0][0].items).toHaveLength(18); expect(exporting.mock.calls[0][0].scopeId).toBe(data.scopeId);
  });
  it("guards duplicate asynchronous actions, surfaces failure and ignores old workspace feedback", async () => {
    let reject!: (error: Error) => void;
    const task = new Promise<void>((_resolve, fail) => { reject = fail; });
    const exporting = vi.fn().mockReturnValueOnce(task).mockRejectedValue(new Error("internal"));
    const { rerender } = render(<IntegrationMonitors {...base} actions={{ onExport: exporting }} />);
    fireEvent.click(screen.getByRole("button", { name: "导出 CSV" })); fireEvent.click(screen.getByRole("button", { name: "导出 CSV" }));
    expect(exporting).toHaveBeenCalledTimes(1);
    rerender(<IntegrationMonitors scopeId="new" data={{ ...data, scopeId: "new" }} actions={{ onExport: exporting }} />);
    await act(async () => reject(new Error("old scope"))); expect(screen.queryByText("操作失败，请重试")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "导出 CSV" })); await waitFor(() => expect(screen.getByText("操作失败，请重试")).toBeTruthy());
  });
  it("respects an empty row capability list even when copy links and callbacks exist", () => {
    render(<IntegrationMonitors {...base} data={{ ...data, items: [{ ...data.items[0], capabilities: [] }] }} actions={{ onCheck: vi.fn(), onShare: vi.fn(), onOpenAssets: vi.fn() }} />);
    expect(screen.queryByRole("button", { name: "Mercury · 监控操作" })).toBeNull();
    expect(screen.queryByRole("button", { name: "18 资产" })).toBeNull();
  });
  it("ignores rejected row feedback when the target is removed while awaiting a check", async () => {
    let reject!: (error: Error) => void;
    const task = new Promise<void>((_resolve, fail) => { reject = fail; });
    const checking = vi.fn(() => task);
    const { rerender } = render(<IntegrationMonitors {...base} actions={{ onCheck: checking }} />);
    fireEvent.click(screen.getByRole("button", { name: "Mercury · 监控操作" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "立即检查" }));
    await waitFor(() => expect(checking).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "Mercury · 监控操作" }).hasAttribute("disabled")).toBe(true);
    rerender(<IntegrationMonitors {...base} data={{ ...data, items: data.items.slice(1) }} actions={{ onCheck: checking }} />);
    await act(async () => reject(new Error("removed target")));
    expect(screen.queryByText("操作失败，请重试")).toBeNull();
  });
  it("blocks row actions while a bulk check is pending", async () => {
    let resolve!: () => void;
    const task = new Promise<void>((done) => { resolve = done; });
    render(<IntegrationMonitors {...base} actions={{ onCheckAll: () => task, onCheck: vi.fn(), onOpenAssets: vi.fn() }} />);
    fireEvent.click(screen.getByRole("button", { name: "更多操作" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "检查全部监控" }));
    expect(screen.getByRole("button", { name: "Mercury · 监控操作" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("button", { name: "18 资产" }).hasAttribute("disabled")).toBe(true);
    await act(async () => resolve());
    expect(screen.getByRole("button", { name: "Mercury · 监控操作" }).hasAttribute("disabled")).toBe(false);
  });
});
