"use client";

import { useId, useMemo, useState } from "react";
import { Alert, AlertAction, AlertTitle } from "#components/alert";
import { Badge } from "#components/badge";
import { Button } from "#components/button";
import { Container, ContainerBody, ContainerFooter } from "#components/container";
import { InlineNotice, InlineNoticeContent } from "#components/inline-notice";
import { useIcon } from "#system/icon-context";
import { cn } from "#system/utils";
import { allocateContextWindowCells, getContextWindowUsage } from "./data";
import type { ContextWindowCategory } from "./types";
import { contextWindowCompactEnglishLabels } from "./labels";
import type { ContextWindowCompactProps } from "./types";

const categories = ["system", "tools", "docs", "history", "memory"] as const;
const allocationCategories = [...categories, "free"] as const;
const colors: Record<ContextWindowCategory, string> = {
  system: "var(--fg-default)", tools: "var(--fg-subtle)",
  docs: "color-mix(in oklab, var(--fg-subtle) 45%, var(--surface-floating))",
  history: "var(--brand)", memory: "color-mix(in oklab, var(--brand) 40%, var(--surface-floating))",
  free: "var(--surface-raised)",
};
const tokens = new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 });
const tokenText = (value: number) => tokens.format(value).replace(/K$/, "k");
const fallbackFormat = {
  integer: new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }),
  percent: new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 0 }),
};

export function ContextWindowCompact({ data, embedded = false, title, modelIcon, onCompact, compacting = false,
  loading = false, error, onRetry, notice, labels: suppliedLabels,
  locale = "en-US", className }: ContextWindowCompactProps) {
  const labels = { ...contextWindowCompactEnglishLabels, ...suppliedLabels };
  const id = useId();
  const [filesOpen, setFilesOpen] = useState(false);
  const usage = useMemo(() => getContextWindowUsage(data), [data]);
  const cells = useMemo(() => usage ? allocateContextWindowCells(usage.totals, data.capacity, 240, allocationCategories) : [], [usage, data.capacity]);
  const format = useMemo(() => {
    try {
      return {
        integer: new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
        percent: new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }),
      };
    } catch {
      return fallbackFormat;
    }
  }, [locale]);
  const Compact = useIcon("scissors");
  const Down = useIcon("chevron-down");
  const Up = useIcon("chevron-up");
  const ready = !loading && !error && usage !== null;
  const showNotice = ready && !compacting && Boolean(notice);
  const Root = embedded ? "div" : Container;
  const Body = embedded ? "div" : ContainerBody;
  const Footer = embedded ? "div" : ContainerFooter;

  return <Root data-block="context-window-compact" role="region" aria-labelledby={`${id}-heading`} aria-busy={loading} className={cn("min-w-0 w-full", className)}>
    <Body>
      <div className="flex min-w-0 flex-wrap items-center justify-between gap-2">
        <h2 id={`${id}-heading`} className="text-body font-medium text-fg-default">{title ?? labels.title}</h2>
        {data.session?.model && <Badge size="sm" leadingIcon={modelIcon}><span className="block max-w-48 truncate font-mono" title={data.session.model}>{data.session.model}</span></Badge>}
      </div>
      {!ready ? <div className="flex min-h-48 flex-wrap items-center justify-center gap-3">
        {loading ? <InlineNotice variant="emphasized" tone="info" role="status"><InlineNoticeContent>{labels.loading}</InlineNoticeContent></InlineNotice>
          : <Alert status="danger" className="w-full">
            <AlertTitle className="break-words">{error ?? labels.invalid}</AlertTitle>
            {onRetry && <AlertAction><Button type="button" variant="secondary" size="sm" onClick={onRetry}>{labels.retry}</Button></AlertAction>}
          </Alert>}
      </div> : <>
        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 text-body tabular-nums">
            <span className="font-semibold text-fg-default">{tokenText(usage.used)}</span>
            <span className="text-fg-subtle">{labels.capacity(tokenText(data.capacity))}</span>
          </div>
          <span className={cn("text-body font-medium tabular-nums", usage.status === "danger" ? "text-fg-danger" : usage.status === "warning" ? "text-fg-warning" : "text-fg-muted")}>{format.percent.format(usage.ratio)}</span>
        </div>
        {/* Categorical capacity has no date axis; use the shared context allocator. */}
        <div role="img" aria-label={labels.usage(format.integer.format(usage.used), format.integer.format(data.capacity), format.percent.format(usage.ratio))}
          className="mt-4 grid gap-0.5" style={{ gridTemplateColumns: "repeat(40, minmax(0, 1fr))" }}>
          {cells.map((category, index) => <span key={index} aria-hidden="true" data-context-category={category} className="aspect-square min-w-0 rounded-xs" style={{ backgroundColor: colors[category] }} />)}
        </div>
        <ul className="mt-4 space-y-1" aria-label={labels.contents}>
          {categories.map((category) => <li key={category}>
            <div className="flex min-h-control-lg min-w-0 flex-wrap items-center gap-x-3 gap-y-1 text-body">
              <span aria-hidden="true" className="size-2 shrink-0 rounded-xs" style={{ backgroundColor: colors[category] }} />
              {category === "docs" ? <Button type="button" variant="ghost" size="md" contentSized className="-ml-1.5" trailingIcon={filesOpen ? Up : Down}
                aria-expanded={filesOpen} aria-controls={`${id}-files`} onClick={() => setFilesOpen((open) => !open)}>{labels.docs}</Button>
                : <span className="min-w-24 flex-1 break-words text-fg-muted">{labels[category]}</span>}
              {category === "docs" && <span className="flex-1" />}
              <span className="ml-auto flex shrink-0 flex-wrap items-center justify-end gap-x-2 gap-y-1">
                {category === "history" && onCompact && <Button type="button" variant="ghost" size="sm" leadingIcon={Compact} loading={compacting}
                  disabled={data.history.every((item) => item.pinned || item.tokens === 0)} onClick={onCompact}>{compacting ? labels.compacting : labels.compact}</Button>}
                <span className="min-w-12 text-right text-fg-default tabular-nums"><span aria-hidden="true">{tokenText(usage.totals[category])}</span><span className="sr-only">{format.integer.format(usage.totals[category])} {labels.tokens}</span></span>
              </span>
            </div>
            {category === "docs" && <div id={`${id}-files`} hidden={!filesOpen}>
              {filesOpen && (data.docs.length ? <ul tabIndex={0} className="my-2 max-h-40 space-y-2 overflow-y-auto rounded-sm pl-5 outline-none focus-visible:ring-1 focus-visible:ring-focus-ring" aria-label={labels.docs}>
                {data.docs.map((item) => <li key={item.id} className="flex min-w-0 items-baseline justify-between gap-3 text-label">
                  <span className="min-w-0 truncate text-fg-muted" title={item.title}>{item.title}</span>
                  <span className="shrink-0 text-fg-subtle tabular-nums"><span aria-hidden="true">{tokenText(item.tokens)}</span><span className="sr-only">{format.integer.format(item.tokens)} {labels.tokens}</span></span>
                </li>)}
              </ul> : <p className="py-2 pl-5 text-label text-fg-subtle">{labels.empty}</p>)}
            </div>}
          </li>)}
        </ul>
      </>}
    </Body>
    {ready && <Footer className={cn("justify-start", embedded && "mt-4 flex min-w-0 flex-wrap items-center gap-2")}>
      <span className="text-body text-fg-subtle tabular-nums">{labels.remaining(tokenText(usage.totals.free))}</span>
    </Footer>}
    <div role={showNotice ? "status" : undefined} aria-live="polite" aria-atomic="true" className={showNotice ? embedded ? "mt-3" : "px-3 pb-2" : "sr-only"}>
      {showNotice && <InlineNotice variant="emphasized" tone="success"><InlineNoticeContent>{notice}</InlineNoticeContent></InlineNotice>}
    </div>
  </Root>;
}
