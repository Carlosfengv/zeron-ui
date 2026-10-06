"use client";

import { useId } from "react";
import { Area, AreaChart, CartesianGrid, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, DonutSummary, chartTrendPreset, type ChartConfig } from "@zeron/ui/chart";
import { ChartLegend, chartSeriesColor, chartStatusColors } from "@zeron/ui/chart-primitives";
import { badgeColors } from "@zeron/ui/badge";
import { Empty, EmptyDescription } from "@zeron/ui/empty";
import { securityFormatNumber, securitySeverities, securitySeverityColors, securityTrendPoints, securityValidNumber } from "./security-overview-data";
import type { SecurityOverviewLabels, SecurityOverviewScanState, SecurityOverviewSnapshot } from "./security-overview-types";

const scoreColors = { ...chartStatusColors, success: "var(--fg-brand)" };
const severityColors = Object.fromEntries(securitySeverities.map((severity) => [severity, badgeColors[securitySeverityColors[severity]]]));

export function SecurityScore({ data, scan, labels, locale }: { data: SecurityOverviewSnapshot; scan: SecurityOverviewScanState; labels: SecurityOverviewLabels; locale: string }) {
  const score = securityValidNumber(data.score, 100) ? data.score : null;
  const awaiting = scan.status === "succeeded" && scan.snapshotId !== data.id;
  const running = scan.status === "starting" || scan.status === "running" || scan.status === "refreshing" || awaiting;
  // The ring always describes the snapshot's score. Scan progress has its own existing notice.
  return <DonutSummary className="w-24 shrink-0" innerRadius="88%" total={100} segments={[{ id: "score", label: labels.securityScore, value: score, color: scoreColors[data.scoreTone] }]} aria-label={`${labels.securityScore} ${securityFormatNumber(score, locale, 100)} / 100${running ? ` · ${labels.previousSnapshot}` : ""}`} center={<span className="text-heading font-semibold">{score === null ? labels.unknown : data.grade ?? labels.unknown}</span>} />;
}

export function SecurityTrend({ data, labels, locale, timeZone }: { data: SecurityOverviewSnapshot; labels: SecurityOverviewLabels; locale: string; timeZone: string }) {
  const gradientId = useId().replace(/:/g, "");
  const points = securityTrendPoints(data);
  const date = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone });
  const config: ChartConfig = Object.fromEntries(securitySeverities.map((severity) => [severity, { label: labels[severity], color: severityColors[severity] }]));
  if (!points?.length || points.every((point) => point.total === null)) return <Empty reason="no-data" scope="inline"><EmptyDescription>{labels.noData}</EmptyDescription></Empty>;
  return <div className="space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 className="text-body font-medium text-fg-default">{labels.open}</h3><p className="mt-1 text-label text-fg-subtle">{labels.trendDescription}</p></div>
      <ChartLegend className="flex flex-wrap gap-x-3 gap-y-1" items={securitySeverities.map((severity) => ({ id: severity, label: labels[severity], color: severityColors[severity] }))} />
    </div>
    <ChartContainer className="h-48" config={config} aria-label={labels.trendDescription}>
      <AreaChart data={points} accessibilityLayer margin={chartTrendPreset.margin}>
        <defs>{securitySeverities.map((severity) => <linearGradient key={severity} id={`${gradientId}-${severity}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={`var(--color-${severity})`} stopOpacity={0.25} /><stop offset="100%" stopColor={`var(--color-${severity})`} stopOpacity={0.04} /></linearGradient>)}</defs>
        <CartesianGrid {...chartTrendPreset.grid} />
        <XAxis dataKey="at" type="number" scale="time" domain={[data.window.start, data.window.end]} tickFormatter={(at: number) => date.format(at)} tickLine={false} axisLine={false} minTickGap={32} />
        <YAxis width={28} allowDecimals={false} tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent labelFormatter={(at) => date.format(Number(at))} valueFormatter={(value) => typeof value === "number" ? securityFormatNumber(value, locale) : labels.unknown} />} />
        {securitySeverities.map((severity, index) => <Area key={severity} dataKey={severity} type="linear" stackId="risks" stroke={`var(--color-${severity})`} strokeWidth={2} strokeDasharray={index === 3 ? "4 3" : undefined} fill={`url(#${gradientId}-${severity})`} connectNulls={false} isAnimationActive={false} />)}
      </AreaChart>
    </ChartContainer>
    <details className="text-label text-fg-muted">
      <summary className="w-fit cursor-pointer rounded-lg focus-visible:outline focus-visible:outline-1 focus-visible:outline-focus-ring">{labels.viewValues}</summary>
      <div className="mt-3 max-h-48 overflow-auto rounded-lg border-hairline border-border">
        <table className="w-full text-left tabular-nums"><caption className="sr-only">{labels.trendDescription}</caption><thead><tr><th className="p-2">{labels.range}</th>{securitySeverities.map((severity) => <th className="p-2" key={severity}>{labels[severity]}</th>)}</tr></thead>
          <tbody>{points.map((point) => <tr key={point.at} className="border-t-hairline border-border-subtle"><th scope="row" className="p-2 font-normal">{date.format(point.at)}</th>{securitySeverities.map((severity) => <td className="p-2" key={severity}>{securityFormatNumber(point[severity], locale)}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </details>
  </div>;
}

export function SecurityPostureRadar({ data, labels }: { data: SecurityOverviewSnapshot; labels: SecurityOverviewLabels }) {
  const areas = data.posture;
  const complete = areas && areas.length >= 3 && areas.every((area) => securityValidNumber(area.score, 100));
  const previousComplete = complete && areas.every((area) => securityValidNumber(area.previousScore, 100));
  if (!complete) return <Empty reason="no-data" scope="inline"><EmptyDescription>{labels.noData}</EmptyDescription></Empty>;
  return <ChartContainer className="h-56" aria-label={labels.postureDescription} config={{ score: { label: labels.current, color: chartSeriesColor("score") }, previousScore: { label: labels.previous, color: chartSeriesColor("previousScore") } }} dataTable={{ caption: labels.postureDescription, summary: labels.viewValues, columns: [labels.posture, labels.current, labels.previous], rows: areas.map((area) => ({ id: area.id, label: area.label, values: [String(area.score), securityValidNumber(area.previousScore, 100) ? String(area.previousScore) : labels.unknown] })) }}>
    <RadarChart data={[...areas]} accessibilityLayer={false} outerRadius="70%">
      <PolarGrid stroke="var(--border)" />
      <PolarAngleAxis dataKey="label" tick={{ fill: "var(--fg-muted)", fontSize: "var(--font-size-label)" }} />
      <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
      <ChartTooltip content={<ChartTooltipContent valueFormatter={(value) => typeof value === "number" ? `${value} / 100` : labels.unknown} />} />
      {previousComplete && <Radar dataKey="previousScore" stroke="var(--color-previousScore)" strokeDasharray="4 4" fill="none" isAnimationActive={false} />}
      <Radar dataKey="score" stroke="var(--color-score)" fill="var(--color-score)" fillOpacity={0.15} isAnimationActive={false} />
    </RadarChart>
  </ChartContainer>;
}
