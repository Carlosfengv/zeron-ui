# AI Gateway Overview 01 集成方案

## 1. 结论

建议新增一个 React `data-block`：`ai-gateway-overview-01`，用于承载 AI 网关的项目级可观测性总览。

Block 负责完整的 AI Gateway Overview 工作区，包括 Figma 左侧 `280px` Sidebar、Workspace/账号入口、顶部路由提示、页面标题、时间范围、刷新、摘要指标、时序图、分布图、Provider/操作/用户排行以及完整的数据状态。导航数据与行为仍可由宿主覆盖；已有产品外壳时可用 `sidebar={false}` 只渲染右侧 PageLayout。

选择 `data-block` 而不是静态 `template` 的原因是：该页面有清晰、可复用的数据和行为契约，必须支持真实后端数据、加载/刷新/错误状态和路由回调。Sidebar 随 Block 提供，但导航结构、链接、选中项和身份信息都通过受控配置覆盖，并可在已有 Shell 中关闭。

首版实现范围：

- 复现 Figma 中的 5 个摘要指标、1 个全宽请求趋势、4 个双列分析区、3 个 Metric series、延迟分布、费用分布、最慢操作和 Top users；
- 图表统一使用仓库现有的 shadcn chart API：`ChartContainer`、`ChartTooltip`、`ChartTooltipContent`，图形层使用 `recharts`；
- 数据由宿主受控传入，Block 内不直接请求固定 API、不绑定 TanStack Query/SWR，也不把 mock 当作已接入的生产数据；
- Sidebar、NavMenu、NavItem、SidebarIdentityRow、PageLayout 均复用当前组件库；使用现有 Zeron 语义 token 和图标上下文，不新增颜色 token、图标包、全局 CSS 或另一套图表封装；
- docs preview 单独使用确定性的 demo data，生产调用必须显式传入 `data`。

设计来源：[Figma 826:1391](https://www.figma.com/design/vzW0NZC4CGWhtbANTsJhrj/Zentirx-AI-%E7%BD%91%E5%85%B3?node-id=826-1391&t=ZgMIXRZThYksB2Rr-4)。Figma 当前没有 Code Connect 映射，以下方案以仓库实际组件源码和公开类型为准。

## 2. Figma 基线

完整节点为 `1728 × 2354px`：

- Sidebar：`280px`，桌面端常驻并进入 Block；低于 `xl` 断点时使用共享 Sidebar 的抽屉模式；
- 主区域：`1448px`，外边距 `12px`；
- 主内容表面：约 `1424px` 宽，内部数据区域 `1384px`；
- 主内容上下间距多为 `16px`，双列间距为 `20px`；
- 摘要指标：5 列，每列约 `260.8 × 132px`；
- Requests over time：`1384 × 370px`；
- Cost / Tokens：约 `698 × 346px` 与 `666 × 346px`；
- Requests by provider：`698 × 336px`；右侧 p95 latency / Error rate 各 `666 × 160px`；
- Metric series：3 列，每列约 `448 × 195px`；
- Latency distribution / Cost by provider：`918 × 398px` 与 `446 × 398px`；
- Slowest operations / Top users：两列，各约 `682 × 230px`；
- Section 圆角在 Figma 中主要为 `18px`，项目内使用最接近的 `rounded-2xl`（16px）；
- Section 内边距主要为 `16px`，卡片/列表间距为 `8px` 或 `12px`；
- 主值为 24px，标题为 14px，辅助文字为 12px。

Figma 当前数据示意：

| 区域 | 示例值 |
| --- | --- |
| Requests | `7` |
| Total cost | `$0.07` |
| p95 latency | `8482s` |
| Tokens | `338.8K` |
| Error rate | `29%` / `2 errors` |
| Provider | `deepseek.chat: 6`、`telemetry-smoke: 1` |
| Token split | `311.7K in`、`27.1K out` |
| Latency percentiles | `p50 13s`、`p95 8482s`、`p99 10909s` |
| Slowest operations | `chat 65s`、`invoke_agent 58s`、`execute_tool 3.9s` |

这些字符串只用于视觉基线。生产数据模型使用原始数值和明确单位，不让后端返回 `$0.07`、`338.8K` 或 `29%` 这类预格式化值。

## 3. Block 边界与布局所有权

```text
ai-gateway-overview-01
└─ SidebarProvider
   ├─ Sidebar（280px，桌面常驻 / 小屏抽屉）
   │  ├─ SidebarHeader：Workspace
   │  ├─ SidebarContent：分组 NavMenu / NavItem
   │  └─ SidebarFooter：Account
   └─ PageLayout
      ├─ PageHeader：当前位置 + 小屏 SidebarTrigger
      └─ PageContent
         └─ PageContent（唯一主纵向滚动区）
            └─ PageBody（最大宽度 1620px 的内容容器）
            ├─ PageTitle / PageDescription / PageActions
            ├─ GatewaySummaryGrid
            ├─ RequestsTrendCard
            ├─ CostAndTokenGrid
            ├─ ProviderAndQualityGrid
            ├─ MetricSeriesSection
            ├─ LatencyAndCostGrid
            └─ OperationAndUserGrid
```

Sidebar 是设计稿整体构图和模板信息架构的一部分，因此与右侧 PageLayout 一起交付。为避免把业务路由写死，Block 只提供默认结构，宿主通过 `sidebar` 配置及 `onNavigationSelect`、`onWorkspaceSelect`、`onAccountSelect` 接管数据和行为。若消费页面已经位于同一产品 Shell，可显式禁用 Sidebar。

`PageContent` 是页面唯一主纵向滚动区；`PageBody` 仅作为最大宽度为 `1620px` 的内容容器，并在更宽视口中居中。每个图表只拥有自身绘制区域，不添加纵向 `overflow-auto`。Provider/操作列表在极窄宽度下允许内部内容换行，但不创建第二个页面级滚动容器。

## 4. 组件映射

| Figma 区域 | 当前项目组件 | 建议实现 | 说明 |
| --- | --- | --- | --- |
| 工作区导航 | `Sidebar`、`NavMenu`、`NavItem`、`SidebarIdentityRow` | `280px`，`breakpointBehavior="drawer"` | 复现设计稿桌面导航，小屏复用抽屉契约 |
| 页面布局 | `PageLayout` | `size="full"`、默认 gutter | 与 Sidebar 并列，占满剩余宽度 |
| 标题与描述 | `PageHeader`、`PageHeaderContent`、`PageTitle`、`PageDescription` | 标题、说明和控制同层 | 页面只保留一个 `h1` |
| 时间范围 | `Tabs` + `TabsList` + `TabItem` | `variant="segment"`、`color="default"`、受控 value | 使用项目现有 Tabs 交互；这是即时切换数据窗口，不渲染静态 TabPanel |
| 刷新 | `Button` | `iconOnly`、`size="md"`、`variant="tertiary"`、`useIcon("rotate-ccw")` | `refreshing` 时使用 Button loading/disabled |
| 摘要指标 | 业务 `GatewaySummaryTile` + `MetricCard` | 外层负责图标/浅色表面；内部 `MetricCard` 使用透明无边框外观 | 保留 MetricCard 的数值、状态和可访问行为，同时补足设计中的 leading icon |
| 数据 Section | `Card`、`CardHeader`、`CardContent` | `rounded-2xl border-0 bg-hover` | 被动数据面板，不添加 Card 点击态 |
| 标题/主值/辅助值 | `CardHeader` 内普通语义文本 | `text-body` / `text-heading` / `text-label` | 不新增 Typography primitive |
| 图表容器 | `ChartContainer` | 每个图表独立 `ChartConfig` 与 `aria-label` | 使用仓库的 shadcn chart API |
| 图表提示 | `ChartTooltip` + `ChartTooltipContent` | 统一日期、数量、费用、Token、延迟格式化 | 不自建另一套 tooltip |
| Metric series 坐标轴 | Recharts `XAxis` + `YAxis` | 底部时间刻度；左侧按 `%`、`ms` 或普通数值格式化 | 三张图保持相同高度和三档数值刻度 |
| Provider 成本构成 | `ProviderCostDonut` + 数据标注列表 | 宽屏左右两栏，环图使用相对半径；窄屏纵向堆叠 | 保持颜色标记、Provider 名称与金额一一对应 |
| 摘要/类别标签 | `Badge` | percentile、operation kind | 文本与颜色并存 |
| 空状态 | `Empty` | `scope="inline"` 或 `section` | 图表无数据时不渲染“空 Recharts” |
| 错误 | `InlineNotice` | 页面或局部刷新错误，可选 Retry | 保留旧数据时作为非阻断错误 |
| 加载 | `Skeleton`、`MetricCard state="loading"` | 首次加载显示稳定高度骨架 | 避免页面大幅跳动 |
| 图标 | `useIcon` | 请求、费用、时钟、Token、错误使用现有最接近图标 | 不使用 Figma 临时 SVG，不新增图标依赖 |

### 4.1 为什么不直接复用 AvailabilityMonitor

`availability-monitor-01` 的数据契约是 uptime、72 小时状态条和 routed/direct availability 对比，核心任务与本页的成本、Token、错误、分位延迟和 Provider 归因不同。直接嵌套会带来重复标题、重复指标和不匹配的数据模型。

本 Block 复用它已经验证过的实现模式：`ChartContainer`、`ChartTooltipContent`、Recharts `accessibilityLayer`、`locale`/`timeZone` 格式化和受控数据；不把整个 Block 当作依赖。

### 4.2 MetricCard 的适配边界

`MetricCard` 当前没有 leading icon slot，而 Figma 的五张摘要卡顶部有 `32px` 图标区。首版不修改公共 `MetricCard` API，使用 Block 内部的 `GatewaySummaryTile`：

```tsx
<section className="rounded-2xl bg-hover p-4">
  <GatewayMetricIcon name="requests" />
  <MetricCard
    className="mt-2 border-0 bg-transparent p-0"
    label="Requests"
    value={formattedRequests}
    state={state}
  />
</section>
```

这里只调整 `MetricCard` 根外观；不通过祖先 selector 改写其 label、value、focus、loading 或内部 slot。若 leading icon 以后被多个业务 Block 重复需要，再单独评估为 `MetricCard` 增加公开 slot。

## 5. 图表映射（shadcn chart）

所有图表从 `@zeron/ui/chart` 导入 `ChartContainer`、`ChartTooltip`、`ChartTooltipContent`，从 `recharts` 导入几何组件。不要直接使用 Figma 导出的 SVG/PNG 图表。

| Figma 图表 | Recharts 组件 | 数据字段 | 关键配置 |
| --- | --- | --- | --- |
| Requests over time | `AreaChart` + `Area` | `requestCount` | 品牌色线条、低透明渐变填充、Y Grid、time XAxis |
| Cost over time | `BarChart` + `Bar` | `costMicros` | 单系列品牌色、费用 tooltip、零值保持基线 |
| Tokens over time | `AreaChart` + `Area` | `inputTokens`、`outputTokens` | 建议堆叠两系列；标题显示合计和 in/out |
| Requests by provider | 横向 `BarChart` | `requestCount` by provider | `layout="vertical"`、隐藏数值轴、名称轴、右侧值标签 |
| p95 latency | `AreaChart` 或 `LineChart` | `p95LatencyMs` | 小型 sparkline、无 YAxis、tooltip 显示格式化时长 |
| Error rate | `BarChart` + `Bar` | `errorRate` | danger 语义色；tooltip 同时显示错误数和百分比 |
| Metric series × 3 | `AreaChart` 或 `LineChart` | generic `value` | 每张卡独立 config、aggregation Badge、共享时间格式化 |
| Latency distribution | `BarChart` + `Bar` + `ReferenceLine` | histogram `count` | bucket 直方图；p50/p95/p99 参考线与文字 |
| Cost by provider | `PieChart` + `Pie` + `Cell` | `costMicros` | donut；中心显示总费用；右侧列表显示金额与比例 |
| Slowest operations | 普通列表 + 进度条 | `p95LatencyMs` | 设计是可导航列表，不强行使用图表 |
| Top users | 普通列表或 `Empty` | `requestCount` | 无 user id 时显示明确空状态 |

### 5.1 ChartConfig 与颜色

建议按图表就近定义配置，不创建全局业务色盘：

```ts
const requestChartConfig = {
  requests: { label: "Requests", color: "var(--brand)" },
} satisfies ChartConfig;

const tokenChartConfig = {
  inputTokens: { label: "Input tokens", color: "var(--brand)" },
  outputTokens: { label: "Output tokens", color: "var(--info-border)" },
} satisfies ChartConfig;

const errorChartConfig = {
  errorRate: { label: "Error rate", color: "var(--danger-border)" },
} satisfies ChartConfig;
```

Provider 多色 donut 需要稳定、语义安全的序列色。首版最多显示 5 个 Provider，其余合并为 `Other`，颜色按稳定索引从现有 token 中选择：`--brand`、`--info-border`、`--success-border`、`--warning-border`、`--neutral-status-border`。颜色只能辅助识别；legend 始终显示 Provider 名、金额和比例。

### 5.2 图表数据约束

- 所有点按时间升序传入；时间戳使用 ISO 8601 UTC 字符串；显示时使用 `timeZone`；
- `1d`/`7d` 推荐小时粒度（分别最多 24/168 点），`30d`/`90d` 推荐日粒度；服务端先聚合，Block 不处理无限原始 traces；
- `null` 表示未采集或不可计算，`0` 表示已采集且值为零；折线必须断开 `null`，不能把它画成 0；
- summary 的 p95/p99 必须由服务端根据窗口内原始分布计算，不能对 daily p95 再求平均；
- error rate 使用 `0..1` 比例，显示层通过 `Intl.NumberFormat({ style: "percent" })` 格式化；
- 费用使用整数 `costMicros`，`1 currency unit = 1_000_000 micros`，避免小额费用浮点误差；
- 直方图 bucket 采用 `[lowerMs, upperMs)`；最后一档允许 `upperMs = null` 表示无上界；
- donut 总费用为 0 时显示 `Empty`，不要绘制看似 100% 的零值圆环。

### 5.3 可访问性

- 支持的 Recharts 图使用 `accessibilityLayer`；
- 每个 `ChartContainer` 提供独立 `aria-label`，包含指标和当前时间范围；
- tooltip 不是唯一信息来源：标题区显示总值，Provider/operation 图旁保留文本列表或可读标签；
- Error rate 不只用红色表达，始终显示错误数和百分比；
- 参考线标签必须有文本 `p50`、`p95`、`p99`；
- loading、empty、error 不进入同一视觉分支，避免屏幕阅读器把“无数据”误报为“仍在加载”。

## 6. 样式与变量映射

| Figma 变量/硬编码值 | Zeron 实现 | 用途 |
| --- | --- | --- |
| `Background/--background-2 #f6f8fb` | `bg-surface-base` | 页面基底 |
| `Background/--background-1 #fff` / `Base/White` | `bg-surface-floating` / `bg-card` | 主内容和浮动列表 |
| `Fill/--fill-1 #dce3ef40` | `bg-hover` | 数据 Section 浅色表面 |
| `Border/--border rgba(52,57,71,.12)` | `border-border` | 必要边框 |
| 更弱的分隔线 | `border-border-subtle` | Grid、列表分隔 |
| `Text/--foreground #00030a` / `#0d0d0d` | `text-fg-default` | 标题和主值 |
| `Text/--muted-foreground #00030a99` / `#5d5d5d` | `text-fg-subtle` | 辅助说明、坐标轴 |
| 设计主蓝 `#155dfc` | `var(--brand)` / `text-fg-brand` | 主系列、强调值 |
| 设计浅蓝 `#60a5fa` | `var(--info-border)` | 次系列、Provider 区分 |
| 红色错误柱 | `var(--danger-border)` | Error rate |
| 灰色 track `#e5e5e5` | `var(--input)` | 进度轨道 |
| 白色列表轻阴影 | `shadow-raised` | Provider/operation row |
| 14/20 | `text-body` | 面板标题、正文 |
| 12/16 | `text-label` | meta、axis、legend |
| 24/36 主值 | `text-heading` | 项目采用 24/32，保持系统排版 |
| 20/26 Section 标题 | `text-title` | Metric series 标题 |
| 8 / 12 / 16 / 20 间距 | `gap-2` / `gap-3` / `gap-4` / `gap-5` | 避免自定义 spacing token |
| 18px Section 圆角 | `rounded-2xl` | 使用最接近的系统值 16px |
| 10px row 圆角 | `rounded-lg` 或 `rounded-xl` | 按 Zeron 控件/表面语义选择 |

字体继续使用项目的 `Inter, system-ui, sans-serif`。不为 Figma 中出现的 PingFang SC、Geist Variable、Paper Mono 单独增加字体依赖；operation 名称如需等宽效果，优先使用项目已有的 `font-mono` fallback。

不要把 Figma 的 light-only hex 直接写入 Block。语义 token 已提供 dark mode 值，图表 `ChartConfig` 也应引用 CSS 变量而不是固定颜色。

## 7. 推荐公开数据契约

```ts
export type GatewayOverviewRange = "1d" | "7d" | "30d" | "90d";
export type GatewayOverviewStatus =
  | "ready"
  | "loading"
  | "refreshing"
  | "error";

export interface GatewayOverviewWindow {
  range: GatewayOverviewRange;
  from: string;
  to: string;
  granularity: "hour" | "day";
  timeZone: string;
  currency: string;
  generatedAt: string;
}

export interface GatewayOverviewSummary {
  requestCount: number;
  costMicros: number;
  inputTokens: number;
  outputTokens: number;
  errorCount: number;
  errorRate: number;
  p50LatencyMs: number | null;
  p95LatencyMs: number | null;
  p99LatencyMs: number | null;
}

export interface GatewayOverviewTimePoint {
  timestamp: string;
  requestCount: number;
  costMicros: number;
  inputTokens: number;
  outputTokens: number;
  errorCount: number;
  errorRate: number | null;
  p95LatencyMs: number | null;
}

export interface GatewayProviderBreakdown {
  id: string;
  name: string;
  requestCount: number;
  costMicros: number;
}

export interface GatewayLatencyBucket {
  id: string;
  lowerMs: number;
  upperMs: number | null;
  count: number;
}

export interface GatewayMetricSeries {
  id: string;
  label: string;
  aggregation: "sum" | "avg" | "p50" | "p95" | "p99";
  unit: "count" | "tokens" | "milliseconds" | "percent";
  currentValue: number | null;
  points: readonly {
    timestamp: string;
    value: number | null;
  }[];
}

export interface GatewayOperationLatency {
  id: string;
  name: string;
  kind: "llm" | "agent" | "tool" | "other";
  p95LatencyMs: number;
}

export interface GatewayUserUsage {
  id: string;
  label: string;
  requestCount: number;
}

export interface AiGatewayOverviewData {
  window: GatewayOverviewWindow;
  summary: GatewayOverviewSummary;
  timeSeries: readonly GatewayOverviewTimePoint[];
  providers: readonly GatewayProviderBreakdown[];
  latencyDistribution: readonly GatewayLatencyBucket[];
  metricSeries: readonly GatewayMetricSeries[];
  slowestOperations: readonly GatewayOperationLatency[];
  topUsers: readonly GatewayUserUsage[];
}

export interface AiGatewayOverviewActions {
  onRangeChange?: (range: GatewayOverviewRange) => void;
  onRefresh?: () => void | Promise<void>;
  onRetry?: () => void | Promise<void>;
  onProviderSelect?: (provider: GatewayProviderBreakdown) => void;
  onOperationSelect?: (operation: GatewayOperationLatency) => void;
  onUserSelect?: (user: GatewayUserUsage) => void;
}

export interface AiGatewayOverviewProps
  extends Omit<React.ComponentPropsWithoutRef<"section">, "children"> {
  data: AiGatewayOverviewData | null;
  range: GatewayOverviewRange;
  status?: GatewayOverviewStatus;
  error?: string | null;
  actions?: AiGatewayOverviewActions;
  availableRanges?: readonly GatewayOverviewRange[];
  labels?: Partial<AiGatewayOverviewLabels>;
  locale?: string;
  timeZone?: string;
}
```

契约规则：

- `data` 和 `range` 必须由宿主显式提供；Block 默认不展示 demo data；
- `status="loading"` 且 `data=null` 是首次加载；`status="refreshing"` 保留现有 data 并显示非阻断进度；
- `status="error"` 且有旧 data 时显示 `InlineNotice` 并保留图表；没有 data 时显示完整错误状态；
- `timeZone` prop 如传入，覆盖 `data.window.timeZone`；时间戳仍始终使用 UTC ISO 字符串；
- `currency` 使用 ISO 4217 代码，并由 `Intl.NumberFormat` 格式化；
- `inputTokens + outputTokens` 是总 Token；不要让调用方重复传一个可能不一致的 `totalTokens`；
- 所有数组使用稳定 ID；图表点可使用 timestamp 作为稳定键；
- Provider share、最大 operation bar 比例等可安全从同一数组计算；窗口 summary 不从聚合时序反推；
- callback 不存在时，对应内容保持只读，不渲染伪链接或 no-op 控件；
- Top users 只显示后端允许暴露的聚合标识，不默认展示邮箱等个人信息。

## 8. 数据对接方案

### 8.1 推荐边界

Block 不内置 URL、鉴权或请求库。消费应用负责：

1. 从当前路由/Workspace context 取得稳定的 `projectId`；
2. 根据受控 `range` 请求后端；
3. 将 API DTO 适配成 `AiGatewayOverviewData`；
4. 将 loading、refreshing、error 状态和操作回调传入 Block；
5. 在 Provider/operation/user 点击回调中使用宿主路由跳转到带筛选条件的 Traces 页面。

建议单端点返回同一统计窗口的完整快照，避免 10 个小接口产生窗口不一致和瀑布请求：

```http
GET /api/projects/:projectId/ai-gateway/overview?range=30d&timeZone=Asia%2FShanghai
```

响应体直接匹配 `AiGatewayOverviewData`，并在 `window` 中回显实际 `from`、`to`、`granularity`、`timeZone`、`currency` 和 `generatedAt`。

### 8.2 请求与状态流

```text
range change
  -> host updates URL/query state
  -> cancel superseded request
  -> keep previous data + status=refreshing
  -> map DTO and atomically replace snapshot
  -> status=ready

refresh failure with previous data
  -> keep previous data
  -> status=error + error message
  -> allow retry

initial failure without data
  -> data=null + status=error
  -> render full error state
```

建议把 `range` 同步到 URL query（例如 `?range=30d`），便于刷新、分享和浏览器前进后退。宿主可使用现有的数据层或原生 `fetch`，Block 不新增 React Query/SWR 依赖。

### 8.3 后端聚合要求

- 同一响应的所有区域必须使用相同统计窗口和数据权限；
- 1d/7d 最多分别返回 24/168 个小时点，30d/90d 返回日点，避免把 trace 原始事件发送到浏览器；
- 服务端计算 p50/p95/p99、直方图 bucket、总错误率和 Top-N；
- Provider 以稳定 ID 聚合，显示名允许变化；
- 最多返回 5 个 Provider、3 个最慢操作、5 个用户；其余项在服务端或 adapter 合并为 `Other`；
- 费用以 `costMicros` 整数返回；Token、请求、错误为非负整数；
- 对无采样的 latency 使用 `null`，不要返回 0；
- Top users 必须服从租户权限和隐私策略；没有 user id 时返回空数组，而不是伪造 anonymous 用户。

### 8.4 数据校验与容错

开发环境中 adapter 应校验：

- `window.from < window.to`，range 与响应窗口相符；
- timestamp 有效、升序且位于窗口内；
- `errorRate` 位于 `0..1`；
- count/token/cost 非负且有限；
- latency bucket 不重叠并按 lowerMs 升序；
- Provider、operation、user ID 唯一；
- `generatedAt` 可解析。

异常单点不要让整个 Recharts 崩溃：adapter 将无效数值转换为 `null` 并记录诊断；结构性错误则进入页面 error 状态。

## 9. 状态与交互

### 时间范围

- 默认设计状态为 `30d`；实际选中值完全由 `range` prop 决定；
- 只渲染 `availableRanges` 中的范围；
- 有 `onRangeChange` 时范围按钮可交互；没有时显示只读范围，不提供 no-op 按钮；
- 范围切换保留旧内容并进入 refreshing，避免全页闪白；
- 返回结果的 `data.window.range` 与当前受控 range 不一致时，不覆盖当前页面，宿主应丢弃过期响应。

### 刷新

- 仅在 `onRefresh` 存在时显示刷新按钮；
- refreshing 期间按钮显示 loading 并阻止重复触发；
- 刷新不重置 range、滚动位置或当前路由；
- 刷新失败保留旧数据，并显示最后生成时间。

### 业务下钻

- Provider 行点击调用 `onProviderSelect`，宿主可跳转到 `Traces?providerId=...&from=...&to=...`；
- Operation 行点击调用 `onOperationSelect`，宿主可跳转到 span/trace 筛选；
- User 行点击调用 `onUserSelect`，宿主负责权限校验和路由；
- 没有 callback 时渲染普通行，不用 `<a href="#">` 或空 Button 模拟交互。

## 10. Loading、Empty、Error 和边界状态

| 状态 | UI 行为 |
| --- | --- |
| 首次 loading | Header 保留；5 张摘要骨架和各图表稳定高度骨架 |
| refreshing | 保留现有图表，Header 控制显示 loading，根区域 `aria-busy` |
| 完整 empty | summary 可显示 0；图表区使用统一“当前时间范围暂无网关活动”空状态 |
| 单图无数据 | 该卡使用 `Empty scope="inline"`，其他卡正常 |
| error 无旧数据 | 页面级 `InlineNotice`/错误区，提供 Retry |
| error 有旧数据 | 顶部非阻断 Notice，标明数据生成时间，图表保留 |
| Provider 为空 | Provider requests 和 cost donut 分别显示空状态 |
| Latency 为空 | p50/p95/p99 显示 `—`，直方图显示无采样说明 |
| Top users 为空 | 显示 Figma 文案含义：当前时间范围的 traces 未包含 user id |
| 极大值 | `Intl.NumberFormat` compact display；tooltip 提供完整值 |
| 长 Provider/operation 名 | 单行截断，tooltip/accessible name 保留完整文本 |

空数组和失败不能混为一谈；0 请求是确认的零数据，`null` 是未知/未采集。

## 11. 响应式方案

### `xl` 及以上

- Summary：5 列；
- Requests over time：全宽；
- Cost / Tokens：两列；
- Requests by provider 与 quality stack：两列；
- Metric series：3 列；
- Latency distribution / Cost by provider：`2fr + 1fr`；
- Slowest operations / Top users：两列。

### `md` 到 `xl`

- Summary：2 或 3 列，最后一张自然换行；
- 所有大分析区改为单列；
- Metric series：2 列，第三张换行；
- 图表高度保持 180–260px，不按桌面宽高比无限增高。

### 小于 `md`

- Summary：单列或两列（以最小卡宽 11rem 为准）；
- PageHeader actions 换行，时间范围和刷新保持可触达；
- Provider/operation 行拆成名称和数值两行；
- donut 与 legend 上下排列；
- histogram 标签减少密度，但 tooltip 与 percentile 文本保留；
- 不给整个页面增加横向滚动；极长图例在局部截断。

不使用 Figma 固定 `1384px` 宽度和固定页面高度。固定像素仅用于图表合理高度和少数最小宽度，网格使用响应式 `minmax(0, 1fr)`。

## 12. 文件落点

### Block 源码

- `packages/blocks/src/application/ai-gateway-overview-01/ai-gateway-overview.tsx`
- `packages/blocks/src/application/ai-gateway-overview-01/ai-gateway-overview-types.ts`
- `packages/blocks/src/application/ai-gateway-overview-01/ai-gateway-overview-charts.tsx`
- `packages/blocks/src/application/ai-gateway-overview-01/ai-gateway-overview-demo-data.ts`
- `packages/blocks/src/application/ai-gateway-overview-01/index.ts`
- `packages/blocks/src/catalog.ts`
- `packages/blocks/block-capabilities.json`
- `packages/blocks/package.json`
- `packages/blocks/registry.json`

Registry 建议：

```json
{
  "framework": "react",
  "kind": "data-block",
  "dependencies": ["recharts", "tw-animate-css"],
  "registryDependencies": [
    "badge",
    "button",
    "button-group",
    "card",
    "chart",
    "empty",
    "icon-context",
    "inline-notice",
    "metric-card",
    "page-layout",
    "skeleton",
    "utils"
  ]
}
```

### 文档与预览

- `docs/pages/blocks/ai-gateway-overview-01/page.tsx`
- `docs/pages/blocks/ai-gateway-overview-01/AiGatewayOverviewBlockDocClient.tsx`
- `docs/content/en/blocks/ai-gateway-overview-01.json`
- `docs/content/zh-CN/blocks/ai-gateway-overview-01.json`
- `docs/manifest.ts`
- `docs/catalog/artifacts.ts`
- `docs/components/blocks/standalone-blocks.ts`
- 对应生成的 docs loader 文件

### 测试与生成产物

- `tests/ai-gateway-overview-contract.test.ts`
- `tests/ai-gateway-overview-data.test.ts`
- `tests/ai-gateway-overview-interaction.test.tsx`
- `public/r/ai-gateway-overview-01.json`
- `public/r/registry.json`

公开 Registry 产物通过 `pnpm registry:build` 生成，不手写生成后的组件源码。

## 13. 实施顺序

1. 建立 types、labels、formatters 和确定性 demo data。
2. 用 `PageLayout` / `PageHeader` / `PageContent` 建立页面结构和滚动所有权。
3. 实现受控 range、refresh 和错误状态。
4. 实现 `GatewaySummaryTile`，内部复用 `MetricCard`。
5. 实现统一的 `GatewayChartCard` 业务组合，接入 shadcn chart tooltip 和格式化。
6. 完成 requests、cost、tokens、latency、error、generic metric series 图表。
7. 完成 Provider 横条、latency histogram、cost donut、operation/user 列表与下钻 callback。
8. 补齐 loading、refreshing、empty、partial empty、error、长文本、零值和 null 状态。
9. 添加 package export、catalog、capability、Registry、docs 和双语内容。
10. 生成 Registry 产物，执行契约/交互测试、typecheck、lint、build，并在桌面/平板/移动宽度对照 Figma。

## 14. 验收标准

- 源码仓库内部可从 `@zeron/blocks/ai-gateway-overview-01` 导入；外部项目通过 Registry 安装并使用项目的 `components` alias；
- Registry 类型为 React `data-block`，生产用法必须显式提供 data 和 range；
- Block 默认包含与 Figma 一致的 `280px` Sidebar，并允许通过 `sidebar={false}` 嵌入已有 Shell；不绑定具体产品路由或请求库；
- 桌面信息层级、5 列摘要、主趋势、双列/三列区块、16/20px 间距与 Figma 基线一致；
- 所有图表通过 `@zeron/ui/chart` 的 shadcn chart API 与 Recharts 实现；
- 不使用 Figma 临时图片作为图表或图标，不新增图标包；
- 颜色、文字、边框、表面和状态全部使用 Zeron 语义 token，并支持 dark mode；
- 日期、费用、数量、Token、百分比和时长通过 `Intl`/统一 formatter 生成；
- loading、refreshing、empty、partial empty、error、retry、0 值和 null 值均有明确行为；
- Provider/operation/user 无 callback 时不存在伪交互，有 callback 时可由宿主完成路由下钻；
- 桌面、平板、移动布局无页面级横向溢出，只有 PageContent 拥有主纵向滚动；
- Recharts 图表有 `accessibilityLayer`/可访问名称，错误状态不只依赖颜色；
- targeted tests、`@zeron/blocks` typecheck、Registry check、lint 和 production build 均通过；
- docs preview 与 Figma 进行视觉对照，记录仍保留的系统化差异：18px→16px 圆角、Figma 主蓝→Zeron brand、24/36→24/32 排版。

## 15. 明确不做

- 不在 Block 内写死真实 Workspace 切换、账号菜单、权限判断或具体产品路由；这些行为由 callback 接管；
- 不直接接入某个具体后端 URL、鉴权 SDK、React Query/SWR；
- 不从浏览器原始 traces 计算 p95/p99 和大规模聚合；
- 不复制 shadcn chart 源码或再封装一套公共 Chart primitive；
- 不把 Figma 导出的图表 PNG/SVG 当作实现；
- 不新增业务专用全局 CSS、固定 light-only hex 或第二套设计 token；
- 不在 callback 缺失时保留可点击但无行为的控件；
- 不宣称 demo data 已完成真实业务接入。
