---
schema_version: 1
name: radar-chart
kind: component
status: stable
locale: zh-CN
summary: 按 0–100 指标绘制多系列雷达图，支持受控悬停、网格、轴线与标签。
source: packages/ui/src/components/radar-chart.tsx
registry: packages/ui/registry.json
typecheck_examples: true
related: [radar-chart, chart-core, area-chart]
package_import: "@zeron/ui/radar-chart"
registry_import: "@/components/ui/radar-chart"
---

# radar-chart

安装 `npx zeron-ui add radar-chart chart-primitives button`。React 19、Tailwind 4。保留参考实现的几何与 API，颜色使用 Zeron Chart Token。

至少三个指标，每个值按 0–100 归一化。缺失或非有限数按 0 绘制，越界数裁剪到 0–100，原始数据保留。默认五层网格、60px 边距和 1100ms 入场。RadarGrid／Axis／Labels 及 Area 分别控制装饰、点和高亮。

图表只有一个键盘入口，方向键／Home／End 查看，Escape 或失焦清除；降低动态效果设置会跳过入场和高亮动画。提供原始数据表，不依赖颜色区分信息。ChartLegend 的 layout／overflow 由 API 控制。共享依赖由 chart-core／chart-motion 拥有，不重复安装文件。

RadarArea.fillOpacity 默认为 0.15，设为 0 保持无填充对比线，悬停也不填充；strokeDasharray 定制前期虚线。onPointHover(metricKey, event) 在指标点进入、移动或离开时回调，离开传 null；可用共享 TooltipBox / TooltipContent 组合业务提示，数值继续读取原始记录。

```tsx
"use client";

import { useMemo, useState } from "react";
import { RadarChart, RadarGrid, RadarAxis, RadarLabels, RadarArea, type RadarData, type RadarMetric } from "@zeron/ui/radar-chart";
import { ChartLegend } from "@zeron/ui/chart-core";
import { ChartDataTable } from "@zeron/ui/chart-primitives";
import { Button } from "@zeron/ui/button";

const defaultLabels = { speed: "Speed", reliability: "Reliability", capacity: "Capacity", efficiency: "Efficiency", coverage: "Coverage", current: "Current", previous: "Previous", update: "Update metrics", data: "Metric observations", viewData: "View source data", series: "Series" };

function RadarDemo({ mode = "basic", labels = defaultLabels }: { mode?: "basic" | "comparison" | "style"; labels?: typeof defaultLabels }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [updated, setUpdated] = useState(false);
  const metrics = useMemo<RadarMetric[]>(() => ["speed", "reliability", "capacity", "efficiency", "coverage"].map(key => ({ key, label: labels[key as keyof Pick<typeof defaultLabels, "speed" | "reliability" | "capacity" | "efficiency" | "coverage">] })), [labels]);
  const data = useMemo<RadarData[]>(() => [
    { label: labels.current, color: "var(--chart-1)", values: { speed: updated ? 90 : 78, reliability: 92, capacity: updated ? 88 : 64, efficiency: 82, coverage: 72 } },
    ...(mode === "basic" ? [] : [{ label: labels.previous, color: "var(--chart-2)", values: { speed: 68, reliability: 76, capacity: 84, efficiency: 62, coverage: 86 } }]),
  ], [labels, mode, updated]);
  const columns = [labels.series, ...metrics.map(metric => metric.label)];
  return <div className="mx-auto grid w-full min-w-0 max-w-2xl gap-4">
    {mode === "style" && <Button className="justify-self-start" size="sm" variant="secondary" onClick={() => setUpdated(value => !value)}>{labels.update}</Button>}
    <div className="flex min-w-0 flex-col items-center gap-6 sm:flex-row">
      <div className="w-full min-w-0 max-w-sm sm:flex-1">
        <RadarChart data={data} metrics={metrics} levels={mode === "style" ? 3 : 5} hoveredIndex={hovered} onHoverChange={setHovered}>
          <RadarGrid showLabels={mode !== "style"} />
          <RadarAxis />
          {data.map((item, index) => <RadarArea key={item.label} index={index} showPoints={mode !== "style"} showGlow={mode !== "style"} />)}
          <RadarLabels />
        </RadarChart>
      </div>
      <ChartLegend className="w-full min-w-0 sm:max-w-40 sm:flex-1" layout="stack" overflow="wrap" showValue={false} items={data.map(item => ({ label: item.label, color: item.color || "var(--chart-1)", value: 0 }))} hoveredIndex={hovered} onHover={setHovered} />
    </div>
    <ChartDataTable caption={labels.data} summary={labels.viewData} columns={columns} rows={data.map(item => ({ id: item.label, label: item.label, values: metrics.map(metric => item.values[metric.key]) }))} />
  </div>;
}

export function Example() { return <RadarDemo mode="basic" />; }
```
