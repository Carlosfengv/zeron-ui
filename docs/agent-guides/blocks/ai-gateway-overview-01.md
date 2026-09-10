---
schema_version: 1
name: ai-gateway-overview-01
kind: block
status: stable
summary: 展示 AI 网关的请求、费用、Token、延迟、错误、服务商归因和慢操作。
registry_import: "@/components/blocks/ai-gateway-overview-01"
source: packages/blocks/src/application/ai-gateway-overview-01/ai-gateway-overview.tsx
types: packages/blocks/src/application/ai-gateway-overview-01/ai-gateway-overview-types.ts
registry: packages/blocks/registry.json
related:
  - chart
  - metric-card
  - tabs
  - sidebar
  - page-layout
---

# AI Gateway Overview 01

## Agent intent

使用此 Block 构建完整的 AI 网关业务总览。它负责设计稿中的 Sidebar、PageLayout、指标格式化、响应式图表、加载和失败状态；业务项目负责查询数据、切换时间范围、刷新、重试和导航行为。

默认渲染 `280px` 桌面 Sidebar，并在低于桌面断点时切换为抽屉。若业务应用已经提供同一层级的全局导航，可显式传入 `sidebar={false}`，避免重复外壳。

## Use when

- 需要同时观察请求、费用、Token、延迟和错误率。
- 需要按 Provider 归因请求和成本。
- 需要延迟分布、扩展指标、慢操作和高频用户视图。
- 扩展指标需要同时呈现底部时间轴和按指标单位格式化的数值刻度。
- 后端能按统一时间窗口返回聚合数据。

## Do not use when

- 只需要单个可用性对比图：使用 `availability-monitor-01`。
- 需要逐条浏览原始请求日志：使用 `infinite-log-table-01`。
- 页面只展示单个模型的性能详情：使用模型详情 Block。

## Minimal integration

外部项目通过 Registry 安装。`@zeron/blocks` 是源码仓库内部 workspace 包，不是消费者安装入口。

```bash
npx zeron-ui add ai-gateway-overview-01 --dry-run
npx zeron-ui add ai-gateway-overview-01
```

```tsx
import { useState } from "react";
import {
  AiGatewayOverview,
  parseAiGatewayOverviewData,
  type AiGatewayOverviewData,
  type AiGatewayOverviewRange,
} from "@/components/blocks/ai-gateway-overview-01";

function GatewayOverviewPage() {
  const [range, setRange] = useState<AiGatewayOverviewRange>("30d");
  const query = useGatewayOverviewQuery(range);
  const data: AiGatewayOverviewData | null = query.data
    ? parseAiGatewayOverviewData(query.data)
    : null;

  return (
    <AiGatewayOverview
      actions={{
        onRangeChange: setRange,
        onRefresh: query.refetch,
        onRetry: query.refetch,
        onNavigationSelect: (id, event) => {
          event.preventDefault();
          router.push(gatewayRoutes[id]);
        },
        onWorkspaceSelect: () => openWorkspaceSwitcher(),
        onAccountSelect: () => openAccountMenu(),
        onProviderSelect: (id) => router.push(`/providers/${id}`),
        onOperationSelect: (id) => router.push(`/operations/${id}`),
      }}
      className="h-full"
      data={data}
      locale="zh-CN"
      range={range}
      status={query.isLoading ? "loading" : query.isFetching ? "refreshing" : query.isError ? "error" : "ready"}
      timeZone="Asia/Shanghai"
    />
  );
}
```

## Data contract

### Window

`window` 必须包含 `range`、ISO 8601 的 `from` / `to`、`granularity`、IANA `timeZone`、ISO 4217 `currency` 和 `generatedAt`。

### Units

- 金额使用整数 `costMicros`。不要向 Block 传入已格式化的货币字符串。
- Token 和请求量使用非负整数。
- 延迟使用毫秒。
- `errorRate` 使用 `0..1` 比例，不是百分数。
- 时间序列的 `timestamp` 使用带时区的 ISO 8601。

### Missing values

`null` 表示该时间点不可用或未计算；`0` 表示有效的零值。不要把两者互换。

接口已经与 Block 契约一致时，用 `parseAiGatewayOverviewData(response)` 在渲染前执行运行时校验。接口字段不一致时，应先在项目侧映射为契约结构，再调用 parser；不要使用 TypeScript 类型断言代替校验。

### Stable IDs

Provider、操作、用户、延迟区间和扩展指标必须提供稳定且唯一的 `id`。Block 用这些 ID 作为渲染键和交互回调参数。

## Query mapping

推荐后端一次返回同一窗口下的完整聚合结果：

```ts
type GatewayOverviewResponse = AiGatewayOverviewData;

const response = await fetch(
  `/api/gateway/overview?range=${range}&timeZone=${timeZone}`,
  { signal },
);
```

如果后端拆分多个接口，请在数据适配层等待同一 snapshot revision 的结果后再组装，避免汇总指标与图表时间窗不一致。

## Runtime states

- `loading` + `data={null}`：显示全页骨架。
- `refreshing` + 旧 `data`：保留图表并将容器标为 busy。
- `error` + 旧 `data`：保留图表并显示行内错误提示。
- `error` + `data={null}`：显示整页错误和可选 Retry。
- `ready` + `data={null}`：显示确认无数据状态。

## Interaction ownership

只有提供对应 callback 时才渲染或启用交互：

- `onNavigationSelect`：Sidebar 选择通知。回调会收到原生 click event；使用客户端路由时调用 `event.preventDefault()`。优先通过 `sidebar.groups[].items[].href` 提供真实页面地址。
- `onWorkspaceSelect`、`onAccountSelect`：工作区和账号入口。
- `onRangeChange`：受控 Tabs 时间范围；未提供时 TabItem 保持只读禁用状态。
- `onRefresh`：刷新按钮。
- `onRetry`：全页错误重试。
- `onProviderSelect`、`onOperationSelect`、`onUserSelect`：明细行导航。

不要传入空函数制造看似可点击但无行为的控件。

## Sidebar configuration

通过 `sidebar` 覆盖 workspace、account、activeItem 或完整导航分组。未传入时使用设计稿中的 Overview、Traces、Sessions、Logs、MCP、Setup、API keys 和 Settings 结构。已有产品外壳时使用 `sidebar={false}`，Block 将只渲染右侧 PageLayout。

## Localization

通过 `locale` 和 `timeZone` 控制数字、货币、日期和延迟格式。通过 `labels` 局部覆盖页面与图表文案；业务术语与后端 ID 不要混入标签配置。
