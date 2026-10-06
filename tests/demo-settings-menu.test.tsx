// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, renderHook, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PreviewToolbarProvider, PreviewToolbarSlot } from "@docs/components/content/PreviewToolbar";
import { DataStateDemoControls, useDataStateDemo } from "@docs/components/blocks/DataStateDemoControls";

vi.mock("next-intl", () => ({ useLocale: () => "zh-CN" }));
beforeEach(() => {
  Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() })) });
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

function Demo() {
  const demo = useDataStateDemo();
  return <>
    <DataStateDemoControls value={demo.scenario} onChange={demo.changeScenario} failNextRefresh={demo.failNextRefresh} onFailNextRefreshChange={demo.setFailNextRefresh} />
    <output>{demo.scenario}</output>
  </>;
}
function Preview({ id }: { id: string }) {
  return <PreviewToolbarProvider><section aria-label={id}><header><PreviewToolbarSlot /></header><div data-testid={`${id}-content`}><Demo /></div></section></PreviewToolbarProvider>;
}

describe("演示工具栏", () => {
  it("将按钮移到所属预览的顶部，数据状态只选中一个", async () => {
    render(<Preview id="preview" />);
    const button = screen.getByRole("button", { name: "演示数据设置" });
    expect(button.closest("header")).not.toBeNull();
    expect(within(screen.getByTestId("preview-content")).queryByRole("button")).toBeNull();
    fireEvent.click(button);
    fireEvent.click(await screen.findByRole("menuitemradio", { name: "首次失败" }));
    expect(screen.getByRole("status").textContent).toBe("initial-error");
    fireEvent.click(button);
    const item = await screen.findByRole("menuitemradio", { name: "首次失败" });
    expect(item.getAttribute("aria-checked")).toBe("true");
    expect(screen.getAllByRole("menuitemradio").filter((entry) => entry.getAttribute("aria-checked") === "true")).toHaveLength(1);
  });
  it("Switch 开启刷新失败时不改变数据状态，菜单保持打开", async () => {
    render(<Preview id="preview" />);
    fireEvent.click(screen.getByRole("button", { name: "演示数据设置" }));
    const toggle = await screen.findByRole("switch", { name: "下次刷新失败" });
    fireEvent.click(toggle);
    expect(screen.getByRole("switch", { name: "下次刷新失败" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("menuitemradio", { name: "正常" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("status").textContent).toBe("ready");
    toggle.focus();
    fireEvent.keyDown(toggle, { key: "Escape" });
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "演示数据设置" }));
  });
  it("同页的多个预览分别拥有按钮和数据状态", async () => {
    render(<><Preview id="one" /><Preview id="two" /></>);
    fireEvent.click(within(screen.getByRole("region", { name: "one" })).getByRole("button", { name: "演示数据设置" }));
    fireEvent.click(await screen.findByRole("menuitemradio", { name: "首次加载" }));
    expect(within(screen.getByRole("region", { name: "one" })).getByRole("status").textContent).toBe("loading");
    expect(within(screen.getByRole("region", { name: "two" })).getByRole("status").textContent).toBe("ready");
  });
  it("刷新失败只作用于一次刷新，随后重试恢复", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(useDataStateDemo);
    act(() => result.current.setFailNextRefresh(true));
    let request!: Promise<void>;
    act(() => { request = result.current.refresh(); });
    const rejected = expect(request).rejects.toThrow("模拟刷新失败");
    expect(result.current.failNextRefresh).toBe(false);
    await act(async () => { await vi.advanceTimersByTimeAsync(800); await rejected; });
    const revision = result.current.revision;
    act(() => { request = result.current.refresh(); });
    await act(async () => { await vi.advanceTimersByTimeAsync(800); await request; });
    expect(result.current.scenario).toBe("ready");
    expect(result.current.revision).toBe(revision + 1);
  });
  it("刷新未完成时切换状态，旧请求不会覆盖新的选择", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(useDataStateDemo);
    let request!: Promise<void>;
    act(() => { request = result.current.refresh(); });
    act(() => result.current.changeScenario("initial-error"));
    await act(async () => { await vi.advanceTimersByTimeAsync(800); await request; });
    expect(result.current.scenario).toBe("initial-error");
  });
});
