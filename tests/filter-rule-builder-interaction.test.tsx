// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FilterRuleBuilder } from "../packages/blocks/src/application/filter-rule-builder-01/filter-rule-builder";
import {
  filterRuleBuilderDemoDraft,
  filterRuleBuilderDemoFields,
  filterRuleBuilderDemoPresets,
  filterRuleBuilderDemoValue,
} from "../packages/blocks/src/application/filter-rule-builder-01/filter-rule-builder-demo-data";

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false, addEventListener() {}, removeEventListener() {} })));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("FilterRuleBuilder", () => {
  const multiSelectField = {
    id: "channel",
    label: "Channel",
    type: "multiSelect" as const,
    operators: [{ value: "isAnyOf", label: "is any of" }],
    options: [
      { value: "web", label: "Website conversations", textValue: "Browser chat" },
      { value: "email", label: "Email", disabled: true },
      { value: "sms", label: "Text messages" },
    ],
  };

  it("searches multi-select display text and commits the original option value", async () => {
    const onValueChange = vi.fn();
    render(
      <FilterRuleBuilder
        defaultDraft={{ field: "channel" }}
        fields={[multiSelectField]}
        onValueChange={onValueChange}
      />
    );

    const input = screen.getByRole("combobox", { name: "Threshold" });
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.change(input, { target: { value: "Browser" } });
    const option = await screen.findByRole("option", { name: "Website conversations" });
    expect(screen.queryByRole("option", { name: "Text messages" })).toBeNull();
    fireEvent.click(option);
    await screen.findByRole("button", { name: "Remove Browser chat" });
    if (input.getAttribute("aria-expanded") === "true") {
      fireEvent.keyDown(input, { key: "Escape" });
    }
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
    fireEvent.click(screen.getByRole("button", { name: "Add rule" }));

    expect(onValueChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ field: "channel", value: ["web"] }),
    ]);
  });

  it("prevents selection of a disabled multi-select option", async () => {
    const onValueChange = vi.fn();
    render(
      <FilterRuleBuilder
        defaultDraft={{ field: "channel" }}
        fields={[multiSelectField]}
        onValueChange={onValueChange}
      />
    );

    const input = screen.getByRole("combobox", { name: "Threshold" });
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    const option = await screen.findByRole("option", { name: "Email" });
    expect(option.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(option);
    if (input.getAttribute("aria-expanded") === "true") {
      fireEvent.keyDown(input, { key: "Escape" });
    }
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
    fireEvent.click(screen.getByRole("button", { name: "Add rule" }));

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByText("Choose or enter a value.")).toBeTruthy();
  });

  it("keeps non-searchable multi-select options selectable", async () => {
    const onValueChange = vi.fn();
    render(
      <FilterRuleBuilder
        defaultDraft={{ field: "channel" }}
        fields={[{ ...multiSelectField, searchable: false }]}
        onValueChange={onValueChange}
      />
    );

    const input = screen.getByRole("combobox", { name: "Threshold" });
    expect(input).toHaveProperty("readOnly", true);
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.click(await screen.findByRole("option", { name: "Text messages" }));
    if (input.getAttribute("aria-expanded") === "true") {
      fireEvent.keyDown(input, { key: "Escape" });
    }
    await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
    fireEvent.click(screen.getByRole("button", { name: "Add rule" }));

    expect(onValueChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ field: "channel", value: ["sms"] }),
    ]);
  });

  it("keeps a draft separate and requires it to be resolved before apply", async () => {
    const onApply = vi.fn();
    const onValueChange = vi.fn();
    render(
      <FilterRuleBuilder
        defaultDraft={filterRuleBuilderDemoDraft}
        defaultValue={filterRuleBuilderDemoValue}
        fields={filterRuleBuilderDemoFields}
        onApply={onApply}
        onValueChange={onValueChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Apply now" }));
    expect(onApply).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toContain("Add or cancel the draft rule");

    fireEvent.click(screen.getByRole("button", { name: "Add rule" }));
    expect(onValueChange).toHaveBeenLastCalledWith(expect.arrayContaining([
      expect.objectContaining({ field: "ai-confidence", operator: "greaterThanOrEqual", value: 90 }),
    ]));

    fireEvent.click(screen.getByRole("button", { name: "Apply now" }));
    await waitFor(() => expect(onApply).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ field: "ai-confidence", value: 90 }),
    ])));
  });

  it("validates number limits before inserting a rule", () => {
    render(
      <FilterRuleBuilder
        defaultDraft={{ field: "ai-confidence", operator: "greaterThanOrEqual", value: 120 }}
        fields={filterRuleBuilderDemoFields}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Add rule" }));
    expect(screen.getByText("Enter 100 or less.")).toBeTruthy();
    expect(screen.queryByText("Rule 1 ·")).toBeNull();
  });

  it("restores the last applied rules when changes are cancelled", () => {
    const onCancel = vi.fn();
    const onValueChange = vi.fn();
    render(
      <FilterRuleBuilder
        defaultValue={filterRuleBuilderDemoValue}
        fields={filterRuleBuilderDemoFields}
        onCancel={onCancel}
        onValueChange={onValueChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove Channel rule" }));
    expect(screen.queryByText("Channel")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByText("Channel")).toBeTruthy();
    expect(onCancel).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ field: "channel" }),
    ]));
    expect(onValueChange).toHaveBeenLastCalledWith(expect.arrayContaining([
      expect.objectContaining({ field: "channel" }),
    ]));
  });

  it("replaces the working set from a preset", () => {
    const onValueChange = vi.fn();
    render(
      <FilterRuleBuilder
        defaultValue={filterRuleBuilderDemoValue}
        fields={filterRuleBuilderDemoFields}
        onValueChange={onValueChange}
        presets={filterRuleBuilderDemoPresets}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "SLA Risk" }));
    expect(onValueChange).toHaveBeenLastCalledWith([
      expect.objectContaining({ field: "response-sla", operator: "lessThan", value: 5 }),
    ]);
  });
});
