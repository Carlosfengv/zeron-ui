"use client";

import { useId } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import { badgeColors } from "@zeron/ui/badge";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@zeron/ui/chart";
import { MetricCard } from "@zeron/ui/metric-card";
import { formatMetric, summarizeWindow, validNumber } from "./project-monitor-data";
import type { ProjectMonitorLabels, ProjectMonitorMetric, ProjectMonitorWindow } from "./project-monitor-types";

export function ResourceMetric({ metric, locale }: { metric: ProjectMonitorMetric; locale: string }) {
  const hasCapacity = validNumber(metric.capacity) && metric.capacity > 0;
  const available = validNumber(metric.value);
  const percentage = hasCapacity && available ? Math.min(1, metric.value! / metric.capacity!) : null;
  const value = formatMetric(metric.value, locale);
  if (!hasCapacity) return <MetricCard label={metric.label} value={value} unit={metric.unit} state={available ? "ready" : "unavailable"} statusMessage={available ? undefined : "暂无可用数据"} className="h-full justify-center border-0 bg-transparent p-0 text-center" />;
  const text = metric.unit === "%" ? `${value}%` : `${value}/${formatMetric(metric.capacity, locale)}`;
  return <figure className="min-w-0 text-center" aria-label={`${metric.label}：${text}`}>
    <div className="relative mx-auto size-24">
      <ChartContainer aria-hidden="true" className="h-full min-h-0" config={{ used: { color: "var(--brand)" } }}>
        <PieChart accessibilityLayer={false}>
          <Pie data={[{ value: percentage ?? 0 }, { value: 1 - (percentage ?? 0) }]} dataKey="value" startAngle={90} endAngle={-270} innerRadius="83%" outerRadius="100%" stroke="none" isAnimationActive={false}>
            <Cell fill="var(--color-used)" /><Cell fill="var(--muted)" />
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-body font-semibold tabular-nums text-fg-default">{text}</div>
    </div>
    <figcaption className="mt-3 text-label text-fg-subtle">{metric.label}</figcaption>
  </figure>;
}

export function RequestTrend({ window, labels, locale, timeZone }: { window: ProjectMonitorWindow; labels: ProjectMonitorLabels; locale: string; timeZone: string }) {
  const descriptionId = useId();
  const { points } = summarizeWindow(window);
  const time = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", timeZone });
  return <div>
    <p id={descriptionId} className="sr-only">{window.label}，每个时间点对应一个等长时段的请求总数；缺失时段保留断点。</p>
    <ChartContainer aria-label="请求量趋势图" aria-describedby={descriptionId} className="h-52" config={{ requests: { label: labels.requests, color: "var(--brand)" } }}>
      <AreaChart data={points} margin={{ top: 12, right: 12, bottom: 0, left: 0 }} accessibilityLayer>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 5" />
        <XAxis dataKey="timestamp" type="number" domain={[window.start, window.end]} scale="time" tickFormatter={(value) => time.format(value)} minTickGap={50} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} width={32} axisLine={false} tickLine={false} />
        <ChartTooltip content={<ChartTooltipContent labelFormatter={(value) => time.format(Number(value))} valueFormatter={(value) => `${formatMetric(value as number, locale, 0)} ${labels.requests}`} />} />
        <Area dataKey="requests" type="linear" connectNulls={false} stroke="var(--color-requests)" fill="var(--color-requests)" fillOpacity={.12} strokeWidth={2} isAnimationActive={false} />
      </AreaChart>
    </ChartContainer>
  </div>;
}

export function ServiceDistribution({ window, labels, locale }: { window: ProjectMonitorWindow; labels: ProjectMonitorLabels; locale: string }) {
  const { services, total, complete } = summarizeWindow(window);
  const chartData = services.map((service) => ({ name: service.name, value: service.total ?? 0, fill: badgeColors[service.color] }));
  return <div className="min-w-0">
    <h3 className="mb-5 text-label font-medium text-fg-subtle">{labels.serviceDistribution}</h3>
    <div className="flex flex-col items-center gap-5 @sm:flex-row">
      <div className="relative size-32 shrink-0" role="img" aria-label={`${labels.total}：${formatMetric(total, locale, 0)}`}>
        <ChartContainer aria-hidden="true" className="h-full min-h-0" config={{}}>
          <PieChart accessibilityLayer={false}>
            <Pie data={complete && total ? chartData : [{ value: 1, fill: "var(--muted)" }]} dataKey="value" nameKey="name" innerRadius="80%" outerRadius="100%" startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false} />
          </PieChart>
        </ChartContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1">
          <strong className="text-body font-semibold tabular-nums text-fg-default">{formatMetric(total, locale, 0)}</strong>
          <span className="text-label text-fg-subtle">{labels.requests}</span>
        </div>
      </div>
      <ul className="w-full min-w-0 space-y-3 @sm:w-auto @sm:flex-1">
        {services.map((service) => <li key={service.id} className="flex items-center justify-between gap-3 text-label">
          <span className="flex min-w-0 items-center gap-2 text-fg-muted"><span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ backgroundColor: badgeColors[service.color] }} /><span className="min-w-0 break-words">{service.name}</span></span>
          <span className="shrink-0 tabular-nums text-fg-default">{complete && total! > 0 ? new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(service.total! / total!) : "—"}</span>
        </li>)}
      </ul>
    </div>
  </div>;
}

export function LatencyChart({ window, labels, locale }: { window: ProjectMonitorWindow; labels: ProjectMonitorLabels; locale: string }) {
  const entries = [{ key: "p50", label: "P50", color: "var(--success-border)" }, { key: "p95", label: "P95", color: "var(--info-border)" }, { key: "p99", label: "P99", color: "var(--warning-border)" }] as const;
  // 超过约定标尺仍显示真实值，所有分位数始终共用一个标尺。
  const maximum = Math.max(validNumber(window.latencyScaleMs) ? window.latencyScaleMs : 0, ...entries.map(({ key }) => validNumber(window.latency[key]) ? window.latency[key]! : 0), 1);
  return <div className="min-w-0">
    <h3 className="mb-5 text-label font-medium text-fg-subtle">{labels.latency} · {window.label}</h3>
    <div className="space-y-3">
      {entries.map(({ key, label, color }) => <div key={key}>
        <div className="flex items-center justify-between gap-3 text-label"><span className="text-fg-subtle">{label}</span><span className="tabular-nums text-fg-default">{formatMetric(window.latency[key], locale, 0)} {labels.milliseconds}</span></div>
        <ChartContainer aria-hidden="true" config={{ value: { color } }} className="h-5 min-h-0">
          <BarChart layout="vertical" data={[{ value: validNumber(window.latency[key]) ? window.latency[key] : 0 }]} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} accessibilityLayer={false}>
            <XAxis type="number" domain={[0, maximum]} hide /><YAxis type="category" hide />
            <Bar dataKey="value" fill="var(--color-value)" background={{ fill: "var(--muted)" }} barSize={5} radius={3} isAnimationActive={false} />
          </BarChart>
        </ChartContainer>
      </div>)}
    </div>
  </div>;
}
