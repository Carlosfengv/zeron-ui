/** Sequential scale CSS variables for heatmaps, choropleths, and binned data (01 = lowest, 05 = highest). */
export const CHART_SCALE_VARS = [
  "var(--muted)",
  "color-mix(in oklch, var(--chart-1) 25%, var(--muted))",
  "color-mix(in oklch, var(--chart-1) 50%, var(--muted))",
  "color-mix(in oklch, var(--chart-1) 75%, var(--muted))",
  "var(--chart-1)",
] as const;

export type ChartScaleVars = typeof CHART_SCALE_VARS;

export const chartScaleCssVars = {
  scale01: CHART_SCALE_VARS[0],
  scale02: CHART_SCALE_VARS[1],
  scale03: CHART_SCALE_VARS[2],
  scale04: CHART_SCALE_VARS[3],
  scale05: CHART_SCALE_VARS[4],
  patternColor: "var(--fg-default)",
} as const;
