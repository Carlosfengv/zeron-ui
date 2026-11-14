---
schema_version: 1
name: fallback-chain-01
kind: block
status: stable
summary: 用流程图追踪一次请求的顺序模型回退、耗时、费用和最终响应。
registry_import: "@/components/blocks/fallback-chain-01"
source: packages/blocks/src/application/fallback-chain-01/fallback-chain.tsx
registry: packages/blocks/registry.json
related:
  - agent-message-trace-01
  - badge
  - popover
---

# Fallback Chain

Embed `FallbackChain` in a model gateway or request inspector to show which models a single request tried and which one answered. The diagram follows the [public affectUI Fallback Chain preview](https://www.affectui.com/components/fallback-chain).

```tsx
import { FallbackChain } from "@/components/blocks/fallback-chain-01";

export function RequestRoute() {
  return (
    <FallbackChain
      title="Summarize support ticket"
      route="openrouter/auto"
      attempts={[
        { id: "primary", model: "Primary model", provider: "Provider A", status: "failed", durationMs: 1600, timeoutMs: 5000, reason: "Rate limited · 429" },
        { id: "backup", model: "Backup model", provider: "Provider B", status: "answered", durationMs: 850, costUsd: 0.0004, outputTokens: 412 },
      ]}
    />
  );
}
```

- Pass one ordered snapshot with stable IDs and one active or successful attempt. The five statuses are `waiting`, `trying`, `failed`, `answered`, and `skipped`.
- `durationMs` is elapsed time for an attempt. A `trying` attempt with `startedAt` and without `durationMs` uses the current time or the controlled `now` timestamp to calculate its elapsed time. Pass Unix milliseconds for both timestamps.
- Use `request`, `response`, and attempt `details` to populate the node popovers. Open them by hovering, clicking, tapping, or pressing Enter or Space on a focused node. The response text appears once a model answers.
- When at least one attempt fails and all remaining attempts are failed or skipped, `onRetry` shows a button and receives the user's retry intent. The caller owns routing and updates the attempt data.
- Below 680px of block width, provider names move into details. Below 520px, the graph becomes a vertical tree and the response details open from the summary.
- Pass `fallbackChainChineseLabels` and `locale="zh-CN"` for Chinese UI strings and formatting.
