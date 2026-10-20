# Chat Thread 01 review 与 commit 计划

## 执行更新（2026-10-20）

本计划按六笔提交执行于 `codex/chat-thread-main-batches` 隔离副本，起点为最新 `origin/main`。原工作区及本地未发布的其他提交保持原状。下文保留原始审查记录，执行范围以本段为准。

已完成的前五笔：`21c49391`（共享样式）、`e45cbaf2`（Markdown）、`2d8ce411`（ChatMessage）、`5b339c00`（MessageNavigation）、`2f4d57d1`（Thread 核心）。最后一笔补齐 Thread 文档、发现入口与演示。

六笔功能提交后，包级 CI 暴露了 UI 包中 CodeBlock / Code Engine 的内部入口映射缺失，另补一笔必要的兼容修复。该提交同时遵循配对排版 token，更新 Button 命名 hover 的契约断言；仍不修改其他 Block 源码。main 受保护，通过 PR #35 等待必需的 checks 后正常合并，不绕过保护规则。

- 本次仅引入 `chat-thread-01`；未引入 chat-markdown、chat-workspace、subagents、tool-calls、context-window-02、pull-request 等其他 Block。
- Agent Trace / Agent Session Detail 的 Markdown 与返回最新适配未提交；对应集成测试保留 Thread 的阈值断言，不引入其他 Block 的行为约束。
- 保留远端 Button 的 contentClassName / labelClassName；只加入 hover 隔离。InputMessage.header、工作区相关布局与其他组件改动不在本次范围。
- 演示复用主线已有 ModelSelector 与 ContextWindow（context-window-01），用同一数据快照驱动 PieChart 用量圆环；未将 context-window-02 加入依赖或提交。Compact 专属界面留在原工作区。
- 各笔 Registry、文档加载器与 Agent 产物从隔离候选重新生成，未搬入原混合工作区的整份生成结果。

本次隔离候选的最终验收结果见文末“提交执行验收”；下文 110 项测试和 187 项 Registry 等数量属于此前混合工作区的 review 快照。

日期：2026-10-20。审查基准 HEAD：`b143626812215d7a8a4ffbe1448083425abed6ce`。

范围：`chat-thread-01` 的 10 个核心文件，相关的 ChatMessage、Markdown、MessageNavigation、输入与滚动接口、文档演示及分发依赖；同时检查 chat-markdown-01 与 ChatWorkspace 对这些组件的使用。没有将当前工作区的全部 Block 纳入审查。

本轮优化已写入工作区，未暂存、commit 或 push。新增 Block 与组件仍未提交，因此以下按最终功能划分提交，本轮修复直接归入对应功能，不为未提交的代码另建 fix commit。

## Review 发现与优化

| 优先级 | 问题 | 已完成调整与验证 |
| --- | --- | --- |
| P2 | 会话在最新位置时，点击消息按钮、触碰正文，或在内部控件按方向键，即使没有滚动也会把跟随模式改为暂停；返回最新入口仍隐藏，后续回复停止跟随 | 按实际视口位置判断是否离开最新内容；原生滚动到历史时暂停，回到底部恢复，保留新轮次定位模式。指针、触屏、键盘及原生滚动共 4 项回归在修正前失败、修正后通过。 |
| P2 | 历史前插与检查点恢复可以交错，旧请求可能覆盖另一操作提交后的消息；已经显示的 Undo 也能在历史加载期间执行 | 恢复/撤销与历史加载互斥，增加同步锁保护；本地或外部历史加载状态均冻结消息变更操作。已有 Undo 读取最新加载状态，加载结束后仍可执行。3 项原始回归及 2 项 Undo 回归通过。 |
| P2 | 编辑器已经打开后，`busy` 或历史加载状态只禁用外层编辑按钮，仍能通过现有编辑器提交 | 在共享 ChatMessageEditor 增加 `disabled`，冻结输入与保存，保留草稿且允许取消；ChatEditor 适配器传入线程状态。2 项回归在修正前失败，修正后通过。双语组件 API 与指南同步。 |
| P3 | 输入草稿导致父级重新渲染时，导航反复创建收藏 Set、回复摘要和 Markdown 预览节点 | 按消息条目、受控收藏列表与文案缓存导航数据。未做性能基准，不声称具体耗时收益。 |

确认继续复用的边界：Table / CodeBlock 决定块内容的自身样式，Markdown 负责语义映射与父容器宽度，ChatMessage 负责作者、指标、附件、编辑、按钮和页脚，MessageNavigation 负责短线、预览与受控收藏。Thread 保留会话组合、历史状态协调与滚动定位，没有新增局部视觉覆盖、依赖包或状态管理抽象。

宿主仍负责消息与版本树、异步请求有效性、真正的文件恢复、撤销快照、附件上传与持久化。`busy` 应覆盖宿主自己执行的异步历史变更；组件不会取消已经进入宿主回调的请求。演示继续使用本地模拟。

## 先明确提交依赖

- 下表 1 → 2 → 3 → 4 → 5 → 6 是建议顺序；第 4 笔只依赖共享控件，可在第 2、3 笔之外独立准备。
- 完整 ChatThreadDemo / ChatDemoParts 引用尚未提交的 `model-selector-01` 和 `context-window-02`。两者应由各自功能先落地；第 6 笔在它们可用后提交。它们不是 Thread 核心的强制 Registry 依赖。
- `ChatDemoParts` 还被 ChatWorkspace / Subagents 演示使用。首次引入它由第 6 笔拥有；后续工作区提交只带入自己的接入片段，不能重复提交或提前引用不存在的文件。
- ChatWorkspace 是 Thread 的消费者，不是 Thread 的依赖；本轮不提交工作区、ArtifactPanel、Subagents、分组表格、图表等其他功能。
- chat-markdown-01 是共享组件的另一消费者，可以在第 3 笔后独立提交，见文末。

## 建议拆为六笔 commit

| 顺序 | 建议标题 | 拥有的内容 |
| --- | --- | --- |
| 1 | `fix(ui): unify chat content surfaces and control feedback` | Table / CodeBlock 的共用样式、Button hover 隔离、附件与分隔线基础能力及其文档。 |
| 2 | `feat(ui): add shared responsive markdown renderer` | Markdown、Agent Trace 薄适配、双语文档、依赖与安装闭包。 |
| 3 | `feat(ui): extract composable chat message primitives` | 消息原语、输入与滚动接口、共用返回最新入口、契约与回归。 |
| 4 | `feat(ui): add controlled message navigation` | 短线导航、预览、受控收藏、键盘与独立文档。 |
| 5 | `feat(blocks): add composable chat thread` | 完整可安装的 Thread 核心、历史与恢复、注册及功能/安装验证。 |
| 6 | `docs(blocks): add interactive chat thread demos` | 完整交互演示、共用演示组合、双语页面、发现入口与预览源。 |

### Commit 1：共享样式与基础能力

- `packages/ui/src/components/button.tsx` 的命名 `group/button` 与 hover / active 隔离片段。
- `table.tsx` 的 bordered / size / container 公共能力、表格满宽与末行底边；Table 文档、指南、双语文案及 `tests/table-presentation.test.tsx`。
- `code-block/` 的公共排版与头部样式、`code-block-styles.ts`、`code-diff-header.tsx`；code-engine 的 canonical `base.css` 与生成结果、CodeBlock 文档及相应测试。
- `file-thumbnail.tsx` 的 bordered 能力；`separator.tsx` 的 tone / hairline 能力及对应契约。
- 只更新这些项目的 Registry 定义、文件与 Agent / llms 产物。

Button 的内容收缩、contentSized 与 link 高度修改与其他功能交叠；InputMessage.header 属于工作区；不要借本笔整文件带入这些片段。需要由各自前置功能提供时，应明确记录其提交。CodeBlock 的 worker / 高亮逻辑若含无关修改也应按 hunk 拆开。

验收：单个图标按钮 hover 不影响邻居；CodeBlock 头部与正文无多余间距；Table 末行不重复底边；宽代码与表格只在各自区域滚动；既有 Table / CodeDiff 消费者通过。

### Commit 2：Markdown

- `packages/ui/src/components/markdown.tsx`、对应 package export、Registry 条目。
- `packages/ui/package.json` 中 react-markdown / remark-gfm / remark-breaks 的依赖归属及必要 lockfile 片段；不混入其他依赖调整。
- Agent Trace 的 `markdown-content.tsx` 改为薄适配，更新它的 Registry 依赖。其返回最新按钮改动留给第 3 笔。
- Markdown 的组件页面、路由、中英文内容、指南、封面、预览源允许列表与 `tests/markdown.test.tsx`。
- 相关 canonical 注册、文档发现与生成产物。

验收：安全 GFM、链接/图片协议、任务列表、编号与脚注、实例 ID 隔离、plain / CodeBlock 两种代码模式、流式显示；表格与代码跟随父容器宽度，长内容内部横向滚动。自定义 renderer 的布局仍由自定义实现负责。

### Commit 3：ChatMessage 与输入/滚动接口

- `packages/ui/src/components/chat-message.tsx` 及 `chat-message/` 下 6 个原语文件：actions、attachments、author、editor、meta、scroll-to-latest。本轮 Editor.disabled 包含在最终实现中。
- `InputMessage` 的 textareaRef、autoDispatchQueue、共用附件卡片片段；`ScrollArea` 的 viewportRef / viewportProps。对应文档、指南和双语内容。
- Agent Trace / Agent Session Detail 复用 ChatScrollToLatest 与统一阈值的片段及契约。
- `tests/chat-message-parts.test.tsx`、`tests/chat-scroll-control.test.tsx`。前者引用 Markdown，因此第 2 笔必须已经可用；依赖 Thread 的滚动集成测试留给第 5 笔。
- ChatMessage / InputMessage / ScrollArea 相关 Registry 文件及消费者示例片段。

InputMessage.header 与外层 gap-1 由工作区计划拥有，不放入本笔。Registry 的 InputMessage → ChatMessage 依赖必须与附件导入一起提交。

验收：旧 ChatMessage API 保持兼容；图片与文件同一边框和高度；作者与指标分开，token 单位和完整数值可读；复制失败、异步编辑、受控版本、键盘、IME 与编辑禁用；输入区 DOM 身份、外部编辑器 ref 和队列冻结；真实滚动视口适配触屏。

### Commit 4：MessageNavigation

- `packages/ui/src/components/message-navigation.tsx`、package export 与 Registry 条目。
- 独立文档、example、双语内容、指南、封面、路由和发现入口。
- `tests/message-navigation.test.tsx` 及对应生成产物。

验收：短线按所在侧贴齐；当前位置与收藏分别可辨；hover / focus 预览，预览右上角收藏操作不会触发消息跳转；收藏保持外部受控；Tab、方向键、Home / End、Enter / Space、Escape 可用；长导航只滚动自身。

### Commit 5：Thread 核心与可安装性

- `packages/blocks/src/application/chat-thread-01/` 的全部 10 个文件，包含本轮滚动修复、加载/恢复/撤销互斥、编辑禁用与导航缓存。
- packages/blocks 的 package export、registry、catalog、block-capabilities 中仅本条目；指南与 Agent identities / components / guide-routes 的相应记录。
- `tests/chat-thread.test.tsx`、`tests/chat-thread-history.test.ts`、`tests/chat-scroll-to-latest.test.tsx`。
- `scripts/test-consumer-installs.mjs` 中 chat-thread-01 示例，及本候选状态下的 Registry、Agent / llms 产物。

验收：新会话到首条消息的编辑器身份、流式跟随与阅读暂停、历史前插锚点、编辑与 IME、版本、恢复失败重试、焦点、Undo、受控收藏，以及干净消费者类型/构建。核心通过 composer 接受输入区，安装 Thread 不强制安装模型选择器和上下文窗口。

这一笔可以先发布可安装核心和 Agent 指南；完整文档站发现入口随第 6 笔一起引入，避免页面导入尚未提交的演示依赖。

### Commit 6：完整演示与文档站

- `docs/components/blocks/ChatThreadDemo.tsx`、`ChatDemoParts.tsx`。
- `docs/pages/blocks/chat-thread-01/`、对应 app 路由、中英文 blocks/chat-thread-01.json。
- BlockPreview 的 Floating 表面统一片段与单独验证；StandaloneBlockDemo / standalone-blocks、manifest、artifact catalog、预览源允许列表中仅该 Block 的接入。其他 Block 的独立背景或接入修改留在各自提交。
- 本候选的 document / guide loaders、国际化加载器、预览源码 bundle / hash、Agent / llms，以及本计划。

前置：已提交且可安装的 ModelSelector 与 ContextWindowCompact / Usage，以及它们所需共享能力；保留为演示组合依赖。

验收：重播、新对话、发送/停止/重试、队列、历史、版本、恢复/撤销、受控收藏；模型身份属于回复快照，TTFT / tokens / 耗时与正文共用组件；上下文和附件一致；桌面与 390px 页面无横向溢出。

## chat-markdown-01 的独立提交

可在第 3 笔之后另建 `feat(blocks): add standalone markdown chat responses`：拥有该目录 3 个核心文件、注册与指南、ChatMarkdownDemo、页面/路由/双语文案及 chat-markdown、demo、registry-install 三个测试。它不依赖 Thread 或模型选择器，避免为了提交 Thread 演示而捆绑独立回复 Block。当前用于集成验证的 ChatWorkspace 测试仍归工作区功能提交。

## 混合工作区执行规则

1. 不使用 `git add .`。package/Registry 清单、脚本、共享源码、文档计数按本笔拥有的 hunk 选择。
2. 在“HEAD + 已接受前序提交 + 本笔源码”的隔离候选 checkout 中生成和验收；不要整份搬入当前 public/r、Agent 数据、llms、generated loaders 或 public/docs-source。它们包含其他功能。
3. 每笔生成自己的 Registry 与必要文档/Agent 产物；Agent 在 Registry 和文档源更新后生成。不要手改 hash，也不要在生成器仍写入时冻结安装快照。
4. 只提交相应新增路由、封面与公共资源，不把整个 public/demos 或其他未跟踪目录带入。
5. 每笔检查 staged diff、依赖闭包、类型、设计契约与本笔测试；第 5 笔完成干净安装，第 6 笔验证完整浏览器流程。当前混合工作区通过不代表这六个隔离候选已分别通过。
6. `output/chat-thread-review/` 为忽略的本地验证证据，不提交。

## 本轮验证与限制

| 维度 | 结果 |
| --- | --- |
| 行为 | 12 个测试文件、110 项通过，覆盖 Thread、历史、两类滚动控制、ChatMessage、Markdown、导航、独立回复及演示、Registry、ChatWorkspace 消费者和国际化文案一致性。本轮 9 项回归在生产代码修正前失败；另加 2 项 Undo 状态回归。 |
| 类型/规范 | 根项目 typecheck、相关源码/文档/测试 ESLint、完整设计 lint 通过。 |
| 分发 | canonical Registry、预览源与 Agent 产物已重新生成；Registry 检查 187 项、预览源检查 69 份、Agent 检查 196 条目 / 98 指南均通过。这些数量描述当前混合工作区；提交前按候选状态再次生成和检查。 |
| 干净消费者 | 打包本地 CLI、通过 HTTP Registry 安装 chat-thread-01，独立 Vite / pnpm 项目类型检查与生产构建通过。首次消费者快照出现未转换的内部 alias；最终 Registry 重生成后的快照验证通过，未修改 CLI 或消费者别名来绕过。最终构建保留第三方模块指令等警告，不声称无警告。 |
| 浏览器 | 1280×800 与 390×844：上翻显示返回入口，原生 End 回到底部后隐藏；本地发送完成、作者与指标/表格呈现正常。桌面回复宽 704px；窄屏回复与表格均 326px，页面 scrollWidth 为 390px，侧轨隐藏。 |

没有重跑完整文档站生产构建、Next/npm 消费者矩阵、全部浏览器或真实屏幕阅读器。没有接入真实模型、文件写入、上传或持久化。本轮 clean-consumer 针对最终混合工作区快照，提交拆分后的每个候选仍需各自验收。

## 提交执行验收

隔离副本基于 GitHub main，最终验收如下；优先于上文原始 review 快照的数量与未覆盖说明。

- 12 个相关测试文件共 104 项通过。首次文档目录断言缺少新 Thread 条目，补齐精确断言后该文件的 9 项全部通过。
- 前五笔分别通过相关测试与类型检查；最终完整文档站生产构建通过，包括编译、lint、类型验证与静态页面生成。
- 完整设计 lint、相关源码与文档 ESLint 通过。固定 3 个核心文件仍为 37 种组件来源/导出、53 次 JSX 使用，0 未解析、0 错误、0 警告。
- 干净 Vite / pnpm 项目通过打包 CLI 和 HTTP Registry 安装 Thread，类型检查与生产构建通过；没有消费者别名或 CLI 绕过。未运行 Next/npm 干净消费者矩阵。
- Registry 179 项、预览源 63 份、Agent 188 条目 / 90 指南的一致性检查通过。
- 隔离服务器的文档页与独立演示可打开。1280px 桌面回复宽 704px；390px 窄屏回复与表格均 326px、页面宽 390px，导航隐藏；发送完成、模型指标、受控收藏、原生回底与已有上下文弹层均验证，浏览器未记录 error。
- 未接入真实模型、文件恢复、上传或持久化；未覆盖全浏览器和真实屏幕阅读器。

本地执行证据保存在原工作区 `output/chat-thread-publish/` 与 `/tmp/chat-thread-batch-*`、`/tmp/chat-thread-publish-*`。这些日志和截图不进入提交。最终范围检查要求 Block 源码仅新增 `chat-thread-01`，其余新增仅为必要 UI、Thread 文档与分发记录；普通快进推送，不改写 GitHub 历史，保留原混合工作区。

## 组件与样式统计

固定 3 个 Thread 核心文件的前后报告均识别 37 种组件来源/导出组合、53 次 JSX 使用，其中 UI 导出 26 种、40 次；0 个未解析组件、0 错误、0 警告，没有新增显式样式变量。基线为本轮优化前的工作区，不是 HEAD。共享 Editor 的新 disabled 契约另经类型、ESLint 与集成回归覆盖，不将这 3 个文件的统计宣称为全库覆盖。

| 组件组 | 用途 |
| --- | --- |
| ChatMessage、Author、Meta、Attachments、Editor、Action、BranchSwitch | 作者、指标、附件、编辑与消息操作 |
| Markdown、Table、CodeBlock、CodeDiff | 回复语义与块内容展示，样式归属共享组件 |
| ScrollArea、ChatScrollToLatest、MessageNavigation | 唯一主滚动区、返回最新与受控导航 |
| Button、Popover、Separator、InlineNotice、Empty、Toast | 检查点、状态反馈与基础交互 |
| InputMessage、ThinkingSteps、ModelSelector、ContextWindow | 宿主与演示组合，按公共插槽接入 |

详细记录：`output/chat-thread-review/before.json`、`after.json`、`verification.json`、`browser.json`、`desktop.png`、`mobile.png` 及各检查日志。检查范围内没有新增组件复用或样式契约违规；隔离候选与上述未覆盖矩阵仍是实际提交前的验证边界。
