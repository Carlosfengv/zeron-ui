# 交易详情 Block Review 与 Commit 计划

日期：2026-10-06。范围：本次新增的 transaction-details-01、演示、测试、文档与分发接入。已完成修复，尚未执行 git add、commit 或 push。

## Review 结果

| 问题 | 原因与影响 | 已完成调整 |
| --- | --- | --- |
| 未知交易类型/状态可能被错误显示或导致渲染异常 | 原先用 `in` 查找文案/状态映射，接受了原型属性；交易类型还会误接受 `title`、`approved` 等非类型字段 | 类型使用独立映射；类型与状态都只接受映射自身的键；未知值显示 — |
| 不存在的日期自动顺延 | Date.parse 会把 2025-02-29 转成 3 月 1 日，造成日期误显示 | 校验 ISO 日期时间结构、月份天数及闰年，再格式化；非法值显示未知 |
| 关闭后仍出现演示操作结果 | demo 父组件仍挂载，待执行的分享/附件回调仍会打开弹窗 | 用视图代次标识关闭前的操作；关闭后或关闭再重开，不打开旧弹窗或触发旧下载 |

先以回归用例复现枚举与日期问题，再修复；浏览器复现分享后立即关闭的竞态，修复后通过真实演示操作与测试复核。公开 block 的类型、动作 payload 和正常数据行为保持原契约。

## 最终样式与组件约定

- 两组详情都使用公开 DetailList 及其子组件；Container、Accordion、InfoItem 承担各自布局与交互职责。
- 已批准使用 Badge 的 `status="success"`、`size="md"`。内容使用 flex 与 md 对应间距；不覆盖 Badge 的高度、颜色、边框或圆角。测量内容与图标中心偏移均为 0px。
- 付款人外层无边框、无 padding，保留头像与姓名间距；付款人邮箱为无边框、无 padding 的可换行文本。
- 账单外层是 `rounded-xl border-hairline border-border`，不额外设置背景或 padding。Accordion 自身仍提供展开背景及内容内边距。
- actions 仍由宿主提供，真实请求、超时与取消仍由宿主负责；演示层的视图失效处理不代表取消真实服务请求。

## 提交前置依赖

当前工作区包含其他任务尚未提交的源码与生成文件，不能把整个工作区一起暂存。

1. block 引用的 `packages/ui/src/components/error-state.tsx` 当前尚未进入 HEAD；须先落地对应 ErrorState 组件、包导出与 Registry 登记，再提交本 block。该组件属于共享反馈任务，不在本次 review 中重写。
2. demo 引用的 `docs/components/blocks/DataStateDemoControls.tsx` 当前尚未进入 HEAD；须先落地共享演示状态实现，再提交 demo。不能遗漏这个运行依赖。
3. 若使用当前工作区的文档加载生成器重构，须先落地其所属任务。交易详情提交只选择自身的登记项，不夹带整套加载机制变更。

## 建议的 3 个 Commit

### 1. `feat(tokens): add display typography for prominent values`

包含：

- `packages/ui/src/tokens/semantic-tokens.mjs` 中 display 的唯一源定义。
- 由 tokens 生成器更新的 `app/globals.css`、`packages/tokens/index.mjs`、`packages/tokens/tokens.css`。
- `packages/ui/registry.json` 与 `public/r/surfaces.json` 等主题分发产物中仅 display 相关内容；在隔离的提交状态重新生成，避免混入其他新 UI 原语。

验收：token 测试、tokens:check、Registry 一致性检查。

### 2. `feat(blocks): add transaction details data block`

包含：

- `packages/blocks/src/application/transaction-details-01/` 的组件、类型、文案、格式化、示例数据与入口。
- `tests/transaction-details-format.test.ts`、`tests/transaction-details-interaction.test.tsx`，包含本轮校验回归用例。
- `docs/components/blocks/transaction-demo-pdf.ts`：现有格式化测试验证示例 PDF，因此这份确定性辅助实现需要一起提交，保持该 commit 可独立运行测试。
- `packages/blocks/package.json` 中本 block 的导出及所需图标依赖、对应 pnpm-lock.yaml 改动。
- block catalog、capability、Registry 的 transaction-details-01 登记项，及 `public/r/transaction-details-01.json`、Registry 索引中的对应生成内容。
- `scripts/test-consumer-installs.mjs` 中 transaction-details-01 的 Next/Vite 样例；不纳入其他 block、图表或反馈组件的样例变更。

验收：核心测试、类型检查、设计 lint、Registry 检查；空间充足时重跑明确选择该 block 的 Next/pnpm 与 Vite 安装构建。

### 3. `docs(blocks): publish transaction details demos and guidance`

包含：

- `docs/components/blocks/TransactionDetailsDemo.tsx`、`tests/transaction-details-demo.test.tsx`，包括关闭后忽略旧操作结果的回归用例。
- `docs/pages/blocks/transaction-details-01/`、对应 app 文档路由、双语 blocks 文案与 common 描述。
- BlockPreview、StandaloneBlockDemo、standalone slugs、artifact catalog、manifest 的本 block 接入项。
- `docs/agent-guides/blocks/transaction-details-01.md` 与 agent identity、组件信息、guide route 中本 block 的记录。
- 源码白名单、文档/内容/guide 加载映射、预览源码与公开 llms 内容中相应生成改动。
- 实施方案与本 review/commit 计划；关联文档契约测试中的 transaction-details-01 登记和正确计数。

验收：demo 回归、文档/预览/双语/独立演示契约、生成一致性，以及中英文、窄宽容器和菜单/折叠主流程。

## 暂存与生成策略

- 本 block 新文件按上述分组加入；共享源码文件按本 block 的改动块暂存。
- `tests/docs-artifact-catalog.test.ts` 和 `tests/i18n-document-manifest.test.ts` 的计数及枚举同时包含其他任务新增项，须以各 commit 实际已落地的目录重新核对，不能直接把当前总计数当成本 block 的改动。
- 共享生成文件应在包含前置依赖和本次提交源码的隔离分支中重新生成并校验，再加入对应 commit；不手工删改最终 Registry JSON 来匹配计划。
- 不使用 `git add .`，不纳入其他 block、图表、Slider、RadioGroup、Tooltip、全局 Next 配置和测试基础设施变更。
- `.zeron/reports/`、临时日志、截图和消费者目录作为本地验证证据；不整目录提交其他任务的报告。

## 本轮验证与限制

已通过核心与 demo 共 22 项测试，类型检查、定向 ESLint、全库设计 lint，以及 Registry、token、预览源码、文档路由/加载器、guide/agent catalog 一致性检查。关联文档与双语检查连同核心测试共 40 项通过；语义 token、Registry、预览源码和独立演示契约另外 72 项通过，本轮共 10 个测试文件、112 项通过。

浏览器复查当前中文宽屏和 320px 窄屏、英文窄屏菜单与折叠；无整体横向溢出；保留全部用户已确认的样式调整。分享后立即关闭，不再产生旧弹窗。

本轮 Next 消费者生产构建因 ENOSPC（磁盘空间不足）失败，脚本已自动清理自身临时目录；Vite 阶段尚未执行。此前实施阶段的 Next/Vite 安装构建通过记录仍保留，但不替代本轮结果。本轮未重跑整个站点生产构建。建议提交前在空间充足时补完消费者矩阵；不删除其他任务的缓存或构建产物来绕过资源限制。

完整本地组件报告：`.zeron/reports/transaction-details/review-after.json`。自动来源识别未解析的 DropdownTrigger 已人工确认是公开的 Menu.Trigger 别名；token mjs 不在报告 ESLint 覆盖范围，另以 token 检查验证。未新增 UI 原语或 lint 豁免。

报告覆盖 11 个实现/演示/文档/token 源文件，识别 44 种 UI 导出、73 次使用；全部组合共 62 种组件、110 次使用。已检查的 10 个文件无静态错误或警告。布局组为 Container/DetailList；内容与交互组为 Accordion/Avatar/Badge/Button/Dropdown/InfoItem/Tooltip；状态组为 Skeleton/Empty/ErrorState/InlineNotice。来源别名与 mjs 覆盖限制如上，不把自动报告的 unchecked 当作通过。
