---
schema_version: 1
name: bar-chart
kind: component
status: stable
locale: zh-CN
summary: 数值必须有限且非负；非法值保留在原始数据，不生成柱形或污染数值域。
source: packages/ui/src/components/bar-chart.tsx
registry: packages/ui/registry.json
typecheck_examples: true
related: [bar-chart, chart-core, area-chart, chart-brush, chart-primitives, empty]
package_import: "@zeron/ui/bar-chart"
registry_import: "@/components/ui/bar-chart"
---

# bar-chart

`Bar.fillForDatum(point, index)` 可按选区或类别覆盖单个柱子的填充色，`fill` 仍作为系列与 tooltip 的默认颜色。组合到已拥有键盘操作的控件时，可设 `BarChart.keyboardNavigation={false}`；指针 tooltip 仍有效，父控件承担键盘与可访问语义。

安装 `npx zeron-ui add bar-chart chart-primitives button`。React 19、Tailwind 4，保留参考 API 与几何，颜色使用 Zeron Token。

数值必须有限且非负；非法值保留在原始数据，不生成柱形或污染数值域。barGap 是 band 比例（0.2），barWidth、groupGap、stackGap 使用像素。默认四边 40px、入场 1100ms、圆头、grow 动画。纵深辅助层不重复注册系列。

图表只有一个键盘入口，方向键／Home／End 查看，Escape 清除。原始数据表负责可访问的数值说明。图例 layout／overflow 由调用 API 控制，不添加布局选择控件。共享 Tooltip 从 chart-core 导入，避免和旧 Recharts 契约混用。

受控时间范围示例额外安装 `area-chart chart-brush empty`。BarChart 使用分类轴，没有 `xDomain` API；不可将 ChartBrush 直接放入 BarChart 来选择真实日期。宿主持有 `ChartBrushSelection | null`，通过真实时间戳按 start/end 包含边界过滤主图 data，再按同一时区格式化分类标签。下方 AreaChart 保留完整数据，组合 `ChartBrush selection={selection} onSelectionChange={setSelection}`。清除时恢复全部原始数据，未命中观察值时展示 Empty，不补零；原始数据表同步当前范围。示例使用 UTC 日期，导航条 80px、上下 margin=8、blurPx=0，轨道边框与选区外中性色沿用组件默认行为。

```tsx
"use client";
import { useId, useState } from "react";
import { BarChart, Bar, BarSquares, BarColumnTrack, BarDepthProvider, BarDepthBack, BarDepthFront, BarPulse, BarXAxis, BarYAxis } from "@zeron/ui/bar-chart";
import { Grid, YAxis, ChartTooltip, ChartLegend, LinearGradient, PatternLines } from "@zeron/ui/chart-core";
import { Button } from "@zeron/ui/button";
const data = [
  {
    "name": "Mon",
    "requests": 120,
    "comparison": 80
  },
  {
    "name": "Tue",
    "requests": 210,
    "comparison": 140
  },
  {
    "name": "Wed",
    "requests": 170,
    "comparison": 110
  },
  {
    "name": "Thu",
    "requests": 320,
    "comparison": 220
  },
  {
    "name": "Fri",
    "requests": 280,
    "comparison": 200
  },
  {
    "name": "Sat",
    "requests": 390,
    "comparison": 270
  },
  {
    "name": "Sun",
    "requests": 340,
    "comparison": 240
  }
];

function BasicDemo() { return <BarChart data={data}><Grid horizontal /><Bar dataKey="requests" /><BarXAxis /><YAxis /><ChartTooltip /></BarChart>; }
export function Example() { return <BasicDemo />; }
```
