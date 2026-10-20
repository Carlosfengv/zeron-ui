# Chat Workspace 01 review 与 commit 计划

日期：2026-10-20。最终候选以 `c6dfa166`（Chat Thread 已合入的 main）为基线，在独立 checkout 中准备。仅提交 `chat-workspace-01`、必要的共享 UI 扩展及其文档、测试和分发文件。

## 前置依赖与边界

- Chat Thread、Markdown、Model Selector 和 ChatDemoParts 已由所属功能合入 main，本任务直接复用，不重复提交其源码。
- main 的 ChatDemoParts 使用 `context-window-01`，本任务不需要引入 `context-window-02`。
- 主工作区的其他 block、图表、CodeBlock、ChatMessage、配置与 lockfile 修改全部保留，不加入候选提交。
- 共享清单只插入 Workspace 条目；Registry、文档源码、加载器和 llms 内容均从隔离候选重新生成。

## 三笔提交

| 顺序 | 标题 | 最终范围 |
| --- | --- | --- |
| 1 | `feat(ui): add closable tabs and contextual prompt headers` | Tabs 独立关闭按钮与截断、InputMessage header 和 gap-1、Button 标签收缩、InfoItem 原生 button/link 根元素；文档、依赖声明、分发和回归测试。保留 main 新增的 Button 与 InputMessage 能力。 |
| 2 | `feat(blocks): add resizable chat workspace and artifact panel` | 11 个核心文件、独立 ArtifactPanel、ArtifactCard、注册/发现、指南、安装示例和功能测试，以及依赖闭包校验的重复语法解析优化；同时提供目录要求的可用预览、详情页入口、混合资源演示及其静态资产和行为测试。 |
| 3 | `docs(blocks): add mixed artifact workspace demos` | 完整中英文使用/API/交互说明、独立 ArtifactPanel 演示章节、集成边界及本计划。 |

与最初划分相比，第二笔带上最小完整详情页和可运行演示。仓库要求所有已注册 block 同时具备详情页和封面加载器；这一调整使中间提交通过目录检查，同时避免临时占位预览。第三笔扩展文档说明。ChatThreadDemo 与 ChatDemoParts 不发生修改。

## Review 与优化结果

- 非受控资源选择在宿主移除活动项时同步到回退项，重新加入旧项不会抢回选择。
- 预览错误边界在切换视图、差异布局或加载状态时恢复；内容修订仍由 version 管理。
- 标签测量副本受裁剪容器约束，溢出通过 more 菜单展示全部资源，活动项保持可见。
- 每个 id/version 的预览独立持有访问状态；关闭或修订释放后台 iframe，再次打开继续延迟加载。
- 按打开 ID 顺序建立资源列表，重开追加到末尾；缓存资源列表和稳定的测量依赖。
- ArtifactCard 使用 InfoItem，文件显示宿主提供的字节大小或 UTF-8 文本大小，网页显示 URL。长内容省略并保留完整 title，不请求远程元数据。
- 批量审阅在异步操作期间锁定，部分失败保留待审阅项，回调包含具体版本。输入区统计包含已关闭标签的待审阅资源，箭头打开并聚焦第一项，保留草稿。
- ChatWorkspace 仅组合 ChatThread 与 Resizable；模型、回复、上下文、审阅落盘和文件持久化仍由宿主负责，演示使用本地模拟。
- 修正 Workspace catalog 依赖列表，使其与最终 Registry 一致，并加入回归断言。
- CI 暴露 Workspace 闭包校验超过默认 5 秒限制：校验器此前会按每个依赖项重复解析相同源码。现在单次校验按 target/content 复用语法解析结果，仍逐一执行每个闭包的依赖、目标和导入检查；缓存不跨调用。两项回归覆盖不同闭包的依赖声明、同路径不同内容和修订后的重新校验，未调整测试超时或减少断言。同机单次定位对照中，41 项依赖闭包从 1189ms 降至 404ms；该单次对照不作为稳定性能承诺。

## 验证

| 维度 | 本次候选结果 |
| --- | --- |
| 共享回归 | 4 个测试文件、27 项通过，包含 Chat Thread 回归。 |
| 核心与目录 | 5 个测试文件、43 项通过，包含 Registry 闭包、资源面板、文档目录和中英文一致性。 |
| 演示交互 | 6 项通过，覆盖待审阅提示、跳转/草稿、重开顺序、模型快照、指标、停止与重试。 |
| 类型 | 根项目及 @zeron/ui、@zeron/blocks 类型检查通过。 |
| 规范 | 完整常规 ESLint、完整 design lint、Workspace 范围 ESLint 通过。 |
| 生成与分发 | Registry 181 项、Agent 190 条目/92 指南、149 个文档路由和 65 份允许的预览源码检查通过。 |
| 消费者 | 干净 Next/npm、Next/pnpm 和 Vite/npm 的安装、类型与生产构建全部通过。 |
| 校验器回归 | 2 个文件、8 项通过；完整 Registry 181 项复验通过。 |
| 最终门禁 | 其余全量单元、生产构建和浏览器门禁以本 PR 最终提交的 GitHub CI 为准；不将待运行项目写作通过。 |
| 提交范围 | 逐项核对其他 block 源码、既有 Registry/Agent 条目与共用 Chat Thread 演示文件，均与 main 一致。 |

分发与安装证据以本次干净候选为准，不引用原混合主工作区的全局条目数量。浏览器历史验证包含 1315px 桌面和 390px 窄屏的标签关闭/重开、more 菜单、Markdown/URL、待审阅跳转、草稿保留、单栏切换，以及分栏键盘调整和恢复；该历史检查发生在主工作区，不能替代新候选的生产构建或 GitHub CI。

URL 预览仍受目标网站嵌入策略限制；演示不会连接真实模型、上传文件或修改磁盘。

## 组件与样式

本次固定 8 文件的候选报告识别 61 种组件来源/导出组合、111 次 JSX 使用，其中 UI 31 种/71 次。报告静态检查覆盖 8/8 文件，0 错误、0 警告；没有可比的 main 前快照，不声称新增问题归因已自动证明。

| 组件组 | 用途 |
| --- | --- |
| ChatThread、ChatUserMessage、ChatAssistantMessage、InputMessage | 复用会话、模型输出和带审阅提示的输入区 |
| Resizable、Tabs、Dropdown、MenuItem、Button | 拖拽分栏、内容切换、关闭与溢出操作 |
| InfoItem、FileType、CodeBlock、CodeDiff、Markdown | 文件/URL 元数据和资源预览 |
| Alert、InlineNotice、Empty | 批量审阅、错误与空状态 |
| 现有 ChatDemoParts | 模型选择、上下文与回复内容，保持与 Chat Thread 演示一致 |

两处 DropdownTrigger 别名未被 inventory 自动归类，已人工追踪至公开 dropdown 的 Menu.Trigger；动态图标来自 useIcon。报告配置未对 docs/components 启用全部设计规则，核心另通过完整 design lint，演示通过常规 ESLint、类型和行为测试。报告与原始日志保存在忽略的 `output/chat-workspace-01/`，不提交生成证据目录。
