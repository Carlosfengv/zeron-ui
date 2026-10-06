"use client";

import { Alert, AlertTitle, AlertDescription, AlertAction } from "@zeron/ui/alert";

import { useEffect, useLayoutEffect, useRef, useState, type FocusEvent } from "react";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Container, ContainerBody, ContainerFooter, ContainerHeader } from "@zeron/ui/container";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "@zeron/ui/dropdown";
import { Empty, EmptyDescription } from "@zeron/ui/empty";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { MenuItem } from "@zeron/ui/menu-item";
import { MetricCard } from "@zeron/ui/metric-card";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@zeron/ui/select";
import { Skeleton } from "@zeron/ui/skeleton";
import { TabItem, TabPanel, Tabs, TabsList } from "@zeron/ui/tabs";
import { Tooltip } from "@zeron/ui/tooltip";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { TicketTrend } from "./support-analytics-charts";
import { comparison, comparisonText, formatCount, formatUpdated, trendSummary, validCount } from "./support-analytics-data";
import { supportAnalyticsLabels } from "./support-analytics-labels";
import { SupportMetrics } from "./support-analytics-metrics";
import { SupportChannelBadges, SupportTotal } from "./support-analytics-motion";
import { RecentTickets } from "./support-analytics-tickets";
import type { SupportAnalyticsActionContext, SupportAnalyticsProps, SupportAnalyticsRange, SupportAnalyticsView } from "./support-analytics-types";

const ranges: SupportAnalyticsRange[] = ["this-week", "last-30-days", "last-12-weeks"];
const views: SupportAnalyticsView[] = ["all", "open", "resolved"];

function revealFocusedControl(event: FocusEvent<HTMLDivElement>) {
  event.target.scrollIntoView?.({ block: "nearest", inline: "nearest" });
}

export function SupportAnalytics(props: SupportAnalyticsProps) {
  return <SupportAnalyticsScope key={props.scopeId} {...props} />;
}

function SupportAnalyticsScope(props: SupportAnalyticsProps) {
  const [view, setView] = useState(props.defaultView ?? "all");
  const [expanded, setExpanded] = useState(props.defaultTicketsExpanded ?? false);
  return <SupportAnalyticsContent {...props} view={props.view ?? view} ticketsExpanded={props.ticketsExpanded ?? expanded}
    onViewChange={(next) => { if (props.view === undefined) setView(next); props.onViewChange?.(next); }}
    onTicketsExpandedChange={(next) => { if (props.ticketsExpanded === undefined) setExpanded(next); props.onTicketsExpandedChange?.(next); }} />;
}

function SupportAnalyticsContent({ scopeId, data, range, channel, onRangeChange, onChannelChange, view = "all", onViewChange, ticketsExpanded = false, onTicketsExpandedChange,
  state = "ready", refreshing = false, retainDataOnError = false, statusMessage, actions, labels: overrides, locale = "zh-CN", timeZone = "Asia/Shanghai", now, className,
  defaultView: _defaultView, defaultTicketsExpanded: _defaultTicketsExpanded, ...props }: SupportAnalyticsProps) {
  const labels = { ...supportAnalyticsLabels, ...overrides };
  const More = useIcon("ellipsis"); const Info = useIcon("doc-info-item"); const Refresh = useIcon("rotate-ccw");
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  const guard = useRef(new Set<string>());
  const [pending, setPending] = useState(new Set<string>());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const queryIdentity = `${range}:${channel}`;
  const generation = useRef(0);
  // Invalidate actions only for committed contexts, including snapshot replacement.
  useLayoutEffect(() => {
    generation.current += 1;
    guard.current.clear();
    setPending((previous) => previous.size ? new Set() : previous);
    setErrors((previous) => Object.keys(previous).length ? {} : previous);
  }, [range, channel, data?.id, data?.revision]);
  const matched = data?.scopeId === scopeId && data.range === range && data.channel === channel ? data : null;
  const loading = state === "loading" || (data !== null && !matched && state !== "error");
  const usable = !loading && (state !== "error" || retainDataOnError) ? matched : null;
  const activeView = views.includes(view) ? view : "all";
  const current = usable?.views[activeView];
  const snapshotTotal = usable ? trendSummary(usable) : null;
  const total = usable && (!snapshotTotal?.complete || snapshotTotal.total === usable.total) ? usable.total : null;
  const countsValid = usable && validCount(total) && validCount(usable.counts.open) && validCount(usable.counts.resolved) && usable.counts.open + usable.counts.resolved === total;
  const delta = usable ? comparison(total, usable.previousTotal, "relative") : null;
  const context: SupportAnalyticsActionContext | null = usable ? { scopeId, snapshotId: usable.id, revision: usable.revision, range, channel, view: activeView } : null;
  async function run(key: string, callback: () => void | Promise<void>) {
    if (guard.current.has(key)) return;
    const request = generation.current;
    guard.current.add(key); setPending(new Set(guard.current));
    setErrors((previous) => { const next = { ...previous }; delete next[key]; return next; });
    try { await callback(); }
    catch { if (mounted.current && generation.current === request) setErrors((previous) => ({ ...previous, [key]: labels.actionError })); }
    finally { if (mounted.current && generation.current === request) { guard.current.delete(key); setPending(new Set(guard.current)); } }
  }
  const refreshBusy = refreshing || pending.has("refresh") || pending.has("retry");
  const showMore = actions?.onRefresh || actions?.onExport;
  const body = loading ? <div role="status" className="space-y-4"><span className="sr-only">{labels.loading}</span><Skeleton className="h-10 w-32" /><Skeleton className="h-44 w-full" /></div>
    : state === "error" && !usable ? <div className="flex min-w-0 w-full items-center justify-center"><Alert status="danger" role="alert" className="w-full max-w-xl"><AlertTitle>{labels.error}</AlertTitle><AlertDescription>{statusMessage}</AlertDescription><AlertAction>{actions?.onRetry && <Button variant="secondary" loading={pending.has("retry")} onClick={() => void run("retry", () => actions.onRetry!({ scopeId, range, channel }))}>{labels.retry}</Button>}</AlertAction></Alert></div>
    : !usable ? <Empty reason="no-data" scope="inline"><EmptyDescription>{labels.noTickets}</EmptyDescription></Empty> : null;
  return <Container {...props} data-block="support-analytics" data-state={state} aria-busy={loading || refreshBusy || undefined} className={cn("@container w-full max-w-xl", className)}>
    <ContainerHeader className="py-1.5">
      <div className="flex min-w-0 items-center gap-2"><h2 className="break-words text-body font-medium text-fg-default">{labels.title}</h2><Tooltip content={labels.description}><Button iconOnly variant="ghost" size="xs" aria-label={labels.description}><Info aria-hidden /></Button></Tooltip></div>
      <div className="flex max-w-full items-center gap-2"><Select size="sm" value={range} onValueChange={(value) => { if (ranges.includes(value as SupportAnalyticsRange)) onRangeChange(value as SupportAnalyticsRange); }}><SelectTrigger aria-label={labels.range} wrapperClassName="max-w-full" /><SelectContent>{ranges.map((item) => <SelectItem key={item} value={item} label={labels[item]}>{labels[item]}</SelectItem>)}</SelectContent></Select>
        {showMore && <DropdownMenu><DropdownTrigger render={<Button iconOnly variant="ghost" size="sm" aria-label={labels.more}><More aria-hidden /></Button>} /><DropdownContent>
          {actions?.onRefresh && <MenuItem index={0} label={labels.refresh} disabled={!context || refreshBusy} onClick={() => { if (context) void run("refresh", () => actions.onRefresh!(context)); }} />}
          {actions?.onExport && <MenuItem index={1} label={labels.export} disabled={!context || pending.has("export")} onClick={() => { if (context) void run("export", () => actions.onExport!(context)); }} />}
        </DropdownContent></DropdownMenu>}
      </div>
    </ContainerHeader>
    {(state === "stale" || (state === "error" && usable) || refreshBusy || Object.keys(errors).some((key) => !key.includes(":"))) && <ContainerBody>
      {(state === "stale" || (state === "error" && usable)) && <InlineNotice variant="emphasized" tone={state === "error" ? "danger" : "warning"}><InlineNoticeContent>{statusMessage ?? (state === "error" ? `${labels.error} · ${labels.stale}` : labels.stale)}</InlineNoticeContent></InlineNotice>}
      {refreshBusy && <p role="status" className="text-label text-fg-muted">{labels.refreshing}</p>}
      {Object.entries(errors).filter(([key]) => !key.includes(":")).map(([key, message]) => <p role="alert" key={key} className="text-label text-fg-danger">{message}</p>)}
    </ContainerBody>}
    <ContainerBody>
      {body ?? <><div className="flex flex-wrap items-end gap-x-3 gap-y-1">
        <MetricCard label={labels.total} value={<SupportTotal value={total} locale={locale} />} valueClassName="text-heading @sm:text-display" content={{ type: "none" }} className="min-w-max flex-1 border-0 bg-transparent p-0" />
        <div className="flex min-w-0 max-w-full items-center gap-2 text-label text-fg-subtle"><span>{labels[channel]} · {labels.compare}</span><Badge size="sm" status="neutral" className="shrink-0">{comparisonText(delta, locale, "%")}</Badge></div>
      </div>
        <div className="mt-4 flex min-w-0 flex-col gap-4">
          <SupportChannelBadges channel={channel} labels={labels} onChange={onChannelChange} onFocus={revealFocusedControl} />
          <TicketTrend data={usable!} labels={labels} locale={locale} timeZone={timeZone} />
        </div></>}
    </ContainerBody>
    {usable && <><Tabs value={activeView} variant="pill" color="default" onValueChange={(value) => { if (views.includes(value as SupportAnalyticsView)) onViewChange?.(value as SupportAnalyticsView); }} className="flex min-w-0 flex-col gap-2">
      <div className="overflow-x-auto" onFocus={revealFocusedControl}><TabsList className="w-full min-w-max" aria-label={labels.views}>{views.map((item) => <TabItem key={item} value={item} label={labels[item]} className="flex-1 justify-center" badge={item === "all" ? undefined : countsValid ? { children: formatCount(usable.counts[item], locale), variant: "strong", color: item === "open" ? "red" : "green" } : labels.unknown} />)}</TabsList></div>
      <TabPanel value={activeView}><ContainerBody>{current ? <SupportMetrics metrics={current.metrics} labels={labels} locale={locale} timeZone={timeZone} rangeLabel={labels[range]} /> : <div role="status"><span className="sr-only">{labels.loading}</span><Skeleton className="h-44 w-full" /></div>}</ContainerBody></TabPanel>
    </Tabs>
      {current && <ContainerBody><RecentTickets key={`${queryIdentity}:${activeView}`} tickets={current.recentTickets.slice(0, 4)} expanded={ticketsExpanded} onExpandedChange={(value) => onTicketsExpandedChange?.(value)} labels={labels} locale={locale} timeZone={timeZone} now={now} contextLabel={`${activeView === "all" ? "" : `${labels[activeView]} · `}${labels[channel]} · ${labels[range]}`} pending={pending} errors={errors}
        onOpen={actions?.onOpenTicket && context ? (ticket) => void run(`open:${ticket.id}`, () => actions.onOpenTicket!({ ...context, ticketId: ticket.id })) : undefined}
        onResolve={actions?.onResolveTicket && context ? (ticket) => void run(`resolve:${ticket.id}`, () => actions.onResolveTicket!({ ...context, ticketId: ticket.id })) : undefined} /></ContainerBody>}
    </>}
    <ContainerFooter className="justify-between">
      <p className="min-w-0 text-label text-fg-subtle">{labels.updated} {usable ? formatUpdated(usable.updatedAt, locale, timeZone, now) : labels.unknown}</p>
      <div className="flex flex-wrap items-center gap-2">{actions?.onRefresh && context && <Tooltip content={labels.refresh}><Button iconOnly size="sm" variant="ghost" loading={refreshBusy} aria-label={labels.refresh} onClick={() => void run("refresh", () => actions.onRefresh!(context))}><Refresh aria-hidden /></Button></Tooltip>}{actions?.onOpenQueue && <Button size="sm" variant="secondary" disabled={!context} loading={pending.has("queue")} onClick={() => { if (context) void run("queue", () => actions.onOpenQueue!(context)); }}>{labels.queue}</Button>}</div>
    </ContainerFooter>
  </Container>;
}
