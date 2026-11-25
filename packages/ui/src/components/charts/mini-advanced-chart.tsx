"use client";

import { useState, type ReactNode, type SVGProps } from "react";
import { CartesianGrid, Line, LineChart, Sankey, Treemap, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "#components/chart";
import { chartColor, type ChartColorIndex } from "#components/chart-primitives";
import { RadarArea, RadarAxis, RadarChart, RadarGrid, RadarLabels } from "#components/radar-chart";
import { chartKeyboardIndex } from "./chart-keyboard";

type ScaleDomain = [min: number, max: number];
type NamedColor = { label: string; color?: ChartColorIndex };
type BoxStatistics = [min: number, q1: number, median: number, q3: number, max: number];

export type MiniAdvancedSpec =
  | { kind: "box"; rows: (NamedColor & { statistics: BoxStatistics })[]; domain?: ScaleDomain }
  | { kind: "bullet"; rows: (NamedColor & { value: number; target: number })[]; max: number; bands?: [number, number] }
  | { kind: "dumbbell"; rows: (NamedColor & { before: number; after: number })[]; domain?: ScaleDomain; beforeLabel: string; afterLabel: string; lowerIsBetter?: boolean }
  | { kind: "trace"; spans: (NamedColor & { start: number; end: number })[]; duration?: number }
  | { kind: "radar"; metrics: { key: string; label: string }[]; series: (NamedColor & { values: Record<string, number> })[] }
  | { kind: "treemap"; parts: (NamedColor & { value: number })[] }
  | { kind: "sankey"; nodes: NamedColor[]; links: { source: number; target: number; value: number }[] }
  | { kind: "rank"; periods: string[]; series: (NamedColor & { ranks: (number | null)[] })[] };

type PlotProps<Kind extends MiniAdvancedSpec["kind"] = MiniAdvancedSpec["kind"]> = {
  spec: Extract<MiniAdvancedSpec, { kind: Kind }>;
  label: string;
  locale: string;
  unit?: string;
  colorIndex?: ChartColorIndex;
};

type Reading = { label: string; value: string };
type NumberLabel = (value: number) => string;
type PlotSample = Reading & {
  bounds: { x: number; y: number; width: number; height: number };
  marks: ReactNode;
};

const palette: ChartColorIndex[] = [1, 5, 2, 3, 4];
const width = 264;
const height = 96;
const railLeft = 76;
const railRight = 259;

export function isSemanticChartColor(color?: ChartColorIndex): color is 6 | 7 {
  return color === 6 || color === 7;
}

export interface MiniLegendItem {
  key?: string;
  label: string;
  color: string;
  variant?: "dot" | "dashed" | "hollow";
}

export function MiniLegend({ items, className }: { items: MiniLegendItem[]; className?: string }) {
  if (items.length === 0) return null;
  return (
    <div className={className ?? "flex shrink-0 flex-wrap items-center gap-x-2.5 gap-y-0.5 text-label leading-none text-fg-muted"}>
      {items.map((item) => (
        <span key={item.key ?? item.label} className="inline-flex min-w-0 items-center gap-1">
          {item.variant === "dashed" ? (
            <span className="h-0 w-2.5 shrink-0 border-t border-dashed" style={{ borderColor: item.color }} />
          ) : item.variant === "hollow" ? (
            <span className="size-1.5 shrink-0 rounded-full border bg-surface-floating" style={{ borderColor: item.color }} />
          ) : (
            <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
          )}
          <span className="truncate">{item.label}</span>
        </span>
      ))}
    </div>
  );
}

export function MiniReadingPopup({ label, value }: Reading) {
  return (
    <div data-mini-reading="" role="status" className="pointer-events-none absolute bottom-full right-0 z-raised grid max-w-full gap-1 rounded-lg border-hairline border-border bg-surface-floating px-3 py-2 text-label shadow-floating">
      <span className="font-medium text-fg-default">{label}</span>
      <span className="tabular-nums text-fg-muted">{value}</span>
    </div>
  );
}

function seriesColor(series: NamedColor, index: number, override?: ChartColorIndex) {
  if (isSemanticChartColor(series.color)) return chartColor(series.color);
  return chartColor((index === 0 ? override : undefined) ?? series.color ?? palette[index % palette.length]);
}

function formatReading(locale: string, unit?: string): NumberLabel {
  const fmt = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  return (value) => {
    if (!Number.isFinite(value)) return "—";
    return `${fmt.format(value)}${unit ? ` ${unit}` : ""}`;
  };
}

function NoData({ locale }: { locale: string }) {
  return <p role="status" className="grid h-full place-items-center text-label text-fg-muted">{locale === "zh-CN" ? "暂无数据" : "No data"}</p>;
}

function AxisLabel(props: SVGProps<SVGTextElement>) {
  return <text fill="var(--fg-muted)" fontSize={11} dominantBaseline="middle" {...props} />;
}

function scaled(value: number, [min, max]: ScaleDomain, from: number, to: number) {
  const ratio = max > min ? Math.max(0, Math.min(1, (value - min) / (max - min))) : 0.5;
  return from + (to - from) * ratio;
}

function rail(index: number, count: number, spanHeight = 85) {
  const rowHeight = spanHeight / count;
  const y = 4 + index * rowHeight;
  return { center: y + rowHeight / 2, bounds: { x: 2, y, width: 260, height: rowHeight } };
}

function RailGrid({ bottom = 90 }: { bottom?: number }) {
  return <g aria-hidden="true">{[0, 0.25, 0.5, 0.75, 1].map((step) => {
    const x = railLeft + step * (railRight - railLeft);
    return <line key={step} x1={x} x2={x} y1={5} y2={bottom} stroke="var(--border)" strokeDasharray="2 3" />;
  })}</g>;
}

function MiniPlot({ label, samples, guide, locale, plotHeight = height }: { label: string; samples: PlotSample[]; guide: ReactNode; locale: string; plotHeight?: number }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const current = activeIndex === null ? undefined : samples[activeIndex];
  if (samples.length === 0) return <NoData locale={locale} />;

  return <div className="relative h-full min-w-0">
    <svg
      role="group" aria-label={label} tabIndex={0} viewBox={`0 0 ${width} ${plotHeight}`}
      className="h-full w-full rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-focus-ring"
      onBlur={() => setActiveIndex(null)}
      onPointerLeave={() => setActiveIndex(null)}
      onKeyDown={(event) => {
        const next = chartKeyboardIndex(event, activeIndex, samples.length);
        if (next === undefined) return;
        event.stopPropagation();
        setActiveIndex(next);
      }}
    >
      {guide}
      {samples.map((sample, index) => (
        <g key={`${sample.label}-${index}`} onPointerEnter={() => setActiveIndex(index)} onPointerDown={() => setActiveIndex(index)}>
          <rect {...sample.bounds} rx={3} fill={index === activeIndex ? "var(--hover)" : "transparent"} />
          <g pointerEvents="none">{sample.marks}</g>
        </g>
      ))}
    </svg>
    {current && <MiniReadingPopup label={current.label} value={current.value} />}
  </div>;
}

function BoxPlot({ spec, label, locale, unit, colorIndex }: PlotProps<"box">) {
  const fmt = formatReading(locale, unit);
  const rows = spec.rows.filter(({ statistics }) => statistics.every((value, i) => Number.isFinite(value) && (i === 0 || value >= statistics[i - 1])));
  const domain = spec.domain ?? [Math.min(...rows.map((row) => row.statistics[0])), Math.max(...rows.map((row) => row.statistics[4]))];
  const y = (value: number) => scaled(value, domain, 77, 8);
  const span = 252 / Math.max(rows.length, 1);
  const samples = rows.map((row, index) => {
    const [min, q1, median, q3, max] = row.statistics;
    const x = 6 + span * (index + 0.5);
    const color = chartColor(colorIndex ?? row.color ?? 5);
    const half = Math.min(12, span * 0.28);
    return {
      label: row.label,
      value: `${locale === "zh-CN" ? "中位数" : "Median"} ${fmt(median)} · Q1 ${fmt(q1)} · Q3 ${fmt(q3)} · ${fmt(min)}–${fmt(max)}`,
      bounds: { x: x - span / 2, y: 3, width: span, height: 92 },
      marks: <>
        <line x1={x} x2={x} y1={y(min)} y2={y(max)} stroke={color} strokeWidth={1.4} />
        {[min, max].map((value, i) => <line key={i} x1={x - half * 0.58} x2={x + half * 0.58} y1={y(value)} y2={y(value)} stroke={color} strokeWidth={1.5} />)}
        <rect x={x - half} y={y(q3)} width={half * 2} height={Math.max(1.5, y(q1) - y(q3))} rx={2} fill="var(--surface-floating)" />
        <rect x={x - half} y={y(q3)} width={half * 2} height={Math.max(1.5, y(q1) - y(q3))} rx={2} fill={color} fillOpacity={0.24} stroke={color} strokeWidth={1.2} />
        <line x1={x - half} x2={x + half} y1={y(median)} y2={y(median)} stroke={color} strokeWidth={2} />
        <AxisLabel x={x} y={89} textAnchor="middle">{row.label}</AxisLabel>
      </>,
    };
  });
  return <MiniPlot label={label} locale={locale} samples={samples} guide={[10, 32, 54, 76].map((position) =>
    <line key={position} x1={4} x2={260} y1={position} y2={position} stroke="var(--border)" strokeDasharray="3 4" />)} />;
}

function BulletPlot({ spec, label, locale, unit, colorIndex }: PlotProps<"bullet">) {
  const fmt = formatReading(locale, unit);
  const rows = spec.max > 0 ? spec.rows.filter((row) => Number.isFinite(row.value) && Number.isFinite(row.target)) : [];
  const position = (value: number) => scaled(value, [0, spec.max], railLeft, railRight);
  const bands = spec.bands ?? [spec.max * 0.5, spec.max * 0.8];
  const boundaries = [0, ...bands, spec.max].map(position);
  const samples = rows.map((row, index) => {
    const { center, bounds } = rail(index, rows.length);
    const color = chartColor(colorIndex ?? row.color ?? 1);
    return {
      label: row.label,
      value: `${fmt(row.value)} · ${locale === "zh-CN" ? "目标" : "Target"} ${fmt(row.target)}`,
      bounds,
      marks: <>
        <AxisLabel x={5} y={center}>{row.label}</AxisLabel>
        {boundaries.slice(1).map((end, band) => <rect key={band} x={boundaries[band]} y={center - 7} width={Math.max(0, end - boundaries[band])} height={14} fill="var(--fg-muted)" fillOpacity={[0.16, 0.105, 0.055][band]} />)}
        <rect x={railLeft} y={center - 3} width={position(row.value) - railLeft} height={6} rx={1.5} fill={color} />
        <line x1={position(row.target)} x2={position(row.target)} y1={center - 9} y2={center + 9} stroke="var(--fg-default)" strokeWidth={1.5} />
      </>,
    };
  });
  return <MiniPlot label={label} locale={locale} samples={samples} guide={null} />;
}

function DumbbellPlot({ spec, label, locale, unit, colorIndex }: PlotProps<"dumbbell">) {
  const fmt = formatReading(locale, unit);
  const rows = spec.rows.filter((row) => Number.isFinite(row.before) && Number.isFinite(row.after));
  if (rows.length === 0) return <NoData locale={locale} />;
  const endpoints = rows.flatMap((row) => [row.before, row.after]);
  const domain = spec.domain ?? [Math.min(...endpoints), Math.max(...endpoints)];
  const position = (value: number) => scaled(value, domain, railLeft + 5, railRight - 5);
  const baseColor = chartColor(colorIndex ?? rows[0]?.color ?? 5);
  const samples = rows.map((row, index) => {
    const { center, bounds } = rail(index, rows.length, 72);
    const regressed = spec.lowerIsBetter === undefined ? false : spec.lowerIsBetter ? row.after > row.before : row.after < row.before;
    const color = regressed ? chartColor(7) : chartColor(colorIndex ?? row.color ?? 5);
    const before = position(row.before);
    const after = position(row.after);
    const delta = row.after - row.before;
    const signedDelta = `${delta > 0 ? "+" : ""}${fmt(delta)}`;
    return {
      label: row.label,
      value: `${spec.beforeLabel} ${fmt(row.before)} → ${spec.afterLabel} ${fmt(row.after)} (${signedDelta})`,
      bounds,
      marks: <>
        <AxisLabel x={5} y={center}>{row.label}</AxisLabel>
        <line x1={before} x2={after} y1={center} y2={center} stroke={color} strokeOpacity={0.45} strokeWidth={3} strokeLinecap="round" />
        <circle cx={before} cy={center} r={3.8} stroke={color} strokeWidth={1.5} fill="var(--surface-floating)" />
        <circle cx={after} cy={center} r={3.8} fill={color} />
      </>,
    };
  });
  return (
    <div className="flex h-full min-h-0 flex-col gap-1">
      <div className="min-h-0 flex-1">
        <MiniPlot label={label} locale={locale} samples={samples} plotHeight={78} guide={<RailGrid bottom={75} />} />
      </div>
      <MiniLegend items={[
        { key: "before", label: spec.beforeLabel, color: baseColor, variant: "hollow" },
        { key: "after", label: spec.afterLabel, color: baseColor },
      ]} />
    </div>
  );
}

function TracePlot({ spec, label, locale, unit, colorIndex }: PlotProps<"trace">) {
  const fmt = formatReading(locale, unit);
  const spans = spec.spans.filter((span) => Number.isFinite(span.start) && Number.isFinite(span.end) && span.start >= 0 && span.end >= span.start);
  const duration = Math.max(spec.duration ?? 0, ...spans.map((span) => span.end));
  const x = (value: number) => scaled(value, [0, duration], railLeft, railRight);
  const samples = spans.map((span, index) => {
    const { center, bounds } = rail(index, spans.length);
    const color = seriesColor(span, index, colorIndex);
    return {
      label: span.label,
      value: `${fmt(span.end - span.start)} · ${fmt(span.start)}–${fmt(span.end)}`,
      bounds,
      marks: <>
        <AxisLabel x={5} y={center}>{span.label}</AxisLabel>
        <rect x={x(span.start)} y={center - 5} width={Math.max(1, x(span.end) - x(span.start))} height={10} fill={color} rx={2.5} />
      </>,
    };
  });
  return <MiniPlot label={label} locale={locale} samples={samples} guide={<RailGrid />} />;
}

function RadarPlot({ spec, locale, colorIndex }: PlotProps<"radar">) {
  if (spec.metrics.length < 3 || !spec.series.length) return <NoData locale={locale} />;
  const data = spec.series.map((item, index) => ({
    label: item.label, color: seriesColor(item, index, colorIndex), values: item.values,
  }));
  return <div className="flex h-full min-w-0 items-center justify-center gap-5">
    <RadarChart data={data} metrics={spec.metrics} size={94} margin={15} levels={4} animate={false} className="shrink-0">
      <RadarGrid showLabels={false} strokeOpacity={0.85} />
      <RadarAxis />
      <RadarLabels offset={9} fontSize={10} />
      {data.map((item, index) => <RadarArea key={item.label} index={index} showPoints={false} showGlow={false} fillOpacity={0.15} />)}
    </RadarChart>
    <div className="grid min-w-0 gap-1.5 text-label text-fg-muted">
      {data.map((item) => <span key={item.label} className="flex min-w-0 items-center gap-1.5">
        <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
        <span className="truncate" title={item.label}>{item.label}</span>
      </span>)}
    </div>
  </div>;
}

function ItemTooltip({ label, locale, unit }: Omit<PlotProps, "spec">) {
  const fmt = formatReading(locale, unit);
  return <ChartTooltip isAnimationActive={false} cursor={false}
    content={({ active, payload }) => (
      <ChartTooltipContent active={active} label={String(payload?.[0]?.name ?? label)} payload={payload}
        hideIndicator valueFormatter={(value) => typeof value === "number" ? fmt(value) : "—"} />
    )} />;
}

function TreemapPlot({ spec, label, locale, unit, colorIndex }: PlotProps<"treemap">) {
  const data = spec.parts.filter((part) => Number.isFinite(part.value) && part.value > 0).map((part, index) => ({
    name: part.label, value: part.value, tileColor: seriesColor(part, index, colorIndex),
  }));
  if (!data.length) return <NoData locale={locale} />;
  return <ChartContainer className="h-full min-h-0" config={{ value: { label } }}>
    <Treemap data={data} dataKey="value" nameKey="name" nodeGap={3} isAnimationActive={false} isUpdateAnimationActive={false}
      content={({ x, y, width, height, depth, name, tileColor }) => depth === 0 ? <g /> : <g>
        <rect data-mini-treemap-tile="" x={x} y={y} width={width} height={height} rx={3} fill={String(tileColor)} fillOpacity={0.28} stroke={String(tileColor)} strokeOpacity={0.42} strokeWidth={0.75} />
        {width >= name.length * 10 + 8 && height >= 13 && <AxisLabel x={x + 5} y={y + height / 2} fontSize={10} fill="var(--fg-default)" pointerEvents="none">{name}</AxisLabel>}
      </g>}>
      <ItemTooltip label={label} locale={locale} unit={unit} />
    </Treemap>
  </ChartContainer>;
}

function validFlow(spec: Extract<MiniAdvancedSpec, { kind: "sankey" }>) {
  const targets = spec.nodes.map(() => [] as number[]);
  const incoming = spec.nodes.map(() => 0);
  for (const { source, target, value } of spec.links) {
    if (!targets[source] || incoming[target] === undefined || !Number.isFinite(value) || value < 0) return false;
    if (value === 0) continue;
    targets[source].push(target);
    incoming[target]++;
  }
  const ready = incoming.flatMap((count, index) => count === 0 ? [index] : []);
  for (let index = 0; index < ready.length; index++) {
    for (const target of targets[ready[index]]) {
      incoming[target]--;
      if (incoming[target] === 0) ready.push(target);
    }
  }
  return ready.length === spec.nodes.length && spec.links.some((link) => link.value > 0);
}

function SankeyPlot({ spec, label, locale, unit, colorIndex }: PlotProps<"sankey">) {
  if (!validFlow(spec)) return <NoData locale={locale} />;
  const nodes = spec.nodes.map((node, index) => ({ name: node.label, color: seriesColor(node, index, colorIndex) }));
  const links = spec.links.filter((link) => link.value > 0);
  const destinationIndices = new Set(links.map((link) => link.target));
  return <ChartContainer className="h-full min-h-0" config={{ value: { label } }}>
    <Sankey title={label} data={{ nodes, links }} margin={{ top: 6, right: 5, bottom: 6, left: 5 }} nodeWidth={7} nodePadding={10} iterations={8}
      node={({ x, y, width, height, index }) => {
        const node = nodes[index];
        const barHeight = Math.max(3, height);
        const onRight = destinationIndices.has(index) && x >= node.name.length * 6 + 8;
        return <g>
          <rect data-mini-sankey-node="" x={x} y={y + (height - barHeight) / 2} width={width} height={barHeight} rx={1.5} fill={node.color} />
          {height >= 2.5 && <AxisLabel x={onRight ? x - 4 : x + width + 4} y={y + height / 2} fontSize={10} textAnchor={onRight ? "end" : "start"}
            fill="var(--fg-default)" stroke="var(--surface-floating)" strokeWidth={2.5} paintOrder="stroke" pointerEvents="none">{node.name}</AxisLabel>}
        </g>;
      }}
      link={({ sourceX, sourceY, sourceControlX, targetX, targetY, targetControlX, linkWidth, index }) => (
        <path data-mini-sankey-link="" d={`M ${sourceX},${sourceY} C ${sourceControlX},${sourceY} ${targetControlX},${targetY} ${targetX},${targetY}`}
          fill="none" stroke={nodes[links[index].target].color} strokeOpacity={0.32} strokeWidth={linkWidth} />
      )}>
      <ItemTooltip label={label} locale={locale} unit={unit} />
    </Sankey>
  </ChartContainer>;
}

function isRank(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1;
}

function RankPlot({ spec, label, locale, colorIndex }: PlotProps<"rank">) {
  const columns = spec.series.map((entry, index) => ({
    key: `rank${index}`, entry, color: seriesColor(entry, index, colorIndex),
  }));
  const data = spec.periods.map((period, index) => ({
    period,
    ...Object.fromEntries(columns.map(({ key, entry }) => {
      const rank = entry.ranks[index];
      return [key, isRank(rank) ? rank : null];
    })),
  }));
  const ranks = spec.series.flatMap((entry) => entry.ranks.slice(0, spec.periods.length).filter(isRank));
  if (!data.length || !ranks.length) return <NoData locale={locale} />;
  const max = Math.max(2, ...ranks);
  const ticks = max <= 6 ? Array.from({ length: max }, (_, index) => index + 1) : undefined;
  const config: ChartConfig = Object.fromEntries(columns.map(({ key, entry, color }) => [key, { label: entry.label, color }]));
  return (
    <div className="flex h-full min-h-0 flex-col gap-1">
      <ChartContainer className="min-h-0 flex-1" config={config}>
        <LineChart data={data} title={label} margin={{ left: 0, right: 12, top: 6, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="2 4" />
          <XAxis dataKey="period" axisLine={false} tickLine={false} height={15} tick={{ fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis width={24} reversed domain={[1, max]} ticks={ticks} interval={0} allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 9 }} tickFormatter={(value: number) => `#${value}`} />
          <ChartTooltip isAnimationActive={false}
            content={({ active, label: period, payload }) => (
              <ChartTooltipContent active={active} label={period} payload={payload}
                valueFormatter={(value) => {
                  if (typeof value !== "number") return "—";
                  return locale === "zh-CN" ? `第 ${value} 名` : `#${value}`;
                }} />
            )} />
          {columns.map(({ key, color }) => <Line key={key} dataKey={key} type="linear" stroke={color} strokeWidth={1.8}
            dot={{ r: 2, fill: color, strokeWidth: 0 }} activeDot={{ r: 3 }} isAnimationActive={false} />)}
        </LineChart>
      </ChartContainer>
      <MiniLegend items={columns.map(({ key, entry, color }) => ({ key, label: entry.label, color }))} />
    </div>
  );
}

export function MiniAdvancedChart(props: PlotProps) {
  const { spec } = props;
  switch (spec.kind) {
    case "box": return <BoxPlot {...props} spec={spec} />;
    case "bullet": return <BulletPlot {...props} spec={spec} />;
    case "dumbbell": return <DumbbellPlot {...props} spec={spec} />;
    case "trace": return <TracePlot {...props} spec={spec} />;
    case "radar": return <RadarPlot {...props} spec={spec} />;
    case "treemap": return <TreemapPlot {...props} spec={spec} />;
    case "sankey": return <SankeyPlot {...props} spec={spec} />;
    case "rank": return <RankPlot {...props} spec={spec} />;
  }
}
