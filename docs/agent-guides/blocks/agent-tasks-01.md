---
schema_version: 1
name: agent-tasks-01
kind: block
status: stable
summary: 带状态筛选、展开活动时间线与宿主操作的紧凑 Agent 任务队列。
registry_import: "@/components/blocks/agent-tasks-01"
source: packages/blocks/src/application/agent-tasks-01/agent-tasks.tsx
registry: packages/blocks/registry.json
related:
  - container
  - tabs
  - badge
  - button
---

# Agent Tasks

Use `agent-tasks-01` for an embedded agent task queue with status filters, activity history and task actions. This React data block does not add an application shell.

```tsx
import { AgentTasks, agentTasksDemoData } from "@/components/blocks/agent-tasks-01";

<AgentTasks
  tasks={agentTasksDemoData}
  defaultExpandedTaskId="migration"
  onOpenTask={(task) => console.log(task.id)}
  onNewTask={() => console.log("Open the host creation flow")}
/>
```

Replace sample tasks and callbacks with host data and navigation. `tasks` is required. Task IDs must be unique; event IDs must be unique within a task. Durations, event times and messages are host-formatted. Events display in the supplied order; `current` highlights the active event. Failed and `needs-you` tasks both contribute to Needs you.

Host IDs may contain spaces or Unicode. The block encodes IDs for its DOM relationships and returns the original task through callbacks. Multiple block instances keep separate disclosure targets. Counts and visible tasks share the same status groups.

Optional `filter`/`onFilterChange` and `expandedTaskId`/`onExpandedTaskChange` control presentation. Omit controlled props for local state with `defaultFilter` and `defaultExpandedTaskId`. `expandedTaskId={null}` collapses all tasks. Controlled changes emit intent and wait for updated props. Filters preserve expansion by task ID.

Open and New task are disabled without `onOpenTask` and `onNewTask`. The block never creates tasks, launches agents or navigates by itself. The docs demo uses local dialogs and sample creation only. Pass `agentTasksChineseLabels` or partial `labels` for UI translation; the host localizes task content.

Composition: Container/ContainerBody/ContainerFooter, Tabs/TabsList/TabItem/TabPanel, Badge and Button. Keep control geometry, icon slots, semantic status colors and focus behavior. ContainerBody and ContainerFooter retain their default padding, border and surface styles. Task rows use gap-0.5. Use `className` for outer layout. The default maximum width is the shared max-w-md size. The filter strip scrolls horizontally and follows keyboard focus when its content cannot fit; titles, model names and messages wrap. The running indicator is filled and respects reduced motion.
