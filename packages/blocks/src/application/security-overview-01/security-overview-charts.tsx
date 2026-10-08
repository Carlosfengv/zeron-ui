"use client";

import { useCallback, useMemo, useRef, useState, type PointerEvent } from "react";
import { curveLinear } from "@visx/curve";
import { Area, AreaChart } from "@zeron/ui/area-chart";
import { Grid, XAxis, YAxis, ChartTooltip, TooltipBox, TooltipContent } from "@zeron/ui/chart-core";
import { ChartDataTable, ChartLegend, chartColor, chartStatusColors } from "@zeron/ui/chart-primitives";
import { RadarChart, RadarGrid, RadarAxis, RadarLabels, RadarArea } from "@zeron/ui/radar-chart";
import { RingChart, Ring, RingCenter } from "@zeron/ui/ring-chart";
import { badgeColors } from "@zeron/ui/badge";
import { Empty, EmptyDescription } from "@zeron/ui/empty";
import { securityFormatNumber, securitySeverities, securitySeverityColors, securityTrendPoints, securityValidNumber } from "./security-overview-data";
import type { SecurityOverviewLabels, SecurityOverviewScanState, SecurityOverviewSnapshot } from "./security-overview-types";

const scoreColors = { ...chartStatusColors, success: chartColor(1) };
const severityColors = Object.fromEntries(securitySeverities.map((severity) => [severity, badgeColors[securitySeverityColors[severity]]]));

export function SecurityScore({ data, scan, labels, locale }: { data: SecurityOverviewSnapshot; scan: SecurityOverviewScanState; labels: SecurityOverviewLabels; locale: string }) {
  const score = securityValidNumber(data.score, 100) ? data.score : null;
  const awaiting = scan.status === "succeeded" && scan.snapshotId !== data.id;
  const running = scan.status === "starting" || scan.status === "running" || scan.status === "refreshing" || awaiting;
  const description = `${labels.securityScore} ${securityFormatNumber(score, locale, 100)} / 100${running ? ` · ${labels.previousSnapshot}` : ""}`;
  // Unknown scores do not become zero-valued progress observations.
  if (score === null) return <span role="img" aria-label={description} className="flex size-24 shrink-0 items-center justify-center rounded-full border-hairline border-border text-heading text-fg-subtle">{labels.unknown}</span>;
  return <div role="group" className="shrink-0" aria-label={description}>
    <RingChart size={96} data={[{ label: labels.securityScore, value: score, maxValue: 100, color: scoreColors[data.scoreTone] }]} animationDuration={0}>
      <Ring index={0} animate={false} showGlow={false} />
      <RingCenter>{() => <span className="text-heading font-semibold">{data.grade ?? labels.unknown}</span>}</RingCenter>
    </RingChart>
  </div>;
}

export function SecurityTrend({ data, labels, locale, timeZone }: { data: SecurityOverviewSnapshot; labels: SecurityOverviewLabels; locale: string; timeZone: string }) {
  const points = useMemo(() => securityTrendPoints(data), [data]);
  const date = useMemo(() => new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone }), [locale, timeZone]);
  if (!points?.length || points.every((point) => point.total === null)) return <Empty reason="no-data" scope="inline"><EmptyDescription>{labels.noData}</EmptyDescription></Empty>;
  return <div className="space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 className="text-body font-medium text-fg-default">{labels.open}</h3><p className="mt-1 text-label text-fg-subtle">{labels.trendDescription}</p></div>
      <ChartLegend className="flex flex-wrap gap-x-3 gap-y-1" items={securitySeverities.map((severity) => ({ id: severity, label: labels[severity], color: severityColors[severity] }))} />
    </div>
    <div role="group" aria-label={labels.trendDescription}>
      <AreaChart data={points} xDataKey="at" xDomain={[new Date(data.window.start), new Date(data.window.end)]} className="h-48" aspectRatio="auto" margin={{ top: 12, right: 16, bottom: 36, left: 36 }} animationDuration={0} yDomainTween={false}>
        <Grid horizontal />
        {securitySeverities.map((severity, index) => <Area key={severity} dataKey={severity} stackId="risks" curve={curveLinear} stroke={severityColors[severity]} fill={severityColors[severity]} fillOpacity={0.25} gradientToOpacity={0.04} animate={false} showHighlight={false} showMarkers={points.length === 1} dashFromIndex={index === 3 ? 0 : undefined} dashArray="4 3" />)}
        <XAxis formatDate={value => date.format(value)} numTicks={5} tickerHalfWidth={32} />
        <YAxis formatValue={value => Number.isInteger(value) ? securityFormatNumber(value, locale) : ""} />
        <ChartTooltip showDatePill={false} content={({ point }) => <TooltipContent title={date.format(Number(point.at))} rows={securitySeverities.map(severity => ({ label: labels[severity], color: severityColors[severity], value: securityFormatNumber(point[severity] as number | null, locale) }))} />} />
      </AreaChart>
    </div>
    <ChartDataTable caption={labels.trendDescription} summary={labels.viewValues} columns={[labels.range, ...securitySeverities.map(severity => labels[severity])]} rows={points.map(point => ({ id: String(point.at), label: date.format(point.at), values: securitySeverities.map(severity => securityFormatNumber(point[severity], locale)) }))} />
  </div>;
}

export function SecurityPostureRadar({ data, labels }: { data: SecurityOverviewSnapshot; labels: SecurityOverviewLabels }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{ id: string; x: number; y: number } | null>(null);
  const onPointHover = useCallback((id: string | null, event: PointerEvent<SVGCircleElement>) => {
    const bounds = containerRef.current?.getBoundingClientRect();
    setHover(id && bounds ? { id, x: event.clientX - bounds.left, y: event.clientY - bounds.top } : null);
  }, []);
  const areas = data.posture;
  const complete = areas && areas.length >= 3 && areas.every((area) => securityValidNumber(area.score, 100));
  const previousComplete = complete && areas.every((area) => securityValidNumber(area.previousScore, 100));
  const metrics = useMemo(() => (areas ?? []).map(area => ({ key: area.id, label: area.label })), [areas]);
  const series = useMemo(() => complete ? [
    { label: labels.current, color: chartColor(1), values: Object.fromEntries(areas.map(area => [area.id, area.score as number])) },
    ...(previousComplete ? [{ label: labels.previous, color: chartColor(2), values: Object.fromEntries(areas.map(area => [area.id, area.previousScore as number])) }] : []),
  ] : [], [areas, complete, previousComplete, labels.current, labels.previous]);
  if (!complete) return <Empty reason="no-data" scope="inline"><EmptyDescription>{labels.noData}</EmptyDescription></Empty>;
  const hoveredArea = hover && areas.find(area => area.id === hover.id);
  return <div className="min-w-0" data-slot="security-posture-chart">
    <div ref={containerRef} className="relative flex h-56 items-center justify-center" onPointerLeave={() => setHover(null)}>
      <RadarChart size={224} data={series} metrics={metrics} margin={56} animate={false}>
        <RadarGrid /><RadarAxis /><RadarLabels offset={12} />
        {previousComplete && <RadarArea index={1} strokeDasharray="4 4" fillOpacity={0} showPoints={false} showGlow={false} />}
        <RadarArea index={0} showGlow={false} onPointHover={onPointHover} />
      </RadarChart>
      <TooltipBox containerRef={containerRef} containerWidth={containerRef.current?.clientWidth ?? 224} containerHeight={224} x={hover?.x ?? 0} y={hover?.y ?? 0} visible={Boolean(hoveredArea)} animate={false}>
        {hoveredArea && <TooltipContent title={hoveredArea.label} rows={[
          { label: labels.current, color: chartColor(1), value: `${hoveredArea.score} / 100` },
          ...(previousComplete ? [{ label: labels.previous, color: chartColor(2), value: `${hoveredArea.previousScore} / 100` }] : []),
        ]} />}
      </TooltipBox>
    </div>
    <ChartDataTable caption={labels.postureDescription} summary={labels.viewValues} columns={[labels.posture, labels.current, labels.previous]} rows={areas.map(area => ({ id: area.id, label: area.label, values: [String(area.score), securityValidNumber(area.previousScore, 100) ? String(area.previousScore) : labels.unknown] }))} />
  </div>;
}
