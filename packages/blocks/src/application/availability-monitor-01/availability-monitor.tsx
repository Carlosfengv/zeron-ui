"use client";

import {
  useId,
  useMemo,
  useState,
  type ComponentPropsWithoutRef,
} from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@zeron/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@zeron/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@zeron/ui/chart";
import { Container, ContainerBody } from "@zeron/ui/container";
import { MetricCard } from "@zeron/ui/metric-card";
import { StatusOverview } from "@zeron/ui/status-overview";
import { cn } from "@zeron/ui/system/utils";

export type AvailabilityState = "available" | "degraded" | "unavailable";

export interface AvailabilityTimelineSegment {
  label: string;
  state: AvailabilityState;
}

export interface AvailabilityTimelineMarker {
  at: number;
  label: string;
}

export interface AvailabilityPoint {
  timestamp: number;
  routed: number;
  direct: number;
}

export interface AvailabilityMonitorProps
  extends Omit<ComponentPropsWithoutRef<"section">, "children"> {
  contained?: boolean;
  uptime?: number;
  availability?: number;
  routedAvailability?: number;
  directAvailability?: number;
  timeline?: readonly AvailabilityTimelineSegment[];
  timelineMarkers?: readonly AvailabilityTimelineMarker[];
  chartData?: readonly AvailabilityPoint[];
  rangeLabel?: string;
  title?: string;
  description?: string;
  locale?: string;
  timeZone?: string;
  endpointsHref?: string | null;
  learnMoreHref?: string | null;
}

const chartConfig = {
  routed: {
    label: "OpenRouter Availability",
    color: "var(--success-border)",
  },
  direct: {
    label: "Without Routing",
    color: "var(--warning)",
  },
} satisfies ChartConfig;

const overviewStates = {
  available: "operational",
  degraded: "degraded",
  unavailable: "down",
} as const;

const defaultTimelineFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  hour: "numeric",
  month: "short",
  timeZone: "Asia/Shanghai",
});

const degradedTimelineIndexes = new Set([22, 26, 27, 32]);

const defaultTimeline = Array.from({ length: 72 }, (_, index) => {
  const timestamp = Date.UTC(2026, 8, 5, 1) + index * 60 * 60 * 1000;

  return {
    label: defaultTimelineFormatter.format(timestamp),
    state: degradedTimelineIndexes.has(index) ? ("degraded" as const) : ("available" as const),
  };
});

const defaultTimelineMarkers: readonly AvailabilityTimelineMarker[] = [
  { at: 0, label: "Sat" },
  { at: 24, label: "Sun" },
  { at: 48, label: "Mon" },
  { at: 72, label: "Now" },
];

const defaultRoutedAvailabilityValues = [
  100, 99.8872, 99.4251, 99.5209, 99.5997, 99.5435, 99.646, 99.9365, 99.9357,
  99.9284, 99.8932, 99.4618, 99.3295, 99.9112, 99.9572, 99.8948, 99.7585,
  99.9833, 100, 100, 99.8497, 99.8807, 99.9342, 100, 100, 99.8172, 99.7339,
  99.2678, 99.8712, 99.8798, 99.8717, 99.9585, 99.8737, 99.954, 99.7943,
  99.9454, 99.6732, 99.8018, 99.9778, 100, 99.9296, 99.9554, 99.944, 99.8584,
  99.9416, 99.9233, 100, 99.7129, 99.9574, 99.9301, 99.9482, 99.9524, 99.9285,
  99.8996, 99.8591, 99.8486, 99.7839, 99.7358, 99.6097, 99.6226, 99.4186,
  99.703, 99.6607, 99.5651, 99.8315, 99.8227, 99.7524, 99.8202, 99.8213,
  99.8836, 99.8704, 99.9005, 99.8299, 99.616, 99.8139, 99.8229, 99.7568,
  99.7304, 99.8751, 99.848, 99.8186, 99.9074, 99.8548, 99.8874, 99.8895,
  99.881, 99.9866, 99.974, 99.9723, 99.8938, 99.9236, 99.9545, 99.8296,
  99.9717, 99.9558, 99.9448, 99.9906, 99.9719, 99.9686, 99.9879, 99.8476,
  99.9605, 99.9442, 99.8308, 99.8793, 99.9623, 99.9403, 99.8277, 99.9119,
  99.9469, 99.8971, 99.8882, 99.7579, 99.7729, 99.6807, 99.8217, 99.7071,
  99.7225, 99.7953, 99.5341, 99.6817, 99.7501, 99.4472, 99.7404, 99.8566,
  99.9724, 99.9155, 99.8482, 99.9469, 99.9825, 99.9002, 99.9367, 99.8906,
  99.9151, 99.8669, 99.9153, 99.9395, 99.9411, 99.9698, 99.923, 99.9571,
  99.9314, 99.9046, 99.8346, 99.9189,
] as const;

const defaultDirectAvailabilityValues = [
  98.473, 99.116, 97.7849, 98.3915, 98.599, 98.6833, 98.3427, 98.7308, 99.2929,
  99.678, 99.3592, 98.5585, 98.7182, 98.2674, 98.2895, 98.8634, 97.967, 99.4483,
  98.9934, 99.1272, 98.9695, 98.6484, 98.9906, 97.5686, 98.8116, 98.5603,
  98.4254, 97.8035, 99.2824, 98.357, 98.0753, 95.6233, 95.5148, 94.9367, 97.3468,
  96.2032, 98.5621, 97.8791, 99.7554, 99.6667, 99.5494, 99.7027, 99.2721, 99.115,
  98.4433, 98.371, 99.0687, 98.3732, 99.2968, 98.5328, 98.6788, 99.4521, 98.1159,
  97.8926, 98.7318, 98.7318, 98.8112, 98.5469, 98.9033, 98.245, 96.984, 95.4744,
  95.47, 97.4943, 96.6084, 95.9876, 97.2196, 97.5809, 97.9604, 97.4822, 98.8335,
  98.9768, 98.3959, 98.5957, 97.1263, 99.0721, 99.2334, 99.208, 99.4125, 99.246,
  99.3003, 99.6356, 99.4761, 99.5567, 99.6202, 99.6629, 99.4649, 99.2446, 87.9112,
  89.017, 88.0187, 91.8722, 93.6535, 93.0582, 93.2001, 92.6713, 95.1654, 98.2104,
  95.8041, 98.4898, 92.5422, 98.3805, 99.261, 92.2631, 92.3582, 92.1106, 94.8305,
  93.0064, 92.593, 88.3407, 92.2212, 91.0631, 92.792, 89.4659, 86.7016, 87.0257,
  77.7554, 88.0501, 86.5318, 86.2806, 89.2907, 91.9884, 94.7208, 96.608, 96.2813,
  95.1583, 94.7131, 95.255, 95.6133, 95.5567, 96.8402, 95.6333, 95.0219, 95.1199,
  95.5613, 96.1033, 96.4332, 94.9868, 95.1595, 95.0646, 94.1197, 95.1313,
  94.5722, 94.1829, 92.8668,
] as const;

const defaultChartData = defaultRoutedAvailabilityValues.map((routed, index) => ({
  timestamp: Date.UTC(2026, 8, 7, 1, 30) + index * 10 * 60 * 1000,
  routed,
  direct: defaultDirectAvailabilityValues[index] ?? 0,
}));

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function TimelineCard({
  availability,
  markers,
  rangeLabel,
  timeline,
}: {
  availability: number;
  markers: readonly AvailabilityTimelineMarker[];
  rangeLabel: string;
  timeline: readonly AvailabilityTimelineSegment[];
}) {
  const end = Math.max(1, timeline.length);
  const items = timeline.map((segment, index) => ({
    id: `${index}-${segment.label}`,
    status: overviewStates[segment.state],
    ariaLabel: `${segment.label}: ${segment.state}`,
  }));

  return (
    <StatusOverview
      ariaLabel="Availability timeline for the last 72 hours"
      content={{
        type: "timeline",
        start: 0,
        end,
        items,
        markers: markers.map((marker) => ({
          at: Math.min(end, Math.max(0, marker.at)),
          label: marker.label,
        })),
      }}
      emptyContent="No availability data"
      label="Availability over the last 3 days"
      rangeLabel={rangeLabel}
      summary={{
        label: "Availability",
        value: formatPercent(availability),
        status: "operational",
      }}
    />
  );
}

function TrendCard({
  chartData,
  directAvailability,
  locale,
  routedAvailability,
  timeZone,
}: {
  chartData: readonly AvailabilityPoint[];
  directAvailability: number;
  locale: string;
  routedAvailability: number;
  timeZone: string;
}) {
  const titleId = useId();
  const [visibleSeries, setVisibleSeries] = useState({ routed: true, direct: true });
  const axisFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        hour: "numeric",
        minute: "2-digit",
        timeZone,
      }),
    [locale, timeZone]
  );
  const tooltipFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        month: "short",
        timeZone,
      }),
    [locale, timeZone]
  );
  const chartTicks = useMemo(() => {
    if (chartData.length < 2) return chartData.map((point) => point.timestamp);
    return Array.from({ length: 7 }, (_, index) => {
      const pointIndex = Math.round((index / 6) * (chartData.length - 1));
      return chartData[pointIndex]?.timestamp;
    }).filter((timestamp): timestamp is number => timestamp !== undefined);
  }, [chartData]);

  const series = [
    {
      key: "routed" as const,
      label: "OpenRouter Availability",
      value: routedAvailability,
      dotClassName: "bg-success-border",
    },
    {
      key: "direct" as const,
      label: "Without Routing",
      value: directAvailability,
      dotClassName: "bg-warning",
    },
  ];

  return (
    <section aria-labelledby={titleId}>
      <Card>
        <CardHeader>
          <h3 id={titleId}>
            <CardTitle>Availability over the last 24 hours</CardTitle>
          </h3>
        </CardHeader>
        <CardContent>
          <ChartContainer
            className="aspect-auto h-[320px] min-h-0 w-full text-label"
            config={chartConfig}
          >
            <LineChart
              accessibilityLayer
              data={chartData}
              margin={{ bottom: 8, left: 0, right: 8, top: 8 }}
            >
              <CartesianGrid
                stroke="var(--border-subtle)"
                strokeDasharray="3 3"
                vertical={false}
              />
              <XAxis
                axisLine={false}
                dataKey="timestamp"
                domain={["dataMin", "dataMax"]}
                minTickGap={56}
                scale="time"
                tickFormatter={(value: number) => axisFormatter.format(value)}
                tickLine={false}
                tickMargin={10}
                ticks={chartTicks}
                type="number"
              />
              <YAxis
                axisLine={false}
                domain={[75, 100]}
                tickFormatter={(value: number) => `${value}%`}
                tickLine={false}
                ticks={[75, 82, 89, 96, 100]}
                width={44}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(value) => tooltipFormatter.format(Number(value))}
                    valueFormatter={(value) => formatPercent(Number(value))}
                  />
                }
                cursor={{ stroke: "var(--border)", strokeDasharray: "3 3" }}
              />
              <Line
                activeDot={{ r: 3 }}
                dataKey="routed"
                dot={false}
                hide={!visibleSeries.routed}
                isAnimationActive={false}
                stroke="var(--color-routed)"
                strokeWidth={2}
                type="monotone"
              />
              <Line
                activeDot={{ r: 3 }}
                dataKey="direct"
                dot={false}
                hide={!visibleSeries.direct}
                isAnimationActive={false}
                stroke="var(--color-direct)"
                strokeWidth={2}
                type="monotone"
              />
            </LineChart>
          </ChartContainer>

          <div aria-label="Chart series" className="mt-2 grid gap-1">
            {series.map((item) => {
              const visible = visibleSeries[item.key];
              return (
                <div
                  className={cn(
                    "flex items-center justify-between gap-3",
                    !visible && "opacity-50"
                  )}
                  key={item.key}
                >
                  <Button
                    aria-pressed={visible}
                    onClick={() =>
                      setVisibleSeries((current) => ({
                        ...current,
                        [item.key]: !current[item.key],
                      }))
                    }
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        aria-hidden
                        className={cn(
                          "inline-block size-3 shrink-0 rounded-full",
                          item.dotClassName
                        )}
                      />
                      <span>{item.label}</span>
                    </span>
                  </Button>
                  <span className="shrink-0 tabular-nums text-fg-muted">
                    {formatPercent(item.value)}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

/** A routing-aware service availability summary with a 72-hour status strip and 24-hour comparison chart. */
export function AvailabilityMonitor({
  availability = 99.3,
  chartData = defaultChartData,
  className,
  contained = true,
  description = "Uptime is the percentage of the past 3 days that at least one provider was responding to requests. Availability is the percentage of time that inference was successfully served. OpenRouter continuously monitors and uses the next-best provider when one returns an error.",
  directAvailability = 95.58,
  endpointsHref = "https://openrouter.ai/docs/api/api-reference/endpoints/list-endpoints",
  learnMoreHref = "https://openrouter.ai/docs/provider-routing",
  locale = "en-US",
  rangeLabel = "Sep 5, 9 AM - Sep 8, 9 AM",
  routedAvailability = 99.84,
  timeZone = "Asia/Shanghai",
  timeline = defaultTimeline,
  timelineMarkers = defaultTimelineMarkers,
  title = "Uptime",
  uptime = 100,
  ...props
}: AvailabilityMonitorProps) {
  const titleId = useId();
  const content = (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard
          label="Uptime (3d)"
          tone="positive"
          value={formatPercent(uptime)}
        />
        <MetricCard
          label="Availability (3d)"
          tone="positive"
          value={formatPercent(availability)}
        />
      </div>

      <TimelineCard
        availability={availability}
        markers={timelineMarkers}
        rangeLabel={rangeLabel}
        timeline={timeline}
      />

      <TrendCard
        chartData={chartData}
        directAvailability={directAvailability}
        locale={locale}
        routedAvailability={routedAvailability}
        timeZone={timeZone}
      />

      <p className="text-body leading-6 text-fg-muted">
        When an error occurs in an upstream provider, we can recover by routing to
        another healthy provider, if your request filters allow it. You can access
        per-provider uptime data programmatically through the{" "}
        {endpointsHref ? (
          <a
            className="font-medium text-fg-default underline underline-offset-2 hover:text-fg-brand"
            href={endpointsHref}
          >
            Endpoints API
          </a>
        ) : (
          <span className="font-medium text-fg-default">Endpoints API</span>
        )}
        .{" "}
        {learnMoreHref ? (
          <a
            className="font-medium text-fg-default underline underline-offset-2 hover:text-fg-brand"
            href={learnMoreHref}
          >
            Learn more
          </a>
        ) : (
          <span className="font-medium text-fg-default">Learn more</span>
        )}{" "}
        about our load balancing and customization options.
      </p>
    </div>
  );

  return (
    <section
      aria-labelledby={titleId}
      className={cn("mx-auto flex w-full max-w-[1024px] flex-col gap-4", className)}
      {...props}
    >
      <header className="space-y-1.5">
        <h2 className="text-heading font-semibold text-fg-default" id={titleId}>
          {title}
        </h2>
        <p className="text-body leading-6 text-fg-muted">
          {description}
        </p>
      </header>

      {contained ? (
        <Container>
          <ContainerBody>{content}</ContainerBody>
        </Container>
      ) : content}
    </section>
  );
}

export { defaultChartData, defaultTimeline, defaultTimelineMarkers };
