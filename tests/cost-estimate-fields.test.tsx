// @vitest-environment jsdom
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CostEstimateUsage } from "../packages/blocks/src/application/cost-estimate-01/cost-estimate-usage";
import { calculateCostEstimate, costEstimateDefaultLimits, costEstimateLabels } from "../packages/blocks/src/application/cost-estimate-01/cost-estimate-data";
import { costEstimateDemoInputs, costEstimateDemoRateCards } from "../packages/blocks/src/application/cost-estimate-01/cost-estimate-demo-data";

const ignoreInvalid = () => {};

function Usage({ disabled = false }: { disabled?: boolean }) {
  const [value, setValue] = useState(costEstimateDemoInputs);
  const rateCard = costEstimateDemoRateCards["us-east"];
  return <CostEstimateUsage value={value} result={calculateCostEstimate(value, rateCard)} rateCard={rateCard}
    limits={costEstimateDefaultLimits} labels={costEstimateLabels} locale="en-US" disabled={disabled} revision={0}
    onChange={(field, next) => setValue((current) => ({ ...current, [field]: next }))} onInvalid={ignoreInvalid} />;
}

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.spyOn(HTMLElement.prototype, "offsetWidth", "get").mockReturnValue(240);
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

describe("cost estimate real input and slider composition", () => {
  it("gives every control a unique identity across two estimates", () => {
    const { container } = render(<><Usage /><Usage /></>);
    const inputs = screen.getAllByRole("textbox");
    const sliders = screen.getAllByRole("slider");
    expect(inputs).toHaveLength(8);
    expect(sliders).toHaveLength(8);
    const ids = [...inputs, ...sliders].map((control) => control.id);
    expect(ids.every(Boolean)).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
    for (const input of inputs) {
      const label = container.querySelector<HTMLLabelElement>(`label[for="${input.id}"]`);
      expect(label?.control).toBe(input);
      expect(label?.textContent?.trim()).toMatch(/Ingest|Storage|Queries|Seats/);
    }
    expect(screen.getAllByRole("slider", { name: /Ingest/ })).toHaveLength(2);
  });

  it("keeps the real slider and numeric input synchronized and disables both", () => {
    const { rerender } = render(<Usage />);
    const input = screen.getByRole("textbox", { name: /Ingest/ });
    fireEvent.change(input, { target: { value: "100" } });
    fireEvent.keyDown(input, { key: "Enter" });
    const slider = screen.getByRole("slider", { name: /Ingest/ });
    expect(slider.getAttribute("aria-valuenow")).toBe("100");
    fireEvent.change(slider, { target: { value: "110" } });
    expect(input).toHaveProperty("value", "110");
    rerender(<Usage disabled />);
    expect(input).toHaveProperty("disabled", true);
    expect(slider).toHaveProperty("disabled", true);
  });
});
