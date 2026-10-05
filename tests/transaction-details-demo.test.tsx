// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TransactionDetailsDemo } from "../docs/components/blocks/TransactionDetailsDemo";

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() })) });
  vi.stubGlobal("URL", class extends URL {
    static createObjectURL = vi.fn(() => "blob:demo-invoice");
    static revokeObjectURL = vi.fn();
  });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function renderDemo() {
  return render(<NextIntlClientProvider locale="en" timeZone="UTC" messages={{}}><TransactionDetailsDemo /></NextIntlClientProvider>);
}

describe("transaction details demo", () => {
  it.each(["Share transaction", "Open attachment: INV-1430.pdf", "Download receipt"])("ignores a pending %s after closing and reopening the detail", async (action) => {
    renderDemo();
    fireEvent.click(screen.getByRole("button", { name: action }));
    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    fireEvent.click(screen.getByRole("button", { name: "Reopen transaction details" }));
    await act(async () => { await vi.advanceTimersByTimeAsync(450); });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "Transaction details" })).toBeTruthy();
  });

  it("still opens the share summary when the detail stays open", async () => {
    renderDemo();
    fireEvent.click(screen.getByRole("button", { name: "Share transaction" }));
    await act(async () => { await vi.advanceTimersByTimeAsync(450); });
    expect(screen.getByRole("dialog", { name: "Example transaction summary" })).toBeTruthy();
  });
});
