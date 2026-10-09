import { SegmentedBar, chartColor, type ChartColorIndex } from "@zeron/ui/chart-primitives";
import type { LogTiming } from "./infinite-log-types";

const timingParts = [
  ["DNS", "dns", 1],
  ["Connect", "connection", 2],
  ["TLS", "tls", 3],
  ["TTFB", "ttfb", 4],
  ["Transfer", "transfer", 5],
] as const satisfies readonly [string, keyof LogTiming, ChartColorIndex][];

export function formatMilliseconds(value: number) {
  return `${Math.round(value)} ms`;
}

export function InfiniteLogTimingBar({ timing, latency }: { timing: LogTiming; latency: number }) {
  const description = timingParts
    .map(([label, key]) => `${label} ${formatMilliseconds(timing[key])}`)
    .join(", ");

  return (
    <div aria-label={`Latency ${formatMilliseconds(latency)}. ${description}`} className="flex min-w-28 items-center gap-2">
      <SegmentedBar aria-hidden className="h-1.5 min-w-20 flex-1 rounded-full" mode="capacity" total={latency} valueText={description} segments={timingParts.map(([label, key, color]) => ({ id: key, label, value: timing[key], color: chartColor(color) }))} />
      <span className="shrink-0 text-label tabular-nums text-fg-muted">{formatMilliseconds(latency)}</span>
    </div>
  );
}
