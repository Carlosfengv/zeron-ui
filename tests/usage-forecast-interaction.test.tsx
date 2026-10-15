// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { UsageForecast } from "../packages/blocks/src/application/usage-forecast-01/usage-forecast";
import { usageForecastDemoAccounts as accounts, usageForecastDemoNow as now } from "../packages/blocks/src/application/usage-forecast-01/usage-forecast-demo-data";

// Real native charts are exercised in the browser; isolate account/view ownership here.
vi.mock("../packages/blocks/src/application/usage-forecast-01/usage-forecast-charts", () => ({
  UsageForecastTrend: () => null, UsageForecastDaily: () => null,
  ForecastLegendItem: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
  usageForecastHatch: {}, usageForecastColors: { used: "var(--chart-1, var(--brand))", out: "var(--chart-7)" },
}));
afterEach(cleanup);

it("selects an account and keeps it selected when switching views", () => {
  const { container } = render(<UsageForecast accounts={accounts} now={now} />);
  fireEvent.click(screen.getByRole("button", { name: /Copilot/ }));
  expect(container.querySelector('[data-slot="usage-forecast-detail"] h3')?.textContent).toBe("Copilot");
  fireEvent.click(screen.getByRole("tab", { name: "Table" }));
  expect(screen.getByRole("table")).toBeTruthy();
  expect(container.querySelector('[data-slot="usage-forecast-detail"] h3')?.textContent).toBe("Copilot");
  fireEvent.click(screen.getByRole("button", { name: "Used" }));
  expect(screen.getByRole("columnheader", { name: /Used/ }).getAttribute("aria-sort")).toBe("ascending");
  fireEvent.click(screen.getByRole("button", { name: "Used, asc" }));
  expect(screen.getByRole("columnheader", { name: /Used/ }).getAttribute("aria-sort")).toBe("descending");
});

it("emits callbacks without mutating controlled selection or view", () => {
  const onSelect = vi.fn(); const onView = vi.fn(); const onSort = vi.fn();
  const { container, rerender } = render(<UsageForecast accounts={accounts} now={now} selectedAccountId="claude-pro" view="forecast" onAccountSelect={onSelect} onViewChange={onView} />);
  fireEvent.click(screen.getByRole("button", { name: /Copilot/ }));
  expect(onSelect).toHaveBeenCalledWith(accounts[2]);
  expect(container.querySelector('[data-slot="usage-forecast-detail"] h3')?.textContent).toBe("Claude Pro");
  fireEvent.click(screen.getByRole("tab", { name: "Table" }));
  expect(onView).toHaveBeenCalledWith("table");
  expect(screen.getByRole("tab", { name: "Forecast" }).getAttribute("aria-selected")).toBe("true");
  rerender(<UsageForecast accounts={accounts} now={now} view="table" sort={{ key: "used", direction: "asc" }} onSortChange={onSort} />);
  fireEvent.click(screen.getByRole("button", { name: "Used, asc" }));
  expect(onSort).toHaveBeenCalledWith({ key: "used", direction: "desc" });
  expect(screen.getByRole("columnheader", { name: /Used/ }).getAttribute("aria-sort")).toBe("ascending");
});

it("shows unavailable accounts, empty, loading, invalid data and retry states", () => {
  const retry = vi.fn(); const { container, rerender } = render(<UsageForecast accounts={accounts} now={now} />);
  fireEvent.click(screen.getByRole("button", { name: /Antigravity/ }));
  expect(container.querySelector('[data-slot="usage-forecast-detail"]')?.textContent).toContain("Reconnect to forecast");
  rerender(<UsageForecast accounts={[]} now={now} />);
  expect(screen.getByText("No accounts to forecast")).toBeTruthy();
  rerender(<UsageForecast accounts={[]} now={now} state="loading" />);
  expect(screen.getByRole("status").getAttribute("aria-label")).toBe("Loading accounts…");
  rerender(<UsageForecast accounts={[{ ...accounts[0], usedPercent: NaN }]} now={now} onRetry={retry} />);
  expect(screen.getByRole("alert").textContent).toContain("Check account IDs");
  fireEvent.click(screen.getByRole("button", { name: "Try again" })); expect(retry).toHaveBeenCalledOnce();
});

it("does not label unavailable or partially known accounts as all on track", () => {
  const pending = accounts.filter((account) => account.status === "new" || account.status === "disconnected");
  const { rerender } = render(<UsageForecast accounts={pending} now={now} labels={{ pendingSummary: undefined }} />);
  expect(screen.queryByRole("heading", { name: "All accounts on track" })).toBeNull();
  expect(screen.getByText("Some accounts need more usage data or reconnection before they can be forecast.")).toBeTruthy();
  rerender(<UsageForecast accounts={[accounts[2], pending[0]]} now={now} />);
  expect(screen.queryByRole("heading", { name: "All accounts on track" })).toBeNull();
  rerender(<UsageForecast accounts={[accounts[2]]} now={now} />);
  expect(screen.getByRole("heading", { name: "All accounts on track" })).toBeTruthy();
});

it("describes sub-hour reset windows without inflating them to one hour", () => {
  render(<UsageForecast accounts={[{ ...accounts[0], resetsAt: now + 30 * 60_000, dailyRate: 0 }]} now={now} defaultView="table" />);
  expect(screen.getByRole("cell", { name: "in <1 h" })).toBeTruthy();
});
