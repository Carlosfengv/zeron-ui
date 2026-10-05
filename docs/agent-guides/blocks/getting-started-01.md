---
schema_version: 1
name: getting-started-01
kind: block
status: stable
summary: 可折叠的入门任务清单，复用默认组件样式，完成状态与任务入口由宿主提供。
registry_import: "@/components/blocks/getting-started-01"
source: packages/blocks/src/application/getting-started-01/getting-started.tsx
registry: packages/blocks/registry.json
related:
  - button
  - container
  - stepper
---

# Getting Started 01

Use for an embedded onboarding checklist. Preserve the host shell. For a form with step panels, use Stepper instead.

```tsx
import { GettingStarted, gettingStartedDemoTasks } from "@/components/blocks/getting-started-01";

<GettingStarted tasks={gettingStartedDemoTasks} onTaskAction={(id) => openTask(id)} />
```

- Supply `tasks` with unique ids and explicit `completed`, `current` or `pending` states. At most one task is current; array order determines displayed numbers. Completion counts are derived from completed tasks, including nonconsecutive completions.
- `open` with `onOpenChange` controls expansion. Without `open`, `defaultOpen` initializes local state (true by default). Empty tasks show 0/0 and the empty label; all completed tasks show N/N without hiding the block.
- `href` takes priority over `onTaskAction`. Completed tasks remain static even when given an action. Disabled links are rendered as native disabled Button controls, avoiding anchor activation. Clicking an entry does not update completion; the caller supplies refreshed tasks.
- Override `title` and `labels` for localization. `labels.progress(completed, total)` supplies a full accessible sentence, while the visible count stays numeric. Core source imports React and Zeron only.
- `Container` is the root, with `ContainerHeader` and `ContainerBody` as direct children. A native Button toggles the body's `hidden` state and exposes `aria-expanded`/`aria-controls`, without adding an Accordion padding layer.
- Each task marker uses nonInteractive `Stepper` → `StepperItem` → `StepperIndicator`. Completed tasks supply the shared check icon through the indicator's public children slot so the server render never shows an unregistered step number; other tasks display their array position. All states retain the same default 24px size, shape and semantic colors. Each marker has its own Stepper context so an active task never implicitly completes earlier tasks. Native ol/li provides task order; no tablist or artificial step panels are introduced.
- Task text wraps independently, with a trailing iconOnly Button named after the task. This avoids the current contentSized height conflict without restyling Button.
- Preserve default component sizes, shapes, focus and feedback. No custom tick meter, circular badge or internal-slot CSS. `className` is for external layout only.
- Demo tasks are examples; replace them and connect real routes or callbacks. The document demo explicitly completes a task in its host, rather than treating a navigation click as completion.
