---
schema_version: 1
name: agent-run-01
kind: block
status: stable
summary: 多 Agent 任务运行树，支持实时状态、节点详情与宿主操作。
registry_import: "@/components/blocks/agent-run-01"
source: packages/blocks/src/application/agent-run-01/agent-run.tsx
registry: packages/blocks/registry.json
related:
  - card
  - info-item
  - badge
  - popover
  - chart-primitives
---

# Agent Run 01

Use `AgentRun` to observe the current state of a run with a single root and its delegated agents and tools.

```tsx
import { AgentRun } from "@/components/blocks/agent-run-01";

<AgentRun run={{
  id: "checkout",
  title: "Fix the checkout crash",
  root: { id: "lead", name: "Lead", status: "working", summary: "Planning the fix" },
}} />
```

- Supply immutable snapshots with a stable run ID and unique node IDs. Set `root` to `null` for an empty run. The total includes the root, agents and tool nodes.
- Use `kind: "tool"` for a compact card, `colorIndex` for a Zeron chart color, and `icon` for a Zeron icon name. `usage.tokens` and `usage.limit` describe token capacity. `elapsedSeconds` and `costUsd` are host-reported metrics.
- Details use the Claude logo for Claude model names by default. Pass `modelIcon` for the model's logo when supplying another provider or overriding that default.
- Pass `runs` with `onRunChange` to enable the task picker. The host supplies data updates, including updates received while a node's details are open.
- Details align with the card's leading edge and width. Agent details prefer the space below their card, and tool details prefer the space above. The popover shifts or flips when space is limited.
- A node entering `working` or receiving a changed `handoff` gets a brief highlight. The token bar interpolates between snapshots while its accessible value reports the latest usage. Motion follows the system's reduced-motion preference.
- `onMessage(runId, nodeId, message)` receives trimmed text. `onControl(runId, nodeId, action)` receives pause, resume or stop intent for a working or paused node with `controllable: true`. Apply the resulting state in the next snapshot.
- `locale` controls number formatting. Use the exported English or Chinese label set, or supply your own. Keep both the CSS module and its declaration when copying by hand. The module lays out the delegation connectors using Zeron's chart and surface tokens.
