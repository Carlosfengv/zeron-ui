# AI Gateway Session List 01 方案

## 1. 结论与本阶段产物

新增独立 React `data-block`：`ai-gateway-session-list-01`，用于展示 AI Gateway 的 session 列表。

它沿用 `ai-gateway-overview-01` 的语义、数据单位和页面密度，并与总览 Block 复用同一个 `AiGatewayWorkspaceSidebar`。默认导航将 Sessions 设为当前项；已有相同工作区外壳的宿主可用 `sidebar={false}` 关闭内置侧栏，避免重复主导航。

当前实现包含：

- 将截图中的 7 条 session 转成确定性的 TypeScript mock 数据；
- 定义列表、查询、分页、facet 和回调类型；
- 实现共享 Sidebar、PageLayout、DataTable、筛选、分页、状态和响应式方案；
- 接入 Registry、docs preview 和受控交互；真实 API 请求仍由宿主负责。

## 2. 截图基线

截图展示一个无独立页面标题的列表内容区。最终页面仍应由 `PageHeader` 提供唯一的 `h1`，列表主体按截图组织：

1. 顶部筛选栏：搜索、Agent、User、Model、Errors only；
2. 中部圆角表格：Session、Agent、Model、Customer、Turns、Tokens、Cost、Created at；Session 单元格第二行显示 Last active；
3. 底部使用 `DataTable` 原生分页：每页条数、当前页/总页数、首页、上一页、下一页和末页。

桌面截图的关键视觉约束：

- 搜索框使用 `resource-list-table-01` 的 `max-w-md`，三个 FacetedFilter 随工具栏换行；
- Session 列是主列，第一行使用普通表格文本显示 session，不使用 Badge，并保持单行截断；第二行显示 Last active；
- outcome 以绿色或红色圆点显示，但必须同时提供可访问文本；
- Model 使用弱强调 pill；无模型调用显示 `no-model-call`；
- 数字列右对齐并使用 tabular numbers；
- 表格为 `rounded-xl`、细边框、白色浮层；
- 分页区完全使用 `DataTablePagination` 的原生布局与组件样式；统一间距、禁用状态和文案由公共组件 API 提供，不通过内部 slot 选择器覆盖。

截图中的文字与数值仅作为 mock 和视觉基线，不作为产品指令或真实业务数据。

## 3. Block 边界与 PageLayout

```text
ai-gateway-session-list-01
├─ AiGatewayWorkspaceSidebar（与 Overview 1 同源，Sessions active）
└─ PageLayout size="full"
      ├─ PageHeader
      │  └─ PageHeaderContent
      │     └─ Current location：Sessions
      └─ PageContent
         └─ PageBody className="max-w-none p-3"
            └─ section
               └─ DataTable
                  ├─ SessionFilterToolbar
                  ├─ Table（只拥有横向滚动）
                  └─ DataTablePagination（原生）
```

布局所有权：

- `SidebarProvider` 与共享 Sidebar 负责桌面导航和窄屏抽屉；
- `PageLayout` 负责页面宽度和内容区域；
- `PageBody` 使用 `max-w-none p-3`，是唯一主纵向滚动区；
- `DataTable` 只处理表格横向 overflow；
- toolbar 与 pagination 属于 session 列表表面，不再使用 `ResourceListLayout` 的同名 slot；
- 根节点不创建 `AppShell`、`main` 或固定 viewport height。
- `PageBody` 下复用 `resource-list-table-01` 的 `section > DataTable > toolbar` 结构以及对应的 InputGroup、DataTable 和工具栏布局类，不另建一套视觉规则。

## 4. 组件选择

| 区域 | Zeron 组件 | 方案 |
| --- | --- | --- |
| 工作区 | `SidebarProvider` + `AiGatewayWorkspaceSidebar` | 与 `ai-gateway-overview-01` 共用侧栏实现，Sessions active |
| 页面 | `PageLayout`、`PageHeader`、`PageContent`、`PageBody` | 基础列表页；宿主可传 `sidebar={false}` |
| 搜索 | `InputGroup` + `InputGroupAddon` + `InputGroupInput` | 搜索 session id 或 trace name |
| Agent/User/Model | `DataTableFacetedFilter` | 与 `resource-list-table-01` 一致的单选 FacetedFilter；空选表示不过滤 |
| 仅错误 | `Checkbox` | 即时布尔筛选，完整 label 可点击 |
| 表格 | `DataTable` + `useDataTable` | 复用行激活、loading、empty 和横向滚动能力 |
| Session | 普通文本 + 状态圆点 | Session 名称不使用 Badge；成功/失败由独立语义色圆点和可访问文本表达 |
| Model | `Badge` + 模型品牌 Logo | Logo 位于模型名称左侧；DeepSeek 使用品牌图标，未知模型回退通用图标，`model=null` 显示 `no-model-call` |
| 分页 | `DataTablePagination` | 使用 DataTable 原生分页，支持每页 10/20/30/40/50 条、页码及首/前/后/末页操作 |
| 加载/空/错误 | DataTable loading、`Empty`、`InlineNotice` | 三种状态不混用 |

不选择 `resource-list-page-01`，因为其 Sidebar 与 AI Gateway 工作区导航结构不同；不直接使用 `ResourceListTable`，因为该 Block 的资源字段、批量选择、创建/编辑动作和 session 可观测性列表不匹配。

## 5. 数据契约

类型文件：

- `packages/blocks/src/application/ai-gateway-session-list-01/ai-gateway-session-list-types.ts`

### 5.1 Session 行

`AiGatewaySessionItem` 使用原始值，不接收预格式化字符串：

- `id`：稳定 session ID；`traceName=null` 时作为显示回退；
- `traceName`：可选 trace 标题；
- `outcome`：`succeeded | failed`；
- `agent/user/model/customer`：可为空的 `{ id, label }`；
- `turnCount`、`inputTokens`、`outputTokens`：非负整数；
- `costMicros`：货币的百万分之一，和总览 Block 一致；
- `lastActiveAt`：ISO 8601 UTC，用于 Session 第二行的最近活跃时间；
- `createdAt`：ISO 8601 UTC，用于末列的创建时间。

表格中的 Tokens 由 `inputTokens + outputTokens` 得到，不让调用方再传一个可能不一致的 `totalTokens`。费用货币来自页面响应的 `currency`，避免每行重复。

### 5.2 列表响应

`AiGatewaySessionListData` 包含当前页 `items`、筛选后的 `total`、`currency`、`generatedAt` 和 facet 选项。分页状态只存在于受控 `query`，避免响应与查询出现两个状态源。Facet count 使用当前权限和基础时间范围计算，不受当前分页影响，并作为权威数量直接传给 `DataTableFacetedFilter`。

### 5.3 查询状态

`AiGatewaySessionListQuery` 是宿主受控状态：

```ts
{
  search: string;
  agentId: string | null;
  userId: string | null;
  modelId: string | null;
  errorsOnly: boolean;
  pageIndex: number;
  pageSize: number;
}
```

`null` 表示不过滤该实体。当前截图不要求单独筛选“无模型调用”，因此 `modelId=null` 保留“全部模型”语义；`model=null` 只影响行展示。

## 6. Mock 数据

Mock 文件：

- `packages/blocks/src/application/ai-gateway-session-list-01/ai-gateway-session-list-demo-data.ts`

固定生成时间为 `2026-09-10T10:00:00.000Z`，便于截图测试，不使用运行时 `Date.now()`。共提供 13 条 Session，其中 12 条分别归属 WorkBuddy、Codex 和 Claude Code，另保留 1 条无 Agent、无模型调用的 smoke session。数据覆盖成功、失败、长标题、短标题、空实体、无模型调用、零费用、极端 token 数，以及分钟、小时、天、7 天和超过 7 天的最近活跃时间。

| Session 显示值 | Agent | Outcome | Model | Turns | Tokens | Cost |
| --- | --- | --- | --- | ---: | ---: | ---: |
| 你是 Ria，一个桌面 AI 助手… | WorkBuddy | succeeded | deepseek-v4-pro | 1 | 41.4K | $0.01 |
| 你是 Ria，一个桌面 AI 助手… | Codex | failed | deepseek-v4-pro | 1 | 213.9K | $0.03 |
| 你是 Ria，一个桌面 AI 助手… | Claude Code | succeeded | deepseek-v4-pro | 1 | 16.1K | $0.0066 |
| 我的桌面上有哪些内容 | WorkBuddy | succeeded | deepseek-v4-pro | 1 | 36.4K | $0.0085 |
| 哎呀妈呀，你这干劲儿挺足啊… | Codex | failed | deepseek-v4-pro | 1 | 15.5K | $0.0030 |
| 你都可以做什么 | Claude Code | succeeded | deepseek-v4-pro | 1 | 15.5K | $0.0035 |
| ria-smoke-session-537945 | — | succeeded | no-model-call | 1 | 2 | $0 |
| 整理今天的会议纪要并生成待办事项 | WorkBuddy | succeeded | deepseek-v4-pro | 4 | 14.1K | $0.0042 |
| 修复 API 网关请求超时并补充回归测试 | Codex | succeeded | deepseek-v4-pro | 8 | 88.7K | $0.0187 |
| 分析仓库依赖并输出重构建议 | Claude Code | succeeded | deepseek-v4-pro | 6 | 59.1K | $0.0123 |
| 同步日历与邮件中的本周安排 | WorkBuddy | failed | deepseek-v4-pro | 3 | 10.1K | $0.0021 |
| 为 Session 列表补充分页和筛选测试 | Codex | succeeded | deepseek-v4-pro | 5 | 31.9K | $0.0076 |
| 审查鉴权中间件的权限边界 | Claude Code | succeeded | deepseek-v4-pro | 7 | 53.1K | $0.0119 |

这些 ID、标题、时间和 token 拆分均为 demo 数据，不应被消费应用当作后端种子数据。

## 7. 格式化规则

- Tokens：列表使用 `Intl.NumberFormat(locale, { notation: "compact" })`；完整值写入 accessible label 或 title；
- Cost：根据 `currency` 和 `costMicros / 1_000_000` 格式化；保留足够有效小数以显示 `$0.0066`，零值显示 `$0`；
- 最近活跃时间：位于 Session 第二行，仅显示时间值，不显示 `Last active:` 前缀。默认使用响应的 `generatedAt` 作为时间基准；7 天内按分钟、小时或天显示相对时间，少于一分钟显示“现在”；严格超过 7 天显示 `YYYY年 M月D日 HH:mm:ss`；title 始终提供相同格式的绝对时间；
- Created at：末列按 `YYYY年 M月D日 HH:mm:ss` 显示，例如 `2026年 7月31日 12:21:29`；
- 宿主可通过 `dateTimeFormatter` 覆盖绝对时间格式，并通过 `renderModelLogo` 接入更多模型品牌；
- 空实体显示 `—`；
- `model=null` 显示 labels 中的 `noModelCall`；
- 长 session/model 文本单行截断，但可访问名称保留完整内容。

## 8. 筛选、分页与路由

- 搜索匹配 `id` 与 `traceName`，300ms debounce 由宿主数据 adapter 处理；
- Agent、User、Model FacetedFilter 改变时将 `pageIndex` 重置为 0；
- `errorsOnly=true` 仅返回 `outcome=failed`；
- 任一查询条件改变都调用 `onQueryChange`，Block 不发固定 URL 请求；
- 行只在 `onSessionOpen` 存在时可点击/键盘激活；没有 callback 时保持只读，不渲染伪链接；
- 上一页/下一页根据 `pageIndex`、`pageSize`、`total` 计算 disabled；缺少 `onQueryChange` 或处于 `refreshing` 时，搜索、筛选和分页全部禁用；
- 搜索与筛选建议同步到 URL，便于刷新、分享和浏览器前进后退。

推荐接口：

```http
GET /api/projects/:projectId/ai-gateway/sessions
  ?search=ria
  &agentId=...
  &userId=...
  &modelId=...
  &errorsOnly=true
  &page=1
  &pageSize=20
```

## 9. 数据校验

Adapter 在开发环境至少校验：

- `id` 唯一且非空；
- count、token、cost、page index、page size 为非负有限整数；
- `items.length <= pageSize`，`total >= items.length`；
- entity ID 非空；
- `lastActiveAt`、`createdAt` 与 `generatedAt` 可解析；
- currency 是可被 `Intl.NumberFormat` 接受的 ISO 4217 code；
- facet option ID 唯一、count 非负；
- 过期请求返回的 page/query 与当前 query 不一致时由宿主丢弃。

## 10. 状态

| 状态 | 行为 |
| --- | --- |
| 首次 loading | 保留 PageHeader 和 toolbar；DataTable 显示 7 行稳定高度 skeleton |
| refreshing | 保留旧行，列表区域 `aria-busy`，禁用搜索、筛选和分页请求 |
| 全局 empty | 显示“暂无 session”及说明 |
| 筛选 empty | 显示“没有符合条件的 session”，提供清除筛选操作 |
| error 无旧数据 | `InlineNotice` + Retry |
| error 有旧数据 | 保留旧行，在表格上方显示非阻断错误提示 |
| 无权限 | 不传 `onSessionOpen`，行保持只读；数据仍服从宿主权限 |

## 11. 响应式与无障碍

### `lg` 及以上

- toolbar 单行优先；搜索框使用 `max-w-md`，FacetedFilter 使用组件默认宽度；
- 表格内容最小宽度约 `1180px`；Session 列占主要空间；
- Turns/Tokens/Cost/Created at 右对齐，Session 下方的 Last active 保持不换行。

### 小于 `lg`

- toolbar 自动换行；搜索占满可用宽度，三个 FacetedFilter 和 checkbox 顺序换行；
- 不把 8 列压成卡片；保留 DataTable 横向滚动；
- PageBody 仍是唯一纵向滚动区；
- 原生分页在窄屏按组件约定重排；每页条数和前后翻页仍保持可操作。

无障碍要求：

- outcome 圆点有屏幕阅读器文本，不单独依赖颜色；
- toolbar、table、pagination 均有独立 aria label；
- 行激活支持 Enter/Space，并避免吞掉内部控件事件；
- disabled 分页按钮保持清晰状态和可理解 label；
- focus ring 不被圆角 surface 或横向滚动容器裁切。

## 12. 下一阶段文件落点

实现阶段建议新增：

- `packages/blocks/src/application/ai-gateway-session-list-01/ai-gateway-session-list.tsx`
- `packages/blocks/src/application/ai-gateway-session-list-01/index.ts`
- `docs/pages/blocks/ai-gateway-session-list-01/page.tsx`
- `tests/ai-gateway-session-list-contract.test.ts`

并更新：

- `packages/blocks/src/catalog.ts`
- `packages/blocks/package.json`
- `packages/blocks/block-capabilities.json`
- `packages/blocks/registry.json`
- `docs/manifest.ts`
- Registry 生成物

## 13. 实现验收条件

- 使用基础 `PageLayout`，并与 `ai-gateway-overview-01` 复用同一个 Sidebar 源码；
- 8 列、5 个筛选控件和 13 条 mock 正确显示，并可按三个 Agent facet 筛选；
- `inputTokens + outputTokens`、`costMicros`、UTC 时间在显示层格式化；
- 搜索、三个 FacetedFilter、Errors only 可组合，并在变化时重置分页；
- loading、refreshing、全局 empty、筛选 empty、error 均有明确 UI；
- 窄屏使用横向表格滚动，不产生第二个页面级纵向滚动；
- 行只在有回调时可交互，键盘和 focus 状态完整；
- PageBody 内容与 `resource-list-table-01` 保持同一层级、间距和组件样式；
- `ai-gateway-overview-01` 与 Session Block 只共享侧栏实现，不改变总览业务内容；分页直接使用公共 `DataTable` 的原生实现。
