import { describe, expect, it } from "vitest";
import { areaStackRange, seriesYValue } from "../packages/ui/src/components/charts/area-stack";
import type { LineConfig } from "../packages/ui/src/components/charts/chart-context";

const lines: LineConfig[] = ["critical", "high", "medium", "low"].map(dataKey => ({ dataKey, stackId: "risks", stroke: "var(--chart-1)", strokeWidth: 2 }));
describe("stacked area observations", () => {
  it("accumulates geometry in child order without changing the observations", () => {
    const point = { critical: 2, high: 5, medium: 4, low: 2 };
    const before = { ...point };
    expect(lines.map(line => areaStackRange(point, line, lines))).toEqual([[0, 2], [2, 7], [7, 11], [11, 13]]);
    expect(seriesYValue(point, lines[3], lines)).toBe(13);
    expect(point).toEqual(before);
  });
  it("separates stack groups, axes and positive/negative values", () => {
    const configs = [lines[0], { ...lines[1], yAxisId: "right" }, { ...lines[2], stackId: "other" }, lines[3]];
    const point = { critical: 2, high: 5, medium: 4, low: 3 };
    expect(configs.map(line => areaStackRange(point, line, configs))).toEqual([[0, 2], [0, 5], [0, 4], [2, 5]]);
    expect(lines.map(line => areaStackRange({ critical: -2, high: 5, medium: -4, low: 0 }, line, lines))).toEqual([[0, -2], [0, 5], [-2, -6], [5, 5]]);
  });
  it.each([null, undefined, NaN, Infinity])("leaves an incomplete stack as a gap: %s", invalid => {
    const point = { critical: 2, high: invalid, medium: 4, low: 2 };
    expect(lines.map(line => areaStackRange(point, line, lines))).toEqual([null, null, null, null]);
  });
  it("keeps actual zeros and refuses overflow geometry", () => {
    expect(areaStackRange({ critical: 0, high: 0, medium: 0, low: 0 }, lines[3], lines)).toEqual([0, 0]);
    expect(areaStackRange({ critical: Number.MAX_VALUE, high: Number.MAX_VALUE, medium: 0, low: 0 }, lines[0], lines)).toBeNull();
  });
  it("does not reinterpret an unstacked observation", () => {
    const plain = { ...lines[1], stackId: undefined };
    expect(seriesYValue({ high: 5 }, plain, [plain])).toBe(5);
    expect(seriesYValue({ high: null }, plain, [plain])).toBeNull();
  });
});
