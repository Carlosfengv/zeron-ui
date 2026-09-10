# Availability Monitor 01 replication spec

## Scope

- Reference: `https://openrouter.ai/openai/gpt-6-astra`, Uptime section only.
- Target: `packages/blocks/src/application/availability-monitor-01/availability-monitor.tsx`.
- Preserve the existing exported component and data interfaces; new copy or marker controls must remain optional.
- Use Zeron components and semantic tokens. The comparison visualization uses the existing shadcn-compatible Zeron chart wrapper over Recharts.

## Page topology

1. Section heading: `Uptime`, followed by the reference explanatory paragraph.
2. One cohesive Zeron `Container` for the monitoring content.
3. Two compact three-day metric cards in a two-column grid.
4. A 72-hour status overview with day markers and a current availability summary.
5. A 24-hour two-series line chart with an interactive legend.
6. The routing recovery note with links to the Endpoints API and provider-routing documentation.

## Reference data snapshot

- Uptime: `100.00%`.
- Availability: `99.30%`.
- OpenRouter availability: `99.84%`.
- Without routing: `95.58%`.
- Range: `Sep 5, 9 AM - Sep 8, 9 AM`.
- The status strip has 72 hourly segments. Indices 22, 26, 27, and 32 are degraded; all others are available.
- Chart data spans Sep 7, 9:30 AM to Sep 8, 9:30 AM in Asia/Shanghai, at ten-minute intervals.

## Visual contract

- Section width: up to 1024px; the main content remains centered and fluid.
- Use project surfaces, borders, foreground colors, typography, radius, and spacing tokens only.
- Visual styling follows the default Zeron component recipes rather than the reference site's CSS.
- Use default `Container`, `MetricCard`, `StatusOverview`, `Card`, and `Button` surfaces and interaction states without overriding their internal slots.
- Metrics are green success values with tabular numerals.
- Timeline semantics map available/degraded/unavailable to operational/degraded/down.
- Chart y-domain is 75–100%, with routed availability in success green and direct availability in warning amber.
- The desktop chart shows representative time ticks; the axis must reduce labels without horizontal overflow on smaller screens.

## Interaction contract

- Metric information buttons expose explanations through Zeron tooltips.
- Each chart legend row is a button. Pressing it toggles that series and updates `aria-pressed`.
- Timeline segments retain `StatusOverview` keyboard and pointer behavior.
- External documentation links keep the exact reference destinations.

## Responsive contract

- Metric cards are two columns from the small breakpoint and one column below it.
- Timeline heading, range, summary, and markers may wrap without clipping.
- The chart remains readable at narrow widths and never causes page-level horizontal scrolling.
- All controls retain accessible labels and usable hit areas.
