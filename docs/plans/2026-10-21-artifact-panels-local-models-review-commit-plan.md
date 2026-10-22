# Artifact 面板与 Local Models review / commit 计划

日期：2026-10-21。范围：ArtifactPanel / ArtifactPreviewPanel 下沉与共享渲染、HTML 示例的 Input 使用，以及 local-models-01 上下文选择修改。本轮已修正代码并验证，未暂存、commit 或 push。

## 提交基线

- 当前工作区 HEAD：`38e30d3813ace0f9182e1f17f90a9683713abc68`。
- 已重新 fetch origin/main：`b888249d2ac12524c6b2ba320f96916404a7aef9`。
- origin/main 已包含 ChatWorkspace 第一期、第二期、会话菜单和 Artifact block；两个 Artifact AI components 以及 ChatThread、ArtifactCard、ModelSelector、ContextWindow 的 UI 下沉仍未在远端出现。
- 因此，以最新 origin/main 建立候选分支，只迁移相应增量。不能根据旧本地 HEAD 的 untracked 状态重新提交整个 block，也不能直接使用相对旧 HEAD 的全量补丁。比较 untracked 文件时须读取实际工作文件，避免将它们误判为相对远端删除。

本计划更新旧 Artifact / ChatWorkspace 计划中已经落地的首次功能提交步骤，保留原计划作为历史记录。

## Review 结果与修正

| 优先级 | 问题 / 检查项 | 结果 |
| --- | --- | --- |
| P2，已修正 | Local Models 的 Context window 标签只有 id，没有关联控件 | 改用 Field / FieldLabel，显式关联每个实例的 SelectTrigger；模型卸载和保存期间同步禁用。浏览器验证标签可打开选择器，Esc 返回触发器焦点。 |
| P2，已修正 | 宿主传入合法非预设上下文时，关闭的选择器显示裸数值，列表缺少当前选项 | 将当前合法值合并到预设选项、去重并排序；64K 显示 64K tokens，1000 显示 1,000 tokens。保留原有合法性检查和宿主受控行为。 |
| 保留已有修改 | local-models-01 多行选项的间距、缓存值和容量说明 | 保留多行布局、适当行高与截断；不扩展 Select API。窄屏实测选项高 60px，完整位于 390px 视口内。 |
| 已核验 | Artifact 两个适配器是否被共享渲染抹平职责 | 资源面板保留 path / previousPath、空旧内容 diff、工具栏和分栏选择；版本面板保留 filename、revision / previous、无工具栏和统一 diff。共享层只渲染 Markdown / code / diff。 |
| 已核验 | 面板下沉是否破坏旧 block 与安装路径 | 保留原 block 导出、类型和深层 helper 转发。共享 renderer 为 Registry support 项，安装到 components/ui；不新增公开组件导出或独立文档入口。 |
| 已核验 | HTML 示例是否真实使用 Input | 从 Field / FieldLabel / Input 渲染静态 HTML，并编译官方 tokens 与组件样式。md 输入高 32px、标签间距 6px；切换视图保留草稿，刷新重置，sandbox 保持 allow-scripts。 |

两个 Local Models 原始缺陷对应的三项回归在修正前均失败，修正后通过。Field、Select 核心文件和显存计算模块未修改；没有增加 npm 依赖、公开 props、主题变量或 lint 例外。

## 建议提交顺序

本次范围拆为两笔主 commit。第一笔可独立执行；第二笔需先确认下述已有任务的下沉提交已落实。

| 顺序 | 标题 | 内容 |
| --- | --- | --- |
| 1 | `fix(blocks): improve local model context selection` | 多行选项、原生标签关联、非预设上下文、依赖元数据、双语说明和回归。 |
| 前置 | 各自功能的 AI component 下沉提交 | ChatThread、ArtifactCard，以及演示组合使用的 ModelSelector / ContextWindow。只补尚未落地的下沉增量，不重复提交远端已有的 block、Markdown 或输入接口。 |
| 2 | `refactor(ai): extract shared artifact panels and rendering` | 两个面板、共享底层、旧 block 兼容适配、文档示例、Input 静态文档生成和分发闭环。 |

### Commit 1：Local Models

完整拥有：

- `packages/blocks/src/application/local-models-01/local-models.tsx`。
- `tests/local-models.test.tsx` 的三项新增交互回归；新增 `tests/local-models-registry-install.test.ts`。
- `docs/agent-guides/blocks/local-models-01.md`。
- `docs/content/en/blocks/local-models-01.json`、`docs/content/zh-CN/blocks/local-models-01.json`。
- 本 review / commit 计划。

共享文件只收 Local Models 片段：

- `packages/blocks/registry.json` 的 local-models-01.registryDependencies 增加 field。
- `packages/blocks/src/catalog.ts` 的对应依赖增加 field。

按候选提交状态重新生成 `public/r/local-models-01.json`、Local Models 预览源码及索引、Agent catalog / llms 对应派生内容。不要带入共享注册文件中的其他 block 或 AI component 修改；不需要根 package.json、lockfile 或 Field / Select 核心修改。

验收：23 项 Local Models 行为与分发测试、类型与样式、Registry 安装闭包、干净 Next / pnpm 和 Vite / pnpm 消费者；浏览器验证标签 / 键盘、8K 切换后的缓存估算、卸载禁用、桌面与窄屏布局。宿主非预设值由自动化组件测试覆盖。

### Commit 2 的前置条件

| 前置下沉 | 当前关系 | 本笔不拥有的内容 |
| --- | --- | --- |
| ChatThread | ChatWorkspace 核心和两个 block 演示使用 @zeron/ui/chat-thread；chat-thread-01 保留兼容导出与 demo data | 会话滚动、消息原语职责整理及其独立文档 / Registry 变更归各自任务。远端已有基础会话能力，不重做首次引入。 |
| ArtifactCard | chat-workspace-01 的卡片适配转发到 @zeron/ui/artifact-card | 该组件、类型、导出、独立文档和安装闭包先由其下沉提交提供。 |
| ModelSelector / ContextWindow | ChatDemoParts 和 block 演示已改用对应 UI 组件；demo data 仍由原 block 导出 | 下沉和 ChatDemoParts 的共享组合改动归各自前置任务；不成为两个 Artifact 面板的运行时依赖。 |

当前混合工作区可运行不代表以上前置已经提交。执行前逐一检查候选分支的文件、导出和 Registry 闭包。不要把所有未提交 AI 功能一并暂存来满足依赖，也不要夹带 Markdown.leading-6 等独立排版修改。

### Commit 2：面板、兼容适配与文档

新增 UI 实现与契约：

- `packages/ui/src/components/artifact-panel.tsx` 与 `artifact-panel/` 内 types、labels、utils、tabs、preview、code-preview。
- `packages/ui/src/components/artifact-preview-panel.tsx` 与 `artifact-preview-panel/` 内 types、labels、content。
- `packages/ui/src/components/artifact-content-renderer.tsx`，仅内部共享 Markdown / CodeBlock / CodeDiff 包装。
- `packages/ui/package.json` 中两个面板及保留 helper 的导出；`packages/ui/registry.json` 中两个面板和 renderer support 项。

相对最新 main 只迁移旧 block 的兼容适配增量：

- chat-workspace-01 的 artifact-panel、artifact-tabs、artifact-code-preview、artifact-preview、artifact-utils、artifact-labels 转发，以及 chat-workspace-types 的类型复用、chat-workspace 的导入适配。
- artifact-01 的 artifact-preview-panel、artifact-content、artifact-labels 转发，以及 artifact-types 的类型复用、artifact-workspace 的导入适配。
- ArtifactCard 转发由其前置下沉提交拥有。两个 block 的 index、demo data 和 ChatWorkspaceSessionMenu 与 origin/main 一致，不重复提交。
- `packages/blocks/registry.json`、`src/catalog.ts` 只收两个 block 的依赖调整。保留兼容文件的 Registry target，不删除旧安装路径。

文档与示例：

- `docs/pages/components/artifact-panel/`、`docs/pages/components/artifact-preview-panel/`，两个组件的 app 路由、中英文内容、Agent 指南与封面。
- preview-document.tsx 使用真实 Field / FieldLabel / Input；preview-document.generated.json 与 `scripts/generate-artifact-preview-example.mjs` 同步提交。
- 根 package.json **仅** docs:sources:build / docs:sources:check 两条脚本接入生成器。不要将生成脚本与依赖它的 HTML 示例拆开提交。
- `docs/components/blocks/ChatWorkspaceDemo.tsx`、`ArtifactDemo.tsx` 的 UI 导入适配；两个 block 的文档页、双语说明和指南仅收职责 / 兼容说明的增量。
- manifest、catalog、组件发现信息、item identities、guide routes、common 文案、预览 allowlist 等共享文件仅收两个面板及 renderer 的关联记录。renderer 使用 support 身份，不列入 AI components 文档导航。

测试与消费者：

- `tests/artifact-content-rendering.test.tsx`、`artifact-panels-components.test.tsx`、`artifact-panels-components-registry-install.test.ts`。
- Artifact / ChatWorkspace 既有行为、prompt、演示和安装测试仅收组件下沉相关增量，不重提远端已有测试。
- `scripts/test-consumer-installs.mjs` 只收两个面板与两个兼容 block 的消费者示例及 helper 导入验证；目录、文档和 i18n 测试只收相关断言。

两个面板文档在远端尚不存在，因此共享渲染说明、Markdown / 重命名示例和正确的 Input HTML 示例合并到最终下沉提交，不刻意制造需要下一笔立即修复的中间版本。

## 生成与验收规则

1. 在最新 main 的候选分支落实前置下沉后，按本笔文件 / hunk 白名单应用增量。保留主工作区，禁止 git add .、reset 或将旧生成文件整份覆盖到候选树。
2. 在每笔候选状态运行相应生成器：组件静态 HTML / 预览 sources、必要的 docs routes / i18n / guide loaders、Registry、Agent catalog / llms。共享索引和内容 hash 由候选源码生成，不手工拼接。
3. 检查 staged diff 只包含本笔内容，且没有回退 origin/main 已有的表单规范化等提交；运行相关测试、typecheck、受影响范围 ESLint、完整 design lint 和生成一致性检查。
4. Commit 2 必须验证两个面板可以独立安装、不依赖 block / 会话；两个旧 block 的闭包仍完整，合并安装只产生一个 renderer。Next 与 Vite 消费者分别验证两个 UI 面板和两个 block 的公开 / helper 导入。
5. 浏览器覆盖 HTML 输入保留 / 刷新、Markdown、代码与 diff、资源 / 修订切换及窄屏。执行提交时对最终候选再做文档站生产构建；本轮未对隔离候选执行完整站点构建。
6. 最后核对每笔依赖、生成产物和 staged diff，再执行 commit。本轮仅交付可 review 的工作区修正与计划。

## 验证记录

| 检查 | 本轮结果 |
| --- | --- |
| 组件、兼容与文档回归 | 16 文件、156 项通过；最终增加 Field.disabled 后，Local Models 两文件 23 项再次通过。 |
| 类型与样式 | typecheck、受影响范围 ESLint、完整 design lint、diff whitespace 检查通过。 |
| 生成与安装元数据 | Registry 204 项、预览 sources 72 项一致；Agent 213 条目 / 114 指南一致；70 指南 / 77 TSX 示例通过。 |
| Local Models 消费者 | 打包 CLI + HTTP Registry，在干净 Next / pnpm 和 Vite / pnpm 中安装、类型与生产构建通过；Vite 拒绝 Next 专属 block 的保护检查通过。 |
| Artifact 消费者 | 前一轮 8 个 Next / Vite × 两面板 / 两 block 消费者通过；本轮核验四个递归安装闭包的字节指纹全部未变，因此沿用对应证据，未重复跑 8 项。 |
| 浏览器 | 1440px、390px、Local Models 深浅主题、多行选项、标签 / 键盘 / 禁用、估算更新通过；Input 高 32px、Field 间距 6px、标签关联、视图保留、刷新重置和 sandbox 通过。最终交互检查无 pageerror。 |
| 工作区 | Git index 与本轮开始时相同；未暂存、commit、push 或切换主工作区。 |

详细证据保存在忽略的 `output/artifact-local-models-review/`，共享渲染与原 Input 修正的证据分别在 `output/artifact-rendering/`、`output/artifact-preview-input/`。消费者构建保留第三方 use-client 提示；临时 npm 保护测试环境有既有 audit 提示，本轮未新增依赖或自动升级依赖。

固定 3 文件使用统计：33 种组件来源 / 导出、58 次 JSX 使用，0 错误、0 警告；比基线增加的两次使用是 Field / FieldLabel。Local Models 的多行 SelectItem children / className 是业务元数据布局，保留公共 Select 行为，不添加另一套控件样式。静态报告未启用内联样式和动态类名专项检查，不能将它表述为这两类规则均已通过。

上述结果验证当前工作区的本地 UI 与演示状态；GPU、模型、真实保存和分享服务仍由宿主接入。当前混合工作区验证通过不代替每笔隔离候选的最终验收。
