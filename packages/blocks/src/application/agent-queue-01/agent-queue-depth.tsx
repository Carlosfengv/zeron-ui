import { useId } from "react";
import { Area, AreaChart, CartesianGrid, ReferenceArea, ReferenceDot, ReferenceLine, XAxis, YAxis } from "recharts";
import { ChartContainer } from "@zeron/ui/chart";
import type { AgentQueueDepthSample, AgentQueueLabels, AgentQueueRateLimit } from "./agent-queue-types";
import styles from "./agent-queue.module.css";

const depthColor = "var(--color-depth)";

export function AgentQueueDepth({ points, from, now, limits, backpressure, labels }: {
  points: readonly AgentQueueDepthSample[];
  from: number;
  now: number;
  limits: readonly AgentQueueRateLimit[];
  backpressure?: number;
  labels: AgentQueueLabels;
}) {
  const gradient = `queue-depth-${useId().replace(/:/g, "")}`;
  const current = points.at(-1)?.depth ?? 0;
  const peak = points.reduce((max, point) => Math.max(max, point.depth), 0);
  const ceiling = Math.max(4, Math.ceil((Math.max(peak, backpressure ?? 0) + 1) / 4) * 4);
  const ticks = [0, backpressure || ceiling / 2, ceiling];

  return (
    <figure className={styles.depth}>
      <figcaption className={styles.caption}>{labels.depth}</figcaption>
      <div className={styles.chart} role="img" aria-label={labels.depthSummary(current, peak, limits.length)}>
        <ChartContainer aria-hidden="true" className="h-32 min-h-0" config={{ depth: { label: labels.depth, color: "var(--chart-5)" } }}>
          <AreaChart data={points} accessibilityLayer={false} margin={{ left: 0, right: 5, top: 8, bottom: 8 }}>
            <defs>
              <linearGradient id={gradient} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={depthColor} stopOpacity={0.22} />
                <stop offset="100%" stopColor={depthColor} stopOpacity={0.09} />
              </linearGradient>
            </defs>
            <XAxis type="number" dataKey="at" domain={[from, now]} hide />
            <YAxis domain={[0, ceiling]} ticks={ticks} interval={0} width={26} axisLine={false} tickLine={false} tick={{ fill: "var(--fg-subtle)" }} />
            <CartesianGrid vertical={false} horizontalValues={ticks.filter((tick) => tick !== backpressure)} syncWithTicks stroke="var(--border)" strokeWidth={0.5} />
            {limits.map((limit, index) => <ReferenceArea key={index} x1={Math.max(limit.from, from)} x2={Math.min(limit.until, now)}
              fill="var(--chart-3)" fillOpacity={0.08} stroke="none" />)}
            {backpressure !== undefined && <ReferenceLine y={backpressure} stroke="var(--border)" strokeDasharray="3 3" />}
            <Area type="linear" dataKey="depth" stroke={depthColor} strokeWidth={1.25} fill={`url(#${gradient})`} isAnimationActive={false} />
            <ReferenceDot x={now} y={current} r={3} fill={depthColor} stroke="var(--surface-floating)" strokeWidth={1} />
          </AreaChart>
        </ChartContainer>
        <div className={styles.axis} aria-hidden="true"><span>{labels.ago(labels.duration(now - from))}</span><span>{labels.now}</span></div>
      </div>
    </figure>
  );
}
