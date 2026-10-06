"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { badgeColors } from "@zeron/ui/badge";
import { ChartContainer, DonutSummary, TimeSeriesChart } from "@zeron/ui/chart";
import { ChartLegend, chartSeriesColor, createChartNumberFormatter } from "@zeron/ui/chart-primitives";
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
    <DonutSummary className="mx-auto w-24" segments={[{ id: "used", label: metric.label, value: percentage, color: "var(--brand)" }]} total={1} innerRadius="83%" aria-label={`${metric.label}：${text}`} center={<span className="text-body font-semibold">{text}</span>} />
    <figcaption className="mt-3 text-label text-fg-subtle">{metric.label}</figcaption>
  </figure>;
}

export function RequestTrend({ window, labels, locale, timeZone }: { window: ProjectMonitorWindow; labels: ProjectMonitorLabels; locale: string; timeZone: string }) {
  const { points } = summarizeWindow(window);
  return <TimeSeriesChart data={points.map((point) => ({ timestamp: point.timestamp, values: { requests: point.requests } }))} series={[{ id: "requests", label: labels.requests, color: "var(--brand)" }]} domain={[window.start, window.end]} locale={locale} timeZone={timeZone} label={`${window.label} · ${labels.requests}，缺失时段保留断点`} dataSummary="查看数据" />;
}

export function ServiceDistribution({ window, labels, locale }: { window: ProjectMonitorWindow; labels: ProjectMonitorLabels; locale: string }) {
  const { services, total, complete } = summarizeWindow(window);
  const segments = services.map((service) => ({ id: service.id, label: service.name, value: service.total, color: badgeColors[service.color] }));
  const formatPercent = createChartNumberFormatter(locale, { style: "percent", maximumFractionDigits: 1 });
  return <div className="min-w-0">
    <h3 className="mb-5 text-label font-medium text-fg-subtle">{labels.serviceDistribution}</h3>
    <div className="flex flex-col items-center gap-5 @sm:flex-row">
      <DonutSummary className="w-32 shrink-0" segments={segments} total={total} aria-label={`${labels.total}：${formatMetric(total, locale, 0)}${complete ? "" : ` · ${labels.incomplete}`}`} center={<><strong className="text-body font-semibold">{formatMetric(total, locale, 0)}</strong><span className="text-label text-fg-subtle">{labels.requests}</span></>} />
      <ChartLegend className="w-full @sm:w-auto @sm:flex-1" items={segments.map((service) => ({ ...service, value: formatMetric(service.value, locale, 0), ratio: complete && total! > 0 ? formatPercent(service.value! / total!) : "—" }))} />
    </div>
    {!complete && <p className="mt-3 text-label text-fg-subtle">{labels.incomplete}</p>}
  </div>;
}

export function LatencyChart({ window, labels, locale }: { window: ProjectMonitorWindow; labels: ProjectMonitorLabels; locale: string }) {
  const entries = [{ key: "p50", label: "P50", color: chartSeriesColor("p50") }, { key: "p95", label: "P95", color: chartSeriesColor("p95") }, { key: "p99", label: "P99", color: chartSeriesColor("p99") }] as const;
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
