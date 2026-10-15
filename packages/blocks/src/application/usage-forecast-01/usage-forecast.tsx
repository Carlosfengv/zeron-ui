"use client";

import { useId, useMemo, useState } from "react";
import ClaudeColor from "@lobehub/icons/es/Claude/components/Color";
import CursorMono from "@lobehub/icons/es/Cursor/components/Mono";
import GithubCopilotMono from "@lobehub/icons/es/GithubCopilot/components/Mono";
import GrokMono from "@lobehub/icons/es/Grok/components/Mono";
import GeminiColor from "@lobehub/icons/es/Gemini/components/Color";
import OpenAIMono from "@lobehub/icons/es/OpenAI/components/Mono";
import { Button } from "@zeron/ui/button";
import { Card } from "@zeron/ui/card";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { Skeleton } from "@zeron/ui/skeleton";
import { StatusOverview } from "@zeron/ui/status-overview";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@zeron/ui/table";
import { TabItem, TabPanel, Tabs, TabsList } from "@zeron/ui/tabs";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { ForecastLegendItem, UsageForecastDaily, UsageForecastTrend, usageForecastColors, usageForecastHatch } from "./usage-forecast-charts";
import { projectUsageAccount, sortUsageProjections, USAGE_FORECAST_DAY as DAY, validateUsageForecast } from "./usage-forecast-data";
import { usageForecastEnLabels } from "./usage-forecast-labels";
import type { UsageForecastAccount, UsageForecastLabels, UsageForecastProjection, UsageForecastProps, UsageForecastSort, UsageForecastSortKey } from "./usage-forecast-types";

const logos = { anthropic: ClaudeColor, cursor: CursorMono, github: GithubCopilotMono, xai: GrokMono, google: GeminiColor, openai: OpenAIMono };

function AccountLogo({ account, large = false }: { account: UsageForecastAccount; large?: boolean }) {
  const Fallback = useIcon("brain");
  const Logo = account.provider ? logos[account.provider] : null;
  return <span aria-hidden="true" className={cn("flex shrink-0 items-center justify-center text-fg-default", large ? "size-8" : "size-5")}>
    {account.logo ?? (Logo ? <Logo size={large ? 28 : 20} /> : <Fallback size={large ? 28 : 20} />)}
  </span>;
}

function unavailableLabel(projection: UsageForecastProjection, labels: UsageForecastLabels) {
  return projection.account.status === "disconnected" ? labels.reconnect : labels.tooEarly;
}

function TimelineStrip({ projection, now, labels }: { projection: UsageForecastProjection; now: number; labels: UsageForecastLabels }) {
  const start = now - DAY / 5;
  const span = DAY * 7;
  const { account, runsOutAt, dailyRate, available } = projection;
  const resetPosition = (account.resetsAt - start) / span * 100;
  const outPosition = runsOutAt === null ? null : (runsOutAt - start) / span * 100;
  return <span className="relative flex h-10 gap-0.5" aria-hidden="true">
    {Array.from({ length: 28 }, (_, index) => {
      const timestamp = start + (index + 0.5) / 28 * span;
      const newWindow = timestamp >= account.resetsAt || !available;
      const locked = !newWindow && runsOutAt !== null && timestamp >= runsOutAt;
      const used = Math.max(0, Math.min(100, account.usedPercent + (dailyRate ?? 0) * (timestamp - now) / DAY));
      const tone = used < 25 ? 25 : used < 50 ? 45 : used < 75 ? 65 : 85;
      return <span key={index} className={cn("min-w-0 flex-1 rounded-sm", newWindow && "border border-dotted border-border")}
        style={newWindow ? undefined : locked ? usageForecastHatch : { backgroundColor: `color-mix(in oklab, ${usageForecastColors.used} ${tone}%, transparent)` }} />;
    })}
    <span className="absolute -inset-y-1 border-l border-dashed border-fg-subtle opacity-50" style={{ left: `${DAY / 5 / span * 100}%` }} />
    {available && resetPosition > 0 && resetPosition < 100 && <span className="absolute -inset-y-1 border-l-2 border-fg-muted" style={{ left: `${resetPosition}%` }}>
      <span className="absolute left-1 top-3 whitespace-nowrap rounded-sm bg-surface-floating/80 px-1 text-body text-fg-muted">{labels.reset}</span>
    </span>}
    {outPosition !== null && outPosition >= 0 && outPosition <= 100 && <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface-floating" style={{ left: `${outPosition}%`, backgroundColor: usageForecastColors.out }} />}
  </span>;
}

function ForecastTimeline({ projections, selectedId, onSelect, now, labels, time, percent, date, detailId, locale, timeZone }: {
  projections: readonly UsageForecastProjection[]; selectedId?: string; onSelect: (account: UsageForecastAccount) => void;
  now: number; labels: UsageForecastLabels; time: (n: number) => string; percent: (n: number) => string; date: (n: number) => string;
  detailId: string; locale: string; timeZone: string;
}) {
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone });
  return <div className="min-w-0">
    <div className="overflow-x-auto pb-1">
      <div className="min-w-[660px]">
        <div className="grid grid-cols-[152px_minmax(0,1fr)_154px] items-end gap-3 pb-2 text-body text-fg-subtle">
          <span />
          <div className="relative pt-5"><span className="absolute left-0 top-0 text-fg-default">{labels.now}</span><div className="flex justify-between">{Array.from({ length: 8 }, (_, i) => <span key={i}>{weekday.format(now + i * DAY)}</span>)}</div></div>
        </div>
        {projections.map((projection) => <button key={projection.account.id} type="button" aria-pressed={selectedId === projection.account.id}
          aria-controls={detailId} onClick={() => onSelect(projection.account)}
          className={cn("grid w-full grid-cols-[152px_minmax(0,1fr)_154px] items-center gap-3 border-b-hairline border-border-subtle px-2 py-2.5 text-left transition-colors duration-fast hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring",
            selectedId === projection.account.id && "bg-selection", !projection.available && "text-fg-subtle")}>
          <span className="flex min-w-0 items-center gap-2.5"><AccountLogo account={projection.account} /><span className="truncate text-body" title={projection.account.name}>{projection.account.name}</span></span>
          <TimelineStrip projection={projection} now={now} labels={labels} />
          <span className="min-w-0 text-body">
            <span className={cn("block truncate", projection.runsOutAt === null && "text-fg-subtle")}>
              {!projection.available ? unavailableLabel(projection, labels) : projection.runsOutAt !== null ? `${labels.runsOut} ${time(projection.runsOutAt)}` : `~${percent(projection.projectedPercent ?? 0)} ${labels.atReset}`}
            </span>
            {projection.available && <span className="mt-0.5 block truncate text-body text-fg-subtle">{labels.resets} {date(projection.account.resetsAt)}{projection.account.resetsAt > now + DAY * 7 ? " →" : ""}</span>}
          </span>
        </button>)}
      </div>
    </div>
    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-body text-fg-subtle">
      <span className="flex flex-wrap items-center gap-1.5">{labels.projectedUse}{[25, 45, 65, 85].map((tone) => <span key={tone} aria-hidden className="h-2 w-3 rounded-sm" style={{ backgroundColor: `color-mix(in oklab, ${usageForecastColors.used} ${tone}%, transparent)` }} />)}{labels.under} 25, 50, 75, 100%</span>
      <ForecastLegendItem kind="out">{labels.runsOut}</ForecastLegendItem><ForecastLegendItem kind="locked">{labels.locked}</ForecastLegendItem>
      <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-3 border-l-2 border-fg-muted" />{labels.reset}</span>
      <span className="inline-flex items-center gap-1.5"><span aria-hidden className="h-2 w-3 rounded-sm border border-dotted border-border" />{labels.newWindow}</span>
      <span className="text-label">{labels.assumption} {labels.selectRow}</span>
    </div>
  </div>;
}

function AccountUsageMeter({ projection, labels, percent }: {
  projection: UsageForecastProjection; labels: UsageForecastLabels; percent: (value: number) => string;
}) {
  const { account, elapsedPercent } = projection;
  const value = percent(account.usedPercent);
  const filled = Math.round(account.usedPercent / 4);
  const items = Array.from({ length: 25 }, (_, index) => {
    const label = `${account.name} · ${labels.used} ${value} · ${percent(index * 4)}–${percent((index + 1) * 4)}`;
    return {
      id: `${account.id}-quota-${index}`,
      status: index < filled ? "operational" as const : "unknown" as const,
      ariaLabel: label,
      tooltip: <span className="text-body">{label}</span>,
    };
  });
  return <div className="flex items-center gap-3 tabular-nums">
    <span className="w-9 shrink-0">{value}</span>
    <div className="relative w-64">
    <StatusOverview variant="chart" label={null} railHeight={20} ariaLabel={`${account.name} · ${labels.used} ${value}`}
      chartColors={{ operational: usageForecastColors.used, unknown: "color-mix(in oklab, var(--chart-6) 35%, transparent)" }}
      content={{ type: "nodes", items }} emptyContent={labels.empty} />
    <span aria-hidden className="pointer-events-none absolute inset-y-0 border-l-2 border-fg-muted" style={{ left: `${elapsedPercent}%` }} />
    </div>
  </div>;
}

function UsageTable({ projections, selectedId, onSelect, sort, onSort, detailId, labels, percent, number, time, duration, now }: {
  projections: readonly UsageForecastProjection[]; selectedId?: string; onSelect: (account: UsageForecastAccount) => void;
  sort: UsageForecastSort; onSort: (key: UsageForecastSortKey) => void; detailId: string; labels: UsageForecastLabels;
  percent: (n: number) => string; number: (n: number) => string; time: (n: number) => string; duration: (n: number) => string; now: number;
}) {
  const ChevronUp = useIcon("chevron-up");
  const ChevronDown = useIcon("chevron-down");
  const columns: { key: UsageForecastSortKey; label: string }[] = [{ key: "account", label: labels.account }, { key: "used", label: labels.used }, { key: "pace", label: labels.pace }, { key: "outcome", label: labels.outcome }, { key: "reset", label: labels.resets }];
  return <div className="min-w-0">
    <div className="overflow-x-auto">
      <Table className="min-w-[760px]" aria-label={labels.table}>
        <TableHeader><TableRow>{columns.map((column) => <TableHead key={column.key} aria-sort={sort.key === column.key ? sort.direction === "asc" ? "ascending" : "descending" : "none"}>
          <Button variant="ghost" size="md" onClick={() => onSort(column.key)} trailingIcon={sort.key === column.key ? sort.direction === "asc" ? ChevronUp : ChevronDown : undefined}
            aria-label={`${column.label}${sort.key === column.key ? `, ${sort.direction}` : ""}`}>{column.label}</Button>
        </TableHead>)}</TableRow></TableHeader>
        <TableBody>{projections.map((projection, index) => <TableRow key={projection.account.id} index={index}
          onClick={() => onSelect(projection.account)}
          className={cn("cursor-pointer", selectedId === projection.account.id && "bg-selection", !projection.available && "text-fg-subtle")}>
          <TableCell><button type="button" className="flex min-w-0 items-center gap-2.5 text-left focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus-ring" aria-pressed={selectedId === projection.account.id} aria-controls={detailId} onClick={(event) => { event.stopPropagation(); onSelect(projection.account); }}>
            <AccountLogo account={projection.account} /><span>{projection.account.name}</span>
          </button></TableCell>
          <TableCell><AccountUsageMeter projection={projection} labels={labels} percent={percent} /></TableCell>
          <TableCell><span className={cn("tabular-nums", projection.pace !== null && projection.pace > 1 && "text-fg-warning")}>
            {projection.pace === null ? labels.unknown : `${number(projection.pace)}x`}</span></TableCell>
          <TableCell><span className={cn("inline-flex items-center gap-2 tabular-nums", projection.runsOutAt === null && "text-fg-subtle")}>
            {projection.runsOutAt !== null && <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: usageForecastColors.out }} />}
            {!projection.available ? unavailableLabel(projection, labels) : projection.runsOutAt !== null ? time(projection.runsOutAt) : `~${percent(projection.projectedPercent ?? 0)}`}
          </span></TableCell>
          <TableCell className="whitespace-nowrap text-fg-muted">{labels.in} {duration(projection.account.resetsAt - now)}</TableCell>
        </TableRow>)}</TableBody>
      </Table>
    </div>
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-body text-fg-subtle">
      <ForecastLegendItem kind="out">{labels.locked}</ForecastLegendItem><ForecastLegendItem kind="even">{labels.evenPace}</ForecastLegendItem>
      <span><span className="text-fg-warning">1.2x</span> {labels.pace}</span><span className="text-label">{labels.sortHint}</span>
    </div>
  </div>;
}

function AccountDetail({ projection, view, labels, now, percent, number, date, time, duration, id }: {
  projection: UsageForecastProjection; view: string; labels: UsageForecastLabels; now: number;
  percent: (n: number) => string; number: (n: number) => string; date: (n: number) => string; time: (n: number) => string; duration: (n: number) => string; id: string;
}) {
  const { account } = projection;
  const alignCharts = view === "table" && projection.available;
  const usageSummary = labels.usedIn(percent(account.usedPercent), percent(projection.elapsedPercent));
  const header = <div><div className="flex items-center gap-2.5"><AccountLogo account={account} large /><div className="min-w-0"><h3 className="break-words text-title font-medium text-fg-default">{account.name}</h3>{account.description && <p className="mt-0.5 text-body text-fg-subtle">{account.description}</p>}</div></div>
    <p className={cn("mt-3 text-body text-fg-muted", alignCharts && "@3xl/forecast:hidden")}>{usageSummary}</p></div>;
  const metrics = <dl className="grid grid-cols-3 gap-3 text-body"><div><dt className="text-body text-fg-subtle">{labels.pace}</dt><dd className="mt-1 font-medium tabular-nums">{projection.pace === null ? "—" : `${number(projection.pace)}x ${labels.even}`}</dd></div>
    <div><dt className="text-body text-fg-subtle">{projection.runsOutAt !== null ? labels.runsOut : labels.atReset}</dt><dd className="mt-1 font-medium tabular-nums">{projection.runsOutAt !== null ? time(projection.runsOutAt) : projection.projectedPercent !== null ? `~${percent(projection.projectedPercent)}` : "—"}</dd></div>
    <div><dt className="text-body text-fg-subtle">{labels.locked}</dt><dd className="mt-1 font-medium tabular-nums">{projection.runsOutAt !== null ? duration(projection.lockedMs) : "—"}</dd></div></dl>;
  return <section id={id} aria-label={account.name} data-slot="usage-forecast-detail" className={cn("min-w-0", view === "forecast" ? "border-t-hairline border-border-subtle pt-5 @5xl/forecast:border-l-hairline @5xl/forecast:border-t-0 @5xl/forecast:pl-5 @5xl/forecast:pt-0" : "mt-6 border-t-hairline border-border-subtle pt-5")}>
    <div className={cn("grid gap-6", view === "table" && "@3xl/forecast:grid-cols-2 @3xl/forecast:gap-8")}>
      {/* Shared rows keep headers, usage summaries, plots and legends aligned. */}
      <div className={cn("flex min-w-0 flex-col gap-5", alignCharts && "@3xl/forecast:row-span-4 @3xl/forecast:grid @3xl/forecast:grid-rows-subgrid")}>{header}
        {projection.available ? <UsageForecastTrend projection={projection} now={now} labels={labels} percent={percent} date={date} time={time} duration={duration} alignCharts={alignCharts} usageSummary={usageSummary} />
          : <div className="flex h-56 items-center justify-center rounded-xl border-hairline border-dashed border-border p-5 text-center text-body text-fg-subtle">{unavailableLabel(projection, labels)}</div>}
      </div>
      <div className={cn("flex min-w-0 flex-col gap-6", alignCharts && "@3xl/forecast:row-span-4 @3xl/forecast:grid @3xl/forecast:grid-rows-subgrid @3xl/forecast:gap-y-5")}>{metrics}
        {projection.available ? <div className={cn(view === "forecast" ? "border-t-hairline border-border-subtle pt-5" : "@3xl/forecast:contents")}><UsageForecastDaily projection={projection} labels={labels} number={number} alignCharts={alignCharts} /></div>
          : <p className="text-body text-fg-subtle">{labels.noForecast}</p>}
      </div>
    </div>
  </section>;
}

/** Multi-account quota forecasts with switchable timeline/table and shared detail. */
export function UsageForecast({ accounts, now, locale = "en-US", timeZone = "UTC", labels: suppliedLabels,
  view: controlledView, defaultView = "forecast", onViewChange, selectedAccountId, defaultSelectedAccountId, onAccountSelect,
  sort: controlledSort, defaultSort = { key: "outcome", direction: "asc" }, onSortChange,
  state = "ready", errorMessage, onRetry, className, ...props }: UsageForecastProps) {
  const [localView, setLocalView] = useState(defaultView);
  const [localSelected, setLocalSelected] = useState(defaultSelectedAccountId);
  const [localSort, setLocalSort] = useState(defaultSort);
  const detailId = useId(); const titleId = useId();
  const labels = useMemo(() => ({ ...usageForecastEnLabels, ...suppliedLabels }), [suppliedLabels]);
  const view = controlledView ?? localView; const sort = controlledSort ?? localSort;
  const valid = useMemo(() => validateUsageForecast(accounts, now), [accounts, now]);
  const projections = useMemo(() => valid ? accounts.map((account) => projectUsageAccount(account, now)) : [], [accounts, now, valid]);
  const sorted = useMemo(() => sortUsageProjections(projections, sort, locale), [projections, sort, locale]);
  const atRisk = useMemo(() => projections.filter((item) => item.runsOutAt !== null).sort((a, b) => a.runsOutAt! - b.runsOutAt!), [projections]);
  const hasPending = projections.some((item) => !item.available);
  const selected = projections.find((item) => item.account.id === (selectedAccountId ?? localSelected)) ?? atRisk[0] ?? projections[0];
  const formats = useMemo(() => ({
    percent: new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }),
    number: new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
    date: new Intl.DateTimeFormat(locale, { month: "short", day: "numeric", timeZone }),
    time: new Intl.DateTimeFormat(locale, { weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone }),
  }), [locale, timeZone]);
  const percent = (value: number) => formats.percent.format(value / 100);
  const number = (value: number) => formats.number.format(value);
  const date = (value: number) => formats.date.format(value);
  const time = (value: number) => formats.time.format(value);
  const duration = (value: number) => {
    const hours = Math.floor(Math.max(0, value) / 3_600_000);
    if (hours < 1) return `<1 ${labels.hours}`;
    if (hours < 48) return `${hours} ${labels.hours}`;
    return `${Math.floor(hours / 24)} ${labels.days}${hours % 24 ? ` ${hours % 24} ${labels.hours}` : ""}`;
  };
  const select = (account: UsageForecastAccount) => { if (selectedAccountId === undefined) setLocalSelected(account.id); onAccountSelect?.(account); };
  const changeSort = (key: UsageForecastSortKey) => { const next: UsageForecastSort = { key, direction: sort.key === key && sort.direction === "asc" ? "desc" : "asc" }; if (controlledSort === undefined) setLocalSort(next); onSortChange?.(next); };
  const error = state === "error" || !valid;

  return <section aria-labelledby={titleId} className={cn("@container/forecast w-full min-w-0 text-body", className)} {...props}>
    <Card className="rounded-3xl border-hairline border-border bg-surface-floating p-4 shadow-raised sm:p-6">
      <Tabs color="default" variant="pill" value={view} onValueChange={(value) => { const next = value === "table" ? "table" : "forecast"; if (controlledView === undefined) setLocalView(next); onViewChange?.(next); }}>
        <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0"><h2 id={titleId} className="text-heading font-semibold tracking-tight text-fg-default">{state === "loading" ? labels.loading : error || !accounts.length || (!atRisk.length && hasPending) ? labels.forecast : labels.title(atRisk.length)}</h2>
            {state === "ready" && !error && accounts.length > 0 && <p className="mt-1 text-body text-fg-subtle">{atRisk[0] ? labels.summary(atRisk[0].account.name, time(atRisk[0].runsOutAt!), duration(atRisk[0].lockedMs)) : hasPending ? labels.pendingSummary ?? usageForecastEnLabels.pendingSummary : labels.healthySummary}</p>}</div>
          <TabsList aria-label={labels.view}><TabItem value="forecast" label={labels.forecast} /><TabItem value="table" label={labels.table} /></TabsList>
        </header>
        {state === "loading" ? <div role="status" aria-label={labels.loading} className="space-y-3 py-3">{Array.from({ length: 7 }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          : error ? <InlineNotice role="alert" variant="emphasized" tone="danger"><InlineNoticeContent>{errorMessage ?? labels.invalid}</InlineNoticeContent>{onRetry && <Button variant="secondary" onClick={onRetry}>{labels.retry}</Button>}</InlineNotice>
            : !accounts.length ? <p className="py-16 text-center text-body text-fg-subtle">{labels.empty}</p>
              : <>
                <TabPanel value="forecast"><div className="grid gap-6 @5xl/forecast:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)]">
                  <ForecastTimeline projections={sorted} selectedId={selected?.account.id} onSelect={select} now={now} labels={labels} time={time} percent={percent} date={date} detailId={detailId} locale={locale} timeZone={timeZone} />
                  {selected && view === "forecast" && <AccountDetail id={detailId} projection={selected} view={view} labels={labels} now={now} percent={percent} number={number} date={date} time={time} duration={duration} />}
                </div></TabPanel>
                <TabPanel value="table"><UsageTable projections={sorted} selectedId={selected?.account.id} onSelect={select} sort={sort} onSort={changeSort} detailId={detailId} labels={labels} percent={percent} number={number} time={time} duration={duration} now={now} />
                  {selected && view === "table" && <AccountDetail id={detailId} projection={selected} view={view} labels={labels} now={now} percent={percent} number={number} date={date} time={time} duration={duration} />}
                </TabPanel>
              </>}
      </Tabs>
    </Card>
  </section>;
}
