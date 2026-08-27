"use client";

import { useMemo, useState, type ComponentPropsWithoutRef } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@zeron/ui/button";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@zeron/ui/chart";
import {
  Container,
  ContainerBody,
  ContainerHeader,
} from "@zeron/ui/container";
import { StatusOverview } from "@zeron/ui/status-overview";
import { Tooltip } from "@zeron/ui/tooltip";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";

export type AvailabilityState = "available" | "degraded" | "unavailable";

export interface AvailabilityTimelineSegment {
  label: string;
  state: AvailabilityState;
}

export interface AvailabilityPoint {
  timestamp: number;
  routed: number;
  direct: number;
}

export interface AvailabilityMonitorProps
  extends Omit<ComponentPropsWithoutRef<"section">, "children"> {
  uptime?: number;
  availability?: number;
  routedAvailability?: number;
  directAvailability?: number;
  timeline?: readonly AvailabilityTimelineSegment[];
  chartData?: readonly AvailabilityPoint[];
  rangeLabel?: string;
  locale?: string;
  timeZone?: string;
  endpointsHref?: string;
  learnMoreHref?: string;
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

const defaultTimeline = Array.from({ length: 72 }, (_, index) => ({
  label: `Hour ${index + 1}`,
  state: "available" as const,
}));

function triangularDip(index: number, center: number, radius: number, depth: number) {
  const distance = Math.abs(index - center);
  return distance > radius ? 0 : depth * (1 - distance / radius);
}

const defaultChartData = Array.from({ length: 97 }, (_, index) => {
  const timestamp = Date.UTC(2026, 7, 26, 7, 40) + index * 15 * 60 * 1000;
  const routedNoise = Math.sin(index * 0.57) * 0.05 + Math.cos(index * 0.21) * 0.035;
  const directNoise = Math.sin(index * 0.83) * 0.28 + Math.cos(index * 0.31) * 0.18;
  const routedDips =
    triangularDip(index, 7, 2, 0.22) +
    triangularDip(index, 27, 2, 0.36) +
    triangularDip(index, 43, 1.5, 0.28) +
    triangularDip(index, 76, 2, 0.16);
  const directDips =
    triangularDip(index, 4, 5, 2.6) +
    triangularDip(index, 9, 2, 2.8) +
    triangularDip(index, 18, 1.5, 1.9) +
    triangularDip(index, 29, 5, 6.1) +
    triangularDip(index, 37, 1.4, 5.0) +
    triangularDip(index, 42, 2, 3.1) +
    triangularDip(index, 48, 1.4, 3.5) +
    triangularDip(index, 55, 2, 2.2) +
    triangularDip(index, 63, 1.5, 1.5) +
    triangularDip(index, 77, 2, 2.0) +
    triangularDip(index, 96, 2, 4.6);

  return {
    timestamp,
    routed: Math.max(90, Math.min(100, 99.84 + routedNoise - routedDips)),
    direct: Math.max(90, Math.min(100, 98.82 + directNoise - directDips)),
  };
});

function formatPercent(value: number) {
  return `${value.toFixed(2)}%`;
}

function SummaryCard({
  explanation,
  label,
  value,
}: {
  explanation: string;
  label: string;
  value: number;
}) {
  const InformationIcon = useIcon("doc-info-item");

  return (
    <Container>
      <ContainerHeader>
        <div className="flex items-center gap-1">
          <h2 className="text-body font-medium text-fg-default">{label}</h2>
        <Tooltip content={explanation}>
          <Button
            aria-label={`${label} explanation`}
            iconOnly
            size="xs"
            type="button"
            variant="ghost"
          >
            <InformationIcon />
          </Button>
        </Tooltip>
        </div>
      </ContainerHeader>
      <ContainerBody>
        <p className="text-heading font-semibold tabular-nums text-fg-success">
          {formatPercent(value)}
        </p>
      </ContainerBody>
    </Container>
  );
}

function TimelineCard({
  availability,
  rangeLabel,
  timeline,
}: {
  availability: number;
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
        markers: [
          { at: 0, label: "Mon" },
          { at: end / 3, label: "Tue" },
          { at: (end / 3) * 2, label: "Wed" },
          { at: end, label: "Now" },
        ],
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
    <Container>
      <ContainerHeader>
        <h2 className="text-body font-medium text-fg-default">
          Availability over the last 24 hours
        </h2>
      </ContainerHeader>
      <ContainerBody>
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
              domain={[90, 100]}
              tickFormatter={(value: number) => `${value}%`}
              tickLine={false}
              ticks={[90, 93, 96, 100]}
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
                className={cn("flex items-center justify-between gap-3", !visible && "opacity-50")}
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
                <span className="ml-auto shrink-0 tabular-nums text-fg-muted">
                  {formatPercent(item.value)}
                </span>
              </div>
            );
          })}
        </div>
      </ContainerBody>
    </Container>
  );
}

/** A routing-aware service availability summary with a 72-hour status strip and 24-hour comparison chart. */
export function AvailabilityMonitor({
  availability = 99.91,
  chartData = defaultChartData,
  className,
  directAvailability = 97.66,
  endpointsHref = "#endpoints-api",
  learnMoreHref = "#load-balancing",
  locale = "en-US",
  rangeLabel = "Aug 24, 3 PM – Aug 27, 3 PM",
  routedAvailability = 99.88,
  timeZone = "Asia/Shanghai",
  timeline = defaultTimeline,
  uptime = 100,
  ...props
}: AvailabilityMonitorProps) {
  return (
    <section
      aria-label="Service availability"
      className={cn("flex w-full max-w-[982px] flex-col gap-4", className)}
      {...props}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <SummaryCard
          explanation="The percentage of time the service responded during the last three days."
          label="Uptime (3d)"
          value={uptime}
        />
        <SummaryCard
          explanation="The percentage of requests successfully completed during the last three days."
          label="Availability (3d)"
          value={availability}
        />
      </div>

      <TimelineCard
        availability={availability}
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
        <a
          className="text-fg-default underline underline-offset-2 hover:text-fg-brand"
          href={endpointsHref}
        >
          Endpoints API
        </a>
        .{" "}
        <a
          className="text-fg-default underline underline-offset-2 hover:text-fg-brand"
          href={learnMoreHref}
        >
          Learn more
        </a>{" "}
        about our load balancing and customization options.
      </p>
    </section>
  );
}

export { defaultChartData, defaultTimeline };
