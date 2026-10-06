// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TransactionDetails } from "../packages/blocks/src/application/transaction-details-01/transaction-details";
import { transactionDetailsDemoData as data } from "../packages/blocks/src/application/transaction-details-01/transaction-details-demo-data";
import type { TransactionStatus, TransactionType } from "../packages/blocks/src/application/transaction-details-01/transaction-details-types";

beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn((query: string) => ({ matches: false, media: query, onchange: null, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn() })) });
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: vi.fn().mockResolvedValue(undefined) } });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const base = { transactionId: data.id, data, locale: "en-US", timeZone: "America/New_York" };
function deferred() {
  let resolve!: () => void; let reject!: (error: Error) => void;
  const promise = new Promise<void>((done, fail) => { resolve = done; reject = fail; });
  return { promise, resolve, reject };
}

describe("transaction details", () => {
  it.each(["constructor", "toString", "__proto__", "title", "approved"])("shows unknown instead of interpreting an unexpected enum value: %s", (value) => {
    const { container } = render(<TransactionDetails {...base} data={{ ...data, type: value as TransactionType, status: (value === "approved" ? "title" : value) as TransactionStatus }} />);
    const fields = Array.from(container.querySelectorAll("[data-slot=detail-list-item]"));
    for (const label of ["Transaction type", "Status"]) {
      const field = fields.find((item) => within(item as HTMLElement).queryByText(label))!;
      expect(field.querySelector("[data-slot=detail-list-value]")?.textContent).toBe("—");
    }
  });
  it("uses DetailList for both groups, defaults to expanded billing and hides unavailable actions", () => {
    const { container } = render(<TransactionDetails {...base} />);
    expect(container.querySelectorAll("[data-slot=detail-list]")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Billing information" }).getAttribute("aria-expanded")).toBe("true");
    expect(screen.getByText("842 Pinecrest Drive")).toBeTruthy();
    expect(container.querySelector("[data-slot=transaction-amount]")?.textContent).toBe("$23,000.00");
    expect(screen.queryByRole("button", { name: "Share transaction" })).toBeNull(); expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
  });
  it("supports controlled billing without changing it until the host updates", () => {
    const change = vi.fn();
    const { rerender } = render(<TransactionDetails {...base} billingOpen onBillingOpenChange={change} />);
    fireEvent.click(screen.getByRole("button", { name: "Billing information" }));
    expect(change).toHaveBeenCalledWith(false); expect(screen.getByRole("button", { name: "Billing information" }).getAttribute("aria-expanded")).toBe("true");
    rerender(<TransactionDetails {...base} billingOpen={false} onBillingOpenChange={change} />);
    expect(screen.getByRole("button", { name: "Billing information" }).getAttribute("aria-expanded")).toBe("false");
  });
  it("guards a pending action independently, reports failure and allows retry", async () => {
    const task = deferred(); const receipt = vi.fn().mockReturnValueOnce(task.promise).mockResolvedValue(undefined); const share = vi.fn();
    render(<TransactionDetails {...base} actions={{ onDownloadReceipt: receipt, onShare: share }} />);
    const button = screen.getByRole("button", { name: "Download receipt" });
    fireEvent.click(button); fireEvent.click(button); expect(receipt).toHaveBeenCalledTimes(1);
    expect(receipt).toHaveBeenCalledWith({ transactionId: data.id });
    fireEvent.click(screen.getByRole("button", { name: "Share transaction" })); expect(share).toHaveBeenCalledTimes(1);
    await act(async () => task.reject(new Error("private internal failure")));
    expect(screen.getByText("This action failed. Please try again.")).toBeTruthy();
    fireEvent.click(button); await waitFor(() => expect(receipt).toHaveBeenCalledTimes(2));
  });
  it("drops action feedback and resets local disclosure when the transaction changes", async () => {
    const task = deferred();
    const { rerender } = render(<TransactionDetails {...base} actions={{ onShare: () => task.promise }} />);
    fireEvent.click(screen.getByRole("button", { name: "Share transaction" }));
    fireEvent.click(screen.getByRole("button", { name: "Billing information" }));
    rerender(<TransactionDetails {...base} transactionId="txn-2" data={{ ...data, id: "txn-2" }} />);
    await act(async () => task.reject(new Error("old transaction error")));
    expect(screen.queryByText("This action failed. Please try again.")).toBeNull();
    expect(screen.getByRole("button", { name: "Billing information" }).getAttribute("aria-expanded")).toBe("true");
  });
  it("distinguishes failure, empty, loading and mismatched data, retaining marked stale snapshots", () => {
    const { container, rerender } = render(<TransactionDetails {...base} data={null} state="error" />);
    expect(container.querySelector("[data-slot=alert]")).toBeTruthy();
    rerender(<TransactionDetails {...base} data={null} state="empty" />); expect(screen.getByText("No transaction found")).toBeTruthy();
    rerender(<TransactionDetails {...base} state="loading" />); expect(screen.getByRole("status").textContent).toContain("Loading transaction");
    rerender(<TransactionDetails {...base} transactionId="new-transaction" />); expect(screen.queryByText("INV-1430")).toBeNull();
    rerender(<TransactionDetails {...base} state="error" />); expect(screen.getByText("INV-1430.pdf")).toBeTruthy(); expect(screen.getByText(/Showing the last available transaction/)).toBeTruthy();
    rerender(<TransactionDetails {...base} state="stale" refreshing />); expect(screen.getByText(/out of date/)).toBeTruthy(); expect(screen.getByText(/Refreshing transaction/)).toBeTruthy();
  });
  it("copies the selected invoice and handles clipboard rejection", async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error("Denied"));
    render(<TransactionDetails {...base} />);
    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    fireEvent.click(await screen.findByRole("menuitem", { name: "Copy invoice number" }));
    await waitFor(() => expect(screen.getByText("Unable to copy. Please try again.")).toBeTruthy());
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("INV-1430");
  });
  it("passes stable attachment IDs and falls back when a brand image fails", async () => {
    const open = vi.fn();
    const { container } = render(<TransactionDetails {...base} data={{ ...data, account: { ...data.account!, logoUrl: "/missing-brand.svg" } }} actions={{ onOpenAttachment: open }} />);
    fireEvent.click(screen.getByRole("button", { name: "Open attachment: INV-1430.pdf" }));
    await waitFor(() => expect(open).toHaveBeenCalledWith({ transactionId: data.id, attachmentId: "invoice-1430" }));
    fireEvent.error(container.querySelector('img[src="/missing-brand.svg"]')!);
    expect(container.querySelector('img[src="/missing-brand.svg"]')).toBeNull();
  });
});
