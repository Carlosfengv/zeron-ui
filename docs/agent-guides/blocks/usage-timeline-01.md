---
schema_version: 1
name: usage-timeline-01
kind: block
status: stable
summary: Provider-grouped quota windows, usage meters and reset events with weekly, five-hour and billing views.
registry_import: "@/components/blocks/usage-timeline-01"
source: packages/blocks/src/application/usage-timeline-01/usage-timeline.tsx
types: packages/blocks/src/application/usage-timeline-01/usage-timeline-types.ts
registry: packages/blocks/registry.json
related: [time-window-timeline, badge, button, button-group, tabs]
---

# UsageTimeline

React data-block without an application shell. Composes TimeWindowTimeline, Badge, Button, ButtonGroup, Tabs, Skeleton and InlineNotice. Period selection uses Tabs’ default pill/brand recipe; navigation and used/remaining toggles use ButtonGroup with default-sized Buttons. Do not recreate the selectors with custom capsule wrappers. The frame/windows/progress follow rounded-xl/rounded-lg/rounded-sm and host radius variables. Timeline bars and their legends prioritize chart-1 (normal), chart-3 (low quota), chart-7 (nearly exhausted), chart-6 (history), chart-2 (early reset) and chart-5 (banked expiry). The now indicator uses brand; surfaces, text and account status badges retain semantic tokens. Overriding the chart palette and brand tokens updates the visualization without changing business state.

```tsx
import { UsageTimeline, usageTimelineDemoProviders, usageTimelineDemoNow } from "@/components/blocks/usage-timeline-01";

export function AccountWindows() {
  return <UsageTimeline providers={usageTimelineDemoProviders} now={usageTimelineDemoNow} timeZone="Asia/Shanghai" />;
}
```

Providers have unique IDs, names, optional brand/logo and accounts. Account IDs are globally unique. Each account supplies name, email, limits with unique IDs and finite usedPercent (0–100), optional plan, disconnected state and reset/expiry markers. `windows` maps weekly, five-hour and cycle to explicit start/end/usedPercent, plus optional previousStart and nextEnd. An earlier window renders only when its real previousStart is supplied and precedes start; its end is the current start. A next window renders only when nextEnd is supplied and follows end. Missing history is not inferred from the current duration, since billing periods and early resets can have unequal lengths. Missing periods show no-window data. Marker labels are supplied by the host; event markers are plain vertical lines without endpoint circles.

Use an explicit epoch-millisecond `now`. All supplied dates must fit JavaScript’s Date range; computed viewport bounds must also be valid. Out-of-range values show the invalid-data alert. `locale` and `timeZone` control date formatting, calendar-day ticks and navigation. The normal viewport spans 14 calendar days from 7 days before now; five-hour mode spans 24 elapsed hours, with a localized duration label. Calendar arithmetic reuses one formatter and handles daylight saving, including dates whose midnight is skipped by a clock change. An uncontrolled mode change recenters the viewport and reports the request through `onRangeStartChange`. With controlled mode, only `onModeChange` fires: pending or rejected requests cannot mutate the current range. The host can control `rangeStart` when it wants coordinated mode/range changes; an existing manually navigated range otherwise stays in place.

`mode` / `measure` / `rangeStart` are optionally controlled, with defaultMode / defaultMeasure / defaultRangeStart and corresponding on…Change callbacks. Remaining percentages are 100 minus used, while risk color stays based on used (warning >=80, danger >=95). Disconnected rows retain muted snapshot data. Hosts must exclude stale data themselves if desired.

`labels` can override all business copy; exported English and Chinese labels are available. `state` supports ready/loading/error, empty providers show an empty state, invalid data shows an alert, and errors support errorMessage/onRetry. The host owns connections, permissions and fetching. Example accounts are fixed data, without a live service. Narrow views keep horizontal scrolling within the timeline and labels sticky.
