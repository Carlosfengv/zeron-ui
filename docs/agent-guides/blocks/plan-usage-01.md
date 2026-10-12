---
schema_version: 1
name: plan-usage-01
kind: block
status: stable
summary: 套餐、周期用量、限额、付款方式和历史账单的受控订阅管理区块，复用当前 Zeron 组件与变量。
registry_import: "@/components/blocks/plan-usage-01"
source: packages/blocks/src/application/plan-usage-01/plan-usage.tsx
types: packages/blocks/src/application/plan-usage-01/plan-usage-types.ts
registry: packages/blocks/registry.json
related: [card, chart-primitives, bar-chart, chart-core, slider, switch, badge, button, table]
---

# Plan Usage 01

Use for an embedded subscription and invoice workspace. It preserves the host shell and owns no billing service.

```tsx
import { PlanUsage, planUsageDemoData } from "@/components/blocks/plan-usage-01";

<PlanUsage data={planUsageDemoData} />
```

- Supply `data` with a unique `currentPlanId` in `plans`, nonnegative finite credits/prices, unique model and invoice IDs, and ISO calendar dates. Prices use major currency units and `currency` is an ISO currency code. Dates render in UTC. Daily observations remain in caller-provided order; `kind` distinguishes actual, today and projected values.
- `cycle.models` owns used credits, remaining credits and model percentages. The capacity bar uses included credits; legend percentages use consumed credits. `cycle.projection`, `dailyAllowance` and `daysUntilReset` are host-provided facts; no forecasts or dates are inferred from the system clock.
- `data.limits` is controlled. `actions.onAlertPercentChange` and `onExtraUsageChange` receive the intended new values. Alert percent is clamped to 0–100 and the marker follows the slider. No caller data is mutated internally.
- The right side of the alert marker has a red diagonal texture using the existing `renderPatternPreset("diagonal")` and `--danger-strong`. It is a decorative annotation over the capacity bar, not another usage series: credits, model ratios and progressbar semantics remain unchanged. The pattern is scoped to each block's useId. Both marker and texture share SegmentedBar's public `visualizationLayout` denominator: 0% covers the full track, and 100% highlights only overage when used credits exceed the included allowance. The black marker stays above the texture.
- `onSelectPlan(planId)`, `onUpdatePayment`, `onDownloadInvoice(invoice)` and `onCancelPlan` are host actions. The host owns confirmation, asynchronous work and refreshed snapshots. Use `pending` to disable mutations and `error` to show a failed-operation notice. Missing callbacks disable controls. `cancelAtPeriodEnd` disables cancellation and shows the end date.
- See plans performs local scrolling and moves keyboard focus to the comparison. The invoice list initially shows six rows; Show older reveals the remaining supplied rows. Empty usage, invoices and absent payment are explicit states.
- `locale` formats numbers, currency and dates; every label and sentence formatter can be replaced via `labels`. Plan descriptions, features and invoice descriptions are caller-localized business strings.
- All seven surface regions use Card with CardContent, including current plan, cycle usage, limits, plan comparison, payment, invoices and cancellation. Each Card uses `border-hairline border-border` for the requested 0.5px frame, derived from the existing hairline-width and border-color tokens. Invoices use Table inside a horizontally scrollable CardContent. Preserve Card’s default background, radius and padding; do not retain Container framing or add background/radius overrides. Model attribution uses SegmentedBar/ChartLegend with `chartColor` and daily usage uses the existing BarChart/Bar/ReferenceLine/ChartTooltip APIs. No managed UI source, custom primitive or new style variable is required. Layout classes arrange the composition; controls retain public default styles. Section and card headings use the existing `font-semibold text-fg-default` utilities, including the current plan, daily usage, limits rows, plan names, payment summary and cancellation heading.
- Daily bars and their tooltip indicators follow the host brand: actual uses `--brand`, today uses `--brand-active`, and forecasts use the same 16% brand tint as the library's soft custom Badge palette. Usage alert uses Slider's public `color="brand"`. Invoice Badge uses the public custom color API with `--brand`, `--fg-on-brand` and `--fg-brand`; Paid is strong, Refunded is solid. Status text remains explicit. Changing the host theme updates all three regions without introducing variables or restyling component internals.
- Plans stack below the md breakpoint and invoice overflow stays inside CardContent. The root has a max-w-3xl width and does not own page scrolling.
- `planUsageDemoData` is fixture data. The docs demo confirms changes locally and downloads example JSON invoices. Plan changes update the example's included credits and daily allowance; only the original Pro fixture has a supplied depletion forecast. The Chinese demo localizes plan features and invoice descriptions. Replace fixtures with real subscription data and actions before production use.
