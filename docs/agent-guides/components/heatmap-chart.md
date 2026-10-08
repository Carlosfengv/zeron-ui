---
schema_version: 1
name: heatmap-chart
kind: component
status: stable
locale: zh-CN
summary: 输入是包含日期格的周列，不是数字矩阵，也不会自动聚合。
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
