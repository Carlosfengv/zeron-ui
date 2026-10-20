# Artifact 01 优化与 commit 计划

日期：2026-10-20。审查基准 HEAD：`b1436268`。范围：`artifact-01` 的实现、演示、文档、安装与发现入口。本轮没有暂存、commit 或 push。

## 已完成优化

| 问题 | 最终行为 |
| --- | --- |
| 切换代码、预览和变更时重新创建 iframe，丢失表单、计费选择与阅读状态 | 当前修订内已访问的视图保持挂载，未访问视图按需加载；每个视图拥有独立错误边界。切换修订释放旧视图，主动刷新只重建预览。生成中不运行 HTML。 |
| 非受控面板恢复历史版本后仍停留在原版本，恢复按钮可以重复操作 | 宿主完成追加修订后，非受控选择跟随最新版本；失败时保留原选择。请求期间用户切换版本或文档时保留其选择。受控模式继续由宿主更新 `revisionId`。 |

复用边界保持为：ArtifactWorkspace → ChatWorkspace → ChatThread / Resizable；GeneratedArtifactCard → ArtifactCard。右侧版本面板复用 Tabs、CodeBlock、CodeDiff、Markdown、Dropdown、MenuItem、Button、Empty 与 InlineNotice。没有增加 npm 依赖、公开 props、主题变量或 lint 例外。

## 提交依赖

`artifact-01` 在当前 HEAD 中尚未跟踪，因此两个修复直接并入首次功能提交。建议完成前置能力后，用一笔原子功能提交交付 Artifact 的代码、文档与分发闭环；这样目录、路由、安装入口和测试断言在同一提交中保持一致。

| 前置 | 关系与归属 |
| --- | --- |
| chat-thread-01、Markdown、ChatMessage / InputMessage / MessageNavigation 基础能力 | 先按照各自计划提交并验证；不在 Artifact 提交中再次带入整套基础组件。 |
| chat-workspace-01 与其 UI、Registry 依赖 | Artifact 直接依赖公开 ChatWorkspace、ArtifactCard 和 ArtifactResource。先完成 [Chat Workspace 提交计划](2026-10-20-chat-workspace-01-review-commit-plan.md) 中需要的核心与分发能力。 |
| ChatDemoParts、model-selector-01、context-window-02 | ArtifactDemo 的文档端依赖，先由所属会话演示提交提供。它们不成为 Artifact 核心的强制 Registry 依赖。 |
| Chat Workspace 后续菜单、审阅等独立优化 | 依所属任务提交。Artifact 不拥有这些共享文件的其余修改。 |

这些依赖在混合工作区中可用，尚不能据此认定已经存在于 Git 基线。执行提交时先确认前置 commit，而不是把当前整个工作区一起暂存。

## 建议的主 commit

`feat(blocks): add versioned artifact creation workspace`

建议描述：

> Add an Artifact workspace on the shared ChatWorkspace layout for generated HTML, Markdown and code. Preserve visited view state and support controlled or uncontrolled revision restoration without overriding navigation during a pending request. Include bilingual demos, documentation, Registry distribution and regression coverage.

### 1. 完整拥有的实现与测试

- `packages/blocks/src/application/artifact-01/` 的 7 个文件：artifact-content.tsx、artifact-demo-data.ts、artifact-labels.ts、artifact-preview-panel.tsx、artifact-types.ts、artifact-workspace.tsx、index.ts。
- `tests/artifact.test.tsx`：原有面板行为，以及本轮的预览/源码节点保留、修订释放、非受控恢复、受控边界、失败保留与异步导航回归。
- `tests/artifact-demo.test.tsx`：首次文档修订、停止、重试与重放。
- `tests/artifact-registry-install.test.ts`：独立面板、懒加载内容文件、公开导出及完整安装依赖闭包。

### 2. 完整拥有的演示与说明

- `docs/components/blocks/ArtifactDemo.tsx`。
- `docs/pages/blocks/artifact-01/`、`app/[locale]/docs/blocks/(detail)/artifact-01/`。
- `docs/content/en/blocks/artifact-01.json`、`docs/content/zh-CN/blocks/artifact-01.json`。
- `docs/agent-guides/blocks/artifact-01.md`。
- `docs/plans/2026-10-20-artifact-01-implementation.md` 与本计划。

### 3. 共享文件仅收 Artifact 条目或分支

- `packages/blocks/package.json` 的 `./artifact-01` 导出。
- `packages/blocks/block-capabilities.json`、`registry.json`、`src/catalog.ts` 的 Artifact 条目。
- `docs/catalog/artifacts.ts`、`docs/manifest.ts` 的 Artifact 元数据。
- `docs/components/blocks/BlockPreview.tsx` 的 Artifact 预览加载器。
- `docs/components/blocks/StandaloneBlockDemo.tsx` 的导入和分支，以及 `standalone-blocks.ts` 的 slug。
- 中英文 `common.json` 的 Artifact 描述。
- `docs/agent-data/components.json`、`item-identities.json`、`guide-routes.json` 中仅 Artifact 的发现信息。
- `scripts/preview-source-allowlist.mjs` 的 Artifact 源码列表。
- `scripts/test-consumer-installs.mjs` 的 Next 与 Vite Artifact 示例。
- `tests/docs-artifact-catalog.test.ts`、`tests/i18n-document-manifest.test.ts` 中本条目带来的断言增量；最终数量以已接受的前序提交为准。

### 4. 在候选提交状态重新生成

在“已提交前置依赖 + 本笔 Artifact 源码”的候选 checkout 中运行生成器，确保生成内容只反映该候选状态：

1. 文档 loaders、routes、预览 sources、guide loaders。
2. Registry composition / build，得到 `public/r/artifact-01.json` 和对应索引。
3. Agent catalog / llms 等派生产物；最后检查生成一致性与安装闭包。

涉及的派生文件包括 docs/generated、docs/i18n/content-loaders.generated.ts、docs/lib/block-preview-sources.generated.ts、public/docs-source 的内容 hash 文件、public/r 和 llms。当前混合工作区中的这些文件包含其他功能，不能直接整份暂存，也不能手工拼接索引或 hash。

## 候选提交的验收顺序

1. 确认前置模块、公开导出与消费者别名真实存在；检查 staged diff 没有无关 Block、共享 UI 或 lockfile 修改。
2. 运行 Artifact 的三个测试文件，以及 ChatWorkspace / prompt、目录与双语文档回归。
3. 通过 typecheck、受影响范围 ESLint 和完整 design lint。
4. 生成分发后，单独运行 Registry 安装闭包测试与干净消费者安装，避免与大规模构建并行争抢资源。
5. 验证中文独立演示：390px 与桌面下切换视图保持年付选择；刷新重置预览；切换修订释放旧 iframe；恢复新增修订；关闭预览保留草稿；窄屏切换和键盘访问可用。
6. 完成生产构建、生成一致性检查，再次核对 staged diff 后执行主 commit。

本任务未增加依赖，不拥有根 package.json、pnpm-lock.yaml、middleware.ts、tsconfig.json 或 UI 组件的其他修改。`output/artifact-01*` 是忽略的本地证据，保留但不提交。不要使用 `git add .`。

## 验证记录

最终结果记录在 `output/artifact-01-fixes/verification.json`；使用统计在同目录 after.json / after.md。浏览器截图 mobile.jpg / desktop.jpg 保留本轮验证结果。两个原始问题的回归在修改前均失败，修改后须与全部相关检查一起通过。

当前验证只覆盖本地预设生成和宿主状态适配。真实模型、服务端持久化、真实屏幕阅读器与完整浏览器矩阵仍未接入或未覆盖。混合工作区检查通过不能代替隔离候选提交的验收。

### 本轮最终结果

| 维度 | 结果 |
| --- | --- |
| 回归 | 8 个测试文件、82 项通过；新增 7 项回归，两个原始缺陷在修正前均失败。 |
| 类型和样式 | typecheck、完整 design lint 通过；没有新增公开 API 或样式变量。 |
| 分发 | Registry 189 项闭包检查、Agent 198 条目 / 100 指南一致性通过；57 指南 / 61 TSX 示例通过。 |
| 消费者 | 使用打包 CLI 和 HTTP Registry，在干净 Vite / pnpm 项目安装并完成类型与生产构建。本轮未重跑 Next / npm 消费者。 |
| 生产构建 | 完整文档站生产构建通过。 |
| 浏览器 | 390px 与 1440px：年付状态跨视图保留、刷新重置、受控恢复到新版本、关闭后草稿与焦点保留，无横向溢出及页面错误。非受控恢复与异步导航由组件回归测试覆盖。 |

一次 Registry 单测在与生成和生产构建并行时超过既有 5 秒限制；串行重跑及最终完整批次均通过，没有提高超时或削弱断言。

固定 5 文件统计范围为 37 种来源/导出组合、76 次 JSX 使用，静态报告 0 错误、0 警告；相对优化前的增加来自测试 Host 等测试组合。自动识别仍有一项既有 DropdownTrigger 别名限制，已核实为公开 Dropdown 导出；完整说明保留在 verification.json，不能将该识别限制写成自动检查通过。

## GitHub main 提交执行

用户授权按本计划提交到 main 后，以最新远端 `d73faa6e` 为隔离候选基线。该基线已包含 Markdown、ChatMessage、ChatThread、ModelSelector、ChatWorkspace、closable Tabs 和 contextual InputMessage，不重复提交这些前置实现。

main 的 ChatDemoParts 已使用现有 context-window-01 提供上下文入口，ArtifactDemo 可直接复用其公开接口，因此本次不需要引入 context-window-02，也不带入 ChatWorkspace 后续会话菜单等独立改动。根 package.json、锁文件、middleware、tsconfig 和共享 UI 均保持基线内容。

候选仅新增 Artifact 代码、演示、双语说明、回归、发现和分发条目；全部生成产物在隔离目录重新生成。保留原有文档顺序，只插入 Artifact。Vite 安装样例通过 createRoot 实际挂载 ArtifactWorkspace 与独立面板，避免只导出未使用组件导致构建无法覆盖真实入口。

隔离候选验收：8 个测试文件、66 项通过（沿用 main 的前置测试版本，未带入工作区后续测试）；typecheck、完整 design lint、受影响文件 ESLint、生产构建通过。Registry 183 项、Agent 192 条目 / 94 指南、52 指南 / 56 TSX 示例及全部文档生成一致性检查通过。打包 CLI 经 HTTP Registry 安装到干净 Next/npm 和 Vite/pnpm 项目，类型与生产构建均通过；保留第三方模块指令等构建警告，不声称无警告。

候选生产页面在 1440px 与 390px 下验证版本切换、恢复新增第三版、预览状态保留、主动刷新、卡片打开准确修订、方向键切换页签，以及关闭预览后草稿与输入焦点保留；页面无横向溢出，控制台无错误或警告。原混合工作区保持原状，验收证据保存在其忽略目录 output/artifact-01-submit/。
