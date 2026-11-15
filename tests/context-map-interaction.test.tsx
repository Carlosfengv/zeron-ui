// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ContextMap, type ContextBlock } from "@zeron/ui/context-map";
import { ContextMapExample } from "@docs/pages/components/context-map/example";
import messages from "@docs/content/en/components/context-map.json";

vi.mock("next-intl", () => ({ useTranslations: () => (key: keyof typeof messages["context-map"]) => messages["context-map"][key] }));

const system: ContextBlock = { id: "system", label: "System prompt", kind: "system", tokens: 100 };
const chat: ContextBlock = { id: "chat", label: "Chat history", kind: "chat", tokens: 800 };
const summary: ContextBlock = { id: "summary", label: "Summary", kind: "summary", tokens: 50 };
const snapshot = { before: [system, chat], summarized: ["chat"], summary: "summary" };

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("uses one panel and preserves a retained tile across externally controlled snapshots", () => {
  const onViewChange = vi.fn();
  const props = { blocks: [system, summary], limit: 1000, compaction: snapshot, onViewChange };
  const { rerender } = render(<ContextMap {...props} view="after" />);
  const panel = screen.getByRole("tabpanel", { name: "After" });
  const retainedTile = within(panel).getByRole("button", { name: /System prompt/ });
  const before = screen.getByRole("tab", { name: "Before" });

  expect(before.getAttribute("aria-controls")).toBe(panel.id);
  fireEvent.click(before);
  expect(onViewChange).toHaveBeenCalledExactlyOnceWith("before");
  expect(before.getAttribute("aria-selected")).toBe("false");

  rerender(<ContextMap {...props} view="before" />);
  expect(screen.getByRole("tabpanel", { name: "Before" })).toBe(panel);
  expect(within(panel).getByRole("button", { name: /System prompt/ })).toBe(retainedTile);
  expect(within(panel).getByRole("button", { name: /Chat history/ })).toBeTruthy();
});

it("returns to the compacted snapshot after replaying from Before", () => {
  vi.useFakeTimers();
  render(<ContextMapExample chinese={false} />);
  const replay = screen.getByRole("button", { name: "Replay updates" });

  fireEvent.click(replay);
  act(() => vi.advanceTimersByTime(5000));
  fireEvent.click(screen.getByRole("tab", { name: "Before" }));
  expect(screen.getByRole("tabpanel", { name: "Before" })).toBeTruthy();

  fireEvent.click(replay);
  act(() => vi.advanceTimersByTime(5000));
  const panel = screen.getByRole("tabpanel", { name: "After" });
  expect(within(panel).getByRole("button", { name: /Summary/ })).toBeTruthy();
});
