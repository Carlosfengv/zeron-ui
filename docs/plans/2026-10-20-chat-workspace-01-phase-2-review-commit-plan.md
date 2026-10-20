# Chat Workspace 01 第二期与会话菜单：review 和 commit 计划

日期：2026-10-20。远端基准：`origin/main` / `d73faa6e68dee84ee199ce4fec0ed5ab5bc206f8`。本轮只 review、修正和验证，不暂存、不 commit、不 push。

第一期已在 main，本计划只提交第二期、后续标题／开关调整和会话菜单的增量。主工作区的本地 main 仍停留在较旧提交，包含多个并行功能；不得以它的整棵 dirty tree 作为提交内容。隔离候选已经切换到上述最新 main，切换前后工作区自有源码哈希一致。

## Review 结果与修正

| 优先级 | 问题 | 修正与证据 |
| --- | --- | --- |
| P2 | 标签已完成测量，但常驻更多按钮等操作占满宽度后，可用预算可能为 0 或负数；原判断将它误认为未测量并显示全部标签 | 仅在宽度未知时保留 SSR 标签；实际预算耗尽时保留活动项，其余仍通过菜单访问。补充空列表与 0／负预算回归。 |
| P2 | 图片在已获得尺寸后失败，缩放／原尺寸按钮仍启用，旧的拖动状态和指针捕获也可能保留 | 统一由图片 ready 状态控制缩放及平移；失败时取消拖动并释放捕获，重试加载完成后恢复。补充失败与重试回归。 |
| P3 | 关闭重命名弹窗时将 mode 设为 null，退出动画尚未结束就切换为分享标题、链接与按钮 | 分离弹窗类型与开关，退出时保留原内容。通过保留退出动画的测试证明修正前失败、修正后通过。 |
| P3 | 会话菜单的表单、剪贴板和 mock 状态混在流式聊天演示中，增加阅读及后续提交难度 | 拆出文档端 `ChatWorkspaceSessionMenu.tsx`；核心仍只提供 headerActions，未增加菜单、Dialog、剪贴板或会话服务依赖。 |

三个行为回归均先复现失败再修复。保留已有的精确版本审阅、并发锁、部分失败重试、独立 ArtifactPanel、关闭后待审阅计数和草稿保留。继续排除 Diff 变更块审阅、行级评论和代码编辑；未连接真实模型、分享或文件保存服务。

## 建议按顺序拆为两笔 commit

| 顺序 | Commit 标题 | 范围 |
| --- | --- | --- |
| 1 | `feat(blocks): add resource-level workspace review controls` | 可安装核心：文件级审阅、列表和导航、批量关闭、图片原尺寸／缩放／平移、失败恢复；headerActions、14px medium 标题及 Sidebar 一致的内容区开关。 |
| 2 | `docs(blocks): add session actions and phase-two workspace demos` | 会话菜单、演示状态适配、完整双语文档、提示输入区与菜单回归、review 记录和本计划。 |

### Commit 1：核心 Block

只选择以下源码增量：

- `packages/blocks/src/application/chat-workspace-01/artifact-labels.ts`
- `packages/blocks/src/application/chat-workspace-01/artifact-panel.tsx`
- `packages/blocks/src/application/chat-workspace-01/artifact-preview.tsx`
- `packages/blocks/src/application/chat-workspace-01/artifact-tabs.tsx`
- `packages/blocks/src/application/chat-workspace-01/chat-workspace-types.ts`
- `packages/blocks/src/application/chat-workspace-01/chat-workspace.tsx`
- `tests/chat-workspace.test.tsx`
- `tests/chat-workspace-prompt.test.tsx` 中既有批量审阅测试的菜单入口适配；新增会话菜单测试留在第二笔，以保证两笔都可独立验证。
- Agent 指南中上述核心 API、状态归属和操作行为的相关内容。

新增公开接口仅为可选 `ArtifactPanel.onCloseMany`、`ChatWorkspace.headerActions` 及相应 labels。onCloseMany 提供时处理所有关闭操作；否则兼容逐项 onClose。headerActions 为宿主插槽，核心不内置会话业务。第一期其他核心文件内容不变，不重复提交整套 Block。

按“最新 main + 本笔源码”生成和验证 `public/r/chat-workspace-01.json`、本 Block 的 preview source bundle／索引和受影响的 Agent／llms 产物。Registry 索引、包导出、依赖列表和 Block 注册本期均无新增，不能顺带提交它们的其他修改。

验收：独立面板、逐项／批量锁及部分失败、精确版本、待审阅循环定位、关闭当前／其他／全部、图片缩放和失败恢复、空列表／极窄预算、输入节点与草稿保留、安装闭包、类型和样式。

### Commit 2：演示、会话菜单与文档

- 新增 `docs/components/blocks/ChatWorkspaceSessionMenu.tsx`，仅由 Workspace 演示引用。
- `docs/components/blocks/ChatWorkspaceDemo.tsx`：使用独立菜单、可重命名标题和 onCloseMany，保持 ChatThread 模型输出组合。
- `docs/pages/blocks/chat-workspace-01/ChatWorkspaceBlockDocClient.tsx`：headerActions / onCloseMany API 展示。
- `docs/content/{en,zh-CN}/blocks/chat-workspace-01.json`。
- Agent 指南中的菜单组合与 mock 边界说明及对应生成产物。
- `tests/chat-workspace-prompt.test.tsx`：重命名、关闭动画、置顶／归档切换、mock 分享、复制失败、关闭后计数、草稿与模型输出回归。
- `docs/plans/2026-10-20-chat-workspace-01-phase-2.md` 与本计划。第一期 review 计划保留原记录，不携带其主工作区中的未提交旧版本。

验收：菜单键盘路径与焦点返回、取消重命名不改标题／草稿、保存去除首尾空格并拒绝空白名称、Dialog 退出内容稳定、置顶／归档可取消、分享明确为 mock、复制含失败反馈；桌面与 390px 下没有横向溢出。

本笔不改 `ChatDemoParts.tsx`、`ChatThreadDemo.tsx`、chat-thread、tool-calls、artifact-01 或其他 Block 的实现。所需前置能力已在 main，不重复带入其文件或提交。

## 范围与执行规则

1. 执行时重新 fetch main，在最新 main 上建立 `codex/chat-workspace-phase-2` 候选分支。当前隔离工作区是 detached 验证候选，不直接提交旧分支上的第一期历史。
2. 只应用上面的文件白名单和相关指南片段；禁止 `git add .`，不暂存主工作区整体的 package.json、lockfile、manifest、catalog、注册表、加载器和其他 Block。
3. 每一笔分别在自己的候选树重新生成 Registry、preview source 和 Agent 产物；不直接搬主工作区的整份 generated 文件，也不手工拼接最终 hash 或生成 JSON。共享生成文件只允许本 Block 对应的差异。
4. 提交前分别检查 staged diff、依赖闭包、类型、样式及本笔测试。第二笔完成后再次核对从 main 开始的整段变更，确保其他 Block 源码改动为 0；不得重提第一期。
5. 两笔均无新增 npm 依赖，无共享 UI 或 lint 规则变更。保留主工作区所有无关修改；不 reset、stash 或清理主工作区。
6. `output/chat-workspace-01/` 是忽略的本地证据，不提交。真实文件操作、会话持久化和分享服务仍由宿主接入。

## 验证与限制

- 核心和演示功能、安装闭包及双语文案共 4 个文件、50 项测试通过；新增三个回归在修正前均失败。
- 最新 main 隔离候选执行完整类型和 design lint 检查；相关新增／调整源码另跑普通 ESLint。以本地 verification.json 的最终状态为准。
- 干净 pnpm / Vite 项目使用打包 CLI 与 HTTP Registry 安装本 Block，类型和生产构建通过。消费者验证覆盖当前核心源码，隔离候选更新基线时这些源码哈希保持一致；保留第三方 use-client、chunk 或包管理器提示，不声称日志无警告。执行提交时仍需检查每笔最终 Registry 的安装结果。
- 浏览器验证桌面和 390×844 下的菜单、Dialog 取消与焦点返回、草稿保留、14px / 500 标题、32px 操作按钮与溢出。错误／动画边界由自动化回归覆盖，不把模拟故障称为真实后端验证。
- 最终七文件使用报告与完整验证记录位于 `output/chat-workspace-01/phase-2-review/`。初始报告覆盖六文件，后续新增菜单文件，故不声称跨范围组件数量的增减；未新增样式变量或 lint 例外。
- 未执行完整文档站生产构建、Next / npm 消费者全矩阵或真实服务调用。提交执行阶段须对每笔最终 staged 状态再验收，当前工作区通过不代替中间 commit 验证。
