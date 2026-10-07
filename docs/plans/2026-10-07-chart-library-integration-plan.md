# 七类 Chart 组件整理与 ZeronUI 集成方案

日期：2026-10-07

状态：FunnelChart、AreaChart 已实施；其余五类待实施。本文保留整理前的基线分析与整体方案；进度见 [FunnelChart 实施记录](./2026-10-07-funnel-chart-implementation.md)与 [AreaChart 实施记录](./2026-10-07-area-chart-implementation.md)。

ZeronUI 基线：`8f8b4d96d51df0fe351b440fabbd395dd62e3669`。

参考源码：`/Users/carlos/Downloads/charts`。本文将该目录称为“参考实现”，将当前 `/Users/carlos/Downloads/zeron-ui` 称为“集成项目”。用户要求中的“除颜色变量外，按目标 chart 实现”，在本方案中解释为：**七类新组件的非颜色样式和交互 API 以参考实现为准，默认取色接入 ZeronUI 现有变量。**

## 1. 实施结论与边界

采用参考实现的 Visx、D3、自绘 SVG 和 Motion 组合，新增 `area-chart`、`bar-chart`、`funnel-chart`、`heatmap-chart`、`line-chart`、`live-line-chart`、`pie-chart` 七个公开组件入口。复用参考代码中的共享绘图、交互和动画能力，整理成可独立安装的文件依赖闭包。

当前同名文档页升级为真实组件文档。现有 `@zeron/ui/chart` 和 `@zeron/ui/chart-primitives` 保持兼容；两套绘图能力通过不同导入路径区分。本轮不批量替换业务 Block 中已使用的 Recharts 图表，避免把组件整理扩大为业务迁移。

| 范围 | 本轮处理 |
| --- | --- |
| 七类根组件 | 保留参考 Props、默认值、子组件组合方式、单位和回调签名；建立包导出与 Registry 安装入口 |
| 相关子组件 | 迁移线、面积、柱、扇区、坐标轴、网格、Tooltip、Legend、Brush、加载态、纹理与标记；按依赖和使用场景拆分 |
| 颜色 | 普通系列使用现有 `--chart-1` 至 `--chart-5`；结构、文字和表面使用现有语义变量；热图使用单色连续等级 |
| 非颜色样式 | 保留参考尺寸、margin、曲线、线宽、圆角、间距、透明度、字体大小、阴影几何、模糊、布局及动画参数 |
| 已有图表 review | 承接已落实的取色、数据表、复制代码、实例隔离、响应式和独立安装要求 |
| 缺陷修正 | 修复缺失依赖、SVG ID 冲突、无效几何、未生效的受控字段及生命周期清理；正常输入的展示保持参考行为 |
| 其他 chart 类型 | 不迁移 Radar、Ring、Sunburst、Scatter、Candlestick、Sankey、Choropleth、Gauge、ComposedChart 的公开组件；共享壳必须依赖的工具可保留内部使用 |
| 发布 | 本方案不包含提交、推送或发布操作 |

不能以“统一 Zeron 风格”为由，将参考的 40px margin 改成现有 trend preset、把 Funnel 的 4px gap 改成 SegmentedBar 的 2px，或将参考 Tooltip 的 blur 和布局替换为另一套浮层。颜色类名可以映射，非颜色属性须逐项对照。

## 2. 当前项目与参考实现的差异

### 2.1 当前组件库现状

| 类型 | 当前实际实现 | 集成决策 |
| --- | --- | --- |
| AreaChart | 独立文档页，渲染 Recharts `AreaChart` / `Area`；没有 Zeron `AreaChart` 公共导出 | 新增真实组件；文档主示例改为参考组合 |
| BarChart | 独立文档页，渲染 Recharts `BarChart` / `Bar`，含渐变示例 | 新增真实组件；对照参考的分组、堆叠、横向、圆角和交互 |
| LineChart | 独立文档页，渲染 Recharts `LineChart` / `Line` | 新增真实组件；主示例使用参考曲线与加载生命周期 |
| PieChart | 独立文档页，组合 Recharts `PieChart` / `Pie` / `Cell` | 新增真实组件与 `PieSlice`、`PieCenter` |
| FunnelChart | 无独立组件、文档和 Registry 条目 | 新增 |
| HeatmapChart | 无该公共入口；业务中存在其他热图或活动表达 | 新增参考的周列／行格热图；不替换其他组件的数据模型 |
| LiveLineChart | 无独立组件、文档和 Registry 条目 | 新增流式单值时间窗组件 |

核对入口：`packages/ui/src/components/chart.tsx`、`chart-primitives.tsx`、`packages/ui/package.json`、`packages/ui/registry.json`、`docs/lib/chart-types.ts`、`docs/components/charts/chart-type-example.tsx`、`chart-type-doc.tsx`。

现有 `chart.tsx` 公开 `ChartContainer`、Recharts `ChartTooltip`、`ChartTooltipContent`、`chartTrendPreset`、`TimeSeriesChart` 和 `DonutSummary`。`chart-primitives.tsx` 提供独立于绘图引擎的取色、格式化、`ChartLegend`、`ChartDataTable`、`SegmentedBar` 和分布计算。

**已有文档入口不等于已有同名 Zeron 组件。** 本轮无需覆盖不存在的公共导出，也不能直接把 `chart.tsx` 换成参考目录的 `index.ts`。

### 2.2 已有 review 的承接方式

已核对以下文档，并以当前源码验证其主要结论：

- [Chart 色彩与分段条审查及提交计划](./2026-10-07-chart-token-review-commit-plan.md)
- [图表文档与 StatusBarChart 审查及提交计划](./2026-10-07-chart-docs-status-bar-review-commit-plan.md)
- [Chart Token 统一方案](./2026-10-07-chart-token-unification-plan.md)
- [Chart Token 实施记录](./2026-10-07-chart-token-unification-implementation.md)

| 已确定的要求 | 本轮落实方式 |
| --- | --- |
| 五槽位按蓝、青、琥珀、绿、紫排列，独立于品牌／状态 | 保留中央色值及 `chartColor` / `chartSeriesColor`，新组件不增加分类槽位 |
| 图形、图例、Tooltip 使用相同系列映射 | 所有系列颜色来自同一配置；纹理／渐变另保留实色标记 |
| 固定系列显式指定槽位，动态实体按稳定 ID 取色 | 文档数据和示例照此配置；不把显示名称或重排后的下标作为业务身份 |
| 复制代码可直接在 Next 客户端运行 | 所有完整示例含 `"use client"`、实际导入、数据和默认导出；预览与复制代码一致 |
| 数据表保留原始数据，零值与未知有区别 | 继续用 `ChartDataTable`；抽稀后的 SVG 数据不替代原始数据表 |
| 多实例渐变不串色 | 对新增引擎的 gradient、pattern、mask、clipPath 全面检查实例隔离 |
| 独立安装需要真实依赖闭包 | 七个入口分别验证干净安装，不依赖文档站已经安装的包或全局 CSS |
| Chart 汇总页隐藏但原 URL 有效 | 保持现有隐藏规则；七类入口进入 Charts 分类 |
| SegmentedBar 的 sm 圆角与 gap-0.5 | 继续用于原组件；该约定不强加给参考 Bar、Funnel 或 Heatmap |

历史 review 的通过记录只证明对应历史源码，不计为新引擎的测试或安装证据。

## 3. 源码整理与模块边界

### 3.1 导入闭包与迁移规模

对参考目录执行静态导入追踪：七个根文件的本地依赖闭包为 **71 个文件**；加入本方案涉及的坐标轴、Tooltip、Legend、Brush、Pie 子组件、Heatmap 目录出口、BarSquares／Depth、ReferenceArea、标记和 Loading 后为 **130 个文件**。统计包含类型导入及目录内 barrel，不包含测试、七个新增导出壳或缺失的外部组件；它用于判断工作量，不是要求原样复制 130 个文件。

实施第一阶段将该闭包转成逐文件清单：每个文件必须注明所属安装条目、是否公开、实际运行时依赖及删除／合并理由。不能只搬七个根文件，也不能整体复制参考 `index.ts`，后者会暴露本轮范围外的图表与颜色预设。

所给目录也没有原项目的全局主题 CSS。代码中的显式数值可以直接冻结；`rounded-lg`、`shadow-lg`、`text-sm` 等依赖原 Tailwind theme 的计算值，需要原构建样式才能确认。阶段 0 先建立独立参考预览，以标准 Tailwind 对应值作为明确记录的临时基线，隔离当前 Zeron 同名尺寸变量的影响；获得原主题后校准。未校准部分不能报告为与原项目逐像素一致，也不能擅自换成 Zeron 的尺寸或阴影预设。

| 模块组 | 主要参考文件 | 整理要求 |
| --- | --- | --- |
| 共享上下文与颜色 | `chart-context`、`chart-config-context`、`chart-legend-hover`、`chart-scale`、`chart-phase` | 保留 stable／hover 上下文拆分、Motion 配置和状态类型；集中映射颜色 |
| 时间序列壳 | `time-series-chart-shell`、`y-axis-scales`、`y-domain-utils`、`use-animated-y-domains`、`decimate-time-series`、`filter-data-by-x-domain` | Line／Area 共用；保留双轴、可视域、抽稀与领域过渡 |
| 交互与图层 | `use-chart-interaction`、`use-scheduled-tooltip`、`chart-child-passthrough`、`chart-defs` | 保留 nearest-point、rAF 调度、选择与图层顺序；不以组件名字符串作为唯一识别方式 |
| 线与面积 | `line`、`area`、`area-gradient-defs`、`series-*`、`fade-edges`、`dash-tail-stroke`、`path-stroke-utils` | 保留曲线、渐变、边缘淡出、标记、虚线尾部及 hover band |
| 加载与 reveal | `*-chart-loading`、`chart-reveal-clip`、`use-chart-phase-orchestrator`、`line-loading-*`、`loading-sweep`、`chart-loading-label`、骨架生成器 | 保留 pulse／sweep、正反状态转换；补齐缺失文字效果 |
| 柱形 | `bar-chart`、`bar`、`bar-x-axis`、`bar-y-axis`、`bar-squares*`、`bar-depth*` | 保留布局与配套变体；深度层不参与系列计数和 domain 扫描 |
| Tooltip | `tooltip/`、`indicator-fade` | 新引擎独立导出；保留 Portal、翻转、跟随弹簧、日期 pill 和 ring／dot |
| Legend | `legend/`、`chart-legend` | 保留组合式 Legend 与参考旧式 ChartLegend；不覆盖当前 primitives 图例 |
| Brush | `chart-brush*` | 单独安装条目；保留回调、时间域和轨道／选区／把手；补齐受控 selection |
| Pie | `pie-chart`、`pie-context`、`pie-slice`、`pie-center`、`pie-center-shell`、`chart-center-typography`、`chart-stat-flow` | 保留弧度与像素单位、数字变化、中心 container query 字号 |
| Heatmap | `heatmap/`、`pattern-preset`、`visx-pattern` | 保留周列数据、日历工具、分组间隔、纹理、图例联动与加载波纹 |
| 标记与区域 | `markers/`、`reference-area*`、`series-point-marker`、`line-series-terminal-marker` | 保留七类图表实际使用的能力；其他图表工具不因此成为公开组件 |
| Funnel | `funnel-chart`、`use-mount-progress`、`use-enter-complete` | 独立 SVG／HTML 布局；保留环层、标签分布和 hover spring |

`projection-config`、`projection-utils`、`series-bar-layout` 等被共享时间序列壳引用的内部工具，先保留以维持壳行为；本轮不因此新增 ProjectionLine 或 ComposedChart 的文档与安装入口。

### 3.2 建议文件结构与公开入口

在 `packages/ui/src/components/charts/` 内保留参考文件的相对布局，减少路径和图层识别改写。七个根出口使用项目已有的 `.tsx` 导出壳约定：

```text
packages/ui/src/components/
  chart.tsx                         # 现有 Recharts 契约
  chart-primitives.tsx              # 现有轻量工具
  chart-core.tsx                    # 新引擎共享元素与类型的明确出口
  chart-brush.tsx                   # Brush 独立出口
  area-chart.tsx
  bar-chart.tsx
  funnel-chart.tsx
  heatmap-chart.tsx
  line-chart.tsx
  live-line-chart.tsx
  pie-chart.tsx
  charts/
    chart-colors.ts                 # 颜色引用与热图连续等级
    chart-context.tsx
    chart-config-context.tsx
    time-series-chart-shell.tsx
    ...                            # 按闭包清单整理的共享文件和根组件
    tooltip/
    legend/
    heatmap/
    markers/
```

`@zeron/ui/line-chart` 导出 `LineChart`、`Line`、`LineChartLoading` 及对应 Props；其余根出口同理。Bar 相关变体从 `bar-chart` 导出，Live 的 `LiveLine`／轴从 `live-line-chart` 导出，Pie 的 slice／center／context 从 `pie-chart` 导出，Heatmap 的 cells／axis／legend／tooltip／日历工具从 `heatmap-chart` 导出。

`@zeron/ui/chart-core` 明确导出新引擎的 `Grid`、`XAxis`、`YAxis`、`Background`、`ChartTooltip`、Tooltip 子元素、`Legend` 组合、参考 `ChartLegend`、`ChartConfigProvider`、共享 hooks／类型、纹理／通用渐变和标记能力。它不重新导出七个根图表，也不导出 Brush，避免循环依赖和无关安装成本。

### 3.3 同名 API 的兼容方式

| 名称 | 现有入口与契约 | 新入口与契约 |
| --- | --- | --- |
| `ChartTooltip` | `@zeron/ui/chart`；Recharts Tooltip Props | `@zeron/ui/chart-core`；参考 `showCrosshair`、`rows`、`damping` 等 Props |
| `ChartLegend` | `@zeron/ui/chart-primitives`；稳定 `id`、`onSelect`、`value`／`ratio` | `@zeron/ui/chart-core`；参考 `hoveredIndex`、`onHover`、进度及百分比 |
| `ChartConfig` | 保留现有系列标签／颜色／theme 映射类型 | 使用参考 `ChartConfigValue`／`ChartConfigProvider` 表示运动配置，不覆盖旧类型 |
| `TimeSeriesChart` | 保留 `timestamp` 毫秒、`values`、`locale`／`timeZone` 的现有业务包装 | 新 `LineChart`／`AreaChart` 使用参考 `Record<string, unknown>[]` 与 `xDataKey` |
| `DonutSummary` | 保留 total、未知总量、剩余轨道和 overflow 语义 | 新 `PieChart` 通过 `innerRadius` 表示圆环，比例分母是 slices 总和 |

文档在混用时使用导入别名，如 `ChartTooltip as CartesianTooltip`，不能从旧 `chart` 入口导入新 Tooltip。新引擎不会自动兼容 Recharts 的 `XAxis`、`Area` 或 `Pie` 子组件。

## 4. 颜色变量映射

### 4.1 分类系列

继续使用当前已生成的五个 Token；本轮不调整其值。

| 槽位 | 浅色 | 深色 | 引用 |
| --- | --- | --- | --- |
| 1 | `#0060D2` | `#1483FD` | `chartColor(1)`／`var(--chart-1)` |
| 2 | `#06B6D4` | `#22D3EE` | `chartColor(2)`／`var(--chart-2)` |
| 3 | `#F59E0B` | `#FBBF24` | `chartColor(3)`／`var(--chart-3)` |
| 4 | `#10B981` | `#34D399` | `chartColor(4)`／`var(--chart-4)` |
| 5 | `#8B5CF6` | `#A78BFA` | `chartColor(5)`／`var(--chart-5)` |

普通单系列默认槽位 1；参考的 secondary 默认映射槽位 2。多个 `Line`／`Area` 不自动按 child 顺序分配不同颜色，示例和调用方显式传入对应槽位。Pie 保留参考按 slice 顺序循环五色的默认策略，动态重排场景显式设置 `PieData.color`，保证实体颜色稳定。

保留 `stroke`、`fill`、`color`、渐变 stops、`momentumColors`、`colorScale`、`levelColors` 和 `levelStyles` 的现有覆盖 API，不新增每个图表专属的 `colorIndex` Props。超过五项允许复用槽位，保留全部数据和标签。

### 4.2 辅助色与原有颜色类名

参考目录仅提供颜色变量引用，没有提供这些变量的主题定义。采用以下明确映射，在 `chart-colors.ts` 集中维护。保留参考 `chartCssVars`／`pieCssVars`／`legendCssVars` 的公共对象字段，改变字段对应的 CSS 引用；不另建一套带固定 HEX 的全局图表主题。

| 参考引用 | ZeronUI 取色 |
| --- | --- |
| `--chart-1` 至 `--chart-5` | 同名现有 Token |
| `--chart-line-primary`／`--chart-line-secondary` | `--chart-1`／`--chart-2` |
| `--chart-foreground`、`--foreground`、`--chart-tooltip-foreground`、`--popover-foreground` | `--fg-default` |
| `--chart-foreground-muted`、`--muted-foreground`、`--chart-tooltip-muted` | `--fg-muted` |
| `--chart-label` | `--fg-subtle` |
| `--chart-background`／`--background` | 当前 `SurfaceProvider` 对应的 `--surface-{role}`；未配置时为 `--surface-base` |
| `--chart-tooltip-background`、`--popover`、`--chart-marker-background` | `--surface-floating` |
| `--chart-grid`、`--chart-marker-border`、`--border` | `--border` |
| `--chart-crosshair`、`--chart-indicator-color` | `--fg-subtle` |
| `--chart-indicator-secondary-color` | `--fg-muted` |
| `--chart-marker-foreground`、`--chart-marker-badge-foreground` | `--fg-default` |
| `--chart-marker-badge-background` | `--muted` |
| `--chart-segment-background` | `--selection` |
| `--chart-segment-line`、`--chart-brush-border` | `--focus-ring` |
| `--color-muted`、`--muted` | `--muted` |
| `--legend`／`--legend-foreground` | `--surface-floating`／`--fg-default` |
| `--legend-muted`、`--legend-track`／`--legend-muted-foreground` | `--muted`／`--fg-muted` |
| `--chart-scale-pattern-color`、内置 accent pattern 的固定粉色 | `--chart-5`；显式 patternColor 仍优先 |

`text-foreground`、`text-chart-label`、`bg-chart-tooltip-background` 等颜色工具类改成项目已有的语义颜色类，或直接引用上述集中取色结果。不能只替换 SVG 的 `stroke` 而遗漏 HTML 图例、Tooltip、加载文字、Live badge 或 Brush 把手。

动态承载面的背景色可通过根容器私有 CSS 变量传给后代；它只表达当前表面颜色，并通过实例容器内 Portal 继承。无需修改七个根组件的外部 Props。

纹理 fallback 中作为实际色彩混合端点的 `white` 改为现有表面色；**SVG mask 中用于控制透明区域的黑／白及 transparent 保留**，它们属于绘制算法，不是系列色盘。参考 `shadow-lg` 的几何、opacity、gradient stop offset 和 blur 数值保持不变。

### 4.3 Heatmap 连续等级

参考 Heatmap 使用 `--chart-scale-01` 至 `--chart-scale-05` 表示 Less → More，数据阈值是 `<=0`、`1`、`2`、`3`、`>=4`，并非五个分类系列。当前 ZeronUI 没有这组等级变量。

本方案采用现有槽位 1 与轨道色生成连续蓝色等级，保留五级类型和原阈值。颜色公式是本轮新增的取色决策；不改变 cells 本身的透明度或加载动画。

| 等级 | 默认颜色表达式 |
| --- | --- |
| 0 | `var(--muted)` |
| 1 | `color-mix(in oklch, var(--chart-1) 25%, var(--muted))` |
| 2 | `color-mix(in oklch, var(--chart-1) 50%, var(--muted))` |
| 3 | `color-mix(in oklch, var(--chart-1) 75%, var(--muted))` |
| 4 | `var(--chart-1)` |

保留 `CHART_SCALE_VARS`／默认等级常量的五项出口，但其内容引用以上已有变量及派生公式。`levelStyles` 优先于 `levelColors`；`colorScale` 的显式覆盖与 patterns 的 fill 逻辑按参考执行。Cells、swatches 和 gradient Legend 必须读取同一解析后的等级配置。

## 5. 七类图表的样式与 API 落地清单

以下记录来自参考函数签名和实现默认值。实施时为七个 Props 及公开子组件生成完整 API 清单，逐字段对照，不只实现本表列出的常用属性。

### 5.1 LineChart

- 数据：`Record<string, unknown>[]`；`xDataKey="date"`。Date、可解析日期字符串或数值时间经过原 accessor 读取；数值时间按 JavaScript Date 的毫秒单位解释。
- 外观：默认 `aspectRatio="2 / 1"`，margin 四边 40px；容器 `relative w-full`，`ParentSize` debounce 10ms。默认 Line 为 `curveNatural`、线宽 2.5、`fadeEdges=true`、`showHighlight=true`、`showMarkers=false`。
- 动画：`animationDuration=1100`；`animationEasing` 默认 `cubic-bezier(0.85, 0, 0.15, 1)`；`enterTransition`、`revealSignature` 原样保留。`status="ready"`，y domain tween 默认开启、500ms。
- API：保留 `margin`、`aspectRatio`、`className`、`style`、`status`、`loadingLabel`、`yDomainTweenDuration`、`yDomainTween`、`xDomain`、`xDomainSlotCount`、`tweenYDomainOnXDomainChange=false`、`onPhaseChange`、必填 `children`。
- 子组件：保留 Line 的 `dataKey`、`yAxisId`、`stroke`、`strokeWidth`、`curve`、`animate`、`fadeEdges`、`showHighlight`、`showMarkers`、`markers`、`dashFromIndex`、`dashArray="6,4"`、loading／pulse／sweep 字段及 `onLoadingPulseCycleComplete`。
- 交互：nearest-point hover、单指查看、双指范围提示、鼠标拖动统计、Brush 可视域、图例联动；只有 ready 且 loaded 时启用数据交互。
- 验收：双轴、多系列、虚线尾部、边缘淡出、标记、loading ↔ ready、reveal 重播与 Brush 后 Tooltip 重定位。

### 5.2 AreaChart

- 根数据、尺寸、margin、status、reveal、y domain tween 和可视域 Props 与参考 LineChart 对齐；children 必填。
- 默认 Area：`curveMonotoneX`、`strokeWidth=2`、`fillOpacity=0.4`、`gradientToOpacity=0`、`gradientSpan=1`、`fadeEdges=false`、`showLine=true`、`showHighlight=true`、`showMarkers=false`。
- 保留 Area 的 `fill`／`stroke`、曲线、渐变跨度、markers、dash tail、loading pulse／sweep 和 `yAxisId`。渐变／纹理 URL 与实色描边分别解析。
- 迁移 `AreaGradientDefs`、`PatternArea` 及 reveal／highlight 共享层；多实例的 fade mask、gradient 和 clipPath 分别隔离。
- **参考 AreaChart 没有 `stacked`、`stackId` 或百分比堆叠接口。** 新主示例展示单面积、多系列叠加和纹理／渐变，现有“堆叠面积”标签及说明改为符合实际的多系列叠加；旧 Recharts 堆叠用法保留在兼容说明中。
- 验收：渐变方向和透明度、单／双轴、line 开关、pattern 填充、加载标签与 hover band，不将多系列叠加描述为求和堆叠。

### 5.3 BarChart

- 数据：`Record<string, unknown>[]`，`xDataKey="name"`；参考为分类 band scale。
- 外观：四边 40px margin，`aspectRatio="2 / 1"`，`barGap=0.2` 是 band 间隔比例；`barWidth` 是可选固定像素宽度。
- 布局：`orientation="vertical"`，支持 horizontal；`stacked=false`，`stackGap=0`；保留 `squareSnap={squareGap, groupGap?, fit?}`。
- 动画／状态：1100ms，保留 `animationEasing`、`enterTransition`、`revealSignature`、`onPhaseChange`；`status="ready"`。children 可省略，用于纯 loading 骨架；空数据 loading 默认生成 12 根骨架柱。
- Bar：保留 `dataKey`、`yAxisId`、`fill`、`stroke`、`lineCap="round"`（支持 butt／数字）、`animate=true`、`animationType="grow"`（支持 fade）、`fadedOpacity=0.3`、`staggerDelay`、`stackGap`、`groupGap=4`、`perspective=false`、`minBarHeight=0`。
- 相关变体：BarSquares／BarColumnTrack 及布局工具，BarDepthProvider／Back／Front／Pulse，BarXAxis／BarYAxis。它们归 Bar 安装条目，不生成额外的图表分类页。
- 交互：按分类定位 hover；分组与堆叠 Tooltip 标记位置、squareSnap 和横向数值轴按参考计算。
- 验收：纵／横、分组／堆叠、实色／渐变／纹理、两种入场动画、squares／depth、loading；不同 gap 字段保持不同单位。

### 5.4 FunnelChart

- 数据保持 `FunnelStage[]`：`label`、`value`、`displayValue?`、`color?`、`gradient?: {offset: string | number; color: string}[]`。
- 默认 horizontal，`layers=3`、`gap=4px`、`edges="curved"`、`staggerDelay=0.12s`，横向比例 `2.2 / 1`，纵向 `1 / 1.8`；`style` 可覆盖布局尺寸。
- 保留 `showPercentage`、`showValues`、`showLabels`，默认均为 true；`labelLayout="spread"`，支持 grouped、`labelOrientation` 和 `labelAlign="center"`。
- 保留受控／非受控 `hoveredIndex`、`onHoverChange(index | null)`、`formatPercentage`、`formatValue`、`enterTransition`、`renderPattern(id, color)` 和 `grid` 对象；grid 默认 false。
- 参考归一化分母为第一阶段 value；显示百分比表示相对第一阶段，不是相邻阶段转化率。stage gradient 的首色决定 halo，内环 gradient／pattern 的优先级按参考渲染分支保留。
- 保留 curved／straight 几何、halo 分层透明度、分段延时、悬停扩张及其他段 dim；不使用 Recharts Funnel 替代。
- 验收：两个方向、两种 edges、spread／grouped、标签对齐、受控图例联动、纹理／渐变、空数据／首项零值与长标签。

### 5.5 HeatmapChart

- 数据保持 `HeatmapColumn[]`：列为 `{bin: number; bins: HeatmapBin[]}`；格为 `{count: number; bin: number; date: Date}`。不是二维数字矩阵，也不隐式把原数据重新聚合成周。
- 默认 margin `{top:28,right:16,bottom:0,left:40}`，`layout="fluid"`、`binSize=0`、`gap=2px`、`weekStartDay=0`；fluid 宽度驱动方格高度，fill 结合父容器尺寸计算方格。
- 保留 `xDomain`、`sizingColumnCount`、`columnSeparators`、`aspectRatio`、`className`、全部颜色覆盖和必填 `children`。
- 动画／加载：`animationDuration=1600ms`、`enterTransition`、`revealSignature`、`enterStaggerScale=1`、`animate=true`、`status="ready"`、`loadingLabel`、`loadingOpacity=0.5`、`showLoadingCells=true`、`loadingCellMaxOpacity=0.5`、`loadingCellRandomness=0.65`。
- 子组件：HeatmapCells 默认 `cornerRadius=2`，保留 `inactiveOpacity`、`inactiveScale`、`activeScale`、`rowOpacity`、`interactive`、`hideGhostCells`；迁移 HeatmapXAxis／YAxis、Separator、Tooltip、Legend、Loading 和日历工具。
- Legend 保留 swatches／gradient、Less／More labels、cellSize 默认 11px、gap 2px、cornerRadius 2px、对齐及交互字段。图表与外部图例通过 HeatmapInteractionProvider／Boundary 共用交互。
- `weekStartDay` 旋转显示行，不能改变原 bin 日期身份；月／季度间隔、范围外 ghost cells、固定 cell sizing 与 Brush 范围变化按参考执行。
- 验收：半年／一年、周日起始／周一起始、fluid／fill、固定 binSize、季度 separator、两种图例、纹理、行透明度、加载波纹、ghost cells 和等级联动。

### 5.6 LiveLineChart

- 数据保持 `LiveLinePoint[] = {time: number; value: number}[]`，**time 为 Unix 秒**；最新目标值通过独立必填 `value` 输入。
- 默认 `dataKey="value"`、`window=30` 秒、`numXTicks=5`、`nowOffsetUnits=0`、`exaggerate=false`、`lerpSpeed=0.08`、`paused=false`。
- 外观：margin `{top:24,right:16,bottom:32,left:16}`，默认容器高度 300px；保留 `className`、`style`、必填 `children`。不添加参考没有的 `aspectRatio`、`status` 或多 series 数据 Props。
- LiveLine 保留 `strokeWidth=2`、`curveMonotoneX`、`fill=true`、`pulse=true`、`dotSize=4`、`badge=true`、`formatValue`、`momentumColors`；迁移 LiveXAxis／LiveYAxis。
- 参考按 rAF 更新 now、displayValue 和 y range，React frame 提交约每 32ms；范围向外立即扩张、向内平滑收缩。Tooltip 在持续更新时按固定 cursor X 重算，不停止在旧采样点。
- `paused` 冻结时间滚动，**不会冻结最新 value 的插值或 y range 变化**；按参考含义保留，并在文档说明。默认 momentum 配色映射现有 chart 槽位，不把 up／down 强制改为 success／danger。
- 数据流由调用方提供，组件不创建 WebSocket 或业务轮询；文档 demo 定时器必须可停止并在卸载时清理。
- 验收：持续追加、30／60 秒窗口、leading offset、paused／resume、exaggerate、badge／pulse 开关、悬停中持续更新、卸载与非法参数。

### 5.7 PieChart

- 数据保持 `PieData[] = {label: string; value: number; color?: string; fill?: string}[]`；fill 支持 gradient／pattern URL。
- 默认 `innerRadius=0`、`padAngle=0`、`cornerRadius=0`、`startAngle=-π/2`、`endAngle=3π/2`、`hoverOffset=10px`，按输入顺序绘制（`sort(null)`）。
- `size` 为可选固定像素边长；未指定时按正方形容器及父尺寸适配。`innerRadius` 是像素，角度是弧度，与 Recharts 的百分比半径／角度 API 不混用。
- 保留 `hoveredIndex`、`onHoverChange`、`className`、必填 children、`enterTransition`、`enterStaggerScale=1`、`geometryScrubbing=false`。
- PieSlice 保留 `index`、颜色／填充覆盖、`animate=true`、`showGlow=true`、`hoverEffect="translate"`（grow／none）、`hoverOffset`、`className`。
- PieCenter 保留总量／当前片摘要、formatter、prefix／suffix、自定义 children；PieCenterShell 保留中心 Portal 布局，container query 字号及 Safari 绘制处理。
- `geometryScrubbing` 时使用普通 SVG path，跳过 Motion path morph；slice padding、hover 留白和中心布局继续用参考几何。
- 验收：solid／donut、固定／自适应 size、三种 hover、受控 Legend、patterns／gradient、数字流动、geometry scrub、零总量与无效数据。

## 6. 共享交互契约与必须修复的问题

### 6.1 保留的交互 API

| 能力 | 必须保留的契约 |
| --- | --- |
| 状态 | `ChartStatus = "loading" | "ready"`；不扩成统一 error／empty／stale API。空、失败及过期等业务状态由调用方外层展示 |
| 阶段 | 保留 loading、exiting、gridTweenReady、revealing、ready、exitingReady、gridTweenLoading、revealingLoading；仅在已有 onPhaseChange 的根组件提供该回调 |
| 运动配置 | ChartConfigProvider 的 tooltipSpring 300／30、tooltipBoxSpring 100／20、highlightSpring 180／28；override 与 fallback 保持参考合并方式 |
| Tooltip | showDatePill／showCrosshair／showDots 默认 true，dotVariant dot／ring、dotSize 5、dotScale 1；保留 indicator、fade、content、rows、dotColor、spring、damping、matchCrosshair、boxSpring、panelStyle 和 backgroundColor |
| Tooltip 回调 | `content({point,index})`、`rows(point)`、`dotColor(point,line)` 的参数保持参考；不改成 Recharts payload |
| Axis／Grid | 保留 XAxis tickMode domain／data、numTicks、tickerHalfWidth；YAxis yAxisId、orientation、numTicks、formatValue；Grid 方向、ticks、fade、edge line、highlight 与 shimmer 配置 |
| Legend | hoveredIndex 的 undefined 表示内部管理，null 表示受控的无 hover；参考 ChartLegend 使用 onHover，组合 Legend 使用 onHoverChange |
| Brush | ChartBrushSelection 为 `{start:Date,end:Date}`；保留 initialSelection、selection、onSelectionChange、direction、window move events、blur、fade、selectionPattern；原回调在拖动预览和结束均可触发，不改成仅结束触发 |
| BrushLayout | 保留 data、xDataKey、xExtentMax、enabled、height、fitMainContent 以及 render props 输出的 xDomain／slot count／selection／handler |
| 临时范围选择 | 时间序列鼠标／双指选择用于统计提示，松开／离开后清除；不误当成持久 Brush zoom |
| 抽稀 | 保留按视图宽度计算的渲染预算；仅优化路径数据，Tooltip、domain 和数据表继续使用原始／可视域原始点 |

文档示例继续使用 `<figure>`／标题和现有 `ChartDataTable` 提供可访问的原始数据。新根组件不强制加入旧 `ChartContainer.dataTable` Props；辅助交互修复在内部实现，并记录与参考的差异。

### 6.2 静态阅读已发现的问题

| 问题与源码证据 | 落地处理 | 验收 |
| --- | --- | --- |
| `chart-loading-label.tsx` 导入不存在于所给目录的 `../components/shimmering-text` | 在新共享模块内补齐私有文字 shimmer；保留可见调用中的字号、字重、tracking、文本及 label 退场参数。准确的原 shimmer 速度／轨迹需要缺失组件源码才能逐项比对，实施记录须单独注明该复原边界 | 独立安装无缺件；loadingLabel 不为空时显示，ready 转换正确退场 |
| Funnel 的 gradient／pattern ID 只包含方向和 index，跨实例可能冲突 | 采用根实例唯一前缀＋stage index；条件渲染的入场／完成分支共享定义内容但不同时挂载；renderPattern 收到对应唯一 ID | 两个漏斗采用不同渐变／纹理时互不串色 |
| Heatmap 的 `heatmapLevelPatternId(level)` 仅按等级命名 | 内部定义和 fill 通过实例作用域统一解析，公共纯函数保持现有调用兼容；自定义 patterns 不串到另一实例 | 两个热图各用不同 levelStyles，引用全部指向各自 definitions |
| `ChartBrush` 解构 `selection: _selection` 后未使用 | 使受控 selection 同步实际选区、轨道遮罩与把手；undefined 使用内部值，null 明确清空；保留回调签名与预览／结束触发契约 | 外部设置、清空、resize、拖动及快速更新都一致，无反馈循环 |
| Funnel 直接用首项 value 作除数；gap 可能大于容器可用尺寸 | 首项非正／非有限时不构造比例 path；保留原始值供外层说明；约束可绘几何为非负，普通有效输入仍用第一阶段分母 | 零值、NaN、Infinity、负值及极窄容器不产生非法 SVG 或虚假百分比 |
| Line／Area 的路径工具对非数字 value 返回像素 y=0，可能把缺失点画到顶部 | 路径分段并保留缺口；动画 path、抽稀和 markers 同步处理，不把 null 当数值零或跨缺口插值；不对有效值改变曲线默认值 | 缺失前后两段不连接，实际零值正常绘制，Tooltip 不捏造数值 |
| 多处 domain／坐标计算只判断 typeof number | 绘制和 domain 使用有限数值；异常值保留在外层原始数据说明中 | NaN／Infinity 不污染坐标轴、路径或 Tooltip |
| nearest-point 的 bisector 假设时间已排序；Live `numXTicks=1` 会出现除零 | 文档要求时间升序，不自动重排输入；保护无效时间、零跨度及非法 window／ticks／lerp，非法选项回到声明默认值 | 有序／重复时间、单点、空点、非法参数不崩溃；保持原索引含义 |
| 参考大量 SVG aria-hidden，交互主要依赖 pointer／mouse；减少动态效果覆盖不一致 | 保留数据表；为可交互根区域补一个键盘入口和焦点标记，方向键／Home／End 查看数据、Escape 清除提示，Brush 把手补键盘操作；减少动态效果时直接落到稳定图形并完成 phase 回调 | 无千级 tab stops；键盘操作不触发文档翻页；减少动态效果下不锁死 loading/reveal |
| Line loading pulse 在回调中创建 timeout；Live、Tooltip、尺寸观察有持续任务 | 审计并清理 timeout／rAF／observer；StrictMode 重挂载时不重复循环；持续 hover 只更新必要上下文 | 卸载后无回调、观察器或动画遗留；暂停滚动的既有语义保持 |
| Tooltip 仅按理想 panel 宽度翻转，长文本与窄容器仍有越界风险 | 保留默认 140px 最小宽度及跟随效果；窄容器按实际可用宽度约束，内容更新重新测量，保留长标签／数值换行 | 390px 页面与较窄嵌套卡片内无横向溢出或误读 |

这些属于修复不可用／错误状态或补足可访问性的改动，应在实施记录中列明，不作为重新设计七类默认外观的理由。有效输入以同尺寸、同数据、同动画配置进行参考对照。

Bar 的参考 max/domain 主要围绕非负分类数值构建。本轮文档声明非负输入；不借本次整理新增正负堆叠算法。非法负值须明确处理并由数据表保留原值，不以绝对值、零值或静默截断伪造柱长。

## 7. 依赖、Registry 与包分发

### 7.1 外部依赖

| 依赖 | 当前状态与处理 |
| --- | --- |
| React／ReactDOM | 项目为 React 19 系列，UI 包 peer 为 `^19.0.0`；保持现有契约 |
| `motion` | 项目与 UI 包已有 `^12.42.2`；新源码统一 `motion/react`，不新增第二套动画运行时 |
| `@base-ui/react` | 已有；参考 Legend Progress 使用其 progress 子路径，Registry 按实际进口声明 |
| `@visx/responsive`、`scale`、`shape`、`curve`、`event`、`group`、`grid`、`pattern`、`heatmap`、`brush` | 当前未在根／UI manifest 声明；按实际模块依赖新增并锁定同一兼容 release 系列 |
| `@visx/gradient` | 参考总出口提供通用渐变；若 chart-core 保留 LinearGradient／RadialGradient 出口，必须显式声明，不能依赖间接安装 |
| `d3-array`／`d3-shape` | 参考代码有直接导入；显式声明直接依赖及所需类型包，不能仅依赖 Visx 间接携带 |
| `@number-flow/react` | PieCenter／ChartStatFlow 使用，当前未声明；添加到使用它的安装条目，保留 SSR 静态文字 fallback |
| `@/lib/utils` | 改成项目 `#system/utils`；Registry 构建时按现有规则重写为消费者路径 |
| ShimmeringText | 所给源码缺件；采用第 6 节的私有实现，不引入整个外部组件库 |

参考目录没有 `package.json` 或 lockfile，无法从这组文件确认原依赖版本。阶段 0 必须在隔离 React 19 消费者内验证所选版本的 peer、类型、构建、Brush 深路径和 SSR；把通过的精确版本写入实施清单与 lockfile。不使用强制忽略 peer 作为发布依据。若具体 Visx 适配器没有可用的 React 19 版本，定点替换该适配器为等几何的内部实现，并重新验证参考 Props；不能回退为 Recharts 近似包装。

### 7.2 Registry 文件归属

新增七类条目和 `chart-core`、`chart-brush` 共享条目；每个真实文件由一个 Registry 条目持有，其余通过 registryDependencies 获得，避免重复安装覆盖共享文件。

| 条目 | 文件归属／依赖方向 |
| --- | --- |
| `chart-core` | 跨类型共享上下文、时间序列壳、交互、Tooltip、Legend、轴／网格／标记／纹理及必要工具；依赖 surfaces、utils、chart-primitives、surface-context，显式声明实际运行时包 |
| `line-chart` | 根、Line、Loading 和仅供 Line 使用的文件；依赖 chart-core |
| `area-chart` | 根、Area、gradient defs、PatternArea、Loading 等；依赖 chart-core；若共享壳实际导入其中工具，则将该工具归 chart-core，避免循环 |
| `bar-chart` | 根、Bar、BarSquares、BarDepth、轴及 Loading；依赖 chart-core |
| `funnel-chart` | 根与专用几何／入场工具；只依赖实际用到的共享文件及 Motion，不强制安装 Brush／Heatmap |
| `heatmap-chart` | Heatmap 目录及出口；依赖所需 chart-core 能力，不反向依赖 line-chart |
| `live-line-chart` | 根、LiveLine、LiveXAxis／YAxis；依赖 chart-core |
| `pie-chart` | 根、context、slice、center、center-shell、stat-flow／typography；依赖实际共享项与 NumberFlow |
| `chart-brush` | Brush、Layout、把手及 track／selection overlays；依赖 chart-core 和 Visx Brush |

此表确定依赖方向；逐文件归属以阶段 0 的完整静态导入图为准。若共享壳间接依赖某个绘图工具，必须把其归到正确的下层，不将漏文件留给消费者修补。

`chart-primitives`、Badge、Alert 的安装闭包继续不包含 Recharts、Visx、D3 或 NumberFlow；旧 `chart` 仍使用 Recharts。通用 chart-core 不导入类型根或 Brush，确保只装漏斗、饼图时不因总 barrel 引入所有图表类型。

新增 `packages/ui/package.json` 的明确 exports。消费者复制代码使用 `@/components/ui/line-chart` 等实际安装路径；包使用方式采用 `@zeron/ui/line-chart`。保持 `.tsx` 导出壳与项目 `#components/*` 映射兼容，内部文件优先用相对引用。

## 8. 文档与示例整理

保留现有 `/docs/components/area-chart`、`bar-chart`、`line-chart`、`pie-chart` 路径，更新安装名和主示例；新增 funnel、heatmap、live-line 三页，并在中英文内容与 Charts 分类同时登记。

| 文档 | 主示例 | 进阶／交互示例 |
| --- | --- | --- |
| LineChart | 单线、轴、Grid、Tooltip | 双轴／多系列、虚线尾部、marker、loading、Brush |
| AreaChart | 默认渐变面积 | 多系列叠加、pattern／edge fade、loading、Brush |
| BarChart | 默认纵向分类柱 | 横向、分组、堆叠、渐变／纹理、squares／depth、loading |
| FunnelChart | horizontal curved、三层 halo | vertical、straight、grouped labels、grid、受控 Legend、pattern／gradient |
| HeatmapChart | 一年日历、cells／axes／swatches | weekStartDay、季度间隔、gradient Legend、levelStyles、loading、范围筛选 |
| LiveLineChart | 30 秒流式线、badge、实时 Tooltip | pause／resume、window／leading offset、momentum colors、停止与重播 demo |
| PieChart | PieSlice、Legend、hover | donut／PieCenter、grow／none、pattern／gradient、geometryScrubbing |

每页展示完整数据表、Props 单位和颜色覆盖方式。基础图及进阶图的预览、代码和 API 表使用同一实现来源；保留旧 Recharts 用法的明确兼容说明。

`donut-chart` 继续解释现有 `DonutSummary` 的 total／剩余轨道，不将它悄悄换成按 slice sum 归一化的 PieChart；可附链接说明新 PieChart 的圆环组合。StatusBarChart、TimeRangeHistogram、ChartPrimitives 与 ChartTokens 维持原入口与领域契约。

需要修改的文档源：

- `docs/lib/chart-types.ts`、`docs/manifest.ts` 及相关分类元数据。
- `docs/components/charts/chart-type-doc.tsx`、`chart-type-example.tsx`、`bar-chart-gradient-example.tsx`；按七类不同数据模型拆成清晰的示例文件，不在一个组件中堆叠大量 kind 分支。
- `docs/pages/components/{area,bar,line,pie,funnel,heatmap,live-line}-chart/page.tsx`。
- `docs/content/en/components/` 和 `docs/content/zh-CN/components/` 对应七页内容。
- `docs/agent-guides/components/` 七类指南及 chart-core／chart-brush 安装与组合指南；更新原 chart 指南的边界说明。
- `scripts/preview-source-allowlist.mjs` 与组件封面来源按实际新增示例调整。

重建文档 loaders、routes、预览源码、Agent 指南 loaders／目录、Registry 与新增亮暗封面。原来“通过 Zeron Chart 组合 Recharts”的说明只用于兼容区，不能继续作为新七类主示例的实现说明。

## 9. 分阶段实施与检查点

| 阶段 | 实施内容 | 进入下一阶段的条件 |
| --- | --- | --- |
| 0 基线与依赖试点 | 冻结源码哈希、Props／默认值、130 文件候选闭包；分配文件归属；验证 React 19 依赖；补齐加载文字；建立同尺寸参考预览 | 依赖版本可安装／构建；缺失文件有明确处理；有效数据的截图、尺寸与动作基线可复用 |
| 1 共享能力 | 颜色映射、上下文、时间序列壳、轴／Grid／Tooltip／Legend、加载生命周期、标记／patterns；修复公共 ID、数值与清理问题 | 多实例／主题覆盖通过；上下文不混用；原 chart-primitives／chart 的兼容回归通过 |
| 2 Line 与 Area | 两个根入口和子组件；Brush 独立入口；补齐受控选区；验证域、抽稀、缺口、reveal | 默认外观与参考对应；公开 API 字段齐全；Brush／loading 转换及复制代码可运行 |
| 3 Bar | 两方向、分组／堆叠、Bar 变体、轴和 Loading；补齐依赖闭包 | gap／圆角／Tooltip 位置匹配；depth 不重复注册 series；独立安装通过 |
| 4 Pie 与 Funnel | 两根、slice／center、NumberFlow、漏斗层／标签／grid；修复多实例 defs 和零分母 | hover 受控／非受控、角度／尺寸、标签和数字变化通过；无异常几何 |
| 5 Heatmap 与 Live | 周列热图、连续等级、Legend／separator／loading；实时线／轴／badge | 日期身份、等级联动、实时追踪、暂停语义和持续任务清理通过 |
| 6 文档与分发验收 | 七类文档、API 表、复制代码、来源与兼容说明；所有生成产物和安装矩阵 | 组件导出、Registry、页面示例、Agent 指南一致；最终产物逐项验证 |

每阶段都维护变更清单与参考差异记录。先迁移默认行为，再迁移该类型的进阶变体；七类和其已列入范围的配套能力全部通过后才算整理完成，阶段通过不代表整轮完成。

工作区任务开始前已有 `docs/components/blocks/BlockPreview.tsx` 修改及其他计划文档；实施时保留，不纳入本次图表文件清单。

## 10. 验证与完成标准

### 10.1 API、逻辑和兼容检查

复用现有 `tests/chart-unification.test.tsx`、`tests/chart-document-examples.test.ts`；新增按用途拆分的 chart API／interaction／lifecycle／distribution／heatmap／live／Registry 测试。参考目录中的 animation、y-domain、decimation、path、reference-area、bar-depth、heatmap 日期／separator／ghost／inactive 等测试迁移并适配路径，保留行为断言。

必要覆盖：

- 七个根 Props 的名字、类型、可选性、默认值与公开子组件一致；重点验证 ms／s、弧度／像素、gap 比例／像素、受控 null／undefined。
- 五色、显式颜色覆盖、纹理／渐变与实色标记、多于五项、主题切换、仅覆盖一个槽位。
- 时间单点／空点、重复时间、缺失值、非有限值、双轴、domain／抽稀／Tooltip 使用不同数据层的正确性。
- Brush 受控状态与 preview／commit 回调；loading／ready 快速切换、reveal 重播、callback 更新、StrictMode／卸载清理。
- Funnel 首项零值、Pie 零总量／无效 slice、Bar 非负输入边界、Heatmap 日期／行轮换／ghost 与 Live 非法参数。
- 旧 TimeSeriesChart、DonutSummary、ChartContainer、ChartLegend、SegmentedBar 的既有测试继续通过；当前 chart-primitives 安装仍无引擎依赖。

### 10.2 浏览器与视觉检查

七类各覆盖浅／深色 × 1440／390px，至少 28 个基础视图；另测较窄嵌套容器、图例长标签、六项以上分类、多实例不同纹理／渐变和 SurfaceProvider 承载面。交互单独覆盖 mouse、touch、keyboard、减少动态效果与状态转换。

阶段 0 的参考预览和新组件使用同一数据、父容器、字体、颜色映射及动画配置。静态视觉比对等待 ready；动画比对固定 elapsed time 和时钟，实时图固定输入时序。检查真实 path、margin、strokeWidth、radius、gap、gradient stop、label 字号、Tooltip／中心布局，而不只判断“存在 SVG”。

颜色允许依方案变化；非颜色几何的差异需要解释，不能用整图截图的色差阈值掩盖。第 6 节列明的正确性与可访问性修复单独验收；缺失 shimmer 源码的复原边界单独记录。

### 10.3 独立安装与生成一致性

在干净 Next／React 19 与 Vite／React 19 消费者中，七个安装条目逐个验证类型、生产构建、真实渲染及依赖闭包；至少一个组合消费者同时安装 Line、Area、Bar、Funnel、Heatmap、Live、Pie、core 和 brush，验证公共文件不互相覆盖。

复制代码消费者执行基础、进阶和加载／交互完整示例；安装命令必须包含示例实际使用的 core、brush、chart-primitives 等条目。记录最终 public/r 文件与闭包哈希，不复用阶段性 Registry 的旧安装证据。

实施期使用项目已有检查入口，新增测试与浏览器脚本完成后接入对应阶段：

```sh
pnpm typecheck
pnpm lint
pnpm lint:design
pnpm test:unit
pnpm tokens:check
pnpm registry:check
pnpm docs:routes:check
pnpm docs:loaders:check
pnpm docs:sources:check
pnpm agents:guides:check
pnpm agents:guides:examples:check
pnpm agents:check
```

生成遵循当前脚本的依赖顺序：先维护源文件，更新 tokens／Registry，再生成文档 loaders 和 routes、预览源、指南 loaders 与 Agent 目录。只修改生成文件不算完成。类型、Registry 和浏览器证据出现新问题时再扩大检查范围。

### 10.4 最终完成清单

- [ ] 七类都有实际包导出、独立安装入口、完整 Props 类型和可运行示例。
- [ ] 参考的默认非颜色样式、交互与已列入范围的变体完整迁移。
- [ ] 所有默认颜色解析到当前 Zeron Token；Heatmap 等级与分类色盘区分。
- [ ] 同名 Tooltip／Legend 与原 Recharts API 的导入边界清楚，旧调用兼容。
- [ ] 缺件、ID 冲突、受控 selection、异常几何和持续任务清理已解决。
- [ ] 数据表、键盘查看、减少动态效果、窄屏与长文本可用。
- [ ] 七类中英文文档、API 表、安装命令、预览、复制代码、指南和封面一致。
- [ ] 本地与干净消费者测试通过，证据对应最终文件及 Registry 哈希。
- [ ] 实施记录列出正常参考行为、必要修复、颜色映射及缺失 shimmer／原主题的复原边界；不将历史 review 结果记为本轮通过。

## 11. 参考根文件指纹

以下 SHA-256 用于实施前核对参考文件是否发生变化；进入实施时同时冻结配套文件清单。

| 参考文件 | SHA-256 |
| --- | --- |
| `area-chart.tsx` | `41e71f6389b6cd1bc68ce0b59c1d5ab4c152215a1b65d06fe51ef5899c12fd0a` |
| `bar-chart.tsx` | `252a46d22fcff1c1396f164abe6264b434f9392baa4294fdb4c2fb2b2af7d37f` |
| `funnel-chart.tsx` | `2f1f5688542b3c525c9e8dce1435bdbe4e71c82e0a6cdb371934d8bb1bd60d27` |
| `heatmap/heatmap-chart.tsx` | `3b04d1c84eb36c55920d1224a8e93557c2af9157fca65b72c90944e0da6e9d5f` |
| `line-chart.tsx` | `0b4ff9fde6e5f38bd58ef11b54b8764342156092d1bba07bdd73525e49fd2b8c` |
| `live-line-chart.tsx` | `431f5fe91c8f3a23508ac308a70c271368d4365b166527c006b2daf391acf278` |
| `pie-chart.tsx` | `d6e0516e1854379fe66489d0e1e9551d583302b8d6e0303560e11eaa8ab9f883` |
