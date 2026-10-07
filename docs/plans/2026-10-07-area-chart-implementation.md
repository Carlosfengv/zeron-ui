# AreaChart 实施记录

启动日期：2026-10-07；验证完成：2026-10-08。状态：组件、安装闭包、文档及相关验证已完成，未提交或推送。

参考源码：`/Users/carlos/Downloads/charts`。实施基线：`9c68a6dc176e7b678db5f3da69314213db2a3a64`。

承接 [七类 Chart 集成方案](./2026-10-07-chart-library-integration-plan.md)：非颜色 API、尺寸和默认运动参数沿用参考实现；颜色接入已有 Zeron 变量。保留旧 `chart` / `chart-primitives` 及使用 Recharts 的业务 Block。

## 1. 交付范围与安装边界

| 入口 | 公开能力 | Registry 文件所有权 |
| --- | --- | --- |
| `@zeron/ui/area-chart` | AreaChart、Area、PatternArea、AreaChartLoading 及 Props | 6 个文件 |
| `@zeron/ui/chart-core` | Grid、XAxis、YAxis、Tooltip 子组件、复合 Legend、ChartLegend、ChartConfigProvider、ReferenceArea、Pattern 系列、上下文 hooks、阶段类型 | 69 个文件 |
| `@zeron/ui/chart-brush` | ChartBrush、ChartBrushLayout、选区和布局类型 | 6 个文件 |
| `@zeron/ui/chart-motion` | 默认入场 transition、duration、easing、clipRevealTransition | 4 个文件 |

工作区入口位于 `packages/ui/src/components/`；内部模块保留在 `charts/`。Registry 消费端对应 `@/components/ui/`。四个新条目现共拥有 85 个源文件（包含 10 月 8 日新增的图例布局辅助组件），文件所有权不重叠。

```sh
npx zeron-ui add area-chart
# 文档全部示例，包括 Brush、原始数据表和按钮：
npx zeron-ui add area-chart chart-brush chart-primitives button
```

Area 自动带入 core 和 motion；Brush 单独安装。Visx 使用 `4.0.0`，D3 array 使用 `3.2.4`，补齐真实 D3 类型；支持 React 19，独立安装未使用 `--force` 或 `--legacy-peer-deps`。由 Visx 4 包根导入 Brush 类型，移除参考代码中未由该版本导出的深层路径。

Funnel 的动画工具转由 chart-motion 单独拥有，Funnel 条目只拥有公开壳与实现两个文件。默认动画数值保持原样；Funnel 安装无需引入 Visx。组合安装验证确认，随后安装 Brush / Funnel 不会覆盖已安装的共享动画文件。

原始 76 个参考文件的 SHA-256、外部依赖与缺失引用保存在 [参考清单](./2026-10-07-area-chart-reference-manifest.json)。本任务范围、共享文件的修改区段和排除项保存在 [任务文件清单](./2026-10-07-area-chart-task-files.json)。工作区同时存在 SalesConversionFunnel / FunnelSeries 与既有区块整理工作，不能将全部未提交文件归入 AreaChart。

## 2. 保留的 API 与默认值

### AreaChart

| 属性 | 默认值 / 语义 |
| --- | --- |
| `data`、`children` | 必填；原始行数组与组合子组件 |
| `xDataKey` | `date`；时间轴 |
| `margin` | top/right/bottom/left 各 40px，支持部分覆盖 |
| `aspectRatio` | `2 / 1`；`style` 可提供固定高度 |
| `animationDuration`、`animationEasing` | 1100ms；`cubic-bezier(0.85, 0, 0.15, 1)` |
| `enterTransition` | Motion transition；SVG 宽度裁剪采用 tween |
| `revealSignature` | 值改变后重播入场 |
| `status`、`loadingLabel` | 默认 `ready`；加载状态及可选居中文字 |
| `yDomainTween`、`yDomainTweenDuration` | true、500ms |
| `xDomain`、`xDomainSlotCount` | Brush 可视时间域及完整行数 |
| `tweenYDomainOnXDomainChange` | false；Brush 改变可视域默认不补加 Y 轴过渡 |
| `onPhaseChange` | 原阶段回调，包含 loading/exiting/gridTweenReady/revealing/ready/exitingReady/gridTweenLoading/revealingLoading |
| `className`、`style` | 容器定制；保留参考布局和尺寸覆盖能力 |

### Area 与配套能力

| 属性组 | 默认值 / 语义 |
| --- | --- |
| `dataKey`、`yAxisId` | 必填系列字段；轴组默认 left |
| `fill`、`stroke`、`strokeWidth` | chart-1；stroke 随 fill；2px |
| `fillOpacity`、`gradientToOpacity`、`gradientSpan` | .4、0、1 |
| `curve`、`animate` | curveMonotoneX、true |
| `showLine`、`showHighlight`、`showMarkers` | true、true、false |
| `fadeEdges` | false；另支持 true / left / right |
| `markers` | 参考点半径、描边、环样式 |
| `dashFromIndex`、`dashArray` | 显式尾段起点；默认 `6,4` |
| `loading`、`loadingPulseMode` | 跟随阶段，可显式关闭或覆盖 loop/exit/enter |
| `loadingStyle`、`loadingStroke`、`loadingStrokeOpacity` | pulse；fg-default；.5，另支持 sweep |
| PatternArea | dataKey、patternId、curve；仅纹理填充，按参考方式与 Area 叠加 |

系列采用重叠面积语义，无 `stackId`，不引入 Recharts 堆叠。多系列示例显式指定 chart-1/2/3，不按渲染下标自动分配颜色。双 Y 轴通过 yAxisId + YAxis 组合。

AreaChartLoading 保留 margin、stroke、strokeOpacity=.5、gridStroke、gridShimmerStroke、gridShimmer=true、gridShimmerLength=140、gridShimmerSpeed=1、gridShimmerSync=false、loadingStyle=pulse、label=Loading、aspectRatio=2/1、className。

ChartTooltip 保留日期胶囊、十字线、dot/ring、5px 默认点、rows/content、spring 配置、damping=20、matchCrosshair=false、panelStyle 和背景覆盖等参考 API。TooltipBox offset=16px。XAxis 默认 5 刻度和 data tickMode；YAxis 默认左侧、5 刻度，保留格式化与轴组。完整类型定义以四个公开入口的 Props 为准。

### Brush

| 属性 | 语义 |
| --- | --- |
| `selection` | undefined 为非受控；null 清除；对象为受控 |
| `initialSelection` | 非受控初始 Date 范围 |
| `onSelectionChange` | 预览与提交均通知；prop 同步不额外通知 |
| `brushDirection`、`useWindowMoveEvents` | horizontal、true |
| `selectedBoxStyle`、`selectionPattern` | 参考 SVG 选区定制 |
| `blurPx`、`fadeOuterEdges` | 0px、false；按用户 10 月 8 日明确要求调整默认值 |

可见手柄保留 24×4px，原生命中范围 8px。按用户追加方向，未选时间范围以灰色中性色显示（grayscale + muted 透明层），默认移除高斯模糊和外侧淡出，整个选择轨道添加 1px border，清除后仍保留；选中范围保持系列原色。blurPx / fadeOuterEdges 仍允许显式覆盖，保持已有 API。ChartBrushLayout 保留 data、xDataKey=date、xExtentMax、enabled、height、fitMainContent=false、className、children(layout)、brushStrip(layout)。布局的清除恢复完整时间域；独立 ChartBrush 的 null 清除实际原生选区。

## 3. 样式与颜色接入

| 参考角色 | Zeron 变量 |
| --- | --- |
| 默认主 / 次系列 | chart-1 / chart-2；额外固定系列显式选择 chart-3/4/5 |
| 普通 / 次要 / 弱化文字 | fg-default / fg-muted / fg-subtle |
| 网格与标记边框 | border |
| Tooltip 和标记背景 | surface-floating |
| 图表背景擦除与遮罩 | 根据 useSurface 获取 surface-base/raised/floating，经实例私有变量传递 |
| 选区背景 / 边框 | selection / focus-ring |
| 徽章 / 图例底色 | muted、surface-floating |
| 默认纹理 | chart-5 |

映射集中在 chartCssVars；不新增颜色 Token，不修改全局调色板。加载 sweep 使用 alpha mask，使现有 fg 色值不改变遮罩透明度。

margin、线宽、渐变透明度、曲线、fade、手柄、Tooltip blur 与运动数值沿用参考。`text-xs` 映射为 `text-label`（12px/16px），`text-sm` 映射为 `text-body`（14px/20px）；保持对应像素大小。数字 z-index 转为原值 style，未加入 lint 豁免。

提供的参考目录没有原项目全局主题，因此依赖原 Tailwind theme 的圆角、阴影与字体族无法确认逐像素一致；本实现保留相应参考类名，未擅自改为另一套尺寸。缺失的 `../components/shimmering-text` 使用私有文字渐变辅助组件补齐，尊重减少动态效果；原依赖的精确动画时序无法验证。该辅助组件没有新增公开入口。

## 4. 缺陷修复与交互

- 有效日期按时间形成绘图视图，不修改输入数组；无效日期只从绘图排除。Date 原始文本使用 ISO 格式，避免服务端与浏览器时区导致 hydration 文本不同。
- null / undefined / NaN / Infinity 作为断点，面积、线和纹理使用有限值 `.defined`；标记不绘制无效点，默认 Tooltip 显示“—”。LTTB 抽稀保留断点及相邻观测，长缺失段不强制保留全部行。
- 隐藏原始数据保留全部输入行，包括无效日期、零宽、空图及大量数据；文档数据表使用原始字段。零值与缺失值分开。
- 空数据、无有效日期或无法留出绘图区的容器不生成无效 SVG；空态和业务错误文案交给宿主。
- 内置 gradient / clip / mask 使用实例唯一 ID；自定义 PatternLines 的 patternId 由调用方 useId 生成。
- 每张图表一个主 Tab 停靠点；方向键、Home、End 导航观测，Escape 与 blur 清除。键盘动作取消待处理的指针帧，数据变化后更新或清除已有 Tooltip。
- Tooltip 使用 ResizeObserver 测量实际大小，在根容器两个方向翻转并夹紧，长标签换行；保留显式 left/top 的定位覆盖。
- 减少动态效果关闭入场与加载循环，阶段仍可完成；补齐加载覆盖层禁用时的阶段兜底，并清理循环 timer、rAF 和 observer。
- Brush 受控值同步原生 Visx 选区、覆盖层与手柄，null 确实清除；拖动期间不重挂载，非受控选区在 resize 后按时间域保留。手柄支持方向键、Home/End、Escape；清除后提供“Select full range”键盘入口，恢复后把焦点交回手柄。

## 5. 文档与验证

Area 文档升级为 5 个完整、可复制的客户端示例：基础面积、多系列与双轴、渐变/边缘/标记/虚线及纹理、加载与重播、受控 Brush。包含 7 张预览图、原始数据表、中英内容、API 说明、安装命令和明暗封面。Agent 元数据与四份使用指南已同步。

| 检查 | 结果与证据 |
| --- | --- |
| Area / Funnel / 复制示例 | 3 个测试文件，69 项通过；`output/playwright/area-chart-final-unit.log` |
| UI 包与工作区类型 | 均通过；`area-chart-package-typecheck.log`、`area-chart-typecheck.log` |
| 全量 ESLint / design lint | 均通过；`area-chart-full-lint.log`、`area-chart-full-design-lint.log` |
| Registry | 153 条完整闭包通过；当前总数包含另一项区块开发，不全属于本任务 |
| Agent catalog / 指南例子 | 目录检查通过；31 份含代码指南、32 个 TSX 示例通过 |
| 独立 Next / Vite | npm 安装、类型检查、生产构建通过；五个复制示例与 Brush、Funnel 同装通过 |
| 浏览器 | 两个独立生产消费项目检查键盘、指针、触屏、Brush 清除/恢复、加载转 ready、减少动态效果、390px 明暗模式；无页面错误或横向溢出 |
| 边界数据 | 缺失和 Infinity 保留断点；无效日期、空数组、零宽、180px 容器、缩放父容器、10,000 行；SVG 不含 NaN/Infinity，原始行保留，窄及缩放容器 Tooltip 位于边界内 |

独立消费项目构建证据：`output/playwright/area-chart-consumers.log`、`area-chart-combined-consumers.log`、最终 Next 刷新记录 `area-chart-final-next-consumer.log`；运行证据：`area-chart-consumer-browser.json` 及 `area-chart-{next,vite}-mobile-{light,dark}.png`。最终两个消费项目的 168 个安装文件经 TypeScript 格式与系统路径归一化后与 84 个源文件一致，记录为 `area-chart-installed-source-parity.json`。Browser 验证使用本地固定数据，未涉及远端业务服务。

静态使用报告检查明确的 85 个文件，85/85 覆盖、0 错误、0 警告；识别 88 种组件、169 次 JSX 使用。详见 `.zeron/reports/area-chart/after.md` 与同名 JSON。自动来源统计对 17 个 Motion/Visx 动态组件仍标记 unchecked；人工已追踪其导入与别名，不把该工具的来源统计状态改写为通过。没有可比修改前报告，不提供“新增/消除”归因或覆盖率百分比。动态 style 和 SVG 几何属于参考 API，未启用的内联样式、动态类名、restyle 与 arbitrary-value 规则不能算作已检查。

全量单元测试：265 个文件，2,417 项通过、3 项失败，因此全项目测试状态仍为失败。三项均来自同期 SalesConversionFunnel 区块开发：两项业务资产目录 / data-block 列表尚未包含新条目，一项新区块的 text-4xl 未采用语义字号。证据为 `output/playwright/area-chart-final-full-unit.log`，未修改该任务的源码或放宽检查规则。

## 6. 提交边界

本轮没有创建 commit、推送 main 或发布 Registry。后续提交须以任务清单核对；共享元数据、Funnel 的 Registry 文件及生成文件应按实际修改区段拆分，不能直接提交整个 dirty tree。

经 10 月 8 日完整审查，建议将实现、安装闭包、测试、文档与 Agent 资源合并为一个完整 feature commit。当前 AreaChart 尚未在 main 发布，不拆分成不完整的过渡提交。具体范围、共享文件选择与验收见 [审查和提交计划](./2026-10-08-area-chart-review-commit-plan.md)。

## 7. 10 月 8 日时间选区视觉调整

按用户截图与明确追加要求，Brush 的未选区域改为中性色灰度，默认 blurPx 从 1.5 改为 0、fadeOuterEdges 从 true 改为 false；选中区域保留原系列色。整个轨道新增使用 border 变量的 1px 边框，清除选区后继续显示，边框不拦截指针。这是用户指定的样式调整，优先于最初沿用参考默认样式的约定。

文档预览与复制代码显式使用新默认值，中英文行为说明、Props、Agent 指南和 Registry 已同步。本次相关 49 项测试、UI 类型、普通 lint、全量 design lint、Registry 和 Agent 检查通过。明确检查 4 个实现 / 文档文件，4/4 样式检查覆盖，0 错误、0 警告，基线比较无新增诊断；报告为 `.zeron/reports/area-chart-brush-neutral/after.md` 与同名 JSON。自动来源统计仍有 BrushComponent 别名这一项 unchecked，实际来源为 @visx/brush。

浏览器证据保存在 `output/playwright/area-chart-brush-neutral-{light,dark,mobile-dark}.png`、`area-chart-brush-neutral-browser.log` 和 `area-chart-brush-neutral-drag.log`，检查灰度无 blur、拖动、清除后边框及键盘恢复。文档站已有导航 hydration 警告未计为图表错误，未在本轮修改导航代码。

## 8. 10 月 8 日图例布局定制

按用户要求，ChartLegend 和复合 Legend 共享新增布局能力：layout="stack" | "inline"、overflow="wrap" | "collapse"、maxVisibleItems、renderOverflowLabel(hiddenCount, expanded)。默认仍为 stack + wrap，原调用保持每行一项；Area 多系列示例改为 inline + collapse，三个完整标注/数值在宽屏同行显示。

折叠模式根据实际容器、项目与展开按钮的宽度确定首行项目，完整项目作为单位隐藏；允许显式限制最大项目数。原内容只渲染一份，折叠项使用 aria-hidden 和 inert 排除读屏与键盘停靠。展开/收起是有 aria-expanded / aria-controls 的原生按钮，可自定义文案；重新测量时若当前焦点所在项目被收起，焦点移至展开按钮。ResizeObserver 与字体就绪监听更新测量，卸载后清理，不改变原 hover 下标或数值格式化。

新增内部 `charts/legend/legend-layout.tsx` 由 chart-core 单独拥有，没有新增运行时依赖。按用户进一步明确要求，布局由 API 配置，文档没有同行/逐行或折叠/换行切换按钮；示例固定 inline + collapse，宽度不足自动折叠，更多/收起仅控制内容披露。中英 Props 说明及 Agent 指南同步。最终相关 57 项测试通过，包含 6 项新布局测试：默认兼容、宽度预算、展开/收起、resize 与数值更新、隐藏焦点、复合 Legend hover。

验证记录：`output/playwright/area-chart-legend-{unit,typecheck,workspace-typecheck,design,lint,browser}.log`。浏览器确认宽屏三个完整项目同一行、390px 自动折叠、Enter 展开 / Space 收起、恢复宽屏自动显示全部、无布局设置按钮及无横向溢出。明暗及窄屏截图为 `area-chart-legend-inline-{light,dark}.png`、`area-chart-legend-collapsed-mobile.png` 和 `area-chart-legend-expanded-mobile.png`。Registry 153 项、Agent 166 项 / 60 指南检查通过；独立 Next 消费项目刷新安装、共享 motion 同装保留、五段复制示例的类型与生产构建通过，见 `area-chart-legend-consumer.log`。

本次样式报告明确覆盖 7/7 个文件，识别 31 种组件、81 次 JSX 使用，0 错误、0 警告，报告位于 `.zeron/reports/area-chart-legend-layout/after.md`。新增文件没有修改前基线，不自动归因诊断；未启用的内联样式 / 动态类名 / restyle / 任意值检查仍未检查。图例复用 chart-core 公开 API，新增布局是共享内部辅助，不新增 Registry 依赖，颜色沿用已有 fg / muted / focus-ring 与系列变量。文档站已有导航 hydration 问题仍保留原记录；独立生产消费者通过窄屏折叠、键盘展开和宽屏同行核验，测试期间无运行错误或失败请求，结果保存在 `area-chart-legend-consumer-browser.log`。该临时消费者首次打开曾因缺少 favicon 返回 404，已在测试宿主补充图标，不涉及组件源码。

## 9. 10 月 8 日完整 review 与优化

修复 LTTB 首桶漏峰及末桶重复、加载打断拖拽后悬停失效、非受控 Brush 清除恢复与时间域同步、无效/域外选区回退、Y 域补间选项变化中断、虚线高度变化错位、图例披露按钮消失后焦点丢失及长文本溢出。减少动态效果进一步覆盖轴、标记与高亮；路径测量只在需要时启用，隐藏原始行按 data 缓存。元数据移除无关格式化变更。

最终相关 6 个测试文件 95 项通过，UI / 工作区类型、普通 lint、全库 design lint、Registry 153 项、Agent 166 项 / 60 指南及指南例子检查通过。两个 Next / Vite 消费项目刷新实际安装、生产构建及浏览器验证通过；85 个源文件对应 170 份安装文件，实现经 TypeScript 格式、注释及 lib 路径归一化后一致。证据使用 `output/playwright/area-chart-review-*` 前缀。

本轮全量单测为 2442 通过、1 失败（267 个文件通过、1 个失败）；剩余 SalesConversionFunnel 的 text-4xl 语义字号检查未在本任务修改。前述第 5 / 7 / 8 节为各阶段历史验证数量，不替代此最终结果。工作区全量状态仍为失败。

明确的 review 样式范围为 86 个文件，86/86 覆盖、89 种组件、171 次 JSX 使用、0 错误、0 警告。已有审查前基线只支持本轮比较，新增诊断为 0；17 处动态别名及未启用规则保留 unchecked。报告位于 `.zeron/reports/area-chart-review/`。

审查期间另一项任务将 main 更新至 `65fc0baeaa7dc2f5acf387a95d77400482c89d95`，保留已提交的 Sales / FunnelSeries 实现。本轮未修改暂存区或提交推送；尚未执行 Area 专属候选树和整站生产构建。推荐一笔完整提交，执行边界与步骤以 [最新审查和提交计划](./2026-10-08-area-chart-review-commit-plan.md) 和 [提交文件快照](./2026-10-08-area-chart-commit-files.json) 为准。

## 10. 用户授权后的提交验证

用户随后授权提交 GitHub main。基于 `65fc0baeaa7dc2f5acf387a95d77400482c89d95` 的隔离候选树包含 125 个计划文件，没有纳入 BlockPreview 工具栏和旧区块计划。Registry / Agent 资源由候选源码重生成；9 份生成文件与审查版本一致。

隔离相关 95 项、UI / 工作区类型、普通 / design lint、Registry、Agent、指南例子检查通过；全量单测仍为 2442 通过、1 项 Sales 字号检查失败。四个全新 Next/npm、Vite/npm 的 Area / Funnel 安装、类型与生产构建通过。整站生产构建及 7 张 Area 文档图的宽窄屏、键盘、图例展开、选区灰度 / border / 清除恢复、加载和暗色核验通过。没有图表或导航运行错误；本地 Vercel 两项统计脚本 404 单独记录为环境问题。

此次执行采用一笔完整 feature commit，详细证据与执行边界见 [审查计划第 7 节](./2026-10-08-area-chart-review-commit-plan.md)。Git 提交及推送结果保存实际 SHA；不把前面审查阶段“未提交”的历史状态当作当前执行状态。
