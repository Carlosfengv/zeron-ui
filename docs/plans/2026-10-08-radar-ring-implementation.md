# RadarChart / RingChart 实施记录

日期：2026-10-08。状态：已实现，未提交。

## 范围与来源

新增 RadarChart、RingChart 的组件入口、Registry、文档、封面及 Agent 指南。参考实现来自 `/Users/carlos/Downloads/charts`；原始文件 SHA-256 和全部公开接口字段冻结在 [参考基线](./2026-10-08-radar-ring-reference-baseline.json)。保留原有接口类型、默认几何、组合方式及交互，颜色映射到现有 `chart-1`～`chart-5`、`fg-*`、`border` 与所在 `surface-*`。没有新增主题变量。

| 组件 | 数据含义 | 公共组合 | 文档示例 |
| --- | --- | --- | --- |
| RadarChart | 对比归一化的 0–100 指标，至少三个指标 | RadarGrid、RadarAxis、RadarLabels、RadarArea；useRadar / Stable / Hover | 指标概览、多系列与联动图例、网格／数据点／指标更新 |
| RingChart | 每项独立计算 value / maxValue，按输入顺序从内到外 | Ring、RingCenter；useRing / Stable / Hover | 圆环与左右图例、半环与平直端点、动态几何与进度 |

RingChart 的多个进度不表示一个总量的份额；份额图继续使用设置 innerRadius 的 PieChart。Ring 的示例尺寸为 180px，宽屏图例在右侧，窄屏在下方；布局与溢出均由 API 控制。

安装：`npx zeron-ui add radar-chart ring-chart chart-primitives button`。工作区入口为 `@zeron/ui/radar-chart`、`@zeron/ui/ring-chart`；复制到消费项目的示例使用 `@/components/ui/...`。

## 实现与修复

- Radar 保留五层网格、60px 边距、参考网格角度／标签位置、点与轮廓及悬停反馈。缺失和非有限数按 0 绘制，越界值限制在 0–100；原始数据仍可读取。边距、层数和尺寸有边界保护；比例尺按半径缓存。motionReplayKey 重播整个绘图层。
- Ring 保留 12px 宽度、6px 间距、60px 内圈半径和容器等比缩小。非法数值或非正 maxValue 不绘制；超目标数只限制绘图比例，摘要保留实际值。零进度保留背景轨道，反向角度可正常生成路径。
- animationDuration 接入默认入场时长；自定义 enterTransition 优先。geometryScrubbing 在各 Ring 内切换静态路径，保留指定子项、color、lineCap、animate、showGlow 和悬停；不绕过组合 API 自动重画所有数据。
- RingCenter 通过 Portal 把 HTML 放到图表根容器，支持 Fragment 中的组合。自定义渲染在合计及悬停状态都生效，默认 data 包含有效项的合计值／目标；无中心空间时不绘制摘要。
- 两者支持受控／非受控悬停、变化回调、单个键盘入口、方向键／Home／End／Escape、失焦清除和读屏播报。稳定绘图上下文与悬停上下文分开；示例派生数据有缓存。
- 修复参考 RadarArea 动画属性没有初值产生的警告。新增共享的 useChartReducedMotion：首次客户端渲染与 SSR 一致，随后应用系统偏好并监听偏好变化，避免开启降低动态效果时的 hydration 不一致。
- 中心数字与排版的两个共享文件改由 chart-core 唯一拥有，保持 PieChart 的公共导出；降低动态效果 Hook 由 chart-motion 分发。没有重复 Registry 文件。

## 文档与分发

新增两条独立文档路由，中英文各三个可复制客户端示例，数据表、行为说明及 API 表。API 表从源代码生成：Radar 31 个字段，Ring 28 个字段。示例不使用内部导入、不加入用户布局选择按钮。

包导出、Registry、文档索引／导航／加载器、组件封面、Agent 身份／指南／目录、LLM 索引已同步。Registry 共 160 项；Agent 目录 169 项、67 份指南。既有 Line、Bar、Pie、Heatmap、LiveLine、Updates 及用户未提交的其他修改继续保留。

## 验证结果

- 6 个相关测试文件，99 项通过。涵盖冻结的公开接口、文件唯一归属、完整示例、多语言、原始值／几何边界、受控状态、键盘、动态更新、中心渲染与 SSR；同时覆盖既有五类 Chart 的相关回归。
- UI 包类型检查、站点正式构建、改动范围普通 lint 与全项目 design lint 通过。Registry、API、Agent 目录／指南生成检查通过。38 份指南中的 40 个 TSX 示例类型验证通过。
- 真实 CLI tarball 安装到独立消费项目：两个组件分别通过 pnpm / Next.js 与 npm / Vite 的安装、类型检查和正式构建，共四组；共享降低动态效果 Hook 已包含在安装闭包中。
- 24 组正式页面验证：两类图表 × 中英文 × 1440/390/320px × 深浅主题。键盘、清除、动态更新、有效 SVG、HTML 中心覆盖层和页面无横向溢出通过；0 页面运行异常、0 hydration 错误、0 非分析脚本的控制台错误。
- 最终中心合计／空间边界修复后，重新完成正式构建，并复核两类图表的 390px 深色正式页面，0 页面运行异常、0 非分析脚本控制台错误。
- 普通动态效果下，两类图表的完整入场与实际路径悬停通过，0 控制台警告／错误。开启降低动态效果的早期检查暴露了 hydration 问题，已修复并加入回归验证；正式页面检查随后通过。
- 本地正式环境的 Vercel Analytics / Speed Insights 脚本仍返回 404，共 48 次（每次导航两条），属于已有站点分析集成限制，未计为图表功能通过项。未覆盖任意第三方自定义子组件、全部自定义 Transition 或参考项目未提供的全局 CSS，未宣称全像素一致。

临时验证记录：`output/playwright/radar-ring/`；测试环境为 `http://127.0.0.1:3907`，临时正式环境检查后关闭。

## 组件与样式统计

明确检查 16 个源文件：自动解析到 29 种组件、60 处 JSX 使用；其中公开 UI 15 种／19 处，内部组件 4 种／6 处，项目组合 6 种／26 处，外部组件 4 种／9 处。样式检查 16/16，错误和警告均为 0，显式变量引用 12 种。

主要使用 RadarChart 组合、RingChart 组合、ChartLegend、ChartDataTable、Button 与文档预览组件。保留的 SVG 像素几何、点／线／悬停尺寸来自本次明确指定的参考实现；所有默认颜色使用项目 Token。

自动统计仍有 11 处 `motion.*` 动态组件别名无法解析，已逐项人工追溯到 `motion/react`；工具的 inventory 状态保持 unchecked。新文件没有修改前覆盖，不能自动归因“新增／修复”的统计。完整数据见 `.zeron/reports/radar-ring/after.json`，人工审查见 `.zeron/reports/radar-ring/manual-review.json`。18 个与本任务无关文件的既有散列检查均未变化。
