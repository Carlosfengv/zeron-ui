"use client";

import { useId } from "react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@zeron/ui/chart";
import { chartColor, createChartNumberFormatter } from "@zeron/ui/chart-primitives";

const data = [
  { date: "06/01", count: 72 },
  { date: "06/02", count: 108 },
  { date: "06/03", count: 86 },
  { date: "06/04", count: 144 },
  { date: "06/05", count: 118 },
  { date: "06/06", count: 164 },
  { date: "06/07", count: 132 },
];

interface BarChartGradientExampleProps {
  locale: string;
  label: string;
  dateLabel: string;
  countLabel: string;
  viewData: string;
}

/** Adapts the gradient fill and bar geometry from support-analytics-01's TicketTrend. */
export function BarChartGradientExample({ locale, label, dateLabel, countLabel, viewData }: BarChartGradientExampleProps) {
  const gradientId = `support-bars-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const formatCount = createChartNumberFormatter(locale, { maximumFractionDigits: 0 });
  const radius = data.length > 12 ? 3 : data.length > 7 ? 6 : 8;

  return (
    <div className="grid w-full min-w-0 gap-4">
      <ChartContainer
        className="h-40 w-full min-w-0"
        config={{ count: { label: countLabel, color: chartColor(1) } }}
        aria-label={label}
        dataTable={{ caption: label, summary: viewData, columns: [dateLabel, countLabel], rows: data.map((point) => ({ id: point.date, label: point.date, values: [formatCount(point.count)] })) }}
      >
        <BarChart data={data} accessibilityLayer barCategoryGap={data.length > 12 ? "12%" : "6%"} margin={{ top: 8, right: 3, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-count)" stopOpacity={0.55} />
              <stop offset="55%" stopColor="var(--color-count)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="var(--color-count)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" axisLine={false} tickLine={false} interval="preserveStartEnd" tickMargin={10} height={28} />
          <YAxis hide domain={[0, "auto"]} />
          <ChartTooltip cursor={{ fill: "var(--hover)" }} content={<ChartTooltipContent hideIndicator valueFormatter={formatCount} />} />
          <Bar dataKey="count" fill={`url(#${gradientId})`} radius={[radius, radius, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}

export const barChartGradientExampleCode = `"use client";

import { useId } from "react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { chartColor, createChartNumberFormatter } from "@/components/ui/chart-primitives";

const data = ${JSON.stringify(data, null, 2)};
const config = { count: { label: "Tickets", color: chartColor(1) } };
const formatCount = createChartNumberFormatter("en", { maximumFractionDigits: 0 });

export default function Example() {
  const gradientId = "support-bars-" + useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const radius = data.length > 12 ? 3 : data.length > 7 ? 6 : 8;

  return (
    <div className="grid w-full min-w-0 gap-4">
      <ChartContainer config={config} className="h-40 w-full min-w-0" aria-label="Ticket trend" dataTable={{ caption: "Ticket trend", summary: "View data", columns: ["Date", "Tickets"], rows: data.map(point => ({ id: point.date, label: point.date, values: [formatCount(point.count)] })) }}>
        <BarChart data={data} accessibilityLayer barCategoryGap={data.length > 12 ? "12%" : "6%"} margin={{ top: 8, right: 3, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-count)" stopOpacity={0.55} />
              <stop offset="55%" stopColor="var(--color-count)" stopOpacity={0.2} />
              <stop offset="100%" stopColor="var(--color-count)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="date" axisLine={false} tickLine={false} interval="preserveStartEnd" tickMargin={10} height={28} />
          <YAxis hide domain={[0, "auto"]} />
          <ChartTooltip cursor={{ fill: "var(--hover)" }} content={<ChartTooltipContent hideIndicator valueFormatter={formatCount} />} />
          <Bar dataKey="count" fill={"url(#" + gradientId + ")"} radius={[radius, radius, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ChartContainer>
    </div>
  );
}`;
