"use client";

export { Grid, type GridProps } from "./charts/grid";
export { XAxis, type XAxisProps } from "./charts/x-axis";
export { YAxis, type YAxisProps } from "./charts/y-axis";
export * from "./charts/tooltip";
export * from "./charts/legend";
export { ChartLegend, type ChartLegendProps } from "./charts/chart-legend";
export { ChartConfigProvider, type ChartConfigProviderProps } from "./charts/chart-config-context";
export { ReferenceArea, type ReferenceAreaProps } from "./charts/reference-area";
export { ReferenceLine, type ReferenceLineProps } from "./charts/reference-line";
export type { ChartYDomain } from "./charts/chart-domain";
export { PatternLines, PatternCircles, PatternWaves, PatternHexagons } from "./charts/visx-pattern";
export { chartCssVars, useChart, useChartStable, useChartHover, type LineConfig, type Margin } from "./charts/chart-context";
export type { ChartPhase, ChartStatus, LoadingStyle } from "./charts/chart-phase";
export { renderPatternPreset, PATTERN_PRESET_IDS, type PatternPresetId, type PatternPresetOptions } from "./charts/pattern-preset";
export { Background, type BackgroundProps } from "./charts/background";
export { LinearGradient, RadialGradient } from "@visx/gradient";
export * from "./charts/markers";
