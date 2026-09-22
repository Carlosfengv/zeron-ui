# Zeron Code Block：完整实现与重构方案

日期：2026-09-22。状态：实施中；源码闭包、公共入口、资源构建、Registry、文档页和首批行为验证已落地。

## 1. 目标与已确定的技术决策

在 Zeron UI 内实现代码展示、差异对比、交互和编辑能力，交付独立的 Code Block 组件族。生产代码、安装产物及其依赖闭包由 Zeron 自己维护，不依赖外部同类组件包或远程运行资源。

采用“固定功能范围 → 建立行为验证 → 接入 Zeron 契约 → 分模块重构”的顺序。源码、构建和发布由 Zeron 自己维护。

本方案作出以下决定，实施时无需重新选择架构：

1. **完整范围限定为代码组件域**：覆盖 File、FileDiff、Patch、多文件、虚拟化、流式、Worker、SSR、注释、选区、冲突处理和编辑。文件树、独立高亮服务、网站与后台不属于这次 Code Block 实现。
2. **源码归入现有 `@zeron/ui`**：UI 放入 `src/components/code-block/`，非 React 核心放入 `src/system/code-engine/`；不新增需要独立发布的工作区 npm 包。
3. **首版保留 Shadow DOM 和当前核心状态模型**：保留已验证的布局、选区、虚拟化与编辑算法，统一公开命名、依赖边界和 Zeron 集成；不同时重写成全 React 行渲染。
4. **一个用户安装项**：`code-block` 安装完整组件族；内部依赖项 `code-engine` 负责源码与资源。首版按运行时入口拆分，而不按安装文件拆分，避免编辑类型或工具函数缺失。
5. **两套外观预设**：`appearance="zeron"` 为默认；兼容预设用于行为和布局回归。内置主题数据按需加载。
6. **先验证分发，再扩展功能**：源码能在文档站运行只是中间结果；干净 Next.js/Vite 消费项目安装、构建、Worker 实际运行必须通过。
7. **首版完整交付包含编辑和流式**：可以分阶段合并，但不能将只读展示完成写成“完整实现完成”。

## 2. 项目基线与证据边界

### 2.1 工作区基线

当前工作区使用 React 19.2、Next 15.5.9、Shiki 4.4.3、Tailwind 4、Vitest 4 和 Playwright。开始实施时记录现有未提交改动，按实际文件和 hunk 合入；日志表、滚动区、时间直方图、CLI 和全局 CSS 等既有改动不属于本任务，不修复、不回滚，也不计入 Code Block 的交付结果。

### 2.2 现有代码决定的落地方式

以下路径均相对仓库根目录；“新增”表示拟创建，不表示文件已经存在。

| 已有文件／机制 | 核实的现状 | 本次处理 |
| --- | --- | --- |
| `package.json` | React 19.2、Next 15.5.9、Shiki 4.4.3、Tailwind 4、Vitest 4、Playwright 已具备 | 沿用 pnpm 与现有框架；补齐核心真正直接使用的依赖 |
| `packages/ui/package.json` | 私有源码包，使用显式 exports；目前没有 code-block 导出，也未声明 Shiki | 增加 code-block 子入口、core 子入口和明确依赖，避免只依赖根目录恰好已安装 |
| `packages/ui/src/system/*` | 已有非 UI 系统模块；Registry 将 system 路径映射到 `@lib/*` | 核心引擎使用同一分发模式 |
| `docs/lib/highlight.ts` | 只加载 TSX、GitHub 明暗主题；`code.trim()`；100 项缓存 | 不将其升格为核心；新组件保留精确原文，最终接管文档 Code 面板 |
| `docs/components/content/ComponentPreview.tsx` | 切到 Code 面板才动态加载高亮，已有失败降级、复制和全屏相关逻辑 | 保留现有交互和延迟加载策略，只替换代码内容区 |
| `packages/ui/src/tokens/semantic-tokens.mjs` | tokens 的手工维护源 | 默认 Zeron 外观复用现有 tokens；必要新增仅改源与生成器 |
| `scripts/generate-semantic-tokens.mjs` | 生成 globals、token 包、Registry 与其他衍生文件 | 不手改生成区；避免无必要的全局 token 扩张 |
| `packages/ui/src/system/theme-context.tsx` | Provider 操作根节点 light/dark class；`useThemeContext` 无 Provider 会抛错；有全局 D 快捷键 | 新组件不强制该 Provider；补齐编辑区快捷键识别 |
| `packages/ui/src/system/portal-container-context.tsx` | 支持全屏区域内的浮层挂载 | 工具栏菜单／提示沿用该机制 |
| `packages/ui/registry.json` | 支持多文件 `registry:ui` 和 `registry:lib` | 增加 code-block、code-engine，显式声明所有 target |
| `packages/registry/scripts/transform-imports.mjs` | AST 改写静态 import、export、import type；缺少动态 import 改写，且所有文件都按 TSX 解析 | 按扩展名解析、拒绝语法错误输入，再补字面量动态导入支持；内部模块优先相对路径 |
| `packages/cli/src/resolve-registry-aliases.js` | 已支持字面量动态 import 的消费者别名解析，且会跳过非源码资源 | 保留实现，新增从 Registry 转换到消费者落盘的串联测试，不重复编写解析器 |
| `packages/registry/scripts/registry-check.mjs` | 已检查动态 import 与 `new URL(...)` 文件依赖闭包 | 利用现有检查，新增针对本组件的资源和依赖断言 |
| `packages/cli/src/install-plan.js` | 只接受 components/ui、components、lib、hooks 等 target；文件内容按文本处理，保护冲突文件 | Worker 放 `lib/code-engine/`，资源采用文本模块，不依赖 public 路径或二进制安装能力 |
| `packages/registry/scripts/postbuild.mjs` | 从 ui/blocks manifests 获取依赖版本，并改写 workspace imports | 外部运行依赖在 ui 包明确声明，不把 workspace:* 带入产物 |
| `scripts/test-consumer-installs.mjs` | 已有 Next/npm、Next/pnpm、Vite 路径；Next 未定义 example 会跳过 build，Vite 会报错 | 必须同时补真实 examples，不能只把名称加入列表 |
| `vitest.config.mts` | 默认仅收集 `tests/**/*.test.{js,mjs,ts,tsx}` | 移植测试进入 tests，不能留在其他目录后声称已经运行 |
| `app/[locale]/docs/components/[slug]/page.tsx` | 使用 component-page-loaders 和静态路由参数 | 沿用通用路由，补加载映射，无需新建专用 app 路由 |

## 3. 完整功能矩阵与产品边界

以下均为完整交付要求，阶段编号见第 10 节。实施时建立 `tests/code-block/parity-manifest.json`（新增），逐条记录基线 API、对应 Zeron API、用例及 passed/failed/unchecked 状态。

| ID | 功能 | Zeron 实现模块 | 交付与验收 | 阶段 |
| --- | --- | --- | --- | --- |
| F01 | 单文件展示 | `components/File.ts`、`react/File.tsx`、`renderers/FileRenderer.ts` | 文件名、语言、行号、首行位置、tab、长行、scroll/wrap、空文本、精确换行 | P2 |
| F02 | 高亮／主题 | `highlighter/`、`utils/getHighlighterThemeStyles.ts` | Shiki JS/WASM 选择、语言识别／扩展名覆盖、自定义语言／主题、text/ansi、内置主题集合 | P2 |
| F03 | 双文件差异 | `components/FileDiff.ts`、`utils/parseDiffFromFile.ts` | split/unified、行内粒度、增删标识、两侧行号、同步滚动与布局切换 | P3 |
| F04 | Patch | `utils/parsePatchFiles.ts`、`react/PatchDiff.tsx` | 多文件 patch、增删／重命名、末尾无换行、partial diff、异常 patch 行为与基线对照 | P3 |
| F05 | 展开与折叠 | `DiffHunksRenderer.ts`、分隔条与 hunk 工具 | 上下文展开、整文件折叠、自定义 separator，展开后选区／滚动锚点稳定 | P3 |
| F06 | 行与 token 交互 | `managers/InteractionManager.ts` | 点选、拖选、Shift 扩选、受控选区、gutter 操作、token enter/leave | P2–P3 |
| F07 | 注释与自定义头部 | `react/utils/renderFileChildren.tsx`、`renderDiffChildren.tsx` | 注释插槽、文件级／行级注释、prefix／filename suffix／metadata／custom header | P2–P3 |
| F08 | 接受／拒绝变更 | `utils/diffAcceptRejectHunk.ts` | 返回实际变更结果；演示中更新数据，不能只有按钮视觉反馈 | P3 |
| F09 | 冲突解析 | `components/UnresolvedFile.ts`、`utils/resolveConflict.ts`、`resolveRegion.ts` | current/incoming 等基线支持的动作、连续处理多个冲突、行号与注释更新 | P3 |
| F10 | 多文件及虚拟化 | `CodeView.ts`、`VirtualizedFile.ts`、`VirtualizedFileDiff.ts`、`Virtualizer.ts` | 可视区渲染、增删／重排、版本更新、scrollTo、折叠、离屏重入、底部注释锚定 | P4 |
| F11 | Worker | `worker/` | 初始化、并发任务、缓存、主题更新、错误／取消／过期结果处理、销毁 | P1/P4 |
| F12 | SSR | `ssr/`、`react/utils/templateRender.tsx` | 单文件／差异预渲染、首次内容可见、hydration 无重复 DOM 或 mismatch | P2–P4 |
| F13 | 流式代码 | `components/FileStream.ts`、`shiki-stream/` | ReadableStream 增量输入、token recall、close/abort、切换流后旧内容不串入 | P4 |
| F14 | 编辑 | `editor/`、`edit/index.ts`、`react/EditContext.tsx` | 单文件与 diff 新侧编辑、光标／选区、撤销重做、查找替换、输入法、编辑完成与会话保留 | P5 |
| F15 | 编辑扩展接口 | `editor/marker.ts`、`popover.ts`、`editPrediction.ts` | 保留 marker、popover、预测提供者等基线扩展能力；验证取消与异步竞争 | P5 |
| F16 | Zeron 产品外壳 | 本项目 Button、Tooltip、Tabs、Dropdown、图标上下文 | 复制原文、布局／换行切换、文件 tabs 示例、加载／失败提示、中英文标签 | P2/P6 |
| F17 | 可访问性与适配 | 引擎交互＋Zeron 外壳 | 键盘可达、焦点可见、颜色之外的增删标识、窄屏可操作、全屏浮层、减少动效 | 全程/P6 |

“完整”指上述功能矩阵中的行为与能力完整，不要求所有内部函数成为 Zeron 公共 API。修复偏差需有记录与回归用例。

产品边界：

- 多文件侧栏可组合 Zeron 已有 FileTree，不替换现有 Tree。
- 评论、批注和接受／拒绝结果由回调交给调用方；不新增账号、GitHub API、持久化评论或提交代码服务。
- 编辑扩展保留接入能力，不添加语言服务器、自动联网补全或 AI 推理服务。
- 保留 FileStream，不增加独立远程高亮服务。
- 完整复刻覆盖组件，不复制官网营销内容、品牌页面或字体文件。视觉对照双方使用同一字体，固定字号、字重和行高。

## 4. 源码结构与模块映射

### 4.1 建议目录

```text
packages/ui/src/
  components/code-block/
    index.ts                    # 只读 React 公共入口
    code-block.tsx              # 单文件
    code-diff.tsx               # 双文件／已解析差异
    code-patch.tsx              # Patch
    code-conflict.tsx           # 未解决冲突
    code-view.tsx               # 多文件／虚拟化
    stream.tsx                 # 独立流式入口
    edit.tsx                   # 独立编辑 Provider / 导出
    edit-context.tsx           # 轻量编辑 factory 上下文，不导入编辑运行代码
    worker.tsx                 # 独立 Worker Provider
    server.ts                  # SSR 公共入口，不带 use client
    code-block-toolbar.tsx
    code-block-types.ts
    code-block-theme.ts
    code-block-messages.ts
    hooks/                     # React 生命周期工具
    slots/                     # React 注释、文件头与 gutter 内容
    jsx.d.ts                   # 本地 custom element 类型
  system/code-engine/
    core.ts                    # 精选核心导出，不 export * 全部模块
    types.ts
    constants.ts
    components/                # 非 React imperative 引擎
    renderers/
    managers/
    highlighter/
    theming/                   # 只移入实际用到的 theme resolver / color 工具
    themes/                    # 内置主题数据＋显式 lazy loader map
    utils/
    shiki-stream/
    editor/                    # 保留源码，通过 edit 入口加载
    ssr/                       # 不依赖客户端入口
    worker/
      worker.ts                # 自有可编辑源
      worker.js                # 生成的自包含模块 Worker
      worker-factory.ts        # 相对 URL，浏览器端调用
    styles/
      base.css                 # 手工维护源
      editor.css               # 手工维护源
      base-css.generated.ts    # 编译成字符串
      editor-css.generated.ts
```

新增辅助文件：

- `scripts/build-code-engine-assets.mjs`：生成 CSS 字符串和 Worker；支持 `--check`。
- `scripts/generate-document-loaders.mjs`：若确认现有生成器确实缺失，则新增最小生成器，见第 8 节。
- `tests/code-block/`：移植测试、fixtures、快照、功能对照表。
- `playwright.code-block.config.ts`、`tests/code-block.e2e.ts`：真实浏览器交互。
- `docs/pages/components/code-block/`：独立文档与场景演示。

### 4.2 模块实现原则

| 模块 | 操作 |
| --- | --- |
| `components`、`renderers`、`managers`、`utils` | 保留算法和相互关系，统一 imports、custom element 标识与资源入口；之后按测试覆盖重构 |
| `react` | 适配为 Zeron React 入口，不保留第二套公开包装层 |
| `editor`、`edit` | 全量审计，重型模块仅由编辑入口导入；只读源码中所需类型和少量共享帮助函数继续随 core 安装 |
| `ssr`、`worker`、`shiki-stream` | 保持独立入口、协议与清理语义，使用本地构建和主题依赖 |
| `theming/modules` | 维护 createThemeResolver、createTheme、normalizeThemeColors 及必要依赖，不加入网站主题控制器或额外 React provider |
| `theming/collections` | 使用本地主题加载表和 Shiki 主题集合 |
| `themes/*.json` | 内置主题数据，保留按需加载行为 |
| `sprite.ts`、`editor/sprite.ts` | 核对符号名称和渲染效果；外部工具栏使用 Zeron icons |
| `tests/code-block` | 相关测试、快照和 harness 使用 Vitest/Playwright 维护 |

不整库搬入 Moon、Bun workspace、tsdown 发布系统、官网应用或主题编辑器插件。

## 5. 对外 API 与状态契约

以下 API 按完整功能矩阵设计，避免过度简化导致能力丢失。

### 5.1 公开入口

| workspace 入口 | 用户安装后入口 | 内容 |
| --- | --- | --- |
| `@zeron/ui/code-block` | `@/components/ui/code-block` | CodeBlock、CodeDiff、CodePatch、CodeConflict、CodeView、只读类型 |
| `@zeron/ui/code-block/stream` | `@/components/ui/code-block/stream` | CodeStream 与流控制类型 |
| `@zeron/ui/code-block/edit` | `@/components/ui/code-block/edit` | CodeEditProvider、创建编辑器和会话管理能力 |
| `@zeron/ui/code-block/worker` | `@/components/ui/code-block/worker` | CodeWorkerProvider、workerFactory 扩展 |
| `@zeron/ui/code-block/server` | `@/components/ui/code-block/server` | preloadCode、preloadDiff、preloadPatch |
| `@zeron/ui/system/code-engine/core` | `@/lib/code-engine/core` | 解析、变更应用、主题／语言注册和必要的非 React API |

消费者路径是默认 aliases 的示例；真实安装以 CLI 解析后的路径为准。`packages/ui/package.json` 的 exports/imports 显式声明需要的子入口，不暴露整个内部文件树作为稳定 API。

入口依赖边界必须实际成立：

- `index.ts` 只导出客户端组件和类型，禁止转导出 server/edit/worker 工厂；交互模块明确使用 `use client`。
- `core.ts` 只包含可在 Node 执行的解析／转换／注册能力，禁止转导出会注册 custom element 的组件、DOM managers 或 Worker factory。
- `server.ts` 只依赖 renderers、SSR 和纯工具，不经客户端 barrel 导入，不构造 Provider。Next Server Component 只向客户端传递可序列化的数据、主题标识和可信预渲染字符串；render callbacks、编辑器实例及 Worker factory 在客户端绑定。
- 只读 React 层通过轻量 `edit-context.tsx` 获取可选 factory；`edit.tsx` 才导入编辑器实现。编辑类型使用 type-only import，不能因为一个共用 barrel 把编辑实现带入只读运行路径。
- 只读路径允许共享选区类型、会话桥接接口及必要的小型工具；“不加载编辑实现”的判定对象是 editor、输入处理、piece table、搜索面板等实际编辑运行模块，以产物依赖图为准。

### 5.2 数据与回调

- `CodeFile` 保留 `name`、`contents`、`lang`、`cacheKey` 等数据语义；`contents` 不 trim、不自动格式化。内容变化必须使内容版本／缓存键失效，文档给出稳定 id 与版本更新示例。
- 长期共享的高亮／diff 缓存必须有条目或内存上限；异步加载失败不能永久缓存 rejected Promise。组件更新与 Worker 结果按文件版本、主题和请求标识匹配，过期结果不得覆盖当前视图。
- `CodeBlock` 接收 `file`、`options`、`appearance`、`themeMode`、`messages`、`lineAnnotations`、`selectedLines`、相关 render slots 和生命周期回调。常用 Zeron 顶层属性与 `options` 重叠时，从 options 类型排除对应字段，避免两处配置互相覆盖。
- `CodeDiff` 的输入采用互斥类型：`{ oldFile, newFile }` 或 `{ diff }`。不能同时传两种输入；`CodePatch` 接收 patch 字符串并使用同一解析核心。
- 新增／删除文件允许 oldFile 或 newFile 单侧为 null，双方同时为 null 应拒绝；空字符串是有效空文件，不能与文件不存在混同。纯重命名及未加载正文沿用基线的数据状态，提供独立 fixtures。
- 选区使用公开行号和左右侧语义，在文档明确行号以 1 为起点；定义点击、扩选、切换 unified/split 时的映射，不能用 DOM 下标代替源码行号。
- `CodeView` 使用稳定 item id、显式 version；受控 `items` 与初始化用 `initialItems` 互斥。保留 scrollTo、增删／更新及选择管理的 ref 能力，不将两种状态模式混用。
- 编辑沿用 draft 与完成提交分开的模型。`onEditChange` 提供草稿事件，不在每次输入后把它立即写回 file props 形成重置循环；`onEditComplete` 返回 accept/reject。异步保存由调用方先保存草稿再决定何时结束会话，不把同步完成回调伪装成异步协议。
- CodeBlock／CodeDiff 显式暴露 `edit`、`editorOptions`、`editStateKey`、`onEditChange` 和 `onEditComplete`；CodeView 对应 item 编辑配置及 item 回调。`edit` 默认 false；启用时必须有可用的编辑 factory，否则报告配置错误并保留只读内容。缺少完成回调时按基线 reject，不静默接受。受控调用方接受结果后同步更新 file/items 与版本；卸载事件用于交还草稿，不承诺组件已卸载后仍替调用方安装结果。
- Diff 编辑仅作用于新文件一侧。编辑结束、取消、卸载和折叠分别按会话契约验证；切换文件时不丢失已声明保留的 undo/history。
- 复制从数据模型提取全部内容或指定选区，不能从虚拟化 DOM 的 textContent 提取；反馈仅在 Clipboard Promise 成功后显示。
- 评论／annotation 可用泛型 metadata 承载业务数据；回调默认不自动发网络请求。

### 5.3 Provider、主题和 DOM

- 默认只读代码块无需 Zeron ThemeProvider 或 WorkerProvider；支持局部挂载。复杂页面可共享 WorkerProvider 和编辑会话管理。
- Worker 池以 Provider 为生命周期边界，同一 Provider 下共享；不同 Provider 默认独立，分别持有各自 factory、初始化参数与缓存。浏览器提交后创建池、卸载释放；StrictMode 重挂载不得泄漏，卸载其中一个 Provider 不得终止另一个的任务。初始化参数变化时销毁并重建对应池，旧结果全部失效。
- 无 WorkerProvider 时使用主线程高亮；显式配置 Worker 的 Provider 初始化中先显示纯文本，失败遵循第 6.2 节策略，不能自动切回主线程却掩盖错误。文档的双主题对照同时覆盖不同 Provider 配置，主题切换不能串入其他实例。
- `themeMode` 采用 `light | dark | system | inherit`，默认 inherit：宿主明确 color-scheme 优先，再解析 light/dark class，最后匹配系统偏好。显式属性优先级最高；只订阅必要变化，卸载清理。
- 组件不直接调用缺少 Provider 会抛错的 `useThemeContext`。文档站可以从已有 Provider 显式传 mode，消费项目使用局部属性或继承。
- 服务端和客户端首轮使用同一选定主题／结构；system/继承模式采用双主题样式或固定首帧，避免 hydration 时修改结构。
- custom element 使用 `zeron-code-container`；SSR 字符串、JSX 类型、选择器和注册检查同步修改。开发热更新注册幂等。
- 首版保留内部 `data-diffs-*`、CSS 变量等内部协议，外部不把它们作为稳定定制契约；未来重命名须更新全部样式／选择器／快照。
- Zeron 工具栏和 React 注释内容放 light DOM／slot，让现有 Tailwind、图标和浮层继续生效。引擎内部布局样式留在 Shadow DOM。
- CodeView 拥有自己的滚动视口；不在外面再嵌套会改变测量与同步滚动的 ScrollArea。文档预览容器只负责尺寸和外层滚动。

## 6. 依赖与资源构建

### 6.1 依赖处理

| 依赖 | 处理 |
| --- | --- |
| 外部同类组件包 | 不写入 Zeron 的生产／开发依赖；检查实际 import、依赖声明和运行时请求 |
| React / React DOM | 沿用当前 React 19 消费契约 |
| Shiki / `@shikijs/langs` / `@shikijs/themes` | 沿用当前 4.4.3 基线，实际直接 import 的包都声明到 ui manifest，并与根目录版本保持一致 |
| `@shikijs/transformers`、`diff`、`hast-util-to-html`、`lru_map` | 首版保留核心实际用到的通用依赖；实施时固定可验证版本，不为去依赖而同步改算法 |
| HAST 等类型包 | `.ts` 源码分发也需要可解析的类型依赖；根据消费者实际 import 声明，不能只留在本仓库 devDependencies |
| CSS 构建工具 | 仅在维护端声明直接依赖：postcss、postcss-nesting、postcss-calc、autoprefixer、lightningcss；不要求消费者安装 |
| Worker 构建工具 | 新增维护端 esbuild，生成自有 worker.js；锁文件记录版本，消费者只接收产物与源码 |

所有外部依赖最终由 `postbuild.mjs` 从 `packages/ui/package.json` 加上版本信息。源码扫描、Registry、lockfile 和消费项目共同验证组件依赖闭包只包含已声明依赖。

### 6.2 CSS 与 Worker 构建方案

组件样式需要处理嵌套 CSS、calc、前缀、压缩和 layer 顺序。为避免把 `*.css?inline` loader 假设带给消费者，采用维护端预生成资源：

1. `styles/base.css`、`editor.css` 为唯一可编辑样式源。生成可导入的 TS 字符串，保留 `base,theme,rendered,unsafe` layer 顺序。
2. 引擎 imports 指向 `base-css.generated.ts`／`editor-css.generated.ts`，不再使用 `?inline`、`?raw` 或消费者专用 loader。
3. `worker/worker.ts` 打包为模块 `worker.js`。默认 JS 高亮路径自包含；可选 WASM 使用 Shiki 提供的文本封装或由维护端生成包含字节数据的 JS 模块，运行时通过 WebAssembly API 实例化。当前 CLI 按 UTF-8 文本读取／写入安装内容，因此不将裸 `.wasm` 二进制直接塞入 Registry。若生成额外 JS 模块，列入同目录资源清单并验证相对 URL，不从外站下载。
4. 默认 factory 使用 `new Worker(new URL("./worker.js", import.meta.url), { type: "module" })`。factory 位于同目录；只在浏览器生命周期内执行，不能在 SSR 顶层构造。
5. 保留用户提供 `workerFactory` 的能力。若某个构建工具不支持默认 URL 路径，先用 P1 复现并修复该集成；不能在完整验收时静默改为主线程却报告 Worker 正常。
6. Worker 失败时呈现可读纯文本并报告错误；有明确配置才回退主线程高亮。Worker 正常启用的验收需检查真实消息往返和任务结果。
7. 生成器提供 `--check`，对比输出不写文件；产物提交到仓库。`dev`、`build`、`registry:build` 前运行生成步骤。开发期间修改 CSS／Worker 源后必须重新生成：`dev` 启动受控 watch 子进程并在退出时清理，watch 只跟踪输入文件，排除生成输出以免循环。检查模式与生产构建保持一次性执行；消费者不运行生成器。
8. 引擎资源生成不改变全站 CSS；生成 JS 如需要 lint 忽略，仅精确覆盖可重复生成的 Worker 输出，手写源码／UI 不能借此整体豁免。

Worker/CSS 的编辑源和生成脚本都在 Zeron；生成产物不能替代对应的可维护源代码。

### 6.3 构建产物与检查边界

- code-engine:build 只更新自己的 CSS／Worker 输出和 Registry 中 code-block/code-engine 两项的文件列表；不重新生成或覆盖其他组件的配置。tokens:build 继续拥有现有主题／token 数据，随后 compose/postbuild 生成发布产物。
- code-engine:check 在临时目录重建期望输出后比对，不修改工作区；检查文本资源可安装、依赖闭包无禁用包及清单同步。裸二进制输出视为当前方案构建失败。
- Worker 源先采用与现有 DOM 类型配置兼容的局部消息／作用域类型，不在全项目追加会与 DOM 全局声明冲突的 WebWorker lib；确需独立 Worker tsconfig 时，维护端单独检查，并确保发送给消费者的源码在其 tsc 中也可解析。

## 7. Zeron 风格与现有交互集成

### 7.1 Token 策略

| 角色 | 默认 Zeron 映射 |
| --- | --- |
| 文件头／容器 | 现有 surface、border、fg-default／muted／subtle |
| 添加内容 | success-surface、fg-success 及对应边界语义 |
| 删除内容 | danger-surface-subtle、fg-danger 及对应边界语义 |
| 修改／提示 | info-surface、fg-info |
| 选择与焦点 | selection、focus-ring |
| 动效 | 现有 duration tiers，尊重 reduced-motion；代码内容更新不做装饰性位移动画 |
| 语法颜色 | 独立 code-theme 主题数据；不把 keyword/string/comment 粗暴等同于业务成功／失败色 |

只在确有独立语义时增加 code-specific tokens，在 `semantic-tokens.mjs` 或专用主题数据模块维护。保持 UI 组件不硬编码调色板；主题数据的用途与检查单独明确，不通过关闭全仓颜色规则达成。

`appearance="engine"` 用于验证没有产品外壳覆盖时的引擎基础布局，包括头部、行号、代码行、diff 色块、分隔条、选区和注释位置。Zeron 扩展工具栏可关闭，避免额外控件改变布局。默认 Zeron 外观依据本项目 tokens 单独验收。

### 7.2 必须修改或验证的现有交互

1. `theme-context.tsx` 的 D 快捷键目前只检查 `event.target` 是否可编辑。Shadow DOM 会重定向 target；需通过 `composedPath()` 检查可编辑节点和明确的代码输入区域，并尊重 `defaultPrevented`／`isComposing`。不能让输入 d、中文组合输入触发全站主题切换。
2. `docs/components/shell/site/site-shell.tsx` 的全局快捷键有类似判断，检查 Code Block 编辑状态是否被拦截。只改实际冲突处理，不扩大为全站键盘重构。
3. Tooltip／Dropdown 延续 PortalContainerProvider，验证全屏预览时仍可见；不把 Tailwind 样式未经处理地塞入 ShadowRoot。
4. 既有 `scroll-area.tsx` 当前有未提交改动。引擎使用自己的测量／滚动层，不为了本组件回滚或大改 ScrollArea。
5. `ComponentPreview` 的 Code 面板必须保持“打开后才加载”的行为，并避免 CodeBlock 示例嵌套预览造成无限递归。复制、原文首尾换行、错误 fallback 与亮暗切换均做回归。

### 7.3 内容与扩展的信任边界

- 源代码、文件名、Patch 和错误信息视为普通文本；测试 `<script>`、HTML 属性片段及特殊路径字符不会变成可执行节点。
- SSR 预渲染 HTML 只能来自本地可信渲染器；不提供将任意用户 HTML 直接注入 Shadow DOM 的便捷属性。`prerenderedHTML` 明确为可信输入契约。
- 自定义主题、CSS 和 render callbacks 是开发者扩展接口，与普通代码内容分开；不从代码文本中解释样式或执行脚本。
- CSP 下的模块 Worker、样式插入和可选 WASM 路径分别验证。默认不通过 eval、Blob Worker 或远程 CDN 绕过宿主策略；受限环境有可读降级和明确错误回调。
- 代码内容不发送到服务端高亮服务或遥测端点；语言资源从消费项目构建产物加载。上传／保存只由调用方显式实现。

## 8. Registry、文档与安装交付

### 8.1 Registry 闭包

```text
code-block (registry:ui)
  ├─ code-engine (registry:lib)
  │    ├─ lib/code-engine/** 源码、生成资源与主题
  │    └─ 实际使用的 Shiki / diff / HAST 等外部依赖
  ├─ surfaces / utils / icon-context
  └─ 实际工具栏使用的 Button / Tooltip / Dropdown 等 Zeron 项
```

- UI targets 固定到 `components/ui/code-block/**`，core targets 到 `lib/code-engine/**`；内部目录结构保持一致，便于相对 imports 和 Worker URL。
- 具体 registryDependencies 从真实 imports 得出，不为了演示而把 Tabs、FileTree、完整应用 Shell 都变成组件依赖。
- 一个安装项包含完整源文件，包括只在编辑模式使用的源码；“未启用时不加载编辑运行代码”通过独立入口和浏览器产物验证，不能通过漏发类型／源码达成。
- 包导出、Registry 源清单、生成产物和安装说明同一提交更新。绝不手工修补 `public/r/code-block.json` 来掩盖源清单遗漏。
- 约两百个源文件加上主题／资源使手工清单容易失配：在 code-engine:build 中依据明确的目录白名单生成两个条目的 files，稳定排序、排除测试和构建临时文件；code-engine:check 校验每个受维护文件均已分发或有明确不分发原因，不让递归扫描意外打包私有文件。
- `meta.zeron` 沿用现有 React UI、React 19、Tailwind 4 契约，不标成 Next-only，不要求 Next API 进入 core。
- 先修复 `transformRegistryImports` 的 ScriptKind：按 `.ts`／`.tsx`／`.js`／`.jsx` 等扩展名解析，遇到 parseDiagnostics 报错后停止生成；再补字面量动态 import 改写。当前已复现 `.ts` 中 `export const identity = <T>(value: T): T => value;` 转换后被追加 `</>;`，产生 TypeScript 语法错误。添加 TS 泛型、TSX JSX、JS bundle、动态导入和非法输入用例，防止复制引擎后生成损坏源码。
- `new URL` 默认只采用相对路径，不引入 workspace 别名。CLI alias 解析已经支持字面量动态 import，本次增加串联验证，优先保持现有代码。
- 现有 registry-check 已遍历动态 import 和 URL，继续利用；新增检查不重复制造第二套一般依赖解析器。

### 8.2 文档接入清单

- `docs/manifest.ts`：新增 components/data-display 下的 `code-block`，关联 Registry item。
- 新增 `docs/pages/components/code-block/page.tsx` 与按功能拆分的 demo；唯一导航项内部覆盖所有能力。
- 新增 `docs/content/en/components/code-block.json`、`docs/content/zh-CN/components/code-block.json`；组件 messages 参数不强绑 next-intl，翻译在文档层完成。
- 更新 `docs/generated/component-page-loaders.generated.ts`、聚合 `page-loaders.generated.ts`、`docs/i18n/content-loaders.generated.ts`。
- `docs/README.md` 要求使用文档 loader 生成器，但本次在受检源码中未找到对应脚本或 package script。P0 先核实是否有未纳入版本控制的工具；若确实缺失，新增最小确定性生成器和 `--check`，保留现有特殊路由／消息映射，禁止猜测一个不存在的命令。
- 新增 `docs/agent-guides/components/code-block.md`，包含 API、选区／编辑契约、Worker、消费者 imports 和错误降级。
- 更新 `app/agent-guides/[collection]/[slug]/route.ts` 的字面量 guideLoaders；仅添加 markdown 文件不会自动发布该路由。
- 更新 `public/llms.txt`、README 必要安装说明和组件封面源；封面通过现有生成脚本产出。
- `tests/i18n-document-manifest.test.ts` 当前明确断言 106 个页面，新导航项需同步有意增加数量，不能删除唯一性、文件存在、加载映射检查。

文档演示至少包含：普通代码、JSON/YAML/TSX、长行 wrap、行选择、注释、token hover、split/unified diff、patch、冲突处理、接受／拒绝、多文件虚拟列表、stream abort、SSR、编辑与撤销、主题切换、加载失败和禁用 Worker。

### 8.3 现有功能复用的边界

首版将 `ComponentPreview` 接入新组件，形成真实消费证据。`agent-message-trace-inspector.tsx` 目前存在 `<pre>` JSON 区域，可作为后续调用方迁移，但不将改动整个业务 Block 作为本次完成条件。`docs/lib/highlight.ts` 仅在所有调用点已迁移后才删除。

## 9. 验证与完整交付标准

### 9.1 测试分层

| 层次 | 必须验证的内容 | 实现落点 |
| --- | --- | --- |
| 数据／算法 | Patch 解析、CRLF／LF／尾部换行、二进制／重命名元数据行为、行号映射、hunk 接受拒绝、冲突处理 | `tests/code-block/*.test.ts` |
| 引擎状态 | 缓存失效、变更 version、过期 Worker 结果、多 Provider 配置隔离与独立卸载、注释重排、清理、虚拟化上下边界 | Vitest 和专用 harness |
| React | 受控／非受控、StrictMode mount/unmount、ref、主题、复制成功／失败、props 快速变更 | `tests/code-block/*.test.tsx` |
| 编辑 | IME、粘贴多行、emoji／组合字符、撤销重做、查找替换、保留会话、完成 accept/reject | 算法测试＋真实浏览器 |
| SSR | 服务端纯入口依赖图、RSC 属性可序列化、无 HTMLElement/Worker 顶层访问、内容预渲染、hydration、主题／注释一致性 | Node 测试＋Next 页面 |
| 内容边界 | 代码／文件名转义、可信预渲染输入、CSP 受限行为、无隐式联网传输 | 引擎测试＋浏览器场景 |
| 视觉／交互 | 原版预设对照、窄屏、选区、换行、diff 布局切换、注释高度、全屏浮层、键盘快捷键 | 新 Playwright 配置与截图 |
| 安装 | TS 泛型／JSX 转换、文件／文本资源闭包、JS/WASM 高亮路径、别名、类型依赖、重复安装、冲突保护、业务文件不变 | 现有 consumer harness 扩展 |
| 文档 | 中英文内容、静态路由、两个 loader 映射、guide endpoint、llms 索引 | 现有 i18n 测试＋新契约测试 |

算法和状态测试使用 Vitest；Shadow DOM selection、contenteditable、布局和滚动测量由真实浏览器验证，jsdom 不替代这些结果。

### 9.2 真实消费环境

1. Next 15.5.9 + React 19.2，npm 与 pnpm 安装，生产构建与运行。
2. 当前仓库开发路径的 Next Turbopack，验证热更新、Worker URL 和 custom element 幂等。
3. 现有 harness 定义的 Vite + React 19，生产构建和 preview 运行；无需消费者添加 CSS text loader 或额外组件配置。
4. root 与 src 两种既有支持布局，以及 CLI 已支持的别名方式。现有 CLI 会拒绝与固定 installer target 不一致的任意自定义布局，不额外承诺突破该边界。
5. 在干净项目真正 import 并渲染 CodeBlock、CodeDiff、CodeView、CodeStream、编辑和 Worker 示例。消费者只运行 tsc 不算通过。
6. 扩展 harness 或新增运行验证步骤检查 Worker 请求返回、高亮结果、编辑输入和 SSR hydration；现有构建 smoke 不包含这些运行断言。

新增 `tests/code-block-registry-install.test.ts`；扩展 `tests/registry-import-transform.test.mjs`、必要的 `tests/registry-check.test.mjs` 和 CLI 测试。避免创建只检查“字符串里含有组件名字”的重复测试。

### 9.3 性能与视觉基线

在固定浏览器版本、同一字体、同一尺寸、同一硬件和 production build 下建立测量记录。下面是验收方法与建议门槛：

- 数据集：200 行普通代码、10,000 行文件、100,000 行虚拟文件、100 文件 diff、20,000 字符超长行、连续 stream 和带多条注释的底部 viewport。
- cold/warm 分开测量，至少重复 5 次，记录中位数及长任务；记录首次可读、首次高亮、滚动／选区延迟、DOM 数、堆占用和模块字节数。
- 建议回归门槛：同场景中位耗时／峰值占用相对基线不恶化超过 20%；明显噪声和基线本身不可用须说明，绝不能将比例达标当作用户体验必然合格。
- P0 建立对照数据集，P1 结束前将测量环境、每场景指标及预算写入 benchmark 配置并冻结；P4/P6 按配置判定 passed/failed。不能在看到回归后自动扩大 20% 门槛；如测试环境改变，双方重新测量并记录可比性。
- 虚拟模式 DOM 行数应随 viewport／buffer 有界，不随文件总行数线性增长；100,000 行不能退化为全量 DOM。
- 快速切换文件／主题和卸载后不出现旧内容覆盖、增长中的 Worker／observer 数量或未处理异常。
- 未使用组件的页面不加载引擎；只读入口不加载编辑实现；未选语言／主题不全部 eager 导入。用 production chunk／网络记录验证，而不只查看 import 语句。
- 截图先人工核对，排除字体抗锯齿差异；记录行高、gutter、header、分隔条、颜色与选区差异。禁止通过直接重置快照消除未解释的偏差。
- Chromium、Firefox、WebKit 的当前 Playwright 支持版本分别记录；失败项必须修复或明确限制，完整跨浏览器声明前不可留 unchecked。

### 9.4 当前可用的检查与拟新增命令

当前已有，实施后按影响范围运行：

```bash
pnpm --filter @zeron/ui typecheck
pnpm exec tsc --noEmit
pnpm lint
pnpm lint:design
pnpm tokens:check
pnpm registry:build
pnpm registry:check
pnpm cli:check
pnpm cli:test
pnpm test:i18n:unit
pnpm build
```

以下直接复用已有 consumer 环境变量，但需要先补第 8／9 节的真实 examples 和运行断言：

```bash
ZERON_CONSUMER_COMPONENTS=code-block ZERON_VITE_CONSUMER_COMPONENTS=code-block pnpm test:consumer:smoke
```

拟新增后才能使用的命令：

```bash
pnpm code-engine:build
pnpm code-engine:check
pnpm docs:loaders:build
pnpm docs:loaders:check
pnpm exec vitest run tests/code-block tests/code-block-registry-install.test.ts
pnpm exec playwright test --config playwright.code-block.config.ts
```

其中 code-engine:build/check 对应资源生成脚本的写入／只读检查模式，check 同时验证禁用依赖与安装清单；docs:loaders:build/check 分别负责生成和只读比对，仅在新增或找回生成器后接入。修改 manifest 或新增页面后先生成加载映射，再运行文档检查。先测窄范围，最终共享 Registry／CLI／tokens 有改动时再运行对应全量门禁。开始阶段记录已有失败，最终不能把“本任务未新增失败”改写成“全仓检查通过”。

## 10. 顺序实施任务与阶段出口

按单条任务顺序执行，不要求新增并行 agent 或另开用户任务。每阶段维护功能矩阵、变更清单和验证证据，可形成独立提交。

### P0：固定范围和验证基线

任务：记录 Zeron 工作区状态；枚举 core/react/edit/ssr/worker 的公开能力并补齐 F01–F17 映射；核对主题与 sprite；核实文档生成器；准备行为 fixtures；运行现有窄范围检查。

产物：功能／测试映射、行为 fixtures 和当前检查结果。

出口：每项能力有明确的实现模块和计划用例，安装资源范围完整；没有将编辑／stream 隐藏排除。

### P1：打通最小引擎、资源与安装链路

任务：先修复 Registry 按扩展名解析和动态导入转换，并增加失败输入测试；移入最小单文件渲染所需核心及其依赖闭包；本地替换 theming；生成 CSS 和文本形式的 JS/WASM Worker 资源；建立 code-engine/code-block Registry；显式 exports 与服务端边界；在 Next/Vite 干净项目安装并运行高亮样例及 Worker 消息往返。

涉及现有文件：ui package/registry、根 package scripts／lock、Registry import transformer、consumer harness、相关测试。新 core 文件按清单纳入。

出口：没有外部同类组件依赖，缺失任一主题／样式／Worker 文件会让检查失败；真实消费项目运行成功。**这是最早的架构可行性门槛，未通过不继续堆叠 Diff UI。**

### P2：单文件、主题、选区、注释与 SSR

任务：完成 CodeBlock 公共契约、Zeron 和引擎基础外观、内置主题、语言策略、复制、行和 token 事件、插槽、SSR；处理快捷键冲突，验证 code 原文不变。只读模块与编辑入口建立明确边界。

出口：F01/F02/F06/F07 的单文件用例和单文件 SSR 通过；无 Provider 独立使用成立；两种外观的首轮截图验收完成。

### P3：Diff、Patch、冲突与审阅

任务：移植 FileDiff／Patch／UnresolvedFile、分隔条、上下文展开、两侧选择映射、接受拒绝与冲突动作，提供对应 Zeron 组件与测试。

出口：F03–F09 全部通过；对照实际新旧文件内容验证变更结果；换布局／展开后选择、注释和滚动位置不出错。

### P4：多文件、虚拟化、流式和性能

任务：移植 CodeView／Virtualizer、受控列表更新、scrollTo、Provider 内共享／跨 Provider 隔离的 Worker 生命周期、缓存键策略、FileStream 与 React 生命周期适配；完成 diff/patch SSR；测量大文件与资源清理。

出口：F10–F13 全部通过；真实 Worker、100,000 行虚拟文件、stream abort、快速切换和底部注释锚定有证据；不存在把 DOM 全量渲染当虚拟化的替代实现。

### P5：编辑模式及扩展

任务：移植 editor 状态、piece table、输入／选区、undo/redo、查找替换、markers/popovers、预测 provider、编辑会话；适配 CodeBlock／CodeDiff／CodeView，补 IME 和全站快捷键测试。

出口：F14/F15 通过；只读入口不执行编辑运行代码；diff 只编辑新侧；编辑结束／拒绝／卸载／折叠语义有真实测试，不仅演示可输入文本。

### P6：文档接入、完整回归和发布候选

任务：独立文档与中英文内容、agent guide、加载映射、llms、封面；替换 ComponentPreview 内部高亮；完整构建、Registry/CLI/消费者回归；三浏览器验收；补生成资源一致性和依赖检查。

出口：第 11 节所有完成条件满足；制作现有 Registry immutable candidate 供审查。正式网站部署／对外发布根据后续实施指令执行，不由本方案文档自动触发。

### 工作量估算

在复用现有算法和通用依赖、单个熟悉 React/TypeScript 的开发者持续实施条件下，粗估 P0 1–2、P1 3–5、P2 3–5、P3 4–6、P4 4–7、P5 6–10、P6 3–5 人日，合计 **24–40 人日**。这是规划区间，不是已验证工期；P1 后根据 Worker/构建兼容性和测试覆盖情况更新。若同时要求移除 Shadow DOM 或重写全部算法，应重新估算，不纳入该区间。

## 11. 完成定义、风险与后续维护

完整交付需同时满足：

- [ ] F01–F17 均有执行结果，核心行为无 failed/unchecked；明确的业务域外功能不混入完成率。
- [ ] 消费项目依赖和运行时请求不出现外部同类组件包或远程组件服务。
- [ ] CodeBlock 作为独立导航和安装项存在；默认安装可获得所有声明能力的源码、类型与资源。
- [ ] 无 workspace alias、未声明类型包、CSS inline loader 假设、缺失 Worker 文件或服务端 DOM 访问。
- [ ] Zeron 与引擎基础两种视觉模式分别验收，原始代码空白、换行和复制结果一致。
- [ ] 选区、注释、diff、冲突、stream、虚拟化与编辑有实际行为测试。
- [ ] Next/Vite 安装、build 与运行通过；SSR、Worker、hot reload 有针对性验证。
- [ ] 默认只读入口、编辑入口和语言／主题的实际加载范围符合设计。
- [ ] 中英文文档、agent guide、加载映射与 Registry 同步；现有 ComponentPreview 行为完成回归。
- [ ] 已有未提交工作没有被回滚或误记为本任务改动。

主要风险及对应措施：

| 风险 | 对策与失败时处理 |
| --- | --- |
| Worker／CSS 在消费者环境失效 | P1 最先验证；阻断后续完整交付，修复资源方案，不隐瞒降级 |
| Registry 将 TS 泛型错误解析为 JSX | P1 修复按扩展名解析和错误输入门禁，再移入引擎；回归已复现的最小用例 |
| 多 Provider 共享了第一个 Worker 配置 | Provider 隔离池与初始化状态；独立卸载、配置更新和 StrictMode 回归 |
| 拆分编辑入口造成类型／文件闭包缺失 | 首版发完整源码，以入口控制运行加载；用真实消费者 tsc/build 验证 |
| Shadow DOM 与主题／快捷键／浮层冲突 | 明确 mode 继承、composedPath、light DOM slots 和 PortalContainer 归属 |
| 算法缺陷或状态竞争 | 优先建立对应测试；确认问题后单独修复并记录差异 |
| 引擎基础外观与 Zeron 风格冲突 | 两种 preset 分别验收，同字体、同数据、同 viewport 对照 |
| 源码量导致重复 Registry 清单遗漏 | 目录白名单与安装闭包检查联合验证，资源由生成脚本管理 |
| 全仓已有改动／检查失败干扰归因 | P0 保存状态和输出，按具体文件／用例标记；不改写已有结果 |

后续升级先审查相关模块的行为变化，再实施和运行对应 parity/consumer 测试，避免自动覆盖本地改动。公共 API 按 Zeron 契约演进，内部目录调整不让调用方承担迁移；若将来明确需要独立 npm 引擎，再另行设计发布与兼容层。

## 12. 实施与 Review 记录

截至 2026-09-22 已完成：代码引擎源码闭包与本地主题模块、CSS/Worker 生成脚本及只读检查、公开 React/stream/edit/worker/server/core 入口、Zeron 外观和产品工具栏、Registry 两项及干净 Next/Vite npm 与 pnpm 消费构建、单文件／Diff／Patch／冲突／流式／编辑文档场景、双语内容、agent guide、核心解析／接受拒绝／冲突／SSR 测试，以及 production build 和 Chromium 页面验证。

浏览器 Review 发现并修复了严格模式下重复使用已消费 `ReadableStream` 导致流式区域为空的问题；`CodeStream` 现在接受流工厂，在每次挂载时创建独立流。Worker Provider 已改为每个 Provider 独立创建和销毁池，不再通过全局单例共享首次配置。多 Provider 独立卸载已经加入自动化测试。

本轮追加完成了 100,000 行虚拟布局基线、多文件可视区 DOM 上界验证、编辑 IME／搜索替换浏览器用例、Chromium／Firefox／WebKit 交互验证，以及只读和编辑入口的产物依赖图审计。只读入口不包含 editor、piece table、search panel 或 eager 语言模块；编辑入口包含完整编辑运行模块。后续若制作正式发布候选，还需扩展长任务、堆占用、marker／popover／预测提供者异步竞争和开发热更新的专项基准。正式发布不属于本轮自动执行动作。

### 12.1 文档 Review 结果

2026-09-22 对功能完整性、现有集成约束、入口依赖和验收条件进行了复核。以下问题已修订到方案中，实际实现和运行验证仍由对应阶段完成。

| 编号 | 问题与证据 | 方案修订 | 实施阶段 |
| --- | --- | --- | --- |
| R01 / P1 | Registry 将全部文件按 TSX 解析；使用现有 transformRegistryImports 运行普通 TS 泛型箭头函数，实际产出包含 `</>;` 的非法 TS | 按扩展名解析、检查 parseDiagnostics、补 TS/TSX/JS 和动态导入测试 | P1 |
| R02 / P1 | 原方案允许额外 WASM 文件直接进入 Registry，但现有 CLI 安装内容按 UTF-8 文本处理 | 统一采用包含字节数据的 JS 文本模块，裸二进制产物在构建检查时失败 | P1 |
| R03 / P1 | 全局 Worker Pool 单例只采用首次配置，与多 Provider 的独立 factory／生命周期存在冲突 | 同 Provider 共享、不同 Provider 隔离；补重建、独立卸载和 StrictMode 用例 | P1/P4 |
| R04 / P1 | 仅列出 server/edit 子入口不足以确保 SSR 安全和只读包体隔离；RSC 不能传递 render callbacks 或引擎实例 | 明确入口依赖方向、轻量编辑上下文、可序列化服务端输出及产物检查 | P1/P2/P5 |
| R05 / P2 | Diff 输入未说明缺失文件与空文件的区别，编辑启用／缺失 Provider／完成回调默认行为不完整 | 增加单侧 null 约束、编辑属性、factory 缺失处理、默认 reject 与受控结果回写 | P3/P5 |
| R06 / P2 | 资源只在 dev 启动前生成会使后续 CSS／Worker 编辑不生效；文档只列 check 未列生成入口 | 补受控资源 watch、生成器写入范围、docs:loaders:build 和冻结后的性能预算 | P1/P4/P6 |

Review 已复现 R01 的现有工具问题，其余结论来自源码与方案依赖关系检查。当前没有在本文中遗留需要先决定的架构选项；P1 的消费者构建、Worker/WASM 和 SSR 门槛仍是必须执行的验证，不能以文档 Review 代替。
