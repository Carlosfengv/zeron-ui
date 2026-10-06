"use client";

import { Alert, AlertTitle, AlertDescription, AlertAction } from "@zeron/ui/alert";

import { Badge, type BadgeStatus } from "@zeron/ui/badge";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@zeron/ui/button";
import { Container, ContainerBody, ContainerFooter, ContainerHeader } from "@zeron/ui/container";
import { useDataTable } from "@zeron/ui/data-table";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "@zeron/ui/dropdown";
import { Empty, EmptyActions, EmptyDescription } from "@zeron/ui/empty";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@zeron/ui/input-group";
import { MenuItem } from "@zeron/ui/menu-item";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@zeron/ui/select";
import { Skeleton } from "@zeron/ui/skeleton";
import { TabItem, TabPanel, Tabs, TabsList } from "@zeron/ui/tabs";
import { Tooltip } from "@zeron/ui/tooltip";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { defaultIntegrationMonitorsQuery, filterIntegrationMonitors, integrationMonitorsLabels, monitorCategoryCounts, monitorFormatDate, monitorFormatNumber, monitorPageNumbers, monitorShareHref, normalizeMonitorPagination } from "./integration-monitors-data";
import { IntegrationMonitorRow, MonitorIdentityAvatar } from "./integration-monitors-row";
import type { IntegrationMonitorAction, IntegrationMonitorCategory, IntegrationMonitorItem, IntegrationMonitorsProps } from "./integration-monitors-types";

const categories: IntegrationMonitorCategory[] = ["all", "failing", "compliant", "inactive"];
const categoryTones: Partial<Record<IntegrationMonitorCategory, BadgeStatus>> = { failing: "danger", compliant: "success", inactive: "neutral" };
const noItems: IntegrationMonitorItem[] = [];
const columns = [{ id: "monitor", accessorFn: (item: IntegrationMonitorItem) => item.name }];
const rowCallbacks = { details: "onOpenDetails", assets: "onOpenAssets", check: "onCheck", configure: "onConfigure", edit: "onEdit", pause: "onPause", resume: "onResume", remove: "onRemove" } as const;

/** Remount local query and action guards when the workspace changes. */
export function IntegrationMonitors(props: IntegrationMonitorsProps) {
  return <IntegrationMonitorsContent key={props.scopeId} {...props} />;
}

function IntegrationMonitorsContent({ scopeId, data, state = "ready", refreshing = false, retainDataOnError = true, statusMessage, query: controlledQuery,
  defaultQuery, onQueryChange, actions, shareUrl, title, labels: overrides, locale = "zh-CN", timeZone = "Asia/Shanghai", now, className, ...props }: IntegrationMonitorsProps) {
  const labels = { ...integrationMonitorsLabels, ...overrides };
  const [localQuery, setLocalQuery] = useState(() => ({ ...defaultIntegrationMonitorsQuery, ...defaultQuery }));
  const query = controlledQuery ?? localQuery;
  const snapshot = data?.scopeId === scopeId ? data : null;
  const loading = state === "loading";
  const usable = !loading && (state !== "error" || retainDataOnError) ? snapshot : null;
  const items = usable?.items ?? noItems;
  const counts = monitorCategoryCounts(items);
  const filtered = useMemo(() => filterIntegrationMonitors(items, query), [items, query]);
  const pagination = normalizeMonitorPagination(query, filtered.length);
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());
  const [feedback, setFeedback] = useState<{ text: string; error: boolean } | null>(null);
  const guards = useRef(new Set<string>());
  const alive = useRef(true);
  const latest = useRef(snapshot);
  latest.current = snapshot;
  const corrected = useRef("");
  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);

  function change(next: typeof query) {
    if (controlledQuery === undefined) setLocalQuery(next);
    onQueryChange?.(next);
  }
  // Clamp mutations without repeatedly requesting the same correction from a controlled host.
  useEffect(() => {
    if (!usable || (query.pageIndex === pagination.pageIndex && query.pageSize === pagination.pageSize)) { corrected.current = ""; return; }
    const key = `${usable.snapshotId}:${query.pageIndex}:${query.pageSize}:${pagination.pageIndex}:${pagination.pageSize}`;
    if (corrected.current === key) return;
    corrected.current = key;
    const next = { ...query, pageIndex: pagination.pageIndex, pageSize: pagination.pageSize };
    if (controlledQuery === undefined) setLocalQuery(next);
    onQueryChange?.(next);
  }, [usable, query, pagination.pageIndex, pagination.pageSize, controlledQuery, onQueryChange]);
  const { table } = useDataTable({ data: filtered, columns, getRowId: (item) => item.id, autoResetPageIndex: false,
    state: { pagination: { pageIndex: pagination.pageIndex, pageSize: pagination.pageSize } },
    onPaginationChange: (updater) => { const current = { pageIndex: pagination.pageIndex, pageSize: pagination.pageSize }; change({ ...query, ...(typeof updater === "function" ? updater(current) : updater) }); },
  });

  async function run(key: string, callback: (() => void | Promise<void>) | undefined, rowId?: string, success?: string) {
    if (!callback || guards.current.has(key) || (rowId && guards.current.has("check-all")) || (key === "check-all" && [...guards.current].some((entry) => entry.startsWith("row:")))) return;
    guards.current.add(key); setPending(new Set(guards.current)); setFeedback(null);
    try {
      await callback();
      if (alive.current && (!rowId || latest.current?.items.some((item) => item.id === rowId)) && success) setFeedback({ text: success, error: false });
    } catch {
      if (alive.current && (!rowId || latest.current?.items.some((item) => item.id === rowId))) setFeedback({ text: labels.operationError, error: true });
    } finally {
      guards.current.delete(key);
      if (alive.current) setPending(new Set(guards.current));
    }
  }
  const context = { scopeId, snapshotId: usable?.snapshotId ?? "" };
  async function copy(value: string) {
    const resolved = value.startsWith("/") ? new URL(value, window.location.origin).href : value;
    await navigator.clipboard.writeText(resolved);
  }
  function invoke(action: IntegrationMonitorAction | "copy", id: string) {
    const item = usable?.items.find((entry) => entry.id === id);
    if (!item || (item.capabilities && !item.capabilities.includes(action))) return;
    if (action === "copy") {
      const href = monitorShareHref(item.shareUrl);
      void run(`row:${id}`, actions?.onShare ? () => actions.onShare!(context, id) : href ? () => copy(href) : undefined, id, labels.copied);
    } else {
      const callback = actions?.[rowCallbacks[action]];
      void run(`row:${id}`, callback ? () => callback(id, context) : undefined, id);
    }
  }
  const Add = useIcon("plus"); const More = useIcon("ellipsis"); const Download = useIcon("arrow-down");
  const Link = useIcon("link"); const Search = useIcon("search"); const Close = useIcon("x");
  const Refresh = useIcon("rotate-ccw"); const Bell = useIcon("bell"); const Settings = useIcon("settings");
  const Previous = useIcon("chevron-left"); const Next = useIcon("chevron-right");
  const available = usable?.integrations.filter((integration) => !items.some((item) => item.integrationId === integration.id)) ?? [];
  const integrations = [...new Map(items.map((item) => [item.integrationId, item.name])).entries()];
  const href = monitorShareHref(shareUrl);
  const share = actions?.onShare ? () => actions.onShare!(context) : href ? () => copy(href) : undefined;
  const exporting = pending.has("export");
  const exportRows = actions?.onExport && usable ? () => actions.onExport!({ ...context, query: { ...query, pageIndex: pagination.pageIndex, pageSize: pagination.pageSize }, items: filtered }) : undefined;
  const muted = usable?.mutedUntil != null && Number.isFinite(usable.mutedUntil) && (now === undefined || usable.mutedUntil > now);
  const globalMenu = [
    { key: "check-all", label: labels.checkAll, icon: Refresh, callback: actions?.onCheckAll && usable ? () => actions.onCheckAll!(context) : undefined },
    { key: "export", label: labels.export, icon: Download, callback: exportRows },
    { key: "share", label: labels.share, icon: Link, callback: usable ? share : undefined },
    { key: "mute", label: muted ? labels.unmute : labels.mute, icon: Bell, callback: actions?.onMute && usable ? () => actions.onMute!(muted ? null : 3_600_000, context) : undefined },
    { key: "manage", label: labels.manage, icon: Settings, callback: actions?.onManageIntegrations && usable ? () => actions.onManageIntegrations!(context) : undefined },
  ].filter((entry) => entry.callback);
  const retry = actions?.onRetry ? <Button size="sm" variant="secondary" loading={pending.has("retry")} onClick={() => void run("retry", () => actions.onRetry!({ scopeId }))}>{labels.retry}</Button> : undefined;
  const reset = () => change({ ...defaultIntegrationMonitorsQuery, pageSize: pagination.pageSize });
  const isFiltered = query.category !== "all" || query.integrationId !== "all" || query.lifecycle !== "all" || query.search.trim() !== "";

  return <Container {...props} data-block="integration-monitors" data-state={state} aria-busy={loading || refreshing || undefined} className={cn("@container w-full max-w-3xl", className)}>
    <ContainerHeader className="py-2"><h2 className="min-w-0 break-words text-body font-medium text-fg-default">{title ?? labels.title}</h2><div className="flex max-w-full flex-wrap items-center gap-1">
      {actions?.onExport && <Tooltip content={labels.export}><Button size="sm" variant="ghost" iconOnly aria-label={labels.export} disabled={!usable || filtered.length === 0} loading={exporting} onClick={() => void run("export", exportRows)}><Download aria-hidden /></Button></Tooltip>}
      {share && <Tooltip content={labels.share}><Button size="sm" variant="ghost" iconOnly aria-label={labels.share} disabled={!usable} loading={pending.has("share")} onClick={() => void run("share", share, undefined, labels.copied)}><Link aria-hidden /></Button></Tooltip>}
      {globalMenu.length > 0 && <DropdownMenu><DropdownTrigger render={<Button size="sm" variant="ghost" iconOnly aria-label={labels.more}><More aria-hidden /></Button>} /><DropdownContent align="end">{globalMenu.map((entry, i) => <MenuItem key={entry.key} index={i} label={entry.label} icon={entry.icon} disabled={pending.has(entry.key) || (entry.key === "check-all" && [...pending].some((key) => key.startsWith("row:"))) || (entry.key === "export" && filtered.length === 0)} onSelect={() => void run(entry.key, entry.callback, undefined, entry.key === "share" ? labels.copied : undefined)} />)}</DropdownContent></DropdownMenu>}
      {actions?.onConnect && <DropdownMenu><DropdownTrigger render={<Button size="sm" leadingIcon={Add} disabled={!usable || available.length === 0} loading={pending.has("connect")}>{labels.add}</Button>} /><DropdownContent align="end"><p className="px-3 py-2 text-label text-fg-subtle">{labels.available}</p>{available.map((integration, i) => <MenuItem key={integration.id} index={i} label={integration.name} leading={<MonitorIdentityAvatar integrationId={integration.id} name={integration.name} src={integration.logoSrc} />} disabled={pending.has("connect")} onSelect={() => void run("connect", () => actions.onConnect!(integration.id, context))} />)}</DropdownContent></DropdownMenu>}
    </div></ContainerHeader>
    <Tabs variant="pill" color="default" value={query.category} onValueChange={(category) => { if (categories.includes(category as IntegrationMonitorCategory)) change({ ...query, category: category as IntegrationMonitorCategory, pageIndex: 0 }); }} className="flex min-w-0 flex-col gap-2">
      <div className="min-w-0 overflow-x-auto"><TabsList aria-label={labels.navigation} className="w-full min-w-max">{categories.map((category) => <TabItem key={category} value={category} leading={categoryTones[category] ? <Badge variant="plain" status={categoryTones[category]} aria-hidden /> : undefined} label={labels[category]} badge={category === "all" ? undefined : usable ? counts[category] : "—"} className="flex-1 justify-center" />)}</TabsList></div>
      <TabPanel value={query.category}><ContainerBody>
        <div className="flex min-w-0 flex-wrap items-center gap-2"><Select value={query.integrationId} onValueChange={(integrationId) => { if (integrationId !== null) change({ ...query, integrationId, pageIndex: 0 }); }}><SelectTrigger aria-label={labels.integration} wrapperClassName="min-w-0 max-w-full" /><SelectContent><SelectItem value="all">{labels.allIntegrations}</SelectItem>{integrations.map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}</SelectContent></Select>
          <Select value={query.lifecycle} onValueChange={(lifecycle) => { if (["all", "active", "paused", "needs-setup"].includes(lifecycle ?? "")) change({ ...query, lifecycle: lifecycle as typeof query.lifecycle, pageIndex: 0 }); }}><SelectTrigger aria-label={labels.status} wrapperClassName="min-w-0 max-w-full" /><SelectContent><SelectItem value="all">{labels.anyStatus}</SelectItem>{(["active", "needs-setup", "paused"] as const).map((value) => <SelectItem key={value} value={value}>{labels[value]}</SelectItem>)}</SelectContent></Select>
          <div className="w-full min-w-0 @lg:w-56 @lg:ml-auto"><InputGroup><InputGroupAddon><Search aria-hidden /></InputGroupAddon><InputGroupInput aria-label={labels.search} placeholder={labels.search} type="search" value={query.search} onChange={(event) => change({ ...query, search: event.target.value, pageIndex: 0 })} />{query.search && <InputGroupAddon align="inline-end"><InputGroupButton iconOnly aria-label={labels.clearSearch} onClick={() => change({ ...query, search: "", pageIndex: 0 })}><Close aria-hidden /></InputGroupButton></InputGroupAddon>}</InputGroup></div>
        </div>
        {(state === "stale" || refreshing || (state === "error" && usable)) && <InlineNotice className="mt-4" variant="emphasized" tone={state === "error" ? "danger" : "warning"}><InlineNoticeContent>{statusMessage ?? (state === "error" ? labels.error : refreshing ? labels.refreshing : labels.stale)}{state === "error" && retry}</InlineNoticeContent></InlineNotice>}
        {feedback && <InlineNotice className="mt-4" variant="emphasized" tone={feedback.error ? "danger" : "success"} role={feedback.error ? "alert" : "status"}><InlineNoticeContent>{feedback.text}</InlineNoticeContent></InlineNotice>}
        {usable && counts.unclassified > 0 && <p className="mt-3 text-label text-fg-subtle">{monitorFormatNumber(counts.unclassified, locale)} {labels.unclassified}</p>}
        {loading ? <div role="status" className="space-y-6 py-5"><span className="sr-only">{labels.loading}</span>{[0, 1, 2].map((key) => <div key={key} className="space-y-3"><Skeleton className="h-10 w-40" /><Skeleton className="h-6 w-full" /><Skeleton className="h-4 w-56" /></div>)}</div>
          : state === "error" && !usable ? <div className="flex min-w-0 w-full items-center justify-center min-h-60 px-4 py-8"><Alert status="danger" role="alert" className="w-full max-w-xl"><AlertTitle>{labels.error}</AlertTitle><AlertDescription>{statusMessage}</AlertDescription><AlertAction>{retry}</AlertAction></Alert></div>
            : filtered.length === 0 ? <Empty scope="inline" reason={isFiltered ? "no-results" : "no-data"}><EmptyDescription>{isFiltered ? labels.noMatches : labels.empty}</EmptyDescription>{isFiltered && <EmptyActions><Button size="sm" variant="secondary" onClick={reset}>{labels.reset}</Button></EmptyActions>}</Empty>
              : <ul aria-label={title ?? labels.title} className="min-w-0">{table.getRowModel().rows.map(({ original: item }) => <IntegrationMonitorRow key={item.id} item={item} search={query.search} labels={labels} actions={actions} locale={locale} timeZone={timeZone} pending={pending.has(`row:${item.id}`)} checkingAll={pending.has("check-all")} invoke={invoke} />)}</ul>}
      </ContainerBody></TabPanel>
    </Tabs>
    <ContainerFooter className="justify-between gap-2">
      <div className="min-w-0 space-y-1 text-label text-fg-subtle"><p>{labels.lastChecked}：{usable?.lastCheckedAt != null ? monitorFormatDate(usable.lastCheckedAt, locale, timeZone, now) : labels.neverChecked}</p>{muted && <p>{labels.muted} {monitorFormatDate(usable?.mutedUntil, locale, timeZone)}</p>}<p aria-live="polite">{usable ? `${monitorFormatNumber(filtered.length, locale)} ${labels.matching}` : "—"}</p></div>
      {usable && filtered.length > 0 && <nav aria-label={labels.pages} className="flex max-w-full flex-wrap items-center gap-1"><Button size="sm" variant="ghost" iconOnly aria-label={labels.previous} disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}><Previous aria-hidden /></Button>{monitorPageNumbers(pagination.pageIndex, pagination.pageCount).map((page) => typeof page === "number" ? <Button key={page} size="sm" variant={page === pagination.pageIndex ? "secondary" : "ghost"} aria-label={`${page + 1} ${labels.page}`} aria-current={page === pagination.pageIndex ? "page" : undefined} onClick={() => table.setPageIndex(page)}>{monitorFormatNumber(page + 1, locale)}</Button> : <span key={page} aria-hidden className="px-1 text-label text-fg-subtle">…</span>)}<Button size="sm" variant="ghost" iconOnly aria-label={labels.next} disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}><Next aria-hidden /></Button></nav>}
    </ContainerFooter>
  </Container>;
}
