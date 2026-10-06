// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ClusterEnvironmentList, defaultClusterEnvironments } from "../packages/blocks/src/application/cluster-environment-list-01/cluster-environment-list";
import { MonitoringAlertList, defaultMonitoringAlertItems } from "../packages/blocks/src/application/monitoring-alert-list-01/monitoring-alert-list";

beforeEach(() => {
  Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() })) });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
function deferred() {
  let resolve!: () => void;
  let reject!: (cause: Error) => void;
  const promise = new Promise<void>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

describe("完整页面试点的列表反馈", () => {
  const cases = [
    { name: "集群", Component: ClusterEnvironmentList, loadingLabel: "正在加载集群环境", error: "集群环境加载失败", preserved: "当前共 6 个环境" },
    { name: "告警", Component: MonitoringAlertList, loadingLabel: "正在加载监控告警", error: "监控告警加载失败", preserved: `共 ${defaultMonitoringAlertItems.length} 条` },
  ] as const;
  for (const { name, Component, loadingLabel, error, preserved } of cases) {
    it(`${name}保留原 void 回调接受非 void 返回值的兼容性`, async () => {
      render(<Component onRefresh={() => 1} />);
      const button = screen.getByRole("button", { name: "刷新" });
      fireEvent.click(button);
      await waitFor(() => expect(button.hasAttribute("disabled")).toBe(false));
      expect(screen.getByText(preserved)).toBeTruthy();
      expect(screen.queryByRole("alert")).toBeNull();
    });
    it(`${name}首次加载/失败只占据一处数据反馈，静态错误不重复宣告`, () => {
      const { container, rerender } = render(<Component state="loading" />);
      expect(screen.getByRole("status", { name: loadingLabel })).toBeTruthy();
      expect(screen.queryByText(preserved)).toBeNull();
      expect(container.querySelector('[data-slot="empty"]')).toBeNull();
      rerender(<Component state="error" onRetry={() => {}} />);
      expect(screen.getByText(error)).toBeTruthy();
      expect(screen.queryByRole("status")).toBeNull();
      expect(screen.queryByRole("alert")).toBeNull();
      expect(screen.queryByText(preserved)).toBeNull();
      expect(screen.getAllByRole("button", { name: "重试" })).toHaveLength(1);
    });
    it(`${name}异步刷新不重复触发，失败保留旧数据并只宣告一次`, async () => {
      const task = deferred();
      const onRefresh = vi.fn(() => task.promise);
      const onRetry = vi.fn();
      render(<Component state="stale" onRefresh={onRefresh} onRetry={onRetry} />);
      const button = screen.getByRole("button", { name: "刷新" });
      fireEvent.click(button); fireEvent.click(button);
      expect(onRefresh).toHaveBeenCalledTimes(1);
      expect(button.hasAttribute("disabled")).toBe(true);
      expect(screen.getByText(preserved)).toBeTruthy();
      await act(async () => task.reject(new Error("刷新任务拒绝")));
      const notices = screen.getAllByRole("alert");
      expect(notices).toHaveLength(1);
      expect(notices[0].textContent).toContain("刷新任务拒绝");
      expect(notices[0].textContent).toContain("上次获取的结果");
      expect(screen.queryByText(/环境数据已过期|告警数据已过期/)).toBeNull();
      expect(screen.getByText(preserved)).toBeTruthy();
      fireEvent.click(screen.getByRole("button", { name: "重试" }));
      await waitFor(() => expect(onRetry).toHaveBeenCalledTimes(1));
      await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
    });
    it(`${name}受控刷新失败可显式保留数据`, () => {
      render(<Component state="error" retainDataOnError statusMessage="后端不可用" />);
      expect(screen.getByText(preserved)).toBeTruthy();
      expect(screen.getByText(/后端不可用/)).toBeTruthy();
      expect(screen.queryByRole("alert")).toBeNull();
    });
  }

  it("上一份数据的失败不会覆盖新列表", async () => {
    const task = deferred();
    const { rerender } = render(<ClusterEnvironmentList environments={defaultClusterEnvironments} onRefresh={() => task.promise} />);
    fireEvent.click(screen.getByRole("button", { name: "刷新" }));
    rerender(<ClusterEnvironmentList environments={[defaultClusterEnvironments[0]]} />);
    await act(async () => task.reject(new Error("旧请求失败")));
    expect(screen.queryByText(/旧请求失败/)).toBeNull();
    expect(screen.getByText("当前共 1 个环境")).toBeTruthy();
  });

  it("告警数据缩减时立即落在有效页，避免空白末页", () => {
    const { rerender } = render(<MonitoringAlertList alerts={defaultMonitoringAlertItems} />);
    fireEvent.click(screen.getByRole("button", { name: "下一页" }));
    expect(screen.getByText("第 2 页，共 2 页")).toBeTruthy();
    rerender(<MonitoringAlertList alerts={defaultMonitoringAlertItems.slice(0, 5)} />);
    expect(screen.getByText("第 1 页，共 1 页")).toBeTruthy();
    expect(screen.getByText(defaultMonitoringAlertItems[0].resource)).toBeTruthy();
    expect(screen.getByRole("button", { name: "下一页" }).hasAttribute("disabled")).toBe(true);
    rerender(<MonitoringAlertList alerts={defaultMonitoringAlertItems} />);
    expect(screen.getByText("第 1 页，共 2 页")).toBeTruthy();
  });

  it("环境筛选的键盘动作与可访问选中状态一致", async () => {
    render(<MonitoringAlertList />);
    fireEvent.click(screen.getByRole("button", { name: "全部环境" }));
    expect((await screen.findByRole("menuitemradio", { name: "全部环境" })).getAttribute("aria-checked")).toBe("true");
    const option = await screen.findByRole("menuitemradio", { name: "生产环境 A" });
    option.focus(); fireEvent.keyDown(option, { key: "Enter" });
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    fireEvent.click(screen.getByRole("button", { name: "生产环境 A" }));
    expect((await screen.findByRole("menuitemradio", { name: "生产环境 A" })).getAttribute("aria-checked")).toBe("true");
  });

  it("处置状态独立于严重性，静音回调收到原始告警", async () => {
    const item = { ...defaultMonitoringAlertItems[1], resolutionState: "resolved" as const };
    const onResolve = vi.fn();
    const onMute = vi.fn();
    render(<MonitoringAlertList alerts={[item]} onResolve={onResolve} onMute={onMute} />);
    expect(screen.getByText("P0")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: `${item.resource} 已处置，查看处置记录` }));
    expect(onResolve).not.toHaveBeenCalled();
    expect(await screen.findByText(item.resolutionRecords[0].detail)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: `${item.resource} 更多操作` }));
    const resolve = await screen.findByRole("menuitem", { name: "处置" });
    expect(resolve.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(resolve);
    expect(onResolve).not.toHaveBeenCalled();
    fireEvent.click(await screen.findByText("不再提醒"));
    expect(onMute).toHaveBeenCalledWith(item);
  });
});
