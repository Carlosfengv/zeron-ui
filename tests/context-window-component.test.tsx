// @vitest-environment jsdom

import { cleanup, render, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import {
  ContextWindow, ContextWindowCompact, ContextWindowUsage, getContextWindowUsage,
  contextWindowEnglishLabels, contextWindowZhLabels, contextWindowCompactEnglishLabels, contextWindowCompactZhLabels,
  type ContextWindowProps, type ContextWindowCompactProps,
} from "@zeron/ui/context-window";
import * as detailedBlock from "@zeron/blocks/context-window-01";
import * as compactBlock from "@zeron/blocks/context-window-02";
import { getContextWindowUsage as legacyUsage } from "../packages/blocks/src/application/context-window-01/context-window-data";

afterEach(cleanup);

describe("shared ContextWindow component", () => {
  it("preserves the two block contracts, label objects, data factories and calculation identity", () => {
    expect(detailedBlock.ContextWindow).toBe(ContextWindow);
    expect(compactBlock.ContextWindowUsage).toBe(ContextWindowUsage);
    expect(legacyUsage).toBe(getContextWindowUsage);
    expect(detailedBlock.contextWindowEnglishLabels).toBe(contextWindowEnglishLabels);
    expect(detailedBlock.contextWindowZhLabels).toBe(contextWindowZhLabels);
    expect(compactBlock.contextWindowCompactEnglishLabels).toBe(contextWindowCompactEnglishLabels);
    expect(compactBlock.contextWindowCompactZhLabels).toBe(contextWindowCompactZhLabels);
    const full: detailedBlock.ContextWindowProps = { data: detailedBlock.createContextWindowDemoData(), defaultTab: "history" };
    const shared: ContextWindowProps = full;
    const compact: compactBlock.ContextWindowCompactProps = { data: compactBlock.createContextWindowCompactDemoData(), embedded: true };
    const sharedCompact: ContextWindowCompactProps = compact;
    expect(getContextWindowUsage(shared.data)?.used).toBe(142699);
    expect(getContextWindowUsage(sharedCompact.data)?.used).toBe(175600);
  });

  it("updates both layouts and the trigger from one immutable snapshot, including invalid data", () => {
    const data = detailedBlock.createContextWindowDemoData();
    const panels = (snapshot: typeof data) => <>
      <ContextWindow title="Detailed" data={snapshot} />
      <ContextWindowCompact title="Compact" data={snapshot} />
      <ContextWindowUsage data-testid="usage" data={snapshot} />
    </>;
    const { getByRole, getByTestId, rerender } = render(panels(data));
    expect(within(getByTestId("usage")).getByText("71%")).toBeTruthy();
    expect(within(getByRole("region", { name: "Detailed" })).getByText("142.7k")).toBeTruthy();
    expect(within(getByRole("region", { name: "Compact" })).getByText("142.7k")).toBeTruthy();
    rerender(panels({ ...data, capacity: 100000 }));
    expect(within(getByTestId("usage")).getByText("143%")).toBeTruthy();
    expect(getByRole("region", { name: "Compact" }).textContent).toContain("0 left");
    rerender(panels({ ...data, docs: [data.docs[0], data.docs[0]] }));
    expect(getByTestId("usage").textContent).toBe("—");
    expect(within(getByRole("region", { name: "Detailed" })).getByRole("alert").textContent).toContain("invalid");
    expect(within(getByRole("region", { name: "Compact" })).getByRole("alert").textContent).toContain("invalid");
  });

  it("leaves provider branding to the UI host while preserving the compact block default", () => {
    const data = compactBlock.createContextWindowCompactDemoData();
    const { container, rerender, getByTestId } = render(<ContextWindowCompact data={data} />);
    expect(container.querySelector('[data-slot="badge-icon"]')).toBeNull();
    rerender(<compactBlock.ContextWindowCompact data={data} />);
    expect(container.querySelector('[data-slot="badge-icon"] svg')).toBeTruthy();
    rerender(<ContextWindowCompact data={data} embedded modelIcon={<span data-testid="provider">M</span>} />);
    expect(getByTestId("provider")).toBeTruthy();
    expect(container.querySelector('[data-slot="container"]')).toBeNull();
  });
});
