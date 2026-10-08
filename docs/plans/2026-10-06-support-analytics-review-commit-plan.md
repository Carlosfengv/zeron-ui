# 客服工单分析 Block Review 与 Commit 计划

日期：2026-10-06。范围：`support-analytics-01` 核心实现、动画、图表、演示、文档与分发登记。已完成修复；本轮未暂存、提交或推送。

## Review 结果与修复

| 级别 | 问题与影响 | 已完成修复 |
| --- | --- | --- |
| P1 | 文档源码白名单遗漏 `support-analytics-motion.tsx`，复制完整源码后缺少被引用模块 | 补齐白名单；增加 Registry 与文档源码完整性回归测试 |
| P2 | 已显示的操作失败在宿主更新 revision 后仍残留 | 在已提交的查询、快照 ID 或 revision 改变时清除旧错误与等待状态 |
| P2 | 同查询替换快照、沿用相同 revision 时，旧操作仍阻塞新快照操作，旧失败可能进入新上下文 | 用完整上下文的操作代次隔离 Promise；旧操作的 catch/finally 不影响新操作；避免渲染中修改上下文代次 |
| P2 | 比例指标前期值超出 0..1 时仍产生带颜色的百分点比较，误导趋势判断 | 当前值、前期值、目标统一采用单位域校验；非法前期值显示未知比较 |
| P2 | 指标短趋势直接绘制负数、无穷值或非法比例，且按数组位置等距展示 | 非法数值保留为 null 断点；无效时间不绘制；使用数值时间轴保持真实时间间隔；数据表保留原始记录 |
| P2 | block catalog 未同步动画所需 `springs` 和 `framer-motion`，依赖说明与 Registry 不一致 | 补齐 catalog；增加 catalog/Registry 依赖一致性回归测试 |

前四项以新增用例复现，修复前四个断言失败，修复后通过。其余两项经源码审查修复并加入数据与分发回归覆盖。

## 保留的产品与组件约定

- 渠道为 Badge：当前蓝色主题高亮层滑动，其他项默认灰色；支持点击、Enter、空格与焦点滚动。
- 状态为 pill/default Tabs；未解决数量 strong/red，已解决数量 strong/green；状态栏无额外浮动表面包裹。
- 总量从当前显示值自然递增或递减；中途切换从中间值继续；减少动画偏好下直接显示目标值。
- 柱图保持主题色向底部透明淡出的渐变、顶部圆角、原型间距和平均线；均线使用精确平均值，Badge 仅舍入显示。
- 比较 Badge 位于比较文案右侧。保留真实查询、分桶、Tooltip 日期和数据表；不伪造缺失数据或操作成功状态。
- 未修改共享 UI 源码、全局样式或 lint 规则。指标值校验属于业务数据边界；图表标记和动画通过现有 Chart、Badge 与公开 spring 参数组合。

## 提交前置依赖

当前工作区混合多个任务的修改；以下共享能力尚未完整进入 HEAD，应先由对应任务落地，不能直接连同整个工作区提交：

1. `ChartContainer.dataTable` 与 `ChartDataTable`：共享 Chart 扩展、chart-primitives 源码、包导出及 Registry 依赖。本 block 使用这些公开接口。
2. `ErrorState` 及其共享依赖、包导出和 Registry 登记。
3. `MenuItem` 与 `DropdownContent` 的回调传递修复及对应回归用例。本 block 的详情、解决、刷新、导出菜单依赖该行为。
4. `display` 字号 token 的 canonical 定义及生成的主题产物。本 block 已采用 `text-display`。
5. 文档演示的 `DataStateDemoControls`、`DemoSettingsMenu` 和其 `PreviewToolbar` 依赖。它们应随共享演示工具栏任务落地，再提交本 block 的 demo。
6. 当前文档加载生成器若采用新的维护方式，应先提交所属任务，再接入本 block 的登记项。

`TabItem.badge`、pill/default、Badge 自定义色与公共 springs 已存在于 HEAD；Tabs 的新增 leading 等其他变更不是本 block 前置条件。

## 建议的两个 Commit

### 1. `feat(blocks): add support analytics data block`

目的：一次提交可安装、可使用、具备数据与操作契约的客服分析 block，包含本轮修复。

包含：

- `packages/blocks/src/application/support-analytics-01/` 的全部 10 个源码文件：入口、公开类型、双语 labels、数据处理、示例数据、主组件、图表、指标、动画和最近工单。
- `tests/support-analytics-data.test.ts`、`tests/support-analytics-interaction.test.tsx`、`tests/support-analytics-motion.test.tsx`。
- `packages/blocks/package.json` 中本 block 导出与 `framer-motion` 依赖，以及对应锁文件条目。
- `packages/blocks/src/catalog.ts`、`packages/blocks/block-capabilities.json`、`packages/blocks/registry.json` 中仅本 block 的登记项。
- 由上述源文件生成的 `public/r/support-analytics-01.json` 及 Registry 索引中的对应变化。
- `scripts/test-consumer-installs.mjs` 中仅本 block 的 Next/Vite 验证样例。
- 与这一提交状态一致的 agent 安装目录生成产物；guide 和文档路由由下一提交补充。以该提交的 canonical 源码重新生成，不直接复制混合工作区的完整生成 diff。

验收：核心 22 项测试、类型检查、设计 lint、Registry 检查，以及 Next/pnpm 与 Vite 安装构建。安装闭包必须包括前述共享能力，不能只凭工作区包导出能够解析就认为消费者可用。

### 2. `docs(blocks): publish support analytics demos and guidance`

目的：发布中英文文档、可交互演示、完整源码预览和 agent 指南。

包含：

- `docs/components/blocks/SupportAnalyticsDemo.tsx`。
- `docs/pages/blocks/support-analytics-01/` 和 `app/[locale]/docs/blocks/(detail)/support-analytics-01/` 路由。
- `docs/content/{en,zh-CN}/blocks/support-analytics-01.json`，以及双语 common 描述中本 block 条目。
- `BlockPreview`、`StandaloneBlockDemo`、standalone slugs、artifact catalog、manifest 中本 block 接入项。
- `docs/agent-guides/blocks/support-analytics-01.md`、实施方案、本 review/commit 计划。
- `scripts/preview-source-allowlist.mjs` 中本 block 的全部 10 个源文件，包含动画模块。
- `tests/support-analytics-distribution.test.ts`；其文档完整性检查要求本提交的白名单，因此与文档一起提交。
- 文档、内容和 guide 加载映射、预览源码 hash 资源、agent 数据、llms 内容中的相应生成改动。
- 文档目录、双语清单等相关测试中本 block 的枚举与计数。以实际已提交的其他文档为依据核对，不能把混合工作区总数直接套入本提交。

验收：分发 2 项测试、文档与双语契约、源码预览、独立 demo 和全部生成一致性；浏览器验证渠道/状态切换、工单操作、减少动画偏好、窄屏和深浅主题。

## 暂存与生成策略

- 本 block 新文件按上述分组纳入；共享文件逐个选择本 block 的改动块。不要使用 `git add .`。
- 对 package、锁文件、catalog、manifest、白名单及文档测试选择本任务条目；保留其他 block、Tabs leading、RadioGroup、共享图表、反馈组件和工具栏的任务边界。
- `block-capabilities.json` 当前还包含全文件格式化与其他任务登记。暂存时只增加本 block 条目，避免把纯格式化一起带入。
- 共享生成文件应在只包含已落地前置依赖及当前提交源码的隔离 checkout 中重新生成和校验；不手工修改最终 Registry JSON 或 hash 源码资源。
- `.zeron/reports/` 的截图、日志和本地报告用于复核，不整目录提交；需要保留的 review 结论已写入本文件。
- 两个提交应各自可验证。共享依赖尚未落地时先完成相应任务提交，再执行此计划。

## 本轮验证

- 客服分析核心/分发与关联文档：6 个文件、38 项测试通过，其中本 block 24 项。
- 源码预览与独立 demo：另 2 个文件、7 项测试通过；相关检查共 45 项通过。
- 类型检查、定向 ESLint、全库设计 lint 通过。
- Registry、源码预览、文档路由、文档加载映射、guide 加载一致性检查通过。agent catalog 在本轮首次同步后通过，最终重生成因并发新增的 `file-upload-01` 缺少 active identity 登记失败，当前结果为 failed，须由该任务完成登记后复跑。
- 独立 Next/pnpm 与 Vite 消费者安装和生产构建通过。Vite 有第三方 `use client` 指令提示，不影响构建通过。
- 浏览器：1280px 浅色、320px 深色无整体横向溢出；在线聊天总量 396、平均 57；解决操作由宿主确认后将 47/349 更新为 46/350，总量仍 396；未见页面运行错误。

补充的全库 `registry-consistency.test.mjs` 中，18 项通过，1 项失败：旧预期将 `cluster-environment-detail-01` 标为 next，而工作区另一项重构已经将其改为 react。这是关联共享提交需要协调的既存差异，不作为客服分析测试通过项，也未在本轮改变其他 block 的 framework。源码预览在其他任务更新后曾检测到过期 hash，重新生成后 7 项相关测试通过；最终源码生成一致性再次通过。工作区仍在并发修改，提交时应在隔离的提交状态重新生成，避免纳入尚未完成的其他任务登记。

本轮未运行整站生产构建或完整测试套件；Next/Vite 生产构建是本 block 的独立消费者验证，不代表整站通过。

## 组件统计与覆盖边界

7 个实现、演示与文档 TSX 文件，自动识别 51 种 UI 导出、103 次使用；人工核实 ChartTooltip 与 DropdownTrigger 公共别名后，共 53 种 UI 导出、106 次使用。全部组合 78 种组件、135 次使用；静态检查 0 错误、0 警告。

- 布局与数据：Container、MetricCard、Chart、ChartDataTable、Table、InfoItem。
- 控件与内容：Badge、Tabs、Select、Dropdown/MenuItem、Button、Accordion、Avatar、Tooltip、Dialog。
- 状态反馈：Empty、ErrorState、InlineNotice、Skeleton、ToastStack。

完整本地报告：`.zeron/reports/support-analytics/review-after.json`。自动别名来源识别为 unchecked，已人工核实；不把自动报告变成完整来源认证。设计规则以实际 ESLint 配置适用范围为准，演示与文档部分只覆盖普通 ESLint；样式、交互和 token 语义另经人工检查。未新增 UI 原语、样式变量或检查豁免。
