---
schema_version: 1
name: ai-gateway-session-list-01
kind: block
status: stable
summary: 在与 AI Gateway Overview 1 一致的工作区侧栏中浏览和筛选 Session，并查看结果、模型、Token、费用、最近活动与创建时间。
registry_import: "@/components/blocks/ai-gateway-session-list-01"
source: packages/blocks/src/application/ai-gateway-session-list-01/ai-gateway-session-list.tsx
types: packages/blocks/src/application/ai-gateway-session-list-01/ai-gateway-session-list-types.ts
registry: packages/blocks/registry.json
related:
  - data-table
  - page-layout
  - checkbox
---

# AI Gateway Session List 01

## Agent intent

使用此 Block 浏览 AI Gateway Session。它默认包含与 `ai-gateway-overview-01` 共用的响应式 Sidebar，并将 Sessions 设为当前项；页面主体使用 Zeron 组件的原生样式，负责列表筛选、显示格式化、加载/空/错误状态和 DataTable 原生分页。宿主负责数据请求、URL 状态和 Session 详情路由。

## Use when

- 需要按 session id 或 trace name 搜索；
- 需要按 Agent、User、Model 和错误结果筛选；
- 需要同时查看模型、turn、Token、费用、最近活动和创建时间；
- 服务端分页由宿主受控。

## Do not use when

- 需要 AI Gateway 聚合指标和图表：使用 `ai-gateway-overview-01`；
- 需要查看单个 Session 的完整执行轨迹：使用 `agent-session-detail-01`；
- 需要浏览任意 schema 的原始日志：使用 `infinite-log-table-01`。

## Minimal integration

```tsx
import { useState } from "react";
import {
  AiGatewaySessionList,
  aiGatewaySessionListDemoQuery,
} from "@/components/blocks/ai-gateway-session-list-01";

function SessionsPage() {
  const [query, setQuery] = useState(aiGatewaySessionListDemoQuery);
  const sessions = useGatewaySessions(query);

  return (
    <AiGatewaySessionList
      actions={{
        onQueryChange: setQuery,
        onRetry: sessions.refetch,
        onSessionOpen: (session) => router.push(`/sessions/${session.id}`),
      }}
      data={sessions.data ?? null}
      query={query}
      status={sessions.isLoading ? "loading" : sessions.isFetching ? "refreshing" : sessions.isError ? "error" : "ready"}
    />
  );
}
```

## Data contract

- Token 使用 `inputTokens` 与 `outputTokens` 非负整数；Block 计算显示合计。
- 费用使用 `costMicros` 整数；货币来自列表响应的 `currency`。
- `lastActiveAt`、`createdAt` 和 `generatedAt` 使用 ISO 8601 UTC。
- `generatedAt` 默认作为相对时间基准；宿主只有在需要覆盖快照时间时才传 `now`。
- Session 第一列分两行：第一行用普通表格文本显示 trace name 或 session ID，不使用 Badge；状态由名称左侧圆点和屏幕阅读器文本表达。第二行仅显示最近活跃时间值，不显示 `Last active:` 前缀；7 天内按分钟、小时或天显示相对时间，严格超过 7 天显示 `YYYY年 M月D日 HH:mm:ss`。
- 末列使用 `createdAt` 按 `YYYY年 M月D日 HH:mm:ss` 显示具体创建日期时间，例如 `2026年 7月31日 12:21:29`。
- `agent`、`user`、`model`、`customer` 可为 `null`；`model=null` 显示 `no-model-call`。
- Model Badge 左侧优先使用 `renderModelLogo(model)`，否则根据 `model.provider` 解析内置品牌 Logo；当前 mock 的 `deepseek-v4-pro` 使用 DeepSeek Logo，其他模型回退为通用模型图标。
- `total` 是应用当前查询后的总数，不是当前页行数。
- Facet count 不受当前分页影响。
- 内置 demo 提供 WorkBuddy、Codex、Claude Code 三个 Agent facet，每类 4 条 Session；产品接入时用真实 Agent 数据替换。

## Query ownership

`query` 是分页和筛选的唯一状态源。搜索或筛选变化会通过 `onQueryChange` 返回并把 `pageIndex` 重置为 `0`；DataTable 原生分页会通过同一回调更新 `pageIndex` 和 `pageSize`，默认提供每页 10/20/30/40/50 条。响应数据不重复携带分页状态。没有 `onQueryChange` 或状态为 `refreshing` 时，筛选与分页统一禁用。不要传入空函数制造无效控件。

## Layout ownership

Block 不创建 `AppShell`，但默认渲染共享 `AiGatewayWorkspaceSidebar`；侧栏结构、宽度、工作区身份和账号区域与 `ai-gateway-overview-01` 保持同源。若宿主已经提供同一套工作区外壳，可传 `sidebar={false}`。`PageBody` 使用与 `resource-list-page-01` 相同的 `max-w-none p-3`，其内部按 `resource-list-table-01` 的 `section > DataTable > toolbar` 层级组织；搜索框、FacetedFilter、表格表面、间距和分页均复用同一组组件约定。分页间距、禁用状态和文案通过 DataTable 公共契约提供，不使用内部 slot 选择器。

## Runtime states

- `loading` + `data=null`：显示七行列对齐骨架；
- `refreshing` + 旧数据：保留行，并禁用搜索、筛选与分页，避免重复请求；
- `error` + 旧数据：保留行并显示非阻断错误；
- `error` + `data=null`：显示阻断错误和可选 Retry；
- 无数据与筛选无结果使用不同 Empty 文案。

## Adaptation hooks

- `labels` 覆盖筛选、空状态、状态文本、分页和无障碍文案；
- `dateTimeFormatter` 覆盖绝对时间格式，默认仍为 `YYYY年 M月D日 HH:mm:ss`；
- `renderModelLogo` 接入产品自己的模型 Logo 目录；
- Facet 选项的 `count` 是服务端权威数量，不从当前分页行重新计算。
