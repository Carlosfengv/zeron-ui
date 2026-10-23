# Credit Top-up 01 review 与 commit 计划

日期：2026-10-22。范围：`credit-top-up-01` 核心、演示、双语文档、发现入口、Registry 和安装验证。

本轮完成了实现整合、代码审查和优化，未暂存、commit 或 push。审查时已 fetch，`HEAD` 与 `origin/main` 均为 `ae5fe767a606f059ff4924acc16cf8de949f1477`；两者都没有此 Block，因此应提交一份完整的新功能，不把此前的配色迭代拆成多个 fix commit。实际提交前再次确认远端基线。

## Review 结果与已完成优化

| 优先级 | 发现 | 处理与验证 |
| --- | --- | --- |
| P2 | 初始空套餐在异步加载完成后没有建立单选默认值；显示报价与 radio 选中状态可能不一致 | 首个可用套餐到达时初始化一次；后续重排保留选择，显式或失效 ID 不被静默替换。回归覆盖空列表加载与重排。 |
| P2 | 宿主改变受控选择或同 ID 的报价后，旧错误仍显示 | 反馈绑定当前套餐的 ID、额度、价格和币种，替换报价时清除旧反馈。覆盖受控切换、切回和同 ID 调价。 |
| P2 | 旧请求失败可能污染新选择，切走再切回时也可能重新显示 | 请求持有独立的反馈对象，只能更新仍属于该请求的状态；不依赖 ID 相等来判断。覆盖切换及切回期间的迟到失败。 |
| P2 | 无效时区连带将有效的数字语言回退为英文；小额报价被四舍五入 | 将 locale 与 timeZone 回退分开；复用数值、日期和币种格式器，报价最多保留 20 位小数。覆盖 de-DE + 无效时区、无效 locale，以及 $0.005。 |
| P3 | 不足一天被写成约一天；极端低用量可显示非有限天数 | 增加中英文 lessThanDay，保留不足一天含义，省略非有限天数；英语单数 day 修正。覆盖计算与 radio 可访问名称。 |
| P3 | 宿主分类 ID 为 remaining 时，与剩余额度图例重复 key | 分类图例 ID 加 usage 命名空间；原始分段 ID 不变。覆盖图例唯一性。 |
| P3 | 套餐可访问名称中额度、描述、价格缺少分隔；长报价和连续长分类名在窄容器中溢出 | 补明确文本空格；报价限制半行宽度并允许换行；确认文案建立块级省略，标题允许收缩换行。回归验证完整 radio 名称，浏览器检查窄屏和长内容。 |
| P3 | 演示取消或切换模拟状态后仍可能残留上一轮错误 | 演示取消和状态切换重新建立 Block；浏览器验证错误出现后，两条恢复路径均清除提示。 |
| P3 | 选择套餐时重复派生用量、创建 Intl 格式器及重绘活动卡片 | 缓存数据派生与格式器，memo 活动卡片；不新增状态管理依赖。文档要求以新对象更新 data、usage、labels。未做性能基准，不声称具体耗时收益。 |

本轮新增 10 项行为/数据回归：最初 9 项在修正前失败，随后增加的“切走再切回时旧请求失败”也先复现再修正。最终 Block 行为/数据 18 项、Registry 安装 1 项通过；连同文档目录和国际化检查，共 5 个文件 38 项通过。

已移除未使用的草稿 `labels.viewData` 字段，保留 sr-only 数据表与 historyColumn。该 Block 尚未进入上述本地/远端基线；这属于未发布 API 整理。新增 lessThanDay 有内置默认文案，宿主仍可通过 Partial labels 覆盖。

## 保留的设计与职责

- 分类色沿用已确认的原分段条：客服回复 chart-5 紫色，代码审查 chart-1 蓝色，研究 chart-3 橙色。标题、图标、图表基础色、分段条与图例使用同一个公共 chartColor；茎线和面积填充保持透明度。
- 确认按钮使用 primary 主题色，取消使用 secondary。没有“查看数据”展开入口；保留图表提示、键盘浏览和屏幕阅读器表格。
- 继续组合 Container、Card、Chart、Chart primitives、RadioGroup、Button、InlineNotice 和图标上下文。不新增 UI primitive、全局 token、依赖包或 lint 例外。
- Block 接收宿主报价，回调完整套餐；提交期间防止重复确认。支付、权限、最终报价校验、关闭页面与刷新余额由宿主负责，演示不扣款。

浅色主题存在已确认配色的可读性取舍：白色卡片上，紫色标题测得对比度 4.23:1，橙色标题 2.15:1，蓝色 5.83:1。图例同时显示名称与数字，但不能据此宣称完整无障碍验收通过。本轮按用户确认保留配色；后续可单独决定是否为标题采用更深的分类文字色，不应在此提交中悄悄改变颜色约定。

## 建议一笔原子 commit

标题：`feat(blocks): add credit top-up purchase panel`

这一笔包含核心、目录接入、文档、测试及对应生成产物。目录测试要求 Block、Artifact、Manifest、预览和安装入口相互一致，分成“先核心、后注册”的中间提交会破坏这些约束。所有优化直接进入最终实现。

建议提交说明：

```text
Add a credit purchase panel with usage charts, monthly allocation and package selection.
Support controlled selection, async checkout feedback, localized quotes and responsive layouts.

Publish the Registry item, bilingual docs, interactive demos and regression coverage.
```

### 新增文件：完整纳入

核心目录 `packages/blocks/src/application/credit-top-up-01/` 的 8 个文件：

1. `index.ts`
2. `credit-top-up.tsx`
3. `credit-top-up-chart.tsx`
4. `credit-top-up-data.ts`
5. `credit-top-up-formatters.ts`
6. `credit-top-up-types.ts`
7. `credit-top-up-labels.tsx`
8. `credit-top-up-demo-data.ts`

其他新增文件：

- `docs/components/blocks/CreditTopUpDemo.tsx`
- `docs/pages/blocks/credit-top-up-01/page.tsx`
- `docs/pages/blocks/credit-top-up-01/CreditTopUpBlockDocClient.tsx`
- `docs/content/en/blocks/credit-top-up-01.json`
- `docs/content/zh-CN/blocks/credit-top-up-01.json`
- `docs/agent-guides/blocks/credit-top-up-01.md`
- `tests/credit-top-up.test.tsx`
- `tests/credit-top-up-registry-install.test.ts`
- 本计划。

### 共享文件：仅选择本 Block 的片段

| 文件 | 本笔拥有的修改 |
| --- | --- |
| `packages/blocks/package.json` | ./credit-top-up-01 export。 |
| `packages/blocks/block-capabilities.json` | React data-block 条目。 |
| `packages/blocks/registry.json` | 完整 8 文件条目、Recharts npm 依赖及公共 UI 依赖。 |
| `packages/blocks/src/catalog.ts` | credit-top-up-01 描述、安装能力和一致的依赖列表。 |
| `docs/catalog/artifacts.ts` | shared / adapter-required / controlled 条目；不带入其他产品分类改动。 |
| `docs/manifest.ts` | credit-top-up-01 blockEntry。 |
| `docs/components/blocks/BlockPreview.tsx` | 本条目的动态加载与 1440 × 900 响应式预览。 |
| `docs/components/blocks/StandaloneBlockDemo.tsx` | CreditTopUpDemo 导入和分支。 |
| `docs/components/blocks/standalone-blocks.ts` | 本 slug。 |
| `scripts/preview-source-allowlist.mjs` | 上述 8 个核心文件。 |
| `scripts/test-consumer-installs.mjs` | Next 消费者示例；不带入其他功能或 Vite 示例调整。 |
| `docs/agent-data/item-identities.json` | block:credit-top-up-01 身份条目。 |
| `docs/agent-data/guide-routes.json` | 本指南路由。 |
| `tests/docs-artifact-catalog.test.ts` | 本 Block 列表项及候选版本所需计数。 |
| `tests/i18n-document-manifest.test.ts` | 本 Block 引起的文档与重定向计数。 |

当前共享文件包含其他进行中的功能，不能整文件暂存。目录计数按实际候选基线重算，不能照搬混合工作区的 77 / 177 / 99 等总数。

### 生成产物：在隔离候选状态重新生成

- `app/[locale]/docs/blocks/(detail)/credit-top-up-01/page.tsx`
- `docs/generated/{block-page-loaders,page-loaders,agent-guide-loaders}.generated.ts`
- `docs/i18n/content-loaders.generated.ts`
- `docs/lib/block-preview-sources.generated.ts` 和对应 `public/docs-source/<hash>.txt`
- `public/r/credit-top-up-01.json`、`public/r/registry.json`
- `docs/agent-data/components.json`、`public/llms.txt`、`public/llms-full.txt` 等生成器实际影响的跟踪文件。

当前预览源码 hash 为 `2bc708bfd45c4fb20fa23241758338a5aa51f8c18995c02092e0e2dbb99563a7`，只作本次证据定位；以候选重新生成结果为准。Block 新增，不应删除其他条目的旧 hash。不要整份复制当前混合工作区的 Registry 索引、Agent 数据、llms 或 loaders。

## 执行顺序

1. 再次 fetch 并记录 origin/main；从该基线建立隔离候选分支，例如 `codex/credit-top-up-01`。不在当前混合 main 中使用 `git add .`。
2. 迁入上面列出的新增源码、文档和测试，再仅迁入共享文件中属于本 Block 的片段。已有 UI 依赖均存在于本次核验的 origin/main，无需先提交其他 AI 组件功能。
3. 按候选真实目录重算列表和计数；先生成文档 loaders，再生成依赖它的 routes，然后生成 sources、guide loaders、Registry，最后生成 Agent catalog。源文件完成后再生成，安装检查须等待 Registry 后处理结束。
4. 在候选重新运行下面验收；检查源码、文档与安装闭包，不把混合工作区的通过记录当作隔离候选已通过。
5. 按路径及 hunk 暂存，检查 staged diff 和文件清单后创建这一笔 commit。按用户授权执行 commit，未要求 push。

候选生成命令：

```sh
pnpm skills:build
pnpm docs:loaders:build
pnpm docs:routes:build
pnpm docs:sources:build
pnpm agents:guides:build
pnpm --filter @zeron/registry build
pnpm agents:build
```

本功能未改动 token 或 code-engine 资产，因此直接使用 Registry 包生成入口。若候选基线确实缺少其他生成前置，按仓库既有构建流程补齐，不借本功能引入无关源码变化。

明确排除：其他 Block 和 AI 组件的新增/抽取、公共 UI 的其他修改、封面图片、design-qa.md、根 package.json、lockfile、tsconfig、middleware、视频原件及所有忽略的 output / 临时浏览器验证页面。

## 本轮验证与提交验收

| 检查 | 本轮结果 |
| --- | --- |
| Vitest | 5 文件 38 项通过，包括 18 项行为/数据与 1 项 Registry 安装闭包；未运行整个仓库单测集。 |
| 类型 | 根项目 typecheck 通过。 |
| 代码与设计 | 核心、文档、测试和受影响共享脚本的 ESLint 通过；完整 lint:design 通过。 |
| Registry | scope all 检查 206 项通过；条目含 8 个核心文件，工作区别名正确改写。 |
| 文档一致性 | routes 173、loaders 177、preview sources 74、guide loaders 和 Agent catalog 一致性检查通过；这些数量描述当前混合快照。 |
| 消费者 | 打包 CLI + HTTP Registry，在干净 npm / Next 项目安装本 Block，类型和生产构建通过；本轮没有运行 Vite 或其他包管理器矩阵。依赖安装存在 audit / deprecated 提示，未声称日志零警告。 |
| 浏览器 | 1440px 明暗主题和 390px 窄屏；确认、取消、键盘选择、失败后取消、失败后切换模拟状态通过。页面与 Block 未出现横向溢出；分类基础色一致、确认按钮匹配 primary、无数据展开入口。临时页面以连续长分类名和 1e100 报价验证：修复后报价行和按钮均不超出容器，按钮使用省略号，完整金额在套餐行换行显示；临时页面已移除。 |

Registry 检查首次与生成并行时读到了尚未完成别名改写的中间文件而失败。生成及后处理完成后，完整检查和测试重新通过；未修改共享 UI 或降低断言来绕过失败。

提交前至少重跑：

```sh
pnpm exec vitest run --config vitest.config.mts tests/credit-top-up.test.tsx tests/credit-top-up-registry-install.test.ts tests/docs-artifact-catalog.test.ts tests/i18n-document-manifest.test.ts tests/i18n-message-parity.test.ts --maxWorkers=1
pnpm typecheck
pnpm lint:design
pnpm registry:check
pnpm docs:routes:check
pnpm docs:loaders:check
pnpm docs:sources:check
pnpm agents:guides:check
pnpm agents:check
ZERON_CONSUMER_COMPONENTS=credit-top-up-01 ZERON_CONSUMER_PACKAGE_MANAGERS=npm ZERON_VITE_CONSUMER_PACKAGE_MANAGERS='' node scripts/test-consumer-installs.mjs
```

上表记录 2026-10-22 的混合工作区 review；未运行整个文档站生产构建、真实支付集成或真实屏幕阅读器矩阵。隔离候选验收结果见下方 2026-10-23 执行记录。

## 组件与样式统计

核心 8 文件加演示共 9 文件：识别 26 种来源/导出组合、30 次 JSX 使用；其中公共 UI 13 种、17 次。0 lint 错误、0 警告，无新增样式变量。主要组合为 Container / Card、Chart / Chart primitives、RadioGroup、Button 与 InlineNotice；三种小图使用已有 ChartContainer 和 Recharts，业务计算保留在 Block 内部。

本轮 baseline 为优化前的 8 文件工作区快照，新增 formatter 缺少 baseline，不能自动归因整个范围的增减。ChartTooltip 是公共 chart.tsx 对 Recharts Tooltip 的别名导出，自动 inventory 未能解析，已人工追踪；这项 unchecked 未被抹除。核心由完整设计 lint 覆盖。共享集成另有 14 文件报告，包含共享文件的其他条目和测试 JSX，统计不作为本 Block 的组件数量；两份 mjs 在该设计配置下未检查，另经基础 ESLint 验证。

本地证据位于忽略的 `output/credit-top-up/`：review-before / review-after、review-integration 报告与 review-verification.json；截图位于 `output/playwright/credit-top-up/review-*.png`。这些证据保留在本机，不加入产品提交。

## 执行记录（2026-10-23）

按用户要求在 `codex/credit-top-up-01` 隔离分支执行。重新 fetch 后基线仍为 `ae5fe767a606f059ff4924acc16cf8de949f1477`，没有迁入原工作区的其他功能。

- 范围核对：共 43 个相关文件。源码 Registry、公开 Registry 索引、身份与指南路由均只增加 credit-top-up-01；所有原有条目逐项比较相等。公共 UI、根 package.json、lockfile、tsconfig、middleware 和封面图片没有改动。
- 本候选包含 72 个 Artifact（46 个 Block、26 个 Page）、163 个文档；已有 legacyDocRedirects 仍为 90。本 Block 不增加组件旧地址重定向，没有照搬混合工作区的计数。
- 生成器在候选中重新运行。干净 checkout 先执行 skills:build 产生忽略的技能分发前置；文档 loaders 必须先于依赖它的 routes 生成，本计划已修正顺序。未复制原工作区的混合生成索引。
- 验收通过：5 个测试文件、38 项测试；根类型检查、完整 lint:design、受影响范围 ESLint；192 项 Registry 闭包；159 个路由、163 份文档 loader、69 份预览源码、102 份指南与 201 条 Agent catalog 一致性。
- 使用本候选的打包 CLI 和 HTTP Registry，在干净 npm / Next 项目安装并完成类型检查和生产构建。安装日志有 audit / deprecated 提示，没有为此升级依赖或修改锁文件；Vite 和其他包管理器矩阵未运行。
- 8 个核心文件与演示共 9 个文件的 SHA-256 均与前次已验证版本一致。本次沿用前次浏览器交互和明暗/窄屏记录，未在隔离 checkout 重新启动浏览器验收。
- 按明确的 43 文件清单暂存并检查差异；只创建本地 commit，不 push。原 main 工作区的未提交修改保留。

执行日志及精确文件清单保存在本机 `/tmp/credit-top-up-commit/`，不加入产品提交。提交结果以 Git 分支记录为准。
