// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { IntegrationMonitorsProps } from "../packages/blocks/src/application/integration-monitors-01/integration-monitors-types";
import { IntegrationMonitorsDemo } from "../docs/components/blocks/IntegrationMonitorsDemo";

const captured = vi.hoisted(() => ({ props: null as IntegrationMonitorsProps | null }));
vi.mock("@zeron/blocks/integration-monitors-01", async (original) => ({
  ...await original<typeof import("@zeron/blocks/integration-monitors-01")>(),
  IntegrationMonitors: (props: IntegrationMonitorsProps) => { captured.props = props; return null; },
}));
vi.mock("../docs/components/blocks/DemoSettingsMenu", () => ({
  DemoSettingsMenu: ({ onChange }: { onChange: (value: string) => void }) => <><button onClick={() => onChange("empty")}>Clear fixture</button><button onClick={() => onChange("unknown")}>Unknown checks</button></>,
}));

beforeEach(() => {
  captured.props = null;
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() })) });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function renderDemo() {
  return render(<NextIntlClientProvider locale="zh-CN" timeZone="UTC" messages={{}}><IntegrationMonitorsDemo /></NextIntlClientProvider>);
}
function current() {
  if (!captured.props?.data || !captured.props.actions) throw new Error("Missing demo snapshot");
  return { data: captured.props.data, actions: captured.props.actions, context: { scopeId: captured.props.scopeId, snapshotId: captured.props.data.snapshotId } };
}

describe("integration monitor demo actions", () => {
  it.each(["single", "bulk"])("does not record a completed %s check after its monitors have been removed", async (kind) => {
    renderDemo();
    const { data, actions, context } = current();
    let task!: void | Promise<void>;
    act(() => { task = kind === "single" ? actions.onCheck!(data.items[0].id, context) : actions.onCheckAll!(context); });
    fireEvent.click(screen.getByRole("button", { name: "Clear fixture" }));
    const emptySnapshot = current().data.snapshotId;
    await act(async () => { await vi.advanceTimersByTimeAsync(400); await task; });
    expect(current().data.items).toEqual([]);
    expect(current().data.lastCheckedAt).toBeNull();
    expect(current().data.snapshotId).toBe(emptySnapshot);
    expect(screen.queryByText("检查已完成")).toBeNull();
    expect(screen.queryByText("运行中的监控已检查")).toBeNull();
  });

  it("records successful results and their check timestamp", async () => {
    renderDemo();
    const { data, actions, context } = current();
    let task!: void | Promise<void>;
    act(() => { task = actions.onCheck!(data.items[1].id, context); });
    await act(async () => { await vi.advanceTimersByTimeAsync(400); await task; });
    expect(current().data.items[1].checks?.every((check) => check.result === "passed")).toBe(true);
    expect(current().data.lastCheckedAt).toBe(captured.props?.now);
    expect(current().data.snapshotId).not.toBe(data.snapshotId);
  });

  it("distinguishes missing check data from unconfigured checks in details", () => {
    renderDemo();
    fireEvent.click(screen.getByRole("button", { name: "Unknown checks" }));
    const { data, actions, context } = current();
    act(() => { void actions.onOpenDetails!(data.items[0].id, context); });
    expect(screen.getByText("检查数据未知")).toBeTruthy();
    expect(screen.queryByText("尚未配置检查项")).toBeNull();
  });

  it("keeps the management dialog stable while connecting an integration", async () => {
    renderDemo();
    const { actions, context } = current();
    act(() => { void actions.onManageIntegrations!(context); });
    fireEvent.click(screen.getAllByRole("button", { name: "连接" })[0]);
    const edit = screen.getAllByRole("button", { name: "编辑" })[0];
    expect(edit.hasAttribute("disabled")).toBe(true);
    fireEvent.click(edit);
    expect(screen.getByRole("dialog", { name: "管理集成" })).toBeTruthy();
    await act(async () => { await vi.advanceTimersByTimeAsync(400); });
    expect(screen.getAllByRole("button", { name: "编辑" })[0].hasAttribute("disabled")).toBe(false);
  });
});
