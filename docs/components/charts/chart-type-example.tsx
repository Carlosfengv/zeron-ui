"use client";

import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart,
  Pie, PieChart, XAxis, YAxis,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, DonutSummary, chartTrendPreset } from "@zeron/ui/chart";
import { ChartDataTable, ChartLegend, chartColor, createChartNumberFormatter } from "@zeron/ui/chart-primitives";
import type { ChartType } from "@docs/lib/chart-types";

const trendData = [
  { label: "08:00", primary: 12, secondary: 8 },
  { label: "09:00", primary: 28, secondary: 16 },
  { label: "10:00", primary: 19, secondary: 24 },
  { label: "11:00", primary: 43, secondary: 26 },
  { label: "12:00", primary: 31, secondary: 19 },
];
const categoryData = [
  { label: "Gateway", primary: 72 },
  { label: "Functions", primary: 28 },
  { label: "Storage", primary: 44 },
  { label: "Database", primary: 36 },
];
const distributionData = [
  { id: "gateway", label: "Gateway", value: 48, color: chartColor(1) },
  { id: "functions", label: "Functions", value: 28, color: chartColor(2) },
  { id: "storage", label: "Storage", value: 16, color: chartColor(3) },
  { id: "database", label: "Database", value: 8, color: chartColor(4) },
];

interface ChartTypeExampleProps {
  kind: ChartType;
  advanced?: boolean;
  locale: string;
  label: string;
  viewData: string;
  primaryLabel: string;
  secondaryLabel: string;
  totalLabel: string;
  categoryLabel: string;
  unassignedLabel: string;
}

export function ChartTypeExample({ kind, advanced = false, locale, label, viewData, primaryLabel, secondaryLabel, totalLabel, categoryLabel, unassignedLabel }: ChartTypeExampleProps) {
  const format = createChartNumberFormatter(locale, { maximumFractionDigits: 0 });
  const formatPercent = createChartNumberFormatter(locale, { style: "percent", maximumFractionDigits: 0 });

  if (kind === "pie" || kind === "donut") {
    const segments = kind === "donut" && advanced ? distributionData.slice(0, 3) : distributionData;
    const assigned = segments.reduce((sum, segment) => sum + segment.value, 0);
    const table = {
      caption: label,
      summary: viewData,
      columns: [categoryLabel, primaryLabel],
      rows: [
        ...segments.map((segment) => ({ id: segment.id, label: segment.label, values: [format(segment.value)] })),
        ...(assigned < 100 ? [{ id: "unassigned", label: unassignedLabel, values: [format(100 - assigned)] }] : []),
      ],
    };
    return (
      <div className="grid w-full min-w-0 gap-4">
        <div className="flex min-w-0 flex-col items-center gap-6 sm:flex-row">
          {kind === "donut" ? (
            <DonutSummary
              aria-label={`${label}: ${assigned} / 100`}
              center={<><strong className="text-heading">{format(assigned)}</strong><span className="text-label text-fg-subtle">{totalLabel}</span></>}
              className="shrink-0"
              segments={segments}
              total={100}
            />
          ) : (
            <ChartContainer aria-label={label} className="h-64 w-full min-w-0 sm:flex-1" config={{}}>
              <PieChart accessibilityLayer>
                <ChartTooltip content={<ChartTooltipContent hideIndicator valueFormatter={(value) => format(value)} />} />
                <Pie
                  data={segments}
                  dataKey="value"
                  nameKey="label"
                  outerRadius={advanced ? "65%" : "85%"}
                  label={advanced ? ({ percent }) => formatPercent(percent) : false}
                  labelLine={advanced ? { stroke: "var(--border)" } : false}
                  stroke="var(--surface-base)"
                  fill="var(--fg-muted)"
                  isAnimationActive={false}
                >
                  {segments.map((segment) => <Cell key={segment.id} fill={segment.color} />)}
                </Pie>
              </PieChart>
            </ChartContainer>
          )}
          <ChartLegend
            className="w-full min-w-0 sm:flex-1"
            items={segments.map((segment) => ({ ...segment, value: format(segment.value), ratio: formatPercent(segment.value / 100) }))}
          />
        </div>
        <ChartDataTable {...table} />
      </div>
    );
  }

  const isBar = kind === "bar";
  const multiple = !isBar && advanced;
  const horizontal = isBar && advanced;
  const data: { label: string; primary: number; secondary?: number }[] = isBar ? categoryData : trendData;
  const allSeries = [{ id: "primary", label: primaryLabel, color: chartColor(1) }, { id: "secondary", label: secondaryLabel, color: chartColor(2) }] as const;
  const series = multiple ? allSeries : allSeries.slice(0, 1);
  const config = Object.fromEntries(series.map((series) => [series.id, { label: series.label, color: series.color }]));
  const table = {
    caption: label,
    summary: viewData,
    columns: [isBar ? categoryLabel : "UTC", ...series.map((series) => series.label)],
    rows: data.map((point) => ({ id: point.label, label: point.label, values: series.map((series) => format(point[series.id])) })),
  };
  const CartesianChart = kind === "line" ? LineChart : kind === "area" ? AreaChart : BarChart;

  return (
    <div className="grid w-full min-w-0 gap-4">
      <ChartContainer aria-label={label} className="h-64 min-h-0" config={config} dataTable={table}>
        <CartesianChart accessibilityLayer data={data} layout={horizontal ? "vertical" : "horizontal"} margin={chartTrendPreset.margin}>
          <CartesianGrid {...chartTrendPreset.grid} horizontal={!horizontal} vertical={horizontal} />
          <XAxis {...chartTrendPreset.axis} dataKey={horizontal ? undefined : "label"} type={horizontal ? "number" : "category"} tickFormatter={horizontal ? format : undefined} />
          <YAxis axisLine={false} tickLine={false} type={horizontal ? "category" : "number"} dataKey={horizontal ? "label" : undefined} width={horizontal ? 80 : 44} tickFormatter={horizontal ? undefined : format} />
          <ChartTooltip content={<ChartTooltipContent valueFormatter={(value) => format(value)} />} />
          {series.map((series) => kind === "line" ? (
            <Line key={series.id} dataKey={series.id} type="linear" connectNulls={false} stroke={`var(--color-${series.id})`} strokeWidth={2} dot={false} isAnimationActive={false} />
          ) : kind === "area" ? (
            <Area key={series.id} dataKey={series.id} type="linear" connectNulls={false} stackId={multiple ? "requests" : undefined} stroke={`var(--color-${series.id})`} fill={`var(--color-${series.id})`} fillOpacity={0.12} strokeWidth={2} isAnimationActive={false} />
          ) : (
            <Bar key={series.id} dataKey={series.id} fill={`var(--color-${series.id})`} radius={2} isAnimationActive={false} />
          ))}
        </CartesianChart>
      </ChartContainer>
      {multiple && <ChartLegend items={series} />}
    </div>
  );
}

/** Displayed examples use the installed consumer aliases and the same data as the previews. */
export function chartTypeExampleCode(kind: ChartType, advanced = false) {
  if (kind === "donut" || kind === "pie") {
    const donut = kind === "donut";
    const segments = donut && advanced ? distributionData.slice(0, 3) : distributionData;
    return `"use client";

${donut ? 'import { DonutSummary } from "@/components/ui/chart";' : 'import { Cell, Pie, PieChart } from "recharts";\nimport { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";'}
import { ChartDataTable, ChartLegend, chartColor, createChartNumberFormatter } from "@/components/ui/chart-primitives";

const segments = ${JSON.stringify(segments.map(({ id, label, value }) => ({ id, label, value })), null, 2)}.map((segment, index) => ({ ...segment, color: chartColor(index + 1 as 1 | 2 | 3 | 4) }));
const assigned = segments.reduce((sum, segment) => sum + segment.value, 0);
const format = createChartNumberFormatter("en", { maximumFractionDigits: 0 });
const formatPercent = createChartNumberFormatter("en", { style: "percent", maximumFractionDigits: 0 });

export default function Example() {
  return <div className="grid w-full min-w-0 gap-4">
    <div className="flex min-w-0 flex-col items-center gap-6 sm:flex-row">
${donut ? `      <DonutSummary className="shrink-0" segments={segments} total={100} aria-label={"Service distribution: " + assigned + " / 100"} center={<><strong className="text-heading">{format(assigned)}</strong><span className="text-label text-fg-subtle">Allocated / 100</span></>} />` : `      <ChartContainer config={{}} className="h-64 w-full min-w-0 sm:flex-1" aria-label="Service distribution">
        <PieChart accessibilityLayer>
          <ChartTooltip content={<ChartTooltipContent hideIndicator valueFormatter={format} />} />
          <Pie data={segments} dataKey="value" nameKey="label" outerRadius="${advanced ? "65%" : "85%"}"${advanced ? ' label={({ percent }) => formatPercent(percent)} labelLine={{ stroke: "var(--border)" }}' : ""} stroke="var(--surface-base)" fill="var(--fg-muted)" isAnimationActive={false}>
            {segments.map(segment => <Cell key={segment.id} fill={segment.color} />)}
          </Pie>
        </PieChart>
      </ChartContainer>`}
      <ChartLegend className="w-full min-w-0 sm:flex-1" items={segments.map(segment => ({ ...segment, value: format(segment.value), ratio: formatPercent(segment.value / 100) }))} />
    </div>
    <ChartDataTable caption="Service distribution" summary="View data" columns={["Service", "Requests"]} rows={[
      ...segments.map(segment => ({ id: segment.id, label: segment.label, values: [format(segment.value)] })),
      ...(assigned < 100 ? [{ id: "unassigned", label: "Unassigned", values: [format(100 - assigned)] }] : []),
    ]} />
  </div>;
}`;
  }

  const chart = kind === "line" ? "LineChart" : kind === "area" ? "AreaChart" : "BarChart";
  const mark = kind === "line" ? "Line" : kind === "area" ? "Area" : "Bar";
  const horizontal = kind === "bar" && advanced;
  const multiple = kind !== "bar" && advanced;
  const marks = ["primary", ...(multiple ? ["secondary"] : [])].map((id) => {
    const common = `dataKey="${id}" isAnimationActive={false}`;
    return kind === "bar"
      ? `        <Bar ${common} fill="var(--color-${id})" radius={2} />`
      : `        <${mark} ${common} type="linear" connectNulls={false} stroke="var(--color-${id})" strokeWidth={2}${kind === "line" ? " dot={false}" : ` fill="var(--color-${id})" fillOpacity={0.12}${multiple ? ' stackId="requests"' : ""}`} />`;
  }).join("\n");
  return `"use client";

import { ${mark}, ${chart}, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, chartTrendPreset } from "@/components/ui/chart";
import { ${multiple ? "ChartLegend, " : ""}chartColor, createChartNumberFormatter } from "@/components/ui/chart-primitives";

const data = ${JSON.stringify(kind === "bar" ? categoryData : trendData, null, 2)};
const config = { primary: { label: "Requests", color: chartColor(1) }${multiple ? ', secondary: { label: "Comparison", color: chartColor(2) }' : ""} };
const format = createChartNumberFormatter("en", { maximumFractionDigits: 0 });

export default function Example() {
  return <div className="grid w-full min-w-0 gap-4">
    <ChartContainer config={config} className="h-64 min-h-0" aria-label="Requests" dataTable={{ caption: "Requests", summary: "View data", columns: ["${kind === "bar" ? "Service" : "UTC"}", "Requests"${multiple ? ', "Comparison"' : ""}], rows: data.map(point => ({ id: point.label, label: point.label, values: [format(point.primary)${multiple ? ", format(point.secondary)" : ""}] })) }}>
    <${chart} accessibilityLayer data={data} margin={chartTrendPreset.margin}${horizontal ? ' layout="vertical"' : ""}>
      <CartesianGrid {...chartTrendPreset.grid}${horizontal ? " horizontal={false} vertical" : ""} />
      <XAxis {...chartTrendPreset.axis}${horizontal ? ' type="number" tickFormatter={format}' : ' type="category" dataKey="label"'} />
      <YAxis axisLine={false} tickLine={false} width={${horizontal ? 80 : 44}}${horizontal ? ' type="category" dataKey="label"' : ' type="number" tickFormatter={format}'} />
      <ChartTooltip content={<ChartTooltipContent valueFormatter={format} />} />
${marks}
    </${chart}>
    </ChartContainer>${multiple ? '\n    <ChartLegend items={Object.entries(config).map(([id, series]) => ({ id, ...series }))} />' : ""}
  </div>;
}`;
}
