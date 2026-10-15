---
schema_version: 1
name: time-window-timeline
kind: component
status: stable
summary: Grouped time windows with meters, elapsed shading, event markers and a continuous now line.
registry_import: "@/components/ui/time-window-timeline"
source: packages/ui/src/components/time-window-timeline.tsx
registry: packages/ui/registry.json
related: [badge, tabs, time-range-histogram]
---

# TimeWindowTimeline

Use for quota periods, reservation windows or grouped resource intervals. Supply `ariaLabel`, epoch-millisecond `start` / exclusive `end`, ordered non-overlapping `ticks`, and `groups`. Groups have stable IDs, React labels and rows; row IDs are globally unique. Rows contain React labels and intervals, with optional `muted` and `markers`.

Intervals require `id`, `start < end`, React `label`, and plain-text `ariaLabel`. `variant` is current (default), earlier or next; `tone` is neutral, success (default), warning or danger. An optional finite `value` from 0–100 produces an accessible meter. Progress remains a fraction of the complete interval when clipped. Supply dates and status in `ariaLabel`, including disconnected/stale context if relevant.

`now` / `nowLabel` add elapsed shading and a continuous line within the range; markers have id, at, label and kind reset/expiry. Event markers are plain vertical lines, without endpoint circles. The tick containing now uses aria-current="date". Earlier and next intervals are visually distinct. Timeline colors prioritize chart tokens: success/default uses chart-1, warning chart-3, danger chart-7 and neutral chart-6. Fill, border, elapsed shading and progress derive from the same color. The exported `timeWindowToneColors` mapping keeps legends synchronized. Earlier windows use chart-6; reset/expiry markers use chart-2/chart-5. The now indicator follows brand/fg-on-brand. Text, surfaces and structural dividers retain semantic tokens. `labelWidth` / `minTrackWidth` default to 300 / 840 CSS pixels. The label column stays sticky inside the focusable horizontal scroll region. No dragging or editing is implied.

Hosts own tick generation, locale/time zone, actions and fetching. Empty groups use `emptyContent`; invalid range, duplicate IDs or invalid meters use `invalidContent`. Invalid data produces an alert instead of invalid geometry.

Shape follows the host Tailwind theme: the outer frame uses rounded-xl, local window surfaces and the now label use rounded-lg, and progress tracks/fills use rounded-sm. Structural window outlines use hairline borders. Event lines have no circular endpoint. Do not override the frame or interval shapes with screenshot-specific large or full radii.

```tsx
import { TimeWindowTimeline } from "@/components/ui/time-window-timeline";

export function Windows() {
  return <TimeWindowTimeline ariaLabel="Quota windows" start={0} end={100}
    ticks={[{ id: "range", start: 0, end: 100, label: "Current period" }]}
    groups={[{ id: "pool", label: "Compute", rows: [{ id: "gpu", label: "GPU pool", intervals: [
      { id: "current", start: 10, end: 90, label: "32% used", ariaLabel: "GPU pool, 32% used", value: 32 },
    ] }] }]} now={40} />;
}
```
