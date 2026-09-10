---
schema_version: 1
name: agent-message-trace-01
kind: block
status: stable
summary: 显示单条 Agent Message 的调用树、耗时瀑布图和可调整尺寸的 Span 详情。
package_import: "@zeron/blocks/agent-message-trace-01"
registry_import: "@/components/blocks/agent-message-trace-01"
source: packages/blocks/src/application/agent-message-trace-01/agent-message-trace-workspace.tsx
types: packages/blocks/src/application/agent-message-trace-01/agent-message-trace-types.ts
registry: packages/blocks/registry.json
related:
  - resizable
  - detail-list
  - tabs
  - switch
---

# Agent Message Trace 01

## Agent intent

使用此 Block 检查一条 Agent Message 内的模型、Agent 与 Tool 调用链。Block 接收扁平 Span 数组，自行构建安全的调用树、虚拟化行、时间轴、选择状态和详情面板。

Block 不负责请求接口，也不要求后端输出展示结构。业务项目应在页面或数据 hook 中将 API、OpenTelemetry 或流式事件映射到 `AgentMessageTraceData`。不要修改 demo data 来模拟已经完成的数据接入。

## Install and import

在使用 Zeron Registry 的项目中安装完整依赖闭包：

```bash
npx zeron-ui add agent-message-trace-01
```

Registry 安装后的默认导入路径为：

```tsx
import {
  AgentMessageTrace,
  type AgentMessageTraceData,
  type AgentMessageTraceMessage,
  type AgentMessageTraceSpan,
} from "@/components/blocks/agent-message-trace-01";
```

`AgentMessageTrace` 是带时间线、Resizable 和详情区的完整 Block。只需要时间线时使用 `AgentMessageTraceTimeline`；详情区单独组合时使用 `AgentMessageTraceInspector`。

## Required data contract

```ts
interface AgentMessageTraceData {
  id: string;
  messageId?: string;
  startedAt?: string;
  spans: readonly AgentMessageTraceSpan[];
}

interface AgentMessageTraceSpan {
  id: string;
  parentId: string | null;
  kind: "chat" | "agent" | "tool";
  name: string;
  startOffsetMs: number;
  durationMs?: number;
  status: "running" | "success" | "error" | "cancelled";
}
```

接入约束：

- `id` 必须在同一条 trace 内稳定且唯一，用于树关系、选择和流式更新。
- `parentId` 指向同一数组中的父 Span；缺失、循环或自引用会安全降级为根节点。
- `startOffsetMs` 和 event 的时间均为相对整条 trace 起点的毫秒数，不是 Unix 时间戳。
- 已完成 Span 传 `durationMs`；运行中 Span 可省略并通过 `nowOffsetMs` 更新当前耗时。
- `input`、`output`、event payload 和 attributes 接受未知 JSON 值。传入 `AgentMessageTraceMessage` 或其数组时，Pretty 模式会显示角色图标和消息卡片。
- `spans` 最好在数据没有变化时保持引用稳定，避免重新构建树和虚拟列表。

## API adapter example

适配逻辑属于业务项目。先统一后端状态和类型，再计算相对时间：

```tsx
import { useMemo } from "react";
import {
  AgentMessageTrace,
  type AgentMessageTraceData,
  type AgentMessageTraceKind,
  type AgentMessageTraceStatus,
} from "@/components/blocks/agent-message-trace-01";

function toKind(value: string): AgentMessageTraceKind {
  if (value === "llm") return "chat";
  if (value === "tool") return "tool";
  return "agent";
}

function toStatus(value: string): AgentMessageTraceStatus {
  if (value === "active") return "running";
  if (value === "failed") return "error";
  if (value === "cancelled") return "cancelled";
  return "success";
}

function TraceView({ response }: { response: ApiTrace }) {
  const data = useMemo<AgentMessageTraceData>(() => {
    const traceStartedAt = Date.parse(response.startedAt);

    return {
      id: response.id,
      messageId: response.messageId,
      startedAt: response.startedAt,
      spans: response.spans.map((span) => {
        const startedAt = Date.parse(span.startedAt);
        const endedAt = span.endedAt ? Date.parse(span.endedAt) : undefined;

        return {
          id: span.spanId,
          parentId: span.parentSpanId ?? null,
          kind: toKind(span.type),
          name: span.name,
          operation: span.operation,
          startOffsetMs: Math.max(0, startedAt - traceStartedAt),
          durationMs: endedAt === undefined ? undefined : Math.max(0, endedAt - startedAt),
          status: toStatus(span.status),
          input: span.input,
          output: span.output,
          attributes: span.attributes,
          events: span.events,
        };
      }),
    };
  }, [response]);

  return <AgentMessageTrace className="h-full" data={data} locale="zh-CN" />;
}
```

后端 event 不是相对毫秒结构时，也需要在 adapter 中映射为 `AgentMessageTraceEvent`，不能直接透传绝对时间。

## State ownership

Block 默认内部管理选择、展开节点和类型过滤。需要与 URL、外部详情页或持久化偏好同步时，使用对应的受控属性：

```tsx
<AgentMessageTrace
  data={data}
  selectedSpanId={selectedSpanId}
  onSelectedSpanIdChange={setSelectedSpanId}
  expandedSpanIds={expandedSpanIds}
  onExpandedSpanIdsChange={setExpandedSpanIds}
  visibleKinds={visibleKinds}
  onVisibleKindsChange={setVisibleKinds}
/>
```

`onSpanSelect` 适合埋点或额外业务动作；选中状态仍由 `selectedSpanId` 契约负责。

## Loading, error, and streaming

- 加载时传 `state="loading"` 和一个空 `spans` 的稳定 data 对象。
- 请求失败时传 `state="error"`，并通过 `errorMessage` 提供面向用户的信息。
- 空结果使用 `state="ready"` 和空 `spans`，Block 会显示空状态。
- 流式更新应按稳定 `id` 合并 Span，避免每个增量生成新 id。
- 存在运行中 Span 时，宿主按需要更新 `nowOffsetMs`；没有运行中 Span 时不需要定时刷新。

## Layout ownership

Block 填满父级宽高，宿主必须提供有界高度，例如 flex 剩余空间、`h-full` 或明确的 viewport 高度。默认在 900px 以上左右排列，右侧详情初始宽度为 400px；更窄时自动上下排列。

外部布局可通过 `className` 控制 Block 的尺寸，通过 `inspectorDefaultSize`、`inspectorMinSize` 和 `inspectorMaxSize` 调整详情区。不要覆盖内部 Zeron token、Resizable、Tabs、DetailList 或 focus 状态。

## Production boundary

`agentMessageTraceDemoData` 和 `createAgentMessageTraceDemoData` 只用于文档、Story 或测试。生产项目应创建独立 adapter，并将服务端响应转换为公开数据契约。Block 不包含鉴权、请求重试、分页、订阅或脱敏逻辑；这些仍由业务数据层负责。
