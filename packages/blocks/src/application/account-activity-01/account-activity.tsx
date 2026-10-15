"use client";

import { useId, useMemo, useState, type CSSProperties } from "react";
import { Card, CardContent } from "@zeron/ui/card";
import { Button } from "@zeron/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@zeron/ui/select";
import { Tabs, TabsList, TabItem, TabPanel } from "@zeron/ui/tabs";
import { cn } from "@zeron/ui/system/utils";
import { ActivityLegend, MatrixChart } from "./account-activity-charts";
import { AccountsView, RangeView, WeeksView, WindowUsage } from "./account-activity-views";
import { activityDays, busiestActivity, createActivityCalendar, DAY, selectActivity } from "./account-activity-data";
import { accountActivityDefaultLabels } from "./account-activity-labels";
import type { AccountActivityProps, AccountActivityQuery, AccountActivityView } from "./account-activity-types";

const views: AccountActivityView[] = ["matrix", "weeks", "range", "accounts"];

export function AccountActivity({ data, locale = "en-US", timeZone = "UTC", labels: overrides, query: controlled, defaultQuery,
  onQueryChange, state = "ready", errorMessage, onRetry, className, style, ...props }: AccountActivityProps) {
  const titleId = useId();
  const labels = useMemo(() => ({ ...accountActivityDefaultLabels, ...overrides }), [overrides]);
  const calendar = useMemo(() => createActivityCalendar(timeZone, locale), [timeZone, locale]);
  const [internal, setInternal] = useState<AccountActivityQuery>(() => ({ view: "matrix", accountId: "all", dayType: "all",
    range: { start: Math.max(data.start, data.end - 14 * DAY), end: data.end }, hiddenAccountIds: [], ...defaultQuery }));
  const sourceQuery = controlled ?? internal;
  const validBounds = Number.isFinite(data.start) && Number.isFinite(data.end) && data.end > data.start;
  const rangeStart = Math.max(data.start, Math.min(data.end - 1, Number.isFinite(sourceQuery.range.start) ? sourceQuery.range.start : data.start));
  const query = useMemo(() => ({ ...sourceQuery, range: { start: rangeStart, end: Math.max(rangeStart + 1, Math.min(data.end, Number.isFinite(sourceQuery.range.end) ? sourceQuery.range.end : data.end)) } }), [sourceQuery, rangeStart, data.end]);
  function update(patch: Partial<AccountActivityQuery>) {
    const next = { ...query, ...patch };
    if (!controlled) setInternal(next);
    onQueryChange?.(next);
  }
  const selection = useMemo(() => validBounds && state === "ready" ? selectActivity(data, query, calendar, query.view === "range") : null, [data, query, calendar, validBounds, state]);
  const days = useMemo(() => validBounds ? activityDays(data, calendar) : [], [data, calendar, validBounds]);
  const busiest = useMemo(() => {
    if (!selection) return null;
    const peak = busiestActivity(selection, query.view === "weeks" ? "weekday" : query.view === "accounts" ? "all" : "dayType");
    return peak ? { ...peak, time: `${String(peak.hour).padStart(2, "0")}:00–${String(peak.hour + 3).padStart(2, "0")}:00` } : null;
  }, [selection, query.view]);
  const incidents = selection?.events ?? [];
  const mostLimited = selection?.accounts.map((account) => ({ account, events: incidents.filter((event) => event.accountId === account.id) })).sort((a, b) => b.events.length - a.events.length)[0];
  const eventHours = mostLimited?.events.map((event) => calendar.parts(event.timestamp).hour) ?? [];
  const eventTime = eventHours.length ? `${String(Math.min(...eventHours)).padStart(2, "0")}:00–${String(Math.min(24, Math.max(...eventHours) + 1)).padStart(2, "0")}:00` : "";
  const title = state === "loading" ? labels.loading : state === "error" || !validBounds ? labels.error : query.view === "range" ? `${calendar.date(query.range.start)} – ${calendar.date(query.range.end - 1)}`
    : query.view === "accounts" && mostLimited?.events.length ? labels.accountSummary(mostLimited.account.name, eventTime)
    : busiest ? labels.busiest(busiest.time, query.view === "weeks" ? calendar.weekday(busiest.day) : busiest.day === 1 ? labels.weekends : labels.weekdays) : selection?.hours.length ? labels.quietActivity : labels.empty;
  const description = state !== "ready" || !validBounds ? "" : query.view === "range" ? `${labels.rangeSummary(selection?.accounts.length ?? 0)} · ${labels.rangeHint}`
    : query.view === "accounts" && busiest ? labels.busiest(busiest.time, labels.allAccounts)
    : labels.summary(incidents.length, days.length, incidents.filter((event) => calendar.parts(event.timestamp).weekday < 5).length);

  return <section {...props} aria-labelledby={titleId} data-slot="account-activity" data-view={query.view} data-theme-transition="instant" className={cn("min-w-0 w-full text-body", className)}
    style={{ "--zeron-theme-color-duration": "0ms", ...style } as CSSProperties}>
    <Card className="border-hairline border-border">
      <CardContent className="p-4 sm:p-6">
        <Tabs value={query.view} onValueChange={(view) => { if (views.includes(view as AccountActivityView)) update({ view: view as AccountActivityView }); }} variant="segment" color="default" className="min-w-0 space-y-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1 basis-80"><h2 id={titleId} className="text-title font-medium text-fg-default sm:text-heading">{title}</h2><p className="mt-1 text-label text-fg-subtle" aria-live="polite">{description}</p></div>
            <div className="flex max-w-full flex-wrap items-center gap-3">
              {query.view === "accounts" ? <Select value={query.dayType} onValueChange={(dayType) => update({ dayType: dayType as AccountActivityQuery["dayType"] })}>
                <SelectTrigger aria-label={labels.dayFilter} className="w-36" /><SelectContent>{(["weekdays", "weekends", "all"] as const).map((day) => <SelectItem key={day} value={day}>{labels[day]}</SelectItem>)}</SelectContent>
              </Select> : <Select value={query.accountId} onValueChange={(accountId) => update({ accountId })}>
                <SelectTrigger aria-label={labels.accountFilter} className="w-44" /><SelectContent><SelectItem value="all">{labels.allAccounts}</SelectItem>{data.accounts.map((account) => <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>)}</SelectContent>
              </Select>}
              <div className="max-w-full overflow-x-auto"><TabsList aria-label={labels.views}>{views.map((view) => <TabItem key={view} value={view} label={labels[view]} />)}</TabsList></div>
            </div>
          </div>
          {state === "loading" ? <div role="status" className="flex min-h-80 items-center justify-center text-body text-fg-subtle">{labels.loading}</div>
            : state === "error" || !validBounds ? <div role="alert" className="flex min-h-80 flex-col items-center justify-center gap-4 text-body text-fg-muted"><p>{errorMessage ?? labels.error}</p>{onRetry && <Button variant="secondary" onClick={onRetry}>{labels.retry}</Button>}</div>
            : selection && <>
              <TabPanel value="matrix"><div className="space-y-6">{selection.hours.length ? <MatrixChart selection={selection} days={days} calendar={calendar} labels={labels} /> : <EmptyState text={labels.empty} />}<ActivityLegend labels={labels} /><WindowUsage data={data} selection={selection} calendar={calendar} labels={labels} /></div></TabPanel>
              <TabPanel value="weeks">{selection.hours.length ? <WeeksView data={data} selection={selection} calendar={calendar} labels={labels} locale={locale} /> : <EmptyState text={labels.empty} />}</TabPanel>
              <TabPanel value="range"><RangeView data={data} selection={selection} calendar={calendar} labels={labels} query={query} onChange={update} /></TabPanel>
              <TabPanel value="accounts">{selection.hours.length ? <AccountsView selection={selection} calendar={calendar} labels={labels} locale={locale} /> : <EmptyState text={labels.empty} />}</TabPanel>
            </>}
        </Tabs>
      </CardContent>
    </Card>
  </section>;
}

function EmptyState({ text }: { text: string }) { return <p role="status" className="flex min-h-80 items-center justify-center text-body text-fg-subtle">{text}</p>; }
