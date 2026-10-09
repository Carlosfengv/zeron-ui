"use client";

import { useId, useMemo, useState } from "react";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Container, ContainerBody, ContainerFooter, ContainerHeader } from "@zeron/ui/container";
import { InlineNotice } from "@zeron/ui/inline-notice";
import { Tabs, TabsList, TabItem, TabPanel } from "@zeron/ui/tabs";
import { Tooltip, TooltipProvider } from "@zeron/ui/tooltip";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { allocateContextWindowCells, contextWindowCategories, contextWindowColors, getContextWindowUsage } from "./context-window-data";
import { contextWindowEnglishLabels } from "./context-window-labels";
import type { ContextWindowCategory, ContextWindowProps, ContextWindowTab } from "./context-window-types";

const contentTabs = ["docs", "memory", "history"] as const;
const tokenFormatter = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const isContentTab = (category: string): category is ContextWindowTab => contentTabs.some((tab) => tab === category);

function validNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function tokenText(value: number | null | undefined) {
  return validNumber(value) ? tokenFormatter.format(value).replace(/K$/, "k") : "—";
}

/** Embedded, controlled context snapshot. All data mutations belong to the host. */
export function ContextWindow({ data, title, live = false, tab, defaultTab = "docs", onTabChange,
  onCompact, compacting = false, onSettings, onClose,
  footerActions, notice, labels: suppliedLabels, locale = "en-US", currency = "USD", loading = false,
  error, onRetry, className }: ContextWindowProps) {
  const labels = { ...contextWindowEnglishLabels, ...suppliedLabels };
  const headingId = useId();
  const [localTab, setLocalTab] = useState<ContextWindowTab>(defaultTab);
  const [highlight, setHighlight] = useState<ContextWindowCategory | null>(null);
  const activeTab = tab ?? localTab;
  const usage = useMemo(() => getContextWindowUsage(data), [data]);
  const cells = useMemo(() => usage ? allocateContextWindowCells(usage.totals, data.capacity) : [], [usage, data.capacity]);
  const { integer, percent, money } = useMemo(() => ({
    integer: new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    percent: new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }),
    money: new Intl.NumberFormat(locale, { style: "currency", currency }),
  }), [locale, currency]);
  const cache = data.cache;
  const hitRate = cache?.hitRate;
  const validHitRate = validNumber(hitRate) && hitRate <= 1 ? hitRate : null;
  const hitRateText = validHitRate === null ? "—" : percent.format(validHitRate);
  const Settings = useIcon("settings"); const Close = useIcon("x"); const Pin = useIcon("pin");
  const Compact = useIcon("scissors");
  const Info = useIcon("doc-info-item");

  function changeTab(value: string) {
    if (!isContentTab(value)) return;
    if (tab === undefined) setLocalTab(value);
    onTabChange?.(value);
  }
  function categoryDetails(category: ContextWindowCategory) {
    const records = isContentTab(category) ? data[category] : [];
    return <div className="max-w-72 space-y-2 text-label">
      <div className="flex justify-between gap-4 font-medium"><span>{labels[category]}</span><span className="tabular-nums">{tokenText(usage?.totals[category])} {labels.tokens}</span></div>
      {records.slice(0, 3).map((item) => <div key={item.id} className="flex justify-between gap-4"><span className="min-w-0 truncate opacity-70">{item.title}</span><span className="shrink-0 tabular-nums">{tokenText(item.tokens)}</span></div>)}
    </div>;
  }

  return <TooltipProvider><Container data-block="context-window" role="region" aria-labelledby={headingId} className={cn("w-full", className)}>
    <ContainerHeader className="py-2">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <h2 id={headingId} className="min-w-0 break-words text-body font-medium text-fg-default">{title ?? labels.title}</h2>
        <Tooltip content={labels.description}><Button type="button" variant="ghost" size="xs" iconOnly aria-label={labels.description}><Info aria-hidden="true" /></Button></Tooltip>
      </div>
      <div className="flex items-center gap-1">
        <Badge status={live ? "success" : "neutral"} variant="dot" size="sm">{live ? labels.live : labels.paused}</Badge>
        {onSettings && <Tooltip content={labels.settings}><Button type="button" variant="ghost" size="sm" iconOnly aria-label={labels.settings} onClick={onSettings}><Settings aria-hidden="true" /></Button></Tooltip>}
        {onClose && <Button type="button" variant="ghost" size="sm" iconOnly aria-label={labels.close} onClick={onClose}><Close aria-hidden="true" /></Button>}
      </div>
    </ContainerHeader>
    {loading || error || !usage ? <ContainerBody><div className="flex min-h-48 items-center justify-center gap-3" aria-busy={loading}>
      <InlineNotice role={loading ? "status" : "alert"}>{loading ? labels.loading : error ?? labels.invalid}</InlineNotice>
      {!loading && onRetry && <Button type="button" variant="secondary" onClick={onRetry}>{labels.retry}</Button>}
    </div></ContainerBody> : <>
      <ContainerBody>
        <div className="grid min-w-0 gap-5 sm:grid-cols-5">
          <div className={cn("min-w-0 space-y-2", cache ? "sm:col-span-3" : "sm:col-span-5")}>
            <div className="flex flex-wrap items-center gap-2"><span className="font-mono text-label uppercase tracking-wider text-fg-subtle">{labels.used}</span><Badge status={usage.status} size="sm">{usage.status === "success" ? labels.healthy : usage.status === "warning" ? labels.warning : labels.full}</Badge></div>
            <div className="flex flex-wrap items-baseline gap-2"><span className="text-4xl font-medium tracking-tight text-fg-default tabular-nums">{tokenText(usage.used)}</span><span className="text-body text-fg-subtle">/ {tokenText(data.capacity)} {labels.tokens}</span></div>
            <p className="flex flex-wrap gap-x-2 font-mono text-label text-fg-muted"><span>{labels.usage(percent.format(usage.ratio))}</span>{usage.headroom !== null && <span>· {labels.headroom(integer.format(usage.headroom))}</span>}</p>
          </div>
          {cache && (
            <div className="min-w-0 space-y-2 sm:col-span-2">
              <div className="flex flex-wrap justify-between gap-2 font-mono text-label text-fg-subtle">
                <span className="uppercase tracking-wider">{labels.cache}</span>
                <span>{labels.hit(hitRateText)}</span>
              </div>
              <p className="flex items-baseline gap-2">
                <span className="text-2xl font-medium text-fg-default tabular-nums">{validNumber(cache.saved) ? money.format(cache.saved) : "—"}</span>
                <span className="text-label text-fg-subtle">{labels.saved}</span>
              </p>
              <div
                className="h-1 overflow-hidden rounded-full bg-surface-raised"
                role={validHitRate === null ? undefined : "meter"}
                aria-label={labels.cache}
                aria-valuemin={validHitRate === null ? undefined : 0}
                aria-valuemax={validHitRate === null ? undefined : 100}
                aria-valuenow={validHitRate === null ? undefined : validHitRate * 100}
                aria-valuetext={validHitRate === null ? undefined : hitRateText}
              >
                <div
                  className="h-full rounded-full bg-fg-muted transition-all duration-moderate motion-reduce:transition-none"
                  style={{ width: validHitRate === null ? "0%" : `${validHitRate * 100}%` }}
                />
              </div>
              <p className="font-mono text-label text-fg-subtle">{tokenText(cache.cachedTokens)} {labels.cached} · {tokenText(cache.newTokens)} {labels.newTokens}</p>
            </div>
          )}
        </div>
        <div className="mt-5 space-y-4">
          {/* Categorical capacity bitmap: unlike the calendar HeatmapChart it has no date or intensity axis. */}
          <Tooltip content={categoryDetails(highlight ?? "docs")}><div role="img" aria-label={labels.matrix} className="grid gap-0.5" style={{ gridTemplateColumns: "repeat(50, minmax(0, 1fr))" }} onMouseLeave={() => setHighlight(null)}>
            {cells.map((category, index) => <span key={index} aria-hidden="true" data-context-category={category}
              onMouseEnter={() => setHighlight(category)} className={cn("aspect-square min-w-0 rounded-xs transition-opacity duration-fast motion-reduce:transition-none", highlight !== null && highlight !== category && "opacity-20")}
              style={{ backgroundColor: contextWindowColors[category] }} />)}
          </div></Tooltip>
          <ul className="grid grid-cols-3 gap-x-1.5 gap-y-3 sm:gap-x-5" aria-label={labels.matrix}>
            {contextWindowCategories.map((category) => <li key={category} className="min-w-0"><Tooltip content={categoryDetails(category)}><button type="button"
              className={cn("flex w-full items-center justify-between gap-0.5 rounded-sm text-left outline-none transition-opacity duration-fast focus-visible:ring-2 focus-visible:ring-focus-ring motion-reduce:transition-none sm:gap-2", highlight !== null && highlight !== category && "opacity-30")}
              aria-label={`${labels[category]}: ${integer.format(usage.totals[category])} ${labels.tokens}, ${percent.format(usage.totals[category] / data.capacity)}`}
              onMouseEnter={() => setHighlight(category)} onMouseLeave={() => setHighlight(null)} onFocus={() => setHighlight(category)} onBlur={() => setHighlight(null)} onClick={() => { if (isContentTab(category)) changeTab(category); }}>
              <span className="flex min-w-0 items-center gap-0.5 font-mono text-label uppercase text-fg-subtle sm:gap-1.5"><span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ backgroundColor: contextWindowColors[category] }} /><span className="truncate">{labels[category]}</span></span>
              <span className="flex shrink-0 items-baseline gap-0.5 whitespace-nowrap sm:gap-1.5"><span className="text-label font-medium text-fg-default tabular-nums sm:text-body">{tokenText(usage.totals[category])}</span><span className="text-label text-fg-subtle tabular-nums">{percent.format(usage.totals[category] / data.capacity)}</span></span>
            </button></Tooltip></li>)}
          </ul>
        </div>
      </ContainerBody>
      <ContainerBody>
        <Tabs value={activeTab} onValueChange={changeTab} variant="segment" color="default">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0"><h3 className="text-body font-medium text-fg-default">{labels.contents}</h3><p className="mt-1 font-mono text-label text-fg-subtle">{labels.summary(integer.format(data[activeTab].length), tokenText(usage.totals[activeTab]), percent.format(usage.totals[activeTab] / data.capacity))}</p></div>
            <TabsList aria-label={labels.contents}>{contentTabs.map((category) => <TabItem key={category} value={category} label={labels[category]} />)}</TabsList>
          </div>
          {contentTabs.map((category) => {
            const maxTokens = data[category].reduce((max, item) => Math.max(max, item.tokens), 1);
            return <TabPanel key={category} value={category}>
            {data[category].length === 0 ? <p className="py-8 text-center text-body text-fg-muted">{labels.empty}</p> : <ul className="max-h-56 overflow-y-auto" aria-label={labels[category]}>
              {data[category].map((item) => {
                return <li key={item.id} className="flex min-w-0 items-center gap-3 border-b-hairline border-border-subtle py-3 last:border-0" data-context-item={item.id}>
                  <span aria-hidden="true" className="size-2 shrink-0 rounded-full" style={{ backgroundColor: contextWindowColors[category] }} />
                  <div className="min-w-0 flex-1"><p className="flex min-w-0 items-center gap-1.5 text-body text-fg-default"><span className="truncate" title={item.title}>{item.title}</span>{item.pinned && <Tooltip content={labels.pinned}><span className="shrink-0 text-fg-brand" aria-label={labels.pinned}><Pin className="size-3.5" aria-hidden="true" /></span></Tooltip>}</p><p className="mt-0.5 truncate font-mono text-label text-fg-subtle">{[item.source, item.detail].filter(Boolean).join(" · ")}</p></div>
                  <div className="hidden h-1 w-12 shrink-0 overflow-hidden rounded-full bg-surface-raised sm:block" aria-hidden="true"><div className="h-full rounded-full transition-all duration-moderate motion-reduce:transition-none" style={{ width: `${item.tokens / maxTokens * 100}%`, backgroundColor: contextWindowColors[category] }} /></div>
                  <span className="w-12 shrink-0 text-right text-body font-medium text-fg-default tabular-nums">{tokenText(item.tokens)}</span>
                </li>;
              })}
            </ul>}
          </TabPanel>;
          })}
        </Tabs>
      </ContainerBody>
    </>}
    <ContainerFooter className="justify-between">
      <div className="flex min-w-0 flex-1 items-center gap-2">{footerActions}{data.session && <p className="min-w-0 truncate font-mono text-label uppercase text-fg-subtle" title={`${data.session.model} · ${labels.turn} ${data.session.turn} · ${data.session.name}`}>{data.session.model} · {labels.turn} {integer.format(data.session.turn)} · {data.session.name}</p>}</div>
      {onCompact && <Button type="button" size="sm" leadingIcon={Compact} loading={compacting} disabled={loading || Boolean(error) || !usage || data.history.every((item) => item.pinned)} onClick={onCompact}>{compacting ? labels.compacting : labels.compact}</Button>}
    </ContainerFooter>
    {notice && <div className="px-3 pb-2"><InlineNotice role="status" aria-live="polite">{notice}</InlineNotice></div>}
  </Container></TooltipProvider>;
}
