"use client";

import type { ReactNode } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@zeron/ui/avatar";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { DropdownContent, DropdownMenu, DropdownSeparator, DropdownTrigger } from "@zeron/ui/dropdown";
import { InfoItem, InfoItemContent, InfoItemDescription, InfoItemTitle, InfoItemTrailing } from "@zeron/ui/info-item";
import { MenuItem } from "@zeron/ui/menu-item";
import { StatusOverview, type StatusOverviewStatus } from "@zeron/ui/status-overview";
import { useIcon, type IconComponent } from "@zeron/ui/system/icon-context";
import { monitorCheckCounts, monitorFormatDate, monitorFormatNumber, monitorShareHref, normalizeMonitorResult } from "./integration-monitors-data";
import { integrationMonitorBrandIcons } from "./integration-monitors-brand-icons";
import type { IntegrationMonitorAction, IntegrationMonitorItem, IntegrationMonitorResult, IntegrationMonitorsActions, IntegrationMonitorsLabels } from "./integration-monitors-types";

export function MonitorHighlightedText({ text, search }: { text: string; search: string }) {
  const needle = search.trim().toLocaleLowerCase();
  if (!needle) return text;
  const lower = text.toLocaleLowerCase();
  const parts: ReactNode[] = [];
  let offset = 0;
  let match = lower.indexOf(needle);
  while (match !== -1) {
    parts.push(text.slice(offset, match), <mark key={match} className="rounded-sm bg-emphasis text-fg-default">{text.slice(match, match + needle.length)}</mark>);
    offset = match + needle.length;
    match = lower.indexOf(needle, offset);
  }
  parts.push(text.slice(offset));
  return <>{parts}</>;
}

export function MonitorIdentityAvatar({ integrationId, name, src }: { integrationId: string; name: string; src?: string }) {
  const brandIcon = Object.prototype.hasOwnProperty.call(integrationMonitorBrandIcons, integrationId) ? integrationMonitorBrandIcons[integrationId] : undefined;
  return <Avatar shape="rounded" size="lg">
    {src || !brandIcon ? <><AvatarImage src={src} alt="" /><AvatarFallback>{name.slice(0, 2).toUpperCase()}</AvatarFallback></> : (
      <span aria-hidden className="flex size-full items-center justify-center text-fg-default [&>svg]:block [&>svg]:size-6" dangerouslySetInnerHTML={{ __html: brandIcon.svg.replace(/<title>[\s\S]*?<\/title>/g, "") }} />
    )}
  </Avatar>;
}

interface MonitorRowProps {
  item: IntegrationMonitorItem;
  search: string;
  labels: IntegrationMonitorsLabels;
  actions?: IntegrationMonitorsActions;
  locale: string;
  timeZone: string;
  pending: boolean;
  checkingAll: boolean;
  invoke: (action: IntegrationMonitorAction | "copy", id: string) => void;
}
const resultStatus: Record<IntegrationMonitorResult, StatusOverviewStatus> = { passed: "operational", failed: "down", warning: "degraded", unknown: "unknown" };

export function IntegrationMonitorRow({ item, search, labels, actions, locale, timeZone, pending, checkingAll, invoke }: MonitorRowProps) {
  const More = useIcon("ellipsis");
  const Details = useIcon("file");
  const Check = useIcon("rotate-ccw");
  const Pause = useIcon("pause");
  const Resume = useIcon("play");
  const Edit = useIcon("pencil");
  const Link = useIcon("link");
  const Remove = useIcon("trash");
  const Configure = useIcon("settings");
  const counts = monitorCheckCounts(item);
  const can = (action: IntegrationMonitorAction) => item.capabilities === undefined || item.capabilities.includes(action);
  const menu: { action: IntegrationMonitorAction | "copy"; label: string; icon: IconComponent }[] = [];
  if (actions?.onOpenDetails && can("details")) menu.push({ action: "details", label: labels.details, icon: Details });
  if (item.lifecycle === "needs-setup" && actions?.onConfigure && can("configure")) menu.push({ action: "configure", label: labels.configure, icon: Configure });
  if (item.lifecycle === "active" && actions?.onCheck && can("check")) menu.push({ action: "check", label: labels.check, icon: Check });
  if (item.lifecycle === "active" && actions?.onPause && can("pause")) menu.push({ action: "pause", label: labels.pause, icon: Pause });
  if (item.lifecycle === "paused" && actions?.onResume && can("resume")) menu.push({ action: "resume", label: labels.resume, icon: Resume });
  if (actions?.onEdit && can("edit")) menu.push({ action: "edit", label: labels.edit, icon: Edit });
  if (can("copy") && (actions?.onShare || monitorShareHref(item.shareUrl))) menu.push({ action: "copy", label: labels.copy, icon: Link });
  if (actions?.onRemove && can("remove")) menu.push({ action: "remove", label: labels.remove, icon: Remove });
  const summary = item.lifecycle === "needs-setup" ? labels.notConfigured : item.lifecycle === "paused" ? labels.pausedHistory
    : counts === null ? labels.incomplete : counts.total === 0 ? labels.noChecks
      : counts.failed > 0 ? `${monitorFormatNumber(counts.failed, locale)} / ${monitorFormatNumber(counts.total, locale)} ${labels.failureSummary}${counts.unknown > 0 ? ` · ${labels.incomplete}` : ""}`
        : counts.unknown > 0 ? labels.incomplete : counts.warning > 0 ? `${monitorFormatNumber(counts.warning, locale)} ${labels.warning}` : labels.allPassed;
  const segments = item.lifecycle === "needs-setup" ? [] : (item.checks ?? []).map((check) => {
    const result = normalizeMonitorResult(check.result);
    return {
      id: check.id, status: item.lifecycle === "paused" ? "unknown" as const : resultStatus[result],
      ariaLabel: `${check.name} · ${labels[result]} · ${monitorFormatDate(check.checkedAt, locale, timeZone)}${item.lifecycle === "paused" ? ` · ${labels.pausedHistory}` : ""}`,
    };
  });
  return <li data-monitor-id={item.id} className="min-w-0 space-y-3 border-b-hairline border-border-subtle py-5 last:border-b-0">
    <InfoItem className="items-start px-0 py-0">
      <MonitorIdentityAvatar integrationId={item.integrationId} name={item.name} src={item.logoSrc} />
      <InfoItemContent>
        <InfoItemTitle className="break-words"><MonitorHighlightedText text={item.name} search={search} /></InfoItemTitle>
        <InfoItemDescription className="break-words"><MonitorHighlightedText text={item.description} search={search} /></InfoItemDescription>
      </InfoItemContent>
      <InfoItemTrailing className="flex-wrap">
        <Badge size="sm" status={item.lifecycle === "active" ? "success" : item.lifecycle === "needs-setup" ? "warning" : "neutral"}>{labels[item.lifecycle]}</Badge>
        {menu.length > 0 && <DropdownMenu><DropdownTrigger render={<Button size="sm" variant="ghost" iconOnly loading={pending} disabled={checkingAll} aria-label={`${item.name} · ${labels.rowMore}`}><More aria-hidden /></Button>} /><DropdownContent align="end">{menu.map((entry, index) => <div key={entry.action}>{entry.action === "remove" && index > 0 && <DropdownSeparator />}<MenuItem index={index} icon={entry.icon} label={entry.label} disabled={pending || checkingAll} onSelect={() => invoke(entry.action, item.id)} /></div>)}</DropdownContent></DropdownMenu>}
      </InfoItemTrailing>
    </InfoItem>
    <div className="ms-13 min-w-0 space-y-3">
    <StatusOverview variant="activity" ariaLabel={`${item.name} · ${labels.checks}`} label={null} emptyContent={summary}
      content={{ type: "nodes", items: segments, footer: <div className="flex flex-wrap items-center justify-between gap-2"><span className={counts?.failed && item.lifecycle === "active" ? "text-fg-danger" : "text-fg-subtle"}>{summary}</span><span className="tabular-nums">{actions?.onOpenAssets && can("assets") ? <Button size="xs" variant="ghost" onClick={() => invoke("assets", item.id)} disabled={pending || checkingAll}>{monitorFormatNumber(item.assetCount, locale)} {labels.assets}</Button> : `${monitorFormatNumber(item.assetCount, locale)} ${labels.assets}`}</span></div> }} />
    {segments.length === 0 && <div className="flex justify-end text-label text-fg-subtle">{actions?.onOpenAssets && can("assets") ? <Button size="xs" variant="ghost" disabled={pending || checkingAll} onClick={() => invoke("assets", item.id)}>{monitorFormatNumber(item.assetCount, locale)} {labels.assets}</Button> : `${monitorFormatNumber(item.assetCount, locale)} ${labels.assets}`}</div>}
    </div>
  </li>;
}
