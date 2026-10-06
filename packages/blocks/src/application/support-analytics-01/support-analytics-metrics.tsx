"use client";

import { Badge } from "@zeron/ui/badge";
import { ChartDataTable } from "@zeron/ui/chart-primitives";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@zeron/ui/table";
import { comparison, comparisonText, formatCount, formatDate, formatMetric, validMetricValue } from "./support-analytics-data";
import { MetricTrend } from "./support-analytics-charts";
import type { SupportAnalyticsLabels, SupportAnalyticsMetric } from "./support-analytics-types";

export function SupportMetrics({ metrics, labels, locale, timeZone, rangeLabel }: { metrics: readonly SupportAnalyticsMetric[]; labels: SupportAnalyticsLabels; locale: string; timeZone: string; rangeLabel: string }) {
  return <div className="min-w-0 space-y-2">
    <Table>
      <TableHeader><TableRow><TableHead>{rangeLabel}</TableHead><TableHead>{labels.trend}</TableHead><TableHead className="text-right">{labels.actual}</TableHead><TableHead className="text-right">{labels.previous}</TableHead></TableRow></TableHeader>
      <TableBody>{metrics.map((metric) => {
        const available = validMetricValue(metric.value, metric.unit);
        const target = validMetricValue(metric.target, metric.unit);
        const met = available && target && (metric.improvementDirection === "higher" ? metric.value! >= metric.target! : metric.value! <= metric.target!);
        const delta = available && validMetricValue(metric.previousValue, metric.unit) ? comparison(metric.value, metric.previousValue, metric.comparison) : null;
        const improved = delta !== null && (metric.improvementDirection === "higher" ? delta > 0 : delta < 0);
        return <TableRow key={metric.id}>
          <TableCell><p className="min-w-32 text-body text-fg-default">{labels[metric.id]}</p><p className="mt-1 text-label text-fg-subtle">{target && <><span className={met ? "text-fg-success" : available ? "text-fg-danger" : "text-fg-subtle"}>{available ? met ? labels.met : labels.missed : labels.unknown}</span> · {labels.target} {formatMetric(metric.target, metric.unit, locale)}</>}<span className="block">{formatCount(metric.sampleSize, locale)} {labels.samples}</span></p></TableCell>
          <TableCell><MetricTrend metric={metric} /></TableCell>
          <TableCell className="whitespace-nowrap text-right font-medium tabular-nums text-fg-default">{formatMetric(metric.value, metric.unit, locale)}</TableCell>
          <TableCell className="text-right"><Badge size="sm" status={delta === null || delta === 0 ? "neutral" : improved ? "success" : "danger"}>{comparisonText(delta, locale, metric.comparison === "relative" ? "%" : ` ${labels.points}`)}</Badge></TableCell>
        </TableRow>;
      })}</TableBody>
    </Table>
    <ChartDataTable caption={labels.trend} summary={labels.values} columns={[labels.date, labels.trend, labels.actual]} rows={metrics.flatMap((metric) => metric.trend.map((point, index) => ({ id: `${metric.id}-${index}`, label: formatDate(point.timestamp, locale, timeZone), values: [labels[metric.id], formatMetric(point.value, metric.unit, locale)] })))} />
  </div>;
}
