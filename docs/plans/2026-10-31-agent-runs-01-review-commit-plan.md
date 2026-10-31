# Agent Runs review、优化与 commit 计划

日期：2026-10-31。范围：`agent-runs-01`、它依赖的 DataTable 通用能力、演示、双语文档、发现入口与 Registry 安装。

Review 阶段完成实现与验证，当时未暂存、commit 或 push。审查时分支为 `main`，基线 HEAD 为 `108a09bc7c466c4723bc7478aac75a1863216b85`；审查阶段尚未 fetch 或建立隔离候选。该 HEAD 尚无此 Block，因此修复直接包含在新增功能中，不另拆尚未发布功能的 fix commit。后续提交执行记录见末尾。

## Review 发现与处理

| 优先级 | 发现 | 完成的处理 |
| --- | --- | --- |
| P2 | locale 与 timeZone 共用一次异常回退；无效 locale 会把有效的 Asia/Shanghai 也重置为 UTC，跨午夜记录被分到错误日期。 | 两者独立校验和回退。回归使用 UTC 17:00 的跨日边界，同时验证无效时区不会丢失中文数字格式。 |
| P2 | 费用轴强制整数，$0.02 与 $0.04 都显示为 $0；常规币种格式把 $0.0042 显示为 $0.00。 | 费用轴保留最多四位有效数字；非零、低于币种最小单位的费用使用同样的精度。正常费用与零值保留币种标准格式，原始费用和计算不变。覆盖 USD 与 JPY。 |
| P2 | 横轴固定显示日期，五分钟或十秒窗口中的不同刻度显示为同一天，无法辨认时间。 | 不足一分钟显示时分秒，不足一天显示时分，多日窗口显示日期。新增直接覆盖 Chart 适配层的回归。 |
| P3 | 费用分布对每个 Agent / 模型重新过滤全部记录；活动泳道在每个色条内部再次查找整条泳道的 Tab 焦点。 | 汇总时一次累计 Agent / 模型费用 Map；泳道一次分组、各自排序，Tab 焦点每条泳道只确定一次。增加分类费用与总费用的守恒断言。未做性能基准，不声明具体耗时收益。 |
| P3 | 新 Block 的 JSX 与类型声明过度压缩，公共颜色类型允许运行时拒绝的 6 / 7 槽位。 | 格式化新功能文件，整理 DataTable 新增片段；颜色类型收窄至已约定的分类槽位 1–5。保留既有 labels.pagination 字段并标记弃用，原生分页使用 pageSummary。 |
| 验证缺口 | 安装冒烟缺少显式渲染本 Block 的示例，不能单凭依赖源码被安装就确认公开接入方式。 | 补充 Next / Vite 示例，显式使用 AgentRuns、AgentRunsData、createAgentRunsDemoData 与中文 labels，验证页大小和初始展开属性。 |

前两项在修复前的回归中失败；短时间轴测试也先失败、再修复。日志位于 `output/agent-runs-review/{regression-before,chart-regression-before,regression-after}.log`。

## 保留的实现与契约

- Block 无应用外壳；宿主提供完整窗口、全部 Session、稳定 ID、真实费用和用量，拥有取数、计费及会话路由。示例模型与金额只供演示。
- 数据 helper 负责校验、汇总、图表事件与格式；Chart 适配层使用 Zeron AreaChart / Grid / 轴 / TooltipContent；Session 适配层使用 DataTable / useDataTable。没有另建图表引擎或分页器。
- usage=null 表示未上报；累计费用在运行结束时记入，进行中已上报费用记于窗口末尾。缓存命中分母仅为普通输入与缓存读取，Agent 用时允许并发重叠。
- DataTable 接收完整记录模型；日期标题和展开明细属于展示行，不占分页数量。日期汇总涵盖完整当天记录，分页不改变顶部总计与费用分布。
- 时间列通过原生 columnPinning 固定。日期标题、当天汇总、展开明细固定于横向滚动区左边，并按可视宽度排列；窄屏明细上下堆叠。
- stickyHeader 为可选能力，表格内容区默认最高 min(65dvh, 40rem)，表头留在该区域顶部；分页器与工具栏在滚动区外。未启用时仍不限制表格高度。
- 原生分页的每页数量、页码与翻页按钮在小屏保持同行；文字允许单行省略，选择框和按钮保持尺寸。选中数量反馈可以独立排列。
- 活动泳道每个 Agent 一个 Tab 停靠点，方向键 / Home / End 按时间顺序浏览，选择后自动定位分页并展开。受控 mode、宿主 pageSize 更新、数据缩减与 data.id 重置保持原有行为。
- 本轮未增加依赖包、全局 CSS、设计 lint 例外或 lockfile 变更。@visx/curve 与 @tanstack/react-table 已存在于基线依赖中。

## 建议分两笔 commit

### 1. `feat(ui): support sticky DataTable headers and expandable details`

将可复用的表格能力独立提交，作为 Block 的前置依赖；这一笔自身应可安装、可测试。

范围：

- `packages/ui/src/components/data-table.tsx`：embedded/framed 外观与固定列背景一致性、renderRowHeader、renderExpandedRow、DataTableRowContext、stickyHeader、scrollAreaMaxHeight、单行分页布局。
- `tests/data-table-embedded.test.tsx`、`tests/data-table-row-details.test.tsx`、`tests/data-table-sticky-header.test.tsx`。
- `tests/color-token-consumers.test.mjs`：结构色断言继续要求 border / border-border / bg-surface-floating，移除与 overflow 类相邻顺序的绑定；外框切换由 embedded 回归验证。
- `docs/agent-guides/components/data-table.md`、`docs/content/{en,zh-CN}/components/data-table.json`、`docs/pages/components/data-table/page.tsx` 中对应 API 与行为说明。
- `docs/agent-data/components.json` 中仅 DataTable 的接入契约片段。
- 在隔离候选重新生成 `public/r/data-table.json` 及生成器实际影响的 Registry / Agent catalog / llms 文件。

embedded 外观是进入本轮前已有的未提交前置改动，不是本轮 review 新增；本 Block 依赖它。若该能力先由其他提交合入，则此处只保留剩余片段与对应验证，不重复提交。DataTable 默认仍为 framed；固定表头和展示行插槽均为 opt-in。单行分页布局会影响其他 DataTable 调用者，必须一并运行现有 DataTable 与 grouped / sectioned 回归。

### 2. `feat(blocks): add agent run usage analytics`

依赖第一笔，为新 Block 一次提交完整源码、演示、文档、发现与安装闭包；包含本轮所有业务修复和优化。

新增文件完整纳入：

- `packages/blocks/src/application/agent-runs-01/index.ts`
- `packages/blocks/src/application/agent-runs-01/agent-runs-types.ts`
- `packages/blocks/src/application/agent-runs-01/agent-runs-labels.ts`
- `packages/blocks/src/application/agent-runs-01/agent-runs-data.ts`
- `packages/blocks/src/application/agent-runs-01/agent-runs-demo-data.ts`
- `packages/blocks/src/application/agent-runs-01/agent-runs.tsx`
- `packages/blocks/src/application/agent-runs-01/agent-runs-chart.tsx`
- `packages/blocks/src/application/agent-runs-01/agent-runs-sessions.tsx`
- `docs/components/blocks/AgentRunsDemo.tsx`
- `docs/pages/blocks/agent-runs-01/{page.tsx,AgentRunsBlockDocClient.tsx}`
- `docs/content/{en,zh-CN}/blocks/agent-runs-01.json`
- `docs/agent-guides/blocks/agent-runs-01.md`
- `tests/agent-runs.test.tsx`、`tests/agent-runs-chart.test.tsx`、`tests/agent-runs-registry-install.test.ts`
- 本计划。

共享文件只纳入本功能片段：

| 文件 | 此 commit 的片段 |
| --- | --- |
| `packages/blocks/package.json` | agent-runs-01 export。 |
| `packages/blocks/registry.json` | 8 个源文件、原生 UI 依赖与外部依赖的完整条目。 |
| `packages/blocks/block-capabilities.json`、`packages/blocks/src/catalog.ts` | React data-block 能力与一致的依赖列表。 |
| `docs/manifest.ts`、`docs/catalog/artifacts.ts` | agent-runs-01 文档、shared / adapter-required / controlled 分类与搜索。 |
| `docs/components/blocks/BlockPreview.tsx` | AgentRunsDemo 动态加载及预览画布。 |
| `docs/components/blocks/StandaloneBlockDemo.tsx`、`standalone-blocks.ts` | 此 Demo 的导入、分支与 slug；不带入其他 Block 的改造。 |
| `docs/agent-data/item-identities.json`、`guide-routes.json`、`components.json` | 仅新条目的身份、路由与语义元数据。components.json 是手工维护的源输入，不是生成输出。 |
| `scripts/preview-source-allowlist.mjs` | 此 Block 的 8 个文件。 |
| `scripts/test-consumer-installs.mjs` | 仅 agent-runs-01 的 Next / Vite 显式示例。 |
| `tests/docs-artifact-catalog.test.ts`、`tests/i18n-document-manifest.test.ts` | 此 Block 的名单与候选基线对应的计数，不复制当前混合名单。 |

建议提交说明：

```text
Add project spend, token usage, cost trends and agent/model distributions.
Connect keyboard-accessible activity lanes to daily paginated session details.

Use native Zeron charts and DataTable with pinned time, date sections and details.
Preserve small charges and timezone grouping, and publish bilingual docs and Registry support.
```

## 生成内容与隔离提交步骤

当前工作区有大量其他组件和 Block 的未提交改动。禁止整目录或整文件收集混合内容，不使用 git add .。提交时：

1. 确认实际目标基线；如需远端信息，执行时再 fetch。从确认基线创建 `codex/agent-runs-01` 等隔离候选分支。
2. 迁入第一笔必要片段与测试，生成其产物并单独验收、提交。不要把其他新组件、Block 或元数据搬入候选。
3. 再迁入第二笔新文件与共享片段。根据候选目录重新计算测试名单及计数。
4. 按依赖顺序生成以下产物；等待 Registry 构建和后处理完成后再执行 Registry 测试与安装冒烟。
5. 在候选重新执行本计划的验收，核对逐文件 diff 与暂存内容，然后创建第二笔提交。本轮混合工作区的结果不替代隔离候选的验证。

生成命令：

```sh
pnpm docs:loaders:build
pnpm docs:routes:build
pnpm docs:sources:build
pnpm agents:guides:build
pnpm --filter @zeron/registry build
pnpm agents:build
```

第二笔生成产物包括：

- `app/[locale]/docs/blocks/(detail)/agent-runs-01/page.tsx`
- `docs/generated/{page-loaders,block-page-loaders,agent-guide-loaders}.generated.ts`
- `docs/i18n/content-loaders.generated.ts`
- `docs/lib/block-preview-sources.generated.ts` 与此 Block 的 `public/docs-source/<hash>.txt`
- `public/r/{agent-runs-01,registry}.json`，以及必要的第一笔 DataTable 产物。
- 生成器实际影响的跟踪 Agent catalog / llms 文件；忽略的运行时 catalog 不强制纳入。

此轮 Block 源码预览 hash 为 `eb8bee749d13a1bd7bbffa94c4b25def248628a475a0f86900980d97b066531f`。它是当前工作区结果，候选生成值为准。不要复制整个混合 Registry 索引、llms、loader 或删除其他功能的源码 hash。当前计数为 209 Registry items、218 Agent items、119 guides、180 docs、176 split routes、76 previews、79 artifacts / 53 embeddable blocks，这些数字不是候选应照搬的常量。

明确排除：其他 AI 组件与 Block、component-canvas、capacity-index / Sankey、其他图表与封面、middleware、tsconfig、根 lockfile、design-qa.md、其他 review 计划、忽略的 output / 临时安装目录。现有 packages/ui/package.json 与 packages/ui/registry.json 的其他功能条目也不属于本任务。

## 验证结果与提交门槛

当前工作区已通过：

- 22 个测试文件、100 项测试：AgentRuns 记账与校验、mode / pageSize / data 更新、状态与回调、Chart 短窗口格式和泳道键盘；DataTable 全部定向回归；grouped / sectioned 表格；双语、文档目录与 Registry 安装闭包。
- pnpm typecheck；本功能源码、Demo、文档页、测试和 DataTable 的 ESLint；pnpm lint:design 全量设计检查；安装示例脚本 ESLint。
- Registry 重新生成与 209 条目校验；Agent catalog 生成及一致性；sources、routes、loaders、guide loaders 的一致性检查。
- 中文独立演示在 320 / 390 / 768 / 1440px 下分页保持同行且页面不横向溢出；390px 横向滚动 240px 时，时间列、日期标题和展开明细的 x 坐标保持 37px，明细宽度 316px 与可视区一致；纵向滚动 200px 后表头 y 坐标保持 295px，交叉处命中测试确认表头覆盖表体，分页器位于滚动区外。
- 浏览器通过累计 / 单次切换、泳道键盘定位与自动翻页、页大小 20、下一页、打开 run-86 的准确回调、loading / empty / error / retry；明暗主题在 1440px 下截图检查通过。结构数据见 `output/agent-runs-review/browser-verification.json`，截图为 `output/playwright/agent-runs-review-{mobile,light,dark}.png`。未运行此轮英文页面的浏览器检查，中英文文案由静态 parity 检查覆盖。
- 显式 Next / Vite consumer 均安装并通过编译检查，使用独立依赖和安装后的公开入口。Vite 构建包含依赖中 use client 指令的常规提示；此处只验证客户端 React 使用，不声称验证 RSC 语义。完整日志见 `output/agent-runs-review/consumer-explicit.log`。

测试日志与结构证据在 `output/agent-runs-review/`。组件统计覆盖 Block 主体 / Chart / Sessions、Demo、共享 DataTable 共 5 个文件，识别 76 种组件、119 次 JSX 使用，其中公共 UI 为 58 种 / 100 次；设计检查 0 错误、0 警告。完整来源见 `after.json`。DropdownTrigger 为 Menu.Trigger 的公共别名，已人工追溯到 dropdown.tsx；报告器仍保留其自动来源未识别状态。未启用的内联样式、任意值等检查不能当作通过；动态几何和公共样式适配另做源码与浏览器检查。

Review 阶段未运行全站生产构建、全仓测试或真实计费后端；提交阶段的新增验证见末尾。浏览器验证使用 Chromium，未覆盖 Safari / Firefox。性能改善来自消除重复扫描，未做耗时基准。真实采集、计费和 Session 路由仍是宿主接入边界。Review 阶段四个独立维度的检查摘要见 `output/agent-runs-review/verification.json`。

候选验收命令：

```sh
pnpm exec vitest run --config vitest.config.mts tests/data-table*.test.* tests/agent-runs*.test.* tests/grouped-data-table.test.tsx tests/grouped-data-table-registry-install.test.ts tests/sectioned-data-table.test.tsx tests/i18n-message-parity.test.ts tests/i18n-document-manifest.test.ts tests/docs-artifact-catalog.test.ts --maxWorkers=2
pnpm typecheck
pnpm lint:design
pnpm registry:check
pnpm agents:check
pnpm docs:sources:check
pnpm docs:routes:check
pnpm docs:loaders:check
pnpm agents:guides:check
ZERON_CONSUMER_COMPONENTS=agent-runs-01 ZERON_CONSUMER_PACKAGE_MANAGERS=pnpm ZERON_VITE_CONSUMER_COMPONENTS=agent-runs-01 ZERON_VITE_CONSUMER_PACKAGE_MANAGERS=pnpm node scripts/test-consumer-installs.mjs
```

第一笔验收先运行 DataTable / grouped / sectioned 测试与对应安装检查；第二笔再运行完整命令。隔离候选增加执行项目要求的生产构建，并复核中英文 Demo：320 / 390 / 768 / 1440px、明暗主题、双轴滚动、固定区域、分页、活动键盘定位、展开回调与各状态。

## 提交执行记录（2026-10-31）

用户随后授权提交到 GitHub main。已 fetch 并以远端 `30b7feded6100a9f7e59db6a923a07698329798f` 建立隔离分支 `codex/agent-runs-main`，目录为 `/Users/carlos/Downloads/zeron-ui-agent-runs-main`。原工作区的其他未提交内容和本地独立的 Agent Orchestration 提交均保留。

- 第一笔提交为 `74f35025`：12 个文件，包含 DataTable 能力、文档、回归和重新生成的 Registry / llms。此前独立通过 16 个文件、66 项测试、类型和 lint 检查；全量检查时同步了结构色测试对新外观契约的断言。
- 第二笔采用上述 `feat(blocks): add agent run usage analytics`，共 45 个文件。只迁入 8 个 Block 源文件、对应 Demo / 文档 / 测试及共享文件中的本功能片段；Registry 只新增 agent-runs-01，无条目移除。8 个核心源文件和预览 hash 均与已审查的实现一致。
- 候选重新生成后的计数为 193 Registry items、202 Agent items、103 guides、164 docs、160 split routes、70 previews、73 artifacts / 47 embeddable blocks。测试名单及计数按此候选调整，保留既有断言。
- 候选通过 22 个测试文件、100 项测试、类型检查、全量设计 lint、相关 ESLint、Registry / Agent catalog / 文档源 / 路由 / loaders / guide loaders 一致性检查。
- 按 CI 要求补跑完整单元测试及全量 lint：Node 22.17.0 下 374 个测试文件、3320 项测试全部通过，全量 lint 通过。本机默认 Node 23 会使发布门禁测试返回 NODE_22_REQUIRED；已保留该次诊断并切换到现有 Node 22 完整重跑，未改动发布门禁或测试配置。
- `pnpm build` 完整执行成功，静态页面生成完成；Next 与 Vite 的 pnpm 安装矩阵完整通过。生产构建日志保留 docs introduction 页的缺少翻译提示，该页及其 provider / 文案与远端基线一致，未混入此提交。Vite 依赖中的 use client 指令提示也保留在日志中。
- 基于本地生产服务验证中英文独立演示和文档页。320 / 390 / 768 / 1440px 的分页同行、页面无横向溢出；390px 的时间列 / 日期 / 明细固定、表头与表体交叉层级正确；分页、每页 20 条、模式切换、泳道键盘定位、准确会话回调、加载 / 空态 / 错误 / 重试均通过。中英文的明暗主题完成截图检查，页面运行异常为 0。localhost 的 Vercel 统计脚本返回 404 属于本地服务环境，保留原始控制台记录。

首次远端 E2E 发现 `tests/docs-collections.e2e.ts` 仍将 chat-markdown-01 硬编码为区块首项；新增 Agent Runs 后实际首项已变化。将 agent-runs-01 加到既有显式键盘导航序列之前，保留原有导航断言。本地生产版本下三个集合导航 / 搜索 / 窄屏测试全部通过。为保留已上传的两笔功能提交，追加 `test(docs): include agent runs in collection keyboard navigation`，只同步该测试与本执行记录。

GitHub main 要求远端 checks，通过 PR #48 完成检查后合并。提交阶段的日志、文件清单与浏览器结构证据保存在隔离工作区的 `output/agent-runs-publish/`，截图在 `output/playwright/`，均不进入 Git 提交。不使用 force push 或绕过保护规则。
