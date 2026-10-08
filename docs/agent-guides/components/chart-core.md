---
schema_version: 1
name: chart-core
kind: component
status: stable
locale: zh-CN
summary: 参考时间序列图的共享坐标轴、Tooltip、图例、图案和动画阶段。
source: packages/ui/src/components/chart-core.tsx
registry: packages/ui/registry.json
typecheck_examples: false
related: [line-chart, area-chart, bar-chart, live-line-chart, pie-chart, radar-chart, ring-chart, chart-core, chart-brush]
package_import: "@zeron/ui/chart-core"
registry_import: "@/components/ui/chart-core"
---

# chart-core

由 line-chart、area-chart、bar-chart、live-line-chart、pie-chart、radar-chart、ring-chart 等自动安装。工作区使用 @zeron/ui/chart-core，消费项目使用 @/components/ui/chart-core。XAxis／YAxis 组合 LineChart 或 AreaChart；Bar 与 Live 使用各自轴。ChartTooltip 必须在相应图表上下文内；不要放进 Recharts ChartContainer，也不要直接放进 RadarChart 或 RingChart。通用 SVG 渐变、Background 与 ChartMarkers 也从此入口导出。Pie 与 Ring 的中心数字和排版文件由 chart-core 统一分发，公开组件仍通过各自入口导入。

XAxis 默认 5 个刻度，tickMode=data，日期标签和悬停观测对齐；domain 模式为时间域等距刻度。YAxis 默认 left、5 刻度，formatLargeNumbers=true，可传 formatValue 和 yAxisId/orientation。Grid 保留 horizontal/vertical、条带、线宽、颜色和加载 shimmer 配置。

ChartTooltip 默认显示十字线、圆点、日期胶囊和面板，支持 content、rows、springConfig、boxSpringConfig、panelStyle、backgroundColor、indicatorDasharray/indicatorFadeEdges 等参考 API。默认缺失值显示 —；自定义 rows/content 由宿主负责原始值语义。TooltipBox 按实际面板尺寸在根容器内翻转和夹紧，panelStyle 保留样式定制，显式 left/top 覆盖自动定位。长标签换行。日期标签格式保持参考实现。

ChartLegend 和复合 Legend/LegendItem/LegendLabel/LegendMarker/LegendProgress/LegendValue 使用参考的 label/value/color/maxValue 契约。它与 chart-primitives 的 ChartLegend 不是同一 API，按导入路径区分。ReferenceArea、PatternLines/PatternCircles/PatternWaves/PatternHexagons 与 renderPatternPreset 可组合；使用实例唯一 defs ID。

ChartLegend 与复合 Legend 均支持 layout="stack"（默认，每行一个标注与数值）或 "inline"（完整项目同行）；overflow="wrap"（默认，自动换行）或 "collapse"（按宽度收起超出部分，展开后显示全部）。maxVisibleItems 可限制折叠时的最大项目数，renderOverflowLabel(hiddenCount, expanded) 可定制/本地化更多和收起文案。折叠项保留原始内容和 hover 下标，并移出无障碍树与键盘停靠；容器、内容与字体变化后重新计算可见项。已有逐行调用无须改动。

布局由宿主 API 配置，示例不提供用户布局选择按钮。折叠隐藏当前焦点项时转交“更多”；容器变宽使披露按钮消失时，焦点保留在图例容器，该容器不增加正常 Tab 停靠点。

XAxis.formatDate(date) 可按宿主 locale / timeZone 格式化标签，并同步默认日期提示和键盘读屏日期；未传时使用共享短日期格式。业务需要定制 Tooltip 标题时，可组合 ChartTooltip.content / TooltipContent，并关闭默认 showDatePill。

默认标注与数值支持长文本换行，复合 Legend 的完整标注 / 数值项目限制在容器宽度内；自定义 renderItem / className 覆盖时由宿主保留这一边界。

ChartConfigProvider 提供 spring 配置。useChart/useChartStable/useChartHover 只在图表上下文内使用；稳定绘图与 hover 状态分离，避免移动指针重建所有路径。chartCssVars 将参考颜色字段映射到现有 fg、border、surface、focus-ring 和 chart-N。
