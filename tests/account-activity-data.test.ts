import { describe, expect, it } from "vitest";
import { activityDays, busiestActivity, clampActivityRange, clippedLockedHours, createActivityCalendar, DAY, HOUR, profile, selectActivity, selectionLockedHours } from "../packages/blocks/src/application/account-activity-01/account-activity-data";
import type { AccountActivityData, AccountActivityQuery } from "../packages/blocks/src/application/account-activity-01/account-activity-types";

const start = Date.UTC(2026, 9, 9); // Friday
const data: AccountActivityData = {
  start, end: start + 2 * DAY, accounts: [{ id: "a", name: "A" }, { id: "b", name: "B" }], windows: [],
  samples: [
    { accountId: "a", timestamp: start + 10 * HOUR, value: 3 },
    { accountId: "a", timestamp: start + 10 * HOUR + 60_000, value: 4 },
    { accountId: "b", timestamp: start + 10 * HOUR, value: 0 },
    { accountId: "a", timestamp: start + 11 * HOUR, value: null },
    { accountId: "a", timestamp: start + DAY + 10 * HOUR, value: 5 },
    { accountId: "b", timestamp: start + DAY + 10 * HOUR, value: 6 },
  ],
  events: [
    { id: "one", accountId: "a", timestamp: start - HOUR, unlockedAt: start + 2 * HOUR },
    { id: "two", accountId: "a", timestamp: start + HOUR, unlockedAt: start + 3 * HOUR },
    { id: "three", accountId: "b", timestamp: start + HOUR, unlockedAt: start + 3 * HOUR },
  ],
};
const calendar = createActivityCalendar("UTC", "en-US");
const query: AccountActivityQuery = { view: "matrix", accountId: "all", dayType: "all", range: { start, end: data.end }, hiddenAccountIds: [] };

describe("account activity aggregation", () => {
  it("counts an account once per observed hour and preserves idle vs missing", () => {
    const result = selectActivity(data, query, calendar);
    expect(result.hours.map((hour) => hour.active)).toEqual([1, 2]);
    expect(profile(result)[10]).toMatchObject({ weekday: 1, weekend: 2 });
    expect(profile(result)[11]).toMatchObject({ weekday: null, weekend: null });
  });
  it("applies account, day and visibility filters without mutating the input", () => {
    const before = JSON.stringify(data);
    const result = selectActivity(data, { ...query, dayType: "weekends", hiddenAccountIds: ["b"] }, calendar);
    expect(result.accounts.map((account) => account.id)).toEqual(["a"]);
    expect(result.hours.map((hour) => hour.active)).toEqual([1]);
    expect(selectActivity(data, { ...query, accountId: "b" }, calendar).hours.map((hour) => hour.active)).toEqual([0, 1]);
    expect(JSON.stringify(data)).toBe(before);
  });
  it("clips range endpoints and retains locks that began before the range", () => {
    const result = selectActivity(data, { ...query, view: "range", range: { start, end: start + HOUR } }, calendar, true);
    expect(result.events).toHaveLength(0);
    expect(result.locks.map((event) => event.id)).toEqual(["one"]);
    expect(clippedLockedHours(data.events, start, start + 3 * HOUR)).toBe(5);
  });
  it("uses the reporting timezone at weekday boundaries", () => {
    const shanghai = createActivityCalendar("Asia/Shanghai", "zh-CN");
    expect(shanghai.parts(start + 20 * HOUR)).toEqual({ date: "2026-10-10", hour: 4, weekday: 5 });
    expect(activityDays({ ...data, start: start + 20 * HOUR, end: start + DAY }, shanghai)).toHaveLength(1);
  });
  it("ignores non-finite and negative readings instead of turning them into idle hours", () => {
    const result = selectActivity({ ...data, samples: [{ accountId: "a", timestamp: start, value: NaN }, { accountId: "b", timestamp: start, value: -1 }] }, query, calendar);
    expect(result.hours).toEqual([]);
  });
  it("counts only selected weekdays within a lock spanning midnight", () => {
    const spanning = { ...data, events: [{ id: "overnight", accountId: "a", timestamp: start + 22 * HOUR, unlockedAt: start + DAY + 2 * HOUR }] };
    const result = selectActivity(spanning, { ...query, dayType: "weekends" }, calendar);
    expect(selectionLockedHours(result)).toBe(2);
  });
  it("resolves reporting dates across daylight savings and partial-hour offsets", () => {
    const la = createActivityCalendar("America/Los_Angeles", "en-US");
    expect(la.fromCalendar("2026-11-02") - la.fromCalendar("2026-11-01")).toBe(25 * HOUR);
    const india = createActivityCalendar("Asia/Kolkata", "en-US");
    expect(india.fromCalendar("2026-10-10")).toBe(Date.UTC(2026, 9, 9, 18, 30));
    expect(india.coordinate(Date.UTC(2026, 9, 9, 18, 45))).toBe(Date.UTC(2026, 9, 10, 0, 15));
  });
  it("uses real calendar boundaries for 23- and 25-hour days and exclusive endpoints", () => {
    const la = createActivityCalendar("America/Los_Angeles", "en-US");
    for (const [date, next, duration] of [["2026-03-08", "2026-03-09", 23], ["2026-11-01", "2026-11-02", 25]] as const) {
      const days = activityDays({ start: la.fromCalendar(date) + HOUR, end: la.fromCalendar(next) }, la);
      expect(days).toHaveLength(1);
      expect(days[0].date).toBe(date);
      expect(days[0].end - days[0].timestamp).toBe(duration * HOUR);
    }
    expect(activityDays({ start, end: start }, la)).toEqual([]);
  });
  it("keeps brush ranges within a report shorter than one hour", () => {
    const bounds = { start, end: start + HOUR / 2 };
    expect(clampActivityRange(bounds, { start: start - DAY, end: start + DAY })).toEqual(bounds);
    expect(clampActivityRange(bounds, { start: NaN, end: NaN })).toEqual(bounds);
    expect(clampActivityRange(data, { start: data.end + DAY, end: data.end + DAY })).toEqual({ start: data.end - HOUR, end: data.end });
  });
  it("computes a weekly headline's day and peak window from the same group", () => {
    const monday = Date.UTC(2026, 9, 5);
    const accounts = Array.from({ length: 8 }, (_, id) => ({ id: String(id), name: String(id) }));
    const samples = [
      ...Array.from({ length: 24 }, (_, hour) => ({ accountId: "0", timestamp: monday + hour * HOUR, value: 1 })),
      ...accounts.flatMap(account => Array.from({ length: 24 }, (_, hour) => ({ accountId: account.id, timestamp: monday + DAY + hour * HOUR, value: hour === 10 ? 1 : 0 }))),
    ];
    const selection = selectActivity({ ...data, start: monday, end: monday + 2 * DAY, accounts, samples }, query, calendar);
    expect(busiestActivity(selection, "weekday")).toMatchObject({ day: 1, hour: 8 });
  });
});
