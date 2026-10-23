// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CreditTopUp } from "@zeron/blocks/credit-top-up-01";
import { createCreditTopUpDemoData } from "../packages/blocks/src/application/credit-top-up-01/credit-top-up-demo-data";
import { creditTopUpCoverage, creditTopUpSummary, validateCreditTopUpData } from "../packages/blocks/src/application/credit-top-up-01/credit-top-up-data";

vi.mock("../packages/blocks/src/application/credit-top-up-01/credit-top-up-chart", () => ({ CreditTopUpChart: () => null }));
beforeEach(() => {
  window.matchMedia = () => ({ matches: true, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList;
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("credit top-up data", () => {
  it("keeps recent activity separate from monthly allocation and forecasts from the snapshot", () => {
    const data = createCreditTopUpDemoData();
    expect(validateCreditTopUpData(data)).toBe(true);
    const summary = creditTopUpSummary(data);
    expect(summary).toMatchObject({ used: 1321, remaining: 679, runsOutBeforeReset: true });
    expect(new Date(summary.runsOutAt!).toISOString().slice(0, 10)).toBe("2026-10-30");
    expect(data.usage.map(item => item.recentCredits)).toEqual([270, 216, 102]);
    expect(data.packages.map(item => creditTopUpCoverage(item.credits, data)?.days)).toEqual([6, 12, 30]);
    expect(creditTopUpCoverage(1000, data)?.pastReset).toBe(true);
  });

  it("handles idle, exhausted and sufficient balances without inventing an exhaustion date", () => {
    const data = createCreditTopUpDemoData();
    expect(creditTopUpSummary({ ...data, averageDailyUsage: 0 }).runsOutAt).toBeNull();
    expect(creditTopUpCoverage(500, { ...data, averageDailyUsage: 0 })).toBeNull();
    expect(creditTopUpSummary({ ...data, totalCredits: 100 }).remaining).toBe(0);
    expect(creditTopUpSummary({ ...data, totalCredits: 10000 }).runsOutBeforeReset).toBe(false);
  });

  it("rejects corrupt usage, duplicate ids and invalid packages", () => {
    const data = createCreditTopUpDemoData();
    expect(validateCreditTopUpData({ ...data, usage: [...data.usage, data.usage[0]] })).toBe(false);
    expect(validateCreditTopUpData({ ...data, resetsAt: NaN })).toBe(false);
    expect(validateCreditTopUpData({ ...data, usage: [{ ...data.usage[0], history: [{ label: "Thu", value: NaN }] }] })).toBe(false);
    expect(validateCreditTopUpData({ ...data, packages: [{ ...data.packages[0], price: -1 }] })).toBe(false);
  });

  it("retains sub-day coverage and omits non-finite estimates", () => {
    const data = createCreditTopUpDemoData();
    expect(creditTopUpCoverage(42, data)?.days).toBe(0.5);
    expect(creditTopUpCoverage(500, { ...data, averageDailyUsage: Number.MIN_VALUE })).toBeNull();
  });
});

describe("credit top-up interaction", () => {
  it("updates an uncontrolled package selection and confirms the exact host quote", async () => {
    const data = createCreditTopUpDemoData();
    const confirm = vi.fn();
    const change = vi.fn();
    render(<CreditTopUp data={data} defaultPackageId="standard" onConfirm={confirm} onPackageChange={change} />);
    fireEvent.click(screen.getByRole("radio", { name: /2,500 credits/ }));
    expect(change).toHaveBeenCalledWith("plus");
    fireEvent.click(screen.getByRole("button", { name: "Add 2,500 · $45" }));
    await waitFor(() => expect(confirm).toHaveBeenCalledWith(data.packages[2]));
  });

  it("retains a controlled selection until the host updates it and blocks stale ids", () => {
    const data = createCreditTopUpDemoData();
    const change = vi.fn();
    const { rerender } = render(<CreditTopUp data={data} packageId="standard" onPackageChange={change} onConfirm={vi.fn()} />);
    fireEvent.click(screen.getByRole("radio", { name: /^500 credits/ }));
    expect(change).toHaveBeenCalledWith("starter");
    expect(screen.getByRole("button", { name: "Add 1,000 · $20" })).toBeTruthy();
    rerender(<CreditTopUp data={data} packageId="removed" onConfirm={vi.fn()} />);
    expect((screen.getByRole("button", { name: "Select a package" }) as HTMLButtonElement).disabled).toBe(true);
  });

  it("locks duplicate submissions and recovers after a rejected checkout", async () => {
    let reject!: (reason: Error) => void;
    const confirm = vi.fn(() => new Promise<void>((_resolve, fail) => { reject = fail; }));
    render(<CreditTopUp data={createCreditTopUpDemoData()} defaultPackageId="standard" onConfirm={confirm} onCancel={vi.fn()} />);
    const submit = screen.getByRole("button", { name: "Add 1,000 · $20" });
    fireEvent.click(submit); fireEvent.click(submit);
    expect(confirm).toHaveBeenCalledTimes(1);
    expect((submit as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "Cancel" }) as HTMLButtonElement).disabled).toBe(true);
    await act(async () => reject(new Error("failure")));
    expect(screen.getByRole("alert").textContent).toContain("Could not continue");
    expect((submit as HTMLButtonElement).disabled).toBe(false);
  });

  it("disables unavailable actions and shows empty, invalid and loading states", () => {
    const data = createCreditTopUpDemoData();
    const { rerender } = render(<CreditTopUp data={data} />);
    expect((screen.getByRole("button", { name: "Add 500 · $10" }) as HTMLButtonElement).disabled).toBe(true);
    rerender(<CreditTopUp data={{ ...data, usage: [], packages: [] }} onConfirm={vi.fn()} />);
    expect(screen.getByText("No recent activity.")).toBeTruthy();
    expect(screen.getByText("No credit packages available.")).toBeTruthy();
    rerender(<CreditTopUp data={{ ...data, totalCredits: NaN }} onConfirm={vi.fn()} />);
    expect(screen.getByRole("alert").textContent).toContain("invalid");
    rerender(<CreditTopUp data={data} state="loading" onConfirm={vi.fn()} />);
    expect(screen.getByRole("status").textContent).toContain("Loading credit usage");
    expect(screen.queryByRole("radio")).toBeNull();
  });

  it("preserves fractional prices and delegates cancellation", () => {
    const data = createCreditTopUpDemoData();
    const cancel = vi.fn();
    render(<CreditTopUp data={{ ...data, packages: [{ ...data.packages[0], price: 10.75 }] }} onConfirm={vi.fn()} onCancel={cancel} locale="invalid-locale!" timeZone="invalid-zone" />);
    expect(screen.getByRole("button", { name: "Add 500 · $10.75" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(cancel).toHaveBeenCalledOnce();
  });

  it("selects the first available package when an initially empty payload finishes loading", () => {
    const data = createCreditTopUpDemoData();
    const confirm = vi.fn();
    const { rerender } = render(<CreditTopUp data={{ ...data, packages: [] }} state="loading" onConfirm={confirm} />);
    rerender(<CreditTopUp data={data} onConfirm={confirm} />);
    expect(screen.getByRole("radio", { name: /^500 credits/ }).getAttribute("aria-checked")).toBe("true");
    expect((screen.getByRole("button", { name: "Add 500 · $10" }) as HTMLButtonElement).disabled).toBe(false);
    rerender(<CreditTopUp data={{ ...data, packages: [...data.packages].reverse() }} onConfirm={confirm} />);
    expect(screen.getByRole("radio", { name: /^500 credits/ }).getAttribute("aria-checked")).toBe("true");
  });

  it("clears checkout errors when the host changes the controlled package", async () => {
    const data = createCreditTopUpDemoData();
    const confirm = vi.fn().mockRejectedValue(new Error("failed"));
    const { rerender } = render(<CreditTopUp data={data} packageId="standard" onConfirm={confirm} />);
    fireEvent.click(screen.getByRole("button", { name: "Add 1,000 · $20" }));
    await screen.findByRole("alert");
    rerender(<CreditTopUp data={data} packageId="starter" onConfirm={confirm} />);
    expect(screen.queryByRole("alert")).toBeNull();
    rerender(<CreditTopUp data={data} packageId="standard" onConfirm={confirm} />);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it.each([false, true])("ignores an old request after changing packages, including switching back (%s)", async returnToInitial => {
    const data = createCreditTopUpDemoData();
    let reject!: (error: Error) => void;
    const confirm = vi.fn(() => new Promise<void>((_resolve, fail) => { reject = fail; }));
    const { rerender } = render(<CreditTopUp data={data} packageId="standard" onConfirm={confirm} />);
    fireEvent.click(screen.getByRole("button", { name: "Add 1,000 · $20" }));
    rerender(<CreditTopUp data={data} packageId="starter" onConfirm={confirm} />);
    if (returnToInitial) rerender(<CreditTopUp data={data} packageId="standard" onConfirm={confirm} />);
    await act(async () => reject(new Error("old request")));
    expect(screen.queryByRole("alert")).toBeNull();
    expect((screen.getByRole("button", { name: returnToInitial ? "Add 1,000 · $20" : "Add 500 · $10" }) as HTMLButtonElement).disabled).toBe(false);
    expect(confirm).toHaveBeenCalledWith(data.packages[1]);
  });

  it("clears a previous error when the quote changes without changing its package id", async () => {
    const data = createCreditTopUpDemoData();
    const confirm = vi.fn().mockRejectedValue(new Error("failed"));
    const { rerender } = render(<CreditTopUp data={data} packageId="standard" onConfirm={confirm} />);
    fireEvent.click(screen.getByRole("button", { name: "Add 1,000 · $20" }));
    await screen.findByRole("alert");
    rerender(<CreditTopUp data={{ ...data, packages: data.packages.map(item => item.id === "standard" ? { ...item, price: 25 } : item) }} packageId="standard" onConfirm={confirm} />);
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("button", { name: "Add 1,000 · $25" })).toBeTruthy();
  });

  it("preserves a valid locale when only the requested time zone is invalid", () => {
    const data = createCreditTopUpDemoData();
    const amount = new Intl.NumberFormat("de-DE", { style: "currency", currency: "USD" }).format(10.75);
    render(<CreditTopUp data={{ ...data, packages: [{ ...data.packages[0], price: 10.75 }] }} locale="de-DE" timeZone="invalid-zone" onConfirm={vi.fn()} />);
    expect(screen.getByRole("button", { name: `Add 500 · ${amount}` })).toBeTruthy();
  });

  it("shows the host quote without rounding away sub-cent precision", () => {
    const data = createCreditTopUpDemoData();
    render(<CreditTopUp data={{ ...data, packages: [{ ...data.packages[0], price: 0.005 }] }} onConfirm={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Add 500 · $0.005" })).toBeTruthy();
  });

  it("describes packages covering less than one day without rounding up to a full day", () => {
    const data = createCreditTopUpDemoData();
    render(<CreditTopUp data={{ ...data, averageDailyUsage: 2000 }} onConfirm={vi.fn()} />);
    expect(screen.getByRole("radio", { name: /^500 credits Less than a day/ })).toBeTruthy();
  });

  it("keeps the remaining-balance legend distinct from a host category named remaining", () => {
    const data = createCreditTopUpDemoData();
    const { container } = render(<CreditTopUp data={{ ...data, usage: data.usage.map((item, index) => index === 0 ? { ...item, id: "remaining" } : item) }} onConfirm={vi.fn()} />);
    const ids = [...container.querySelectorAll('[data-slot="chart-legend"] li')].map(item => item.getAttribute("data-series"));
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
  });
});
