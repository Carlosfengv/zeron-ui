# Chart selection and migration

Read this when building or replacing a chart in the requested region. Default to the shadcn Chart / Recharts composition approach, consuming Zeron's installed Chart components so charts follow the project's design system. Existing chart-library choice alone is not a reason to retain the old implementation during an authorized migration. Ordinary page edits do not authorize replacing charts outside their scope.

## Select from the existing chart's meaning

Inventory the existing chart before selecting an example: purpose, series, source query, aggregation, units, time range/timezone, axis scale/domain, sorting, null handling, thresholds and required interactions. Select a compatible chart form, not just one that looks similar.

| Existing purpose | Candidate composition to verify |
| --- | --- |
| Change over time | Line or area; preserve time spacing, gaps, series and scale |
| Category comparison or distribution buckets | Bar; preserve category ordering and bucket boundaries |
| Parts of a whole | Pie/donut or stacked chart only when the data supports that interpretation; preserve totals and percentage denominators |
| Multiple measures or relationships | Composed/scatter or another verified Recharts capability; preserve axes and units |

Keep a matching Zeron block's public chart integration when it already satisfies the task; do not modify its managed internals. Otherwise compose Recharts primitives with Zeron Chart. Official [shadcn Chart documentation](https://ui.shadcn.com/docs/components/chart) and [chart examples](https://ui.shadcn.com/charts) are references for composition, not an alternate theme or proof of Zeron API compatibility. Record the examined source/version when adapting an example and check it against the installed Recharts version.

## Respect Zeron APIs and ownership

- Inspect the target release's actual Chart exports and types before using example APIs. The source at the time of this guidance exposes `ChartContainer`, `ChartTooltip`, `ChartTooltipContent` and `ChartConfig`; do not assume it also exposes `ChartLegend`, `ChartLegendContent` or the same formatter props as an upstream example. Recheck this list against the installed release.
- In this monorepo the public entry is `@zeron/ui/chart`; consumer imports follow their installed aliases and Registry targets. Install the target release's `chart` item and compatible dependencies through the supported Zeron installer when needed.
- Do not run the shadcn installer over existing managed Chart files, copy an upstream `chart.tsx` onto them, or replace the project's global theme/config to make an example compile. Keep Zeron managed files and their provenance intact.
- Use verified Recharts primitives and public Zeron APIs for project-owned chart compositions. If a missing legend, formatter or interaction can be implemented through those public boundaries, record the composition and verify it. If it requires editing managed internals, record a capability gap and the smallest appropriate library change or explicit exception.
- Do not recreate supported chart rendering, tooltip positioning or selection mechanics with hand-written SVG/canvas just to avoid integration. Domain-specific data transforms and callbacks remain project-owned.

## Preserve data and interaction contracts

Replace the presentation while retaining real data sources and query parameters. Preserve aggregation/windowing, units, timezone, category/series identity, ordering, precision, thresholds and axis semantics. Do not silently interpolate missing samples, convert null to zero, normalize independent series to percentages, truncate data, change scales or introduce downsampling just to fit an example. Replace sample arrays with actual integration; formatting belongs at the display boundary rather than altering stored values.

Inventory existing filtering, legend visibility, tooltip values, click-through/drilldown IDs, brush/zoom, cross-chart synchronization, live refresh and export where present. Verify each required behavior against the installed APIs; an upstream demo with no such interaction is not an equivalent replacement. Do not add those capabilities where the product never requested them.

Maps, topology, specialized scientific/financial charts and high-volume or high-frequency views require a capability/performance check. Attempt the compatible public composition first where plausible. If it cannot preserve the required behavior, record the exact gap and evidence; use the migration's accepted-exception or partial-result rules. Do not force these views into a simpler chart or retain the old library silently.

## Keep chart styling in the design system

Use Zeron surfaces, typography, border and tooltip styles, and verified semantic/chart color tokens through `ChartConfig`. Preserve meaningful series/status distinctions and stable category-color assignments across refreshes. Do not copy an example's hardcoded palette, undefined `--chart-*` variables, card styling or global theme. If required series colors are not available, use the documented theme extension path rather than inventing per-page color systems.

Give the responsive chart a measurable height/aspect and a parent that can shrink. Respect the installed Chart container's sizing contract; avoid adding nested responsive containers when it already owns one. Verify resizing, narrow widths, long labels and hidden-to-visible transitions for tabs/dialogs when applicable. Preserve visible focus, accessible chart descriptions and any existing nonvisual data access; do not assume every chart type/version enables accessibility automatically.

## Verify the replacement

Record outcomes separately from installation success:

- Compare representative before/after inputs to plotted values, axes and tooltip output: include zero, missing values, negatives where valid, multiple series, timezone boundaries and precision-sensitive units.
- Exercise required filters, series toggles, drilldowns and other inventoried interactions; verify callback/query payloads as well as visual changes.
- Check loading, empty, error/retry and refresh-with-existing-data behavior. An empty or failed request must not become a chart of fabricated zeroes.
- Inspect actual browser layout and tooltip readability at narrow/wide widths and supported themes, plus keyboard/focus and representative data volume. A green build or a screenshot alone does not establish data or behavioral equivalence.
- Confirm managed Chart files remain unchanged. Remove old renderer imports, adapters, styles and dependencies only after tracing all remaining consumers; keep Recharts when the new chart uses it and retain dependencies still required outside scope.

For migration, connect this evidence to the existing region/mapping IDs and required behavior, contract, visual and cleanup checks. Missing capabilities or verification prevent a complete claim; list the concrete remaining work.
