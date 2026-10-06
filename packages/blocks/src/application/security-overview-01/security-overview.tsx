"use client";

import { Alert, AlertTitle, AlertAction } from "@zeron/ui/alert";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Container, ContainerBody, ContainerFooter, ContainerHeader } from "@zeron/ui/container";
import { Empty, EmptyDescription } from "@zeron/ui/empty";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { MetricCard } from "@zeron/ui/metric-card";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@zeron/ui/select";
import { Skeleton } from "@zeron/ui/skeleton";
import { TabItem, TabPanel, Tabs, TabsList } from "@zeron/ui/tabs";
import { Tooltip } from "@zeron/ui/tooltip";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { SecurityScore, SecurityTrend } from "./security-overview-charts";
import { securityCountTotal, securityFormatCount, securityFormatDate, securityFormatNumber, securityOverviewLabels, securityValidCount, securityValidNumber } from "./security-overview-data";
import { SecurityAssets, SecurityFindings, SecurityPosture } from "./security-overview-views";
import type { SecurityOverviewProps, SecurityOverviewView } from "./security-overview-types";

const views: SecurityOverviewView[] = ["trend", "findings", "posture", "assets"];
const idleScan = { status: "idle" } as const;

/** Scope changes reset only local view and event guards; the caller owns requests and snapshots. */
export function SecurityOverview(props: SecurityOverviewProps) {
  return <SecurityOverviewContent key={props.scopeId} {...props} />;
}

function SecurityOverviewContent({ scopeId, data, state = "ready", statusMessage, range, onRangeChange,
  view, defaultView = "trend", onViewChange, scan = idleScan, scanDisabledReason, exportState = "idle", exportError,
  actions, title, description, labels: overrides, locale = "zh-CN", timeZone = "Asia/Shanghai", className, ...props }: SecurityOverviewProps) {
  const labels = { ...securityOverviewLabels, ...overrides };
  const [localView, setLocalView] = useState(defaultView);
  const scanGuard = useRef(false);
  const exportGuard = useRef(false);
  const Shield = useIcon("shield");
  const Close = useIcon("x");
  const Calendar = useIcon("calendar");
  const Download = useIcon("arrow-down");
  const Clock = useIcon("clock");
  const scoped = data?.scopeId === scopeId ? data : null;
  const sameRange = scoped?.range === range;
  const matching = sameRange ? scoped : null;
  const loading = state === "loading" || (state !== "error" && scoped !== null && !sameRange);
  const usable = state !== "loading" && state !== "error" ? matching : null;
  const activeView = views.includes(view ?? localView) ? view ?? localView : "trend";
  const busy = scan.status === "starting" || scan.status === "running" || scan.status === "refreshing";
  // A succeeded task is not visually complete until its result belongs to the visible snapshot.
  const awaitingResult = scan.status === "succeeded" && scan.snapshotId !== scoped?.id;
  const scanning = busy || awaitingResult;
  const scoreData = state !== "error" && (state !== "loading" || scanning) ? scoped : null;
  const total = scoreData ? securityCountTotal(scoreData.openBySeverity) : null;
  const progress = scan.status === "running" && securityValidCount(scan.completed) && securityValidCount(scan.total) && scan.total > 0 && scan.completed <= scan.total ? `${scan.completed} / ${scan.total}` : null;
  const currentScore = scoreData && securityValidNumber(scoreData.score, 100) ? scoreData.score : null;
  const delta = currentScore !== null && usable && securityValidNumber(usable.previousScore, 100) ? currentScore - usable.previousScore : null;
  const scanText = scan.status === "starting" ? labels.starting : scan.status === "running" ? `${labels.scanning}${progress ? ` · ${progress}` : ""}` : scan.status === "refreshing" || awaitingResult ? labels.refreshing : scan.status === "failed" ? scan.message : scan.status === "succeeded" ? `${labels.scanComplete} · ${securityFormatNumber(scan.newFindingCount, locale)} ${labels.newFindings}` : null;

  useEffect(() => { if (!scanning) scanGuard.current = false; }, [scan.status, scanning]);
  useEffect(() => { if (exportState !== "pending") exportGuard.current = false; }, [exportState]);

  function runScan() {
    if (scanGuard.current || scanning || scanDisabledReason || !actions?.onRunScan) return;
    scanGuard.current = true;
    try { actions.onRunScan({ scopeId }); } finally { queueMicrotask(() => { scanGuard.current = false; }); }
  }

  function exportSnapshot() {
    if (exportGuard.current || exportState === "pending" || !usable || !actions?.onExport) return;
    exportGuard.current = true;
    try { actions.onExport({ scopeId, snapshotId: usable.id, range: usable.range }); } finally { queueMicrotask(() => { exportGuard.current = false; }); }
  }

  const rangeLabels = { "7d": labels.days7, "30d": labels.days30, "90d": labels.days90 };
  const metricState = loading ? "loading" : state === "error" ? "error" : "ready";
  const fixHours = usable?.medianFixTimeHours ?? null;
  const fixDays = securityValidNumber(fixHours) && fixHours >= 24;
  const viewProps = usable ? { data: usable, labels, locale, timeZone, actions } : null;

  return <Container {...props} data-block="security-overview" data-state={state} aria-busy={loading || undefined} className={cn("@container w-full max-w-xl", className)}>
    <ContainerHeader className="py-1.5">
      <div className="flex min-w-0 items-center gap-2"><h2 className="break-words text-body font-medium text-fg-default">{title ?? labels.title}</h2><Tooltip content={description ?? labels.description}><Button iconOnly size="xs" variant="ghost" aria-label={description ?? labels.description}><Shield aria-hidden /></Button></Tooltip></div>
      <div className="flex max-w-full items-center gap-2"><Select value={range} onValueChange={(value) => { if (value === "7d" || value === "30d" || value === "90d") onRangeChange(value); }} size="sm"><SelectTrigger icon={Calendar} aria-label={labels.range} wrapperClassName="max-w-full" /><SelectContent>{(["7d", "30d", "90d"] as const).map((value) => <SelectItem key={value} value={value} label={rangeLabels[value]}>{rangeLabels[value]}</SelectItem>)}</SelectContent></Select>
        {actions?.onClose && <Button iconOnly variant="ghost" size="sm" aria-label={labels.close} onClick={actions.onClose}><Close aria-hidden /></Button>}
      </div>
    </ContainerHeader>
    <ContainerBody>
      <div className="flex flex-wrap items-center gap-4">
        {scoreData ? <SecurityScore data={scoreData} scan={scan} labels={labels} locale={locale} /> : loading ? <Skeleton className="size-24 rounded-full" /> : <span className="flex size-24 shrink-0 items-center justify-center rounded-full border-hairline border-border text-heading text-fg-subtle">{labels.unknown}</span>}
        <div className="min-w-0 flex-1 basis-28"><p className="text-label text-fg-subtle">{labels.securityScore}</p><p className="mt-1 flex items-baseline gap-2"><span data-slot="security-score-value" className="text-heading font-semibold tabular-nums text-fg-default">{securityFormatNumber(currentScore, locale, 100)}</span><span className="text-body text-fg-subtle">/ 100</span></p><div className="mt-2 flex flex-wrap items-center gap-2">{delta !== null && <Badge size="sm" status={delta < 0 ? "danger" : delta > 0 ? "success" : "neutral"}>{delta > 0 ? "+" : ""}{securityFormatNumber(Math.abs(delta), locale)}{delta < 0 ? ` ${labels.points} ↓` : ` ${labels.points}`}</Badge>}<span className="text-label text-fg-subtle">{delta === null ? labels.unknown : `${labels.compare} · ${rangeLabels[range]}`}</span></div></div>
        {actions?.onRunScan && <div className="flex flex-col gap-1"><Button size="sm" leadingIcon={Shield} loading={scanning} disabled={Boolean(scanDisabledReason)} onClick={runScan}>{scanning ? labels.scanning : scan.status === "failed" ? labels.retry : labels.runScan}</Button>{scanDisabledReason && <p className="max-w-40 text-label text-fg-subtle">{scanDisabledReason}</p>}</div>}
      </div>
      <div className="mt-5 grid grid-cols-2 gap-2 @lg:grid-cols-4">
        <MetricCard label={labels.open} value={securityFormatNumber(total, locale)} state={metricState} content={{ type: "none" }} labelClassName="text-label" footer={scoreData?.openBySeverity && securityCountTotal(scoreData.openBySeverity) !== null ? <span className="text-fg-danger">{scoreData.openBySeverity.critical} {labels.critical}</span> : labels.unknown} />
        <MetricCard label={labels.resolved} value={securityFormatCount(usable?.resolvedInWindow ?? null, locale)} state={metricState} content={{ type: "none" }} labelClassName="text-label" footer={rangeLabels[range]} />
        <MetricCard label={labels.scannedAssets} value={securityFormatCount(scoreData?.scannedAssetCount ?? null, locale)} state={metricState} content={{ type: "none" }} labelClassName="text-label" footer={usable && securityValidCount(usable.newAssetsInWindow) ? `+${securityFormatCount(usable.newAssetsInWindow, locale)} · ${rangeLabels[range]}` : labels.unknown} />
        <MetricCard label={labels.fixTime} value={securityFormatNumber(fixDays ? fixHours / 24 : fixHours, locale)} unit={fixDays ? labels.days : labels.hours} state={metricState} content={{ type: "none" }} labelClassName="text-label" footer={labels.median} />
      </div>
    </ContainerBody>
    <Tabs value={activeView} variant="pill" color="default" onValueChange={(next) => { if (!views.includes(next as SecurityOverviewView)) return; if (view === undefined) setLocalView(next as SecurityOverviewView); onViewChange?.(next as SecurityOverviewView); }} className="flex min-w-0 flex-col gap-2">
      <div className="overflow-x-auto"><TabsList aria-label={labels.navigation} className="w-full min-w-max">{views.map((item) => <TabItem key={item} value={item} label={labels[item]} className="flex-1 justify-center" badge={item === "findings" && total !== null ? total : item === "assets" && scoreData?.affectedAssetCount != null ? securityFormatCount(scoreData.affectedAssetCount, locale) : undefined} />)}</TabsList></div>
      <TabPanel value={activeView}>
        <ContainerBody>
        {(state === "stale" || scanning || scan.status === "failed") && <div className="mb-4"><InlineNotice variant="emphasized" tone={scan.status === "failed" ? "danger" : "warning"}><InlineNoticeContent>{scan.status === "failed" ? scan.message : scanning ? labels.previousSnapshot : statusMessage ?? labels.stale}</InlineNoticeContent></InlineNotice></div>}
        {loading ? <div role="status" className="space-y-4"><span className="sr-only">{labels.loading}</span><Skeleton className="h-5 w-32" /><Skeleton className="h-48 w-full" /></div> : state === "error" ? <div className="flex min-w-0 w-full items-center justify-center min-h-60 px-4 py-8"><Alert status="danger" role="group" className="w-full max-w-xl"><AlertTitle>{statusMessage ?? labels.error}</AlertTitle><AlertAction>{actions?.onRetry && <Button variant="secondary" onClick={actions.onRetry}>{labels.retry}</Button>}</AlertAction></Alert></div> : viewProps ? activeView === "trend" ? <SecurityTrend {...viewProps} /> : activeView === "findings" ? <SecurityFindings {...viewProps} /> : activeView === "posture" ? <SecurityPosture {...viewProps} /> : <SecurityAssets {...viewProps} /> : <Empty reason="no-data" scope="inline"><EmptyDescription>{labels.noData}</EmptyDescription></Empty>}
        </ContainerBody>
      </TabPanel>
    </Tabs>
    <ContainerFooter className="justify-between gap-3">
      <div className="min-w-0 space-y-1"><p className="flex items-start gap-2 text-label text-fg-subtle"><Clock size={14} aria-hidden /><span>{scoped?.lastScanAt != null ? `${labels.lastScan} ${securityFormatDate(scoped.lastScanAt, locale, timeZone)}` : labels.neverScanned}</span></p><p role="status" aria-live="polite" className={cn("text-label", scan.status === "failed" ? "text-fg-danger" : "text-fg-muted")}>{scanText}</p>{exportState === "error" && <p role="alert" className="text-label text-fg-danger">{exportError ?? labels.exportError}</p>}</div>
      {actions?.onExport && <Button variant="secondary" size="sm" leadingIcon={Download} disabled={!usable} loading={exportState === "pending"} onClick={exportSnapshot}>{exportState === "pending" ? labels.exporting : labels.export}</Button>}
    </ContainerFooter>
  </Container>;
}
