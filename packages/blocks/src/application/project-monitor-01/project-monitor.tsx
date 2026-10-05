"use client";

import { useRef, useState } from "react";
import { Button } from "@zeron/ui/button";
import { Card, CardFooter, CardHeader } from "@zeron/ui/card";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
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
  state = "ready", statusMessage, actions, advisor, visibleSections, labels: suppliedLabels, locale = "zh-CN", timeZone = "Asia/Shanghai", className, ...props }: ProjectMonitorProps) {
  const labels = { ...projectMonitorLabels, ...suppliedLabels };
  const [localTab, setLocalTab] = useState<ProjectMonitorTab>(defaultTab);
  const [localRange, setLocalRange] = useState(defaultRange ?? data.windows[0]?.id);
  const [copyFeedback, setCopyFeedback] = useState<{ endpoint: string; message: string } | null>(null);
  const copying = useRef(false);
  const Copy = useIcon("copy");
  const Settings = useIcon("settings");
  const Clock = useIcon("clock");
  const hasAdvisor = advisor !== undefined && advisor !== null;
  const tabs: ProjectMonitorTab[] = hasAdvisor ? ["overview", "storage", "reports", "advisor"] : ["overview", "storage", "reports"];
  const requestedTab = tab ?? localTab;
  const activeTab = tabs.includes(requestedTab) ? requestedTab : "overview";
  const requestedRange = range ?? localRange;
  const selectedWindow = data.windows.find((window) => window.id === requestedRange) ?? (range === undefined ? data.windows[0] : undefined);
  const loading = state === "loading";
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
  return <Card {...props} aria-busy={loading || undefined} data-slot="project-monitor" data-state={state}
    className={cn("@container w-full max-w-3xl overflow-hidden rounded-2xl border-hairline border-border bg-surface-raised pb-0 shadow-raised", className)}>
    <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4 px-5 py-5">
      <div className="min-w-0 flex-1 basis-44">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><h2 className="min-w-0 max-w-full break-words text-title font-semibold text-fg-default">{data.project.name}</h2><span className="min-w-0 max-w-full break-words text-label text-fg-subtle">{data.project.region}</span></div>
        <div className="mt-1 flex min-w-0 items-center gap-1"><span className="min-w-0 break-all font-mono text-label text-fg-muted">{data.project.endpoint}</span><Tooltip content={labels.copy}><Button aria-label={labels.copy} iconOnly size="xs" variant="ghost" onClick={copyEndpoint} disabled={!data.project.endpoint}><Copy /></Button></Tooltip></div>
        <p role="status" className="text-label text-fg-muted">{copyFeedback?.endpoint === data.project.endpoint ? copyFeedback.message : null}</p>
      </div>
      {actions?.onOpenDashboard && <Button onClick={actions.onOpenDashboard}>{labels.openDashboard}</Button>}
    </CardHeader>
    <Tabs value={activeTab} onValueChange={(value) => {
      if (!tabs.includes(value as ProjectMonitorTab)) return;
      if (tab === undefined) setLocalTab(value as ProjectMonitorTab);
      onTabChange?.(value as ProjectMonitorTab);
    }} variant="pill" color="neutral" className="min-w-0">
      <TabsList aria-label={labels.navigation} className="mx-3 mb-2">{tabs.map((item) => <TabItem key={item} value={item} label={labels[item]} />)}</TabsList>
      <div className="mx-1">
        {state === "stale" && <div className="mb-1"><InlineNotice variant="emphasized" tone="warning"><InlineNoticeContent>{statusMessage ?? labels.stale}</InlineNoticeContent></InlineNotice></div>}
        {loading ? <TabPanel value={activeTab}><MonitorPanel><div role="status" className="space-y-5"><span className="sr-only">{labels.loading}</span><Skeleton className="h-8 w-36" /><Skeleton className="h-40 w-full" /><Skeleton className="h-24 w-full" /></div></MonitorPanel></TabPanel>
          : state === "error" ? <TabPanel value={activeTab}><MonitorPanel><InlineNotice variant="emphasized" tone="danger" role="alert"><InlineNoticeContent>{statusMessage ?? labels.error}</InlineNoticeContent></InlineNotice>{actions?.onRetry && <div className="mt-4"><Button variant="secondary" onClick={actions.onRetry}>{labels.retry}</Button></div>}</MonitorPanel></TabPanel>
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
