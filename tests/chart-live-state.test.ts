import { describe, expect, it } from "vitest";
import { computeTargetRange, interpolateAtTime, nextAnimFrame, shouldCommitLiveUpdates } from "../packages/ui/src/components/charts/live-line-state";
import { computeSeriesPathPoints, interpolateSeriesPathPoints, seriesPathFromPoints } from "../packages/ui/src/components/charts/series-path-utils";
import { curveLinear } from "@visx/curve";
import { buildHeatmapFillScale, heatmapLevelPatternId, HEATMAP_DEFAULT_LEVEL_STYLES, getHeatmapContributionLevel } from "@zeron/ui/heatmap-chart";

describe("live scrolling and value interpolation", () => {
  it("freezes time while paused and continues value/range interpolation", () => {
    const next = nextAnimFrame({now:1000,yMin:0,yMax:100,displayValue:20}, {yMin:-10,yMax:80}, 40, 0.1, true);
    expect(next).toEqual({now:1000,yMin:-10,yMax:98,displayValue:22});
  });
  it("includes a latest value before any samples arrive", () => {
    expect(computeTargetRange([], 400, false)).toEqual({yMin:390,yMax:410});
  });
  it("handles boundaries and duplicate sample times without dividing by zero", () => {
    const data = [{time:1,value:10},{time:1,value:12},{time:3,value:20}];
    expect(interpolateAtTime(data, 0)).toBe(10);
    expect(interpolateAtTime(data, 2)).toBe(16);
    expect(interpolateAtTime(data, 4)).toBe(20);
    expect(interpolateAtTime([], 1)).toBeNull();
  });
  it("updates tooltip values at the same bounded frame cadence as geometry", () => {
    expect(shouldCommitLiveUpdates(20,0,"new","old")).toEqual({commitFrame:false,commitTooltip:false});
    expect(shouldCommitLiveUpdates(32,0,"new","old")).toEqual({commitFrame:true,commitTooltip:true});
  });
});

describe("line gaps and heatmap identities", () => {
  it.each([null,undefined,NaN,Infinity,-Infinity])("keeps %s as a path gap during interpolation", value => {
    const rows = [10,20,value,30,40].map((v,i) => ({date:new Date(i * 1000),value:v}));
    const points = computeSeriesPathPoints(rows, row => row.date as Date, date => date.getTime(), value => value, "value");
    const path = seriesPathFromPoints(interpolateSeriesPathPoints(points, points, .5), curveLinear);
    expect(path.match(/M/g)).toHaveLength(2);
    expect(path).not.toMatch(/NaN|Infinity/);
  });
  it("retains the public unscoped texture helper and isolates internal fills", () => {
    const styles = HEATMAP_DEFAULT_LEVEL_STYLES.map(style => ({...style,fillMode:"pattern" as const,pattern:"diagonal" as const})) as unknown as import("@zeron/ui/heatmap-chart").HeatmapLevelStyles;
    expect(heatmapLevelPatternId(2)).toBe("heatmap-level-2");
    expect(buildHeatmapFillScale(styles,"first")(2)).toBe("url(#first-heatmap-level-2)");
    expect(buildHeatmapFillScale(styles,"second")(2)).toBe("url(#second-heatmap-level-2)");
    expect(getHeatmapContributionLevel(NaN)).toBe(0);
  });
});
