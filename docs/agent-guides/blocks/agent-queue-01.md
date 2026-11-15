---
schema_version: 1
name: agent-queue-01
kind: block
status: stable
summary: 显示任务排队、工作槽进度、完成失败计数和限流期间的队列深度。
registry_import: "@/components/blocks/agent-queue-01"
source: packages/blocks/src/application/agent-queue-01/agent-queue.tsx
registry: packages/blocks/registry.json
related:
  - agent-tasks-01
  - badge
  - button-group
  - chart
  - metric-card
  - popover
---

# Agent Queue

Embed `AgentQueue` in an operations view for a snapshot of pending work, active worker slots, terminal results, and backlog history. The visual composition follows the [public affectUI Agent Queue preview](https://www.affectui.com/components/agent-queue).

```tsx
import { AgentQueue } from "@/components/blocks/agent-queue-01";

export function Queue() {
  return <AgentQueue
    name="agent-jobs"
    now={10_000}
    workers={[{ id: "model", name: "Model worker" }]}
    jobs={[
      { id: "summary", name: "Summarize ticket", kind: "llm", status: "running", enqueuedAt: 1000, startedAt: 2000, worker: "model", progress: 0.6 },
      { id: "index", name: "Index documents", kind: "tool", status: "queued", enqueuedAt: 3000 },
    ]}
    backpressure={12}
  />;
}
```

Give each job and worker a stable ID. Use the same millisecond clock for jobs, rate-limit intervals, depth samples and `now`. Omit `now` to use the browser clock with epoch timestamps. Waiting items sort by priority, then `queueOrder` (lower first) and enqueue time. Provide a fraction in `progress` for actual execution progress, or `estimate` in milliseconds for an approximate bar.

The four metrics show current waiting and running counts, jobs completed or failed in the last minute, and the 95th percentile wait among jobs started in the history window. The history window defaults to 120 seconds. Provide `totals` for cumulative results and `depthHistory` for historical depth when the job list only contains recent records. Pass `rateLimits` and `backpressure` to annotate the chart. Use `agentQueueChineseLabels` or override individual labels.

Connect `onPausedChange`, `onConcurrencyChange`, `onPromote` and `onCancel` to the host queue and update the corresponding snapshots after a change. Omit callbacks to hide their controls. Promotion is available on queued jobs behind the first position. Cancellation is available on queued and running jobs. `openId` and `onOpenChange` control the job popover. Use `defaultOpenId` for local initial selection.

Arrow keys move through active jobs and then waiting jobs. Home and End jump to either end. Enter opens details, and Escape returns focus to the job. Below 600px of available width, columns stack and the metrics wrap to two columns.

Job triggers use Zeron Button and Popover, the waiting list uses ScrollArea, terminal counts use MetricCard, and queue depth uses ChartContainer. The block owns task movement, inline progress and queue layout, using the shared surface, typography, sizing and motion tokens.
