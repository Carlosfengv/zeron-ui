// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { OperationsWorkspaceShell } from "@zeron/blocks/operations-workspace-shell-01";
import { ZaiopsOperations } from "@zeron/blocks/zaiops-operations-01";
import { ClusterEnvironmentList } from "@zeron/blocks/cluster-environment-list-01";
import { ClusterEnvironmentDetail } from "@zeron/blocks/cluster-environment-detail-01";
import { InspectionReportList, defaultInspectionReportItems } from "@zeron/blocks/inspection-report-list-01";
import { MonitoringAlertList } from "@zeron/blocks/monitoring-alert-list-01";
import { ServiceManagement } from "@zeron/blocks/service-management-01";
import { ListPagination } from "@zeron/ui/list-pagination";

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  HTMLElement.prototype.getAnimations = vi.fn(() => []);
  Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn((media: string) => ({ matches: false, media, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() })) });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("阶段四工作区组合", () => {
  for (const [name, Component, active] of [
    ["首页", ZaiopsOperations, "首页"], ["集群列表", ClusterEnvironmentList, "集群环境"], ["集群详情", ClusterEnvironmentDetail, "集群环境"],
    ["巡检", InspectionReportList, "巡检报告"], ["告警", MonitoringAlertList, "监控告警"], ["服务", ServiceManagement, "服务进度"],
  ] as const) {
    it(`${name}只使用一套外壳和正确激活项`, () => {
      const { container } = render(<Component />);
      expect(container.querySelectorAll('[data-slot="operations-workspace-shell"]')).toHaveLength(1);
      expect(screen.getAllByRole("complementary", { name: "操作导航" })).toHaveLength(1);
      const link = screen.getByRole("link", { name: active });
      expect(link.getAttribute("data-active")).toBe("true");
      fireEvent.keyDown(window, { key: "k", ctrlKey: true });
      expect(screen.getAllByRole("dialog", { name: "搜索 ZAIops" })).toHaveLength(1);
    });
  }
  it("受控组织只发出 ID，宿主更新后再改变身份", async () => {
    const onOrganizationChange = vi.fn();
    const workspace = { organizations: [{ id: "a", name: "长组织名称 / 华东金融生产团队" }, { id: "b", name: "华南制造" }], organizationId: "a", onOrganizationChange };
    const { rerender } = render(<OperationsWorkspaceShell title="测试" activeNavigation="home" workspace={workspace} />);
    fireEvent.click(screen.getByRole("button", { name: /长组织名称/ }));
    fireEvent.click(await screen.findByRole("menuitemradio", { name: "华南制造" }));
    expect(onOrganizationChange).toHaveBeenCalledExactlyOnceWith("b");
    expect(screen.getByRole("button", { name: /长组织名称/ })).toBeTruthy();
    rerender(<OperationsWorkspaceShell title="测试" activeNavigation="home" workspace={{ ...workspace, organizationId: "b" }} />);
    expect(screen.getByRole("button", { name: /华南制造/ })).toBeTruthy();
  });
  it("两个预览中快捷键仅打开焦点所在的搜索，输入与重复键不触发", () => {
    render(<><OperationsWorkspaceShell title="一" activeNavigation="home"><button>焦点一</button><input aria-label="编辑中" /></OperationsWorkspaceShell><OperationsWorkspaceShell title="二" activeNavigation="home" workspace={{ searchContent: <p>第二个搜索入口</p> }}><button>焦点二</button></OperationsWorkspaceShell></>);
    const target = screen.getByRole("button", { name: "焦点二" });
    fireEvent.keyDown(target, { key: "k", metaKey: true });
    expect(screen.getAllByRole("dialog", { name: "搜索 ZAIops" })).toHaveLength(1);
    expect(screen.getByText("第二个搜索入口")).toBeTruthy();
  });
  it("搜索快捷键忽略编辑和重复事件，卸载后不残留监听", () => {
    const onSearchOpenChange = vi.fn();
    const { unmount } = render(<OperationsWorkspaceShell title="测试" activeNavigation="home" workspace={{ onSearchOpenChange }}><input aria-label="编辑中" /></OperationsWorkspaceShell>);
    fireEvent.keyDown(screen.getByRole("textbox"), { key: "k", ctrlKey: true });
    fireEvent.keyDown(window, { key: "k", ctrlKey: true, repeat: true });
    expect(onSearchOpenChange).not.toHaveBeenCalled();
    unmount(); fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(onSearchOpenChange).not.toHaveBeenCalled();
  });
  it("受控搜索与自定义内容不被本地状态覆盖", () => {
    const onSearchOpenChange = vi.fn();
    const workspace = { searchOpen: false, onSearchOpenChange, searchContent: <input aria-label="应用搜索" /> };
    const { rerender } = render(<OperationsWorkspaceShell title="测试" activeNavigation="home" workspace={workspace} />);
    fireEvent.keyDown(window, { key: "k", ctrlKey: true });
    expect(onSearchOpenChange).toHaveBeenCalledExactlyOnceWith(true);
    expect(screen.queryByRole("dialog")).toBeNull();
    rerender(<OperationsWorkspaceShell title="测试" activeNavigation="home" workspace={{ ...workspace, searchOpen: true }} />);
    expect(screen.getByRole("textbox", { name: "应用搜索" })).toBeTruthy();
  });
  it("导航回调只执行一次，不依赖 Next 或触发额外原生跳转", () => {
    const onNavigationSelect = vi.fn();
    render(<OperationsWorkspaceShell title="测试" activeNavigation="home" workspace={{ onNavigationSelect }} />);
    const link = screen.getByRole("link", { name: "集群环境" });
    expect(fireEvent.click(link)).toBe(false);
    expect(onNavigationSelect).toHaveBeenCalledExactlyOnceWith("clusters");
  });
  it("服务导航保留受控/非受控切换", () => {
    const onViewChange = vi.fn();
    const { rerender } = render(<ServiceManagement onViewChange={onViewChange} />);
    fireEvent.click(screen.getByRole("link", { name: "服务授权" }));
    expect(onViewChange).toHaveBeenCalledExactlyOnceWith("service-authorizations");
    expect(screen.getByRole("columnheader", { name: "授权有效期至" })).toBeTruthy();
    rerender(<ServiceManagement view="service-progress" onViewChange={onViewChange} />);
    fireEvent.click(screen.getByRole("link", { name: "操作记录" }));
    expect(onViewChange).toHaveBeenLastCalledWith("operation-history");
    expect(screen.getByRole("columnheader", { name: "工单号" })).toBeTruthy();
  });
  it("巡检数据缩减时落在有效页，重新增加不恢复失效页码", () => {
    const { rerender } = render(<InspectionReportList />);
    fireEvent.click(screen.getByRole("button", { name: "下一页" }));
    expect(screen.getByText("第 2 页，共 2 页")).toBeTruthy();
    rerender(<InspectionReportList reports={[defaultInspectionReportItems[0]]} />);
    expect(screen.getByText("第 1 页，共 1 页")).toBeTruthy();
    expect(screen.getByRole("button", { name: /查看 .*巡检报告/ })).toBeTruthy();
    rerender(<InspectionReportList />);
    expect(screen.getByText("第 1 页，共 2 页")).toBeTruthy();
  });
  it("会话回调保留原对象，没有动作时不制造可执行菜单", async () => {
    const session = { id: "session", name: "网络诊断", updatedAt: "刚刚" };
    const onSessionSelect = vi.fn(), onSessionRename = vi.fn();
    render(<OperationsWorkspaceShell title="测试" activeNavigation="home" workspace={{ sessions: [session], onSessionSelect, onSessionRename }} />);
    fireEvent.click(screen.getByRole("link", { name: "网络诊断" }));
    expect(onSessionSelect).toHaveBeenCalledExactlyOnceWith(session);
    fireEvent.click(screen.getByRole("button", { name: "网络诊断 更多操作" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "重命名会话" }));
    expect(onSessionRename).toHaveBeenCalledExactlyOnceWith(session);
    expect(screen.queryByRole("menuitem", { name: "删除会话" })).toBeNull();
  });
});

describe("不依赖表格的分页", () => {
  it.each([0, 1, 5])("%i 条记录不允许越界导航", total => {
    render(<ListPagination total={total} page={0} pageSize={5} onPageChange={() => {}} onPageSizeChange={() => {}} />);
    for (const name of ["首页", "上一页", "下一页", "末页"]) expect(screen.getByRole("button", { name }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByText("第 1 页，共 1 页")).toBeTruthy();
  });
  it("多页导航使用零基页码，越界输入显示有效页", () => {
    const onPageChange = vi.fn();
    const { rerender } = render(<ListPagination total={11} page={1} pageSize={5} onPageChange={onPageChange} onPageSizeChange={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "末页" })); expect(onPageChange).toHaveBeenLastCalledWith(2);
    fireEvent.click(screen.getByRole("button", { name: "上一页" })); expect(onPageChange).toHaveBeenLastCalledWith(0);
    rerender(<ListPagination total={1} page={8} pageSize={5} onPageChange={onPageChange} onPageSizeChange={() => {}} />);
    expect(screen.getByText("第 1 页，共 1 页")).toBeTruthy();
  });
  it("自定义每页条数可见，选择只回调一次且不隐式改变数据", async () => {
    const onPageSizeChange = vi.fn(), onPageChange = vi.fn();
    render(<ListPagination total={40} page={0} pageSize={7} onPageChange={onPageChange} onPageSizeChange={onPageSizeChange} />);
    fireEvent.click(screen.getByRole("combobox", { name: "每页显示条数" }));
    const list = await screen.findByRole("listbox");
    expect(within(list).getByRole("option", { name: "7" })).toBeTruthy();
    const option = within(list).getByRole("option", { name: "10" });
    const pointer = new Event("pointerdown", { bubbles: true });
    Object.defineProperty(pointer, "pointerType", { value: "touch" });
    fireEvent(option, pointer); fireEvent.click(option);
    await waitFor(() => expect(onPageSizeChange).toHaveBeenCalledExactlyOnceWith(10));
    expect(onPageChange).not.toHaveBeenCalled();
  });
});
