---
schema_version: 1
name: agent-message-trace-01
kind: block
status: stable
summary: 同一 Span 契约支持实时概览瀑布图、用量汇总和浮层详情，或可调整尺寸的调试工作区。
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
  - popover
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

## Live overview variant

实时概览是同一 Block 的变体，不是新的 block。其核心任务、Span 身份、父子关系、相对时间、状态、选择与展开接口都与原版一致。默认的 `variant="inspector"` 保留原有调试布局；`variant="live"` 适合展示多 Agent 并行执行、汇总指标与按需详情。

```tsx
<AgentMessageTrace
  variant="live"
  heading="Trace"
  description="Launch the new pricing page by Friday"
  data={data}
  nowOffsetMs={currentRelativeTimeMs}
  locale="zh-CN"
/>
```

- 可选 `span.subtitle` 显示模型、服务或任务的辅助说明；未提供时使用 `model` 或 `provider`。
- `span.usage` 接受 `costUsd`、`inputTokens` 和 `outputTokens`，均为数值。只记录该 Span 自身的用量，不得再把后代用量写入父 Span。组件推导父节点汇总与总指标；不做汇率转换或模型价格估算。
- 模型调用数按 `kind="chat"` 统计，工具调用数按 `kind="tool"` 统计，错误数保留历史失败调用。修复成功后根节点可完成，历史失败节点仍可检查。
- 折叠后保留后代数量和子调用时间缩略条；点击行或 Enter 打开详情，Escape 关闭。方向键、Home 和 End 导航调用树。
- `renderSpanIcon(span)` 可传入现有图标库的品牌图形；block 负责外框，图标内容由宿主提供，未知 payload 不会作为 HTML 渲染。
- `heading`、`headingIcon`、`description`、`liveLabels` 与 `renderSpanIcon` 只影响实时概览。`labels` 继续提供时间线与空、错、加载文案；`expandAll` / `collapseAll` 也用于实时概览的分支按钮文案。
- 详情 Popover 使用公共 `surfaceClassName` / `surfaceShadow` 接口设置 0.5px 语义边框并关闭阴影，不覆盖通用 Popover 的默认外观。
- 实时游标和未结束 Span 耗时由 `nowOffsetMs` 驱动；完成后游标消失。block 本身不创建计时器，不连接接口。
- 主体、汇总、时间轴和详情默认使用 `text-body`（14px），不随容器宽度放大字号。行高为 40px。
- 瀑布条、游标、标签和刻度共用一个 MotionValue 时钟，每帧同步插值。时间域连续扩展，不向整刻度跳档；条形采用 SVG 几何绘制，标签与刻度使用 transform，不在播放时测量每行 HTML 布局。行进入、重排与刻度淡入淡出沿用 `spring.moderate`，`prefers-reduced-motion` 会关闭插值和位移动画。
- `agentMessageTraceLiveDemoData` 和 `createAgentMessageTraceLiveDemoData` 是参考视频的确定性演示数据，不能用于替代真实接口接入。
- 概览默认按内容增长并限制在父级高度内；宿主可传 `className="h-full"` 填满固定播放区域，避免新节点到来时卡片增高。行区域负责纵向滚动；低于 620px 时仅时间线区域横向滚动，六项指标排列为两行。

## Required data contract

Inspector 时间线与 Live overview 共用 40px 行高、40px 表头、14px 正文和 28px 图标容器。虚拟列表使用相同的 40px 高度估算，展开与滚动时保持行位置一致；操作名和耗时采用正文排版，时间条高为 20px。

Inspector 的分支按钮与 Live overview 共用 14px 右箭头：收起时向右，展开时平滑旋转 90° 向下，不显示数字圆点。叶子节点仅保留与箭头同宽的空白占位，不显示小圆点。旋转使用 `duration-fast`，减少动态效果偏好会关闭旋转过渡；按钮保留键盘焦点和展开状态语义。

Inspector 展开和收起沿用 Live overview 的 `spring.moderate`：新增子节点轻移淡入，移除节点淡出，其余行通过 transform 平滑移位。动画按 Span ID 保持连续，连续切换可以反向衔接。普通虚拟滚动不触发节点进入动画；退出中的节点立即停止接收焦点和点击。系统减少动态效果偏好会关闭位移和淡入淡出。

在表格底部收起时，组件暂时保留原滚动范围，让滚动位置与节点位移同步完成，再释放多余范围，避免浏览器突然夹紧滚动位置。滚轮、触摸和键盘滚动会立即接管。

两种视图复用同一个节点动画与滚动补偿 hook。Live 在普通虚拟滚动中直接显示新进入视口的行；淡出行立即变为 inert。关闭浮层会返回原行焦点，当前挂载行中保留一个键盘入口。顶部状态和行列表使用同一个去重、修复孤立关系后的树模型。数字格式化器按语言和精度复用，缓存最多保留 24 组。

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
