---
schema_version: 1
name: local-models-01
kind: block
status: stable
summary: Controlled local model planner with an interactive GPU server, memory estimates and capacity recovery.
registry_import: "@/components/blocks/local-models-01"
source: packages/blocks/src/application/local-models-01/local-models.tsx
registry: packages/blocks/registry.json
related:
  - container
  - select
  - slider
  - switch
  - alert
---

# Local Models 01

Use as an embedded local inference configuration block, without an application shell.

```tsx
import { useState } from "react";
import { LocalModels, localModelsDemoData, localModelsDemoValue } from "@/components/blocks/local-models-01";

function Example() {
  const [value, setValue] = useState(localModelsDemoValue);
  const [applied, setApplied] = useState(localModelsDemoValue);
  return <LocalModels data={localModelsDemoData} value={value} appliedValue={applied}
    onValueChange={setValue} onApply={setApplied} />;
}
```

- Model/GPU IDs are unique. Supply one config per model. Capacities, weight estimates, runtime and cache values are finite, nonnegative GB. Allocations reference existing GPU IDs. Context is positive; parallel requests are integers from 1 to 16. Config precision must exist in the model's weight map.
- `value` is the draft; `appliedValue` is the last successful snapshot. `onValueChange` requests a draft change. Only update `appliedValue` after the backend acknowledges `onApply`. Use `busy` while pending and `error` on failure. Do not replace the draft on save failure. Discard calls `onValueChange(appliedValue)` and optional `onDiscard`.
- Optional controlled selection uses `selectedModelId` and `onSelectedModelChange`; otherwise `defaultSelectedModelId` seeds internal selection.
- KV cache scales linearly from `cachePer32K` with context and parallel requests. Multi-GPU allocations split the model memory evenly. All enabled models on each GPU contribute to capacity validation. Real allocators may need different placement or empirical estimates; these formulas are not live GPU telemetry.
- `getLocalModelsUsage`, `getLocalModelMemory`, `countLocalModelChanges` and `fitLocalModelsToGpus` are exported. Fit reduces requests, then context, then weight memory across all affected models before considering unloading any model. Models without KV cache retain their request/context settings. Invalid input returns an unchanged cloned draft without entering reduction loops. Review the resulting draft before applying.
- Apply is disabled for no changes, missing host handler, pending saves, invalid config/placement, or any over-capacity GPU. Validation includes unique IDs and allocations, positive GPU capacities, finite nonnegative memory estimates, supported precision, positive context and 1–16 requests. Unassigned SVG cards are disabled, matching the GPU selector. Loading/unloading, context, precision and overflow handling remain draft changes until applied.
- Precision and busy-slot handling use `Tabs variant="pill"`. Parallel requests use `SliderComfortable` with the built-in label/value display, integer steps from 1 to 16, and theme-accent fill.
- The header GPU Memory button opens the library Popover with `data.serverName`, per-GPU loaded models, memory bars, available memory, and Fit. Selecting a GPU selects its first loaded model (or its first assigned unloaded model), closes the popover, and updates the right panel and SVG together. Multi-GPU model selection highlights every allocated card. Unassigned cards remain visible with a disabled selection row; no-GPU data shows an empty state. Per-GPU over-capacity colors remain semantic danger colors.
- `onCopy` delegates clipboard/export policy to the host. Optional `actions` accepts host actions. `title`, `description`, `icon`, and model metadata accept product-specific content. Built-in control copy is English.
- The example uses logos from `@lobehub/icons`; pass `model.icon` to customize. The four-card server retains the user-provided nimbus-gpu-01 SVG geometry. Each card's eight vent cells show that device's estimated memory occupancy; selected cards use the theme accent, and over-capacity cards use a danger pulse that respects reduced motion. Shadows and linework adapt to light/dark themes. Memory bars, matching legend markers and the parallel-request slider use `--brand` and lighter theme-derived shades. All state controls reuse public Zeron APIs.
- The documentation demo exposes normal, overflow (8.3 GB), empty, and failed-save states. Its Apply action updates local state only; cloud fallback and model loading need host services.
