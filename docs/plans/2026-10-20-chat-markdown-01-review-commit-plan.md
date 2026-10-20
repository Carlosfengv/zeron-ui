# Chat Markdown 01 review 与 commit 计划

日期：2026-10-20。审查基准 HEAD：`b1436268`。范围：共享 Markdown、`chat-markdown-01` 的三个核心文件、文档演示、共享回到最新内容按钮，以及对应的测试、文档与分发记录。

Review 阶段已完成工作区优化，下面记录当时按最终功能组织的提交方案。2026-10-20 用户授权执行后，已在最新 GitHub main 的独立候选目录中拆分提交；执行记录见文末。

## Review 结果与已完成优化

| 优先级 | 发现 | 修正与证据 |
| --- | --- | --- |
| P2 | 演示仅在文本长度或生成状态变化时跟随；完成后的高亮、图片或窗口变化会改变高度，可能停在旧位置且没有回到底部入口 | 用 ResizeObserver 观测正文和阅读区，跟随状态决定是否滚到底部，并同步入口可见性。浏览器复现：底部追加 400px 后原实现距底部 400px、入口隐藏；修正后距底部 0。暂停阅读时追加高度，scrollTop 仍为 120px，入口可见。 |
| P2 | `actions={null}` 被空值回退变成默认复制；空白回复也出现复制操作 | 仅 `undefined` 使用默认操作，null 明确隐藏；生成期间和纯空白正文隐藏操作。保留停止后复制已有原文的行为，覆盖默认、自定义、隐藏和空白测试。 |
| P2 | 围栏语言正则截断 `c++`、`c#`；带展示文件名时，扩展名可能覆盖声明的高亮语言 | 保留完整围栏语言并显式传给 CodeBlock.file.lang；txt/text/plain/plaintext 归一为 text。用 python/c++/c# 配合 example.txt 验证语言优先级。没有声明语言时仍允许按文件名推断。 |
| P3 | 演示完成状态通过额外 effect 更新；跳转后浮动按钮消失，键盘焦点没有明确去处 | 由播放状态和文本长度计算 streaming，停止与完成都清理计时器；卸载断开布局观测。点击最新内容后将焦点交回阅读区；演示操作按钮明确 type=button。 |

保留已完成的样式要求：表格使用 Table bordered / md，由 `text-body` / `--font-size-body` 提供 14px；Markdown 只拥有正文排版和外部间距。回到最新内容复用 ChatScrollToLatest（tertiary / sm、向下箭头、底部居中 16px），阈值统一为 24px。没有新增样式变量或 lint 例外。

核心 Block 仍只负责单条回复组合，宿主拥有滚动、生成、取消、请求和持久化。演示的滚动与本地计时器不进入 Block 核心。不启用原始 HTML，继续使用 react-markdown 默认 URL 过滤；自定义 components 的安全由调用方负责。

## 提交前的依赖门槛

当前工作区含多个尚未提交的功能，不能将整棵工作区当作已有基线。

| 前置能力 | 当前关系 | 提交要求 |
| --- | --- | --- |
| Table 的 variant、size、containerClassName | Markdown 直接使用，HEAD 尚无这组扩展 | 由 Table 所属功能先独立审查、提交；包括对应类型、样式、测试和分发产物。不能整份带入其他 DataTable 改动。 |
| ChatMessage 的 header、actionsVisibility、ChatMessageCopy、ChatMessageAuthor | Block 和演示直接使用，属于尚未提交的消息部件扩展 | 第 3 笔前先接受并提交对应基础能力。第 2 笔共享按钮可在原有 ChatMessage 入口单独添加导出。 |
| CodeBlock 的 file.lang / messages | Markdown 使用的既有公开契约，HEAD 已提供 | 不需要借本任务提交正在进行的 CodeBlock 视觉、Diff 或文件工具栏重构。 |
| ChatThread / ChatWorkspace / Agent Trace / Subagents | 部分调用方采用共享 Markdown 或最新内容按钮 | 调用方迁移跟随各自功能提交，依赖下列第 1、2 笔；本 Block 不反向依赖这些会话实现。 |

Markdown 基础测试、Block 测试和共享按钮测试已拆开，避免基础提交的测试提前导入尚未提交的 Block 或 ChatThread。基础指南中的 related 条目和段落也要按候选提交实际存在的功能分配，避免先引用后续才注册的 chat-markdown-01 / chat-thread-01。

## 建议按顺序拆为三笔 commit

| 顺序 | Commit 标题 | 内容 |
| --- | --- | --- |
| 1 | `feat(ui): add shared Markdown rendering` | 共享安全 GFM、组件文档、依赖注册和基础测试，包含语言修正与 14px 表格规范。 |
| 2 | `feat(ui): share latest-content chat navigation` | 共享回到最新内容按钮、统一阈值、导出与独立契约测试。 |
| 3 | `feat(blocks): add chat Markdown response block` | 单条回复 Block、交互演示、双语规范、发现与安装记录，包含本轮状态和滚动优化。 |

每笔包含对应生成产物，保证安装闭包和发现入口随功能一起可用。提交数量指本功能的三笔，前置的 Table / ChatMessage 扩展由所属功能另行提交。

### Commit 1：共享 Markdown

- `packages/ui/src/components/markdown.tsx`：安全 GFM、标题/列表/任务/表格/图片/脚注、两种代码模式与生成状态；包含完整语言标记和 file.lang 优先级修正。保留当前并行工作已补充的满宽包装和 plain 代码回退。
- `packages/ui/package.json` 中仅 `./markdown` 导出与 react-markdown / remark-gfm / remark-breaks 依赖；pnpm-lock 仅收录该候选所需依赖解析。
- `packages/ui/registry.json` 的 markdown 条目与依赖；对应 `public/r/markdown.json`、Registry 索引。
- `tests/markdown.test.tsx`。
- `docs/pages/components/markdown/page.tsx`、中英文 `components/markdown.json`、`docs/agent-guides/components/markdown.md`；暂缓引用尚未提交的 Block / Thread。
- manifest、artifact catalog、组件卡片文案、双语 common、item-identities / guide-routes、封面生成脚本中仅 markdown 的记录；Markdown 两张 cover。
- 在候选状态下生成 Markdown 页面路由、文档 loaders / 国际化加载器、guide loaders、Agent catalog / llms 等相关产物；全局文档测试只加入该组件的断言。

验收：Markdown 基础测试；有序起始编号、嵌套与任务名称；多实例脚注隔离；安全 URL 与 HTML；表格列对齐、14px 与局部横向滚动；代码语言与展示文件名分离；中英文文档可访问。Typecheck、design lint、Registry 与生成一致性检查通过。

### Commit 2：共享最新内容入口

- `packages/ui/src/components/chat-message/scroll-to-latest.tsx`。
- `packages/ui/src/components/chat-message.tsx` 中仅该组件、类型与阈值的公开导出；不要整份带入消息部件和附件重构。
- `packages/ui/registry.json` 的 chat-message 文件列表新增该文件；更新对应 Registry 产物。
- `tests/chat-scroll-control.test.tsx`：中英文和自定义文案、disabled、type=button 不提交宿主表单。
- ChatMessage 双语 API / 页面和指南中仅最新内容按钮的使用说明；按候选状态生成相应 Agent / llms 产物。

验收：按钮复用现有 Button 的 tertiary / sm 契约，图标与文本同排，浮层不拦截空白区域点击，支持宿主定位与文案；调用方拥有显示时机、滚动和焦点。无新增运行时依赖。

`tests/chat-scroll-to-latest.test.tsx` 含 ChatThread / Agent Trace 集成，随这些调用方的功能提交。本轮同时跑过这些测试，但不把未提交的整套会话实现纳入本笔。既有 Agent Session / ChatWorkspace / Subagents 通过其会话组合继承入口，相关 locale 透传也跟随所属调用方提交。

### Commit 3：Markdown 回复 Block 与演示

- `packages/blocks/src/application/chat-markdown-01/` 的 index、chat-markdown-response、chat-markdown-demo-data 三个文件。
- `packages/blocks/package.json`、registry、block-capabilities、src/catalog 中仅 chat-markdown-01 条目。
- `docs/components/blocks/ChatMarkdownDemo.tsx`，包含 ResizeObserver、停止/重播/全文、暂停跟随和返回焦点。
- `docs/pages/blocks/chat-markdown-01/` 两个文件、中英文 `blocks/chat-markdown-01.json`、Block 指南；补入 Markdown 指南与本 Block 的关联说明。
- BlockPreview、StandaloneBlockDemo、standalone-blocks、manifest、artifact catalog 中仅本 Block 的导入、分支与条目；相关 Agent identities / guide-route / components 记录。
- `scripts/preview-source-allowlist.mjs` 的三文件条目；对应路由、loaders、预览源 bundle/hash、Registry 与 Agent/llms 产物。按候选状态生成，不复制整个混合工作区索引。
- `tests/chat-markdown.test.tsx`、`tests/chat-markdown-demo.test.tsx`、`tests/chat-markdown-registry-install.test.ts`；全局目录/文档测试中仅本 Block 的断言；本计划。

验收：null/默认/自定义操作、空白和生成状态、复制成功/失败；停止保留原文、重播与完成、计时器和 observer 清理；跟随时处理完成后的高度变化，暂停时保持阅读位置；最新入口恢复焦点；多实例脚注不串回复。确认 Registry 包含三个核心文件、公开入口和完整递归依赖闭包。

提交前补做干净消费者安装与生产构建；它是安装验证的最终门槛，本轮 Registry 测试不能替代消费者构建。消费者样例使用安装后的路径导入 ChatMarkdownResponse，组合静态 GFM 和 streaming 状态，检查 Markdown / ChatMessage / CodeBlock / Table 依赖可解析。

## 混合工作区的执行规则

1. 不执行 `git add .`。共享源码、package.json、lockfile、清单、脚本和全局测试按所属 hunk 选择。
2. 每笔在“HEAD + 已接受前置提交 + 本笔源码”的独立候选 checkout 中生成、检查，再提交。当前工作区通过不代表三笔隔离候选已通过。
3. 依次生成路由 / loaders / 预览源、Registry、guide loaders 与 Agent catalog，并检查一致性。具体生成项按本笔触及的入口选择；Agent 在 Registry 之后生成。
4. 不整份搬入当前 public/r/registry.json、Agent 数据、llms、generated loaders 或 docs-source；不手工拼接 hash 和索引。
5. 不带入 ChatThread、ChatWorkspace、Subagents、图表、其他表格 Block、CodeBlock 视觉重构、组件画布、middleware 或 tsconfig 的无关改动。共享依赖的必要部分通过前置提交提供。
6. 暂存前再次确认 HEAD、并行修改和 staged diff，重跑本笔测试及类型、样式、分发检查。
7. `.zeron/reports/chat-markdown-review/` 为本地验证证据，不作为产品源码提交。

建议的分笔功能测试：第 1 笔运行 markdown；第 2 笔运行 chat-scroll-control；第 3 笔运行 chat-markdown、chat-markdown-demo、chat-markdown-registry-install。Registry 测试在生成结束后运行，避免与生成过程争用同一产物。

## 本轮验证与限制

| 维度 | 结果与范围 |
| --- | --- |
| 功能回归 | 12 个测试文件、100 项通过。包含 Markdown、Block、演示、共享按钮、ChatThread、ChatWorkspace、Agent Trace、ChatMessage 部件、Table 与双语文案。分发测试单独运行通过，其余 11 文件 99 项通过。 |
| 类型与样式 | 根项目 typecheck、完整 lint:design、受影响演示与测试 ESLint 通过；没有新增变量或规则豁免。 |
| 分发闭包 | 本 Block 的递归 Registry 闭包测试通过；全量 Registry 187 项通过。该数量仅描述当前混合工作区。 |
| 浏览器 | 1280×900 与 390×844，覆盖中英文、深浅色四组。停止/重播/全文、实际 ResizeObserver 高度变化、暂停阅读、最新入口与焦点、脚注双向跳转及唯一 ID 通过。所有表头/正文计算字号均为 14px，文档无横向溢出。 |
| 生成记录 | 69 份预览源、guide loaders 98 份、Agent 196 条目 / 98 指南检查通过。预览源受并行修改影响后已重新生成并检查。数量不作为隔离候选中的固定断言。 |

一次并行构建期间，Registry 测试触发既有 5 秒超时；未增加超时或弱化断言，在生成结束后单独运行通过。全量 Registry 曾捕获并行 InfoItem 修改缺少 Base UI 声明；所属修改补齐后全量检查通过，本任务没有修改 InfoItem。

本轮没有执行完整文档站生产构建或独立消费者生产构建，没有接入真实模型或持久化。布局变化验证使用真实浏览器观测配合本地高度变化，未穷举远程图片、所有浏览器或真实屏幕阅读器。

## 组件与样式统计

固定的三个审查文件识别 20 种组件、22 次 JSX 使用，其中 UI 14 种 / 16 次、Block 1 / 1、内部辅助 2 / 2、业务组合 1 / 1、第三方 2 / 2。相同范围优化前后静态报告均为 0 错误、0 警告，未新增变量。

| 组件组 | 责任 |
| --- | --- |
| Markdown、Table、Checkbox、CodeBlock | 语义正文、14px 表格、只读任务和代码工具栏 |
| ChatMessage、ChatMessageAuthor、ChatMessageCopy | 回复布局、身份和复制反馈 |
| Button、ChatScrollToLatest | 演示操作和共享阅读导航 |
| ChatMarkdownResponse | 组合上述公开契约，不创建宿主滚动或网络请求 |

报告配置未启用全部覆盖/颜色/任意样式/内联样式检查，docs/components 也未启用完整设计规则；核心由完整 design lint 覆盖，演示另做基础 ESLint、契约和浏览器检查。Inventory 不单独证明全部组件契约正确。

本地证据位于 `.zeron/reports/chat-markdown-review/`：before/after JSON 与 Markdown、browser.json、四组场景截图、干净页面截图和 verification.json。基线是本轮优化前的工作区快照，不是 HEAD。

## 授权后的执行记录

执行基线为 GitHub main `82cb94dd`，包含其他会话已经发布的更新。原混合工作区未用于暂存，源码和生成结果在独立 checkout 中组装。

两项前置能力仍未发布，因此在原三笔方案外增加两笔必要依赖提交：

| 顺序 | Commit | 内容 |
| --- | --- | --- |
| 1 | `26050583` | Table bordered / size / containerClassName、文档与原生状态回归。 |
| 2 | `feb158b3` | 共享 Markdown、GFM 依赖、独立文档、注册、语言与安全测试。 |
| 3 | `913500a3` | ChatScrollToLatest、24px 阈值、导出、文档和独立测试。 |
| 4 | `6b7937f6` | 必需的 ChatMessage header、actionsVisibility、满宽正文、Author、Copy / Action；保留原附件实现，不引入 Editor / BranchSwitch / Meta。 |
| 5 | `feat(blocks): add chat Markdown response block` | 当前 Block、演示、双语规范、发现入口、分发及消费者样例。 |

其他会话对 Agent Trace、ChatThread、ChatWorkspace、Subagents 等调用方的迁移留在原工作区，未作为本次提交内容带入。候选目录的脚注、操作和滚动测试继续使用真实公开组件组合。

执行阶段最终验证：

- 精简候选目录的 10 个相关测试文件、43 项通过；根 typecheck、完整 design lint、受影响文件 ESLint 通过。
- Registry 178 项闭包、63 份预览源、187 条 Agent 记录 / 89 份指南及生成一致性通过。
- 打包 CLI 经 HTTP Registry 安装到独立 pnpm 消费者，Next.js 和 Vite 的类型检查与生产构建均通过，smoke matrix 成功。Vite 保留第三方模块 use-client 指令提示，未声称构建无警告。
- 候选端口 3922 的中文桌面浅色、英文 390px 深色检查通过：停止/重播/全文、完成后的高度变化、暂停阅读、回到最新内容及焦点、脚注、14px 表格和页面无横向溢出；文档详情路由正常打开。
- 本轮未重跑完整文档站生产构建。原混合工作区保持原状，其他修改未暂存或提交。

执行证据写入原工作区 `.zeron/reports/chat-markdown-review/commit-verification.json`；review 阶段的 100 项测试与浏览器记录另行保留。
