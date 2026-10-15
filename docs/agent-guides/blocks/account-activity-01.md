---
schema_version: 1
name: account-activity-01
kind: block
status: stable
summary: 多账号活动与额度分析，提供矩阵、周、范围与账号视图，复用原生图表和语义变量。
registry_import: "@/components/blocks/account-activity-01"
source: packages/blocks/src/application/account-activity-01/account-activity.tsx
types: packages/blocks/src/application/account-activity-01/account-activity-types.ts
registry: packages/blocks/registry.json
related: [card, tabs, select, slider, button, tooltip, heatmap-chart, area-chart, line-chart, chart-brush, chart-core, chart-primitives]
---

# Account Activity 01

```tsx
import { AccountActivity, accountActivityDemoData } from "@/components/blocks/account-activity-01";

<AccountActivity data={accountActivityDemoData} locale="en-US" timeZone="UTC" />
```

- Supply unique account IDs, finite epoch-millisecond `start`/`end` bounds with exclusive end, hourly `samples`, quota `windows`, and run-out `events`. Samples use nonnegative intensity in host units; `0` is idle and `null` is unknown. Events must have `unlockedAt >= timestamp`.
- Window `readings` are measured percentage values. `peakPercent` is the highest observed percentage, not the current usage; `current` marks the open window. The block never estimates missing readings.
- `timeZone` controls hour, calendar-date and weekday aggregation; default `UTC`. `locale` and `labels` localize the block. Report dates come from input bounds, never the current clock.
- `query` and `onQueryChange` form the controlled API. `defaultQuery` initializes local state. The query includes `view`, `accountId` (`all` or an account ID), `dayType`, exclusive-end `range`, and `hiddenAccountIds`.
- Range lane brushes share one selection. Account-name toggles filter the detail pane. The range slider supplies an accessible keyboard alternative. Other views preserve the same account/day filters.
- Matrix cells count accounts with positive activity, deduplicated per account/hour. Account rows normalize each account independently and skip locked observations. Lock totals merge overlapping events per account and clip to report bounds.
- Calendar days and range-slider steps follow the reporting timezone, including 23/25-hour days. Weekly lanes use local calendar weeks and the exclusive report endpoint; carried locks are clipped to the selected day type and never create extra run-out dots. Peak insight labels and time windows come from the same day group. Account-row normalization also supports fractional host units.
- `state="loading"|"error"`, `errorMessage`, and `onRetry` handle host loading and failures. Empty or all-missing selections show an empty state, not fabricated zero activity.
- Card/Tabs/Select retain their public visual contracts. All charts use Zeron native charts. Rectangular cells use public `HeatmapChart.stretchCells`; annotations use public chart geometry. No private selectors or duplicated chart renderers.
- Matrix, range detail and account heatmaps share the public `HeatmapMatrix` extension from `@zeron/ui/heatmap-chart`. The block owns aggregation/timezone adapters and passes column/row labels, events, lock counts and profile slots. The reusable chart owns cell presentation, missing-readings, annotations, scrolling and keyboard inspection.
- Chart colors take priority over foreground-derived shades: heatmaps/windows reuse `CHART_SCALE_VARS`, primary/secondary series use `chartColor(1)`/`chartColor(2)`, incidents use the reserved danger slot `chartColor(7)`, and selection controls/borders use `--brand`. Keep legends and tooltip markers aligned with their series.
- Base text uses `text-body` (`--font-size-body`, currently 14px): account names, controls, chart legends, dates, axes and data tooltips. Use public medium Button sizing for text actions, not internal font overrides. Descriptive helper copy uses `text-label`; insight headings retain the title/heading hierarchy. Do not hardcode pixel font sizes or change shared typography tokens for this block.
- Provider logos are `account.logo` slots. The documentation demo supplies installed icon-library logos; the installable data block has no icon-provider dependency for brand images.
- Demo observations are examples, not live account monitoring or an integration with AI providers.
