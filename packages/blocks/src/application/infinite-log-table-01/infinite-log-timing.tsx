import { cn } from "@zeron/ui/system/utils";
import type { LogTiming } from "./infinite-log-types";

const timingParts = [
  ["DNS", "dns", "bg-brand"],
  ["Connect", "connection", "bg-brand-active"],
  ["TLS", "tls", "bg-info-border"],
  ["TTFB", "ttfb", "bg-warning-border"],
  ["Transfer", "transfer", "bg-danger-border"],
] as const satisfies readonly [string, keyof LogTiming, string][];

export function formatMilliseconds(value: number) {
  return `${Math.round(value)} ms`;
}

export function InfiniteLogTimingBar({ timing, latency }: { timing: LogTiming; latency: number }) {
  const total = Math.max(latency, 1);
  const description = timingParts
    .map(([label, key]) => `${label} ${formatMilliseconds(timing[key])}`)
    .join(", ");

  return (
    <div aria-label={`Latency ${formatMilliseconds(latency)}. ${description}`} className="flex min-w-28 items-center gap-2">
      <span aria-hidden className="flex h-1.5 min-w-20 flex-1 overflow-hidden rounded-full bg-surface-raised">
        {timingParts.map(([, key, color]) => (
          <span
            className={cn("h-full first:rounded-s-full last:rounded-e-full", color)}
            key={key}
            style={{ width: `${Math.max(2, (timing[key] / total) * 100)}%` }}
          />
        ))}
      </span>
      <span className="shrink-0 text-label tabular-nums text-fg-muted">{formatMilliseconds(latency)}</span>
    </div>
  );
}
