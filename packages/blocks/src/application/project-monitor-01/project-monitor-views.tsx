"use client";

import type { ReactNode } from "react";
import { Badge } from "@zeron/ui/badge";
import { Empty, EmptyDescription } from "@zeron/ui/empty";
import { InfoItem, InfoItemContent, InfoItemDescription, InfoItemGroup, InfoItemLeading, InfoItemTitle, InfoItemTrailing, InfoItemValue } from "@zeron/ui/info-item";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { StatusOverview } from "@zeron/ui/status-overview";
import { useIcon, type IconName } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { StorageUsage } from "@zeron/blocks/storage-usage-01";
import { bucketTotal, formatBytes, formatMetric, summarizeWindow, validNumber, validTimestamp } from "./project-monitor-data";
import { LatencyChart, RequestTrend, ResourceMetric, ServiceDistribution } from "./project-monitor-charts";
import type { ProjectMonitorData, ProjectMonitorLabels, ProjectMonitorProps, ProjectMonitorWindow } from "./project-monitor-types";

export function MonitorPanel({ children, className, label }: { children: ReactNode; className?: string; label?: string }) {
  return <section aria-label={label} className={cn("rounded-xl border-hairline border-border bg-surface-floating p-5", className)}>{children}</section>;
}

export function NoMonitorData({ children }: { children: ReactNode }) {
  return <Empty reason="no-data" scope="inline" density="compact"><EmptyDescription>{children}</EmptyDescription></Empty>;
}

function MissingWindow({ labels, rangeControl }: { labels: ProjectMonitorLabels; rangeControl: ReactNode }) {
  return <MonitorPanel>
    {rangeControl && <div className="mb-5 flex justify-end">{rangeControl}</div>}
    <NoMonitorData>{labels.noData}</NoMonitorData>
  </MonitorPanel>;
}

function ProjectFact({ label, value, icon = "square-library" }: { label: string; value: ReactNode; icon?: IconName }) {
  const Icon = useIcon(icon);
  return <InfoItem className="px-0"><InfoItemLeading><Icon /></InfoItemLeading><InfoItemContent><InfoItemDescription>{label}</InfoItemDescription><InfoItemTitle className="break-words">{value}</InfoItemTitle></InfoItemContent></InfoItem>;
}

interface ViewProps { data: ProjectMonitorData; labels: ProjectMonitorLabels; locale: string; timeZone: string }
interface WindowProps { window: ProjectMonitorWindow; labels: ProjectMonitorLabels; locale: string; timeZone: string; rangeControl: ReactNode }

export function RequestSummary({ window, labels, locale, rangeControl, peak = false }: Omit<WindowProps, "timeZone"> & { peak?: boolean }) {
  const summary = summarizeWindow(window);
  return <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><strong data-slot="project-request-total" className="text-heading font-semibold tabular-nums text-fg-default">{formatMetric(summary.total, locale, 0)}</strong><span className="text-label text-fg-subtle">{labels.requests}{peak && ` · ${labels.peak} ${formatMetric(summary.peak, locale, 0)}`}</span></div>
    {rangeControl}
  </div>;
}

function ServiceActivity({ window, labels, locale, timeZone, rangeControl }: WindowProps) {
  const summary = summarizeWindow(window);
  const time = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", timeZone });
  return <MonitorPanel label={labels.activity}>
    <RequestSummary window={window} labels={labels} locale={locale} rangeControl={rangeControl} />
    {!summary.complete && <InlineNotice variant="emphasized" tone="warning"><InlineNoticeContent>{labels.incomplete}</InlineNoticeContent></InlineNotice>}
    <div className="space-y-4">
      {summary.services.map((service) => <StatusOverview key={service.id} variant="activity" ariaLabel={`${service.name} · ${labels.activity}`} label={service.name}
        summary={{ label: labels.requests, value: formatMetric(service.total, locale, 0) }} emptyContent={labels.noData}
        content={{ type: "timeline", start: window.start, end: window.end, items: service.buckets.map((bucket, index) => {
          const total = bucketTotal(bucket);
          const status = total === null ? "unknown" : total === 0 ? "empty" : bucket!.errors > 0 ? "down" : bucket!.warning > 0 ? "degraded" : "operational";
          const duration = (window.end - window.start) / service.buckets.length;
          const timestamp = window.start + duration * index;
          const at = validTimestamp(timestamp) ? time.format(timestamp) : labels.unknown;
          const periodId = validTimestamp(timestamp) ? `${timestamp}-${duration}` : `unknown-${index}`;
          return { id: `${service.id}-${window.id}-${periodId}`, status, ariaLabel: `${service.name}，${at}，${total === null ? labels.noData : `${formatMetric(total, locale, 0)} ${labels.requests}；${labels.success} ${bucket!.success}，${labels.warning} ${bucket!.warning}，${labels.errors} ${bucket!.errors}`}` };
        }) }} />)}
    </div>
    {summary.complete && <div className="mt-5 flex flex-wrap justify-center gap-x-5 gap-y-2">
      {([ ["success", "success"], ["warning", "warning"], ["errors", "danger"] ] as const).map(([key, status]) => <Badge key={key} variant="dot" status={status}>{labels[key]} · {summary.total ? new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 1 }).format(summary.totals[key] / summary.total) : "—"}</Badge>)}
    </div>}
  </MonitorPanel>;
}

export function OverviewView({ data, labels, locale, timeZone, window, rangeControl, visibleSections }: ViewProps & { window?: ProjectMonitorWindow; rangeControl: ReactNode; visibleSections: ProjectMonitorProps["visibleSections"] }) {
  const health = data.project.health;
  const status = { healthy: "success", degraded: "warning", down: "danger", unknown: "neutral" } as const;
  return <div className="space-y-1">
    <MonitorPanel>
      <div className="grid gap-x-8 @md:grid-cols-2">
        <ProjectFact label={labels.health} icon="shield" value={<Badge variant="dot" status={status[health]}>{health === "unknown" ? labels.unknownHealth : labels[health]}</Badge>} />
        {data.project.facts.map((fact) => <ProjectFact key={fact.id} label={fact.label} value={fact.value ?? labels.unknown} icon={fact.icon} />)}
      </div>
    </MonitorPanel>
    {visibleSections?.resources !== false && <MonitorPanel label={labels.resources}>
      {data.metrics.length ? <div className="grid grid-cols-2 gap-x-5 gap-y-6 @md:grid-cols-3 @2xl:grid-cols-5">{data.metrics.map((metric) => <ResourceMetric key={metric.id} metric={metric} locale={locale} />)}</div> : <NoMonitorData>{labels.noData}</NoMonitorData>}
    </MonitorPanel>}
    {visibleSections?.activity !== false && (window ? <ServiceActivity window={window} labels={labels} locale={locale} timeZone={timeZone} rangeControl={rangeControl} /> : <MissingWindow labels={labels} rangeControl={rangeControl} />)}
  </div>;
}

export function StorageView({ data, labels, locale, timeZone }: ViewProps) {
  const Folder = useIcon("folder");
  const Globe = useIcon("globe");
  const Lock = useIcon("lock");
  const { storage } = data;
  const available = validNumber(storage.capacityBytes) && storage.categories.every((category) => validNumber(category.bytes));
  const date = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone });
  return <div className="space-y-1">
    {available ? <StorageUsage className="rounded-xl border-hairline border-border bg-surface-floating p-5" label={labels.storageUsage} unit="GB" locale={locale}
      data={{ capacity: storage.capacityBytes! / 1e9, items: storage.categories.map((category) => ({ id: category.id, label: category.label, value: category.bytes! / 1e9, color: category.color, colorIndex: category.colorIndex })) }}
      formatters={{ usageSummary: (used, capacity, unit) => `已用 ${used} ${unit} / 共 ${capacity} ${unit}`, remaining: (remaining, unit) => `剩余 ${remaining} ${unit}` }} />
      : <MonitorPanel label={labels.storageUsage}><NoMonitorData>{labels.noData}</NoMonitorData></MonitorPanel>}
    <InfoItemGroup aria-label={labels.buckets} className="border-hairline border-border p-2">
      {storage.buckets.length ? storage.buckets.map((bucket) => <InfoItem key={bucket.id} className="flex-wrap gap-y-2 py-4">
        <InfoItemLeading><Folder /></InfoItemLeading>
        <InfoItemContent><InfoItemTitle className="break-words">{bucket.name}</InfoItemTitle><InfoItemDescription className="flex flex-wrap items-center gap-1.5">{bucket.access === "public" ? <Globe size={12} /> : <Lock size={12} />}{bucket.access === "public" ? labels.public : labels.private} · {formatMetric(bucket.files, locale, 0)} {labels.files}</InfoItemDescription></InfoItemContent>
        <InfoItemTrailing><div className="space-y-1"><InfoItemValue>{formatBytes(bucket.bytes, locale)}</InfoItemValue><p className="text-label text-fg-subtle">{validTimestamp(bucket.updatedAt) ? date.format(bucket.updatedAt) : labels.unknown}</p></div></InfoItemTrailing>
      </InfoItem>) : <NoMonitorData>{labels.noData}</NoMonitorData>}
    </InfoItemGroup>
  </div>;
}

export function ReportsView({ window, labels, locale, timeZone, rangeControl }: Omit<WindowProps, "window"> & { window?: ProjectMonitorWindow }) {
  if (!window) return <MissingWindow labels={labels} rangeControl={rangeControl} />;
  const summary = summarizeWindow(window);
  return <div className="space-y-1">
    <MonitorPanel>
      <RequestSummary window={window} labels={labels} locale={locale} rangeControl={rangeControl} peak />
      {!summary.complete && <InlineNotice variant="emphasized" tone="warning"><InlineNoticeContent>{labels.incomplete}</InlineNoticeContent></InlineNotice>}
      {summary.points.length ? <RequestTrend window={window} labels={labels} locale={locale} timeZone={timeZone} /> : <NoMonitorData>{labels.noData}</NoMonitorData>}
    </MonitorPanel>
    <MonitorPanel><div className="grid gap-8 @2xl:grid-cols-2"><ServiceDistribution window={window} labels={labels} locale={locale} /><LatencyChart window={window} labels={labels} locale={locale} /></div></MonitorPanel>
  </div>;
}
