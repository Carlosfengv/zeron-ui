---
schema_version: 1
name: pie-chart
kind: component
status: stable
locale: zh-CN
summary: 饼图与圆环图共用 PieChart，通过 innerRadius 设置圆环，支持中心摘要和左右图例布局。
source: packages/ui/src/components/pie-chart.tsx
registry: packages/ui/registry.json
typecheck_examples: true
related: [pie-chart, chart-core, area-chart]
package_import: "@zeron/ui/pie-chart"
registry_import: "@/components/ui/pie-chart"
---

# pie-chart

安装 `npx zeron-ui add pie-chart chart-primitives button`。React 19、Tailwind 4，保留参考 API 与几何，颜色使用 Zeron Token。

innerRadius 为 0 时绘制饼图，大于 0 时绘制圆环图。半径与 hoverOffset 使用像素，角度使用弧度。保持输入顺序，有限非负数值决定总量；非法扇区保留索引但不绘制。业务总量大于已分配值时，由调用方显式追加中性颜色的未分配扇区，保持正确的占比分母；未知总量不得补零。默认平移 10px，innerRadius、padAngle、cornerRadius 均为 0。geometryScrubbing 跳过 Motion 路径变形。动态重排须显式指定颜色。PieCenter 的自定义渲染在默认和悬停状态均生效。

DonutChart 文档和示例已合并至此，原链接跳转到 PieChart。共享 Tooltip／Legend 从 chart-core 导入。现有业务 Block 使用的 DonutSummary，以及原 chart／Recharts、chart-primitives 兼容入口继续保留。

图表只有一个键盘入口，方向键／Home／End 查看，Escape 清除。原始数据表负责可访问的数值说明。图例 layout／overflow 由调用 API 控制，不添加布局选择控件。共享 Tooltip 从 chart-core 导入，避免和旧 Recharts 契约混用。

```tsx
"use client";

import { useState } from "react";
import { PieChart, PieSlice } from "@zeron/ui/pie-chart";
import { ChartLegend } from "@zeron/ui/chart-core";

const data = [
  {
    "label": "Direct",
    "value": 340,
    "color": "var(--chart-1)"
  },
  {
    "label": "Search",
    "value": 240,
    "color": "var(--chart-2)"
  },
  {
    "label": "Referral",
    "value": 180,
    "color": "var(--chart-3)"
  },
  {
    "label": "Social",
    "value": 130,
    "color": "var(--chart-4)"
  },
  {
    "label": "Email",
    "value": 110,
    "color": "var(--chart-5)"
  }
];

function BasicDemo() { const [hovered, setHovered] = useState<number | null>(null); return <div className="mx-auto w-full max-w-sm"><div className="flex justify-center"><PieChart size={180} data={data} hoveredIndex={hovered} onHoverChange={setHovered}>{data.map((item,index) => <PieSlice key={item.label} index={index} />)}</PieChart></div><ChartLegend layout="inline" overflow="collapse" items={data.map(item => ({label:item.label,value:item.value,color:item.color}))} hoveredIndex={hovered} onHover={setHovered} /></div>; }

export function Example() { return <BasicDemo />; }
```
