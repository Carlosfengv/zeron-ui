# Zeron Registry 资产分层与迁移实施方案

日期：2026-09-14
状态：安装协议迁移仍为方案；文档站分类先行实施
范围：当前 UI、业务组件、Block、Page、Template 的分类、源码注册、安装、文档与发布

实施记录：根据后续确认，先按现有界面形态将文档站拆成 `/docs/blocks` 与 `/docs/pages`，分别提供导航、列表、详情和分类内翻页。当前为 10 个区块、25 个页面，其中通用无限日志表格与 Agent Trace 1 也按完整界面归入页面；旧详情地址重定向到新地址，安装类型仍保留 `registry:block`。文档中的 Page 表示完整界面，后文规划的 `registry:page` 表示消费者路由交付，两者在这一过渡阶段明确区分。Settings/ZLR 原型和运维首页可归入页面浏览，但不因此获得 route-ready 或生产可用承诺。

## 1. 决策摘要

**部分现有 Block 适合增加 Page 交付形态，但不应批量修改旧条目的 `type`。推荐建立 Component → Block → Page → Template 四层资产模型，并保留底层 UI 组件体系。**

具体决策：

1. `registry:ui`：保留现有基础 UI 与设计系统组件。
2. `registry:component`：补齐有独立复用边界的业务组件、导航和布局外壳。
3. `registry:block`：交付可嵌入的业务区块；可以包含多个组件、数据类型、Hook、工具和资源。
4. `registry:page`：交付真正的路由入口，组合已有 Block，承担路由参数与数据适配。
5. Template：作为 Zeron 的产品分类；本项目的多页应用模板使用 `registry:block` 发布，并在自定义元数据中标记 `assetKind: "template"`。
6. **不创建 `registry:template`。它不在官方公开类型枚举中。**
7. 现有 35 个 Block 的安装名称、导出与目标文件路径在首轮迁移中保持兼容。新的 Page 使用新名称、新路由文件；公共文件可以逐步转交给 Component 条目，但旧 Block 的递归安装结果必须等价。

“组件是否看起来占满一页”和“安装时是否生成路由”是两个判断。前者可以影响文档分类，后者才决定本方案是否发布 Page 条目。

官方允许 Block 内包含 Page 文件，也允许顶层 Page 类型。本方案选择“独立 Page 条目依赖可复用 Block”，便于分别安装；这是 Zeron 的架构选择，并非官方要求所有项目采用同一种组织方式。[官方类型说明](https://ui.shadcn.com/docs/registry/registry-item-json#type)、[官方 Block 示例](https://ui.shadcn.com/docs/registry/examples#registryblock)

## 2. 当前基线与问题

### 2.1 审计基线（文档分类拆分前）

| 范围 | 当前状态 |
| --- | --- |
| 发布目录 | 126 个条目 |
| UI 清单 | 90 个：75 UI、11 Lib、3 Hook、1 Theme |
| Blocks 清单 | 36 个：35 Block、1 Component |
| 独立业务 Component | `resource-workspace-shell-01` |
| Blocks 清单中的文件类型 | 135 个 Component 文件条目、15 个 File 文件条目；包含重复登记，不等于唯一文件数 |
| Page | 0 个条目、0 个 Page 文件 |
| 旧能力标签 | 26 个 `template`、9 个 `data-block` |
| 文档拆分前的形态标签 | 16 Page、11 Block、4 Flow、2 Layout、2 Prototype；当前导航分类为 25 Pages、10 Blocks |

基线来源：[业务注册清单](/Users/carlos/Downloads/zeron-ui/packages/blocks/registry.json)、[UI 注册清单](/Users/carlos/Downloads/zeron-ui/packages/ui/registry.json)、[文档资产目录](/Users/carlos/Downloads/zeron-ui/docs/catalog/artifacts.ts)、[现有能力配置](/Users/carlos/Downloads/zeron-ui/packages/blocks/block-capabilities.json)。

因此，“补齐 Component”指补齐**可单独安装的条目与复用边界**，不是给每个 TSX 增加 `registry:component` 文件标签——当前大部分业务文件已经有这个标签。

### 2.2 校验基线

- 126 个发布条目通过本次审计时的官方 JSON Schema 与本地 shadcn 3.8.5 Schema 校验。
- 项目 `registry:check` 对 126 个条目的递归文件、依赖检查通过。
- 相关 4 个测试文件共 28 项测试：27 通过，1 失败。失败项是项目目录约定与 `types/hugeicons.d.ts` 的源路径冲突。
- Blocks 源清单缺少 `homepage`：公开 JSON Schema 允许，但本地 shadcn 3.8.5 的 Registry 校验要求它；合并清单继承了 UI 清单的值，因此现有发布产物通过。
- 当前 Registry 构建包和 Zeron CLI 固定使用 shadcn 3.0.0，根目录实际安装的是 3.8.5。上述 3.8.5 校验不能替代 3.0.0 安装验证。
- 本次分析没有完成原生 shadcn CLI 的消费者端到端安装；文档中的兼容性矩阵属于后续发布门槛。

### 2.3 会影响迁移的真实问题

| 问题 | 证据与影响 |
| --- | --- |
| Page 名称不等于 Page 交付 | `resource-list-page-01` 等只安装到 `components/blocks/`；用户还需自行建立路由 |
| 路由目标暂不受支持 | [install-plan.js](/Users/carlos/Downloads/zeron-ui/packages/cli/src/install-plan.js:37)拒绝 `app/...` 目标 |
| 元数据按 Block 类型分支 | [registry-metadata.mjs](/Users/carlos/Downloads/zeron-ui/packages/registry/scripts/registry-metadata.mjs:15)会把新增顶层 Page 默认归为 `react / ui` |
| 多个 Block 重复登记公共文件 | AI Gateway Overview、Session List、Agent Trace 都登记了 `ai-gateway-workspace-sidebar.tsx` 与 `ai-gateway-workspace-types.ts` |
| 页面包装依赖整个工作区 | [personal-model-usage.tsx](/Users/carlos/Downloads/zeron-ui/packages/blocks/src/application/personal-model-usage-01/personal-model-usage.tsx)直接包装 `PersonalSettings`；另有 Personal Usage、Resource Settings 依赖相同条目 |
| 安装代码仍有文档站链接 | 6 个运维源码文件包含 `/block-demo/` 路径：运维外壳、集群列表/详情、巡检列表、告警列表、服务管理；新 Page 不能照搬这些默认导航 |
| 路径解析有两套执行者 | Zeron 先计算计划，再把原始 URL 交给 shadcn 安装；只改计划中的路径，不能保证实际写入相同位置 |

这些问题需要通过交付边界和安装验证解决，单改 JSON 的 `type` 不会解决。

## 3. 类型与职责契约

### 3.1 产品分类与官方协议的映射

| 产品分类 | 顶层 Registry 类型 | 核心职责 | 是否拥有路由 |
| --- | --- | --- | --- |
| UI | `registry:ui` | 按钮、输入框、基础布局等设计系统能力 | 否 |
| Component | `registry:component` | 单一、稳定、可组合的业务呈现或布局能力 | 否 |
| Block | `registry:block` | 独立业务区域、复杂交互与多个组件的组合 | 否，按 Zeron 本方案约定 |
| Page | `registry:page` | 路由入口、参数解析、页面级适配与组合 | 是 |
| Template | `registry:block` + `meta.zeron.assetKind: "template"` | 多个页面组成的应用起点，包括连贯导航及必要配置 | 是，通过依赖的 Page 或自身路由文件 |

通用配置包、跨框架文件集合也可使用官方 `registry:item`。本次面向已有 React/Next 应用中的多页业务模板，统一采用 Block；不额外建立“通用项目脚手架”能力。[官方通用条目示例](https://ui.shadcn.com/docs/registry/examples#universal-items)

`flow` 改为交互模式标签，例如登录、向导、编辑器；`layout` 改为 Component 或 Block 的用途标签；`prototype` 改由 `readiness: "demo-only"` 表达。它们不再与资产层级混在同一枚举中。

### 3.2 条目类型和文件类型分别判断

一个 Page 条目可以包含：

- `page.tsx`：`registry:page`，有明确路由 `target`。
- 页面内的客户端适配文件：`registry:component`。
- 私有工具：按职责使用 `registry:lib`；不因此强制创建独立 Lib 条目。
- 页面附属资源或声明：按资源性质选择 `registry:file` 等类型，并提供目标路径。

Block 内的纯类型、数据文件不需要全部独立注册；Component 也不要求只有一个物理文件，配套导出和局部类型不构成拆分理由。关键是用户能否独立使用该能力。

在 Zeron 约定中，发布 Page 条目至少包含一个真正的 `registry:page` 文件；只含依赖的多页聚合入口归为 Template。`registry:page`、`registry:file` 文件的 `target` 必填。[官方文件规范](https://ui.shadcn.com/docs/registry/registry-item-json#files)

### 3.3 依赖方向

```text
Template（多页组合）
  └─ Page（路由与适配）
       ├─ Block（业务区域）
       │    ├─ Component（业务组件、外壳）
       │    │    └─ UI / Hook / Lib / Theme
       │    └─ 其他 Block（明确的子区块）
       └─ Component（页面局部适配）
```

- Component 不依赖 Page、Template，也不反向依赖消费它的 Block。
- Block 可以依赖较小的 Block；不得因为复用一个组件而安装另一张页面的路由。
- Page 不直接导入另一张 Page 的默认导出；复用部分应来自 Component 或 Block。
- 依赖图必须无环；多个入口共享文件时，由一个条目持有源文件，其他入口依赖它。
- UI 层继续服务通用设计系统，不吸收具体业务查询、业务字段和产品导航。

### 3.4 Component 拆分门槛

满足“有独立使用方式、公开 Props 边界稳定”，并至少满足以下一项才拆：已经被两个以上组合消费；用户确实需要单独安装；已有共享源码被多个条目重复登记。

不要按文件数、截图区域或行数机械拆分。Block 私有表格列、单次使用的详情卡片、mock 数据、内部 Hook 可以继续由原条目交付。尤其不把 Infinite Log Table 的内部实现拆成十几个公开条目。

## 4. 现有资产逐项处理清单

以下覆盖全部 35 个 Block 和 1 个独立业务 Component。**“新增 Page”均指新增路由入口，旧条目保持可嵌入安装；表中的新名称是拟定名称，尚未发布。**

阶段标记：M1 为公共组件试点，M2 为三条路由试点，M3 为推广；“后置”需先满足该行的前置条件。

| # | 当前 Registry 名称 | 推荐定位与动作 | 新增 Page 名称 / 条件 |
| --- | --- | --- | --- |
| 1 | `login-01` | 保留认证 Block；产品上标记认证流程；需要真实回调才宣称完成登录 | M2：`login-route-01` |
| 2 | `signup-01` | 保留注册 Block；沿用登录页适配方式 | M3：`signup-route-01` |
| 3 | `availability-monitor-01` | 保留 Block；被模型分析详情复用；旧 `template` 标签不能说明它是多页模板 | 不增加必选 Page |
| 4 | `ai-gateway-overview-01` | 保留分析工作区 Block；支持关闭自带导航；增加整页入口 | M3：`ai-gateway-overview-route-01` |
| 5 | `file-manager-01` | 保留复杂文件管理 Block；存储适配属于宿主 | 不增加必选 Page |
| 6 | `ai-gateway-session-list-01` | 保留会话列表 Block；Page 接管查询与路由跳转 | M3：`ai-gateway-session-list-route-01` |
| 7 | `agent-message-trace-01` | 保留嵌入式 Trace Block | 不增加必选 Page |
| 8 | `agent-trace-01` | 文档归入页面；Registry 保留现有 Trace Block 交付；公共导航交给独立 Component | 消费者路由按需后置，当前未新增 |
| 9 | `rule-flow-editor-01` | 保留编辑器 Block；Flow 是模式标签 | 不增加必选 Page |
| 10 | `agent-session-detail-01` | 增加会话详情 Page；底层继续组合 Trace Block | M3：`agent-session-detail-route-01` |
| 11 | `cluster-environment-detail-01` | 增加详情 Page；指标/状态区块继续复用 | M3：`cluster-environment-detail-route-01`；先处理文档站导航 |
| 12 | `cluster-environment-list-01` | 增加列表 Page | M3：`cluster-environment-list-route-01`；先处理导航与查询适配 |
| 13 | `inspection-report-list-01` | 增加巡检列表 Page | M3：`inspection-report-list-route-01`；先处理导航 |
| 14 | `monitoring-alert-list-01` | 增加告警列表 Page | M3：`monitoring-alert-list-route-01`；先处理导航 |
| 15 | `service-management-01` | 增加服务工作区 Page | M3：`service-management-route-01`；先处理导航 |
| 16 | `personal-settings-01` | 保留旧组合；先拆可控的 Settings 容器与内容区；当前文档标为演示原型 | 后置；不直接升级为 Template 或可接入 Page |
| 17 | `personal-model-usage-01` | 整页语义成立，但仍依赖 PersonalSettings 大组合 | 后置：`personal-model-usage-route-01`；先降低该依赖的耦合 |
| 18 | `credit-usage-01` | 保留额度展示 Block | 不增加必选 Page |
| 19 | `personal-usage-01` | 增加页面入口前先拆 Settings 依赖 | 后置：`personal-usage-route-01` |
| 20 | `resource-settings-01` | 增加设置 Page 前先拆 Settings 依赖 | 后置：`resource-settings-route-01` |
| 21 | `model-mcp-marketplace-01` | 增加市场 Page；原文档 slug 为 `resource-catalog-01`，二者映射保留 | M3：`model-mcp-marketplace-route-01` |
| 22 | `mcp-detail-01` | 增加 MCP 详情 Page；连接/调用适配与资源文件保持完整 | M3：`mcp-detail-route-01` |
| 23 | `model-detail-01` | 增加模型详情 Page；接口与数据来自页面适配层 | M3：`model-detail-route-01` |
| 24 | `model-detail-02` | 增加模型分析 Page；继续依赖 Availability Monitor | M3：`model-analytics-route-01`；避免与上一款详情路由冲突 |
| 25 | `provider-create-form-01` | 保留向导 Block；增加创建流程入口 | M3：`provider-create-route-01`；凭证校验与发现模型由宿主接入 |
| 26 | `resource-list-table-01` | 保留可嵌入资源表格 Block | 不增加独立 Page |
| 27 | `resource-workspace-shell-01` | 保留现有 `registry:component`，作为 Component 基准 | M1：补齐文档和独立安装验收 |
| 28 | `resource-list-page-01` | 保留现有整页组合 Block；新增路由入口 | M2：`resource-list-route-01` |
| 29 | `resource-detail-page-01` | 保留详情组合 Block；新增动态路由入口 | M2：`resource-detail-route-01` |
| 30 | `resource-metric-list-01` | 保留资源指标 Block；不是应用模板 | 不增加必选 Page |
| 31 | `resource-status-all-01` | 保留状态汇总 Block；不是应用模板 | 不增加必选 Page |
| 32 | `top-nav-app-shell-01` | 提炼/注册布局 Component；旧 Block 作为兼容入口 | M1：新增 `top-nav-workspace-shell-01`；无 Page |
| 33 | `zaiops-operations-01` | 当前含导航、示例数据与业务展示；先提取受控外壳，旧 Block 保留 | M3：候选 Component `operations-workspace-shell-01`；暂不直接改 Page |
| 34 | `zlrlist` | 当前是列表/详情切换原型；先分离数据、导航和状态边界 | 后置；完成后可组织多个 Page，再评估 Template |
| 35 | `member-department-01` | 保留成员/部门管理 Block | 不增加必选 Page |
| 36 | `infinite-log-table-01` | 文档归入页面；Registry 保留复杂日志 Block 交付，内部模块维持整体交付 | 消费者路由按需后置，当前未新增 |

消费者路由候选范围：按拆分前的 16 个文档 Page，加上 AI Gateway Overview、Login、Signup、Provider Create，共 **20 个候选 Page 入口**。这与当前文档导航中的 25 个完整页面是两种统计口径，Agent Trace 和通用无限日志表格等已归入页面浏览，但未因此新增消费者路由。其中 3 个 Settings 派生页面后置；首轮只实现 3 个试点，不一次性生成 20 张空路由。

旧能力配置中的 26 个 `template` 不应整体转为新的 Template 分类。该标签历史上包含区块、外壳与单页组合，和“多页应用起点”的含义不同。

## 5. 首批 Component 拆分设计

| Component | 现有来源 | 首批消费者 | 实施约束 |
| --- | --- | --- | --- |
| `resource-workspace-shell-01` | 已有独立条目 | Resource List / Detail | 保留 Props、导出与文件目标；验证导航可覆盖 |
| `ai-gateway-workspace-sidebar-01` | 两个已共享的 sidebar/types 文件 | Overview、Session List、Agent Trace | 新条目持有这两个文件，三个旧 Block 改用依赖；维持原相对路径 |
| `top-nav-workspace-shell-01` | 现有 TopNavAppShell | 旧 `top-nav-app-shell-01` 兼容入口与后续页面 | 可直接复用已有可组合 Props；只改变 Registry 所有权，不先搬源码 |

TopNav 的具体所有权切分：新 Component 持有既有 `top-nav-app-shell.tsx`，旧 Block 保留既有 `index.ts` 并依赖新 Component。旧安装目标与相对导出保持一致，新 Component 可直接导入实现文件的公开导出。这样不依赖构建器是否支持“没有文件、只有依赖”的兼容条目。

第二批候选：`operations-workspace-shell-01` 与 `settings-workspace-shell-01`。它们需要从业务组合中提炼，不是把大文件换一个类型标签；先明确导航配置、账户菜单、children/插槽、移动端抽屉和数据边界，再注册。

Settings 的拆分应同时移出相关内容区：只抽外壳、让三个派生页面继续 import 整个 `PersonalSettings`，不会降低安装耦合。内容区如果仍有复杂交互，应保留为 Block，不强行降级成 Component。

独立 Component 可以暂时安装到既有 `components/blocks/...` 路径；目录名不决定官方类型。新引入的共享文件可采用 `components/zeron/...`，但同一个迁移步骤中不同时更改旧路径、包导出和类型。

## 6. 命名、源码与 Registry 组织

### 6.1 名称约定

- 所有条目共享唯一名称空间；不能通过 `type` 区分两个同名条目。
- 旧名称、现有 `@zeron/blocks/...` 导出路径保持有效。
- 新 Component：职责名加版本后缀，例如 `ai-gateway-workspace-sidebar-01`。
- 新 Page：使用 `*-route-01`，明确与已有 `*-page-01` 视觉组合区别。
- 新 Template：使用 `*-starter-01`，例如未来的 `resource-workspace-starter-01`。
- 文档标题使用“资源列表页”等自然名称，安装名和真实 Registry 类型放在技术信息中。

### 6.2 源目录方案

第一阶段不新增 workspace package。拟新增目录如下，均为未来路径：

```text
packages/blocks/
  registry.json                  # 现有 Block 与 Component
  registry.pages.json            # 新增 Page 条目；M2 引入
  registry.templates.json        # 首个完整 Template 验收时再引入
  src/application/               # 现有可嵌入源码
  src/routes/                    # 安装用路由源文件，不进入文档站 app 路由
    login-route-01/page.tsx
    resource-list-route-01/page.tsx
    resource-list-route-01/resource-list-client.tsx
    resource-detail-route-01/page.tsx
    resource-detail-route-01/resource-detail-client.tsx
```

在 [compose-registry.mjs](/Users/carlos/Downloads/zeron-ui/packages/registry/scripts/compose-registry.mjs)中增加实际存在的清单输入；所有可独立构建的清单都提供 `name`、`homepage`、`$schema`。继续使用目前的合并和 postbuild 流程，不同时迁移到另一套 include 构建机制。

不把 [文档页面](/Users/carlos/Downloads/zeron-ui/docs/pages/blocks/resource-list-page-01/page.tsx)或文档站 Demo 路由注册给消费者；它们依赖文档布局、国际化和站内加载器。

### 6.3 源清单与发布产物的职责

源清单可继续使用本项目已有的本地依赖名称。发布构建必须把它们转换为完整 Registry URL；裸 `button` 在官方 CLI 中指向官方源，不代表 Zeron 自己的 Button。现有 postbuild 已承担该转换。[官方依赖地址说明](https://ui.shadcn.com/docs/registry/registry-item-json#registrydependencies)

下面是**拟新增的源条目示例**，文件需要在 M2 实现，不可把这段配置单独发布：

```json
{
  "name": "resource-list-route-01",
  "type": "registry:page",
  "title": "资源列表页",
  "description": "Next.js App Router 路由入口，组合资源列表区块。",
  "registryDependencies": ["resource-list-page-01"],
  "files": [
    {
      "path": "packages/blocks/src/routes/resource-list-route-01/page.tsx",
      "type": "registry:page",
      "target": "app/zeron-examples/resources/page.tsx"
    },
    {
      "path": "packages/blocks/src/routes/resource-list-route-01/resource-list-client.tsx",
      "type": "registry:component",
      "target": "components/zeron/pages/resource-list-route-01/resource-list-client.tsx"
    }
  ],
  "meta": {
    "zeron": {
      "schemaVersion": 2,
      "assetKind": "page",
      "framework": "next",
      "router": "app",
      "react": "^19.0.0",
      "tailwind": "^4.0.0",
      "kind": "template",
      "readiness": "adapter-required",
      "dataMode": "controlled"
    }
  }
}
```

`kind: "template"` 在此仅兼容旧客户端；新逻辑读取 `assetKind: "page"`，不能继续从旧 kind 推断路由能力。

## 7. Page 的最小可交付契约

### 7.1 首轮路由与边界

| 新条目 | 默认目标 | 必须验证 |
| --- | --- | --- |
| `login-route-01` | `app/zeron-examples/login/page.tsx` | 可渲染；凭证/第三方登录通过明确的回调适配；未接入时不显示登录成功 |
| `resource-list-route-01` | `app/zeron-examples/resources/page.tsx` | 查询状态、分页、空态与详情跳转可接入；单独安装时不得出现不可用详情链接 |
| `resource-detail-route-01` | `app/zeron-examples/resources/[resourceId]/page.tsx` | 动态参数、详情不存在/加载失败、返回列表行为；单独安装时提供宿主可配置返回路径 |

默认使用 `/zeron-examples/` 是本方案为现有应用选定的独立命名空间，不是官方命名要求。首轮不覆盖首页、根布局、宿主鉴权，也不自动将示例页挂入宿主主导航。

初期仅支持已有 Next App Router 消费项目的 `app/` 或 `src/app/`；宿主已初始化 React、Tailwind、components.json 和根布局。Pages Router、Vite 文件路由、新建完整项目和自动重定位到任意业务路由属于后续工作，不对外承诺。

### 7.2 路由适配与 React 边界

- Page 负责解析 params/searchParams，采用锁定 Next 版本要求的类型；动态路由的验收必须包含异步 params 用法。
- 路由文件默认作为 Server Component；把交互回调与受控查询状态放进客户端适配组件。普通函数不能作为 Props 跨越服务端/客户端边界。
- Page 不复制原 Block 的 JSX。它只组织数据输入、权限输入、导航回调与业务操作适配。
- 保持底层框架能力：React Block 不因为新增 Next Page 而改标成 Next；已经 import `next/link` 等能力的旧 Block 保持 Next 标记，除非另行完成解耦。
- 详情页显式提供必要的 `data`；例如 ResourceDetailPage 当前的 `data` 是必填项，不可用 `<ResourceDetailPage />` 充当完成的路由实现。

### 7.3 数据、演示与可用性

统一首轮交付策略：Page 默认使用受控空数据或明确的“等待接入”状态；不发起虚构 API 请求。示例数据通过显式 demo 入口启用，并在页面上说明。

当前 ResourceListPage 的 `dataMode` 默认是 `demo`。新 Page 必须显式传入 `dataMode="controlled"`、空列表与一致的分类数据模式，避免无意展示真实业务数据般的演示内容。不在这次兼容迁移中静默改变旧 Block 默认值。

业务写入按钮在适配未提供时隐藏或禁用；适配启用后验证 loading、成功、错误和重试。`copy-ready` 只表示源码可直接组合使用，不表示后端、鉴权或生产数据已经接好。Page 的 `adapter-required` 状态必须在文档与安装后的提示中一致。

### 7.4 导航与布局所有权

- 新 Page 的默认链接不能包含文档站 `/block-demo/`、`/docs/blocks/` 路径。
- 独立 Page 必须能单独使用，不通过依赖另一张 Page 来避免死链；未安装关联页面时不显示其默认跳转。
- Template 在组合列表和详情后，才统一启用双向导航。
- 只保留一层主工作区外壳、一个主要内容 landmark 和明确的滚动容器；不能把自带侧栏的 Block 再套一个侧栏布局。
- 首轮保留每个整页 Block 的外壳；Template 只有在页面内容支持关闭外壳后，才把视觉外壳上提到共享布局。只提供 Context 的 `layout.tsx` 可以先引入，但不得再渲染侧栏。不把“增加 Page”与“改造所有布局”绑定成同一大任务。

## 8. Template 的发布门槛

现有单页或多视图 Demo 不自动升级为 Template。首个推荐候选是 `resource-workspace-starter-01`，在列表/详情 Page 都通过独立安装后再实施。

Template 至少交付：两个可访问且相关的页面；一致的导航；明确的布局所有权；必要 Provider/样式的安装说明；数据接入点；运行与接入文档。此处“至少两个页面”是 Zeron 的产品约定。

顶层使用 `registry:block`，`meta.zeron.assetKind` 为 `template`；通过 `registryDependencies` 组合 Page 和公共 Component。新增的模板连接代码或 Provider 有实际文件时再登记，不复制依赖条目的源文件。

Template 不能通过额外文件覆盖依赖 Page 的同一目标来“修补导航”。需要修改页面适配契约，使连接配置可从共同持有的文件或 Props 输入；同一目标只保留一个所有者。

首个资源模板采用以下明确实现，避免组合时回头修改已安装页面：

1. M2 在现有 Resource Workspace Shell 条目中追加一个可选的 React 导航 Context 文件，保存列表地址和详情地址前缀；默认值为未配置。不改变 Shell 的已有 Props，不引入 Next 依赖。
2. 列表/详情的客户端适配层读取该 Context；未配置时隐藏跨页动作，宿主也可显式提供导航配置。资源 ID 作为路径段编码后再拼接。
3. M4 的 Template 依赖这两张 Page，额外持有 `app/zeron-examples/resources/layout.tsx`，在其中挂载导航 Provider 并传入明确的两个地址。该布局只注入配置，不重复渲染外壳。
4. 两张 Page 的路由文件始终由各自条目持有；新增布局由 Template 持有；Context 始终由原公共 Component 持有。单装和组合安装无需覆盖同一个文件。
5. 已有同目标布局时按正常冲突处理；不自动合并宿主布局。Context 文件属于现有 Component 的附属实现，不增加新的 Registry 条目。

初期 Template 是**装入已有 Next 应用的业务起点**。整仓脚手架、数据库、部署配置和生产鉴权不属于本次交付范围；不把依赖 Page 的聚合 JSON 宣传成完整生产应用。

## 9. 元数据与文档的单一来源

### 9.1 新能力模型

业务条目以源 Registry 的 `meta.zeron` 为能力事实来源，新增以下字段。基础 UI、Lib、Hook、Theme 本轮保留既有能力模型。

| 字段 | 用途 | 规则 |
| --- | --- | --- |
| `schemaVersion` | Zeron 元数据版本 | 新模型为 `2`，与官方 `$schema` 无关 |
| `assetKind` | 业务资产层级 | `component / block / page / template` |
| `framework` | 源码需要的框架 | 保留 `react / next`，按实际 import 与依赖验证 |
| `router` | 路由能力要求 | 首轮 Page/Template 为 `app`；可嵌入组件不自动设置 |
| `react`、`tailwind` | 现有运行约束 | 保留，版本以验证过的兼容范围为准 |
| `readiness` | 接入成熟度 | 沿用 `copy-ready / adapter-required / demo-only` |
| `dataMode` | 对外数据契约 | 沿用 `static / mock / controlled / api-ready` |
| `kind` | 旧消费端兼容字段 | 暂时保留旧 `ui / data-block / template` 值，不参与新层级判断 |

`assetKind` 描述**实际安装交付**：旧 `resource-list-page-01` 仍是 Block，新 `resource-list-route-01` 才是 Page。视觉形态与交互模式放在文档 patterns 中，不再制造另一套同名 kind。

### 9.2 迁移方式

1. 把现有 block-capabilities 的能力与 docs/catalog 的 readiness/dataMode 合并到源条目元数据；对冲突逐条处理，不能按旧 `template` 自动推断新层级。
2. 修改 `registryMetadata()`：保留并验证条目声明，添加兼容默认值；不再用“是否 Block”决定全部元数据。
3. 从源清单生成供文档/包使用的能力投影。`block-capabilities.json` 在兼容期可保留为生成产物，禁止与源条目双向手工维护。
4. 文档继续维护展示文案、产品、领域、搜索词和历史 slug；安装类型、框架与成熟度从生成的能力数据读取。
5. 旧消费者读取 `kind` 仍可工作；只有完成明确的版本迁移后才考虑删除旧字段。本轮不删。

### 9.3 文档与安装入口

- 展示维度：组件、区块、页面、模板；技术细节中展示真实 Registry 类型。
- 原有文档 URL 与 Gallery 入口保留。新增分类通过筛选或导航呈现，不要求先迁移全部文档路由。
- 同一业务展示页可以提供“安装区块”和“安装页面”两个明确入口；Page 尚未发布时不显示安装按钮。
- 在文档关联信息中增加可选 `pageRegistryName`，只用于关联新安装入口，校验其名称存在且类型为 Page；不要让用户猜测旧安装名是否新增了路由副作用。
- Flow 用作模式筛选；演示原型按 `demo-only` 过滤，不当成已完成的 Page 或 Template。
- CLI 的 list/view 与文档使用相同分类事实，不能文档显示 Page、CLI 仍只报告旧 template 标签。

以下为 M2 发布后的目标使用方式，新名称在发布前不可使用：

```sh
# 只安装现有可嵌入组合，不生成路由。
npx zeron-ui add resource-list-page-01

# 查看新增 Page 会写入哪些路由与组件。
npx zeron-ui add resource-list-route-01 --dry-run

# 安装真正的 Page。
npx zeron-ui add resource-list-route-01

# 原生 shadcn 使用发布后的完整 URL；框架要求仍需由使用者遵守。
npx shadcn add https://zeron-ui.vercel.app/r/resource-list-route-01.json
```

验证和正式发布说明应把 CLI/Registry 版本固定为已测试版本；这里省略版本仅用于展示命令形态。

## 10. 安装链路改造

### 10.1 版本先行

M0 先记录构建、CLI、根项目的 shadcn 版本并统一测试口径。首轮可保留 3.0.0 作为项目安装引擎；若它无法满足 Page 试点，则在独立变更中升级并锁定一个实际通过验收的版本。不能只因为最新文档支持某特性就宣称旧版本兼容。

首轮不同时把全部 `target` 改成 `@components/` 等占位路径。新官方占位路径、旧固定路径、Zeron 自定义映射属于不同兼容面，先完成 Page，再单独评估目录可移植性迁移。

### 10.2 路径解析

改造现有 install-plan，增加按文件类型与目标解析的分支：

1. 现有 `components/`、`lib/`、`hooks/` 行为在受支持消费者中保持不变。
2. 新 `registry:page` 文件使用 `app/...` 目标；根据消费者真实 App Router 根解析到 `app/` 或 `src/app/`。
3. 检测出 Pages Router、普通 Vite、没有可用 App Router 根、存在无法明确选择的根目录时，在写入前给出明确错误；首轮不自动生成根布局或猜测路由模式。
4. 未来 Template 的 `layout.tsx` 等文件必须逐类测试；不得依靠 `registry:file` 绕开路由兼容判断。
5. 所有目标执行项目边界、符号链接边界和路径规范化检查。两个条目映射到同一目标、内容不一致时拒绝安装。
6. 对规范化 URL 冲突增加检查：不同路由组映射到同一路径、动态参数名称不同但路由结构相同等，不能只比较物理文件路径。首轮不支持的并行/拦截路由明确拒绝，保留 Next 构建检查作为最终约束。

官方文件更新器会按 Page 类型、框架及 src 目录处理目标，不能把 Page 简单拼接到组件别名下。具体行为要对锁定版本验证。[官方文件路径解析源码](https://github.com/shadcn-ui/ui/blob/main/packages/shadcn/src/utils/updaters/update-files.ts)

### 10.3 安装计划与实际执行一致

当前 [CLI add 流程](/Users/carlos/Downloads/zeron-ui/packages/cli/src/cli.js:207)先生成计划，再让 shadcn 重新获取原始 URL。M2 必须验证：计划中的 Page 目标与 shadcn 的实际写入目标一致；`src/app` 不能在一边解析为根 `app`、另一边解析为 `src/app`。

优先沿用原始 Registry 和锁定引擎，完成一致性测试。如果确实需要消费者特定目标变换，则同一份已解析清单必须供计划和执行共同使用；不得只改 dry-run 输出。首轮不增加尚未实现的 `--route` 或任意 `--path` 参数。

新入口的读操作包括 `view` 和 `add --dry-run`；dry-run 展示将创建的路由、组件、配置/CSS影响与冲突，不落盘。兼容检查在包安装、主题更新和文件写入前完成。

### 10.4 冲突、重复安装与失败

- 不同内容的已有路由默认拒绝覆盖，沿用显式 `--overwrite` 语义；不能因为原文件是 Page 就自动替换。
- 相同版本重复安装应幂等；共享组件只安装一次。
- 先装 Block 再装 Page，与直接装 Page，最终文件集合和导入应相同。
- 对新增 Page 的安装后检查必须确认路由实际存在、导入可解析。不能仅因 shadcn 返回 0 就记为成功。
- 当前实现没有完整事务回滚能力；本阶段不承诺依赖安装或磁盘失败后的全量自动回滚。失败不得写成功安装记录，并明确报告已产生的变更；版本回退通过固定 release 和宿主版本控制完成。

### 10.5 原生 CLI 与 Zeron CLI 的承诺边界

Zeron 的 `router/readiness/assetKind` 元数据是自定义信息，原生 shadcn 不会替 Zeron 执行全部兼容性策略。原生使用的框架要求写进条目 `docs` 与网站说明，并通过支持矩阵验证。

原生 CLI 验证时不能运行 Zeron 的别名修复补丁。若原生安装在某别名布局下失败，必须修复发布产物或把该组合标为不支持；不能用 Zeron 安装通过替代原生兼容证明。

## 11. 代码改动清单

| 位置 | 必须完成的工作 |
| --- | --- |
| [Blocks registry](/Users/carlos/Downloads/zeron-ui/packages/blocks/registry.json) | 补 homepage；添加业务元数据；公共文件转为唯一 Component 所有者；保留旧条目 |
| 拟新增 `packages/blocks/registry.pages.json` | 登记试点 Page、源路径、路由目标与依赖 |
| [Registry 合并](/Users/carlos/Downloads/zeron-ui/packages/registry/scripts/compose-registry.mjs) | 加入新清单；检查跨清单重名；生成能力投影 |
| [元数据生成](/Users/carlos/Downloads/zeron-ui/packages/registry/scripts/registry-metadata.mjs) | 从类型分支改为声明验证；兼容旧 kind；验证 Page 的 router/framework |
| [postbuild](/Users/carlos/Downloads/zeron-ui/packages/registry/scripts/postbuild.mjs) | 保留依赖 URL、运行依赖处理；新 Page/Template 也进入相同流程 |
| [导入转换](/Users/carlos/Downloads/zeron-ui/packages/registry/scripts/transform-imports.mjs) | 覆盖新适配文件、类型导入与实际使用的动态导入；不泄漏工作区别名 |
| [Registry 检查](/Users/carlos/Downloads/zeron-ui/packages/registry/scripts/registry-check.mjs) | 加入官方 Schema、新元数据、路由目标、类型/数据契约、依赖层级和文件所有者验证 |
| [安装计划](/Users/carlos/Downloads/zeron-ui/packages/cli/src/install-plan.js) | Page 解析、App Router 检测、冲突与实际引擎路径一致性 |
| [CLI](/Users/carlos/Downloads/zeron-ui/packages/cli/src/cli.js) | router 校验、dry-run、新分类展示、安装后文件核验 |
| [安装后导入处理](/Users/carlos/Downloads/zeron-ui/packages/cli/src/resolve-registry-aliases.js) | 覆盖新增计划文件；不扩大扫描或重写宿主文件的范围 |
| [业务包 exports](/Users/carlos/Downloads/zeron-ui/packages/blocks/package.json) | 新公共 Component 按需导出；路由文件不暴露为通用组件包 API |
| [文档目录](/Users/carlos/Downloads/zeron-ui/docs/catalog/artifacts.ts)与[Gallery](/Users/carlos/Downloads/zeron-ui/docs/components/blocks/BlocksGallery.tsx) | 新分类和双安装入口；历史 slug 保留；能力读取生成产物 |
| [消费者安装测试](/Users/carlos/Downloads/zeron-ui/scripts/test-consumer-installs.mjs) | 增加 Page/Component/Template 与原生 CLI 的真实安装、构建和访问验证 |
| [一致性测试](/Users/carlos/Downloads/zeron-ui/tests/registry-consistency.test.mjs) | 纠正 Lib 声明目录冲突；移除“所有 Block 文件都必须在 components/blocks”这类不再普适的约束 |

新类型不会自动带来这些能力。实现时应按表中责任更新，避免只让 JSON 校验通过。

## 12. 实施阶段与完成条件

| 阶段 | 交付 | 完成条件 |
| --- | --- | --- |
| M0：基线与元数据 | 版本口径、homepage、现有失败测试处理、v2 元数据及兼容投影、分类校验 | 既有 126 个条目仍可检查；旧安装行为没有增加路由；能力不存在双重手工来源 |
| M1：Component 试点 | 现有 Resource Shell 独立文档；AI Gateway Sidebar 和 TopNav Shell 两个新增条目 | 三个 Gateway 消费者仍正常；旧 TopNav Block 闭包文件不变；新 Component 可单独安装 |
| M2：Page 试点 | 安装链路支持；Login、Resource List、Resource Detail 三条新路由 | 原生与 Zeron 的受支持矩阵通过；旧 Block 不落路由；列表/详情支持独立安装与组合安装 |
| M3：逐批推广 | 其他候选 Page、运维公共外壳、导航清理；Settings 在解耦后推进 | 每批独立验收；未完成依赖解耦的条目不标记 route-ready |
| M4：首个 Template | Resource Workspace Starter 与列表/详情连贯流程 | 多页组合、导航、布局、数据接入说明完整；无目标覆盖冲突 |

M0–M2 是首个可交付里程碑。先交付可验证的小闭环，再决定是否推进 Settings/ZLR 重构；不能让两个原型的重构拖住基础 Registry 能力。

首个里程碑的预期条目数：基线 126 + 2 个新 Component + 3 个新 Page = **131**。旧条目保留，不新增无必要的 Lib/Hook 条目；如果实施中数量变化，必须能由具体新增能力解释。

## 13. 验收清单

### 13.1 协议与依赖

- 所有源清单、合并清单和发布条目通过锁定版本 Schema 校验；最新官方 Schema 作为补充检查。
- 不出现 `registry:template`；Page 文件具备 target；新业务条目的 assetKind 与实际文件/依赖契约相符。
- 每个源文件存在，发布的每个文件有内容；递归依赖闭包完整；无工作区/文档专用导入、缺失资源或依赖环。
- 对新 Page 源码/依赖的默认导航执行检查，验证没有文档站链接；允许已有 Block 在兼容期通过可覆盖 Props 保持旧行为，但 Page 必须覆盖它们。
- 同一公共文件有唯一注册所有者；同名条目、不同内容的目标冲突都会失败。
- metadata 推断检查包含：Next 依赖向上约束；React Block 不被 Page 依赖关系反向污染；旧 kind 与新 assetKind 可并存。

### 13.2 真实消费者矩阵

| 场景 | 预期 |
| --- | --- |
| Next App Router，根 `app/`，标准 `@/` 别名 | 三个 Page 安装、类型检查、生产构建、URL 访问通过 |
| Next App Router，`src/app/` | 路由只写入 `src/app`；组件按实际配置解析；不存在额外根 `app` |
| Next App Router，项目现有 `#` 导入 fixture | Zeron 安装通过；原生单独验证，失败则不得对该组合宣称原生兼容 |
| 自定义 components/ui/lib 目录 | Zeron 计划和实际文件一致；原生独立验证与标明支持范围 |
| React/Vite 安装 framework=react 的 Component/Block | 继续可用；没有隐式引入 Next 路由 |
| React/Vite 或 Next Pages Router 安装新增 App Page | Zeron 写入前拒绝；原生路径遵循其自身机制，文档明确不在支持范围 |
| 单独安装 Page | 页面可渲染；没有来自未安装关联页的坏链接 |
| 先 Block 后 Page、直接 Page、重复 Page | 结果一致、共享文件不重复、重复安装幂等 |
| 已有相同/不同内容路由 | 相同跳过；不同默认拒绝；显式覆盖只作用于计划内目标 |
| 路由组/动态路径冲突 | 写入前报告已识别冲突；消费者构建再次约束 |
| 三个公共 Component 单独安装 | 闭包完整，可通过最小使用示例类型检查 |
| Template 单装与已有 Page 后安装 | 多页链接和共享布局正确，无文件覆盖冲突 |

测试渠道：打包后的 Zeron CLI；锁定版本原生 shadcn；最新稳定原生 shadcn 的补充兼容测试。记录实际版本，不只写 `latest`。包管理器至少覆盖 npm 与 pnpm 的代表路径，不要求每一行都做全笛卡尔积。

### 13.3 页面行为与回归

- Login：字段验证、缺少适配时的禁用状态、提交 loading/错误；不能把接入占位当成真实认证。
- Resource List：空态、加载、错误、分页/筛选；受控模式不注入 demo 数据。
- Resource Detail：必填 data、未知 ID、读取失败、返回；资源图片、Markdown 和可编辑字段的边界完整。
- 组合列表/详情：可往返；适配状态与 URL 一致；没有双侧栏、重复 main 或嵌套主滚动容器。
- 原文档演示和已有可嵌入用法继续有效；旧安装命令不生成新路由。

可以复用已有命令执行基线检查：

```sh
pnpm registry:build
pnpm registry:check
pnpm exec vitest run --config vitest.config.mts tests/registry-consistency.test.mjs tests/registry-check.test.mjs tests/postbuild-registry.test.mjs tests/registry-import-transform.test.mjs
pnpm cli:check
pnpm cli:test
```

上述命令不足以证明 Page 可用。M2 必须补充相应消费者路由测试，再执行消费者类型检查、生产构建和 HTTP 访问验证。

## 14. 发布与回退

1. 先发布理解新元数据和目标路径的 CLI，再发布需要该能力的 Page；文档写明最低支持版本。
2. 使用现有不可变 release 快照验证整个闭包，包括 Component 所有权变更；历史快照不重写、不删除。
3. 旧 Registry 名称、包导出、文档 slug 和文件目标继续有效。新增共享条目后，旧条目的依赖链必须在同一快照内完整可安装。
4. 首批稳定后再把新页面安装入口加入文档；未通过的候选只保留规划状态。
5. 发布有问题时回退可变入口与文档推荐的版本；已安装到用户项目的源码不会自动恢复，需要用户项目版本控制或显式重新安装固定快照。

## 15. 明确的取舍

本方案不采用“35 个 Block 直接全部改为 Page”，原因是其中存在大量应继续嵌入的表格、Trace、编辑器、指标与外壳，且旧用户没有请求新增路由。

本方案也不采用“所有整页 Block 先拆成大量 Component”。只拆有复用证据和稳定接口的公共能力；Page 保持薄适配层，避免制造另一套平行的页面实现。

最终的交付判断是：**Component 能独立组合，Block 能嵌入，Page 能访问，Template 能把多个页面连成可继续开发的应用起点。** 每层都必须通过真实安装与使用验证，类型标签本身不作为完成标准。
