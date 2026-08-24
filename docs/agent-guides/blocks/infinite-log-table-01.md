---
schema_version: 1
name: infinite-log-table-01
kind: block
status: stable
summary: 浏览、筛选和实时追踪大量时间有序的日志或事件记录。
package_import: "@zeron/blocks/infinite-log-table-01"
registry_import: "@/components/blocks/infinite-log-table-01"
source: packages/blocks/src/application/infinite-log-table-01/infinite-log-table.tsx
types: packages/blocks/src/application/infinite-log-table-01/infinite-log-types.ts
registry: packages/blocks/registry.json
related:
  - data-grid
  - data-table
  - filter-query-input
  - time-range-histogram
---

# Infinite Log Table 01

## Agent intent

使用此 Block 构建高密度日志、事件或可观测性记录浏览器。它负责虚拟化表格、筛选、排序、seek cursor 分页、详情面板、选择与复制，以及可选的 Live tail。

它不是通用 CRUD 表格。接入前先选择以下数据模式之一：

1. `records`：本地或已完整加载的静态数据。
2. `dataSource`：远程、分页或实时数据。
3. 不传两者：只会使用内置 mock 数据，限演示和文档预览，禁止用于生产。

`records` 与 `dataSource` 互斥，同时传入会抛出错误。

## Use when

- 数据以 `timestamp` 为主要时间轴，用户需要浏览大量追加记录。
- 需要组合文本、字段、时间范围和 facet 筛选。
- 远程 API 使用稳定快照与 opaque seek cursor 分页。
- 需要 Live tail，并在用户离开顶部时暂存新记录。
- 用户需要查看记录详情、复制经过脱敏的数据或执行批量上下文操作。

## Do not use when

- 用户主要进行行内编辑、单元格编辑或业务 CRUD：使用 DataGrid 或 DataTable。
- 数据量很小且没有分页、筛选或时间浏览需求：使用 Table 或 DataTable。
- 重点是聚合趋势而不是逐条记录：使用图表、MetricCard 或专用监控 Block。
- 后端只能提供 offset pagination 且数据持续插入，但无法保证稳定快照：先改造数据契约，避免重复或漏行。

## Required record contract

每条记录至少满足：

```ts
interface InfiniteLogBaseRecord {
  id: string;
  timestamp: string;
  [field: string]: unknown;
}
```

约束：

- `id` 在数据集和 Live 流中必须稳定且唯一，用于去重、选择和详情导航。
- `timestamp` 必须是可由 `Date.parse` 解析的时间字符串；推荐 ISO 8601，并明确时区。
- 值可能为敏感信息时，必须配置 `redactRecord`，不要依赖 UI 隐藏。
- 静态 `records` 可自动推断 fields；生产远程 `dataSource` 应显式提供 `fields`，保证列顺序、类型、筛选和渲染稳定。

## Choose HTTP mode or schema-driven mode

### Built-in HTTP log mode

记录满足 `InfiniteLogRecord` 且未传入显式 `fields` 时，使用内置 request log 体验，包括 outcome、status、method、region、host、pathname、latency 与 timing filters。

### Schema-driven generic mode

以下任一条件会进入 generic mode：

- 显式传入 `fields`。
- 数据不是内置 HTTP log shape。

每个 field 可控制：

- `id`、`label` 与顺序。
- `type`: `text | number | boolean | datetime | badge | json`。
- `filter`: `text | multiSelect | numberRange | none`。
- `sortable`、`hidden`、`width`、`minWidth`。
- `accessor`、`renderCell`、`formatValue`、`badgeTone`。

不要依赖远程数据返回的第一行推断生产 schema；字段缺失或类型漂移会造成不稳定的列和筛选体验。

## Static records integration

适合本地样本、测试数据或已经完整加载的小型数据集。Block 在浏览器内完成筛选、排序、facet 和 timeline 计算；`records` 模式不支持 Live。

```tsx
import { InfiniteLogTable } from "@zeron/blocks/infinite-log-table-01";

const fields = [
  { id: "timestamp", label: "时间", type: "datetime", sortable: true },
  { id: "service", label: "服务", type: "text", filter: "multiSelect" },
  { id: "level", label: "级别", type: "badge", filter: "multiSelect" },
  { id: "message", label: "消息", type: "text", filter: "text", minWidth: 320 },
] as const;

<InfiniteLogTable
  className="h-full"
  fields={fields}
  locale="zh-CN"
  records={records}
  tableId="service-events"
  timeZone="Asia/Shanghai"
/>
```

## Remote data source contract

`loadPage` 必须遵守以下契约：

- 接收 `filters`、`sort`、`pageSize` 和可选 opaque `cursor`。
- 响应 `AbortSignal`；取消的请求不得继续提交结果或显示普通错误。
- 返回 `snapshotRevision`。同一次查询后续页必须保持相同 revision。
- 返回的 `nextCursor` 必须绑定当前 filters、sort 与 snapshot revision，业务侧不能解析或修改 cursor。
- 首屏建议返回 `metadata`；后续页可以省略，Block 会保留已有 metadata。
- dataSource 对象应保持引用稳定，例如在模块级定义或通过 `useMemo` 创建；不要在每次 render 时重新创建。

```tsx
import { useMemo } from "react";
import {
  InfiniteLogTable,
  type InfiniteLogDataSource,
  type InfiniteLogPage,
  type InfiniteLogPageRequest,
} from "@zeron/blocks/infinite-log-table-01";

function ServiceEventLog() {
  const dataSource = useMemo<InfiniteLogDataSource<ServiceEvent>>(
    () => ({
      async loadPage(request: InfiniteLogPageRequest, { signal }) {
        const response = await fetch("/api/events/query", {
          body: JSON.stringify(request),
          headers: { "content-type": "application/json" },
          method: "POST",
          signal,
        });

        if (!response.ok) throw new Error("日志加载失败");
        return (await response.json()) as InfiniteLogPage<ServiceEvent>;
      },
    }),
    [],
  );

  return (
    <InfiniteLogTable
      className="h-full"
      dataSource={dataSource}
      fields={fields}
      locale="zh-CN"
      tableId="service-events"
      timeZone="Asia/Shanghai"
    />
  );
}
```

## Live data source contract

Live 只有在 dataSource **同时**提供 `subscribeNewer` 和 `loadMetadata` 时才可用。

Live 激活还要求：

- `enableLive` 为 `true`。
- 当前没有固定 `timeRange`。
- 排序是 `timestamp desc`。
- `state.live` 为 `true`。
- 使用远程 `dataSource`，而不是 `records`。

选择历史时间范围或改为其他排序时，Block 会暂停 Live。重新开启 Live 会清除固定时间范围，并恢复 `timestamp desc`。

`subscribeNewer` 必须：

- 从 `after` checkpoint 之后订阅。
- 只推送匹配当前 filters 的新记录。
- 通过 `onBatch` 返回记录和新的 checkpoint。
- 返回同步 unsubscribe 函数。
- 失败时调用 `onError`。

`loadMetadata` 必须返回与当前 filters/sort 一致的总数、filtered count、timeline 与 facets。Live batch 没有附带 metadata 时，Block 会节流调用它刷新聚合信息。

```ts
const liveDataSource: InfiniteLogDataSource<ServiceEvent> = {
  async loadPage(request, { signal }) {
    return queryEvents(request, signal);
  },
  async loadMetadata(request, { signal }) {
    return queryEventMetadata(request, signal);
  },
  subscribeNewer({ after, filters, onBatch, onError }) {
    const stream = subscribeToEvents({ after, filters });
    stream.on("batch", onBatch);
    stream.on("error", onError);
    return () => stream.close();
  },
};
```

## State ownership

Block 默认内部管理 filters、sort 与 live。只有在需要 URL 同步、跨页面保留或外部命令控制时，才使用受控 `state`。

受控模式必须在 `onStateChange` 中提交新状态：

```tsx
const [state, setState] = useState<InfiniteLogTableState>({
  filters: {
    query: "",
    outcomes: [],
    statuses: [],
    methods: [],
    regions: [],
    host: "",
    pathname: "",
    fields: {},
  },
  sort: { field: "timestamp", direction: "desc" },
  live: true,
});

<InfiniteLogTable
  dataSource={dataSource}
  fields={fields}
  onStateChange={setState}
  state={state}
/>
```

不要只传 `state` 而忽略 `onStateChange`，否则用户的筛选、排序和 Live 操作无法生效。

`defaultState` 只用于非受控初始值。不要同时把 `defaultState` 当作后续更新通道。

## Metadata and filters

- `metadata.totalCount` 表示完整数据集数量。
- `metadata.filteredCount` 表示当前 filters 下的数量。
- `timeline` 应针对当前非时间筛选条件提供时间桶。
- facet 计数应排除自身 filter、保留其他 filters，使用户能理解继续筛选后的可能结果。
- schema-driven fields 的 `fieldFacets` 为 multi-select 提供 value counts，为 number range 提供 min/max。
- 后端必须使用与前端一致的 filter 和 sort 语义，否则分页、计数与界面状态会相互矛盾。

## Privacy and security

默认 `redactRecord` 只会隐藏常见敏感 HTTP headers：Authorization、Proxy-Authorization、Cookie、Set-Cookie 和 X-API-Key。

生产接入必须检查实际 schema，并在需要时提供自定义脱敏：

```tsx
<InfiniteLogTable
  dataSource={dataSource}
  fields={fields}
  redactRecord={(record) => ({
    ...record,
    apiKey: record.apiKey ? "[REDACTED]" : undefined,
    payload: redactPayload(record.payload),
  })}
/>
```

`redactRecord` 会影响选择操作、详情面板、复制内容和 `onRecordOpen`。不要只在 cell renderer 中遮挡敏感内容，因为原始数据仍可能通过复制或详情暴露。

## Extension slots

- `commandSlot`：替换顶部的默认查询输入，并通过 context 更新 state。
- `toolbarActions`：添加依赖当前选择、刷新或 loading 状态的操作。
- `footerSlot`：在结果区域底部添加宿主内容。
- `emptyState`：根据当前 state 提供业务空状态。
- `errorState`：显示错误并调用提供的 `retry`。
- `renderDetail`：定制详情内容；接收到的是已经过 `redactRecord` 的记录。
- `onRecordOpen`：记录打开时通知宿主；接收到的是已经过 `redactRecord` 的记录。

扩展 slot 应使用 context 提供的命令，不要绕过 Block 直接修改其内部 rows、selection 或 cursor。

## Localization and layout

- 默认 labels 为英文。中文产品应通过 `labels` 覆盖用户可见文案。
- `locale` 控制数字和日期格式，`timeZone` 控制时间展示与筛选解析；两者应与产品设置一致。
- 宿主必须提供确定高度，例如 `h-full` 且父级具有可计算高度，否则虚拟化表格无法正确占用空间。
- 大屏显示固定筛选侧栏和可调整详情面板；小屏使用 drawer。不要在外层固定内部列宽或复制响应式逻辑。
- `tableId` 在同一页面应唯一，它也用于筛选查询历史的 storage key 和内部 element IDs。

## Safe customization

- 可以替换 fields、labels、empty/error state、toolbar actions 和 detail renderer。
- 可以调整 pageSize 与 maxLiveRows，但必须根据 API 延迟、row 高度与浏览器内存验证。
- 不要移除 snapshot revision 校验、AbortSignal、cursor opaque 性质、Live eligibility 或记录去重逻辑。
- 不要把 mock data source 留在生产路径。
- 不要引入 Next.js、React Query、nuqs、Zustand、SuperJSON 或 Zod 作为 Block 的必需运行时；Registry 版本保持纯 React、无 Provider 边界。

## Verification checklist

- [ ] 明确选择了 `records` 或 `dataSource`，生产环境没有回退到 mock。
- [ ] 每条记录具有稳定唯一的 `id` 和可解析的 `timestamp`。
- [ ] 远程模式显式提供稳定 `fields` 和引用稳定的 dataSource。
- [ ] cursor 与 snapshot revision 在分页期间保持一致。
- [ ] 所有请求支持 AbortSignal。
- [ ] Live dataSource 同时实现 subscribeNewer 与 loadMetadata。
- [ ] 受控 state 在 onStateChange 中真正提交。
- [ ] 已根据真实 schema 审核并配置 redactRecord。
- [ ] locale、timeZone、labels 和 tableId 已按宿主设置。
- [ ] 宿主为 Block 提供了可计算高度。
- [ ] loading、empty、error、retry、no-more-results 和 Live unavailable 均已验证。

## API anchors

Agent 优先关注：

- 数据：`records`、`dataSource`、`fields`。
- 状态：`state`、`defaultState`、`onStateChange`。
- 规模：`pageSize`、`maxLiveRows`、`enableLive`。
- 本地化：`locale`、`timeZone`、`labels`、`tableId`。
- 扩展：`commandSlot`、`toolbarActions`、`footerSlot`、`emptyState`、`errorState`、`renderDetail`、`onRecordOpen`。
- 安全：`redactRecord`。

完整类型和 data source 联合约束以 `types` 指向的实现为准。
