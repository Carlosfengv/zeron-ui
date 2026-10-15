"use client";

import { useId, useMemo, useState, type ReactNode } from "react";
import ClaudeColor from "@lobehub/icons/es/Claude/components/Color";
import CursorMono from "@lobehub/icons/es/Cursor/components/Mono";
import GeminiColor from "@lobehub/icons/es/Gemini/components/Color";
import AntigravityColor from "@lobehub/icons/es/Antigravity/components/Color";
import GrokMono from "@lobehub/icons/es/Grok/components/Mono";
import OpenAIMono from "@lobehub/icons/es/OpenAI/components/Mono";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { ButtonGroup } from "@zeron/ui/button-group";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { Skeleton } from "@zeron/ui/skeleton";
import { TabItem, TabPanel, Tabs, TabsList } from "@zeron/ui/tabs";
import { TimeWindowTimeline, timeWindowToneColors, type TimeWindowGroup, type TimeWindowInterval, type TimeWindowTick } from "@zeron/ui/time-window-timeline";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { createUsageTimelineDay, isUsageTimelineDate, USAGE_TIMELINE_HOUR as HOUR, usageTimelineTone, validUsageTimeline } from "./usage-timeline-data";
import { usageTimelineEnLabels } from "./usage-timeline-labels";
import type { UsageTimelineLabels, UsageTimelineMeasure, UsageTimelineMode, UsageTimelineProps, UsageTimelineProvider } from "./usage-timeline-types";

const logos = { openai: OpenAIMono, anthropic: ClaudeColor, xai: GrokMono, google: GeminiColor, antigravity: AntigravityColor, cursor: CursorMono };

function ProviderLogo({ provider }: { provider: UsageTimelineProvider }) {
  const Fallback = useIcon("brain");
  const Logo = provider.brand ? logos[provider.brand] : null;
  return <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center text-fg-muted">{provider.logo ?? (Logo ? <Logo size={22} /> : <Fallback size={22} />)}</span>;
}

function LegendItem({ symbol, children }: { symbol: ReactNode; children: ReactNode }) {
  return <span className="inline-flex items-center gap-2"><span aria-hidden="true" className="inline-flex h-4 w-7 items-center justify-center">{symbol}</span>{children}</span>;
}

function TimelineLegend({ labels }: { labels: UsageTimelineLabels }) {
  return <div className="mt-4 space-y-2 text-label text-fg-subtle">
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      <LegendItem symbol={<span className="h-4 w-7 rounded-sm border-hairline border-chart-1/45 bg-chart-1/8" />}>{labels.currentWindow}</LegendItem>
      <LegendItem symbol={<span className="h-4 w-7 overflow-hidden rounded-sm border-hairline border-chart-1/45 bg-chart-1/8"><span className="block h-full w-1/2 bg-chart-1/13" /></span>}>{labels.timePassed}</LegendItem>
      <LegendItem symbol={<span className="h-4 w-7 rounded-sm border-hairline border-dashed border-border" />}>{labels.nextWindow}</LegendItem>
      <LegendItem symbol={<span className="h-4 w-7 rounded-sm bg-chart-6/20" />}>{labels.earlier}</LegendItem>
      <LegendItem symbol={<span className="h-4 w-1 rounded-full bg-chart-5" />}>{labels.expiry}</LegendItem>
      <LegendItem symbol={<span className="h-4 w-0.5 bg-chart-2" />}>{labels.reset}</LegendItem>
    </div>
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {([["success", labels.plenty], ["warning", labels.low], ["danger", labels.out]] as const).map(([tone, label]) => <Badge key={tone} variant="plain" size="sm"
        leadingIcon={<span className="size-1.5 rounded-full" style={{ backgroundColor: timeWindowToneColors[tone] }} />}>{label}</Badge>)}
    </div>
  </div>;
}

/** Provider-grouped account quota windows, using the reusable time-window timeline. */
export function UsageTimeline({ providers, now, locale = "en-US", timeZone = "UTC", labels: suppliedLabels,
  mode: controlledMode, defaultMode = "weekly", onModeChange, measure: controlledMeasure, defaultMeasure = "used", onMeasureChange,
  rangeStart: controlledStart, defaultRangeStart, onRangeStartChange, state = "ready", errorMessage, onRetry, className, ...props }: UsageTimelineProps) {
  const [localMode, setLocalMode] = useState(defaultMode);
  const [localMeasure, setLocalMeasure] = useState(defaultMeasure);
  const [localStart, setLocalStart] = useState(defaultRangeStart);
  const titleId = useId();
  const Previous = useIcon("chevron-left");
  const Next = useIcon("chevron-right");
  const labels = { ...usageTimelineEnLabels, ...suppliedLabels };
  const mode = controlledMode ?? localMode;
  const measure = controlledMeasure ?? localMeasure;
  const formats = useMemo(() => {
    try {
      return { date: new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone }),
        weekday: new Intl.DateTimeFormat(locale, { weekday: "short", timeZone }),
        time: new Intl.DateTimeFormat(locale, { weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone }),
        hour: new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone }),
        hours: new Intl.NumberFormat(locale, { style: "unit", unit: "hour", unitDisplay: "narrow" }),
        percent: new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }),
        day: createUsageTimelineDay(timeZone) };
    } catch { return null; }
  }, [locale, timeZone]);
  const anchor = controlledStart ?? localStart;
  const short = mode === "five-hour";
  const valid = validUsageTimeline(providers, now) && formats !== null
    && (anchor === undefined || isUsageTimelineDate(anchor));
  const start = valid && formats ? formats.day(anchor ?? now, anchor === undefined && !short ? -7 : 0) : NaN;
  const end = valid && formats ? short ? start + HOUR * 24 : formats.day(start, 14) : NaN;
  const validRange = isUsageTimelineDate(start) && isUsageTimelineDate(end) && end > start;
  if (state === "loading") return <section aria-label={labels.title} aria-busy="true" className={cn("w-full space-y-4", className)} {...props}>
    <span role="status" className="sr-only">{labels.loading}</span><Skeleton className="h-control-md w-56" />{Array.from({ length: 5 }, (_, index) => <Skeleton key={index} className="h-28 w-full rounded-lg" />)}
  </section>;
  if (state === "error" || !valid || !validRange || !formats) return <section aria-label={labels.title} className={className} {...props}>
    <InlineNotice variant="emphasized" tone="danger"><InlineNoticeContent><span role="alert">{!valid || !validRange ? labels.invalid : errorMessage ?? labels.error}</span>
      {onRetry && <Button variant="secondary" size="sm" onClick={onRetry}>{labels.retry}</Button>}</InlineNoticeContent></InlineNotice>
  </section>;

  const percent = (value: number) => formats.percent.format((measure === "used" ? value : 100 - value) / 100);
  const date = (value: number) => formats.date.format(value);
  const ticks: TimeWindowTick[] = Array.from({ length: short ? 12 : 14 }, (_, index) => {
    const at = short ? start + index * HOUR * 2 : formats.day(start, index);
    return { id: String(at), start: at, end: short ? at + HOUR * 2 : formats.day(start, index + 1),
      label: short ? formats.hour.format(at) : formats.weekday.format(at), description: short ? undefined : date(at) };
  });
  const groups: TimeWindowGroup[] = providers.filter((provider) => provider.accounts.length).map((provider) => ({
    id: provider.id,
    label: <><ProviderLogo provider={provider} /><span className="font-medium">{provider.name}</span><span className="text-fg-subtle">{labels.accountCount(provider.accounts.length)}</span></>,
    rows: provider.accounts.map((account) => {
      const window = account.windows[mode];
      const intervals: TimeWindowInterval[] = window ? [
        ...(window.previousStart !== undefined ? [{ id: "earlier", start: window.previousStart, end: window.start,
          label: `${labels.ended} ${date(window.start)}`, ariaLabel: `${labels.ended} ${formats.time.format(window.start)}, ${date(window.start)}`, variant: "earlier" as const }] : []),
        { id: "current", start: window.start, end: window.end, value: measure === "used" ? window.usedPercent : 100 - window.usedPercent,
          label: `${percent(window.usedPercent)} ${labels[measure]} · ${formats.time.format(window.start)}`,
          ariaLabel: `${account.name}, ${account.email}: ${percent(window.usedPercent)} ${labels[measure]}; ${date(window.start)} ${formats.time.format(window.start)} – ${date(window.end)} ${formats.time.format(window.end)}${account.disconnected ? `; ${labels.disconnected}` : ""}`,
          tone: usageTimelineTone(window.usedPercent) },
        ...(window.nextEnd !== undefined ? [{ id: "next", start: window.end, end: window.nextEnd,
          label: `${labels.nextWindow} · ${date(window.nextEnd)}`, ariaLabel: `${labels.nextWindow}: ${date(window.end)} – ${date(window.nextEnd)}`, variant: "next" as const }] : []),
      ] : [];
      return { id: account.id, muted: account.disconnected, intervals, markers: account.markers,
        label: <div className="space-y-1.5">
          <p className="truncate text-body" title={`${account.name}${account.plan ? ` · ${account.plan}` : ""}`}><span className="font-medium text-fg-default">{account.name}</span>{account.plan && <span className="text-fg-subtle"> · {account.plan}</span>}</p>
          {account.disconnected && <Badge status="danger" size="sm">{labels.disconnected}</Badge>}
          <p className="truncate text-label text-fg-subtle" title={account.email}>{account.email}</p>
          <div className="flex flex-wrap gap-1">{account.limits.map((limit) => <Badge key={limit.id} size="sm" variant="dot" status={usageTimelineTone(limit.usedPercent)}>
            <span className="text-fg-subtle">{limit.label}</span> <span className="tabular-nums">{percent(limit.usedPercent)}</span>
          </Badge>)}</div>
          {!window && <p className="text-label text-fg-subtle">{labels.noWindow}</p>}
        </div> };
    }),
  }));
  const changeStart = (next: number) => { if (controlledStart === undefined) setLocalStart(next); onRangeStartChange?.(next); };
  const changeMode = (value: string) => {
    if (!["weekly", "five-hour", "cycle"].includes(value) || value === mode) return;
    const next = value as UsageTimelineMode;
    if (controlledMode === undefined) {
      setLocalMode(next);
      if (controlledStart === undefined) setLocalStart(undefined);
      onRangeStartChange?.(formats.day(now, next === "five-hour" ? 0 : -7));
    }
    onModeChange?.(next);
  };
  const changeMeasure = (next: UsageTimelineMeasure) => { if (controlledMeasure === undefined) setLocalMeasure(next); onMeasureChange?.(next); };

  return <section aria-labelledby={titleId} data-slot="usage-timeline" className={cn("w-full min-w-0", className)} {...props}>
    <h2 id={titleId} className="sr-only">{labels.title}</h2>
    <Tabs value={mode} onValueChange={changeMode}>
      <header className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <p className="text-title font-medium tabular-nums text-fg-default" aria-live="polite">{date(start)} – {date(end - 1)} <span className="text-fg-subtle">· {short ? formats.hours.format(24) : labels.dayCount(14)}</span></p>
        <div className="flex flex-wrap items-center gap-3">
          <ButtonGroup aria-label={labels.period}>
            <Button variant="tertiary" iconOnly aria-label={labels.previous} onClick={() => changeStart(formats.day(start, short ? -1 : -7))}><Previous /></Button>
            <Button variant="tertiary" onClick={() => changeStart(formats.day(now, short ? 0 : -7))}>{labels.today}</Button>
            <Button variant="tertiary" iconOnly aria-label={labels.next} onClick={() => changeStart(formats.day(start, short ? 1 : 7))}><Next /></Button>
          </ButtonGroup>
          <TabsList aria-label={labels.period}><TabItem value="weekly" label={labels.weekly} /><TabItem value="five-hour" label={labels.fiveHour} /><TabItem value="cycle" label={labels.cycle} /></TabsList>
          <ButtonGroup aria-label={labels.measure}>
            <Button variant={measure === "used" ? "primary" : "tertiary"} aria-pressed={measure === "used"} onClick={() => changeMeasure("used")}>{labels.used}</Button>
            <Button variant={measure === "left" ? "primary" : "tertiary"} aria-pressed={measure === "left"} onClick={() => changeMeasure("left")}>{labels.left}</Button>
          </ButtonGroup>
        </div>
      </header>
      <TabPanel value={mode}>
        <TimeWindowTimeline ariaLabel={labels.title} start={start} end={end} ticks={ticks} groups={groups} now={now} nowLabel={labels.now}
          labelHeader={<span className="flex justify-between gap-2 text-label"><span>{labels.account}</span><span>{measure === "used" ? labels.limits : labels.left}</span></span>}
          emptyContent={labels.empty} invalidContent={labels.invalid} />
      </TabPanel>
    </Tabs>
    {groups.length > 0 && <TimelineLegend labels={labels} />}
  </section>;
}
