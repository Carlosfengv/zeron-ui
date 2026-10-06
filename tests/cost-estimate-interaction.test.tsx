// @vitest-environment jsdom
import { useState } from "react";
import { NextIntlClientProvider } from "next-intl";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CostEstimate } from "../packages/blocks/src/application/cost-estimate-01/cost-estimate";
import { costEstimateDemoInputs, costEstimateDemoPresets, costEstimateDemoRateCards, costEstimateDemoRegions } from "../packages/blocks/src/application/cost-estimate-01/cost-estimate-demo-data";
import { calculateCostEstimate } from "../packages/blocks/src/application/cost-estimate-01/cost-estimate-data";
import type { CostEstimateProps } from "../packages/blocks/src/application/cost-estimate-01/cost-estimate-types";
import { CostEstimateDemo } from "../docs/components/blocks/CostEstimateDemo";

// Browser verification owns chart/slider geometry; state tests retain the real inputs and tabs.
vi.mock("@zeron/ui/chart", () => ({ ChartContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@zeron/ui/slider", () => ({ Slider: ({ value, label, onChange }: { value: number; label: string; onChange: (v: number) => void }) => <input type="range" aria-label={label} value={value} onChange={(e) => onChange(Number(e.target.value))} /> }));
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });
const base = { value: costEstimateDemoInputs, rateCard: costEstimateDemoRateCards["us-east"], regions: costEstimateDemoRegions, presets: costEstimateDemoPresets, defaultInputs: costEstimateDemoInputs, onValueChange: () => {} };
function Controlled({ actions }: { actions?: CostEstimateProps["actions"] }) {
  const [value, setValue] = useState(costEstimateDemoInputs);
  return <CostEstimate {...base} value={value} onValueChange={setValue} actions={actions} />;
}
describe("cost estimate inputs and actions", () => {
  it("renders the Container contract and updates presets, billing and reset atomically", () => {
    const { container } = render(<Controlled />);
    expect(container.querySelector('[data-block="cost-estimate"]')?.getAttribute("data-slot")).toBe("container");
    expect(container.querySelectorAll('[data-slot="container-body"]')).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Scale" }));
    expect(container.querySelector('[data-slot="cost-estimate-total"]')?.textContent).toBe("US$7,468.00");
    fireEvent.click(screen.getByRole("tab", { name: "年付" }));
    expect(screen.getByRole("tab", { name: "年付" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("tabpanel").getAttribute("aria-labelledby")).toBe(screen.getByRole("tab", { name: "年付" }).id);
    expect(container.querySelector('[data-slot="cost-estimate-total"]')?.textContent).toBe("US$6,347.80");
    fireEvent.click(screen.getByRole("button", { name: "重置" }));
    expect(container.querySelector('[data-slot="cost-estimate-total"]')?.textContent).toBe("US$586.00");
    expect(screen.getByRole("tab", { name: "月付" }).getAttribute("aria-selected")).toBe("true");
  });
  it("rejects empty drafts, snaps valid entry and restores Escape without changing model", () => {
    const onSave = vi.fn(); render(<Controlled actions={{ onSave }} />);
    const input = screen.getByRole("textbox", { name: /Ingest/ });
    fireEvent.change(input, { target: { value: "" } }); fireEvent.blur(input);
    expect(screen.getByRole("button", { name: "保存估算" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getByRole("alert")).toBeTruthy();
    fireEvent.change(input, { target: { value: "82.7" } }); fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: "保存估算" }));
    expect(onSave.mock.calls[0][0].inputs.ingestGBPerDay).toBe(82.5);
    fireEvent.change(input, { target: { value: "99" } }); fireEvent.keyDown(input, { key: "Escape" });
    expect((input as HTMLInputElement).value).toBe("82.5");
    expect(screen.getByText("自定义用量")).toBeTruthy();
  });
  it("does not expose prices from another region, failed queries or missing cards", () => {
    const { container, rerender } = render(<CostEstimate {...base} value={{ ...base.value, regionId: "eu-demo" }} />);
    expect(container.querySelector('[data-slot="cost-estimate-total"]')).toBeNull(); expect(screen.getByText("正在加载费率")).toBeTruthy();
    rerender(<CostEstimate {...base} state="error" />); expect(container.querySelector('[data-slot="cost-estimate-total"]')).toBeNull();
    rerender(<CostEstimate {...base} rateCard={null} />); expect(screen.getByText("暂无可用费率")).toBeTruthy();
    rerender(<CostEstimate {...base} state="stale" actions={{ onSave: vi.fn() }} />);
    expect(container.querySelector('[data-slot="cost-estimate-total"]')).toBeTruthy(); expect(screen.getByRole("button", { name: "保存估算" }).hasAttribute("disabled")).toBe(true);
  });
  it("guards immediate duplicate save and rejects a succeeded fingerprint for different inputs", () => {
    const onSave = vi.fn(); const { rerender } = render(<CostEstimate {...base} actions={{ onSave }} />);
    const button = screen.getByRole("button", { name: "保存估算" }); fireEvent.click(button); fireEvent.click(button); expect(onSave).toHaveBeenCalledTimes(1);
    const result = calculateCostEstimate(base.value, base.rateCard)!;
    rerender(<CostEstimate {...base} saveState={{ status: "succeeded", fingerprint: result.fingerprint }} />); expect(screen.getByText("已保存当前估算")).toBeTruthy();
    rerender(<CostEstimate {...base} value={{ ...base.value, seats: 13 }} saveState={{ status: "succeeded", fingerprint: result.fingerprint }} />); expect(screen.queryByText("已保存当前估算")).toBeNull();
  });
  it("does not render absent actions and supports error retry", () => {
    const onRetry = vi.fn(); const { rerender } = render(<CostEstimate {...base} />);
    expect(screen.queryByRole("button", { name: "保存估算" })).toBeNull(); expect(screen.queryByRole("button", { name: "关闭费用估算" })).toBeNull();
    expect(screen.queryByRole("button", { name: "查看计价说明" })).toBeNull();
    expect(screen.queryByRole("combobox", { name: "估算区域" })).toBeNull();
    rerender(<CostEstimate {...base} state="error" actions={{ onRetry }} />); fireEvent.click(screen.getByRole("button", { name: "重试" })); expect(onRetry).toHaveBeenCalledTimes(1);
  });
  it("keeps field identities and controlled values independent between instances", () => {
    render(<><Controlled /><Controlled /></>);
    const inputs = screen.getAllByRole("textbox", { name: /Ingest|Storage|Queries|Seats/ });
    expect(new Set(inputs.map((input) => input.id)).size).toBe(8);
    const ingest = screen.getAllByRole("textbox", { name: /Ingest/ });
    fireEvent.change(ingest[0], { target: { value: "100" } }); fireEvent.keyDown(ingest[0], { key: "Enter" });
    expect((ingest[0] as HTMLInputElement).value).toBe("100");
    expect((ingest[1] as HTMLInputElement).value).toBe("80");
  });
  it("demo retries failed saving and cleans pending timers on unmount", () => {
    vi.useFakeTimers(); const { unmount } = render(<NextIntlClientProvider locale="zh-CN" messages={{}}><CostEstimateDemo /></NextIntlClientProvider>);
    function toggleFailure() {
      const settings = screen.getByRole("button", { name: "演示数据设置" });
      fireEvent.click(settings);
      fireEvent.click(screen.getByRole("menuitemcheckbox", { name: "模拟保存失败" }));
      fireEvent.click(settings);
    }
    toggleFailure(); fireEvent.click(screen.getByRole("button", { name: "保存示例估算" }));
    act(() => vi.advanceTimersByTime(650)); expect(screen.getAllByRole("alert")[0].textContent).toContain("示例保存失败");
    toggleFailure(); fireEvent.click(screen.getByRole("button", { name: "保存示例估算" }));
    expect(screen.getByRole("button", { name: "正在保存" }).hasAttribute("disabled")).toBe(true);
    const download = vi.fn(); Object.defineProperty(URL, "createObjectURL", { configurable: true, value: download });
    unmount(); act(() => vi.advanceTimersByTime(5000)); expect(download).not.toHaveBeenCalled();
  });
});
