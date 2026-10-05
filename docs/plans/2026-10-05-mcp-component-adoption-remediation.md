# Zeron 组件库与 MCP 使用质量修复方案

日期：2026-10-05。状态：A、B、C、D1、D2 的本地实现与验证已完成；E 正式发布、F 独立 Agent 开发评测尚未完成。具体改动、证据范围和剩余工作见 [实施记录](./2026-10-05-mcp-component-adoption-implementation.md)。本文保留原验收要求，勾选项仅表示本地完成，不表示线上版本已更新。

目标：让外部 AI 在 Next.js 项目中获得适合当前任务的页面规范、样式边界、组件组合和业务接入规则，在真实业务代码中采用这些上下文，并通过消费者自查和独立 Agent 开发评测验证效果。官方示例正确是基础，不单独代表外部 Agent 会正确使用。

本方案源于对 `/Users/carlos/Downloads/testmcp/admin-demo` 的检查。范围包括任务上下文入口、组件指南、MCP 信息组织、官方示例、消费者自查、仓库内设计检查和 Agent 开发评测；不直接改造该 demo，不重新设计 MCP 架构，不新增后台生成服务。

## 1. 已确认的事实与责任边界

| 发现 | 证据 | 组件库侧需要处理的部分 |
| --- | --- | --- |
| 四个图文按钮将图标作为 children 与文字一起传入，全部出现上下错行 | 浏览器测得图标与文字中心纵向差为 14.5～17.5px；仅在 DOM 中恢复同级位置后降至 0.5px | 保留正确插槽 API，增强最小示例、误用提示和浏览器回归 |
| Sidebar 使用官方组件，但导航使用独立 NavItem，未采用 NavMenu，头尾区域自行拼装 | demo 的 `src/app/page.tsx`；安装了 NavMenu 但未使用 | 提供完整且可采用的标准侧栏组合，解释 standalone 的适用场景 |
| 官方页面骨架已经采用，但 PageContent 等外观被覆盖 | demo 使用 AppShell、PageLayout、PageHeader、PageContent、PageBody；另加背景、边框、阴影、字号 | 明确布局与视觉样式的归属，提供保持默认外观的范例 |
| Button、PageLayout 有详细指南；Sidebar、NavMenu、AppShell 没有 | 本次线上 `get_component` 返回分别为 guided、guided、basic、basic、basic | 补齐最高影响范围的基础组件指南 |
| 官网有 Sidebar 组合示例，MCP 没有提供对应示例 | 网站示例在 `docs/pages/components/sidebar/page.tsx`；目录生成器从独立 `docs/agent-guides` 读取指南 | 建立同源的示例入口与校验，不能假设网页示例会自动进入 MCP |
| 安装后的核心文件未被改写 | 29 个受管理文件与安装记录哈希一致；抽查五个核心组件的来源哈希与本地 Registry 一致 | 暂无理由修改安装器或组件内部 CSS 来修复本次现象 |
| 线上目录为 development，安装接口返回 INSTALLATION_UNVERIFIED | 本次接口响应；既有发布方案也明确规定此行为 | 保留保护逻辑，按既有方案完成正式发布，准确说明当前能力 |

上述线上事实是 2026-10-05 的观测，不证明其他 AI 当时收到完全相同的响应。本次没有取得其调用历史，不能认定它必然没有读取指南、绕过了警告，或没有做过任何测试。

组件库可以减少误用、提高发现问题的概率，但只读 MCP 无法强制任意 Agent 阅读全部文档或执行浏览器验收。完成标准分别覆盖信息可取得、官方组合正确、消费者可自查和 Agent 实际采用；不承诺所有模型都能一次生成合格页面。

## 2. 实施决策

1. 首轮不改变 Button、Sidebar、NavItem 的公共 API，也不让 Button 自动猜测并搬移 children 中的图标。先修文档、组合示例和检查。
2. 沿用现有五个 MCP 工具、`get_component` 的六个 section、catalogVersion 与分页协议。首轮不增加新的响应字段或工具。
3. 关键规范维护在组件指南中；MCP 展示同一份指南。Skill 负责跨组件工作流，不能成为读取 Button 或 Sidebar 正确用法的必需前置条件。
4. 独立 NavItem 是合法能力；自定义业务内容、合法 className 和不同页面布局也可以存在。检查具体错误，不用“出现 div”或“未使用某组件”作为通用失败标准。
5. 本地文档和示例整改可以先交付。正式 release 沿用既有发布方案，不能通过取消 INSTALLATION_UNVERIFIED 来伪造完成。
6. 先交付能被外部 Agent 找到并使用的上下文与检查，再扩展仓库内部的 lint。全量读取所有指南不是合格使用流程，应按任务与组件渐进获取。
7. 区分三类证据：组件/壳层的确定性测试、消费者业务代码的检查结果、Agent 从业务任务到代码的评测。三者不可相互替代。

## 3. 工作包与实施顺序

| 工作包 | 优先级 | 交付物 | 依赖 |
| --- | --- | --- | --- |
| A 基础组件与业务适配指南 | P0 | 六份新增指南、两份增强指南、明确的样式与业务修改边界 | 无 |
| B 任务上下文入口与 MCP 输出 | P0 | 按任务分流的读取入口、关键契约及响应测试 | A 的内容结构 |
| C 可发现的官方组合与消费者验收 | P0 | 可从 MCP 取得的标准壳层、图文按钮用例、几何与交互断言 | A；与 B 可分别实施 |
| D1 消费者自查 | P0 | 对外可取得的检查说明、浏览器脚本与修复指引 | A～C |
| D2 仓库内误用检查 | P1 | 精确识别常见图文按钮错误的 ESLint 规则 | A 的契约 |
| E 发布和真实客户端复验 | 发布必需 | 不可变资源、正式安装命令及客户端验收证据 | A～C、D1；既有发布前置条件 |
| F Agent 开发评测 | P0 验收 | 固定任务下的前后对照、失败分类与最终业务产出 | 改动前冻结基线；候选评测依赖 A～C、D1 |

实施前先冻结 F 的任务、评分标准和旧版本上下文。随后按 A → B → C → D1 完成最小可用闭环，运行 F 候选评测，再决定是否需要补强。D2 可后续独立提交，E 复用现有发布流程推进，并包含 D1 的对外分发。文档可单独上线，但未完成 F 时不能宣称已验证 Agent 的开发质量改善。

## 4. 工作包 A 基础组件与业务适配指南

### 修改位置

新增：

- `docs/agent-guides/components/sidebar.md`
- `docs/agent-guides/components/nav-menu.md`
- `docs/agent-guides/components/nav-item.md`
- `docs/agent-guides/components/app-shell.md`
- `docs/agent-guides/components/sidebar-identity-row.md`
- `docs/agent-guides/components/sidebar-account-menu.md`

增强：

- `docs/agent-guides/components/button.md`
- `docs/agent-guides/components/page-layout.md`

接入：

- `docs/agent-data/guide-routes.json`：登记新增指南与既有 stable ID 的映射。
- `docs/agent-data/components.json`：补齐适用场景、不适用场景和关键 API 提示。
- `docs/agent-data/search-synonyms.json`、`search-evaluation.json`：仅补实际缺失的中英文任务词及检索用例。
- `scripts/generate-agent-guide-loaders.mjs` 与目录生成产物：通过现有命令生成，不手改生成文件。

复用已有组件身份，不为新指南重复创建 item ID。上述文件可能有其他进行中的变更，实施时按当前内容增量合并。

### 每份指南的最小内容

顺序统一为：适用场景 → 关键契约 → 最小正确组合 → 常见错误 → 可定制边界 → 浏览器验收。

| 组件 | 必须明确的内容 |
| --- | --- |
| Button | leadingIcon/trailingIcon 接受组件类型；children 是标签；iconOnly 的 child 规则；loading；asChild；size 负责几何；不要用外层 gap 修复错误嵌套 |
| Sidebar | Provider 与 Sidebar 关系；展开/折叠/抽屉；breakpointBehavior；Header/Content/Footer；className 与 contentClassName 分别作用于哪一层；内外间距避免重复 |
| NavMenu | 与 NavItem 的组合；activeValue；keyboardNavigation；导航可访问名称；组选中/悬停反馈由谁提供 |
| NavItem | standalone 是合法模式但效果不同；Next Link 的 render 适配；本地切换用 button；不使用没有 href 的 a 冒充可操作导航 |
| AppShell | Sidebar/Header/Main 必需的直接 DOM 子级；宽度联动；一个 main；明确有界应用和文档滚动两种高度策略 |
| SidebarIdentityRow | 头像、主/次文本和尾部内容；长文本与折叠状态；展示行和按钮模式的区别 |
| SidebarAccountMenu | 账户数据、菜单项与回调接入；键盘与焦点；折叠后仍能访问账户操作 |
| PageLayout | 默认 surface、标题和边框归属；PageBody 滚动；标题描述组合；业务布局可自定义，但不要重复添加已有的页面外框 |

Button 指南开头必须出现能直接复制的图文示例，图标通过现有 icon provider 获得，并置于合法 React 组件中；启用 `typecheck_examples: true`。仅在解释文字中提到 leadingIcon 不够。

```tsx
// AddIcon 是已确认兼容当前 IconComponent 类型的图标组件。
<Button leadingIcon={AddIcon}>创建资源</Button>

// 错误用法，用于反例说明，不进入通过型示例集合。
<Button><AddIcon />创建资源</Button>
```

附上实际渲染结构的简短说明：Button 的 children 会成为 button-label 的内容，图标槽与标签才是内部 flex 行的同级节点。保留非标准自定义内容的例外，不把任意富文本 children 一律判错。

实际指南中，正确示例使用完整、可检查的 tsx 代码块；反例使用 text 代码块并标注错误原因，或放入专门的失败 fixture，避免被现有指南示例检查器当作通过型代码编译。

### 页面组合的业务适配边界

在 AppShell、Sidebar、PageLayout 指南中给出与该组合有关的适配表，并引用同版本 `.agents/skills/zeron-page-builder/references/project-adaptation.md` 的共用原则。不要复制多套会独立漂移的规范，也不能只留一个链接而不说明当前组合的修改位置。

| 业务需求 | 允许修改的位置 | 应保留的组件职责 |
| --- | --- | --- |
| 菜单名称、路由、权限 | 项目菜单数据、路由适配、权限条件与回调 | NavMenu/NavItem 的交互、焦点和选中反馈 |
| 列字段、筛选、排序、接口数据 | 页面查询状态、列配置和数据适配器 | 已选表格/输入控件的公开结构与状态 |
| 加载、错误、空数据、无权限 | 公开状态属性与相应内容插槽 | 控件 loading/disabled/focus 的行为和外观 |
| 品牌色、字体、图标体系 | 文档支持的统一主题或 provider 入口 | 语义 token 关系、暗色和交互状态配对 |
| 业务区域排列、列宽、可视化 | 页面公开布局参数及项目业务区域 | 页面外框、内容 surface 和滚动归属 |
| 控件高度、内部间距、圆角、阴影 | 优先使用 size/variant 等已存在 API | 不在调用处复制另一套控件外观 |

明确文件所有权：受管理的基础组件和共享系统文件保持安装版本；项目页面、数据/路由适配器、业务组合由项目维护；模板文件只在其已声明可编辑的范围内改造。没有合适的公开能力时，记录尝试过的 API 和缺口，再选择最小业务组合或库侧扩展，不能通过内部选择器和全局 CSS 绕过。

增加一个“资源列表适配订单列表”的业务说明，标出订单字段、服务端筛选参数、权限动作和请求失败的接入位置；默认壳层与视觉契约保持不变。可沿用既有列表示例结构，不新增公开业务范例 ID。实际适配结果由 F 的独立任务验证，不能只把文案替换当作业务接入成功。

### 完成标准

- 八个目标组件均可通过同一个 catalogVersion 获得适用指南。
- 新指南经类型检查后才将可运行片段声明为有效示例；没有浏览器证据时覆盖程度最多为 guided。
- Sidebar 指南包含完整最小组合及其依赖项，没有未定义变量或以省略号代替必要结构。
- 页面导航和本地状态切换分别有正确语义示例。
- 搜索“Next 后台侧栏”“应用外壳”“按钮图标文字”能发现相应组件或适用范例，不硬编码唯一业务 Block 为必选。
- 从页面组合指南能明确判断业务数据、路由、状态、主题和控件内部样式分别由谁修改；说明中引用的公开能力必须在对应安装版本存在。

## 5. 工作包 B 任务上下文入口与 MCP 输出

### 修改位置

- `lib/agent-catalog/query.ts`
- `lib/mcp/handler.ts`
- `docs/agent-data/components.json`
- `tests/agent-catalog.test.ts`
- `tests/mcp-route.test.ts`
- `tests/agent-catalog-generation.test.mjs`
- `.agents/skills/zeron-page-builder/references/agent-discovery.md`：接入任务上下文读取流程。
- 新增 `.agents/skills/zeron-page-builder/references/task-context.md`：短入口，复用现有 selection-guide、composition-contracts、project-adaptation、verification 等参考。
- `.agents/skills/zeron-page-builder/assets/text-references.json`：登记新入口及 D1 对外参考，按现有 Skill 分发流程生成产物。

### B1 按业务任务组织上下文

`task-context.md` 只维护任务分流、少量共用规则和精确引用，不重写整套 Skill。中文入口正文目标不超过 1200 字，详细 API 留在组件指南。该长度是内容预算，不以静默截断实现。

| 当前任务 | 开始编码前需要确认 | 读取范围 |
| --- | --- | --- |
| 空项目创建完整后台 | 框架、别名、主题/provider、主要页面类型 | 任务入口、选型/布局规则、选中壳层与组件详情 |
| 已有应用新增页面 | 已有导航和高度/滚动归属，页面接入点 | 任务入口、相关页面组合及组件；不重复新建外壳 |
| 修改少量控件 | 实际安装类型、现有调用和主题 | 相关组件 usage/api；无需强制读取全部页面规范 |
| 接入接口或权限 | 状态所有权、回调、数据形状和失败处理 | 对应组合、project-adaptation 相关内容 |
| 更换主题或迁移样式 | 任务是否授权改变宿主，受管理文件范围 | 主题/迁移参考及实际受影响组件 |

页面任务的默认顺序为：确认宿主 → 选择任务结构 → 确认样式和业务修改边界 → 读取选中组件 → 接入业务 → 在实际页面自查。Agent 只需在工作记录中保留简短的布局选择、编辑边界和验证项，无需为每个小改动创建额外计划文件。

具体入口必须出现在可见响应中：搜索/列表结果的文本说明提示页面任务读取 task-context；AppShell、Sidebar、PageLayout 的 overview/usage 给出相同入口和本组件的必要规则；get_skill 返回的可用参考列表包含该文件。API-only 的局部组件查询仍保持定向读取。

入口由生成器按当前快照输出可执行的 `get_skill` 参数，保留 catalogVersion 和准确 reference；section 仅使用响应中实际列出的名称。不要求消费者安装 Skill 才能读规范，也不要求 Agent 猜文件路径。无 MCP 时，在同版本静态入口提供等价的规范与链接。

### B2 组件响应要求


1. 保留 overview/usage/api/examples/installation/sources 及现有默认顺序。A 中的关键契约置于 usage 前部，默认首次响应就能读到 Button 的图标规则和 Sidebar 的标准组合入口。
2. `api` 的 keyApi 从“仅列 prop 名”增强为简短语义说明，例如“leadingIcon: compatible IconComponent，传组件类型而非 JSX 元素”。使用现有字符串数组，不新增 Props 推导系统。
3. 在工具描述和服务器 instructions 中简明说明：实现前读取候选 usage/api/examples；按真实安装版本使用公开插槽；本地运行后验证布局与交互；发现 basic 覆盖时继续读源码/文档，不把导出名当完整用法。
4. 保持 section 定向读取：只请求 api 时不偷偷追加整份 usage。关键 API 的误用提示应在 api 本身足够明确。
5. `examples` 对 guided 项准确指向 usage 内的具体示例小节；仅有 snippets 时继续声明未获得独立消费者运行证明。新增浏览器证据前不改成 example-verified。
6. text content 与 structuredContent 必须包含一致的关键用法与版本信息，不能只给支持 structuredContent 的客户端正确指导。
7. 不改变 existing cursor 的版本和参数绑定、不吞掉字节预算错误、不静默截断。较长文档仍使用现有 continuation。
8. 任务入口只指向当前任务所需的少量参考，不把全部 Skill 注入每次搜索结果。分别记录默认响应大小、完整任务读取量和调用次数，在 F 中观察是否增加了无效读取。

### 验收用例

- 默认 get_component(button) 的首个响应包含 leadingIcon 的正确用法与 children 的含义。
- 定向 get_component(button, sections=[api]) 说明图标组件类型与元素的差别。
- get_component(sidebar) 不再返回“没有维护指南”，并说明 NavMenu、头尾组合及外层/内容层间距。
- 基础未维护组件仍如实返回 basic，不因本次优化而全量宣称 guided。
- 同版本的 MCP 与静态 Markdown 传递相同规则；旧 catalogVersion 的快照不被新指南原地替换。
- 覆盖文本回退、分页继续读取及原有响应大小限制。
- 一个没有预装 Zeron Skill 的客户端从业务描述搜索开始，可以沿响应给出的精确入口取得页面级规范；新建后台与已有宿主加页明确走不同分支。
- 组件的最小必要契约在本组件响应中自足，不能因增加共用入口而删除图标插槽、surface 或直接子级要求。

## 6. 工作包 C 可发现的官方组合与消费者浏览器验收

### C1 复用现有示例宿主

改造 `tests/fixtures/agent-examples/app.tsx`，使用真实 AppShell、Sidebar、NavMenu、NavItem 和头尾组件承载现有资源列表、详情与设置页；继续保留现有数据服务、查询上下文、返回行为与焦点管理。

不新增第四套业务 demo、不增加业务页面枚举、不重做现有异步状态测试。提取共享壳层仅在网站与 fixture 实际需要复用时进行，避免为了本次整改引入通用后台框架。

预期结构：

```text
SidebarProvider
└─ AppShell（有界高度）
   ├─ AppShellSidebar
   │  └─ Sidebar
   │     ├─ SidebarHeader → SidebarIdentityRow
   │     ├─ SidebarContent → SidebarGroup → NavMenu → NavItem
   │     └─ SidebarFooter → SidebarAccountMenu
   ├─ AppShellHeader → SidebarTrigger / 合法公共操作
   └─ AppShellMain → 现有业务页面
      └─ PageLayout 或适用的详情布局
```

这是新建后台的参考结构，不要求已有宿主或其他页面类型无条件照搬。不要在已经包含布局的页面外再包第二个 PageLayout，也不要新增第二个 main。

接入文件：

- `tests/fixtures/agent-examples/app.tsx`、`README.md` 及确实需要的共享文件。
- `docs/agent-data/examples.json`：同步来源清单与实际采用项。
- `scripts/agent-example-sources.mjs`、`scripts/agent-examples.mjs`：检查新增宿主 import 是否进入安装闭包和别名适配，按需修改。
- `scripts/agent-example-browser.mjs`：适配导航定位器并增加壳层检查，保留原业务断言。
- `tests/agent-examples-pages.test.tsx`、`tests/agent-example-sources.test.mjs`：维护宿主和安装闭包回归。

来源清单、宿主依赖与实际运行内容必须一致。仅修改截图或 adoptedItems 标签不能视为采用了组件。

### C1.1 将宿主组合实际提供给 MCP 使用者

现有 `scripts/agent-example-sources.mjs` 分别计算 hostEntry 的依赖闭包和各业务 example.entry 的依赖闭包；`lib/agent-catalog/schema.ts` 的 `exampleLinksForItem` 只根据业务 entry.adoptedItems 关联示例。因此只修改 app.tsx，不会自动让 Sidebar/AppShell 详情出现该壳层示例；把宿主组件硬填到页面 adoptedItems 还会违反真实依赖校验。

首轮采用以下实现，保留现有公开工具 schema 和三个业务 example ID：

1. 发布包继续归档现有 hostEntry、完整 hostSources、说明文件与 source-manifest。宿主所用组件从真实 hostAdoptedItems 取得，不手工复制一套组件清单。
2. 在目录生成/发布时，从已验证的归档清单为宿主所用组件生成“完整应用壳层”说明文本，追加到对应详情的 examples section，并同步输出到静态 Markdown。链接包括固定版本宿主源码入口、依赖文件索引和运行说明；需要提供视觉参考时链接相同版本、相同状态的截图证据。
3. 复用现有 `examples.sources`、归档 source-manifest 和说明资源解析固定链接，必要时生成附加指南文本；不伪装成某个业务页面的 adoptedItems 或新的 exampleLinkSchema 条目。
4. 文本标明宿主与业务页面的验证范围。仅有可运行宿主源码不自动提升组件为 example-verified；首轮宿主项保持 guided，宿主浏览器证据单独列出。若以后扩展覆盖度模型，另做兼容设计。
5. development 下提供 usage 内完整最小组合和可用的开发文档入口，注明非不可变发布证明；release 必须提供可实际下载的固定版本来源，不能只返回仓库相对路径。

相关修改位置除 C1 外还包括 `scripts/agent-catalog-examples.mjs`、`scripts/agent-catalog-release.mjs`、`scripts/build-agent-catalog.mjs`、`lib/agent-catalog/query.ts`；按现有归档校验复用来源，生成文本不能跳过哈希/版本绑定。增加 `tests/agent-catalog-examples.test.mjs` 和 MCP 响应回归。

验收从外部视角进行：只给客户端 Sidebar 或 AppShell 的响应，它能沿链接取到包含 NavMenu、头尾组件、业务内容插槽的完整壳层，在独立 Next 消费者中运行。旧业务页面的 adoptedItems 与覆盖度仍准确，没有新增导入循环或虚假采用项。

### C2 补图文按钮的浏览器几何回归

扩展 `scripts/lib/consumer-style-verification.mjs` 的现有消费者样式检查。现有检查包含纯文字按钮、主题与弹层，但不足以发现本次图文错误。

新增正确用法：leadingIcon、trailingIcon、iconOnly、loading，以及项目支持的 asChild 图文链接。覆盖 sm/md，主要/次要变体，中文和较长英文标签。先保证这些组合，再按失败证据扩展矩阵。

断言在真实浏览器中执行：

- 图标与单行标签中心的纵向差不超过 2 CSS px。
- 图标与文字不重叠，间距符合当前 control-size recipe。
- 内容位于按钮可用边界内；正常、hover、focus、disabled、loading 状态无异常裁切。
- loading 前后宽度变化不超过 1 CSS px，且不能重复触发操作。
- iconOnly 有可访问名称，键盘焦点可见。

保留一份隔离的错误组合 fixture，证明检测器确实能发现“图标作为标签 children”的错行。错误用例不展示为官方推荐示例，也不要求组件兼容该误用；测试本身以成功识别故障为通过条件。

### C3 壳层与响应式验收

| 场景 | 自动验收内容 |
| --- | --- |
| 1440×1000 桌面 | 一个 main；Sidebar/Main 不重叠；按钮对齐；PageContent 保持自身 surface 层级 |
| 手动折叠 | 图标处于侧栏可用范围并对齐；标签按契约隐藏；账户菜单、展开按钮可操作 |
| 1279/1280px 边界 | 根据当前 SIDEBAR_MOBILE_QUERY 验证 drawer/collapse 行为；变更断点时同步测试 |
| 390×844 手机 | 无页面级水平溢出；动作整组换行；过滤文案不会逐字挤成竖排；表格局部横向滚动可用 |
| 较短桌面视口 | 内容超过高度后由约定容器滚动，导航与主要操作仍可到达 |
| 键盘 | Tab、Enter、方向键按选定导航模式工作；抽屉关闭恢复焦点；导航切换保留既有业务返回上下文 |

默认先在 Next + pnpm 的隔离消费者中运行以快速定位问题。正式范例声明仍包含 Next/Vite × npm/pnpm 四种 profile，宿主变更后发布前必须完成声明矩阵，不能用单一 Next 结果覆盖其他 profile。

保存截图与几何数值作为证据；截图用于审查，不以跨平台逐像素一致作为唯一通过条件。未运行的状态明确记为未检查。

## 7. 工作包 D 消费者自查与仓库内误用检查

### D1 对外可执行的自查路径 P0

新增 `.agents/skills/zeron-page-builder/references/consumer-verification.md`，并提供配套 `.agents/skills/zeron-page-builder/scripts/check-rendered-controls.mjs`。二者均为待实现文件。说明通过 get_skill 和同版本静态资源可取得；脚本通过现有 Skill 包或经过哈希校验的固定资源下载，不能把 MCP 返回文本当作已安装的可执行文件。

配套脚本聚焦浏览器中可测量的通用问题，复用 C2/C3 的几何判定逻辑；不要直接要求外部项目运行依赖整个 Zeron 源码仓库的脚本。实施时声明 Node、浏览器自动化依赖的实际版本、安装方式及调用参数，并在无 workspace 链接的 Next 消费者验证。本文不将待实现脚本写成已可执行的命令。

输入至少包含消费者页面 URL、检查范围和视口；按真实 DOM 的 data-slot 识别适用控件。支持只读的正常态测量。会改变业务状态的点击、提交或加载态操作，由项目明确提供安全的测试路径和状态准备步骤，不自动点击所有按钮。

输出约定：每项包含检查名、控件可访问名称/DOM 定位、实际测量、预期契约、passed/failed/unchecked/not-applicable、修复建议。DOM 检查不能可靠得到源码行号时不编造；提示 Agent 通过控件名称回查业务调用处。缺少浏览器、隐藏状态未打开、定位不到适用控件时不能返回“全部通过”。

| 观测问题 | 提示的排查顺序 |
| --- | --- |
| 按钮图标和标签不在同一行 | 检查 children 与图标槽 → 旧调用包装器 → 已生成样式 → 外部宽度约束 |
| 折叠侧栏图标偏移或裁切 | 检查 contentClassName 与外层 padding → 组合所用公开布局 → 图标尺寸覆盖 |
| 内容表面与背景失去层次 | 对照当前组件默认 surface 与调用处覆盖；主题定制需结合项目意图判断 |
| 导航无法键盘操作 | 检查链接 href 或 button 语义 → NavMenu 模式 → disabled 与焦点路径 |
| 页面横向溢出 | 确认溢出所有者 → 操作组换行 → 表格局部横向滚动；不以缩小全部文字掩盖 |

自查流程必须落到消费者业务页：运行实际构建 → 打开受影响路由与状态 → 运行几何检查 → 检查业务结果与键盘行为 → 修复调用处 → 重跑失败项。脚本不能判断全部语义样式正确性，主题、权限和真实 API 行为另作明确检查。

在 B 的任务入口和组件验收部分提供此路径。完成标准是在干净消费者中，Agent 不取得组件库工作区、不安装私有 lint 包，也能执行检查，发现本次错行反例，并取得指向插槽用法的修复提示。

### D2 仓库内静态误用检查 P1

在现有 `packages/lint` 中新增一条局部 ESLint 规则，建议名称为 `zeron/button-icon-slot`，接入 `createZeronConfig`。新增规则文件放在 `packages/lint/rules/`；这是待实现文件，不是当前已有命令或能力。

首轮只处理可以确定的图文按钮误用：

- 能解析到 Zeron Button 的直接导入或重命名导入。
- 非 iconOnly，包含可识别图标节点及非空文字/文字包装节点。
- 诊断指出调用位置，建议使用 leadingIcon/trailingIcon；不自动修改文件。

图标来源限于已知图标导入、原生 svg 和可以静态确认的 useIcon 返回值。无法解析的包装器、动态 spread 和任意 ReactNode 不强行推断；相关组合继续交给浏览器验收。

必须有以下回归：正确插槽、iconOnly、纯文字、合法富文本、重命名导入、同名非 Zeron Button、无法判断的自定义 children，以及一个明确错误的图文组合。asChild 仅在能确定单个链接的子结构时诊断，不能将所有链接内容判错。

修改 `tests/design-lint.test.mjs`，补充 `packages/lint/README.md`。文档明确：该包目前是私有工作区包，外部项目不会因使用 MCP 或安装 Button 自动获得此规则。此规则用于仓库和官方示例防回归；外部项目本轮通过 D1 自查，不依赖私有 lint。公开 ESLint 包或 CLI 集成不属于本轮交付。

不增加“Sidebar 必须包含 NavMenu”“所有背景 className 禁止”等粗粒度规则。这些条件存在合法例外，首轮由示例及浏览器检查保证。

## 8. 工作包 E 发布与真实客户端复验

沿用 [Zeron AI 接入与 MCP 实施方案](./2026-10-03-agent-access-and-mcp-plan.md) 的正式资源发布顺序和前置条件。本方案不重新定义批准、资源冻结或生产推广机制。

关键要求：

1. 在 development 模式准确展示“可查询文档，安装组合尚未验证”。`installable: true` 说明存在 Registry 项，不能解释为当前安装命令已经通过消费者验证。
2. 按既有方案完成 CLI、不可变 Registry、Skill、Catalog 和示例证据的版本绑定，再切换正式 release。
3. 固定同一 catalogVersion，依次执行搜索、组件详情、安装命令获取、隔离项目 dry-run、安装、构建和浏览器检查。
4. 分别保留 npm/pnpm 与框架 profile 的实际证据。工作区本地 Registry 测试不能替代正式公开 URL 测试。
5. 至少在一个实际 MCP 客户端记录工具参数、返回版本、所读指南、安装命令与最终页面。敏感信息不进入公开证据。
6. 发布后复验 Button/Sidebar/AppShell 的文本响应、静态入口、示例链接和安装命令；旧快照仍可读取。
7. 同版本发布 B 的任务入口、C1.1 的宿主资源和 D1 的自查资源。对外链接必须在无仓库访问权限的环境中验证，不能只在源码目录运行。

如果正式发布输入尚未具备，A～D 可以完成并部署文档改进，F 可以使用明确标注的本地固定资源做候选评测，但不能因此宣称正式安装组合或端到端公开路径已验收。不得返回浮动 latest 命令作为错误兜底。

## 9. 工作包 F Agent 实际业务开发评测

目标是验证 Agent 能否使用修改后的上下文完成新业务，而不是再次证明维护者编写的官方 fixture 正确。该评测与 `pnpm agents:evaluate` 的搜索召回评测不同，必须分别报告。

### F1 冻结任务、环境与旧版本基线

实施 A～D 前保存旧版 MCP/Catalog/Skill 的可重放快照与资源哈希，并在仓库外的隔离项目中运行基线。无法取得旧版完整环境时，标记为“仅候选评测”，不能事后推测旧版成绩。

新增评测定义建议放在 `tests/fixtures/agent-adoption/`，包含业务任务、初始项目或可复现清单、测试 API、评审规则；这不是新增公开业务 example ID。运行结果进入独立输出目录，不把模型生成代码自动纳入推荐范例。

| 任务 | 提供给 Agent 的业务要求 | 评审关注点 |
| --- | --- | --- |
| 新建后台 | 空 Next 项目中构建带分组导航、数据列表和账户操作的后台 | 是否发现规范和组合、完成可操作导航、保留默认视觉体系 |
| 已有应用加页 | 在已有导航与主题下增加订单列表，提供分页/筛选接口及角色权限 | 不重复建壳；正确适配业务字段、请求状态和权限操作 |
| 增加业务动作 | 在现有详情页增加异步操作，提供成功、失败和不可操作状态 | 图文与 loading 契约、阻止重复请求、正确错误反馈 |
| 响应式变更 | 增加较长中文标签并支持手机操作 | 整组动作换行、侧栏可达、滚动归属、无裁切和页面溢出 |

提示词只给业务目标、使用 Zeron 的要求及可用工具，不给正确组件名单、插槽答案、修复步骤或隐藏评审结果。允许 Agent 读取安装到消费者中的源码；禁止通过组件库工作区、候选修复计划或前一次运行历史取得额外答案。每次使用新会话与还原后的初始项目。

固定模型版本、推理设置、客户端工具能力、依赖版本、初始项目哈希、执行时间与 token 预算；旧版和候选版使用同样配置。优先固定相同组件安装资源，仅改变上下文与自查资源，以区分指导改进和组件代码变化；若同时更新组件版本，单独报告混合变量，不归因于文档。E 的真实公开安装路径另行复验。

### F2 记录与判定

最小对照为一个明确版本的 Agent，四个任务各执行三次，旧版与候选版共 24 次；这是诊断样本，不作为统计显著性或跨模型保证。额外模型单独报告，不合并为一个成功率。

每次记录首次交付与预算内自查修复后的最终结果，保留：任务输入、实际工具调用、所读版本与指南、读取量/调用次数、耗时、业务 diff、构建结果、截图、几何和交互断言。人工介入、工具故障、超预算必须单列，不能排除失败后只挑成功结果。

统一评审四个维度：

1. 上下文采用：是否自行找到相关规范、标准组合和实际安装 API；按内容与结果判断，不强制唯一调用顺序。
2. 结构与样式：公开图标槽、现有宿主保留、正确 surface/滚动归属、合理主题定制、无无依据的内部覆盖或重复原语。
3. 业务完整性：数据与回调接入、权限、错误/空/加载状态及原有行为保持，不能只有看似可点击的空操作。
4. 自查闭环：对自己的业务页执行适用检查，能根据结果修复；未检查项如实说明。

评审使用业务断言、浏览器检查和源码审查共同完成；不以组件数量、命中某个关键词或单张截图决定成功。任务的适用断言在运行前固定，必需项未检查不能计为通过，不因候选失败而事后改成不适用。失败按“未发现上下文、未读取、理解错误、适配错误、检查缺失、工具/环境故障”分类，以决定应修入口、指南、公开 API 还是验证路径。

候选版工程验收标准：A～C、D1 的确定性检查先通过；候选 12 次运行中每个任务至少 2 次独立完成适用的结构/样式与业务断言；与基线相比完整任务成功数不下降，本次按钮错行/重复壳层等目标失败次数在基线非零时应减少，基线为零时不得新增。未达标则根据失败类型修订并保留之前全部记录，不通过追加运行后挑选样本达标。

如果基线已经全部通过，只能报告保持通过及成本变化，不能声称质量提升；没有基线时只能报告候选通过情况。候选验收不代替 E 的发布验收。

## 10. 开发验证命令

以下均是仓库已有入口。按实际修改范围执行；这些命令在编写本文时没有重新运行。包含生成操作，应在实施分支执行并审查产物差异。

```sh
# A：指南生成和类型检查
pnpm agents:guides:build
pnpm agents:guides:examples:check
pnpm agents:build
pnpm agents:guides:check
pnpm agents:check

# A/B：目录、指南路由及 MCP 契约
pnpm exec vitest run --config vitest.config.mts tests/agent-guide-routes.test.mjs tests/agent-catalog-generation.test.mjs tests/agent-catalog.test.ts tests/mcp-route.test.ts
pnpm agents:evaluate

# C：现有消费者样式入口，新增几何检查应挂到此路径
pnpm test:consumer:styles

# C/D：示例与设计检查
pnpm exec vitest run --config vitest.config.mts tests/agent-examples-pages.test.tsx tests/agent-example-sources.test.mjs tests/design-lint.test.mjs
pnpm lint:design
```

如 canonical 组件、Registry 声明或依赖发生变化，先执行 `pnpm registry:build` 和 `pnpm registry:check`；不能把更新后的目录与旧 Registry 混合测试。纯指南修改不要求改组件源码。

本地查看改造后的 Next 示例，使用一个尚不存在的输出目录：

```sh
pnpm agents:examples --framework next --package-manager pnpm --output /tmp/zeron-mcp-adoption-next --serve
```

这只生成并启动本地示例，不等于已经执行 C3 全部断言。C3 必须接入现有浏览器 runner；若实现独立本地执行入口，须在同一变更中补 npm script 和 README，不能让验收依赖未记录的人工脚本。

`pnpm test:consumer:published` 与 `pnpm test:examples:published` 是已有正式验证入口，但需要真实发布输入。调用参数和前置条件沿用既有发布方案，本文不伪造可直接执行的发布命令。

D1 的资源分发和 F 的任务执行目前没有现成一键入口。实施变更必须同时提供经实际运行确认的 README/调用方式；F 可以由已有 Agent 客户端逐次运行并统一收集记录，不要求本轮新增模型调度服务。不得把搜索评测通过或启动了本地页面写成 Agent 开发评测完成。

## 11. 提交边界与完成清单

先提交 F 的任务定义与基线记录，再按 A、B、C、D1 拆分实现；D2 独立提交，F 的候选结果和 E 的正式发布分别记录。每个提交说明具体问题、最终行为和已运行的检查；不要把其他进行中的 Block/AI 页面修改混入。

- [x] A：六份新增指南与两份增强指南接入目录，业务/样式适配边界明确，示例类型检查通过。
- [x] B：本地文本客户端测试可在无预装 Skill 时按任务取得必要上下文；保留定向读取、分页和版本约束。公开客户端路径留给 E 验证。
- [x] C：官方宿主采用标准组件组合，保留原业务行为，按钮和侧栏浏览器检查通过。
- [x] C：本地 Sidebar/AppShell 的 MCP 响应提供完整宿主源码、依赖索引和运行说明；固定资源打包与重建测试通过，公开可达性留给 E 验证；宿主与页面采用项及验证范围未混淆。
- [x] C：隔离消费者安装与编译通过，不依赖仓库 workspace 链接来隐藏缺失依赖。
- [x] D1：消费者检查脚本可独立运行；实际安装 CSS 的错行反例被检测，并取得公共插槽修复提示。外部独立项目运行证据与反例几何证据分别保存。
- [x] D2：常见图文误用被精确报告，合法自定义组合不被一律拒绝；P1 本地完成。
- [ ] F：独立业务任务评测完成，首次/最终结果、基线对照、失败类别和读取成本均已记录；未完成不得宣称 Agent 采用质量已验证。
- [ ] E：正式安装命令绑定实际已验证版本与不可变资源，真实客户端完整路径复验通过。

最终交付记录至少包含：源码提交、catalogVersion、CLI/Registry/Skill 身份、指南覆盖状态、消费者 profile、浏览器尺寸与状态、通过/失败/未检查项、截图和测量结果，以及 F 的模型/客户端配置、任务版本、全部运行记录和对照结果。

状态分别报告“文档与工具可用”“官方组合通过”“消费者自查可用”“Agent 候选评测通过”“正式发布通过”。前一项通过不能代替后一项；质量改善的结论只适用于已报告的模型、任务与环境。
