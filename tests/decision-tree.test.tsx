// @vitest-environment jsdom

import { createRef } from "react";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { DecisionTree, type Decision, type DecisionTreeHandle } from "@zeron/ui/decision-tree";

const release: Decision = {
  id: "release", agent: "Release agent", question: "How should we release?",
  options: [
    { label: "Roll back", pick: true, next: { question: "Who needs an update?", options: [{ label: "Notify the team" }, { label: "Post an update" }] } },
    { label: "Wait" },
  ],
};
const follow: Decision = { ...release, id: "step-two", question: "How should we proceed?" };

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it("commits a complete path once and retries a rejected follow-up without removing the decision", async () => {
  const onChoose = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(undefined);
  render(<DecisionTree decisions={[release, follow]} onChoose={onChoose} allowOther={false} />);
  expect(screen.queryByRole("button", { name: "Other…" })).toBeNull();
  const tree = screen.getByRole("region", { name: "Decisions" });
  fireEvent.keyDown(tree, { key: "1" });
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Notify the team" }));
  expect(onChoose).not.toHaveBeenCalled();

  const leaf = screen.getByRole("button", { name: "Post an update" });
  await act(async () => { fireEvent.click(leaf); });
  expect(screen.getByRole("alert").textContent).toContain("Try again");
  expect(screen.getByText(release.question)).toBeTruthy();

  await act(async () => {
    fireEvent.click(leaf);
    fireEvent.click(leaf);
  });
  expect(onChoose).toHaveBeenCalledTimes(2);
  expect(onChoose).toHaveBeenLastCalledWith(release, {
    index: 0, option: release.options[0], then: { index: 1, option: { label: "Post an update" } },
  });
  await act(async () => { vi.runOnlyPendingTimers(); });
  expect(screen.getByText(follow.question)).toBeTruthy();
});

it("appends new IDs, preserves the active decision and accepts an immediate imperative instruction", async () => {
  const ref = createRef<DecisionTreeHandle>();
  const onChoose = vi.fn().mockResolvedValue("Received.");
  const newest = { ...release, id: "new", question: "What else needs a decision?" };
  const { rerender } = render(<DecisionTree ref={ref} decisions={[release, follow]} onChoose={onChoose} />);
  act(() => ref.current?.next());
  rerender(<DecisionTree ref={ref} decisions={[newest, follow, release]} onChoose={onChoose} />);
  expect(ref.current?.peek()?.id).toBe(follow.id);
  await act(async () => {
    ref.current?.setOther("  Check the release logs  ");
    ref.current?.send();
  });
  expect(onChoose).toHaveBeenCalledExactlyOnceWith(follow, { other: "Check the release logs" });
  expect(screen.getByRole("status").textContent).toContain("Received.");
  await act(async () => { vi.runOnlyPendingTimers(); });
  expect(ref.current?.peek()?.id).toBe(newest.id);
});
