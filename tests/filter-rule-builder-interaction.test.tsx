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
