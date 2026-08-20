import { describe, expect, it } from "vitest";
import { formatTraceTime } from "../packages/blocks/src/application/agent-trace-01/trace-time";

describe("formatTraceTime", () => {
  const timestamp = 1787060969278;

  it("uses the repository timezone instead of the browser timezone by default", () => {
    expect(formatTraceTime(timestamp, { locale: "en-GB" })).toBe("21:49");
  });

  it("formats detailed timestamps in the configured timezone", () => {
    expect(formatTraceTime(timestamp, { locale: "en-GB", precision: "millisecond" })).toBe("21:49:29.278");
    expect(formatTraceTime(timestamp, { locale: "en-GB", precision: "millisecond", timeZone: "UTC" })).toBe("13:49:29.278");
  });

  it("returns an empty label for absent or invalid values", () => {
    expect(formatTraceTime(undefined)).toBe("");
    expect(formatTraceTime(Number.NaN)).toBe("");
  });
});
