# 剩余五类 Chart 实施记录

日期：2026-10-08。基线：`fadf9639a5eacc91b886b77cdad990cbe2f9f450`。

第 1～6 节保留初次实施验收快照；DonutChart 合并及后续圆环样式调整见第 7 节。

已完成 LineChart、BarChart、PieChart、HeatmapChart、LiveLineChart 的开发、分发与文档接入。加上已完成的 AreaChart、FunnelChart，原方案中的七类 Chart 均有真实组件入口。新增引擎使用参考实现的 Visx／D3／Motion 组合；默认颜色接入 Zeron 现有 Token，未替换旧 `@zeron/ui/chart` 的 Recharts 契约。

## 1. 交付与文件范围

| 入口 | 本轮能力 | 文档示例／API 字段 |
| --- | --- | --- |
| `@zeron/ui/line-chart` | 多系列／双轴、缺口、Marker、虚线尾部、边缘淡出、加载／重播、受控 Brush | 5／57 |
| `@zeron/ui/bar-chart` | 纵向／横向、分组／堆叠、圆角、渐变／纹理、Squares／Track、Depth／Pulse、加载／重播 | 8／71 |
| `@zeron/ui/pie-chart` | 实心／圆环、受控／非受控 hover、translate／grow／none、渐变／纹理、scrub、PieCenter／PieCenterShell | 5／50 |
| `@zeron/ui/heatmap-chart` | 周列／日期格、行轮换、连续五级颜色、Legend 联动、季度间隔、fluid／fill／固定 binSize、范围／加载 | 6／87 |
| `@zeron/ui/live-line-chart` | Unix 秒采样、独立最新 value、30／60 秒窗口、leading offset、插值、momentum、badge／pulse、暂停滚动 | 3／29 |

共 27 个完整复制示例和 294 个 API 字段。API 表由 TypeScript 类型与源码默认值生成；`docs:charts-api:build`／`check` 用于后续同步。中英文页面、真实 Registry 身份、Agent 指南、导航和亮／暗封面均已更新。

文件范围见 [任务清单](./2026-10-08-remaining-charts-task-files.json)：114 个维护文件、30 个生成文件；其中组件使用与样式报告覆盖 65 个源码文件。无删除文件。任务开始前的 BlockPreview 改动和 17 份其他计划文档保留，不属于本次修改；18 个文件的 SHA-256 与先前保存的工作区证据一致。

参考来源见 [98 文件指纹清单](./2026-10-08-remaining-charts-reference-manifest.json)；公开类型见 [37 组 Props 基线](./2026-10-08-remaining-charts-api-baseline.json)。已有共享壳与 Area／Funnel 修复继续复用，未用原始参考文件覆盖已修复的共享源码。

## 2. 契约、取色与必要修复

正常输入继续使用参考 margin、曲线、线宽、半径、间距、透明度、布局及运动参数。新增五类的根 Props 与公开子组件字段保持参考类型、可选性和单位；Pie 半径为像素、角度为弧度，Bar 的 barGap 为比例，groupGap／stackGap 为像素，Live 的 time 为 Unix 秒。`paused` 仅冻结滚动，最新 value 和数值域仍可插值。

普通系列使用 `--chart-1` 至 `--chart-5`，结构／文字／浮层使用现有语义变量。Heatmap 使用 `--muted` 和 `--chart-1` 的 25%／50%／75% 混合形成五级连续颜色，阈值仍为 <=0、1、2、3、>=4。实例承载面沿用 `SurfaceProvider`；作为透明度算法的 SVG mask 黑／白不改成业务色。

| 修复 | 原因与结果 |
| --- | --- |
| Line 缺口和动画路径 | null／NaN／Infinity 不再画到顶部或跨缺口连线；有效点保持原始路径形状。路径插值从实际已显示帧开始，terminal marker 不重复参与域／系列注册。 |
| Bar 非法值与深度层 | 有限、非负数值才参加绘制和域计算；负值／异常值仍保留在原始数据说明。Depth／Pulse 不增加系列数。自定义 groupGap 与 Tooltip 点定位一致；加载回调正确报告 loading。 |
| Pie 几何与状态 | 保留输入顺序及原下标；非法／零值不绘制或进入键盘选择。非受控 hover 同样触发 onHoverChange。NumberFlow 首次服务端与客户端都显示静态值，挂载后再启用数字变化。Motion 路径具备明确初始值。 |
| Heatmap 布局与隔离 | Visx 4 ParentSize 的绝对定位会使 fluid 根容器高度归零，改用同包 useParentSize 测量根节点，让参考计算出的高度参与文档流。窄屏省略会重叠的轴标签；格子 gap 限制在实际格子尺寸内。Pattern 及 swatch ID 使用实例作用域，原无 scope 纯函数调用兼容。 |
| Heatmap 交互与清理 | 键盘遵循 interactive／hideGhostCells，跳过非法值；loading 清除提示并禁用入口。加载脉冲的 Motion 和等待 timer 在卸载时清理。 |
| Live 域、Tooltip 与任务 | 空历史数据时 latest value 仍进入 Y 域；派生视图过滤无效时间／数值并排序，原数组不变。非法 window／ticks／lerp／offset 回到安全默认值。Tooltip 变化包含实际时间和数值，不会因变化不足一像素保留旧值；提交沿用约 32ms 节奏。卸载取消 rAF，键盘播报不随每帧重复。 |
| 可访问性与原始数据 | 每个交互区域一个键盘入口，方向键／Home／End 查看、Escape 清除；不创建大量格子 tab stops。图表保留原始输入说明，文档用 figure 和 ChartDataTable。减少动态效果时直接完成稳定展示。 |

中心字号的 `clamp(0.75rem,22cqw,1.875rem)`／`clamp(0.625rem,9cqw,0.75rem)`、Marker 的 10px 字号和 Live 标签的局部 zIndex 50 以显式样式保留参考数值。它们属于图表几何，未替换为会改变显示的项目字号／层级预设；也未放宽检查规则。

图例 layout／overflow 使用既有 API 配置，不新增给终端用户切换图例布局的控件。Line 使用已修复的 Brush：选区外默认中性灰、无 Gaussian blur，清空后轨道边框仍存在。

## 3. 分发与依赖

新增五个包 exports 和 Registry 根条目。核心共享文件有唯一 Registry 所属条目；根条目依赖 chart-core，core 不反向导入根或 Brush。原 chart-primitives 仍不引入 Recharts、Visx、D3、NumberFlow 引擎。补齐的直接依赖为 `@visx/group`／`heatmap`／`gradient` 4.0.0、`d3-shape` 3.2.0、`@number-flow/react` 0.5.10；继续使用已有 Visx 4、D3 Array 3.2.4 和 Motion 12。根项目新增 `@visx/curve` 4.0.0 仅用于直接路径测试。锁文件同步更新。

每个新根在独立 React 19 的 Next 与 Vite 消费者中，通过真实打包 CLI、HTTP Registry 和自己的依赖安装验证；共 10 个独立安装／类型／生产构建。最后的 Heatmap 交互修复再次更新其两个独立消费者及两个组合消费者。组合安装覆盖七类、Brush、Button、ChartPrimitives，确认共享 animation 文件不被重复安装覆盖，并编译全部 27 个复制示例。

最终 Registry 闭包哈希和消费者源码一致性记录：`output/playwright/remaining-charts/distribution-hashes.json`。哈希包含递归安装的 Registry 文件；944 个消费者 TS／TSX 文件在 CLI 导入路径重写后、忽略格式与注释进行 AST 对比，不能将 canonical JSON 的占位 alias 直接当成消费者文件。

## 4. 验证记录

| 检查 | 结果与范围 |
| --- | --- |
| 本轮定点测试 | 14 个文件、133 项通过；覆盖参考日期／separator／ghost／inactive／路径／depth 测试、37 组类型契约、Registry 归属、数据异常、hover、加载、键盘、SSR 数字与持续任务。 |
| 全量单元测试 | 最终全量运行 2569 项通过、1 项既有失败：SalesConversionFunnel 的 text-4xl 违反字号规范。其源码及此前 Area 提交证据已存在该问题，本轮未扩大范围修改。完整统计见 `output/playwright/remaining-charts/verification.json`。 |
| 类型／普通 lint／设计 lint | 工作区通过；没有新增规则豁免。 |
| Registry／生成一致性 | Registry 158 项、文档 loaders 131 页、split routes 127 页、预览源码 48 项、Agent 168 项／65 指南及 Token 检查通过。 |
| Agent 完整代码示例 | 36 指南、38 个 TSX 示例通过。 |
| 独立消费者 | 五根 × Next／Vite 的安装、类型和生产构建通过；组合消费者全部 27 个复制示例及 Area／Funnel 共存构建通过。 |
| 文档浏览器 | 七类 × 1440／390px × light／dark 共 28 组；无无效 path、负尺寸、重复 SVG ID 或页面横向溢出。 |
| 消费者浏览器 | 两框架各 29 个示例区（27 新示例＋Area／Funnel），宽／窄、亮／暗共 8 组；五类键盘 End／Escape、Live 暂停／停止来源、加载／重播、Brush 清空和 Heatmap 范围切换复核。 |
| 参考几何 | 独立参考预览复制冻结的 98 文件。五类在同输入和尺寸下的 SVG width／height、路径、rect／circle 几何和线宽逐项相同；Live 固定时钟与 value，使用 paused。不是全变体／动画逐帧比较。 |
| 文档站生产构建 | 通过；最终 5 页 × 中英文共 10 个生产页无组件运行错误、重复 SVG ID 或布局溢出。本地 Vercel 分析脚本的 404 单独保留在证据中。 |

原参考 heatmap ghost 测试依赖真实当天日期，已固定测试时钟为 2026-07-01；季度边界测试中，Sep 28 周包含 Oct 1，边界仍在第 0 列，修正原错误的第 1 列断言。其他迁移断言保留。新增 Bar Tooltip 用例等待容器测量和 ready 后再触发键盘，避免测量前误读尚未可交互的状态。

浏览器、参考几何、交互和构建附件位于 `output/playwright/remaining-charts/`；组件与样式附件位于 `.zeron/reports/remaining-charts/`。这些本地证据目录按项目忽略规则保存，不作为公开文档资源发布。部分 Vite 浏览器首次访问会请求不存在的 favicon；与组件异常分开记录，实际交互复查没有资源失败。减少动态效果的 Motion 开发提示不作为产品错误。

## 5. 组件与样式报告

**统计：**65 个明确源码文件；识别 131 种来源／导出组合、376 次 JSX 使用，其中 UI 59／209、内部辅助 28／29、文档组合 32／104、第三方 12／34。设计静态检查覆盖 65／65，0 错误、0 警告；显式 var 引用 14 种，仅为词法统计，不代表 Token 合规百分比。基线只覆盖 4 个既有文件，新文件没有前置覆盖，因此新增／修复归因保持未验证，未用整棵 dirty tree 扩大范围。

**组件：**图表使用本轮真实五类入口及 chart-core／Brush；文档沿用 Button、ComponentPreview、DocPage、PropsTable、ChartDataTable。自绘 SVG 与参考 Motion、Visx、NumberFlow 是指定迁移实现，现有 Recharts 包装无法提供完全相同的数据／交互契约。

**问题与说明：**报告器有 25 个 motion.rect／g／path 等动态来源待确认项，已人工追到 `motion/react`，不将自动 inventory 的未解析结果改写为通过。内联样式、动态类名、覆盖以及任意值未启用自动检查，已针对取色和参考数值人工核对；中心字号、Mask 与局部层级的保留理由见第 2 节。详细位置保留在 after.json。检查范围内未发现新的组件／默认取色违规；不据此宣称全项目或所有运行状态通过。

## 6. 未校准与范围外项

参考目录缺少原项目全局主题 CSS 及 ShimmeringText 实现。本轮沿用已补齐的私有加载文字；独立参考夹具只用静态 span 填补这个缺件，五类基础几何对照不依赖该文字。原 shimmer 的准确轨迹／速度、原主题决定的所有 utility 计算值仍未校准，不报告逐像素或全动画一致。

浏览器重点覆盖桌面 pointer、键盘、减少动态效果、加载和所列尺寸；新五类未额外做所有真机 touch／手势及每个 SurfaceProvider 层级的穷举。Live demo 是可停止的本地采样源，不等于已经接入 WebSocket 或生产数据。其他图表类型、业务 Block 迁移、原有 SalesConversionFunnel 问题和发布均不属于本轮。未执行新的 Git 提交或推送。

## 7. DonutChart 合并与圆环样式追加

按用户后续要求，移除独立 DonutChart 目录项，将完整分配与未分配总量两组示例迁入 PieChart。旧 `/docs/components/donut-chart` 路径永久跳转，保留语言；旧简写入口指向 PieChart。历史 Agent 文档身份标记 retired，`donut-chart` 别名归入 PieChart。删除闲置的 DonutChart 文档、翻译和封面；既有业务 Block 的 DonutSummary 不变。

示例使用 PieChart／PieSlice／PieCenter 与 chart-core 的 ChartLegend，桌面端左右排列，窄屏上下排列。完整数据为 48、28、16、8；未分配示例保留业务总量 100，显式追加中性灰色 8，默认中心为已分配 92，悬停／键盘查看时显示所选扇区。图例占比和数据表都包含未分配值，不将 92 归一化为 100%。PieChart 页现有 6 个示例，七类文档合计 28 个；API 字段数不变。

两组圆环均设置 `cornerRadius={4}`。用 ResizeObserver 测量容器，按 D3 默认 pad radius `hypot(innerRadius, outerRadius)` 将 2px 间距换算为 `padAngle = 2 * asin(1 / padRadius)`，保留已有像素半径／弧度角度 API。没有新增样式变量或图例布局选择控件。

修正 PieCenter 的自定义渲染只在悬停时生效的问题：默认状态同样调用 children，`data` 为 defaultLabel／totalValue 摘要；悬停状态仍返回真实输入项。两处 PieSlice 入场路径补齐 `initial={false}`，消除 opacity 从 undefined 开始的 Motion 提示。

追加验证：6 个相关测试文件、97 项测试通过；工作区类型检查、Next／Vite 中两份复制示例类型检查、全量设计检查、Registry／文档生成器／Agent 检查及最终生产构建通过。8 组中英文 × 1440／390 × 浅深色浏览器检查覆盖两组圆环，验证左右／上下布局、默认中心、百分比分母、键盘／图例联动、跳转及页面溢出。沿圆环中线采样的四处间距为 1.975～2.054px，采样精度约 0.079px；真实路径包含 4px 圆角。生产检查无图表运行异常；本地 Vercel analytics／speed-insights 脚本 404 单独记录。英文开发页面出现宿主 Button／NavItem／ScrollArea 的 useId 水合提示，清理开发缓存后仍可复现；未在本任务内修改宿主组件或将这些提示计为通过。

组件与样式统计：7 个明确源码文件，37 种来源／导出组合、80 次 JSX 使用，其中 UI 12／27、内部辅助 2／2、文档组合 12／36、第三方 11／15；静态检查覆盖 7／7，0 错误、0 警告。组件组合复用既有 PieChart、图例与数据表；尺寸观察和占比计算由示例负责。报告器的 8 个待确认引用人工追到 motion/react 和旧 chart 导出的 Recharts Tooltip，自动 inventory 保持 unchecked；内联样式等未启用项与仅覆盖 3 个文件的基线不作完整归因。详细报告为 `.zeron/reports/pie-donut/after.json`，浏览器、构建和范围证据为 `output/playwright/remaining-charts/pie-donut-*`。18 个无关工作区文件哈希保持不变，未提交或推送。

### 180px 示例尺寸追加

PieChart 页的六组示例统一为 180 × 180px。五处图表使用公开 `size={180}`；独立中心示例使用 `contextSize={180}` 和 180px 外部布局区域。固定尺寸后移除示例 ResizeObserver，以实际外半径 80px 重新计算圆环间距，继续保持 2px 间距／4px 圆角。六份复制代码、Agent 基础示例、中英文说明和浅深色封面均已同步；组件库的默认尺寸与 API 没有改变。

**统计：**本次 JSX 检查范围为一个文档源码文件，18 种组件、42 次使用，其中 UI 8／19、文档组合 9／22、第三方 1／1；静态检查覆盖 1／1，0 错误、0 警告。工作区类型检查、复制代码检查、全量设计检查和 Agent 示例检查通过。

**组件：**复用 PieChart／PieSlice／PieCenter／PieCenterShell，以及 ChartLegend、ChartDataTable、Button 和既有文档组件。尺寸通过公开 API 设置，原生元素只负责外部排列与独立中心示例的参考区域。

**问题与说明：**1440／390／320px × 浅深色六组浏览器检查中，全部六个示例的实际区域均为 180 × 180px，无页面横向溢出；圆环路径保留 4px 圆角，中线间距采样约 1.982px，采样误差范围内为 2px；动态几何按钮和键盘查看通过。本次不重复生产构建及既有英文宿主水合问题的排查。报告在 `.zeron/reports/pie-size/after.json`，尺寸与交互证据在 `output/playwright/remaining-charts/pie-size-browser.json`。

### 纹理与动态几何示例布局追加

“纹理与渐变”和“动态几何更新”沿用“圆环与左右图例”的 180px 尺寸、圆环厚度、2px 间距、4px 圆角和中心字号。桌面左侧图表、右侧逐行图例；窄屏自动上下排列。图例展示原始数值与占比，总量为 1000；切换半圆几何不改变数据或占比分母。纹理示例保留渐变、斜线填充及受控图例／键盘查看；几何示例保留 geometryScrubbing，中心显示总量。两份复制代码及新增中心／按钮文案的中英文翻译同步更新，组件 API 不变。

**统计：**本次报告范围为一个文档源码文件，18 种组件、44 次 JSX 使用，其中 UI 8／21、文档组合 9／22、第三方 1／1。静态检查覆盖 1／1，0 错误、0 警告；前置基线在编辑前完成，新增／既有／修复诊断均为 0。

**组件：**复用既有 PieChart、PieSlice、PieCenter、ChartLegend、LinearGradient、PatternLines 和 Button；原生元素只负责外部布局。颜色与文字沿用项目 Token，间距和圆角通过公开几何 API 设置，未新增样式变量或规则豁免。

**问题与说明：**类型检查、普通 lint、全量设计检查及复制代码检查（5 项）通过。1440／390／320px × 浅深色共六组浏览器检查覆盖两例：尺寸、左右／上下排列、五处间距约 1.982px、4px 圆角、无横向溢出；渐变／纹理引用、图例悬停、键盘查看和几何往返切换通过。首次热更新后的载入出现宿主 useId 水合提示并影响 SVG 引用；重新载入后引用恢复，后续六组检查未出现页面运行异常，不据此宣称宿主水合问题已修复。本次未重复生产构建。18 个无关文件哈希保持不变，未提交或推送。报告为 `.zeron/reports/pie-style/after.json`，浏览器和截图证据为 `output/playwright/remaining-charts/pie-style-*`。

## 8. StatusBarChart 颜色统一

StatusBarChart 使用 StatusOverview 的 chart 模式。状态竖条默认正常为 `var(--chart-1)`、降级为 `var(--chart-2)`、中断为 `var(--chart-3)`、维护为 `var(--chart-4)`；未知保留中性色，空桶保留中性纹理。新增可选 `chartColors: StatusOverviewChartColors`，支持按状态部分覆盖，其余状态沿用默认映射。此 API 只影响 chart 模式的竖条；汇总文字、card 与 activity 使用原有语义颜色。图例与 Tooltip 标记、复制代码、中英文说明、API 表、浅深色封面及 Registry／Agent 产物已同步。

**统计：**组件与样式报告检查三个明确源码文件：StatusOverview、基础示例与文档页。11 种组件、31 次 JSX 使用，其中 UI 4／14、内部辅助 1／1、文档组合 6／16；静态检查覆盖 3／3，0 错误、0 警告。编辑前基线与最终报告覆盖相同文件，新增／既有／修复诊断均为 0。翻译、测试与生成产物另外核对，不计入 JSX 统计。

**组件：**复用 StatusOverview、Skeleton、Tooltip、Button 及既有文档组件。公开颜色 API 通过动态 backgroundColor 引用现有 Chart Token，未新增主题变量、全局样式覆盖或规则豁免。业务状态卡片和紧凑服务行的默认取色保持兼容。

**问题与说明：**类型检查、普通 lint、全量设计检查通过；状态交互／契约、复制示例与翻译一致性四个测试文件共 50 项通过。Registry 158 项检查和 Agent 生成一致性检查通过。临时消费者入口验证了默认与部分覆盖颜色 API：真实打包 CLI、独立 npm Next／Vite 安装、类型检查与生产构建通过；随后恢复汇总文字的原有语义取色，最终源码通过工作区检查，未重复消费者构建。1440／390px × 浅深色四组浏览器验证实际计算颜色、原有模式兼容、故障模拟／恢复、图例／Tooltip、键盘 End／ArrowLeft／Escape 和无页面横向溢出。热更新期间再次出现既有宿主 useId 水合提示；编译稳定后重新载入，最终四组验证通过，不宣称修复了宿主水合问题。18 个无关文件哈希保持不变，未提交或推送。详细报告为 `.zeron/reports/status-chart-color/after.json`，验证和截图为 `output/playwright/remaining-charts/status-chart-*`。

## 9. 更新日志中的全年活跃度日历

`/updates` 与 `/en/updates` 顶部接入真实 HeatmapChart，作为“更新活跃度”应用实例。最终按访问者时区显示当前年份的 1–12 月日历，替换初版最近 90 天范围；移除范围描述与操作提示，保留标题、年份、提交次数与活跃日统计。过去无提交的日期使用中性色，活跃格沿用 chart-1 五级颜色；未来日期与跨年补位不绘制，也不参与键盘查看或统计。图例明确显示 0／4+ 次提交每天，Tooltip 保留真实日期与次数。

默认列表展示该年度最近 100 条提交，每次追加 100 条。选择任意已到来的日期展示当天全部提交，包括零提交的空态，按钮返回最近列表。热力图与日志使用同一访问者时区；首屏 SSR 与水合先使用 UTC，然后一起切换到浏览器时区。日期格采用 UTC 日期编码表达日历身份，原始提交时间戳保持不变，覆盖午夜、夏令时、闰年和 UTC 跨年时区差异。

全年日历保持完整月份与方格尺寸。720px 最小绘图区只在卡片内横向滚动，初始定位到最近更新月份；键盘查看也将对应格移到可见区域，页面不产生横向溢出。沿用既有 PageLayout／PageContent／PageBody 及 Suspense 流式加载，骨架新增活跃度区域。

窄屏检查发现，直接将 Tooltip 限定在完整绘图区会被横向滚动区域裁切。最终使用公开 TooltipBox API，将提示框挂在可见的外层 frame，并按滚动偏移转换坐标、以实际可见宽度计算边界；未修改共享 Tooltip 引擎。鼠标与键盘查看均检查提示框实际可见范围，修复后日志时区／流式／交互 18 项再次通过。

### 数据与公开 API

新增 `docs/lib/commit-activity.server.ts` 和纯日期聚合模块 `docs/lib/commit-activity.ts`。GitHub 按日期范围分页读取，不再用最近 100 条推算全年统计；部署环境固定到提交 SHA，本地分支先解析实际 tip，再用同一 SHA 遍历各页，避免分支移动或回溯日期的 tip 导致统计偏差。请求总时限 10 秒，最多 30 页；支持去重和完整空响应。远端失败时只允许完整本地 Git 历史提供统计，使用 `--since-as-filter` 保留日期非单调的祖先提交；浅克隆、缺失仓库或不完整分页仅保留可用日志，并明确显示活跃度暂不可用。没有将缺失历史或未来日期当成零。

页面通过 Next 15 Data Cache 共享带 `asOf` 的快照，300 秒重新验证，按仓库与部署 SHA 区分缓存，减少每次访问的 GitHub 分页请求。旧 `readCommitHistory` 的签名及其他页面行为保持兼容。缓存机制依据 [Next 15 官方说明](https://nextjs.org/docs/15/app/api-reference/functions/unstable_cache)。

HeatmapChart 新增可选 `onCellSelect?: (bin: HeatmapBin) => void`，点击／轻触及键盘查看后的 Enter／空格使用同一原始 bin；禁用交互、加载或未 ready 时不触发。原参考 API 冻结基线保持原样，契约测试只显式允许这一字段增加，继续逐项验证其他字段。API 表更新为 Heatmap 88 项／五类总计 295 项，Registry、Agent 指南和中英文文档应用链接同步。没有增加布局选择控件或新主题变量。

### 验证与组件使用报告

**统计：**12 个明确源码文件，识别 53 种来源／导出组合、119 次 JSX 使用；UI 25／77、内部辅助 3／3、业务与文档组合 21／34、第三方 4／5。设计静态检查覆盖 12／12，0 错误、0 警告；显式 var 引用 2 种，仅为词法统计。编辑前基线覆盖 9 个既有文件，3 个新增文件没有前置覆盖，整体新增／修复归因保持未验证。

**组件：**复用 HeatmapChart、HeatmapCells、HeatmapLegend、TooltipBox、Container、Button、Badge 和既有日志／文档组件。ActivityAxes、ActivitySelection、ActivityTooltip 使用公开 context 与 Tooltip API 负责本地化日期、选中态和日志筛选，不另建图表引擎。业务排列与局部滚动由页面拥有；方格间距和圆角保留组件默认值。

**问题与说明：**108 项定点测试、类型检查、普通 lint、全量设计 lint、文档站正式构建通过。测试覆盖完整／中断分页、固定 revision、浅克隆、回溯日期、时区边界、闰年、SSR 水合、流式骨架、单日超过 100 条、加载更多、日期复位、空态和选择回调。新增缓存包装后的流式／数据 20 项再次通过；不是额外 20 个独立用例。Registry 158 项、API 表和 Agent 167 项／65 指南一致性检查通过；Heatmap 独立 pnpm Next／npm Vite 安装、类型及生产构建通过。

开发与正式构建各验证中英文 × 1440／390／320px × 浅深色共 12 组。真实数据为 2026 年 466 次提交、上海时区 47 个活跃日、截至 10 月 8 日 281 个已到来日期；统计与格子求和、选择日期与原始时间戳、本日完整日志、键盘 Home／End／Enter／空格、分批加载、本地滚动与 Tooltip 可见边界均通过。正式构建无页面运行异常或水合错误；本地 Vercel 分析脚本 404 单独记录。开发热更新阶段捕获既有宿主 useId 水合提示，涉及导航和文档纹理引用；编译稳定后的最终 12 组没有 console error，不据此宣称宿主已修复。正式构建另外核验 SVG 引用。自动 inventory 的 3 个 motion.g／rect 来源仍为 unchecked，已人工追到 motion/react；未启用的内联样式等检查不计为自动通过。18 个无关文件哈希保持不变。完整报告在 `.zeron/reports/updates-activity/after.json`，浏览器、构建、消费者和截图证据在 `output/playwright/remaining-charts/updates-activity-*`。未提交或推送。
