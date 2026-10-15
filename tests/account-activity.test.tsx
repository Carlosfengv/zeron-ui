// @vitest-environment jsdom
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccountActivity } from "../packages/blocks/src/application/account-activity-01/account-activity";
import { createActivityCalendar, DAY, HOUR } from "../packages/blocks/src/application/account-activity-01/account-activity-data";
import type { AccountActivityData, AccountActivityQuery } from "../packages/blocks/src/application/account-activity-01/account-activity-types";

vi.mock("motion/react", async original => ({ ...await original<typeof import("motion/react")>(), useReducedMotion: () => true }));
beforeEach(() => {
  vi.useFakeTimers();
  Object.defineProperty(SVGElement.prototype, "getTotalLength", { configurable: true, value: () => 100 });
  Object.defineProperty(SVGElement.prototype, "getPointAtLength", { configurable: true, value: () => ({ x: 0, y: 0 }) });
  window.matchMedia = () => ({ matches: true, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} }) as unknown as MediaQueryList;
  vi.stubGlobal("ResizeObserver", class {
    constructor(private callback: ResizeObserverCallback) {}
    observe(target: Element) { this.callback([{ target, contentRect: { width: 600, height: 300 } } as unknown as ResizeObserverEntry], this as unknown as ResizeObserver); }
    unobserve() {} disconnect() {}
  });
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.unstubAllGlobals(); Reflect.deleteProperty(SVGElement.prototype, "getTotalLength"); Reflect.deleteProperty(SVGElement.prototype, "getPointAtLength"); });
async function settle() { await act(async () => { vi.advanceTimersByTime(200); }); }
const start = Date.UTC(2026, 9, 1);
const empty: AccountActivityData = { start, end: start + DAY, accounts: [{ id: "a", name: "A" }], samples: [], events: [], windows: [] };
const data = { ...empty, samples: [{ accountId: "a", timestamp: start + 10 * HOUR, value: 5 }] };

describe("account activity integration", () => {
  it("switches local views and emits the full query", async () => {
    const change = vi.fn();
    const view = render(<AccountActivity data={data} onQueryChange={change} />);
    await settle();
    fireEvent.click(view.getByRole("tab", { name: "Weeks" }));
    await settle();
    expect(view.getByRole("tab", { name: "Weeks" }).getAttribute("aria-selected")).toBe("true");
    expect(change).toHaveBeenLastCalledWith(expect.objectContaining({ view: "weeks", accountId: "all" }));
    expect(view.container.querySelector('[data-slot="area-chart"]')).toBeTruthy();
  });
  it("keeps controlled state with the host and supports retry and missing readings", async () => {
    const change = vi.fn(), retry = vi.fn();
    const query: AccountActivityQuery = { view: "matrix", accountId: "all", dayType: "all", range: { start, end: start + DAY }, hiddenAccountIds: [] };
    const view = render(<AccountActivity data={empty} query={query} onQueryChange={change} />);
    fireEvent.click(view.getByRole("tab", { name: "Weeks" }));
    expect(change).toHaveBeenCalledWith({ ...query, view: "weeks" });
    expect(view.container.querySelector("section")?.dataset.view).toBe("matrix");
    expect(view.getByRole("status").textContent).toBe("No activity readings in this selection.");
    view.rerender(<AccountActivity data={empty} state="error" onRetry={retry} errorMessage="Disconnected" />);
    fireEvent.click(view.getByRole("button", { name: "Try again" }));
    expect(retry).toHaveBeenCalledOnce();
    expect(view.getByRole("alert").textContent).toContain("Disconnected");
    view.rerender(<AccountActivity data={empty} state="loading" />);
    expect(view.getByRole("status").textContent).toBe("Loading account activity…");
    expect(view.getByRole("heading").textContent).toBe("Loading account activity…");
    expect(view.queryByText(/0 run-outs/)).toBeNull();
    await settle();
  });
  it("handles invalid periods and keeps an observed zero distinct from missing data", async () => {
    const view = render(<AccountActivity data={{ ...empty, end: NaN }} defaultQuery={{ view: "range" }} />);
    expect(view.getByRole("alert").textContent).toContain("could not be loaded");
    view.rerender(<AccountActivity data={{ ...data, samples: data.samples.map((sample) => ({ ...sample, value: 0 })) }} query={{ view: "weeks", accountId: "all", dayType: "all", range: { start, end: start + DAY }, hiddenAccountIds: [] }} />);
    await settle();
    expect(view.getByRole("heading").textContent).toBe("Quiet");
    expect(view.getByText("Peak 0")).toBeTruthy();
  });

  it("identifies an active weekend when weekdays are observed but idle", async () => {
    const friday = Date.UTC(2026, 9, 9);
    const view = render(<AccountActivity data={{ ...empty, start: friday, end: friday + 2 * DAY, samples: [
      { accountId: "a", timestamp: friday + 10 * HOUR, value: 0 },
      ...[10, 11, 12].map(hour => ({ accountId: "a", timestamp: friday + DAY + hour * HOUR, value: 5 })),
    ] }} />);
    await settle();
    expect(view.getByRole("heading").textContent).toBe("Busiest 10:00–13:00 · Weekends");
  });

  it("does not append an empty week at a local Monday exclusive endpoint", async () => {
    const monday = Date.UTC(2026, 9, 5, 7); // Monday 00:00 in Los Angeles.
    const view = render(<AccountActivity timeZone="America/Los_Angeles" defaultQuery={{ view: "weeks" }}
      data={{ ...data, start: monday, end: monday + 7 * DAY, samples: [{ accountId: "a", timestamp: monday + 10 * HOUR, value: 1 }] }} />);
    await settle();
    expect(view.container.querySelectorAll('[data-slot="area-chart"]')).toHaveLength(2); // Typical week + one observed week.
  });

  it("shows a carried lock without inventing a weekend run-out marker", async () => {
    const friday = Date.UTC(2026, 9, 9);
    const view = render(<AccountActivity defaultQuery={{ view: "weeks", dayType: "weekends" }}
      data={{ ...empty, start: friday, end: friday + 2 * DAY,
        samples: [{ accountId: "a", timestamp: friday + DAY + 10 * HOUR, value: 1 }],
        events: [{ id: "overnight", accountId: "a", timestamp: friday + 22 * HOUR, unlockedAt: friday + DAY + 2 * HOUR }],
      }} />);
    await settle();
    expect(view.getByText("0 run-outs · Locked 2 h")).toBeTruthy();
    expect(view.container.querySelectorAll('[data-slot="account-activity-run-out"]')).toHaveLength(0);
    expect(view.container.querySelectorAll('[data-slot="account-activity-lock"]')).toHaveLength(1);
  });

  it("keeps account tooltip identities when synthetic row dates cross a month", async () => {
    const accounts = Array.from({ length: 22 }, (_, index) => ({ id: String(index), name: `Account ${index + 1}` }));
    const view = render(<AccountActivity defaultQuery={{ view: "accounts" }} data={{ ...empty, accounts,
      samples: accounts.map(account => ({ accountId: account.id, timestamp: start + 10 * HOUR, value: 1 })),
    }} />);
    await settle();
    fireEvent.keyDown(view.getByRole("group", { name: /Heatmap/ }), { key: "End" });
    await settle();
    expect(view.getAllByText("Account 22")).toHaveLength(2); // Row label + tooltip heading.
  });

  it("marks locks in the final hour of a 25-hour day", async () => {
    const calendar = createActivityCalendar("America/Los_Angeles", "en-US");
    const a = calendar.fromCalendar("2026-11-01"), b = calendar.fromCalendar("2026-11-02");
    const view = render(<AccountActivity timeZone="America/Los_Angeles" data={{ ...empty, start: a, end: b,
      samples: [{ accountId: "a", timestamp: a + 10 * HOUR, value: 1 }],
      events: [{ id: "late", accountId: "a", timestamp: b - HOUR / 2, unlockedAt: b }],
    }} />);
    await settle();
    expect(view.container.querySelector('[data-slot="heatmap-matrix-column-lock"]')?.getAttribute("style")).toContain("--chart-7");
  });

  it("maps range endpoint inputs to local calendar days across daylight savings", async () => {
    const calendar = createActivityCalendar("America/Los_Angeles", "en-US");
    const a = calendar.fromCalendar("2026-11-01"), b = calendar.fromCalendar("2026-11-04");
    const change = vi.fn();
    const view = render(<AccountActivity timeZone="America/Los_Angeles" onQueryChange={change}
      defaultQuery={{ view: "range", range: { start: a, end: b } }} data={{ ...empty, start: a, end: b,
        samples: [{ accountId: "a", timestamp: a + 10 * HOUR, value: 1 }],
      }} />);
    await settle();
    const sliders = view.getAllByRole("slider");
    expect(sliders[0].getAttribute("max")).toBe("3");
    fireEvent.change(sliders[0], { target: { value: "1" } });
    await settle();
    expect(change).toHaveBeenLastCalledWith(expect.objectContaining({ range: { start: calendar.fromCalendar("2026-11-02"), end: b } }));
  });

  it("normalizes fractional account intensities against that account's observed peak", async () => {
    const view = render(<AccountActivity defaultQuery={{ view: "accounts" }} data={{ ...empty,
      samples: [{ accountId: "a", timestamp: start + 10 * HOUR, value: .25 }],
    }} />);
    await settle();
    expect(view.container.querySelector('rect[data-slot="heatmap-cell"][fill="var(--chart-1)"]')).toBeTruthy();
    fireEvent.keyDown(view.getByRole("group", { name: /Heatmap/ }), { key: "Home" });
    await settle();
    expect(view.getByText("10:00 · 0.3")).toBeTruthy();
  });
});
