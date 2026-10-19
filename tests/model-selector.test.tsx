// @vitest-environment jsdom

import { useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ModelSelector, createModelSelectorDemoModels, modelSelectorDemoValue, modelSelectorZhLabels } from "@zeron/blocks/model-selector-01";

afterEach(cleanup);

class TestResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", TestResizeObserver);
Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: () => undefined });

function ControlledSelector() {
  const [value, setValue] = useState(modelSelectorDemoValue);
  return <ModelSelector models={createModelSelectorDemoModels()} value={value} onValueChange={setValue} defaultOpen />;
}

describe("ModelSelector", () => {
  it("preserves settings while choosing a model and reflects the host's committed value", async () => {
    const onValueChange = vi.fn();
    const value = { ...modelSelectorDemoValue, extendedThinking: true, webSearch: true };
    const models = createModelSelectorDemoModels();
    const { rerender } = render(<ModelSelector models={models} value={value} onValueChange={onValueChange} defaultOpen />);
    fireEvent.click(await screen.findByRole("option", { name: "Haiku 5.5" }));
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith({ ...value, modelId: "haiku-5.5" });
    expect(screen.getByRole("button", { name: "Sonnet 5.5" })).toBeTruthy();
    rerender(<ModelSelector models={models} value={{ ...value, modelId: "haiku-5.5" }} onValueChange={onValueChange} />);
    expect(screen.getByRole("button", { name: "Haiku 5.5" })).toBeTruthy();
  });

  it("toggles each setting once, retains the other fields, and keeps the panel open", async () => {
    render(<ControlledSelector />);
    await screen.findByRole("switch", { name: "Extended thinking" });
    fireEvent.click(screen.getByText("Extended thinking"));
    expect(screen.getByRole("switch", { name: "Extended thinking" }).getAttribute("aria-checked")).toBe("true");
    fireEvent.click(screen.getByRole("switch", { name: "Web search" }));
    expect(screen.getByRole("switch", { name: "Web search" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("switch", { name: "Extended thinking" }).getAttribute("aria-checked")).toBe("true");
    expect(screen.getByRole("button", { name: "Sonnet 5.5" }).getAttribute("aria-expanded")).toBe("true");
  });

  it("chooses with arrows and Enter, then restores focus to the trigger", async () => {
    render(<ControlledSelector />);
    await screen.findByRole("option", { name: "Sonnet 5.5" });
    const command = screen.getByRole("combobox", { name: "Choose a model" });
    fireEvent.keyDown(command, { key: "ArrowDown" });
    await waitFor(() => expect(screen.getByRole("option", { name: "Haiku 5.5" }).getAttribute("aria-selected")).toBe("true"));
    fireEvent.keyDown(command, { key: "Enter" });
    await waitFor(() => expect(screen.getByRole("button", { name: "Haiku 5.5" }).getAttribute("aria-expanded")).toBe("false"));
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: "Haiku 5.5" })));
  });

  it("respects controlled open, disabled options and the overall disabled state", async () => {
    const onValueChange = vi.fn();
    const onOpenChange = vi.fn();
    const models = createModelSelectorDemoModels().map((model) => ({ ...model, disabled: model.id === "opus-5.5" }));
    const props = { models, value: modelSelectorDemoValue, onValueChange, open: true, onOpenChange };
    const { rerender } = render(<ModelSelector {...props} />);
    fireEvent.click(await screen.findByRole("option", { name: "Opus 5.5" }));
    expect(onValueChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("option", { name: "Auto" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.getByRole("button", { name: "Sonnet 5.5" }).getAttribute("aria-expanded")).toBe("true");
    rerender(<ModelSelector {...props} disabled />);
    expect((screen.getByRole("button", { name: "Sonnet 5.5" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByRole("button", { name: "Sonnet 5.5" }).getAttribute("aria-expanded")).toBe("false");
  });

  it("handles an empty list and unmatched model without silently changing the selection", async () => {
    const onValueChange = vi.fn();
    render(<ModelSelector models={[]} value={modelSelectorDemoValue} onValueChange={onValueChange} defaultOpen />);
    expect(await screen.findByText("No models available")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Choose a model" })).toBeTruthy();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it("shows model choices and settings without the summary footer, including localized labels and automatic routing", async () => {
    const models = createModelSelectorDemoModels("zh-CN");
    const { rerender } = render(<ModelSelector models={models} value={modelSelectorDemoValue} onValueChange={vi.fn()} labels={modelSelectorZhLabels} locale="zh-CN" currency="CNY" open />);
    expect(await screen.findByRole("switch", { name: "联网搜索" })).toBeTruthy();
    expect(screen.getByRole("switch", { name: "扩展思考" })).toBeTruthy();
    expect(screen.queryByRole("contentinfo")).toBeNull();
    expect(screen.queryByText("首字延迟")).toBeNull();
    rerender(<ModelSelector models={createModelSelectorDemoModels()} value={{ ...modelSelectorDemoValue, modelId: "auto" }} onValueChange={vi.fn()} open />);
    expect(screen.getByRole("option", { name: "Auto" }).getAttribute("aria-current")).toBe("true");
    expect(screen.getByRole("button", { name: "Auto" })).toBeTruthy();
    expect(screen.queryByText(/first token|M tokens/)).toBeNull();
  });

  it("syncs keyboard navigation with host selection changes while the popover stays open", async () => {
    const onValueChange = vi.fn();
    const models = createModelSelectorDemoModels();
    const props = { models, value: modelSelectorDemoValue, onValueChange, open: true };
    const { rerender } = render(<ModelSelector {...props} />);
    const command = await screen.findByRole("combobox", { name: "Choose a model" });
    fireEvent.keyDown(command, { key: "ArrowUp" });
    await waitFor(() => expect(screen.getByRole("option", { name: "Opus 5.5" }).getAttribute("aria-selected")).toBe("true"));

    const nextValue = { ...modelSelectorDemoValue, modelId: "haiku-5.5" };
    rerender(<ModelSelector {...props} value={nextValue} />);
    await waitFor(() => expect(screen.getByRole("option", { name: "Haiku 5.5" }).getAttribute("aria-selected")).toBe("true"));
    expect(document.activeElement).toBe(command);
    fireEvent.keyDown(command, { key: "ArrowUp" });
    fireEvent.keyDown(command, { key: "Enter" });
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith({ ...nextValue, modelId: "sonnet-5.5" });
    rerender(<ModelSelector {...props} />);
    await waitFor(() => expect(screen.getByRole("option", { name: "Sonnet 5.5" }).getAttribute("aria-selected")).toBe("true"));
    expect(document.activeElement).toBe(command);
  });

  it("describes model usage and ratings to assistive technology", async () => {
    render(<ControlledSelector />);
    expect(await screen.findByRole("option", {
      name: "Sonnet 5.5",
      description: "Everyday work Speed: 4/5, Quality: 4/5, Cost: 3/5",
    })).toBeTruthy();
    expect(screen.getByRole("option", { name: "Auto", description: "Picks per message Varies" })).toBeTruthy();
  });

  it("closes without emitting a redundant change when the current model is chosen", async () => {
    const onValueChange = vi.fn();
    const onOpenChange = vi.fn();
    render(<ModelSelector models={createModelSelectorDemoModels()} value={modelSelectorDemoValue} onValueChange={onValueChange} onOpenChange={onOpenChange} defaultOpen />);
    fireEvent.click(await screen.findByRole("option", { name: "Sonnet 5.5" }));
    expect(onValueChange).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("resets an uncommitted keyboard highlight when the host reopens the popover", async () => {
    const props = { models: createModelSelectorDemoModels(), value: modelSelectorDemoValue, onValueChange: vi.fn() };
    const { rerender } = render(<ModelSelector {...props} open />);
    const command = await screen.findByRole("combobox", { name: "Choose a model" });
    fireEvent.keyDown(command, { key: "ArrowUp" });
    await waitFor(() => expect(screen.getByRole("option", { name: "Opus 5.5" }).getAttribute("aria-selected")).toBe("true"));
    expect(screen.getByRole("option", { name: "Sonnet 5.5" }).getAttribute("aria-current")).toBe("true");
    expect(screen.getByRole("option", { name: "Opus 5.5" }).hasAttribute("aria-current")).toBe(false);
    rerender(<ModelSelector {...props} open={false} />);
    rerender(<ModelSelector {...props} open />);
    await waitFor(() => expect(screen.getByRole("option", { name: "Sonnet 5.5" }).getAttribute("aria-selected")).toBe("true"));
    expect(props.onValueChange).not.toHaveBeenCalled();
  });

  it("moves keyboard navigation away from an option that becomes unavailable", async () => {
    const models = createModelSelectorDemoModels();
    const props = { models, value: modelSelectorDemoValue, onValueChange: vi.fn(), open: true };
    const { rerender } = render(<ModelSelector {...props} />);
    const command = await screen.findByRole("combobox", { name: "Choose a model" });
    rerender(<ModelSelector {...props} models={models.map((model) => ({ ...model, disabled: model.id === "sonnet-5.5" }))} />);
    await waitFor(() => expect(screen.getByRole("option", { name: "Opus 5.5" }).getAttribute("aria-selected")).toBe("true"));
    fireEvent.keyDown(command, { key: "ArrowDown" });
    fireEvent.keyDown(command, { key: "Enter" });
    expect(props.onValueChange).toHaveBeenCalledExactlyOnceWith({ ...modelSelectorDemoValue, modelId: "haiku-5.5" });
  });

  it("does not commit a disabled model when all options are unavailable", async () => {
    const onValueChange = vi.fn();
    render(<ModelSelector models={createModelSelectorDemoModels().map((model) => ({ ...model, disabled: true }))} value={modelSelectorDemoValue} onValueChange={onValueChange} defaultOpen />);
    const command = await screen.findByRole("combobox", { name: "Choose a model" });
    fireEvent.keyDown(command, { key: "ArrowDown" });
    fireEvent.keyDown(command, { key: "Enter" });
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
