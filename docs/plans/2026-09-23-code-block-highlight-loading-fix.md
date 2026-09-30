# CodeBlock 高亮加载与失败反馈修复方案

日期：2026-09-23。状态：核心修复已在 `663a5f4` 提交，本文档及后续展示样式、演示调整尚未提交。本文记录修复设计及实施差异；已验证本仓库页面，未接入截图所涉及的外部业务页面。

## 1. 目标与结论

修复 CodeBlock 在首次加载、切换语言和高亮失败时缺少反馈的问题。调用方正常传入 `file` 即可获得可读内容、加载提示和失败后的重试入口，无需通过隐藏挂载来保障基本体验。

本次以 `CodeBlock` 单文件展示为交付范围，覆盖其主线程、Worker、SSR hydration 路径。共享 File 引擎的虚拟化和编辑能力必须保持行为兼容；不在本次给 CodeDiff、CodePatch、CodeConflict、CodeView、CodeStream 全部增加状态 UI。流式组件已有独立的 `onError`，不能与本次高亮状态混用。

Python 已受支持；Node.js 使用 `javascript` 或 `typescript`。短暂无高亮可能由语言包加载造成；持续无高亮还可能来自资源失败、语言参数错误、缓存标识使用错误或主动降级，不能统一判为“加载慢”。

## 2. 当前实现与缺口

以下路径均相对于仓库根目录。

| 位置 | 当前行为 | 修复要求 |
| --- | --- | --- |
| `packages/ui/src/components/code-block/code-block.tsx` | 包装 File，管理换行和工具栏 | 接入高亮状态、提示与重试 |
| `packages/ui/src/system/code-engine/renderers/FileRenderer.ts` | 主题可用但语言未加载时先渲染纯文本；异步完成后通过 `applyHighlightResult` 通知重渲染 | 保留渐进高亮，补状态、失败捕获和请求生命周期 |
| 同上，`renderFile` 的异步调用 | `void asyncHighlight(...).then(...)` 没有 rejection 处理 | 所有脱离调用栈的任务都必须处理失败 |
| 同上，`hydrate` | 存在 `void initializeHighlighter()` | 合并到可追踪任务，避免初始化失败成为未处理拒绝 |
| 同上，首次冷启动 | 没有可用 highlighter/theme 时可能返回空结果 | 引擎未就绪时也能显示安全的纯文本 |
| `components/File.ts` | 同步异常有处理，高亮更新会触发 rerender | 同步 catch 无法接住上述异步拒绝；在 DOM 提交后报告状态 |
| `highlighter/shared_highlighter.ts` | 缓存共享 highlighter Promise，加载语言和主题 | 初始化失败后不能永久复用 rejected Promise |
| `highlighter/languages/resolveLanguage.ts` | 复用加载任务，finally 删除进行中的记录 | 保留去重；重试不清空已经成功加载的全局缓存 |
| `worker/WorkerPoolManager.ts` | 成功和失败已有 active request 检查；初始化失败已有主线程回退 | 复用保护；错误通知需携带文件任务上下文 |
| `FileRenderer.onHighlightError` | 仅输出 console.error | 转为当前文件任务的可观察失败状态 |
| `ssr/preloadFile.ts` | 等待完整高亮后生成 HTML | 保留服务端 await/reject 语义，hydration 不闪回纯文本 |

现有 `applyHighlightResult` 已检查文件和渲染选项，不应删除。`areFileTargetsEqual` 在存在 `cacheKey` 时优先比较该值；调用方必须在内容、语言或文件版本变化时更新 cacheKey，不能固定一个值反复切语言。

## 3. 用户可见行为

| 场景 | 内容 | 提示 |
| --- | --- | --- |
| 第一次打开，全部资源未就绪 | 立即显示当前文件的纯文本和行号 | 等待超过 200ms 才显示“正在加载语法高亮…” |
| 切换至未加载的 Python | 显示 Python 原文，避免文件名与正文错配 | 同上 |
| 已缓存语言与主题 | 直接显示高亮 | 不闪烁 loading 提示 |
| 加载成功且结果已渲染 | 原位置更新 token 样式 | 移除提示 |
| 加载失败或超时 | 保留当前文件可读内容 | “语法高亮暂不可用”及“重试” |
| text、未知扩展名推断为 text、空文件 | 正常显示原文或空内容 | 不提示失败，不持续 loading |
| 超出整文件高亮行数阈值 | 按现有策略显示纯文本 | 不提示加载失败 |
| SSR 已有对应文件的高亮内容 | 保留已有 DOM | 不因客户端补建缓存显示 loading |

代码复制、换行和滚动在加载或失败时仍可使用。高亮恢复不能重挂载整个 CodeBlock、重置滚动位置或清空用户选区。

默认高亮超时为 15 秒，从该文件任务开始计时，包含异步资源加载和 Worker 等待。它是兜底阈值，不代表性能承诺；主线程同步计算无法被普通计时器中断，不宣称解决同步执行卡顿。

## 4. 状态与公开接口

### 4.1 状态定义

在引擎 `types.ts` 定义状态类型，组件入口导出面向使用者的同名类型。以下为计划新增接口：

```ts
export type CodeHighlightState = {
  fileName: string;
  language: string;
} & (
  | { status: 'loading' }
  | { status: 'ready' }
  | { status: 'plain'; reason: 'text' | 'empty' | 'size-limit' }
  | {
      status: 'error';
      reason: 'load-or-render' | 'timeout';
      error: unknown;
    }
);
```

状态不携带完整代码，避免回调产生不必要的数据复制。内部另存请求序号和文件、选项快照，不向业务公开缓存结构。

`ready` 表示当前目标的高亮结果已应用到 DOM，或已接管对应的服务端高亮 DOM，不是仅仅完成语言 import。`plain` 是正常终态；`error` 是失败终态。单行超过 `tokenizeMaxLineLength` 造成的局部无高亮继续遵守现有规则，不因此将整份文件标记为 error。

### 4.2 CodeBlock 新增可选 props

```ts
interface CodeBlockHighlightProps {
  highlightFeedback?: boolean; // 默认 true，只控制内置视觉反馈
  highlightTimeoutMs?: number; // 默认 15000，0 表示不设置超时
  highlightRetryKey?: string | number; // 值变化时重试当前失败任务
  onHighlightStateChange?(state: CodeHighlightState): void;
}
```

这些字段加入 `CodeBlockProps`，不要放入所有代码组件共用的 `CodeBlockProductProps`，避免其他组件被动声明尚未实现的功能。

默认工具栏失败时提供重试按钮；关闭工具栏的调用方可通过 `highlightRetryKey` 实现自己的按钮。重试只在当前状态为 error 时执行，不重挂载组件。`highlightFeedback={false}` 不关闭状态通知或失败捕获。

内置按钮直接调用相同的重试入口，不修改调用方提供的 retry key。timeout 的非有限值或负值按默认值处理；配置变更仅作用于下一次任务，避免当前任务被父组件反复渲染延长截止时间。

### 4.3 状态迁移规则

- 新文件或有效高亮配置变化：建立新任务，进入 loading；同步缓存命中可直接 ready。
- 非高亮目标：直接 plain，不启动不必要的语言加载。
- 当前任务成功并完成 DOM 提交：ready。
- 当前任务失败或超过截止时间：error；停止自动重新提交同一失败任务。
- 显式重试：生成新请求序号，error → loading → ready/error。
- 文件 A → B → A：旧 A 的结果仍必须被识别为旧请求，不能仅凭文件相等就接受。
- 卸载、回收、编辑会话生命周期切换：让相关旧任务失效，清理计时器和订阅。

同一请求同一状态只通知一次。业务回调更换引用不能触发新的高亮任务；普通 React rerender、复制反馈或切换换行不能清除失败状态并再次自动请求。

## 5. 引擎实施方案

### 5.1 统一追踪高亮任务

在 FileRenderer 内保存当前任务记录：递增 generation、目标文件快照、有效渲染选项快照、进行中的 Promise、状态、超时句柄。身份比较复用现有文件和主题比较逻辑，再叠加 generation。

统一 `renderFile`、`hydrate` 和 Worker 结果的状态入口。对同一目标的重复调用复用进行中的任务；已失败目标在显式重试或目标变更前不再提交。共享语言加载仍可被多个组件复用，组件级超时或卸载只忽略自身的结果，不取消其他实例正在使用的加载。

所有 async fire-and-forget 入口改为完整的成功、失败和清理分支；成功与失败都先检查当前 generation、文件和选项。超时让该次任务退出可应用状态，晚到结果不能覆盖 error 或新任务。

不要通过轮询 Shadow DOM、查询 token span 数量或独立调用一次 preload 来猜测渲染完成。

### 5.2 首次冷启动的纯文本回退

新增 `utils/renderPlainFile.ts`，构建与现有 `ThemedFileResult.code` 兼容的最小纯文本行 AST，不依赖 Shiki 初始化或异步主题加载。继续经由现有 `processFileResult`、行号、annotation 和 DOM 应用流程显示内容。

实现要求：

1. 复用现有行拆分与换行规范化规则，保持 CRLF、单独 CR、末尾换行和空行数量一致。
2. 代码必须成为 HAST text 节点，不能拼接未经转义的 HTML。
3. 保留现有行节点所需的 data 属性和 token transformer 所依赖的结构约定；未高亮时不伪造 token 语义。
4. 接受 renderRange，只构建需要显示的行；不能让虚拟化退化为所有行 DOM。
5. 无主题时使用继承的文字颜色和现有容器背景；themeStyles 可为空，不阻塞正文和 header/slot 建立。
6. 没有可用结果时使用该回退；已有对应文件 SSR 高亮 DOM 时继续保留，不能为了建立本地 AST 覆盖成纯文本。

对活动编辑会话，继续使用现有编辑文档和渲染约束，不用 `file.contents` 的旧快照覆盖正在编辑的正文。文本回退的主验收范围是只读展示，编辑路径必须做回归。

### 5.3 状态通知与 DOM 提交

FileRenderer 负责记录任务状态和待提交结果；File 实例负责对外通知。loading 在本次目标开始处理后报告；ready/plain 在对应 DOM 提交完成后报告；error 在回退内容或已有对应内容保留后报告。

给 File 添加独立状态订阅与重试方法，例如 `subscribeHighlightState(listener)`、`retryHighlight()`，订阅立即返回当前快照，并返回取消订阅函数。不要把 listener 混入用于比较高亮缓存的 options。

React 接入路径：`react/types.ts` → `react/File.tsx` → `react/utils/useFileInstance.ts`。hook 使用稳定回调转发状态，在实例创建时订阅，在卸载时取消；将 retry key 的变化转换成 File 实例重试调用。超时配置独立传递，避免提示 UI 更新造成渲染循环。

用户回调异常不得被捕获并重新归类为“语法加载失败”；引擎状态、资源失败和调用方回调应在不同的异常边界执行。

### 5.4 共享 highlighter 初始化失败恢复

`getSharedHighlighter` 中，初始化 Promise 失败时仅在共享引用仍指向该 Promise 的情况下清空它，再向当前调用方抛出错误。避免旧失败清空后来成功建立的实例。

语言或主题加载失败不销毁已可用的 shared highlighter，也不清空其他语言缓存。检查语言和主题 resolver 的失败任务是否都会从进行中缓存删除。

重试表示重新尝试当前任务，不保证浏览器会重新下载一个已被模块系统缓存为失败的动态 import。若相同 chunk 仍无法加载，保持可读内容与错误状态；不使用随机 URL、全局 dispose 或自动刷新页面规避模块缓存。

### 5.5 Worker 路径

保留 `activeRequestByInstance`、任务去重和现有初始化失败回退。当前 `onHighlightError(error)` 缺少目标上下文：为文件任务增加文件/选项等可验证上下文，并在 WorkerPoolManager 的 file 分支传入；Diff 分支维持原契约。

FileRenderer 将 Worker 回调映射到当前任务 generation。对 A → B → A 或显式重试，失效旧订阅/任务关联，确保旧任务不能被误认成新请求；不得只在错误发生时读取 `this.file` 来推断错误归属。

Worker 初始化失败后，若现有主线程回退成功，最终报告 ready；回退处理期间保持 loading。只有当前高亮最终不可用才报告 error。不能让 Worker 与主线程同时对同一 generation 提交两个结果。

### 5.6 SSR 与 hydration

`preloadCode` 继续返回预渲染 HTML，服务端错误继续 reject，由服务端调用方决定如何降级，不添加 15 秒 UI 计时器。

已有 prerenderedHTML 时复用现有 hydration 路径确认其对应文件。客户端缓存补建不改变已显示的 ready；补建失败可内部记录，已有有效高亮不改成“高亮不可用”。之后切换到新文件，则按新任务重新判断。

## 6. React 提示、样式与兼容性

保持 CodeBlock 根节点为现有自定义元素，保留 className/style、Shadow DOM、annotations 和工具栏插槽；不额外包一层 div 改变消费者的尺寸或布局。

默认工具栏在文件名旁放轻量状态文案。200ms 延迟仅作用于 loading 文案，状态回调立即通知；ready/plain/error、目标变更、卸载时清除旧延迟计时器。快速成功不出现提示。

为 `CodeBlockToolbar` 增加可选状态与重试回调。新增消息 `highlightLoading`、`highlightFailed`、`highlightRetry`；为保持现有直接传入完整 `CodeBlockMessages` 的调用兼容，新消息在输入类型中可选，由 resolver 输出内部完整类型，工具栏也须有默认值兜底。同步中英文示例文案。

复用 `text-fg-muted`、`text-label`、`border-border` 等现有语义类和 Button；实施时确认类名存在。间距、truncate、flex 等使用标准 Tailwind，不新增全局样式变量或颜色硬编码。

`toolbar={false}`、`options.disableFileHeader=true` 或自定义 header 时，不强插工具栏或浮层。调用方仍收到状态，可自行展示；公开示例必须说明这一点。此次不新增任意内容的通用状态渲染插槽。

宿主设置 `data-highlight-state`；仅代码正文区域设置 `aria-busy`，加载任务进行时为 true。工具栏状态提示使用独立 `role="status"` 和礼貌播报，位于该 busy 正文区域之外，避免忙碌区域抑制提示。代码正文不放入 live region。重试过程中保持按钮节点和焦点；成功移除重试按钮时，仅当焦点仍在该按钮上才转移到同一工具栏的复制按钮，不能抢走已移动的焦点。

## 7. 文件改动清单

| 文件 | 计划改动 |
| --- | --- |
| `packages/ui/src/system/code-engine/types.ts` | 状态类型 |
| `packages/ui/src/system/code-engine/renderers/FileRenderer.ts` | 任务生命周期、失败处理、回退与状态快照 |
| `packages/ui/src/system/code-engine/utils/renderPlainFile.ts`（新增） | 无 Shiki 依赖的纯文本 AST |
| `packages/ui/src/system/code-engine/components/File.ts` | 订阅、重试、DOM 提交后的状态通知 |
| `packages/ui/src/system/code-engine/highlighter/shared_highlighter.ts` | rejected 初始化 Promise 恢复 |
| `packages/ui/src/system/code-engine/worker/{types.ts,WorkerPoolManager.ts}` | 文件失败上下文、过期任务关联处理 |
| `packages/ui/src/system/code-engine/react/{types.ts,File.tsx,utils/useFileInstance.ts}` | 状态转发、超时配置、重试和清理 |
| `packages/ui/src/components/code-block/{code-block.tsx,code-block-types.ts,index.ts}` | 产品 props、公开类型、提示状态 |
| `packages/ui/src/components/code-block/{code-block-toolbar.tsx,code-block-messages.ts}` | 文案、失败反馈、重试操作 |
| `packages/ui/registry.json` | 新增源码文件登记 |
| `tests/code-block-highlight-state.test.ts`（新增） | 引擎状态、竞态、失败和冷启动 |
| `tests/code-block-highlight-feedback.test.tsx`（新增） | React 提示、回调、重试与卸载 |
| `tests/code-block-worker.test.tsx`、`tests/code-block.e2e.ts` | Worker 和浏览器场景 |
| `docs/pages/components/code-block/page.tsx`、对应中英文内容 | 多语言及加载失败演示 |

静态资源与 Registry 产物通过项目脚本生成，不手工修改 public/r 下的 JSON。若为冷启动复现添加测试专用 fixture，使用测试入口注册延迟语言 loader，不在生产 API 中加入测试延迟参数。

## 8. 验证与验收

测试应控制语言 loader 的 Promise 和时间推进，不依赖真实网速。每个冷启动用例隔离共享 highlighter 和 resolver 缓存。既断言状态，也断言实际正文与 token 样式，不能以 ready 回调代替渲染正确性。

| 用例 | 必须通过的断言 |
| --- | --- |
| 全冷启动延迟 Python | 首次有原文和行号，200ms 前无提示，之后提示，resolve 后有正确高亮 |
| 已有 JS 后切 Python | 文件名、正文、复制内容都属于 Python，完成后高亮更新 |
| 缓存命中 | 无可见 loading 闪烁，无重复加载 |
| 语言/主题/引擎失败 | error 可见，原文可复制，无 unhandledrejection |
| 显式重试 | 恢复后 ready；保持滚动/选区；不会进入自动重试循环 |
| 超时与晚到结果 | 15 秒进入 error；旧结果不覆盖；新重试结果可正常应用 |
| A → B → A | 故意逆序完成/拒绝旧请求，最终只显示最新目标的状态和内容 |
| Worker 模式 | 成功、失败、初始化回退和旧任务失败均正确归属 |
| text、空文件、大文件 | plain 正常终止；不误报 loading/error |
| ANSI 与超长单行 | 保留现有渲染规则，不能简单按纯文本处理或误报失败 |
| 恶意 HTML 与各种换行 | fallback 不执行 HTML，代码和行号一致，复制保持原文 |
| SSR hydration | 已有高亮不闪白/降级，无重复 DOM 或 mismatch |
| toolbar=false/custom header | 不增添多余 UI，回调与外部 retry key 仍生效 |
| StrictMode/卸载/虚拟化回收 | 无残留计时器、重复订阅、卸载后回调和旧文件污染 |
| 活动编辑会话 | 加载/重试不覆盖草稿，不破坏光标、撤销历史或完成操作 |
| 样式与键盘 | 明暗主题可读，窄屏不挤压按钮，重试键盘可用，正文不反复播报 |

验证命令（先完成生产构建，再运行依赖生产产物的测试，不能与 build 并发）：

```sh
pnpm exec vitest run --config vitest.config.mts tests/code-block-highlight-state.test.ts tests/code-block-highlight-feedback.test.tsx tests/code-block-worker.test.tsx tests/code-block/core.test.ts tests/code-block-stream.test.tsx tests/code-block-file-stream.test.ts
pnpm lint
pnpm registry:build
pnpm registry:check
pnpm exec vitest run --config vitest.config.mts tests/code-block-entry-graph.test.mjs tests/code-block-registry-install.test.ts
pnpm test:consumer:smoke
pnpm test:code-block:e2e
```

现有测试执行范围由 `vitest.config.mts` 指定为 `tests/**/*.test.{js,mjs,ts,tsx}`；新增用例必须放在该范围。浏览器测试用独立页面/浏览器上下文隔离缓存，先验证冷启动，再验证暖缓存；错误注入用例明确捕获预期失败，不能屏蔽全部控制台错误。

## 9. 实施与提交顺序

1. **引擎可靠性**：补可控 loader 测试；统一任务状态、冷启动 fallback、generation 校验、共享初始化恢复；覆盖 Worker 和 SSR。建议提交 `fix(code-block): track highlight lifecycle and recover failures`。
2. **组件反馈**：接入 React 状态、延迟提示、失败重试、消息兼容和可访问性；补 React 用例。建议提交 `feat(code-block): show highlight loading and retry feedback`。
3. **分发与验收**：登记新增源码，生成 Registry，补消费端和浏览器验证。建议提交 `test(code-block): verify highlight recovery and distribution`。
4. **使用说明与演示**：单独整理文档和中英文演示改动；遵循当前“代码提交不包含文档”的要求，实施提交时显式选择文件，不使用全量暂存。

每一步完成对应行为验证后再推进；最终以第 8 节场景全部通过为交付条件。当前实施与验证情况见第 11 节。

## 10. 页面侧的临时处理与边界

静态代码可使用现有 `@zeron/ui/code-block/server` 的 `preloadCode` 生成 prerenderedHTML，配合相同 file/options 交给客户端。服务端预渲染和客户端共享缓存不是同一件事，不能把服务端预加载当作客户端语言包已下载。

客户端提前加载需要等待目标语言、主题和渲染所需资源真正完成；隐藏挂载仅移动等待时间，增加实例和内存成本，不作为组件长期契约。当前未在 `@zeron/ui/code-block` 入口导出客户端 preload 方法，本次不为临时方案新增独立 preload API。

页面首先确认显式语言使用 `python`、`javascript` 或 `typescript`，并检查 cacheKey 是否随文件版本变化。如果代码一直没有高亮，应结合实际资源错误和新状态诊断；增加 loading 文案本身不会修复无效语言、损坏资源或错误缓存标识。


## 11. 实施记录

- 已完成状态回调、默认 15 秒超时、200ms 延迟加载提示、工具栏重试和外部 retry key。
- 已完成无 Shiki 依赖的安全纯文本回退，按可视窗口生成行节点；SSR 已有高亮继续保留。
- Worker 采用每次任务独立的订阅对象捕获文件上下文，依靠对象身份隔离旧结果，无需更改现有 FileRendererInstance/DiffRendererInstance 回调签名。补齐了语言解析失败时向 renderer 报错的遗漏。
- 已完成共享 highlighter 初始化失败后的恢复；普通重渲染不会自动重复提交失败任务。
- 已加入 Python / Node.js 切换示例、中英文消息和 API 说明，重新生成 Registry。
- 已通过专项测试、三种浏览器的桌面/移动端回归，以及 Next.js npm/pnpm 和 Vite 的消费者安装验证。整体 lint、Registry 检查和生产构建通过。
- 独立 `tsc --noEmit` 存在原有测试文件类型错误（commit-history、i18n-message-parity、infinite-log-controller、tree-scenarios）；本次新增测试和组件源码没有对应类型错误。生产构建自身的类型检查通过。
- 核心修复已提交为 `663a5f4`（`fix(code-block): report highlight loading and failures`）；本文档及后续展示样式、演示改动仍保留在工作区。
