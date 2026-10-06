---
schema_version: 1
name: chart
kind: component
status: stable
locale: zh-CN
summary: 基于 Recharts 的容器、趋势与响应式圆环，保留数据语义和可访问数据入口。
package_import: "@zeron/ui/chart"
registry_import: "@/components/ui/chart"
source: packages/ui/src/components/chart.tsx
registry: packages/ui/registry.json
typecheck_examples: true
related: [chart-primitives, metric-card, time-range-histogram]
---

# Chart

`ChartContainer/config/ChartTooltip/ChartTooltipContent` 保留原有组合接口。`config` 的 key 使用 CSS 标识符，color/theme 使用可信 CSS 色值。ChartContainer 内只放一个 Recharts 图，不能嵌套 ResponsiveContainer，父容器应 min-w-0 且有可测量高度。`dataTable` 可提供 caption、columns、rows 和 summary，为专用图提供键盘可打开的数据表。

`TimeSeriesChart` 是两个请求趋势消费者验证后的薄组合。data 每项为 `{ timestamp: number, values: Record<string, number | null> }`；series 含稳定 id、label 和可选 color。必填 locale/timeZone/label，domain 可指定真实时间窗口。formatValue 同时用于轴、Tooltip 和数据表。没有汇总、补零、排序、采样或隐式连线；单点保留标记、全零保留真实值、空数组显示无数据。dataSummary 由消费者本地化。绘图关闭非必要动画。

`DonutSummary` 接收 segments（id/label/value/color）、业务 total 和中心 center。total 不传时只有完整非负数列才派生总量；null 表示未知。部分已知总量留中性轨道，超额绘图缩放但不改真实值。调用方提供完整 aria-label，并配 ChartLegend 或可读明细；不依赖鼠标 Tooltip。innerRadius 可按实际用途保留不同环宽。

```tsx
import { TimeSeriesChart, DonutSummary } from "@zeron/ui/chart";
export function RequestChart() {
  return <TimeSeriesChart data={[{ timestamp: 1791158400000, values: { requests: 12 } }]} series={[{ id: "requests", label: "请求" }]} locale="zh-CN" timeZone="Asia/Shanghai" label="请求量" dataSummary="查看数据" />;
}
export function UsageDonut() {
  return <DonutSummary segments={[{ id: "used", label: "已用", value: 80 }]} total={100} center="80 / 100" aria-label="已用 80，总量 100" />;
}
```

安装 `npx zeron-ui add chart`。保留 MetricCard 小图及 TimeRangeHistogram 的选择/拖拽契约。分类颜色和状态色不互换；金额、Token、毫秒及比例换算由业务明确输入。
