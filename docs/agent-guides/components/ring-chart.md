---
schema_version: 1
name: ring-chart
kind: component
status: stable
locale: zh-CN
summary: 同心圆环展示多项独立进度，支持圆角／平直端点、中心内容与联动图例。
source: packages/ui/src/components/ring-chart.tsx
registry: packages/ui/registry.json
typecheck_examples: true
related: [ring-chart, chart-core, pie-chart]
package_import: "@zeron/ui/ring-chart"
registry_import: "@/components/ui/ring-chart"
---

# ring-chart

安装 `npx zeron-ui add ring-chart chart-primitives button`。React 19、Tailwind 4。保留参考实现的几何与 API，颜色使用 Zeron Chart Token。

每项以 value/maxValue 计算独立进度，按输入顺序从内到外。非法值或非正 maxValue 不绘制；超目标值绘制满环，中心和数据表保留实际数值。默认 strokeWidth=12px、ringGap=6px、baseInnerRadius=60px，按容器等比缩小，角度使用弧度。animationDuration 默认 1100ms，自定义 enterTransition 优先。geometryScrubbing 使用静态路径，同时保留 Ring 的颜色、端点和交互。RingCenter 在默认及悬停状态都调用自定义 children；默认 data 是合计值和合计目标。

图表只有一个键盘入口，方向键／Home／End 查看，Escape 或失焦清除；降低动态效果设置会跳过入场和高亮动画。提供原始数据表，不依赖颜色区分信息。ChartLegend 的 layout／overflow 由 API 控制。共享依赖由 chart-core／chart-motion 拥有，不重复安装文件。

```tsx
"use client";

import { useMemo, useState } from "react";
import { RingChart, Ring, RingCenter, type RingData } from "@zeron/ui/ring-chart";
import { ChartLegend } from "@zeron/ui/chart-core";
import { ChartDataTable } from "@zeron/ui/chart-primitives";
import { Button } from "@zeron/ui/button";

const defaultLabels = { requests: "Requests", storage: "Storage", compute: "Compute", total: "Total", update: "Update progress", data: "Independent progress", viewData: "View source data", item: "Item", value: "Value", maximum: "Maximum" };

function RingDemo({ mode = "basic", labels = defaultLabels, locale = "en" }: { mode?: "basic" | "caps" | "geometry"; labels?: typeof defaultLabels; locale?: string }) {
  const [hovered, setHovered] = useState<number | null>(null);
  const [updated, setUpdated] = useState(false);
  const data = useMemo<RingData[]>(() => [
    { label: labels.requests, value: updated ? 92 : 72, maxValue: 100, color: "var(--chart-1)" },
    { label: labels.storage, value: updated ? 35 : 48, maxValue: 80, color: "var(--chart-2)" },
    { label: labels.compute, value: updated ? 54 : 36, maxValue: 60, color: "var(--chart-3)" },
  ], [labels, updated]);
  const format = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  return <div className="mx-auto grid w-full min-w-0 max-w-2xl gap-4">
    {mode === "geometry" && <Button className="justify-self-start" size="sm" variant="secondary" onClick={() => setUpdated(value => !value)}>{labels.update}</Button>}
    <div className="flex min-w-0 flex-col items-center gap-6 sm:flex-row">
      <div className="shrink-0">
        <RingChart data={data} size={180} hoveredIndex={hovered} onHoverChange={setHovered} strokeWidth={mode === "geometry" && updated ? 16 : 12} ringGap={6} startAngle={-Math.PI / 2} endAngle={mode === "caps" || (mode === "geometry" && updated) ? Math.PI / 2 : 3 * Math.PI / 2} geometryScrubbing={mode === "geometry"}>
          {data.map((item, index) => <Ring key={item.label} index={index} lineCap={mode === "caps" ? "butt" : "round"} />)}
          <RingCenter defaultLabel={labels.total}>
            {({ value, label }) => <div className="flex min-w-0 flex-col items-center gap-1 text-center"><strong className="text-heading tabular-nums">{format.format(value)}</strong><span className="max-w-full truncate text-label text-fg-muted">{label}</span></div>}
          </RingCenter>
        </RingChart>
      </div>
      <ChartLegend className="w-full min-w-0 sm:flex-1" layout="stack" overflow="wrap" items={data.map(item => ({ label: item.label, color: item.color || "var(--chart-1)", value: item.value, maxValue: item.maxValue }))} formatValue={value => format.format(value)} hoveredIndex={hovered} onHover={setHovered} />
    </div>
    <ChartDataTable caption={labels.data} summary={labels.viewData} columns={[labels.item, labels.value, labels.maximum]} rows={data.map(item => ({ id: item.label, label: item.label, values: [item.value, item.maxValue] }))} />
  </div>;
}

export function Example() { return <RingDemo mode="basic" />; }
```
