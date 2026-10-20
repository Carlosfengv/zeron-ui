# Tool Calls 01 review 与 commit 计划

日期：2026-10-20。核对基准 HEAD：`b143626812215d7a8a4ffbe1448083425abed6ce`。

范围为 `tool-calls-01` 的工具调用列表、ChatThread 组合、演示、双语文档、注册和安装验证。以下计划与原始验证记录描述整理计划时的工作区；实际提交执行见文末记录。

建议先落地共享前置依赖，再将 Tool Calls 合成一笔完整功能提交。新增功能尚未提交，三类 review 修复直接包含在最终实现中，不另拆一笔 fix commit。

## 提交前置

| 前置能力 | 当前情况与归属 |
| --- | --- |
| ChatThread 核心 | `packages/blocks/src/application/chat-thread-01/` 在当前 HEAD 中尚不存在。必须先完成其独立提交、公开导出与 Registry 依赖闭包。按同目录的 Chat Thread commit 计划落实共享基础与核心部分。 |
| Markdown、ChatMessage、MessageNavigation | Thread 所需的共享渲染、消息部件和导航仍有未提交文件；由各自前置功能提交，不能只带入 Tool Calls 后留下缺失导入。 |
| InputMessage 与 ScrollArea 接口 | 演示使用 InputMessage.textareaRef，Thread 使用真实 viewport 接口；所需共享接口先随 Thread 前置提交。InputMessage.header 等其他功能片段不属于本次。 |
| CodeBlock / CodeDiff | 复用现有公开 API。当前工作区另有共享表面、工具栏和 CodeDiffHeader 改动；这些改动由共享 UI 提交拥有，不夹带进 Tool Calls。需要保留当前预览外观时，先接受对应共享样式提交。 |

本功能不依赖 ChatThreadDemo、ChatDemoParts、ModelSelector、ContextWindowCompact、ChatWorkspace 或 Subagents。Thread 的完整演示提交不是本功能的前置；不为提交 Tool Calls 捆绑这些业务 Block。

## 建议的功能提交

标题：`feat(blocks): add tool calls block with chat thread integration`

提交描述：在现有会话中组合搜索与读取汇总、文件修改、命令确认和执行输出。复用 Zeron 的折叠、状态、按钮、代码和提示组件，支持受控展开、异步确认、拒绝、重试，以及双语演示和完整安装闭包。

### 一 核心实现与 review 修复

完整纳入 `packages/blocks/src/application/tool-calls-01/` 的六个文件：

- `index.ts`：公开组件、类型、文案与演示数据导出。
- `tool-calls-types.ts`：调用类型、生命周期、动作回调、列表与线程接口。
- `tool-calls-labels.ts`：中英文工具文案与状态。
- `tool-calls.tsx`：列表、详情、确认与重试。
- `tool-calls-thread.tsx`：复用 ChatThread 的单轮组合，支持有序文本与工具段。
- `tool-calls-demo-data.ts`：明确标注为本地模拟的排查数据。

以下修复一并纳入：

| 优先级 | 已修复问题 | 验证 |
| --- | --- | --- |
| P2 | 不可变快照更新导致异步失败提示丢失；旧动作锁住重试，或在结束时解除新请求的锁定 | 以 id/status 和请求代次判断有效性。两项新增回归在修复前失败、修复后通过。 |
| P3 | 汇总子元素强制 muted 颜色，覆盖 Accordion 自己的展开与悬停高亮 | 移除子元素颜色覆盖；深浅色计算样式与父组件一致，Enter 展开后保留焦点。 |
| P2 | 长本地化状态文案在窄屏被裁切 | 仅调整业务排列和 Badge 公开 children 的换行；320px 下调用行宽度与 scrollWidth 均为 288px。 |

不新增基础 UI 组件、主题变量、运行时依赖或 lint 豁免。真实命令、授权、文件写入与持久化仍由宿主回调负责，演示不表示真实执行。

### 二 演示与双语文档

- `docs/components/blocks/ToolCallsDemo.tsx`。
- `docs/pages/blocks/tool-calls-01/page.tsx` 与 `ToolCallsBlockDocClient.tsx`。
- `docs/content/en/blocks/tool-calls-01.json` 与 `docs/content/zh-CN/blocks/tool-calls-01.json`。
- `docs/agent-guides/blocks/tool-calls-01.md`。
- `app/[locale]/docs/blocks/(detail)/tool-calls-01/page.tsx`，由生成器产生。
- 本计划文件。

演示验收包括重播、确认、拒绝、失败重试、停止后保留实际已出现的记录，以及新问题启动固定演示。文档准确说明默认展开、受控状态、单轮组合和宿主集成边界。

### 三 共享文件中仅选择本功能片段

| 文件组 | 本次拥有的片段 |
| --- | --- |
| `packages/blocks/package.json`、`registry.json`、`block-capabilities.json`、`src/catalog.ts` | 仅 `tool-calls-01` 的导出、六文件清单、依赖和能力记录。 |
| `docs/manifest.ts`、`docs/catalog/artifacts.ts` | 仅本 Block 的文档、搜索和发现条目。 |
| `docs/components/blocks/BlockPreview.tsx`、`StandaloneBlockDemo.tsx`、`standalone-blocks.ts` | 仅 ToolCallsDemo 的加载器、导入、分支和 slug。 |
| `docs/content/en/common.json`、`docs/content/zh-CN/common.json` | 仅本 Block 的目录描述。 |
| `docs/agent-data/components.json`、`item-identities.json`、`guide-routes.json` | 仅本 Block 的能力说明、身份与指南路径；指南路径保留排序。 |
| `scripts/preview-source-allowlist.mjs` | 仅本 Block 的六个源文件。 |
| `scripts/test-consumer-installs.mjs` | 仅本 Block 的 Next 与 Vite 消费者示例；不捎带其他示例或安装流程修改。 |
| `tests/docs-artifact-catalog.test.ts`、`tests/i18n-document-manifest.test.ts` | 本条目的断言及候选目录需要的数量变化，不能复制当前混合工作区的全量列表或计数。 |

### 四 测试与生成产物

- `tests/tool-calls.test.tsx` 的 12 项用例，包含两项异步回归和演示交互。
- `tests/tool-calls-registry-install.test.ts`，验证公开入口、能力声明及递归 Registry 闭包。
- 候选状态生成的 `public/r/tool-calls-01.json`、`public/r/registry.json`。
- 候选状态生成的 document / block / guide loaders、双语 content loaders、预览源引用及对应 `public/docs-source/<hash>.txt`。
- 候选状态生成的 `public/llms.txt` 与 `public/llms-full.txt`。

测试文件直接导入 ToolCallsDemo，因此本次将源码、演示与测试一起提交。若日后要求拆成核心和文档两笔，需要先把演示用例移至独立测试文件，再重新验证各笔候选；本计划不进行这类拆分。

## 混合工作区的执行顺序

1. 提交前重新核对 HEAD 和暂存区。当前未暂存任何文件；计划本身不改变暂存状态。
2. 先接受共享前置提交，再在“HEAD + 已接受前置提交 + Tool Calls 自身改动”的隔离候选 checkout 中准备本笔。
3. 按上面的文件与片段清单选择改动。不要使用 `git add .`，不要整份暂存同时包含其他 Block 的注册表、测试、脚本或公共索引。
4. 在候选中依次运行 `docs:loaders:build`、`docs:routes:build`、`docs:sources:build`，再生成 Registry、guide loaders 和 Agent catalog。Agent catalog 在 Registry 之后生成。
5. 检查生成差异，只保留候选自身所需产物；不手工拼接内容 hash，不从当前混合工作区复制整份 generated 文件或 public 索引。未变化的生成文件无需提交。
6. 生成结束后再运行 Registry 测试及干净安装，避免消费者读取生成中的快照。
7. 检查 staged diff、缺失依赖、类型、样式和测试；补做隔离候选的完整文档站生产构建，通过后再创建本笔 commit。

不纳入本笔：其他 Block、组件画布、图表、共享 Table / CodeBlock / InputMessage 的无关修改、middleware、tsconfig、根 package.json 与 lockfile 的其他变更。所需共享依赖由前置提交提供。

`.zeron/reports/`、`output/`、`public/ai/`、`docs/generated/agent-runtime/` 和 `packages/registry/registry.composed.json` 是本地或生成器中间产物，当前均被忽略，不强制加入 Git。保留本地 review 证据供复核即可。

## 验收命令与现有证据

候选中的功能检查可使用：

```sh
pnpm exec vitest run --config vitest.config.mts --maxWorkers=2 tests/tool-calls.test.tsx tests/tool-calls-registry-install.test.ts tests/chat-thread.test.tsx tests/i18n-message-parity.test.ts tests/i18n-document-manifest.test.ts tests/docs-artifact-catalog.test.ts
pnpm typecheck
pnpm lint:design
pnpm registry:check
pnpm docs:routes:check
pnpm docs:loaders:check
pnpm docs:sources:check
pnpm agents:guides:check
pnpm agents:guides:examples:check
pnpm agents:check
pnpm build
```

干净 Vite / npm 安装与构建的已验证选择：

```sh
ZERON_CONSUMER_PACKAGE_MANAGERS='' \
ZERON_VITE_CONSUMER_COMPONENTS=tool-calls-01 \
ZERON_VITE_CONSUMER_PACKAGE_MANAGERS=npm \
node scripts/test-consumer-installs.mjs
```

该选择只验证 Vite / npm，不代表 Next 消费者矩阵已通过。浏览器补验本候选的 320px 与桌面、深浅色、键盘展开、确认到完成、拒绝、重试及停止流程。

| 维度 | 当前混合工作区已完成 |
| --- | --- |
| 行为 | 6 个相关测试文件、53 项通过；其中 Tool Calls 测试文件 12 项、安装闭包测试 1 项。 |
| 类型与样式 | 根 typecheck、完整 lint:design、受影响文件 ESLint 通过。固定 8 文件的使用报告识别 29 种组件、64 次 JSX 使用，0 错误、0 警告。演示与测试的部分设计规则未启用，另做了公开 API 与样式变量人工检查。 |
| 分发 | Registry 全量 188 项、预览源 70 份、指南示例与 Agent catalog 检查通过；这些数量属于混合工作区，不作为隔离候选的固定计数。 |
| 干净消费者 | 打包 CLI、HTTP Registry 安装、独立 Vite / npm 类型与生产构建通过；保留第三方模块指令等构建警告，不声称构建无警告。 |
| 浏览器 | 320×740 与 1280×900：长标签无裁切，Accordion 颜色继承正确，深浅色、Enter 展开和焦点、确认到完成及 CodeBlock 输出通过，未发现应用运行错误。 |

本轮未执行完整文档站生产构建，也未验收按本计划剥离后的独立候选。当前结果不能代替提交前对该候选的验证。

review 证据位于 `.zeron/reports/tool-calls-01-review/`：`before.json`、`after.json`、`verification.json` 与截图。报告基线是本轮修复前的工作区快照，不是 HEAD。

## 提交执行记录

执行基线为 GitHub main 的 `c6dfa16652234f3c1306316dd6a7e5f69b9d0fa0`。实际执行前发现共享前置已合并到 main：`21c49391` 统一共享样式、`e45cbaf2` 共享 Markdown、`2d8ce411` 消息部件、`5b339c00` 导航、`2f4d57d1` ChatThread 核心，以及后续兼容修复。因此复用已合并的实现，不重复创建这些前置提交。

Tool Calls 从该基线的隔离 checkout 准备。范围检查确认仅新增一个 Registry 条目；已有条目、共享 UI、根配置和 lockfile 不变。没有纳入本地尚未进入 main 的 Cited Answer、ChatWorkspace、Subagents、其他设置或图表功能。原工作区的 396 个未提交路径、HEAD 和暂存状态保持原样。

最终隔离候选验收：53 项相关测试、根 typecheck、完整 lint:design、受影响文件 ESLint、181 项 Registry 检查、153 份文档 loader、65 份预览源及指南示例均通过。独立 Vite / npm 安装、类型与生产构建通过。完整文档站生产构建退出码为 0，完成 479 个静态页面生成。

生产服务另验收中英文工具调用页面、320px 窄屏、桌面深浅色、键盘展开、确认到完成和拒绝结果。构建输出保留 docs 首页的 introduction 翻译加载提示；该页面、对应文案与加载逻辑和前置 main 一致，本次不混入其修复。消费者构建也保留第三方模块指令警告。

全量检查补验发现演示代码字符串中的 `@/` 路径触发安装包导入检查，已改成与示例文件结构一致的相对路径并重新生成分发文件。Registry 一致性与 Tool Calls 的 32 项检查通过。本地 Agent 测试要求 Node 22，因此完整单测改用与 CI 一致的 Node 22 执行；不调整共享测试或 CI 门禁。

初次候选的完整 CI（含干净检出）已通过。等待期间 main 前进到 `7a08f86fc3ced7101bbf3e87d2a75ebaf49b39fa`，新增的共享能力和 Chat Workspace 已属于上游基线。合并该基线时保留其原有注册、文档与组件内容，仅补入 Tool Calls 条目，重新生成产物和更新目录计数，再重跑必需检查。最终提交范围以相对该最新 main 的差异为准。
