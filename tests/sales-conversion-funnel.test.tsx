// @vitest-environment jsdom

import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SalesConversionFunnel, salesFunnelDemoStages, salesFunnelDemoTeams } from "@zeron/blocks/sales-conversion-funnel-01";

vi.mock("motion/react", async (importOriginal) => ({
  ...await importOriginal<typeof import("motion/react")>(), useReducedMotion: () => true,
}));

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class {
    constructor(private callback: ResizeObserverCallback) {}
    observe(target: Element) { this.callback([{ target, contentRect: { width: 608, height: 300 } } as ResizeObserverEntry], this as unknown as ResizeObserver); }
    disconnect() {}
  });
});

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("SalesConversionFunnel block", () => {
  it("derives stage totals, deal counts and conversion from team data without mutation", () => {
    const original = JSON.stringify(salesFunnelDemoStages);
    const { container, getByRole } = render(<SalesConversionFunnel stages={salesFunnelDemoStages} teams={salesFunnelDemoTeams} />);
    expect(getByRole("region", { name: "Sales Conversion Funnel" })).toBeTruthy();
    expect([...container.querySelectorAll("dd")].map((node) => node.textContent)).toEqual(["150", "10%"]);
    expect([...container.querySelectorAll('ol[aria-hidden="true"] li')].map((node) => node.textContent)).toEqual(["Leads1,500 (100%)", "Contact800 (53%)", "Quotes200 (13%)", "Deals150 (10%)"]);
    expect(container.querySelectorAll('[data-slot="funnel-series"]')).toHaveLength(12);
    expect(JSON.stringify(salesFunnelDemoStages)).toBe(original);
    expect(getByRole("list", { name: "Teams" }).textContent).toBe("Team 1Team 2Team 3");
  });

  it("distinguishes absent, all-zero and invalid snapshots", () => {
    const { container, rerender, getByRole } = render(<SalesConversionFunnel stages={[]} teams={salesFunnelDemoTeams} />);
    expect([...container.querySelectorAll("dd")].map((node) => node.textContent)).toEqual(["—", "—"]);
    expect(getByRole("status").textContent).toBe("No leads yet");
    const zero = salesFunnelDemoStages.map((stage) => ({ ...stage, values: { "team-1": 0, "team-2": 0, "team-3": 0 } }));
    rerender(<SalesConversionFunnel stages={zero} teams={salesFunnelDemoTeams} />);
    expect([...container.querySelectorAll("dd")].map((node) => node.textContent)).toEqual(["0", "—"]);
    rerender(<SalesConversionFunnel stages={[{ id: "a", label: "Leads", values: {} }]} teams={salesFunnelDemoTeams} />);
    expect(getByRole("status").textContent).toBe("Funnel data is incomplete or invalid");
    expect(container.querySelector('[data-slot="funnel-chart"]')).toBeNull();
  });

  it("supports translated labels and host-owned actions", () => {
    const onAction = vi.fn();
    const { getByRole, container } = render(<SalesConversionFunnel stages={salesFunnelDemoStages} teams={salesFunnelDemoTeams} title="销售转化漏斗" locale="zh-CN" labels={{ deals: "成交", conversionRate: "转化率" }} actions={<button onClick={onAction}>导出</button>} />);
    fireEvent.click(getByRole("button", { name: "导出" }));
    expect(onAction).toHaveBeenCalledOnce();
    expect(container.querySelector("dl")?.textContent).toContain("转化率10%");
    expect(getByRole("region", { name: "销售转化漏斗" })).toBeTruthy();
  });

  it("shows a data notice when a snapshot omits the entire values object", () => {
    const incomplete = [{ id: "leads", label: "Leads" }] as unknown as typeof salesFunnelDemoStages;
    const { container, getByRole } = render(<SalesConversionFunnel stages={incomplete} teams={salesFunnelDemoTeams} />);
    expect(getByRole("status").textContent).toBe("Funnel data is incomplete or invalid");
    expect([...container.querySelectorAll("dd")].map((node) => node.textContent)).toEqual(["—", "—"]);
    expect(container.querySelector('[data-slot="funnel-chart"]')).toBeNull();
  });
});
