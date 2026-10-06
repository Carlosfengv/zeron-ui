// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SupportAnalytics } from "../packages/blocks/src/application/support-analytics-01/support-analytics";
import { createSupportAnalyticsDemoData } from "../packages/blocks/src/application/support-analytics-01/support-analytics-demo-data";
import { supportAnalyticsEnglishLabels } from "../packages/blocks/src/application/support-analytics-01/support-analytics-labels";
vi.mock("../packages/blocks/src/application/support-analytics-01/support-analytics-charts", () => ({ TicketTrend: () => null, MetricTrend: () => null }));
beforeEach(() => {
  vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  Object.defineProperty(window, "matchMedia", { configurable: true, value: vi.fn((query: string) => ({ matches: false, media: query, addListener: vi.fn(), removeListener: vi.fn(), addEventListener: vi.fn(), removeEventListener: vi.fn() })) });
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const query = { range: "this-week", channel: "live-chat" } as const;
const data = createSupportAnalyticsDemoData(query);
const base = { scopeId: "support-demo", data, ...query, locale: "en", labels: supportAnalyticsEnglishLabels, onRangeChange: vi.fn(), onChannelChange: vi.fn() };
function deferred() { let resolve!: () => void; let reject!: (error: Error) => void; const promise = new Promise<void>((done, fail) => { resolve = done; reject = fail; }); return { promise, resolve, reject }; }

describe("support analytics interactions", () => {
  it("keeps two instances and their disclosures independent", async () => {
    const { container } = render(<><SupportAnalytics {...base} /><SupportAnalytics {...base} /></>);
    const [first, second] = Array.from(container.querySelectorAll('[data-block="support-analytics"]'));
    fireEvent.click(within(first as HTMLElement).getByRole("tab", { name: /Resolved\s*349/ }));
    fireEvent.click(within(first as HTMLElement).getByRole("button", { name: /Recent tickets/ }));
    await waitFor(() => expect(within(first as HTMLElement).getAllByText("Reopened").length).toBeGreaterThan(0));
    expect(within(second as HTMLElement).queryByText("Reopened")).toBeNull();
    expect(within(first as HTMLElement).getByRole("button", { name: /Recent tickets/ }).getAttribute("aria-expanded")).toBe("true");
    expect(within(second as HTMLElement).getByRole("button", { name: /Recent tickets/ }).getAttribute("aria-expanded")).toBe("false");
  });
  it("switches metric models and preserves channel totals", async () => {
    render(<SupportAnalytics {...base} />);
    expect(screen.getByText("396", { selector: ".sr-only" })).toBeTruthy(); expect(screen.getAllByText("First-contact resolution").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("tab", { name: /Resolved\s*349/ }));
    await waitFor(() => expect(screen.getAllByText("Reopened").length).toBeGreaterThan(0));
    expect(screen.getByText("396", { selector: ".sr-only" })).toBeTruthy();
    fireEvent.click(screen.getByRole("tab", { name: /Open\s*47/ }));
    await waitFor(() => expect(screen.getAllByText("Current wait time").length).toBeGreaterThan(0));
  });
  it("notifies a controlled channel without faking a new snapshot", () => {
    const change = vi.fn(); render(<SupportAnalytics {...base} onChannelChange={change} />);
    const email = screen.getByRole("button", { name: "Email" });
    expect(email.getAttribute("aria-pressed")).toBe("false");
    expect(screen.getByRole("button", { name: "Live chat" }).getAttribute("aria-pressed")).toBe("true");
    fireEvent.click(email);
    expect(change).toHaveBeenCalledWith("email"); expect(screen.getByText("396", { selector: ".sr-only" })).toBeTruthy();
    change.mockClear();
    fireEvent.keyDown(email, { key: "Enter" });
    expect(change).toHaveBeenCalledWith("email");
    change.mockClear();
    fireEvent.keyDown(email, { key: " " });
    expect(change).toHaveBeenCalledWith("email");
  });
  it("isolates mismatched data, initial failures and retained refresh failures", () => {
    const { container, rerender } = render(<SupportAnalytics {...base} channel="email" />);
    expect(screen.queryByText("396")).toBeNull(); expect(screen.getByRole("status").textContent).toContain("Loading");
    rerender(<SupportAnalytics {...base} data={null} state="error" />); expect(container.querySelector('[data-slot="alert"]')).toBeTruthy();
    rerender(<SupportAnalytics {...base} state="error" retainDataOnError />); expect(screen.getByText("396", { selector: ".sr-only" })).toBeTruthy(); expect(screen.getByText(/out-of-date/)).toBeTruthy();
  });
  it("keeps controlled disclosure and hides absent actions", () => {
    const change = vi.fn(); render(<SupportAnalytics {...base} ticketsExpanded={false} onTicketsExpandedChange={change} />);
    const toggle = screen.getByRole("button", { name: /Recent tickets/ }); fireEvent.click(toggle);
    expect(change).toHaveBeenCalledWith(true); expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("button", { name: "Open ticket queue" })).toBeNull();
  });
  it("prevents duplicate actions, reports failures, retries and passes the clicked context", async () => {
    const task = deferred(); const refresh = vi.fn().mockReturnValueOnce(task.promise).mockResolvedValue(undefined);
    render(<SupportAnalytics {...base} actions={{ onRefresh: refresh }} />);
    const button = screen.getByRole("button", { name: "Refresh" }); fireEvent.click(button); fireEvent.click(button);
    expect(refresh).toHaveBeenCalledTimes(1); expect(refresh).toHaveBeenCalledWith(expect.objectContaining({ snapshotId: data.id, revision: "0", ...query, view: "all" }));
    await act(async () => task.reject(new Error("internal details"))); expect(screen.getByText("This action failed. Please try again.")).toBeTruthy();
    fireEvent.click(button); await waitFor(() => expect(refresh).toHaveBeenCalledTimes(2));
  });
  it("drops old feedback even when the query changes away and back", async () => {
    const task = deferred(); const refresh = vi.fn().mockReturnValueOnce(task.promise).mockResolvedValue(undefined);
    const { rerender } = render(<SupportAnalytics {...base} actions={{ onRefresh: refresh }} />);
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    rerender(<SupportAnalytics {...base} channel="email" data={createSupportAnalyticsDemoData({ ...query, channel: "email" })} actions={{ onRefresh: refresh }} />);
    rerender(<SupportAnalytics {...base} actions={{ onRefresh: refresh }} />);
    await act(async () => task.reject(new Error("obsolete failure")));
    expect(screen.queryByText("This action failed. Please try again.")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Refresh" })); await waitFor(() => expect(refresh).toHaveBeenCalledTimes(2));
  });
  it("clears existing action failures when the host confirms a new revision", async () => {
    const refresh = vi.fn().mockRejectedValue(new Error("failed"));
    const { rerender } = render(<SupportAnalytics {...base} actions={{ onRefresh: refresh }} />);
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    await screen.findByRole("alert");
    rerender(<SupportAnalytics {...base} data={{ ...data, revision: "1" }} actions={{ onRefresh: refresh }} />);
    expect(screen.queryByRole("alert")).toBeNull();
  });
  it("isolates pending actions when a different snapshot reuses the same revision", async () => {
    const old = deferred(); const current = deferred();
    const refresh = vi.fn().mockReturnValueOnce(old.promise).mockReturnValueOnce(current.promise);
    const { rerender } = render(<SupportAnalytics {...base} actions={{ onRefresh: refresh }} />);
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    rerender(<SupportAnalytics {...base} data={{ ...data, id: "replacement", revision: "0" }} actions={{ onRefresh: refresh }} />);
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(refresh).toHaveBeenCalledTimes(2);
    await act(async () => old.reject(new Error("obsolete failure")));
    expect(screen.queryByRole("alert")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(refresh).toHaveBeenCalledTimes(2);
    await act(async () => current.resolve());
  });
  it("shows an unknown comparison when a ratio's previous value is outside its domain", () => {
    const metric = { ...data.views.all!.metrics.find((item) => item.id === "first-contact")!, previousValue: 1.2 };
    render(<SupportAnalytics {...base} data={{ ...data, views: { all: { ...data.views.all!, metrics: [metric] } } }} />);
    const table = screen.getAllByRole("table")[0];
    const row = within(table).getAllByRole("row")[1];
    expect(within(row).getAllByRole("cell")[3].textContent).toBe("—");
  });
  it("does not mark a ticket resolved until the host confirms its new snapshot", async () => {
    const task = deferred(); const resolve = vi.fn().mockReturnValue(task.promise);
    const ticket = data.views.all!.recentTickets[0];
    const { rerender } = render(<SupportAnalytics {...base} defaultTicketsExpanded actions={{ onResolveTicket: resolve }} />);
    fireEvent.click(screen.getByRole("button", { name: `More actions · ${ticket.number}` }));
    const item = await screen.findByRole("menuitem", { name: "Mark as resolved" });
    fireEvent.click(item); fireEvent.click(item);
    expect(resolve).toHaveBeenCalledTimes(1); expect(resolve).toHaveBeenCalledWith(expect.objectContaining({ ticketId: ticket.id, revision: "0" }));
    await act(async () => task.resolve());
    expect(screen.getByRole("tab", { name: /Open\s*47/ })).toBeTruthy();
    rerender(<SupportAnalytics {...base} data={createSupportAnalyticsDemoData(query, { resolvedTicketIds: [ticket.id], revision: 1 })} defaultTicketsExpanded actions={{ onResolveTicket: resolve }} />);
    expect(screen.getByRole("tab", { name: /Open\s*46/ })).toBeTruthy(); expect(screen.getByRole("tab", { name: /Resolved\s*350/ })).toBeTruthy();
    expect(screen.getByText("396", { selector: ".sr-only" })).toBeTruthy();
  });
});
