---
schema_version: 1
name: heatmap-chart
kind: component
status: stable
locale: zh-CN
summary: 可组合日历热力图与 HeatmapMatrix 小时矩阵扩展，共用一个安装入口。
source: packages/ui/src/components/heatmap-chart.tsx
registry: packages/ui/registry.json
typecheck_examples: true
related: [heatmap-chart, chart-core, area-chart]
package_import: "@zeron/ui/heatmap-chart"
registry_import: "@/components/ui/heatmap-chart"
---

# heatmap-chart

安装 `npx zeron-ui add heatmap-chart chart-primitives button`。React 19、Tailwind 4，保留参考 API 与几何，颜色使用 Zeron Token。

输入是包含日期格的周列，不是数字矩阵，也不会自动聚合。weekStartDay 只旋转显示行，不改变日期身份。默认 fluid 布局、间隙 2px、圆角 2px、入场 1600ms。阈值保持 <=0、1、2、3、>=4，颜色由 chart-1 与 muted 派生。图表与外部图例传入同一 levelStyles，各实例纹理 ID 隔离。

图表只有一个键盘入口，方向键／Home／End 查看，Escape 清除。原始数据表负责可访问的数值说明。图例 layout／overflow 由调用 API 控制，不添加布局选择控件。共享 Tooltip 从 chart-core 导入，避免和旧 Recharts 契约混用。

小时或类别矩阵可使用 `layout="fill" stretchCells` 让列宽与行高分别铺满父容器；默认仍为正方形，显式 `binSize` 优先。`colorScale` 可自定义实体格子的填色，显式 `levelStyles` 仍负责纹理填充。`HeatmapTooltip.formatHeader(count, date)` 可替换日期／星期标题，用于账号或小时等类别上下文；默认日期提示保持不变。

需要日期／小时标签、事件圆点、锁定条和可选分布侧栏时，优先使用同一入口导出的 `HeatmapMatrix` 扩展。输入 `data: HeatmapColumn[]` 每列行数相同，0 表示空闲、NaN 表示缺失；`columns`／`rowLabels` 描述标签，`points`／`lockedCells` 描述零起始列行标记，`profile` 提供调用方侧栏。`max`／`height`／`minWidth` 默认 8／432／0；颜色使用 `CHART_SCALE_VARS`，事件使用 `chart-7`，基础字号使用 `text-body`。聚合、单位与时区由调用方处理。

密集格子声明 `data-theme-transition="instant"` 和 `--zeron-theme-color-duration: 0ms`；宿主主题过渡规则应跳过这个子树，避免建立数千个同步 CSS 动画。入场与悬停生命周期保持不变。

提供 `onCellSelect={(bin) => ...}` 时，点击／轻触或键盘查看后的 Enter／空格选择原始日期格，回调包含 `date`、`count`、`bin`。`HeatmapCells interactive={false}`、加载或尚未 ready 时不触发。更新日志 `/updates` 是实际应用：全年 Git commit 日历，按访问者时区聚合并筛选当天全部日志；未来日期留空，不完整历史不能画成零活跃度。

```tsx
"use client";
import { useState } from "react";
import { HeatmapChart, HeatmapCells, HeatmapXAxis, HeatmapYAxis, HeatmapTooltip, HeatmapLegend, HeatmapSeparator, HeatmapInteractionProvider, HeatmapInteractionBoundary, getHeatmapWeekStartSunday, type HeatmapColumn, type HeatmapLevelStyles, HEATMAP_DEFAULT_LEVEL_COLORS } from "@zeron/ui/heatmap-chart";
import { Button } from "@zeron/ui/button";
const rangeStart = new Date(2026, 0, 1);
const rangeEnd = new Date(2026, 11, 31);
const weekStart = getHeatmapWeekStartSunday(rangeStart);
const data: HeatmapColumn[] = Array.from({ length: 53 }, (_, column) => ({ bin: column, bins: Array.from({ length: 7 }, (_, row) => {
  const date = new Date(weekStart); date.setDate(date.getDate() + column * 7 + row);
  return { bin: row, date, count: (column * 3 + row * 7) % 9 };
}) }));

function BasicDemo() { return <HeatmapInteractionProvider><HeatmapInteractionBoundary><HeatmapChart data={data} xDomain={[rangeStart,rangeEnd]}><HeatmapCells /><HeatmapXAxis /><HeatmapYAxis /><HeatmapTooltip /></HeatmapChart><HeatmapLegend /></HeatmapInteractionBoundary></HeatmapInteractionProvider>; }
export function Example() { return <BasicDemo />; }
```

```tsx
import { HeatmapMatrix, type HeatmapColumn } from "@zeron/ui/heatmap-chart";

const data: HeatmapColumn[] = [{ bin: 0, bins: [
  { bin: 0, date: new Date(Date.UTC(2026, 9, 1, 8)), count: 0 },
  { bin: 1, date: new Date(Date.UTC(2026, 9, 1, 9)), count: 8 },
] }];

export function HourlyExample() {
  return <HeatmapMatrix ariaLabel="Hourly activity" data={data}
    columns={[{ id: "oct-1", label: "Oct 1", locked: 1 }]}
    rowLabels={["08:00", "09:00"]} lockedLabel="Locked"
    points={[{ column: 0, row: 1, label: "Limit reached" }]} height={240} />;
}
```
