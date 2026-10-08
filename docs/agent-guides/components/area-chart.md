---
schema_version: 1
name: area-chart
kind: component
status: stable
locale: zh-CN
summary: 保留参考几何与 API 的渐变面积图，组合轴、Tooltip、标记、图案和 Brush。
source: packages/ui/src/components/area-chart.tsx
registry: packages/ui/registry.json
typecheck_examples: true
related: [area-chart, chart-core, chart-brush, funnel-chart]
package_import: "@zeron/ui/area-chart"
registry_import: "@/components/ui/area-chart"
---

# area-chart

安装 `npx zeron-ui add area-chart`，自动安装 chart-core / chart-motion；需要选区则加 chart-brush，需要原始数据表则加 chart-primitives。React 19、Tailwind 4、Visx 4，无需强制跳过 peer 检查。

默认 margin 四边 40px、aspectRatio="2 / 1"、animationDuration=1100ms、ease cubic-bezier(0.85, 0, 0.15, 1)、Y 域过渡 500ms、status="ready"。style 可覆盖尺寸；revealSignature 变化重播。onPhaseChange 提供 loading/exiting/gridTweenReady/revealing/ready/exitingReady/gridTweenLoading/revealingLoading 阶段。减少动态效果跳过入场与加载循环，状态仍完成。

Area 默认 curveMonotoneX、strokeWidth=2、fillOpacity=.4、gradientToOpacity=0、gradientSpan=1、showLine/showHighlight=true、showMarkers=false、fadeEdges=false。主系列默认 chart-1，多系列须显式传固定 chart-N；颜色与图例共用。不同量纲用 yAxisId 并配置左右 YAxis。系列默认重叠，传 Area.stackId 开启分组堆叠；原 Chart/Recharts 入口保留。

日期有效的行按时间排序成绘图视图，不修改业务数组；缺失/NaN/Infinity 为断点，采样保留断点及相邻行，Tooltip 显示 —，标记只绘制有限点。无效日期仅从绘图排除，隐藏原始数据仍保留输入。空或过小容器不生成 SVG；宿主提供可见空态和错误文案。

采样覆盖第一个内部时间分桶并保留首尾观测；原始隐藏数据按 data 缓存，尺寸和阶段变化不会重复格式化所有行。加载或空数据打断拖动时清理交互状态，恢复后正常悬停。Y 域动画的参数或目标变更会接续当前值，关闭动画或启用减少动态效果时立即收敛；减少动态效果同时关闭轴标签位置过渡、标记入场和高亮移动。虚线尾段在高度、时间域、值域和曲线变化后与面积几何同步，仅虚线 / 加载需要时测量路径长度。

Area 的 stackId 将同一 Y 轴、同一分组中的系列按子组件顺序堆叠，省略则保持默认重叠绘制。正负值分别累加，组内缺失或非有限数保留整组断点；原始数据与 Tooltip 数值不做累加，坐标域、标记和 Tooltip 圆点使用累计几何。stackId 仅用于 Area，不用于 PatternArea。

Area 的 dashFromIndex/dashArray 控制尾段，markers 提供半径/描边/环样式；fadeEdges 可为 true、false、left、right。PatternArea 只绘制填充，配合 Area(fillOpacity=0) 绘制线；PatternLines 等 defs 的 id 必须实例唯一，例如 useId。AreaChartLoading 是独立加载骨架，支持 pulse/sweep 与自定义 label。

图表只有一个 Tab 停靠点，方向键/Home/End 导航，Escape/blur 清除 Tooltip；SVG defs 和 portal 均绑定本实例。Brush 手柄另有两个 slider 停靠点。ChartDataTable 应展示原始字段而非绘图补值。

```tsx
"use client";
import { AreaChart, Area } from "@zeron/ui/area-chart";
import { Grid, XAxis, YAxis, ChartTooltip } from "@zeron/ui/chart-core";
const data = [{ date: "2026-10-01", value: 10 }, { date: "2026-10-02", value: 20 }];
export function Trend() {
  return <AreaChart data={data}><Grid horizontal /><Area dataKey="value" /><XAxis /><YAxis /><ChartTooltip /></AreaChart>;
}
```
