"use client";

import { Alert, AlertTitle, AlertDescription, AlertAction } from "@zeron/ui/alert";

import { useRef, useState } from "react";
import { Button } from "@zeron/ui/button";
import { Card, CardFooter, CardHeader } from "@zeron/ui/card";
import { InlineNotice, InlineNoticeAction, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@zeron/ui/select";
import { Skeleton } from "@zeron/ui/skeleton";
import { TabItem, TabPanel, Tabs, TabsList } from "@zeron/ui/tabs";
import { Tooltip } from "@zeron/ui/tooltip";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { projectMonitorLabels, validTimestamp } from "./project-monitor-data";
import { MonitorPanel, OverviewView, ReportsView, StorageView } from "./project-monitor-views";
import type { ProjectMonitorProps, ProjectMonitorTab } from "./project-monitor-types";

/** 项目切换重置本地视图与复制反馈，受控值仍由宿主负责。 */
export function ProjectMonitor(props: ProjectMonitorProps) {
  return <ProjectMonitorContent key={props.data.project.id} {...props} />;
}

function ProjectMonitorContent({ data, tab, defaultTab = "overview", onTabChange, range, defaultRange, onRangeChange,
  state = "ready", refreshing = false, retainDataOnError = false, statusMessage, actions, advisor, visibleSections, labels: suppliedLabels, locale = "zh-CN", timeZone = "Asia/Shanghai", className, ...props }: ProjectMonitorProps) {
  const labels = { ...projectMonitorLabels, ...suppliedLabels };
  const [localTab, setLocalTab] = useState<ProjectMonitorTab>(defaultTab);
  const [localRange, setLocalRange] = useState(defaultRange ?? data.windows[0]?.id);
  const [copyFeedback, setCopyFeedback] = useState<{ endpoint: string; message: string } | null>(null);
  const copying = useRef(false);
  const Copy = useIcon("copy");
  const Settings = useIcon("settings");
  const Clock = useIcon("clock");
  const Refresh = useIcon("rotate-ccw");
  const hasAdvisor = advisor !== undefined && advisor !== null;
  const tabs: ProjectMonitorTab[] = hasAdvisor ? ["overview", "storage", "reports", "advisor"] : ["overview", "storage", "reports"];
  const requestedTab = tab ?? localTab;
  const activeTab = tabs.includes(requestedTab) ? requestedTab : "overview";
  const requestedRange = range ?? localRange;
  const selectedWindow = data.windows.find((window) => window.id === requestedRange) ?? (range === undefined ? data.windows[0] : undefined);
  const loading = state === "loading";
  const [pending, setPending] = useState<"refresh" | "retry" | null>(null);
  const inFlight = useRef(false);
  const [actionError, setActionError] = useState<{ data: typeof data; message: string } | null>(null);
  const currentError = actionError?.data === data ? actionError.message : undefined;
  const busy = loading || refreshing || pending !== null;
  const failed = state === "error" || currentError !== undefined;
  const replacesData = state === "error" && !retainDataOnError;
  async function runAction(kind: "refresh" | "retry") {
    const callback = kind === "refresh" ? actions?.onRefresh : actions?.onRetry;
    if (!callback || inFlight.current || loading || refreshing) return;
    inFlight.current = true;
    setPending(kind);
    setActionError(null);
    try { await callback(); }
    catch (cause) { setActionError({ data, message: cause instanceof Error && cause.message ? cause.message : labels.error }); }
    finally { inFlight.current = false; setPending(null); }
  }
  const retryAction = actions?.onRetry ? <Button variant="secondary" disabled={busy} loading={pending === "retry"} onClick={() => void runAction("retry")}>{labels.retry}</Button> : undefined;
  const date = new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", timeZone });
  const updated = validTimestamp(data.updatedAt) ? date.format(data.updatedAt) : labels.unknown;

  async function copyEndpoint() {
    if (copying.current) return;
    copying.current = true;
    const endpoint = data.project.endpoint;
    try {
      await navigator.clipboard.writeText(endpoint);
      setCopyFeedback({ endpoint, message: labels.copied });
    } catch {
      setCopyFeedback({ endpoint, message: labels.copyError });
    } finally {
      copying.current = false;
    }
  }

  const rangeControl = data.windows.length > 0 ? <Select value={selectedWindow?.id ?? ""} onValueChange={(id) => {
    if (range === undefined) setLocalRange(id);
    onRangeChange?.(id);
  }} size="sm" disabled={loading}>
    <SelectTrigger aria-label={labels.range} wrapperClassName="max-w-full" />
    <SelectContent>{data.windows.map((window) => <SelectItem key={window.id} value={window.id} label={window.label}>{window.label}</SelectItem>)}</SelectContent>
  </Select> : null;
  const viewProps = { data, labels, locale, timeZone };
  return <Card {...props} aria-busy={busy || undefined} data-slot="project-monitor" data-state={state}
    className={cn("@container w-full max-w-3xl overflow-hidden rounded-2xl bg-surface-raised pb-0", className)}>
    <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 px-5 py-5">
      <div className="min-w-0 flex-1 basis-44">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><h2 className="min-w-0 max-w-full break-words text-title font-semibold text-fg-default">{data.project.name}</h2><span className="min-w-0 max-w-full break-words text-label text-fg-subtle">{data.project.region}</span></div>
        <div className="mt-1 flex min-w-0 items-center gap-1"><span className="min-w-0 break-all font-mono text-label text-fg-muted">{data.project.endpoint}</span><Tooltip content={labels.copy}><Button aria-label={labels.copy} iconOnly size="xs" variant="ghost" onClick={copyEndpoint} disabled={!data.project.endpoint}><Copy /></Button></Tooltip></div>
        <p role="status" className="text-label text-fg-muted">{copyFeedback?.endpoint === data.project.endpoint ? copyFeedback.message : null}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {actions?.onRefresh && <Button aria-label={labels.refresh ?? "刷新数据"} iconOnly size="sm" variant="tertiary" disabled={busy} loading={refreshing || pending === "refresh"} onClick={() => void runAction("refresh")}><Refresh /></Button>}
        {actions?.onOpenDashboard && <Button onClick={actions.onOpenDashboard}>{labels.openDashboard}</Button>}
      </div>
    </CardHeader>
    <Tabs value={activeTab} onValueChange={(value) => {
      if (!tabs.includes(value as ProjectMonitorTab)) return;
      if (tab === undefined) setLocalTab(value as ProjectMonitorTab);
      onTabChange?.(value as ProjectMonitorTab);
    }} variant="pill" color="neutral" className="min-w-0">
      <TabsList aria-label={labels.navigation} className="mx-3 mb-2">{tabs.map((item) => <TabItem key={item} value={item} label={labels[item]} />)}</TabsList>
      <div className="mx-1">
        {state === "stale" && !failed && <div className="mb-1"><InlineNotice variant="emphasized" tone="warning"><InlineNoticeContent>{statusMessage ?? labels.stale}</InlineNoticeContent></InlineNotice></div>}
        {!loading && !replacesData && busy && <div className="mb-1"><InlineNotice variant="emphasized" tone="info"><span aria-hidden="true" className="inline-flex h-5 shrink-0 items-center [&_svg]:size-4"><span className="inline-flex animate-spin motion-reduce:animate-none"><Refresh /></span></span><InlineNoticeContent>{labels.refreshing ?? "正在刷新，保留上次获取的结果。"}</InlineNoticeContent></InlineNotice></div>}
        {!replacesData && failed && <div className="mb-1"><InlineNotice variant="emphasized" tone="danger" role={currentError ? "alert" : undefined}><InlineNoticeContent>{currentError ?? statusMessage ?? labels.error} {labels.previousData ?? "当前显示上次获取的结果。"}</InlineNoticeContent>{retryAction && <InlineNoticeAction>{retryAction}</InlineNoticeAction>}</InlineNotice></div>}
        {loading ? <TabPanel value={activeTab}><MonitorPanel><div role="status" className="space-y-5"><span className="sr-only">{labels.loading}</span><Skeleton className="h-8 w-36" /><Skeleton className="h-40 w-full" /><Skeleton className="h-24 w-full" /></div></MonitorPanel></TabPanel>
          : replacesData ? <TabPanel value={activeTab}><MonitorPanel><div className="flex min-w-0 w-full items-center justify-center min-h-60 px-4 py-8"><Alert status="danger" role={Boolean(currentError) ? "alert" : "group"} className="w-full max-w-xl"><AlertTitle>{labels.error}</AlertTitle><AlertDescription>{currentError ?? statusMessage}</AlertDescription><AlertAction>{retryAction}</AlertAction></Alert></div></MonitorPanel></TabPanel>
            : <>
              <TabPanel value="overview"><OverviewView {...viewProps} window={selectedWindow} rangeControl={rangeControl} visibleSections={visibleSections} /></TabPanel>
              <TabPanel value="storage"><StorageView {...viewProps} /></TabPanel>
              <TabPanel value="reports"><ReportsView window={selectedWindow} labels={labels} locale={locale} timeZone={timeZone} rangeControl={rangeControl} /></TabPanel>
              {hasAdvisor && <TabPanel value="advisor"><MonitorPanel>{advisor}</MonitorPanel></TabPanel>}
            </>}
      </div>
    </Tabs>
    <CardFooter className="flex-wrap justify-between gap-3 px-5 py-4">
      <p className="flex items-center gap-2 text-label text-fg-subtle"><Clock size={14} /><span>{labels.updated} {updated}</span></p>
      {actions?.onCustomize && <Button variant="tertiary" size="sm" leadingIcon={Settings} onClick={actions.onCustomize}>{labels.customize}</Button>}
    </CardFooter>
  </Card>;
}
