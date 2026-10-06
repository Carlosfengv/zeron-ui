import { describe, expect, it } from "vitest";
import { clampFloatingPosition, nearestFloatingDock, positionForDock, type DockEdge } from "@docs/components/content/floating-preview-position";

const viewport = { left: 0, top: 0, width: 1440, height: 900 };
const control = { width: 32, height: 32 };

describe("悬浮演示设置定位", () => {
  it("默认位于右下角，两侧间距均为 16px", () => {
    expect(positionForDock({ edge: "right", fraction: 1 }, viewport, control)).toEqual({ x: 1392, y: 852 });
  });
  it.each([
    ["left", { x: 70, y: 450 }], ["right", { x: 1350, y: 450 }],
    ["top", { x: 720, y: 50 }], ["bottom", { x: 720, y: 820 }],
  ] as const)("松开后吸附最近的 %s 边，并保持沿边位置", (edge, point) => {
    const dock = nearestFloatingDock(point, viewport, control);
    expect(dock.edge).toBe(edge);
    const snapped = positionForDock(dock, viewport, control);
    if (edge === "left" || edge === "right") expect(snapped.y).toBeCloseTo(point.y);
    else expect(snapped.x).toBeCloseTo(point.x);
  });
  it("拖出可见范围时仍保留 16px 安全距离", () => {
    expect(clampFloatingPosition({ x: -500, y: 9999 }, viewport, control)).toEqual({ x: 16, y: 852 });
  });
  it("改变屏幕大小仍留在原边，并保留沿边的相对位置", () => {
    const dock = nearestFloatingDock({ x: 16, y: 430 }, viewport, control);
    const resized = positionForDock(dock, { left: 0, top: 0, width: 390, height: 844 }, control);
    expect(resized.x).toBe(16);
    expect(resized.y).toBeCloseTo(402.26794);
  });
  it("可见视口发生偏移时，间距仍相对可见区域计算", () => {
    expect(positionForDock({ edge: "left", fraction: 0 }, { left: 20, top: 200, width: 390, height: 350 }, control)).toEqual({ x: 36, y: 216 });
  });
  it("极小视口自动缩减间距，位置不为负数或 NaN", () => {
    for (const edge of ["left", "right", "top", "bottom"] as DockEdge[]) {
      expect(positionForDock({ edge, fraction: 0.8 }, { left: 0, top: 0, width: 50, height: 50 }, control)).toEqual({ x: 9, y: 9 });
    }
  });
});
