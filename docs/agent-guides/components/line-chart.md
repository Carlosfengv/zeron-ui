---
schema_version: 1
name: line-chart
kind: component
status: stable
locale: zh-CN
summary: 日期可用 Date、可解析字符串或毫秒时间戳；绘图视图按时间排序且保留原始数据。
source: packages/ui/src/components/line-chart.tsx
registry: packages/ui/registry.json
typecheck_examples: true
related: [line-chart, chart-core, area-chart]
package_import: "@zeron/ui/line-chart"
registry_import: "@/components/ui/line-chart"
---

# line-chart

安装 `npx zeron-ui add line-chart chart-primitives button chart-brush`。React 19、Tailwind 4，保留参考 API 与几何，颜色使用 Zeron Token。

日期可用 Date、可解析字符串或毫秒时间戳；绘图视图按时间排序且保留原始数据。缺失与非有限数值保持断点。默认四边 40px、比例 2 / 1、入场 1100ms、curveNatural、线宽 2.5px、边缘淡出开启。加载与 500ms Y 域过渡复用 AreaChart。Brush 用 Date 起止、范围外中性色和完整边框。

图表只有一个键盘入口，方向键／Home／End 查看，Escape 清除。原始数据表负责可访问的数值说明。图例 layout／overflow 由调用 API 控制，不添加布局选择控件。共享 Tooltip 从 chart-core 导入，避免和旧 Recharts 契约混用。

```tsx
"use client";
import { useId, useState } from "react";
import { LineChart, Line } from "@zeron/ui/line-chart";
import { Grid, XAxis, YAxis, ChartTooltip, ChartLegend } from "@zeron/ui/chart-core";
import { ChartBrush, type ChartBrushSelection } from "@zeron/ui/chart-brush";
import { Button } from "@zeron/ui/button";
const data = [
  {
    "date": "2026-10-01",
    "requests": 120,
    "comparison": 80,
    "latency": 28
  },
  {
    "date": "2026-10-02",
    "requests": 210,
    "comparison": 140,
    "latency": 34
  },
  {
    "date": "2026-10-03",
    "requests": 170,
    "comparison": 110,
    "latency": 31
  },
  {
    "date": "2026-10-04",
    "requests": 320,
    "comparison": 220,
    "latency": 42
  },
  {
    "date": "2026-10-05",
    "requests": 280,
    "comparison": 200,
    "latency": 37
  },
  {
    "date": "2026-10-06",
    "requests": 390,
    "comparison": 270,
    "latency": 48
  },
  {
    "date": "2026-10-07",
    "requests": 340,
    "comparison": 240,
    "latency": 44
  }
];

function BasicDemo() { return <LineChart data={data}><Grid horizontal /><Line dataKey="requests" /><XAxis /><YAxis /><ChartTooltip /></LineChart>; }
export function Example() { return <BasicDemo />; }
```

yDomain 可传 `[数值 | "dataMin", 数值 | "dataMax"]` 指定纵轴边界；范围外的真实观察值仍保留，未传时使用原有自动范围。相同值的上下界扩展为非零范围，非法或逆序边界回退自动范围。
