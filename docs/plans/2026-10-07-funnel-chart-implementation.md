# FunnelChart 实施记录

日期：2026-10-07

状态：已实现，完成本地组件、文档、Registry、独立安装和浏览器验证。用户已授权按清单提交并推送 GitHub main，执行结果以 Git 历史为准。

后续审查和提交范围见 [FunnelChart 审查与提交计划](./2026-10-07-funnel-chart-review-commit-plan.md)。

## 1. 交付范围

- 公共入口：[funnel-chart.tsx](/Users/carlos/Downloads/zeron-ui/packages/ui/src/components/funnel-chart.tsx)，导出 FunnelChart、FunnelChartProps、FunnelStage、FunnelGradientStop。
- 绘图实现：[charts/funnel-chart.tsx](/Users/carlos/Downloads/zeron-ui/packages/ui/src/components/charts/funnel-chart.tsx)。横纵几何共享计算，保留参考的路径、分层、标签、网格、渐变和纹理。
- 共享文件只有 animation、use-mount-progress、use-enter-complete；Funnel 独立安装包含五个文件。绘图依赖 Motion，基础依赖为 surfaces / utils，以及仓库自动补齐的 tw-animate-css。不引入 Recharts、Visx 或其他 chart。
- 包导出、Registry 源及生成条目、Charts 导航、双语页面、静态封面、Agent 身份、指南、搜索语义和生成索引已接入。
- [文档页](/Users/carlos/Downloads/zeron-ui/docs/pages/components/funnel-chart/page.tsx) 包含受控悬停、纵向分组标签、横向直边网格、渐变／图案。纵向和横向布局拆成两个独立 demo，各有完整消费端导入、use client、数据和默认导出。
- 可见原始数据表复用 ChartDataTable；Funnel 自身保留隐藏有序数据列表与键盘反馈。

本次没有替换业务 Block 的现有图表，也没有修改其他六类组件。

## 2. 参考行为与变量映射

| 项目 | 实现 |
| --- | --- |
| 默认形状 | horizontal、curved、layers=3、gap=4px；横向比例 2.2 / 1，纵向 1 / 1.8 |
| 分层 | scale = 1 − layer / layers × 0.35；透明度从 0.18 到 0.83，保持参考顺序 |
| 路径 | 主方向控制点 0.55，半宽／半高系数 0.44；最后阶段保持自身比例 |
| 百分比 | 当前阶段 / 第一阶段 × 100；不排序，不计算相邻阶段转化率 |
| 入场 | 1.1s tween，ease [0.85, 0, 0.15, 1]，每段 stagger 0.12s；标签延迟 0.25s，淡入 0.35s |
| 悬停 | 内层最多扩张 12%，其他阶段 opacity=0.4；保留逐层 spring 参数，超出正常层数时避免非正刚度 |
| 标签 | spread 的 16% 边缘区域；grouped 的 8% padding、gap-1.5、方向和对齐 API |
| 字号 | 用 text-body / text-label 的等值变量替换参考类名；实测数值 14px / 20px，标签 12px / 16px |
| 局部层级 | 内联保留绘图 1 / 10 / 20 层次；根容器 isolate 避免与页面层叠相互影响 |
| 主色 | --chart-1，保留 color、stage.color、gradient 等显式覆盖 |
| 文字与胶囊 | --fg-default、--fg-muted、--inverse-background、--fg-on-inverse |
| 网格 | --muted 背景、--border 分隔线；默认关闭 |

gradient 首个颜色用于外层，最内层优先使用 renderPattern，其次 gradient，最后实色。SVG 定义使用 useId 的实例前缀和阶段下标，renderPattern 收到对应唯一 id。

受控契约保持参考：传入 hoveredIndex（包括 null）时由 onHoverChange 请求宿主更新；省略 hoveredIndex 则内部维护悬停，回调不触发。新增键盘能力：单个 Tab 停靠点，横向左右键、纵向上下键，Home / End 到首尾，Escape / 失焦清除。键盘焦点存在时，鼠标离开保留高亮。

## 3. 缺陷修正

- 空数组仍返回 null，但空数据恢复为有效数据后会重新建立尺寸监听。
- 首值必须为正，全部阶段值必须为非负有限数；比例或坐标溢出时不生成 SVG 和百分比，保留可访问原始值。
- 零尺寸不绘图；容器恢复尺寸后重新计算。gap 非负，过大时缩小以保留至少一半绘图空间。
- layers 归一化为 1–64 的整数，非有限值回退 3；非有限 gap 回退 4，staggerDelay 回退 0.12。
- 重复阶段名称使用下标维持正常渲染；空渐变按无渐变处理。
- 长标签截断并保留 title、隐藏数据列表和原始数据表，390px 视口不产生页面横向溢出。
- prefers-reduced-motion 跳过入场和悬停缩放，保持即时高亮与淡化。
- 动画完成后移除入场 transform；spring 回弹低于 1 不重新挂载入场层，重置至 0 时可重新开始。卸载清理动画及 ResizeObserver。
- 静态封面生成等待所有阶段的入场缩放完成，再截取亮暗主题，避免捕获尚未展开的后续阶段。
- 后续审查改为保持入场容器与 SVG 节点，完成后 scale=1；封面等待兼容 transform=none。尺寸改用 ResizeObserver 布局像素，并跳过同尺寸通知；分别处理鼠标和键盘焦点，数据失效或下标越界清除内部高亮。基础复制代码补齐反馈，预览只保留组件内部播报。

无效数据的可见提示和业务空态由宿主提供。超过第一阶段的非负有效值仍允许超过 100%，沿用参考 overflow-visible 语义。

## 4. 验证结果

| 验证 | 结果与范围 |
| --- | --- |
| 全量单测 | 最新审查后 Node 22.17.0 下 263 个文件、2,385 项通过 |
| 最终专项 | FunnelChart 24 项，加复制示例、语言、文档清单、封面、语义变量，共 102 项通过 |
| 类型与静态检查 | typecheck、完整 lint、完整 lint:design 通过 |
| Registry | 148 项闭包检查通过；funnel-chart 的 utils 导入使用仓库别名，由安装流程转换成消费者路径 |
| 消费者 | Next React 19 分别经 npm、pnpm 安装并生产构建；Vite React 19 经 npm 安装、类型检查和生产构建通过 |
| Agent | 身份、指南路由、搜索元数据接入；指南例子检查 28 个指南、29 段 TSX 通过 |
| 浏览器 | 390px 和桌面、横纵向、直边网格、键盘、实际悬停放大／淡化、亮暗主题、渐变／纹理、长标签、空数据／非法值／零尺寸恢复通过 |

浏览器实测：长标签可用宽度 83px、原始文本宽度 328px，显示 ellipsis 且 title 完整；空数组为 0 个图，恢复后为 12 条路径；首值 0 和后续 NaN 均为 invalid 且 0 条路径；零尺寸为 0 条路径，恢复后为 12 条；10 个 SVG 定义全部唯一。减少动态效果时 12 条路径 transform 均为 none。实际普通悬停放大超过 1.1，其他段 opacity 为 0.4。

稳定主题取色：浅色主色 rgb(0, 96, 210)、胶囊 rgb(0, 3, 10)、文字白色；深色主色 rgb(20, 131, 253)、胶囊 rgb(222, 229, 239)、文字 rgb(0, 4, 13)。

初次全量测试在默认 Node 23 下触发仓库 Node 22 门禁；切换已有 Node 22 后全量通过。未修改运行时门禁或测试规则。

临时浏览器边界页面已删除。截图、测试日志位于本地 output/playwright，未进入正式文档路由。

## 5. 组件与样式使用报告

[完整 JSON](/Users/carlos/Downloads/zeron-ui/.zeron/reports/funnel-chart-review/after.json) 与 [Markdown 摘要](/Users/carlos/Downloads/zeron-ui/.zeron/reports/funnel-chart-review/after.md) 覆盖本次 17 个 TS / TSX / MJS 文件，识别 10 种组件、60 次 JSX 使用；包含测试中的使用，不能解释为页面实例数。实际页面有 5 个 FunnelChart 和 1 个 ChartDataTable，布局 demo 各自独立预览。

初次实施没有修改前基线；后续审查保存同范围的 before / after，但报告覆盖不完整，不声明整个范围的新增／历史问题归属。报告记录 0 错误、0 警告，自动盘点为 unchecked：motion.path 的动态类型未能确认来源，两个 MJS 脚本没有纳入该报告的 lint 覆盖。人工确认 motion.path 来自实际导入的 Motion SVG 组件；消费者脚本由完整 lint 和独立安装执行补充验证，封面脚本的专项 lint 和实际生成通过。

报告的规则名称识别没有完整反映仓库 shadcn 插件，不能据此声称所有规则关闭。实际组件配置的 no-raw-colors、no-unknown-classes 为 error 并通过；no-inline-styles、no-arbitrary-values、no-restyle 在组件源目录关闭。动态几何、可信外部颜色和参考阴影通过公开 API 与源码检查，未新增检查豁免，也未计算 token 合规百分比。
