"use client";

import { Badge, badgeColors } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Empty, EmptyDescription } from "@zeron/ui/empty";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { SecurityPostureRadar } from "./security-overview-charts";
import { securityCountTotal, securityFormatCount, securityFormatDate, securityFormatNumber, securitySeverities, securitySeverityColors, securitySortFindings, securityValidCount, securityValidNumber } from "./security-overview-data";
import type { SecurityOverviewLabels, SecurityOverviewProps, SecurityOverviewSnapshot } from "./security-overview-types";

interface ViewProps { data: SecurityOverviewSnapshot; labels: SecurityOverviewLabels; locale: string; timeZone: string; actions?: SecurityOverviewProps["actions"] }

function DataEmpty({ text }: { text: string }) {
  return <Empty reason="no-data" scope="inline"><EmptyDescription>{text}</EmptyDescription></Empty>;
}

export function SecurityFindings({ data, labels, locale, timeZone, actions }: ViewProps) {
  const Shield = useIcon("shield");
  const total = securityCountTotal(data.openBySeverity);
  const findings = data.findings === null ? null : securitySortFindings(data.findings).slice(0, 3);
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="flex items-center gap-2 text-body font-medium text-fg-default">{labels.findings}<Badge size="sm">{securityFormatNumber(total, locale)}</Badge></h3><span className="text-label text-fg-subtle">{labels.sortedByScore}</span></div>
    {total !== null && total > 0 && <div className="flex h-1.5 gap-1 overflow-hidden rounded-full" aria-hidden>{securitySeverities.map((severity) => <div key={severity} className="min-w-0 rounded-full" style={{ flexGrow: data.openBySeverity![severity], backgroundColor: badgeColors[securitySeverityColors[severity]] }} />)}</div>}
    {total !== null && <div className="flex flex-wrap gap-2">{securitySeverities.map((severity) => <Badge key={severity} variant="dot" color={securitySeverityColors[severity]} size="sm">{labels[severity]} {securityFormatNumber(data.openBySeverity![severity], locale)}</Badge>)}</div>}
    {!findings ? <DataEmpty text={labels.noData} /> : findings.length === 0 ? <DataEmpty text={total === 0 ? labels.noFindings : labels.noData} /> : <ul className="divide-y divide-border-subtle">{findings.map((finding) => <li key={finding.id} className="py-3">
      <div className="flex items-start gap-3"><span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-raised text-fg-muted"><Shield size={16} aria-hidden /></span>
        <div className="min-w-0 flex-1">{actions?.onOpenFinding ? <button type="button" onClick={() => actions.onOpenFinding!(finding.id)} className="max-w-full rounded-lg text-left text-body font-medium text-fg-default hover:underline focus-visible:outline focus-visible:outline-1 focus-visible:outline-focus-ring">{finding.title}</button> : <p className="break-words text-body font-medium text-fg-default">{finding.title}</p>}
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-label"><span className="break-all text-fg-subtle">{finding.assetName}</span><Badge size="sm" color={securitySeverityColors[finding.severity]}>{labels[finding.severity]}</Badge><span className="text-fg-subtle">{securityFormatDate(finding.detectedAt, locale, timeZone)}</span></div>
        </div><Badge size="sm" color={securitySeverityColors[finding.severity]}>{securityFormatNumber(finding.score, locale, 10)}</Badge>
      </div>
    </li>)}</ul>}
    {actions?.onViewAll && total !== null && total > 0 && <Button size="sm" variant="ghost" onClick={() => actions.onViewAll!("findings")}>{labels.viewAllFindings} · {securityFormatNumber(total, locale)}</Button>}
  </div>;
}

export function SecurityPosture({ data, labels, locale }: ViewProps) {
  const areas = data.posture;
  return <div className="space-y-3"><div><h3 className="text-body font-medium text-fg-default">{labels.posture}</h3><p className="mt-1 text-label text-fg-subtle">{labels.postureDescription}</p></div>
    {!areas?.length ? <DataEmpty text={labels.noData} /> : <>
      <div className="grid min-w-0 items-center gap-4 @lg:grid-cols-2"><SecurityPostureRadar data={data} labels={labels} />
        <dl className="space-y-3">{areas.map((area) => {
          const change = securityValidNumber(area.score, 100) && securityValidNumber(area.previousScore, 100) ? area.score - area.previousScore : null;
          return <div key={area.id} className="flex items-baseline justify-between gap-3 text-body"><dt className="min-w-0 break-words text-fg-muted">{area.label}</dt><dd className="flex shrink-0 gap-3 tabular-nums"><span aria-label={`${labels.change} ${change === null ? labels.unknown : change}`} className={cn("text-label", change === null || change === 0 ? "text-fg-subtle" : change > 0 ? "text-fg-success" : "text-fg-danger")}>{change === null ? labels.unknown : `${change > 0 ? "+" : ""}${change}`}</span><span className="font-medium text-fg-default">{securityFormatNumber(area.score, locale, 100)}</span><span className="sr-only"> / 100 · {labels.previous} {securityFormatNumber(area.previousScore, locale, 100)}</span></dd></div>;
        })}</dl>
      </div><p className="text-label text-fg-subtle">{labels.current} · {labels.previous}（{labels.compare}）</p>
    </>}
  </div>;
}

export function SecurityAssets({ data, labels, locale, timeZone, actions }: ViewProps) {
  const Globe = useIcon("globe");
  return <div className="space-y-3"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="flex items-center gap-2 text-body font-medium text-fg-default">{labels.affectedAssets}<Badge size="sm">{securityFormatCount(data.affectedAssetCount, locale)}</Badge></h3><span className="text-label text-fg-subtle">{labels.scannedAssets} {securityFormatCount(data.scannedAssetCount, locale)}</span></div>
    {!data.assets ? <DataEmpty text={labels.noData} /> : data.assets.length === 0 ? <DataEmpty text={data.affectedAssetCount === 0 ? labels.noAssets : labels.noData} /> : <ul className="divide-y divide-border-subtle">{data.assets.slice(0, 3).map((asset) => <li key={asset.id} className="flex flex-wrap items-center gap-3 py-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-raised text-fg-muted"><Globe size={16} aria-hidden /></span><div className="min-w-0 flex-1 basis-36">
      {actions?.onOpenAsset ? <button type="button" onClick={() => actions.onOpenAsset!(asset.id)} className="max-w-full break-all rounded-lg text-left text-body font-medium text-fg-default hover:underline focus-visible:outline focus-visible:outline-1 focus-visible:outline-focus-ring">{asset.name}</button> : <p className="break-all text-body font-medium text-fg-default">{asset.name}</p>}
      <p className="mt-1 text-label text-fg-subtle">{asset.kind} · {securityFormatDate(asset.lastScannedAt, locale, timeZone)}</p></div>
      <div className="flex flex-wrap gap-1.5">{securityCountTotal(asset.findings) === null ? <span className="text-label text-fg-subtle">{labels.noData}</span> : securitySeverities.filter((severity) => asset.findings[severity] > 0).map((severity) => <Badge key={severity} variant="dot" color={securitySeverityColors[severity]} size="sm">{labels[severity]} {securityFormatNumber(asset.findings[severity], locale)}</Badge>)}</div>
    </li>)}</ul>}
    {actions?.onViewAll && securityValidCount(data.affectedAssetCount) && data.affectedAssetCount > 0 && <Button size="sm" variant="ghost" onClick={() => actions.onViewAll!("assets")}>{labels.viewAllAssets} · {securityFormatCount(data.affectedAssetCount, locale)}</Button>}
  </div>;
}
