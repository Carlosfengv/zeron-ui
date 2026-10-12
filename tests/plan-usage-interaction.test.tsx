// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlanUsageDemo } from "../docs/components/blocks/PlanUsageDemo";
import { PlanUsage } from "../packages/blocks/src/application/plan-usage-01/plan-usage";
import { planUsageDemoData } from "../packages/blocks/src/application/plan-usage-01/plan-usage-demo-data";

// Browser checks exercise the real chart and slider. These tests cover billing intent and controlled state.
vi.mock("../packages/blocks/src/application/plan-usage-01/plan-usage-chart", () => ({ PlanUsageChart: () => null }));
vi.mock("@zeron/ui/slider", () => ({ Slider: ({ value, label, onChange, disabled }: {
  value: number; label: string; onChange: (value: number) => void; disabled: boolean;
}) => <input type="range" aria-label={label} value={value} disabled={disabled}
  onChange={(event) => onChange(Number(event.target.value))} /> }));
afterEach(cleanup);

describe("PlanUsage subscription interactions", () => {
  it("derives totals, balances and invoice pagination from the host snapshot", () => {
    const { rerender } = render(<PlanUsage data={planUsageDemoData} />);
    expect(screen.getByText("1,705")).toBeTruthy();
    expect(screen.getByText("2,295 left · resets in 20 days")).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("1705");
    expect(screen.queryByText("HX-2026-0003")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Show 2 older" }));
    expect(screen.getByText("HX-2026-0003")).toBeTruthy();
    expect(screen.getByText("HX-2026-0002")).toBeTruthy();
    rerender(<PlanUsage data={{ ...planUsageDemoData, cycle: { ...planUsageDemoData.cycle,
      models: [{ id: "over", name: "Over quota", credits: 5000, colorIndex: 1 }] } }} />);
    expect(screen.getByText("0 left · resets in 20 days")).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("data-overflow")).toBe("true");
  });

  it("keeps the alert marker and texture aligned with capacity during overage", () => {
    const overage = { ...planUsageDemoData, cycle: { ...planUsageDemoData.cycle,
      models: [{ id: "over", name: "Over quota", credits: 5000, colorIndex: 1 as const }] } };
    const { container, rerender } = render(<PlanUsage data={overage} />);
    const pattern = () => container.querySelector<SVGElement>("[data-slot='plan-usage-threshold-pattern']");
    expect(screen.getByRole("progressbar").getAttribute("aria-valuemax")).toBe("5000");
    expect(pattern()?.style.left).toBe("64%"); // 80% of 4,000 on a 5,000-credit track.
    expect(pattern()?.style.width).toBe("36%");
    expect((pattern()?.nextElementSibling as HTMLElement).style.left).toBe("64%");
    rerender(<PlanUsage data={{ ...overage, limits: { ...overage.limits, alertPercent: 100 } }} />);
    expect(pattern()?.style.left).toBe("80%"); // 100% alerts at the included allowance, even after overage.
    rerender(<PlanUsage data={{ ...overage, cycle: { ...overage.cycle, includedCredits: 0 } }} />);
    expect(pattern()?.style.left).toBe("0%");
    expect(pattern()?.style.width).toBe("100%");
    rerender(<PlanUsage data={{ ...planUsageDemoData, limits: { ...overage.limits, alertPercent: 100 } }} />);
    expect(pattern()).toBeNull();
  });

  it("emits exact action payloads and leaves controlled limits and subscription unchanged", () => {
    const actions = { onSelectPlan: vi.fn(), onUpdatePayment: vi.fn(), onDownloadInvoice: vi.fn(),
      onCancelPlan: vi.fn(), onAlertPercentChange: vi.fn(), onExtraUsageChange: vi.fn() };
    render(<PlanUsage data={planUsageDemoData} actions={actions} />);
    fireEvent.click(screen.getByRole("button", { name: "Upgrade" }));
    expect(actions.onSelectPlan).toHaveBeenCalledWith("max");
    fireEvent.click(screen.getByRole("button", { name: "Downgrade" }));
    expect(actions.onSelectPlan).toHaveBeenCalledWith("free");
    fireEvent.click(screen.getByRole("button", { name: "Update" }));
    expect(actions.onUpdatePayment).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Cancel plan" }));
    expect(actions.onCancelPlan).toHaveBeenCalledOnce();
    fireEvent.click(screen.getByRole("button", { name: "Download invoice HX-2026-0009" }));
    expect(actions.onDownloadInvoice).toHaveBeenCalledWith(planUsageDemoData.invoices[0]);
    fireEvent.change(screen.getByRole("slider", { name: "Usage alert" }), { target: { value: "70" } });
    expect(actions.onAlertPercentChange).toHaveBeenCalledWith(70);
    expect(screen.getByText("Alert at 80%")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Turn on extra usage" }));
    expect(actions.onExtraUsageChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole("switch", { name: "Extra usage" }).getAttribute("aria-checked")).toBe("false");
  });

  it("disables unavailable/pending mutations and presents cancellation and errors", () => {
    const { rerender } = render(<PlanUsage data={planUsageDemoData} />);
    for (const name of ["Upgrade", "Downgrade", "Update", "Cancel plan", "Turn on extra usage"])
      expect(screen.getByRole("button", { name }).hasAttribute("disabled")).toBe(true);
    const cancel = vi.fn();
    rerender(<PlanUsage data={planUsageDemoData} actions={{ onCancelPlan: cancel }} pending error="Could not update subscription." />);
    expect(screen.getByRole("alert").textContent).toContain("Could not update subscription.");
    fireEvent.click(screen.getByRole("button", { name: "Cancel plan" }));
    expect(cancel).not.toHaveBeenCalled();
    rerender(<PlanUsage data={{ ...planUsageDemoData, cancelAtPeriodEnd: true }} actions={{ onCancelPlan: cancel }} />);
    expect(screen.getByRole("button", { name: "Cancel plan" }).hasAttribute("disabled")).toBe(true);
    expect(screen.getAllByText("Cancellation scheduled")).toHaveLength(2);
  });

  it("renders empty invoice and absent payment states and zero model percentages", () => {
    render(<PlanUsage data={{ ...planUsageDemoData, invoices: [], payment: undefined,
      cycle: { ...planUsageDemoData.cycle, models: [{ id: "empty", name: "No model calls", credits: 0, colorIndex: 1 }] } }} />);
    expect(screen.getByText("No invoices yet.")).toBeTruthy();
    expect(screen.getByText("No payment method on file.")).toBeTruthy();
    expect(screen.getByText("0%")).toBeTruthy();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuenow")).toBe("0");
    expect(screen.queryByRole("button", { name: /Show .* older/ })).toBeNull();
  });

  it("updates the demo allowance together with the selected plan", () => {
    render(<NextIntlClientProvider locale="en" messages={{}}><PlanUsageDemo /></NextIntlClientProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Upgrade" }));
    expect(screen.getByRole("dialog").textContent).toContain("Switch to Max");
    fireEvent.click(screen.getByRole("button", { name: "Confirm example change" }));
    expect(screen.getByText("of 12,000 included credits")).toBeTruthy();
    expect(screen.getByText("10,295 left · resets in 20 days")).toBeTruthy();
    expect(screen.queryByText(/At this pace you’ll run out/)).toBeNull();
    expect(screen.getByRole("progressbar").getAttribute("aria-valuemax")).toBe("12000");
  });

  it("localizes business descriptions in the Chinese demo", () => {
    render(<NextIntlClientProvider locale="zh-CN" messages={{}}><PlanUsageDemo /></NextIntlClientProvider>);
    expect(screen.getByText("每月 4,000 点额度")).toBeTruthy();
    expect(screen.getByText("适合日常使用智能体工作。")).toBeTruthy();
    expect(screen.getByText("Pro，8月28日 – 9月28日，含额外用量")).toBeTruthy();
    expect(screen.queryByText("For daily work with agents.")).toBeNull();
  });
});
