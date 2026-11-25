"use client";

import { Fragment, useId, useState, type ComponentPropsWithoutRef } from "react";
import {
  Area, Bar, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart,
  ReferenceArea, ReferenceLine, Scatter, ScatterChart, XAxis, YAxis,
} from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "#components/chart";
import { chartColor, type ChartColorIndex, SegmentedBar } from "#components/chart-primitives";
import { FunnelChart } from "#components/funnel-chart";
import { cn } from "#system/utils";
import {
  isSemanticChartColor, MiniAdvancedChart, MiniLegend, MiniReadingPopup, type MiniAdvancedSpec,
} from "./charts/mini-advanced-chart";

type MiniSeriesKey = "value" | "compare" | "other";

export interface MiniDatum {
  label: string;
  value: number | null;
  x?: number;
  compare?: number | null;
  other?: number | null;
  range?: [number, number];
  first?: number;
  last?: number;
}

export interface MiniSeries {
  key: MiniSeriesKey;
  label: string;
  color?: ChartColorIndex;
  dashed?: boolean;
}

export interface MiniPart {
  label: string;
  value: number;
  color?: ChartColorIndex;
}

export type MiniCartesianSpec = {
  kind: "line" | "area" | "bar" | "range" | "scatter";
  data: MiniDatum[];
  series?: MiniSeries[];
  color?: ChartColorIndex;
  curve?: "linear" | "monotone" | "stepAfter";
  layout?: "horizontal" | "vertical";
  stacked?: boolean;
  emphasizeLast?: boolean;
  rangeMode?: "waterfall";
  reference?: number;
  band?: [number, number];
  domain?: [number, number];
  xLabel?: string;
  legend?: boolean;
};

export type MiniChartSpec =
  | MiniCartesianSpec
  | { kind: "radial"; mode: "donut" | "pie" | "half" | "rings" | "radial-row"; parts: MiniPart[]; total?: number; center?: string }
  | { kind: "meter"; mode: "track" | "ticks" | "ruler" | "pills" | "arc" | "loop" | "range" | "zones" | "slope"; value: number; min?: number; max: number; color?: ChartColorIndex; target?: number; reverseZones?: boolean }
  | { kind: "matrix"; columns: number; cells: (number | null)[]; dots?: boolean; color?: ChartColorIndex; max?: number; states?: boolean; legend?: { label: string; color?: ChartColorIndex }[] }
  | { kind: "segments"; rows: { label?: string; parts: MiniPart[]; total?: number }[] }
  | { kind: "timeline"; start: number; end: number; now?: number; windows: { start: number; end: number; label: string; color?: ChartColorIndex }[] }
  | { kind: "funnel"; stages: MiniPart[]; color?: ChartColorIndex }
  | MiniAdvancedSpec;

export interface MiniChartProps extends Omit<ComponentPropsWithoutRef<"div">, "children"> {
  spec: MiniChartSpec;
  label: string;
  locale?: string;
  unit?: string;
  colorIndex?: ChartColorIndex;
}

const seriesColors: ChartColorIndex[] = [1, 2, 5, 3, 4];
const chartMargin = { top: 6, right: 5, bottom: 5, left: 5 };
const grid = { vertical: false, stroke: "var(--border)", strokeDasharray: "3 4" };

function MiniCartesian({ spec, label, unit, locale, colorIndex }: MiniChartProps & { spec: MiniCartesianSpec }) {
  const gradientId = `mini-fill-${useId().replace(/[^a-z0-9-]/gi, "")}`;
  const primary = chartColor(isSemanticChartColor(spec.color) ? spec.color : (colorIndex ?? spec.color ?? 1));
  const series = spec.series ?? [{ key: "value", label } satisfies MiniSeries];
  const colors = series.map((entry, index) => chartColor(index === 0 && colorIndex && !isSemanticChartColor(entry.color) ? colorIndex : entry.color ?? (index === 0 ? spec.color : undefined) ?? seriesColors[index % seriesColors.length]));
  const config: ChartConfig = Object.fromEntries(series.map((entry, index) => [entry.key, { label: entry.label, color: colors[index] }]));
  config.range = { label, color: primary };
  config.x = { label: spec.xLabel ?? "X", color: primary };
  const horizontal = spec.kind === "bar" && spec.layout === "horizontal";
  const isBar = spec.kind === "bar" || spec.kind === "range";
  const isWaterfall = spec.kind === "range" && spec.rangeMode === "waterfall";
  const numericX = spec.data.some((datum) => datum.x !== undefined) && !isBar;
  const hasNegative = spec.data.some((datum) => [datum.value, datum.compare, datum.other].some((v) => typeof v === "number" && v < 0));
  const showLegend = (spec.legend ?? series.length > 1) && series.length > 1;
  const valueAxis = spec.domain ?? (isBar ? ["auto", "auto"] : ["dataMin", "dataMax"]);
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const displayValue = (value: unknown, name: string) => {
    const suffix = unit && name !== config.x?.label ? ` ${unit}` : "";
    return Array.isArray(value)
      ? `${value.map((end) => number.format(Number(end))).join("–")}${suffix}`
      : typeof value === "number" && Number.isFinite(value) ? `${number.format(value)}${suffix}` : "—";
  };
  const displayLabel = (value: string | number) => numericX
    ? spec.data.find((datum) => datum.x === value)?.label ?? String(value)
    : value;
  const tooltip = (
    <ChartTooltip
      cursor={{ stroke: "var(--fg-subtle)", strokeWidth: 1, strokeDasharray: "3 4", fill: "var(--hover)" }}
      isAnimationActive={false}
      content={({ active, label: currentLabel, payload }) => (
        <ChartTooltipContent active={active} label={currentLabel} payload={payload} labelFormatter={displayLabel} valueFormatter={displayValue} />
      )}
    />
  );
  const axis = { hide: true, axisLine: false, tickLine: false } as const;

  return (
    <div className="flex h-full min-h-0 flex-col gap-1">
      <ChartContainer className="min-h-0 flex-1" config={config}>
        {spec.kind === "scatter" ? (
          <ScatterChart accessibilityLayer margin={chartMargin} title={label}>
            <CartesianGrid {...grid} />
            <XAxis {...axis} type="number" dataKey="x" name={spec.xLabel} domain={["dataMin", "dataMax"]} padding={{ left: 5, right: 5 }} />
            <YAxis {...axis} type="number" dataKey="value" name={label} domain={valueAxis} padding={{ top: 6, bottom: 5 }} />
            {tooltip}
            <Scatter data={spec.data} fill={primary} fillOpacity={0.72} isAnimationActive={false} />
          </ScatterChart>
        ) : (
          <ComposedChart accessibilityLayer data={spec.data} layout={horizontal ? "vertical" : "horizontal"} margin={isWaterfall ? { ...chartMargin, bottom: 0 } : chartMargin} title={label} stackOffset="sign">
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={primary} stopOpacity={0.27} />
                <stop offset="100%" stopColor={primary} stopOpacity={0.035} />
              </linearGradient>
            </defs>
            <CartesianGrid {...grid} horizontal={!horizontal} vertical={horizontal} />
            {horizontal ? (
              <>
                <XAxis {...axis} type="number" domain={valueAxis} />
                <YAxis type="category" dataKey="label" interval={0} tickLine={false} axisLine={false} width={68} tickMargin={5} tick={{ fill: "var(--fg-muted)", fontSize: 11 }} />
              </>
            ) : (
              <>
                <XAxis
                  hide={!isWaterfall}
                  axisLine={false}
                  tickLine={false}
                  dataKey={numericX ? "x" : "label"}
                  type={numericX ? "number" : "category"}
                  domain={numericX ? ["dataMin", "dataMax"] : undefined}
                  padding={numericX ? { left: 3, right: 3 } : undefined}
                  height={isWaterfall ? 16 : undefined}
                  interval={isWaterfall ? 0 : undefined}
                  tick={isWaterfall ? { fill: "var(--fg-muted)", fontSize: 10 } : undefined}
                />
                <YAxis {...axis} domain={valueAxis} padding={{ top: 5, bottom: 3 }} />
              </>
            )}
            {spec.band && <ReferenceArea y1={spec.band[0]} y2={spec.band[1]} fill={primary} fillOpacity={0.10} ifOverflow="extendDomain" />}
            {spec.reference !== undefined && (
              <ReferenceLine
                x={horizontal ? spec.reference : undefined}
                y={horizontal ? undefined : spec.reference}
                stroke="var(--fg-muted)"
                strokeOpacity={spec.reference === 0 && hasNegative ? 0.85 : 0.5}
                strokeWidth={spec.reference === 0 && hasNegative ? 1.25 : 1}
                strokeDasharray={spec.reference === 0 && hasNegative ? undefined : "4 4"}
                ifOverflow="extendDomain"
              />
            )}
            {tooltip}
            {spec.kind === "range" && (
              <Bar dataKey="range" fill={primary} maxBarSize={isWaterfall ? 24 : 10} isAnimationActive={false}
                shape={(props) => {
                  const { x = 0, y = 0, width = 0, height = 0, payload } = props;
                  const datum = payload as MiniDatum | undefined;
                  if (!datum?.range || height <= 0) return <g />;
                  const [low, high] = datum.range;
                  if (isWaterfall) {
                    const fill = low === 0 ? chartColor(6) : datum.value !== null && datum.value < 0 ? chartColor(2) : primary;
                    return <rect x={x} y={y} width={width} height={height} rx={2} fill={fill} />;
                  }
                  if (datum.first === undefined || datum.last === undefined || low === high) {
                    return <rect x={x} y={y} width={width} height={height} rx={width / 2} fill={primary} fillOpacity={0.72} />;
                  }
                  const position = (value: number) => y + height * ((high - value) / (high - low));
                  const start = position(datum.first);
                  const end = position(datum.last);
                  const color = datum.last < datum.first ? chartColor(2) : primary;
                  return <g>
                    <line x1={x + width / 2} x2={x + width / 2} y1={y} y2={y + height} stroke={color} strokeWidth={1.3} />
                    <rect x={x} y={Math.min(start, end)} width={width} height={Math.max(2, Math.abs(end - start))} rx={1.5} fill={color} />
                  </g>;
                }}
              />
            )}
            {spec.kind !== "range" && series.map((entry, index) => {
              const color = colors[index];
              if (spec.kind === "bar") return <Bar key={entry.key} dataKey={entry.key} fill={color} stackId={spec.stacked ? "stack" : undefined} radius={spec.stacked ? 1.5 : 2} maxBarSize={horizontal ? 12 : 19} isAnimationActive={false}>
                {spec.emphasizeLast && spec.data.map((datum, datumIndex) => <Cell key={`${datum.x ?? datum.label}-${datumIndex}`} fillOpacity={datumIndex === spec.data.length - 1 ? 1 : 0.32} />)}
              </Bar>;
              if (spec.kind === "area") return <Area key={entry.key} dataKey={entry.key} type={spec.curve ?? "monotone"} stroke={color} strokeWidth={1.7} fill={series.length === 1 ? `url(#${gradientId})` : color} fillOpacity={series.length === 1 ? 1 : 0.16} stackId={spec.stacked ? "stack" : undefined} strokeDasharray={entry.dashed ? "4 4" : undefined} dot={spec.data.length === 1} isAnimationActive={false} />;
              return <Line key={entry.key} dataKey={entry.key} type={spec.curve ?? "monotone"} stroke={color} strokeWidth={1.8} strokeDasharray={entry.dashed ? "4 4" : undefined} activeDot={{ r: 3.2, fill: color, stroke: "var(--surface-floating)", strokeWidth: 1.5 }} dot={spec.data.length === 1 || spec.data.length <= 7 ? { r: 2.3, fill: color, strokeWidth: 0 } : false} isAnimationActive={false} />;
            })}
          </ComposedChart>
        )}
      </ChartContainer>
      {showLegend && (
        <MiniLegend items={series.map((entry, index) => ({
          key: entry.key, label: entry.label, color: colors[index], variant: entry.dashed ? "dashed" : "dot",
        }))} />
      )}
    </div>
  );
}

function MiniRadial({ spec, label, colorIndex, locale, unit }: Pick<MiniChartProps, "label" | "colorIndex" | "locale" | "unit"> & { spec: Extract<MiniChartSpec, { kind: "radial" }> }) {
  const pie = spec.mode === "pie";
  const half = spec.mode === "half";
  const total = spec.parts.reduce((sum, part) => sum + part.value, 0);
  const radialParts = spec.parts.map((part, index) => ({
    ...part,
    fill: chartColor((index === 0 && colorIndex && !isSemanticChartColor(part.color) ? colorIndex : undefined) || part.color || seriesColors[index % seriesColors.length]),
  }));
  const track = "var(--muted)";
  const remainderLabel = locale === "zh-CN" ? "剩余" : "Remaining";
  const remainderValue = Math.max(0, (spec.total ?? total) - total);
  const together = [...radialParts, ...(remainderValue > 0 ? [{ label: remainderLabel, value: remainderValue, fill: track }] : [])];
  const rings = spec.mode === "rings" || spec.mode === "radial-row";
  const legendParts = !rings && radialParts.length === 1 && remainderValue > 0 ? together : radialParts;
  const ringData = radialParts.map((part) => [part, { label: remainderLabel, value: Math.max(0, (spec.total ?? 100) - part.value), fill: track }]);
  const center = spec.center;
  const row = spec.mode === "radial-row";
  const format = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  const formatPart = (value: number) => {
    if (unit !== "%") return format.format(value);
    const denominator = spec.total ?? (rings ? 100 : total);
    return denominator > 0 ? `${format.format(value / denominator * 100)}%` : "—";
  };
  const ringSpacing = Math.min(11, 39 / Math.max(ringData.length, 1));
  return (
    <div className="flex h-full min-w-0 items-center gap-5">
      <div className={cn("relative h-full min-w-0", row ? "flex-1" : half ? "w-32 shrink-0" : "w-24 shrink-0")}>
        <ChartContainer className="h-full min-h-0" config={{ value: { label } }}>
          <PieChart accessibilityLayer title={label}>
            <ChartTooltip cursor={false} isAnimationActive={false}
              content={({ active, payload }) => (
                <ChartTooltipContent active={active} label={String(payload?.[0]?.name ?? label)} payload={payload}
                  hideIndicator valueFormatter={(value) => typeof value === "number" ? formatPart(value) : "—"} />
              )} />
            {rings ? ringData.map((data, index) => {
              const outer = row ? Math.min(20, 87 / ringData.length) : 46 - index * ringSpacing;
              return <Pie key={data[0].label} data={data} dataKey="value" nameKey="label" cx={row ? `${(index + 0.5) * 100 / ringData.length}%` : "50%"}
                cy={row ? "44%" : "50%"} outerRadius={outer} innerRadius={Math.max(0, outer - (row ? 4 : ringSpacing * 0.55))}
                startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false} />;
            }) : (
              <Pie data={together} dataKey="value" nameKey="label" cy={half ? "76%" : "50%"} outerRadius={half ? 61 : 46} innerRadius={pie ? 0 : half ? 52 : 34} cornerRadius={2} paddingAngle={together.length > 1 ? 3 : 0} startAngle={half ? 180 : 90} endAngle={half ? 0 : -270} stroke="none" isAnimationActive={false} />
            )}
          </PieChart>
        </ChartContainer>
        {center && spec.mode !== "radial-row" && (
          <span className={cn("pointer-events-none absolute inset-x-0 text-center text-label font-semibold tabular-nums", half ? "bottom-6" : "top-1/2 -translate-y-1/2")}>{center}</span>
        )}
        {row && <div className="pointer-events-none absolute inset-x-0 bottom-0.5 grid gap-1 text-center text-label text-fg-muted" style={{ gridTemplateColumns: `repeat(${radialParts.length}, minmax(0, 1fr))` }}>
          {radialParts.map((part) => (
            <span key={part.label} className="truncate">
              {part.label} <span className="tabular-nums text-fg-default">{formatPart(part.value)}</span>
            </span>
          ))}
        </div>}
      </div>
      {!row && (
        <ul className="grid min-w-0 gap-1.5 text-label text-fg-muted">
          {legendParts.map((part) => (
            <li key={part.label} className="flex min-w-0 items-center gap-1.5">
              <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: part.fill }} />
              <span className="min-w-0 truncate" title={part.label}>{part.label}</span>
              <span className="ml-auto pl-2.5 tabular-nums text-fg-default">{formatPart(part.value)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function MiniMeter({ spec, label, colorIndex }: { spec: Extract<MiniChartSpec, { kind: "meter" }>; label: string; colorIndex?: ChartColorIndex }) {
  const low = spec.min ?? 0;
  const domain = spec.max - low;
  const progress = domain > 0 ? Math.max(0, Math.min(1, (spec.value - low) / domain)) : 0;
  const color = chartColor(colorIndex ?? spec.color ?? 1);
  const track = "var(--muted)";
  const target = spec.target === undefined || domain <= 0 ? null : Math.max(0, Math.min(1, (spec.target - low) / domain));
  if (spec.mode === "track") {
    return <div className="flex h-full items-center"><SegmentedBar className="h-2.5" mode="capacity" total={domain} segments={[{ id: label, label, value: Math.max(0, spec.value - low), color }]} valueText={`${label} ${spec.value} / ${spec.max}`} /></div>;
  }

  const count = spec.mode === "pills" ? 10 : spec.mode === "arc" ? 21 : 30;
  const ticks = Array.from({ length: count }, (_, index) => index);
  return (
    <svg role="img" aria-label={`${label}, ${spec.value} / ${spec.max}`} viewBox="0 0 264 96" className="h-full w-full overflow-visible">
      {spec.mode === "arc" && ticks.map((index) => {
        const angle = Math.PI - index / (count - 1) * Math.PI;
        return <circle key={index} cx={132 + Math.cos(angle) * 80} cy={87 - Math.sin(angle) * 70} r={3.6} fill={index / count < progress ? color : track} />;
      })}
      {spec.mode === "loop" && <>
        <rect x={90} y={8} width={84} height={78} rx={20} fill="none" stroke={track} strokeWidth={8} />
        <rect x={90} y={8} width={84} height={78} rx={20} fill="none" stroke={color} strokeWidth={8} pathLength={100} strokeDasharray={`${progress * 100} 100`} strokeLinecap="round" visibility={progress === 0 ? "hidden" : undefined} />
      </>}
      {spec.mode === "slope" && <>
        <path d="M4 78L260 19V78Z" fill={track} />
        <path d={`M4 78L${4 + 256 * progress} ${78 - 59 * progress}V78Z`} fill={color} fillOpacity={0.18} />
        <path d={`M4 78L${4 + 256 * progress} ${78 - 59 * progress}`} stroke={color} strokeWidth={2} />
      </>}
      {spec.mode === "zones" && <>
        <rect x={4} y={32} width={256} height={26} rx={5} fill={track} />
        {(spec.reverseZones ? [7, 3, 4] : [4, 3, 7]).map((index, zone) => <rect key={index} x={6 + zone * 84} y={34} width={82} height={22} rx={3} fill={chartColor(index as ChartColorIndex)} fillOpacity={0.28} />)}
      </>}
      {spec.mode === "range" && <rect x={4} y={37} width={256} height={16} rx={4} fill={color} fillOpacity={0.22} />}
      {(spec.mode === "ticks" || spec.mode === "ruler" || spec.mode === "pills") && ticks.map((index) => {
        const pill = spec.mode === "pills";
        const ruler = spec.mode === "ruler";
        const size = 256 / count;
        const height = pill ? 43 : ruler ? (index % 5 === 0 ? 34 : 18) : 19 + index * 0.82;
        const filled = Math.max(0, Math.min(1, progress * count - index));
        return <Fragment key={index}>
          <rect x={4 + index * size} y={70 - height} width={size - (pill ? 5 : 2)} height={height} rx={pill ? 7 : 1.5} fill={track} />
          {!ruler && filled > 0 && <rect x={4 + index * size} y={70 - height * filled} width={size - (pill ? 5 : 2)} height={height * filled} rx={pill ? 7 : 1.5} fill={color} />}
        </Fragment>;
      })}
      {(spec.mode === "ruler" || spec.mode === "zones" || spec.mode === "range") && <line x1={4 + 256 * progress} x2={4 + 256 * progress} y1={22} y2={73} stroke={color} strokeWidth={2.5} strokeLinecap="round" />}
      {target !== null && spec.mode !== "arc" && <line x1={4 + 256 * target} x2={4 + 256 * target} y1={23} y2={78} stroke="var(--fg-muted)" strokeWidth={1} strokeDasharray="3 3" />}
      {spec.mode === "arc" || spec.mode === "loop" ? (
        <text x={132} y={spec.mode === "arc" ? 75 : 53} textAnchor="middle" fill="var(--fg-default)" fontSize={16} fontWeight={600}>{Math.round(progress * 100)}%</text>
      ) : <>
        <text x={4} y={91} fill="var(--fg-muted)" fontSize={10}>{low}</text>
        <text x={260} y={91} fill="var(--fg-muted)" textAnchor="end" fontSize={10}>{spec.max}</text>
      </>}
    </svg>
  );
}

function MiniMatrix({ spec, label, colorIndex }: { spec: Extract<MiniChartSpec, { kind: "matrix" }>; label: string; colorIndex?: ChartColorIndex }) {
  const color = chartColor(colorIndex ?? spec.color ?? 1);
  const max = spec.max ?? 4;
  return (
    <div className="flex h-full min-h-0 flex-col gap-1">
      <div className="grid min-h-0 flex-1 w-full content-center gap-1" role="img" aria-label={label} style={{ gridTemplateColumns: `repeat(${spec.columns}, minmax(0, 1fr))` }}>
        {spec.cells.map((value, index) => {
          const intensity = value !== null && max > 0 ? Math.min(100, Math.max(0, value / max * 100)) : 0;
          const fill = spec.states && value === 2 ? chartColor(7) : `color-mix(in oklab, ${color} ${intensity}%, var(--muted))`;
          const cellTitle = spec.legend && spec.states
            ? (value === 1 ? spec.legend[0]?.label : value === 2 ? spec.legend[1]?.label : value === 0 ? spec.legend[2]?.label : "—")
            : (value === null ? "—" : String(value));
          return <span key={index} title={cellTitle ?? String(value ?? "—")} className={cn("mx-auto aspect-square w-full max-w-2.5", spec.dots ? "rounded-full" : "rounded-sm")} style={{ backgroundColor: fill, opacity: value === null ? 0.42 : 1 }} />;
        })}
      </div>
      {spec.legend && spec.legend.length > 0 && (
        <MiniLegend items={spec.legend.map((entry, index) => ({
          label: entry.label,
          color: entry.color === undefined
            ? "var(--muted)"
            : isSemanticChartColor(entry.color) ? chartColor(entry.color) : chartColor(index === 0 && colorIndex ? colorIndex : entry.color),
        }))} />
      )}
    </div>
  );
}

function MiniSegments({ spec, label, colorIndex, locale }: { spec: Extract<MiniChartSpec, { kind: "segments" }>; label: string; colorIndex?: ChartColorIndex; locale: string }) {
  const number = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  return <div className="grid h-full content-center gap-2">
    {spec.rows.map((row, index) => {
      const sum = row.parts.reduce((total, part) => total + part.value, 0);
      const partColor = (part: MiniPart, partIndex: number) =>
        chartColor((partIndex === 0 && colorIndex && !isSemanticChartColor(part.color) ? colorIndex : undefined) || part.color || seriesColors[partIndex % seriesColors.length]);
      return <div className={row.label ? "grid grid-cols-[minmax(48px,28%)_1fr_auto] items-center gap-2" : undefined} key={row.label ?? index}>
        {row.label && <span className="truncate text-label text-fg-muted" title={row.label}>{row.label}</span>}
        <SegmentedBar className="h-2.5" mode="capacity" total={row.total ?? sum}
          segments={row.parts.map((part, partIndex) => ({ id: part.label, label: part.label, value: part.value, color: partColor(part, partIndex) }))}
          valueText={`${row.label ?? label} ${number.format(sum)} / ${number.format(row.total ?? sum)}`} />
        {row.label && <span className="text-label tabular-nums text-fg-muted">{number.format(sum)}</span>}
        {!row.label && row.parts.length > 1 && (
          <MiniLegend className="mt-2 flex flex-wrap gap-x-2 gap-y-1 text-label text-fg-muted" items={row.parts.map((part, partIndex) => ({
            label: part.label, color: partColor(part, partIndex),
          }))} />
        )}
      </div>;
    })}
  </div>;
}

function MiniTimeline({ spec, label, colorIndex }: { spec: Extract<MiniChartSpec, { kind: "timeline" }>; label: string; colorIndex?: ChartColorIndex }) {
  const span = spec.end - spec.start;
  const position = (value: number) => span > 0 ? Math.max(0, Math.min(1, (value - spec.start) / span)) : 0;
  return <svg role="img" aria-label={label} viewBox="0 0 264 96" className="h-full w-full">
    {Array.from({ length: 21 }, (_, index) => <line key={index} x1={4 + index * 12.8} x2={4 + index * 12.8} y1={index % 5 === 0 ? 21 : 30} y2={37} stroke="var(--border)" />)}
    <rect x={4} y={42} width={256} height={23} fill="var(--muted)" rx={4} />
    {spec.windows.map((window) => {
      const from = position(window.start);
      const to = position(window.end);
      return to > from && <rect key={window.label} x={4 + from * 256} y={42} width={(to - from) * 256} height={23} rx={4} fill={chartColor(colorIndex ?? window.color ?? 1)} fillOpacity={0.82}><title>{window.label}</title></rect>;
    })}
    {spec.now !== undefined && <line x1={4 + position(spec.now) * 256} x2={4 + position(spec.now) * 256} y1={20} y2={76} stroke="var(--fg-muted)" strokeWidth={1.4} strokeDasharray="3 3" />}
  </svg>;
}

function MiniFunnel({ spec, colorIndex, locale, unit }: { spec: Extract<MiniChartSpec, { kind: "funnel" }>; colorIndex?: ChartColorIndex; locale: string; unit?: string }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const primary = chartColor(colorIndex ?? spec.color ?? 1);
  const first = spec.stages[0]?.value ?? 0;
  const fmt = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const active = hoverIndex !== null ? spec.stages[hoverIndex] : undefined;
  return (
    <div className="relative flex h-full min-h-0 flex-col gap-1">
      <div className="min-h-0 flex-1">
        <FunnelChart
          data={spec.stages.map((stage) => ({ ...stage, color: chartColor(colorIndex ?? stage.color ?? spec.color ?? 1) }))}
          className="h-full w-full"
          style={{ aspectRatio: "auto" }}
          color={primary}
          layers={2}
          gap={5}
          hoveredIndex={hoverIndex}
          onHoverChange={setHoverIndex}
          showLabels={false}
          showValues={false}
          showPercentage={false}
          enterTransition={{ duration: 0 }}
        />
      </div>
      <div className="grid shrink-0 gap-1 text-center text-label leading-none text-fg-muted" style={{ gridTemplateColumns: `repeat(${spec.stages.length}, minmax(0, 1fr))` }}>
        {spec.stages.map((stage) => (
          <span key={stage.label} className="truncate" title={`${stage.label}: ${fmt.format(stage.value)}`}>
            {stage.label}
          </span>
        ))}
      </div>
      {active && (
        <MiniReadingPopup
          label={active.label}
          value={`${fmt.format(active.value)}${unit ? ` ${unit}` : ""}${first > 0 ? ` (${Math.round(active.value / first * 100)}%)` : ""}`}
        />
      )}
    </div>
  );
}

export function MiniChart({ spec, label, locale = "en", unit, colorIndex, className, ...props }: MiniChartProps) {
  const empty = ("data" in spec && !spec.data.some((point) => [point.value, point.compare, point.other, ...(point.range ?? [])].some(Number.isFinite)))
    || (spec.kind === "radial" && spec.parts.length === 0)
    || (spec.kind === "matrix" && !spec.cells.some(Number.isFinite))
    || (spec.kind === "segments" && spec.rows.length === 0)
    || (spec.kind === "funnel" && spec.stages.length === 0)
    || (spec.kind === "meter" && (!Number.isFinite(spec.value) || !(spec.max > (spec.min ?? 0))));
  let chart;
  if (empty) {
    chart = <p role="status" className="grid h-full place-items-center text-label text-fg-muted">{locale === "zh-CN" ? "暂无数据" : "No data"}</p>;
  } else switch (spec.kind) {
    case "line":
    case "area":
    case "bar":
    case "range":
    case "scatter":
      chart = <MiniCartesian spec={spec} label={label} locale={locale} unit={unit} colorIndex={colorIndex} />;
      break;
    case "radial": chart = <MiniRadial spec={spec} label={label} colorIndex={colorIndex} locale={locale} unit={unit} />; break;
    case "meter": chart = <MiniMeter spec={spec} label={label} colorIndex={colorIndex} />; break;
    case "matrix": chart = <MiniMatrix spec={spec} label={label} colorIndex={colorIndex} />; break;
    case "segments": chart = <MiniSegments spec={spec} label={label} colorIndex={colorIndex} locale={locale} />; break;
    case "timeline": chart = <MiniTimeline spec={spec} label={label} colorIndex={colorIndex} />; break;
    case "funnel":
      chart = <MiniFunnel spec={spec} colorIndex={colorIndex} locale={locale} unit={unit} />;
      break;
    default: chart = <MiniAdvancedChart spec={spec} label={label} locale={locale} unit={unit} colorIndex={colorIndex} />;
  }
  return <div role="group" aria-label={label} data-slot="mini-chart" data-kind={spec.kind} data-theme-transition="instant" className={cn("h-24 w-full min-w-0", className)} {...props}>{chart}</div>;
}
