// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FallbackChain, type FallbackAttempt } from "@zeron/blocks/fallback-chain-01";
import { FallbackChainDemo } from "@docs/components/blocks/FallbackChainDemo";

vi.mock("next-intl", () => ({ useLocale: () => "en" }));
vi.mock("../packages/blocks/src/application/fallback-chain-01/fallback-chain.module.css", () => ({ default: {} }));

const primary = { id: "primary", model: "Primary", provider: "Provider A" };
const backup = { id: "backup", model: "Backup", provider: "Provider B" };
const response = { name: "Support thread", text: "Production is healthy again." };

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  vi.stubGlobal("matchMedia", (media: string) => ({ matches: true, media, addEventListener() {}, removeEventListener() {} }));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("Fallback Chain", () => {
  it("renders ordered live attempts and opens independently inspectable model and response details", () => {
    const failed: FallbackAttempt = { ...primary, status: "failed", reason: "Rate limited", durationMs: 1400 };
    const { rerender } = render(<FallbackChain title="Request trace" now={2400} response={response} attempts={[
      failed, { ...backup, status: "trying", startedAt: 2000, costUsd: 0.0002 },
    ]} />);
    const list = screen.getByRole("list", { name: /fallback order/ });
    const [first, second] = within(list).getAllByRole("listitem");
    expect(screen.getByRole("status").textContent).toBe("Attempt 2 of 2");
    expect(within(second).getByText("400ms")).toBeTruthy();
    fireEvent.click(within(first).getByRole("button", { name: /Primary.*Failed.*Rate limited/ }));
    expect(within(screen.getByRole("dialog", { name: "Provider A" })).getByText("Rate limited")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Response: Waiting…" }));
    expect(within(screen.getByRole("dialog", { name: "Support thread" })).queryByText(response.text)).toBeNull();

    rerender(<FallbackChain title="Request trace" response={response} attempts={[
      failed, { ...backup, status: "answered", durationMs: 600, outputTokens: 412 },
    ]} />);
    expect(screen.getByRole("status").textContent).toBe("Answered");
    expect(within(screen.getByRole("dialog", { name: "Support thread" })).getByText(response.text)).toBeTruthy();
  });

  it("omits invalid measurements and makes retry available only when the chain fails", () => {
    const onRetry = vi.fn();
    const invalid = { ...primary, durationMs: NaN, costUsd: Infinity, timeoutMs: -100 };
    const { rerender } = render(<FallbackChain onRetry={onRetry} attempts={[
      { ...invalid, status: "failed" }, { ...backup, status: "skipped" },
    ]} />);
    expect(screen.getByRole("status").textContent).toBe("All attempts failed");
    expect(screen.getByRole("region").textContent).not.toMatch(/NaN|∞|Infinity/);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);

    rerender(<FallbackChain onRetry={onRetry} attempts={[{ ...invalid, status: "skipped" }]} />);
    expect(screen.getByRole("status").textContent).toBe("Not needed");
    expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
  });

  it("keeps the gallery cover on the answered state without starting playback", () => {
    vi.useFakeTimers();
    render(<FallbackChainDemo catalog />);
    expect(screen.getByRole("status").textContent).toBe("Answered");
    expect(screen.queryByRole("button", { name: "Replay" })).toBeNull();
    act(() => vi.advanceTimersByTime(30_000));
    expect(screen.getByRole("status").textContent).toBe("Answered");
  });
});
