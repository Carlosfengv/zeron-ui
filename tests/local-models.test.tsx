// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useState } from "react";
import { isLocalModelsConfigurationValid } from "../packages/blocks/src/application/local-models-01/local-models-data";
vi.mock("../packages/blocks/src/application/local-models-01/local-models.module.css", () => ({ default: {} }));
import { LocalModels, localModelsDemoData, localModelsDemoValue, localModelsDemoAppliedValue, localModelsOverflowDemoValue,
  getLocalModelMemory, getLocalModelsUsage, fitLocalModelsToGpus, countLocalModelChanges, type LocalModelsValue } from "@zeron/blocks/local-models-01";

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} })));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("local model memory planning", () => {
  it("reduces another shared model's precision before unloading a model that already uses its minimum settings", () => {
    const first = { ...localModelsDemoData.models[1], id: "first", gpuIds: ["0"], weights: { BF16: 30 }, cachePer32K: 0, runtime: 0 };
    const second = { ...first, id: "second", weights: { BF16: 30, INT4: 10 } };
    const data = { gpus: [{ id: "0", label: "GPU 0", capacity: 48 }], models: [first, second] };
    const config = { ...localModelsDemoValue["gpt-oss-20b"], precision: "BF16" as const, parallel: 1, context: 8192 };
    const value = { first: { ...config }, second: { ...config } };
    const fitted = fitLocalModelsToGpus(data, value);
    expect(fitted.first.enabled).toBe(true);
    expect(fitted.second).toMatchObject({ enabled: true, precision: "INT4" });
    expect(getLocalModelsUsage(data, fitted).total).toBe(40);
    expect(value.second.precision).toBe("BF16");
  });
  it("keeps the total accurate when a model is split across three GPUs", () => {
    const data = { gpus: localModelsDemoData.gpus.slice(0, 3), models: [{ ...localModelsDemoData.models[1], gpuIds: ["0", "1", "2"], weights: { MXFP4: .1 }, cachePer32K: 0, runtime: 0 }] };
    expect(getLocalModelsUsage(data, localModelsDemoValue).total).toBe(.1);
  });
  it("preserves concurrency and context when a model has no KV cache to reduce", () => {
    const model = { ...localModelsDemoData.models[1], cachePer32K: 0 };
    const config = { ...localModelsOverflowDemoValue[model.id], context: 131072 };
    const fitted = fitLocalModelsToGpus({ gpus: [{ id: "2", label: "GPU 2", capacity: 20 }], models: [model] }, { [model.id]: config });
    expect(fitted[model.id]).toMatchObject({ precision: "MXFP4", enabled: true, parallel: 16, context: 131072 });
  });
  it.each([Infinity, NaN, -1])("rejects invalid memory estimates (%s) and does not mutate or fit invalid input", (estimate) => {
    const data = { ...localModelsDemoData, models: localModelsDemoData.models.map((model) => ({ ...model, runtime: estimate })) };
    expect(isLocalModelsConfigurationValid(data, localModelsDemoValue)).toBe(false);
    expect(fitLocalModelsToGpus(data, localModelsDemoValue)).toEqual(localModelsDemoValue);
    expect(Number.isFinite(getLocalModelsUsage(data, localModelsDemoValue).total)).toBe(true);
  });
  it("rejects infinite parallel requests before Fit can enter a reduction loop", () => {
    const value = { ...localModelsDemoValue, "gpt-oss-20b": { ...localModelsDemoValue["gpt-oss-20b"], parallel: Infinity } };
    expect(isLocalModelsConfigurationValid(localModelsDemoData, value)).toBe(false);
    expect(fitLocalModelsToGpus(localModelsDemoData, value)).toEqual(value);
  });
  it("rejects duplicate GPU allocations and nonpositive GPU capacities", () => {
    expect(isLocalModelsConfigurationValid({ ...localModelsDemoData, models: [{ ...localModelsDemoData.models[1], gpuIds: ["2", "2"] }] }, localModelsDemoValue)).toBe(false);
    expect(isLocalModelsConfigurationValid({ ...localModelsDemoData, gpus: localModelsDemoData.gpus.map((gpu) => ({ ...gpu, capacity: 0 })) }, localModelsDemoValue)).toBe(false);
  });
  it("reproduces the normal and 8.3 GB overflow reference from one set of inputs", () => {
    expect(getLocalModelsUsage(localModelsDemoData, localModelsDemoValue)).toMatchObject({ total: 146.7, capacity: 192, excess: 0 });
    const model = localModelsDemoData.models[1];
    expect(getLocalModelMemory(model, localModelsOverflowDemoValue[model.id])).toEqual({ weights: 41.9, cache: 12.8, runtime: 1.6, total: 56.3 });
    expect(getLocalModelsUsage(localModelsDemoData, localModelsOverflowDemoValue).excess).toBe(8.3);
    expect(countLocalModelChanges(localModelsDemoData, localModelsDemoValue, localModelsDemoAppliedValue)).toBe(2);
    expect(countLocalModelChanges(localModelsDemoData, localModelsOverflowDemoValue, localModelsDemoAppliedValue)).toBe(3);
  });
  it("detects per-GPU overflow even when the server has free capacity", () => {
    const value = { ...localModelsDemoValue, "mistral-small": { ...localModelsDemoValue["mistral-small"], enabled: true } };
    const usage = getLocalModelsUsage(localModelsDemoData, value);
    expect(usage.total).toBeLessThan(usage.capacity);
    expect(usage.gpus.find((gpu) => gpu.id === "2")!.used).toBe(58);
    expect(usage.excess).toBe(10);
  });
  it("fits shared allocations without mutating the supplied draft", () => {
    const original = structuredClone(localModelsOverflowDemoValue);
    const fitted = fitLocalModelsToGpus(localModelsDemoData, original);
    expect(getLocalModelsUsage(localModelsDemoData, fitted).excess).toBe(0);
    expect(original).toEqual(localModelsOverflowDemoValue);
    expect(fitted["gpt-oss-20b"].enabled).toBe(true);
    const tiny = { ...localModelsDemoData, gpus: localModelsDemoData.gpus.map((gpu) => ({ ...gpu, capacity: 1 })) };
    expect(getLocalModelsUsage(tiny, fitLocalModelsToGpus(tiny, original)).excess).toBe(0);
  });
});

function Harness({ initial = localModelsDemoValue, onApply = vi.fn() }: { initial?: LocalModelsValue; onApply?: (value: LocalModelsValue) => void }) {
  const [value, setValue] = useState(initial);
  return <LocalModels data={localModelsDemoData} value={value} appliedValue={localModelsDemoAppliedValue} onValueChange={setValue} onApply={onApply} defaultSelectedModelId="gpt-oss-20b" />;
}
describe("local models interactions", () => {
  it("connects each context label to its own select trigger", () => {
    render(<><Harness /><Harness /></>);
    const triggers = screen.getAllByRole("combobox", { name: "Context window" });
    const labels = screen.getAllByText("Context window", { selector: "label" }) as HTMLLabelElement[];
    expect(new Set(triggers.map((trigger) => trigger.id)).size).toBe(2);
    labels.forEach((label, index) => expect(label.control).toBe(triggers[index]));
  });
  it.each([[65536, "64K tokens"], [1000, "1,000 tokens"]])("shows a valid host context outside the presets (%s)", async (context, label) => {
    const config = { ...localModelsDemoValue["gpt-oss-20b"], context: Number(context) };
    const initial = { ...localModelsDemoValue, "gpt-oss-20b": config };
    render(<Harness initial={initial} />);
    expect(screen.getByRole("combobox", { name: "Context window" }).textContent).toContain(label);
    expect(screen.queryByText("Invalid configuration")).toBeNull();
    fireEvent.click(screen.getByRole("combobox", { name: "Context window" }));
    const option = await screen.findByRole("option", { name: (name) => name.startsWith(String(label)) });
    expect(option.getAttribute("aria-selected")).toBe("true");
  });
  it("disables unassigned graphics cards and blocks applying invalid memory estimates", () => {
    const { rerender } = render(<LocalModels data={{ ...localModelsDemoData, models: [] }} value={{}} appliedValue={{}} onValueChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Select GPU 0" }).getAttribute("aria-disabled")).toBe("true");
    const data = { ...localModelsDemoData, models: localModelsDemoData.models.map((model) => ({ ...model, cachePer32K: NaN })) };
    rerender(<LocalModels data={data} value={localModelsDemoValue} appliedValue={localModelsDemoAppliedValue} onValueChange={vi.fn()} onApply={vi.fn()} />);
    expect(screen.getByText("Invalid configuration")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Apply" }) as HTMLButtonElement).disabled).toBe(true);
  });
  it("selects a GPU from the memory popover and highlights both cards of a multi-GPU model", async () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "GPU Memory" }));
    const panel = await screen.findByRole("dialog", { name: "GPU Memory" });
    expect(within(panel).getByText("nimbus-gpu-01, 4 cards of 48 GB")).toBeTruthy();
    expect(within(panel).getByText("45.3 GB free")).toBeTruthy();
    fireEvent.click(within(panel).getByRole("button", { name: "Inspect GPU 0" }));
    expect(screen.getByRole("switch", { name: "Enable gpt-oss-120b" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Select GPU 0" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Select GPU 1" }).getAttribute("aria-pressed")).toBe("true");
  });
  it("fits the GPU allocations from the memory popover and updates its free-memory summary", async () => {
    render(<Harness initial={localModelsOverflowDemoValue} />);
    fireEvent.click(screen.getByRole("button", { name: "GPU Memory" }));
    const panel = await screen.findByRole("dialog", { name: "GPU Memory" });
    expect(within(panel).getByRole("progressbar", { name: /GPU 2: 56.3 of 48 GB; over by 8.3 GB/ })).toBeTruthy();
    fireEvent.click(within(panel).getByRole("button", { name: "Fit to GPUs" }));
    expect(within(panel).getByText("25 GB free")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Apply" }) as HTMLButtonElement).disabled).toBe(false);
  });
  it("handles an empty GPU server without offering a selection or fit action", async () => {
    render(<LocalModels data={{ gpus: [], models: [] }} value={{}} appliedValue={{}} onValueChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "GPU Memory" }));
    const panel = await screen.findByRole("dialog", { name: "GPU Memory" });
    expect(within(panel).getByText("No GPUs available")).toBeTruthy();
    expect((within(panel).getByRole("button", { name: "Fit to GPUs" }) as HTMLButtonElement).disabled).toBe(true);
  });
  it("blocks Apply on overflow, resolves it with Fit, and submits the displayed draft", () => {
    const apply = vi.fn(); render(<Harness initial={localModelsOverflowDemoValue} onApply={apply} />);
    expect((screen.getByRole("button", { name: "Apply" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText("Doesn't fit on GPU 2")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Fit to GPUs" }));
    expect(screen.queryByText("Doesn't fit on GPU 2")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Apply" }));
    expect(apply).toHaveBeenCalledOnce();
    expect(getLocalModelsUsage(localModelsDemoData, apply.mock.calls[0][0]).excess).toBe(0);
  });
  it("keeps selection independent of draft changes and restores all models on discard", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Select Gemma 3 27B" }));
    expect(screen.getByRole("switch", { name: "Enable Gemma 3 27B" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    expect(screen.getByText("0 models edited")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Apply" }) as HTMLButtonElement).disabled).toBe(true);
  });
  it("switches models from the SVG using the keyboard", () => {
    render(<Harness />);
    fireEvent.keyDown(screen.getByRole("button", { name: "Select GPU 3" }), { key: "Enter" });
    expect(screen.getByRole("switch", { name: "Enable Gemma 3 27B" })).toBeTruthy();
  });
  it("shows an empty state and blocks missing model configurations", () => {
    const { rerender } = render(<LocalModels data={{ ...localModelsDemoData, models: [] }} value={{}} appliedValue={{}} onValueChange={vi.fn()} onApply={vi.fn()} />);
    expect(screen.getByText(/No local models/)).toBeTruthy();
    rerender(<LocalModels data={localModelsDemoData} value={{}} appliedValue={{}} onValueChange={vi.fn()} onApply={vi.fn()} />);
    expect(screen.getByText("Invalid configuration")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Apply" }) as HTMLButtonElement).disabled).toBe(true);
  });
});
