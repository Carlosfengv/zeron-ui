# 销售转化漏斗审查与提交计划

日期：2026-10-08。审查基线：`9c68a6dc176e7b678db5f3da69314213db2a3a64`，当前分支 `main`。

本计划覆盖当前 session 的 FunnelChart 数据堆叠扩展、`sales-conversion-funnel-01`、主题色、Container 结构、文档与列表接入。制定本计划时，代码已优化，尚未暂存或提交；随后隔离验证结果见文末。工作区同时包含 AreaChart、共享图表基础设施和其他文档任务；提交范围按本文件与配套文件清单核对。

## 审查结果与优化

| 问题 | 处理与证据 |
| --- | --- |
| P2：堆叠总量使用 `max(1, value)` 作为误差基准。总量为 `1e-10`、团队之和为 0 时仍被当作有效数据。 | 改为按实际总量比较相对误差。拒绝该不匹配快照，同时接受 `0.1 + 0.2` 与 `0.3` 的正常浮点误差。新增用例修复前失败、修复后通过。 |
| P2：第一段的圆角裁剪固定在图表尺寸内，下一阶段超过 100% 时，增长部分被切掉。 | 裁剪范围覆盖相邻阶段的累计边界，保留末段收尖及原有超过 100% 的 overflow 语义。横向和纵向回归用例修复前失败、修复后通过。 |
| P2：阶段遗漏整个 `values` 对象时，block 在计算总量时抛异常。 | 缺失值进入既有无效数据状态，显示未知指标和数据提示，不补零、不绘图。新增回归用例修复前抛错、修复后通过。 |
| P3：列表封面的画布高度与宽高比不匹配，底部团队图例被裁切。 | 此 block 的封面使用 1280 × 720 画布。浏览器确认图例位于预览可视范围内，三个团队均完整显示。 |
| 重复格式化及窄屏边界覆盖不足。 | 每次 block 渲染复用两个数字格式器；每阶段只构造一次数值文案。长指标允许换行，阶段数值截断并保留 title；长标题与多按钮可换行。320px 下用长标题、最大有限数字和八个按钮做布局验证，页面及 Body 均无横向溢出。 |
| 通用图表测试与 block 测试混在同一文件。 | 数据堆叠测试独立为 `tests/funnel-chart-stacked.test.tsx`，block 测试保留在 `tests/sales-conversion-funnel.test.tsx`，使两个提交可分别验证。 |

保留既有默认分层模式。`series` 是可选扩展，团队绝对值决定实际堆叠高度，所有占比仍以首阶段为分母。ContainerHeader 放标题及宿主操作，指标、阶段、图表及图例位于同一 ContainerBody；颜色使用 brand 与 surface-floating 混合。

本 session 先前遗漏的 gallery artifact 登记与旧 Card 依赖已修复，纳入完整 block 提交。目录支持中文与英文搜索、封面预览及详情跳转。Agent 元数据补充了通用 FunnelChart 的 series/values 说明，指南新增可类型检查的堆叠示例。

## Commit 1

`feat(ui): support data-driven funnel stacks`

目的：在既有 FunnelChart 上增加可选的真实数据堆叠能力，同时保留默认模式。

完整变更：

- `packages/ui/src/components/charts/funnel-chart.tsx`：series 校验、累计边界、横纵向绘制、末段收尖、圆角裁剪、团队可访问列表及键盘滚动。
- `packages/ui/src/components/funnel-chart.tsx`：公开 `FunnelSeries` 类型。
- `tests/funnel-chart-stacked.test.tsx`：11 项堆叠、数据有效性和交互测试。
- `docs/pages/components/funnel-chart/page.tsx`、`docs/content/{en,zh-CN}/components/funnel-chart.json`：series API 与模式说明。

按改动块纳入：

- `docs/agent-guides/components/funnel-chart.md`：series/values 契约及新增示例。首段关于 chart-motion 的依赖描述属于共享动画拆分，按实际目标基线保留对应版本。
- `docs/agent-data/components.json`：仅 `funnel-chart` 的堆叠关键词与 keyApi 项。

在目标提交状态重新生成 `public/r/funnel-chart.json`，以及本提交实际改变的 agent/llms 资源。不要复制混合工作区的完整生成 diff。

验收：已有 FunnelChart 24 项测试与新增堆叠 11 项测试、组件文档示例、类型检查、设计检查及独立安装闭包。

## Commit 2

`feat(blocks): add sales conversion funnel block`

目的：提供可嵌入的销售转化漏斗，发布 Container 组合、主题色、演示及完整发现入口。依赖 Commit 1。

完整的新文件：

- `packages/blocks/src/application/sales-conversion-funnel-01/` 的实现、示例数据及导出，共 3 个文件。
- `tests/sales-conversion-funnel.test.tsx`：4 项业务总量、状态、本地化和宿主动作测试。
- `docs/components/blocks/SalesConversionFunnelDemo.tsx`。
- `docs/pages/blocks/sales-conversion-funnel-01/` 的页面与客户端文档。
- `app/[locale]/docs/blocks/(detail)/sales-conversion-funnel-01/page.tsx`。
- `docs/content/{en,zh-CN}/blocks/sales-conversion-funnel-01.json`。
- `docs/agent-guides/blocks/sales-conversion-funnel-01.md`。
- 本审查计划及配套 `2026-10-08-sales-conversion-funnel-task-files.json`。

共享文件仅纳入本 block 的登记或预期：

- `packages/blocks/package.json`、`registry.json`、`block-capabilities.json`、`src/catalog.ts`。
- `docs/catalog/artifacts.ts`：列表、分类、搜索词与安装能力。
- `docs/manifest.ts` 与双语 `common.json`：本 block 的路由、名称及描述。
- `BlockPreview.tsx`：仅本 block 的 loader 与 1280 × 720 画布；`StandaloneBlockDemo.tsx` 的 import/case；`standalone-blocks.ts` 的 slug。
- `docs/agent-data/components.json`、`guide-routes.json`、`item-identities.json`：仅本 block 的对象与路由。
- `scripts/preview-source-allowlist.mjs`：本 block 的 3 个源码；`scripts/test-consumer-installs.mjs`：Next 与 Vite 的本 block 示例。
- `tests/docs-artifact-catalog.test.ts`：本 block 枚举与资产数量；`tests/i18n-document-manifest.test.ts`：新增文档的计数与集合断言。

按目标源码重新生成文档加载映射、预览源码映射与 hash 文本、`public/r/sales-conversion-funnel-01.json`、Registry 索引、agent catalog 及 llms 资源。生成器可能改写整份文件，先核对输入范围再暂存产物。

验收：block 的 4 项测试、目录与路由契约、预览源码与 agent 生成检查，Next/pnpm 与 Vite/pnpm 独立安装和生产构建，列表/搜索/详情、更多菜单、导出及窄屏键盘导航。

## 暂存边界与生成策略

1. 不使用 `git add .`。新文件按清单加入，共享文件逐项选择本任务的语义变化。
2. 当前工作区中的 `packages/ui/registry.json` 正将 FunnelChart 的内嵌动画文件改为 chart-motion 依赖。这是 AreaChart session 的共享动画提取，本 session 的绘制扩展并不要求新的动画 API。
3. 若从本计划的 HEAD 基线执行，可保留 HEAD 已有的内嵌动画闭包，在隔离 checkout 中应用本任务源文件并重新生成；不要带入 `packages/ui/registry.json` 的 chart-motion/core/brush 提取、`animation.ts` 扩展、UI package/锁文件新增依赖或 `tests/funnel-chart.test.tsx` 的 Registry 提取预期。
4. 若共享动画拆分已先提交，以新的提交作为生成基线，并保留其完整闭包和对应测试。不能只选 FunnelChart 依赖名改动，却漏掉 chart-motion 的源码与 Registry 资源。
5. `BlockPreview.tsx` 中新增 PreviewToolbarProvider 的 import 与包裹、AreaChart 文档/元数据/封面、`tests/chart-document-examples.test.ts` 的 AreaChart 示例变更均属于其他任务。`tests/i18n-document-manifest.test.ts` 的 AreaChart Registry 断言也不纳入本 block 提交。
6. `docs/agent-data/item-identities.json` 顶部的大改动块混有格式化及 AreaChart 身份变化，应在目标文件中只增加本 block 对象，不能将该整块直接暂存。
7. `public/r/registry.json`、llms 及其他汇总生成文件在仅包含目标提交源文件的 checkout 中重生成。当前工作区的 153 项 Registry 检查是工作区验证，不能直接当作任一隔离提交的验收结果。
8. `output/`、`.playwright-cli/`、预览缓存及本地 consumer 日志用于复核，不纳入提交。当前有效预览 hash 由生成映射决定；不要提交先前迭代留下的失效文本资源。

制定本计划时，两次提交的具体暂存状态尚未构建，也未在隔离 checkout 执行验收。后续已按计划在隔离 checkout 验证两个提交状态，结果见文末；执行时始终按各自基线核对计数与生成产物。

## 本轮验证

- 9 个相关功能/文档文件：97 项测试通过。其中 FunnelChart 默认模式 24 项、数据堆叠 11 项、block 4 项。
- 4 个预览、agent、Registry 分发文件：50 项测试通过。合计 13 个文件、147 项测试通过。
- 根类型检查、定向普通 ESLint、全库设计 lint、差异空白检查通过。
- Registry 检查 153 项、预览源码 48 项、拆分文档路由 125 项、文档加载映射 129 项、guide 加载映射 60 项通过。
- Agent 指南类型示例：31 份指南、33 个示例通过。Agent 生成资源已同步。
- 全新 Next/pnpm 与 Vite/pnpm consumer 安装、类型检查和生产构建通过。Vite 的第三方 `use client` 指令提示不影响构建。
- 浏览器：1440px 列表封面的团队图例完整显示；390px 独立 demo 的键盘 End 到第 4 阶段，图表滚动到 284px，播报“成交: 150 (10%)”，页面宽度保持 390px。
- 320px 布局压力验证使用临时 DOM 文案及按钮样本：长标题、最大有限数字、8 个动作按钮；页面宽度为 320px，Body 的 clientWidth/scrollWidth 均为 270px。该检查验证布局；实际缺失数据处理由组件回归测试验证。临时样本已通过重新加载清除。

审查阶段未执行整站生产构建或完整全库测试。提交执行阶段已补充整站生产构建，见文末；完整全库测试仍未执行。此前 session 已验证明暗主题、品牌色切换和 JSON 导出；本轮没有改动这些数据流。

文档导航仍出现既有的服务端/客户端 `data-nav-item-id` 不一致提示，定位在 DocsPrimaryNavigation/NavMenu。独立 block demo 未出现该提示。它未列为通过项，也未在本 session 修改共享导航；后续应由导航任务在稳定构建环境复查。

## 组件与样式覆盖

6 个核心实现、演示和文档文件：自动识别 22 类组件、40 次 JSX 使用，设计检查 0 错误、0 警告，另有 2 处别名来源需人工核实。

- 图形与表面：FunnelChart、Container、ContainerHeader、ContainerBody。
- 演示操作：Button、DropdownMenu/Trigger/Content、MenuItem。
- 文档与动画：既有 DocPage/DocSection、ComponentPreview、PropsTable，以及 Motion SVG 工厂。

DropdownTrigger 已核实为 `Menu.Trigger` 公共重导出，`motion.path` 是既有 Motion SVG 工厂；自动 inventory 保持 unchecked，不将人工判断伪装成自动检查结果。封面接入与目录另经定向 lint、契约测试和浏览器复核。未新增基础 UI 原语、主题变量或 lint 豁免。

本地证据：`output/zeron/sales-conversion-funnel/review-after.json`、`review-tests.json`、`review-distribution-tests.json`、`review-consumer-installs.log` 与 `verification.json`；截图位于 `output/playwright/sales-funnel-review-*.png`。

## 提交执行验证

2026-10-08，用户授权提交至 GitHub main 后，从与 origin/main 一致的 `9c68a6dc176e7b678db5f3da69314213db2a3a64` 基线建立隔离 checkout，按本计划筛选源码并重新生成产物。原工作区 175 个已有改动文件在验证期间内容未变。

- Commit 1：`ae51fd2609ae924ef209a7285eedaee2a9bc4361`，`feat(ui): support data-driven funnel stacks`，10 个文件；6 个相关测试文件共 100 项通过，类型、定向 lint、设计 lint、Registry 与 Agent 检查及指南示例通过。Registry 为 148 项，Agent 为 162 项 / 55 份指南。Next/pnpm 与 Vite/pnpm 的全新安装、类型检查及生产构建通过。
- Commit 2 的隔离源码：13 个相关测试文件共 143 项通过。相比混合工作区的 147 项，未纳入的 4 项是 AreaChart 文档示例。类型、定向 lint、设计 lint、Registry、预览源码、路由、文档与指南加载映射、Agent 检查均通过；Registry 为 149 项，Agent 为 163 项 / 56 份指南，指南类型示例为 29 份指南 / 31 个示例。
- Commit 2 的 Next/pnpm 与 Vite/pnpm 全新安装、类型检查及生产构建通过；整站 `pnpm build` 通过，未保留 tsconfig 改动。
- 隔离生产预览：英文 funnel 搜索发现唯一目标 block，团队图例完整显示，详情跳转与更多菜单可用，导出总量为 1500 / 800 / 200 / 150；390px 下 End/Home/Escape、图表横向滚动和成交播报通过，页面宽度保持 390px。未观察到图表、导航运行时错误或 hydration 提示。
- 本地 `next start` 缺少 Vercel 的 analytics / speed-insights 注入端点，两项脚本返回 404，已作为环境记录；没有修改统计脚本或忽略其他错误。

以上结果验证隔离源码状态。完整全库测试、线上发布后的行为仍未验证。执行证据保留在本地 `output/zeron/sales-conversion-funnel/commit-1-*` 与 `commit-2-*`，不纳入 Git。
