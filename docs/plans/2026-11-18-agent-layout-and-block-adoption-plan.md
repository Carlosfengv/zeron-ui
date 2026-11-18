# Zeron UI — Agent 布局框架与 Block/Page 优先范式强化执行方案（v2 终版 · 供 Codex 执行）

> **目标**：系统性解决 AI Agent 在真实业务开发与存量迁移中“只使用原子组件（`Button`、`Input`、`Card`）+ 手搓 `div` 拼页面，忽略 `AppShell`/`PageLayout` 布局契约及轻易放弃 `block:*`”的问题，实现 **源码仓 + 外部业务消费者项目（Consumer Project）双端无死角闭环**。
>
> **范围与兼容性红线**：
> 1. 严格限定在本方案列出的文件与对应的生成产物内，不触碰工作区中其他正在进行的并行功能改动。
> 2. 保持 MCP 5 个现有只读工具的输入/输出 JSON Schema（`lib/agent-catalog/contracts.ts`）、分页游标绑定逻辑（`cursor`）、预算上限（`search/list <= 32 KiB`，其余 `<= 64 KiB`）100% 向后兼容。
> 3. 所有改动必须通过构建幂等校核、双语检索评测、Design Lint、单测与真实 Chromium 便携脚本验收。

---

## 一、 核心设计：四层立体防御闭环

| 闭环层级 | 解决的痛点与盲区 | 落地位置 |
| :--- | :--- | :--- |
| **1. Skill 认知主入口层** | 主 `SKILL.md` 过去只有二级文档跳转，少读一篇就会退化为手搓 `div` 页头；或因示例字段名叫“MCP/集群”而误杀匹配的 `template` Block；或误给 `PageTitle` 加 `className` 破坏默认紧凑字号。 | `.agents/skills/zeron-page-builder/SKILL.md`<br>`.agents/skills/zeron-page-builder/references/task-context.md`<br>`.agents/skills/swap-to-zeronui/SKILL.md` |
| **2. MCP 导流与关联推荐层** | 搜索混合返回时原子组件淹没 Block；甚至当搜索未排进前 10、Agent 直接去读 `get_component("data-table")` 时，看不到官方有哪些关联 Block。 | `lib/mcp/handler.ts`<br>`lib/agent-catalog/query.ts`（动态解析注入关联 `block:*` ID）<br>`docs/agent-data/search-synonyms.json` |
| **3. 源码仓静态 AST 门禁层** | `@zeron/lint` 仅管控件尺寸与颜色，不管 `PageHeaderContent` 内文本未分组、`Card` 包裹 `DataTable`、或中间 `div` 隔断 `AppShell`/`PageLayout`/`PageContentHeader`/`PageColumns` 直接子槽位（包括 `{cond && <Slot/>}` 和命名空间导入）。 | `packages/lint/page-layout-contracts.mjs`（新增）<br>`packages/lint/index.mjs`<br>`packages/lint/README.md` |
| **4. 外部消费者便携验收层** | `@zeron/lint` 是私有 workspace 包，外部业务项目（Next/Vite Consumer）装不了！且手搓裸 `div` 页面压根不 import `PageLayout`，常规组件规则无法触发。 | `.agents/skills/zeron-page-builder/scripts/check-rendered-controls.mjs`（零依赖真实 DOM `data-slot` 布局检查）<br>`.agents/skills/zeron-page-builder/scripts/usage-report.mjs`（路由级 `PageLayout`/Block 缺失检测）<br>`.agents/skills/zeron-page-builder/references/consumer-verification.md` |

---

## 二、 分步修改规范（Implementation Spec）

### 工作包 WP1：重构双 Skill 主入口、黄金布局骨架与反模式红线

#### 1.1 修改 `.agents/skills/zeron-page-builder/SKILL.md`
1. **在 `## Model and select` 开头增加强制 4 行前置架构声明（Architecture Declaration）**：
   编写任何页面或视图 JSX 前必须先明确：
   - `Host Shell`：复用现有 `AppShell` / 新建 `Sidebar` 或 `TopNav` `AppShell` / 独立认证或嵌入式无壳区域。
   - `Page Archetype`：资源列表 / 资源详情 / 运营概览看板 / 设置与表单 / 主从分栏 / Agent 工作台。
   - `Candidate Block`：列举评估过的 `block:*` 候选；若拒绝采用，必须说明结构或交互模型不兼容的具体原因——**严禁仅因示例业务名词或演示字段名（如 MCP、机房）不同而拒绝适配**。
   - `Layout & Scroll Owner`：如 `PageLayout > PageHeader + PageContent > PageBody (vertical scroll)`。
2. **明确 `data-block` 与 `template` 的双轨业务适配授权**：
   - `data-block`：通过受控数据与回调 Props 编写业务 Adapter 接入，保留受管源码不变。
   - `template`：允许直接编辑其业务侧模板文件以替换业务列、字段、枚举和接口，同时完整保留其内部的 Zeron 布局层级、四态切换（`Skeleton`/`Alert`/`InlineNotice`/`Empty`）和受管基础组件。
3. **在 `## Respect layout ownership` 下内联「Golden Layout Skeletons」**：
   - **列表页双模式说明**：明确在宿主壳内，选择 **Option A（带标题的 `PageHeader`）** 或 **Option B（仅放面包屑路径的 `PageHeader` + 在 `PageContentHeader` 内放 `PageHeaderContent` 标题与 `PageActions`）**，严禁同时在两处重复渲染 `PageTitle`。
   - **内联标准 JSX 骨架**：展示 `<PageHeaderContent icon={ResourceIcon}><div className="min-w-0"><PageTitle>{title}</PageTitle>{description && <PageDescription>{description}</PageDescription>}</div></PageHeaderContent>` 与 `<PageContent><PageBody><DataTable ...>{toolbar}</DataTable></PageBody></PageContent>`。
   - **`PageTitle` 字号陷阱提示**：加粗提醒 `PageTitle` 不传 `className` 时默认使用紧凑资源标题样式（`text-body font-medium`），一旦传入任何 `className` 会切换为 `text-heading`；因此 `min-w-0` 等布局类必须放在外层文本组 `<div>` 上。
   - **详情页选型与 4 条反模式红线**：
     1. 禁止用 `<div className="p-6 max-w-7xl mx-auto">` 替代 `PageLayout` 或手搓页头替代 `PageHeader`。
     2. 禁止在 `PageHeaderContent` 内将 `PageTitle` 与 `PageDescription` 作为直接并排 flex 兄弟（必须包裹 `<div className="min-w-0">`）。
     3. 禁止在 `AppShell`（及其 `AppShellSidebar/Header/Main`）、`PageLayout`（及其 `PageSidebar/PageContent`）、`PageContentHeader`（及其 `PageSubnav/PageActions`）、`PageColumns`（及其 `PagePrimary/PageAside`）之间插入中间真实 DOM 节点。
     4. 禁止在 `PageBody` 主 `DataTable` 外再套 `Card`/`Container` 或叠加第二个纵向滚动容器。

#### 1.2 修改 `.agents/skills/zeron-page-builder/references/task-context.md`
（供未预装本地 Skill 的纯 MCP 客户端首跳读取）
- 补齐候选 Block 双轨评估原则（`data-block` vs `template`）及标准布局链，并附加上一段浓缩版 4 条布局反模式禁令。

#### 1.3 修改 `.agents/skills/swap-to-zeronui/SKILL.md`
- 在 `## Map and migrate` 选型段落中同步明确：迁移存量页面时，不得仅因旧页面业务字段与示例名词不同而拒绝匹配结构的 `data-block` / `template` Block，也不得将页面区域降级为裸 `div` 替代 `AppShell` / `PageLayout` / `ResourceDetailLayout`。

---

### 工作包 WP2：升级 MCP 分组置顶、动态关联 Block 推荐与通用业务同义词

#### 2.1 修改 `lib/mcp/handler.ts`（`textSummary` 函数）
- 在 `search_components` / `list_components` 的纯文本输出中标注条目类型 `${item.id} (${item.kind}) — ${item.title}`。
- 当当前页同时包含高层项（`["block", "page", "layout", "flow"]`）与基础组件/参考项时，在纯文本摘要中分两组置顶渲染：
  - `=== Recommended Blocks & Layouts (Evaluate First) ===`
  - `=== UI Components & References ===`
- **铁律**：绝不改变 `structuredContent.data.items` 的数组顺序与结构，确保分页游标哈希与偏移量 100% 稳定。

#### 2.2 修改 `lib/agent-catalog/query.ts`（`component` 函数）
- 当调用 `get_component` 查询核心内容原语（`component:data-table`、`component:data-grid`、`component:table`、`component:card`、`component:tabs`、`component:field`、`component:metric-card`、`component:chart`）时：
  1. **动态反向检索关联 Block/布局**：从当前 `runtime` 中合并 `item.related` 及所有依赖/关联了该原语的 `block:*`（取前 5 个稳定 ID，如查询 `data-table` 自动附带 `block:grouped-data-table-01`、`block:resource-list-table-01` 等）。
  2. **双语注入 `overview` 架构提醒**：提示将该原语置于 `PageLayout > PageHeader + PageContent > PageBody`（或 `ResourceDetailLayout`）内，并直接列出上述关联 `block:*` 供立即评估。

#### 2.3 修改 `docs/agent-data/search-synonyms.json`
补充领域无关的真实业务同义词（保持 `pnpm agents:evaluate` 33/33 100% Top-3 命中）：
- `"model-mcp-marketplace-01"`：补充 `"应用市场"`, `"插件市场"`, `"catalog gallery"`
- `"resource-list-page-01"`：`["列表页", "后台列表", "订单列表", "用户管理列表", "CRUD page", "inventory page", "主从分类管理"]`
- `"resource-list-table-01"`：`["业务表格", "带工具栏表格", "搜索筛选表格", "resource table", "crud table"]`
- `"resource-detail-page-01"`：`["详情页", "对象详情", "配置详情页", "detail page", "inspection page"]`
- `"cluster-environment-list-01"`：`["状态卡片列表", "健康监控列表", "环境卡片墙", "health card grid"]`
- `"personal-settings-01"`：`["设置页", "个人设置", "偏好设置", "account settings"]`

---

### 工作包 WP3：在 `@zeron/lint` 新增完备的 AST 页面布局契约规则

#### 3.1 新增 `packages/lint/page-layout-contracts.mjs`
支持具名导入/别名（`import { PageTitle as Heading }`）、命名空间导入（`import * as Layout` $\rightarrow$ `<Layout.PageTitle>`）、词法作用域遮蔽豁免，并完整穿透 `JSXFragment`（`<>...</>`）、`LogicalExpression`（`{cond && <Slot/>}`）、`ConditionalExpression`（`{cond ? <SlotA/> : <SlotB/>}`）：

1. **`ungroupedHeaderText`**：`<PageHeaderContent>` 直接有效子元素中同时存在 `<PageTitle>` 与 `<PageDescription>` 时报错，要求外包 `<div className="min-w-0">`。
2. **`cardWrappedDataTable`**：`<Card>` / `<CardContent>` 直接包含 `<DataTable>`，或已在 `<PageContent>` / `<PageBody>` 页面容器内部时又套 `<Container>` / `<ContainerBody>` 包裹 `<DataTable>` 时报错（独立无外层 `PageContent` 的嵌入式 `Container` 部件如 `grouped-data-table-01` / `resource-cost-01` 合法豁免）。
3. **`wrappedDirectSlot`**：递归追踪原生小写 HTML 包装标签（如 `<div><section>...`），当隔断以下 4 组直接子槽位选择器关系时在最外层原生包装节点报错（若内部挂载了独立的同类型新宿主如文档预览里的内嵌 `<PageLayout>` 则停止下探，防止误伤）：
   - `AppShell` $\rightarrow$ `AppShellSidebar` | `AppShellHeader` | `AppShellMain`
   - `PageLayout` $\rightarrow$ `PageSidebar` | `PageContent`
   - `PageContentHeader` $\rightarrow$ `PageSubnav` | `PageActions`
   - `PageColumns` $\rightarrow$ `PagePrimary` | `PageAside`

#### 3.2 修改 `packages/lint/index.mjs` 与 `packages/lint/README.md`
- 在 `createZeronConfig` 的 `"zeron/design-system"` 开启 `"zeron/page-layout-contracts": "error"`，并在 `"zeron/component-implementations"` 关闭。
- 在 `packages/lint/README.md` 的 Policies 表格补充 `zeron/page-layout-contracts` 说明。

---

### 工作包 WP4：打通外部消费者便携自查脚本（`check-rendered-controls.mjs` & `usage-report.mjs`）

> 外部业务项目没有私有包 `@zeron/lint`，必须通过随 Skill 分发的两个零私有依赖脚本完成硬核验收。

#### 4.1 修改 `.agents/skills/zeron-page-builder/scripts/check-rendered-controls.mjs` 与 `references/consumer-verification.md`
在浏览器端 `inspectRenderedControls()` 函数中，基于渲染后的真实 DOM `data-slot` 属性新增 4 项只读布局契约检查（一旦可见 DOM 违规，退出码返回 `1`）：
1. **`nested-app-shell`**：可见 `[data-slot="app-shell"]` 祖先链中存在另一个 `[data-slot="app-shell"]` 时报 `failed`。
2. **`direct-layout-slot`**：可见子槽位（`app-shell-*`、`page-sidebar`/`page-content`、`page-subnav`/`page-actions`、`page-primary`/`page-aside`）向上匹配到对应父槽位容器，但 `child.parentElement !== owner`（中间隔了 wrapper DOM）时报 `failed`。
3. **`header-text-group`**：可见 `[data-slot="page-header-content"]` 的 `children` 中同时直接包含 `[data-slot="page-title"]` 和 `[data-slot="page-description"]` 时报 `failed`。
4. **`datatable-surface-frame`**：可见 `[data-slot="data-table"]` 的直接父元素 `data-slot` 为 `card` / `card-content`，或在 `[data-slot="page-content"]` / `[data-slot="page-body"]` 内部时直接父元素为 `container` / `container-body` 时报 `failed`。
- 同步更新 `references/consumer-verification.md` 说明脚本新增的布局契约检查能力。

#### 4.2 修改 `.agents/skills/zeron-page-builder/scripts/usage-report.mjs`
1. 将 `"zeron/button-icon-slots"` 和 `"zeron/page-layout-contracts"` 纳入 `designRules` 和 `ruleLabels`。
2. **新增路由级「裸写页面无布局宿主」静态检测（`architectureAdvisories`）**：
   - 当 TypeScript AST 盘点范围包含路由入口文件（匹配 `(?:^|\/)(?:app\/.*\/page|src\/pages\/[^/]+|pages\/[^/]+|src\/routes\/[^/]+)\.[jt]sx$`），且该路由直接使用了重型页面原语（`DataTable`、`DataGrid`、`CardGroup`、`Tabs`），但整个检查范围内既没有 `block` 分类组件，也没有 `AppShell` / `PageLayout` / `ResourceDetailLayout` / `ResourcePageLayout` / `AuthLayout` 时：
   - 在 JSON 报告写入 `architectureAdvisories` 数组，并在生成的 Markdown 报告「问题与说明」表格输出 `页面布局采用提醒`，防止 Agent 全篇用裸 `div` 蒙混过关（注：保持原有 `lint.status` 与 `inventory.status` 状态机语义不变，不破坏已有单测契约）。

---

### 工作包 WP5：补齐单元测试与按序重生成产物

1. **`tests/design-lint.test.mjs`**：覆盖条件表达式（`{desc && <PageDescription/>}`、`{ready && <DataTable/>}`）、命名空间导入（`<Layout.PageHeaderContent>`）、多层原生标签包裹（`<div><section><PageContent/></section></div>`）、`PageContentHeader` 子槽位包裹、以及 Fragment 正常放行。
2. **`tests/rendered-controls.test.mjs`**：在真实 Chromium 中验证 `inspectRenderedControls` 能准确检出 `nested-app-shell`、`direct-layout-slot`、`header-text-group`、`datatable-surface-frame` 四种 DOM 违规，并对合规的 `AppShell > PageLayout > PageHeader + PageContent > PageBody > DataTable` 零误报。
3. **`tests/skill-usage-report.test.mjs`**：验证 `src/pages/Orders.tsx` 裸用 `<DataTable/>` 未引入 `PageLayout`/Block 时，准确产出 `architectureAdvisories` 并在 Markdown 渲染 `页面布局采用提醒`。
4. **`tests/mcp-route.test.ts`**：验证 `search_components` 高层 Block 分组置顶标题，以及 `get_component("data-table")` 的 `overview` 同时包含 `PageLayout` 提醒和动态关联的 `block:` ID。
5. **严格构建顺序**：先跑 `pnpm skills:build`（更新 `public/skills` ZIP 与 manifest 哈希），再跑 `pnpm agents:build`（更新 `public/ai`、`public/llms*.txt` 与 `docs/generated/agent-runtime/`）。

---

## 三、 关键点验收清单（Acceptance Gates）

Codex 执行完毕后，必须逐条跑通以下命令且全部退出码为 `0`：

```sh
# Gate 1: Skill 打包、链接完整性与 Release Candidate 校核
pnpm skills:bundle --output output/skills/verify-bundle && rm -rf output/skills/verify-bundle
pnpm skills:build
pnpm skills:release:check

# Gate 2: Agent Catalog 重建、幂等一致性与双语 Top-3 搜索召回率评测 (必须 33/33 passed)
pnpm agents:build
pnpm agents:check
pnpm agents:evaluate

# Gate 3: 全仓类型检查、代码规范与 Design Lint（验证全仓官方页面与 Block 零违规、零误报）
pnpm typecheck
pnpm lint
pnpm lint:design

# Gate 4: MCP 路由、Catalog、Design Lint、Skill 分发与 Usage Report 单测
pnpm test:mcp
pnpm exec vitest run --config vitest.config.mts \
  tests/design-lint.test.mjs \
  tests/skill-distribution.test.mjs \
  tests/skill-release.test.mjs \
  tests/skill-usage-report.test.mjs \
  tests/agent-catalog-generation.test.mjs \
  tests/agent-catalog-source.test.mjs \
  tests/agent-context.test.mjs

# Gate 5: 真实 Chromium 便携消费者 DOM 控制与布局检查单测
pnpm test:controls:browser
```

### 交付文件范围核对清单（`git status`）

除重新生成的 `public/skills/`、`public/ai/`、`public/llms*.txt`、`docs/generated/agent-runtime/` 外，源码改动严格收敛于以下 14 个文件：

1. `.agents/skills/zeron-page-builder/SKILL.md`
2. `.agents/skills/zeron-page-builder/references/task-context.md`
3. `.agents/skills/zeron-page-builder/references/consumer-verification.md`
4. `.agents/skills/zeron-page-builder/scripts/check-rendered-controls.mjs`
5. `.agents/skills/zeron-page-builder/scripts/usage-report.mjs`
6. `.agents/skills/swap-to-zeronui/SKILL.md`
7. `docs/agent-data/search-synonyms.json`
8. `lib/agent-catalog/query.ts`
9. `lib/mcp/handler.ts`
10. `packages/lint/page-layout-contracts.mjs`（新增）
11. `packages/lint/index.mjs`
12. `packages/lint/README.md`
13. `tests/design-lint.test.mjs`
14. `tests/mcp-route.test.ts`、`tests/rendered-controls.test.mjs`、`tests/skill-usage-report.test.mjs`
