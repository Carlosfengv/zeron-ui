"use client";

import { useId } from "react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, XAxis, YAxis } from "recharts";
import { badgeColors } from "@zeron/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@zeron/ui/chart";
import { Empty, EmptyDescription } from "@zeron/ui/empty";
import { securityFormatNumber, securitySeverities, securitySeverityColors, securityTrendPoints, securityValidCount, securityValidNumber } from "./security-overview-data";
import type { SecurityOverviewLabels, SecurityOverviewScanState, SecurityOverviewSnapshot } from "./security-overview-types";

const scoreColors = { success: "var(--fg-success)", warning: "var(--fg-warning)", danger: "var(--fg-danger)", neutral: "var(--fg-muted)" };

export function SecurityScore({ data, scan, labels, locale }: { data: SecurityOverviewSnapshot; scan: SecurityOverviewScanState; labels: SecurityOverviewLabels; locale: string }) {
  const score = securityValidNumber(data.score, 100) ? data.score : null;
  const awaiting = scan.status === "succeeded" && scan.snapshotId !== data.id;
  const running = scan.status === "starting" || scan.status === "running" || scan.status === "refreshing" || awaiting;
  const progress = scan.status === "running" && securityValidCount(scan.completed) && securityValidCount(scan.total) && scan.total > 0 && scan.completed <= scan.total ? scan.completed / scan.total : null;
  const ratio = scan.status === "refreshing" || awaiting ? 1 : running ? (progress ?? 0) : (score === null ? 0 : score / 100);
  return <figure className="relative size-24 shrink-0" aria-label={`${labels.securityScore} ${securityFormatNumber(score, locale, 100)} / 100${running ? ` · ${labels.previousSnapshot}` : ""}`}>
    <ChartContainer className="h-full min-h-0" aria-hidden="true" config={{ score: { color: scoreColors[data.scoreTone] } }}>
      <PieChart accessibilityLayer={false}>
        <Pie data={[{ value: ratio }, { value: 1 - ratio }]} dataKey="value" startAngle={90} endAngle={-270} innerRadius="88%" outerRadius="100%" stroke="none" isAnimationActive={false}>
          <Cell fill="var(--color-score)" /><Cell fill="var(--muted)" />
        </Pie>
      </PieChart>
    </ChartContainer>
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center text-heading font-semibold text-fg-default">{score === null ? labels.unknown : data.grade ?? labels.unknown}</span>
  </figure>;
}

export function SecurityTrend({ data, labels, locale, timeZone }: { data: SecurityOverviewSnapshot; labels: SecurityOverviewLabels; locale: string; timeZone: string }) {
  const gradientId = useId().replace(/:/g, "");
  const points = securityTrendPoints(data);
  const date = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone });
  const config: ChartConfig = Object.fromEntries(securitySeverities.map((severity) => [severity, { label: labels[severity], color: badgeColors[securitySeverityColors[severity]] }]));
  if (!points?.length || points.every((point) => point.total === null)) return <Empty reason="no-data" scope="inline"><EmptyDescription>{labels.noData}</EmptyDescription></Empty>;
  return <div className="space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 className="text-body font-medium text-fg-default">{labels.open}</h3><p className="mt-1 text-label text-fg-subtle">{labels.trendDescription}</p></div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-label text-fg-muted">{securitySeverities.map((severity) => <span key={severity} className="flex items-center gap-1.5"><span aria-hidden className="size-2 shrink-0 rounded-full" style={{ backgroundColor: badgeColors[securitySeverityColors[severity]] }} />{labels[severity]}</span>)}</div>
    </div>
    <ChartContainer className="h-48" config={config} aria-label={labels.trendDescription}>
      <AreaChart data={points} accessibilityLayer margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <defs>{securitySeverities.map((severity) => <linearGradient key={severity} id={`${gradientId}-${severity}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={`var(--color-${severity})`} stopOpacity={0.25} /><stop offset="100%" stopColor={`var(--color-${severity})`} stopOpacity={0.04} /></linearGradient>)}</defs>
        <CartesianGrid vertical={false} stroke="var(--border-subtle)" />
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
  return <ChartContainer className="h-56" aria-hidden="true" config={{ score: { label: labels.current, color: "var(--fg-brand)" }, previousScore: { label: labels.previous, color: "var(--fg-muted)" } }}>
    <RadarChart data={[...areas]} accessibilityLayer={false} outerRadius="70%">
      <PolarGrid stroke="var(--border)" />
      <PolarAngleAxis dataKey="label" tick={{ fill: "var(--fg-muted)", fontSize: "var(--font-size-label)" }} />
      <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
      {previousComplete && <Radar dataKey="previousScore" stroke="var(--color-previousScore)" strokeDasharray="4 4" fill="none" isAnimationActive={false} />}
      <Radar dataKey="score" stroke="var(--color-score)" fill="var(--color-score)" fillOpacity={0.15} isAnimationActive={false} />
    </RadarChart>
  </ChartContainer>;
}
