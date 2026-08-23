import { describe, expect, it } from "vitest";
import {
  assertISODate,
  assertISODateTime,
  assertISOTime,
  createRecentDateRangePreset,
  createRecentDateTimePreset,
  parseISODate,
  parseISODateTime,
  parseISOTime,
  resolveZonedDateTime,
  selectedDayCount,
  temporalValueEquals,
} from "../packages/ui/src/components/temporal-picker";

describe("temporal picker value utilities", () => {
  it("accepts real ISO values and rejects invalid calendar values", () => {
    expect(parseISODate("2026-02-28")).toBeDefined();
    expect(parseISODate("2026-02-30")).toBeUndefined();
    expect(parseISOTime("23:59:59")).toBeDefined();
    expect(parseISOTime("24:00")).toBeUndefined();
    expect(parseISODateTime("2026-08-23T09:30:00+08:00")).toBeDefined();
    expect(parseISODateTime("2026-08-23T09:30:00")).toBeUndefined();
  });

  it("counts date ranges as an inclusive number of calendar days", () => {
    expect(selectedDayCount({ from: assertISODate("2026-08-23"), to: assertISODate("2026-08-23") })).toBe(1);
    expect(selectedDayCount({ from: assertISODate("2026-08-17"), to: assertISODate("2026-08-23") })).toBe(7);
  });

  it("compares equivalent instants rather than their offset strings", () => {
    expect(temporalValueEquals(assertISODateTime("2026-08-23T01:30:00.000Z"), assertISODateTime("2026-08-23T09:30:00+08:00"))).toBe(true);
    expect(temporalValueEquals({ from: assertISOTime("22:00"), to: assertISOTime("06:00"), overnight: true }, { from: assertISOTime("22:00"), to: assertISOTime("06:00") })).toBe(false);
  });
});

describe("temporal picker time zones", () => {
  it("resolves a wall time in an IANA zone", () => {
    const resolution = resolveZonedDateTime(assertISODate("2026-08-23"), assertISOTime("09:30"), "Asia/Shanghai");
    expect(resolution).toMatchObject({ kind: "resolved", value: "2026-08-23T01:30:00.000Z" });
  });

  it("makes DST gaps and repeated times explicit", () => {
    expect(resolveZonedDateTime(assertISODate("2026-03-08"), assertISOTime("02:30"), "America/Los_Angeles")).toEqual({ kind: "nonexistent" });
    const repeated = resolveZonedDateTime(assertISODate("2026-11-01"), assertISOTime("01:30"), "America/Los_Angeles");
    expect(repeated.kind).toBe("ambiguous");
    if (repeated.kind === "ambiguous") expect(repeated.candidates).toHaveLength(2);
  });
});

describe("temporal picker presets", () => {
  it("uses the supplied clock every time a relative preset is activated", () => {
    const relative = createRecentDateTimePreset({ id: "15m", label: "15 minutes", amount: 15, unit: "minute" });
    const first = relative.resolve({ now: new Date("2026-08-23T12:00:00.000Z"), locale: "en-US", timeZone: "UTC" });
    const second = relative.resolve({ now: new Date("2026-08-23T13:00:00.000Z"), locale: "en-US", timeZone: "UTC" });
    expect(first).toEqual({ from: "2026-08-23T11:45:00.000Z", to: "2026-08-23T12:00:00.000Z" });
    expect(second).toEqual({ from: "2026-08-23T12:45:00.000Z", to: "2026-08-23T13:00:00.000Z" });
  });

  it("keeps a seven-day date preset inclusive of today", () => {
    const relative = createRecentDateRangePreset({ id: "7d", label: "7 days", amount: 7, unit: "day", includeToday: true });
    expect(relative.resolve({ now: new Date("2026-08-23T12:00:00.000Z"), locale: "en-US", timeZone: "Asia/Shanghai" })).toEqual({ from: "2026-08-17", to: "2026-08-23" });
  });
});
