"use client";

import { useMemo, useRef, useState } from "react";
import { SegmentedBar, chartSeriesColor } from "@zeron/ui/chart-primitives";
import { Button } from "@zeron/ui/button";
import { Card, CardFooter } from "@zeron/ui/card";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@zeron/ui/select";
import { Switch } from "@zeron/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@zeron/ui/table";
import { Tabs, TabsList, TabItem, TabPanel } from "@zeron/ui/tabs";
import { Tooltip } from "@zeron/ui/tooltip";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { RouterFlow } from "./router-flow";
import { ModelLogo } from "./model-logo";
import type { ModelRouterLabels, ModelRouterPolicy, ModelRouterProps, ModelRouterRoute, ModelRouterStrategy } from "./model-router-types";

const defaults: ModelRouterLabels = {
  title: "Model router", info: "Live gateway traffic. Particles illustrate relative request volume, not individual requests.",
  cost: "Cost", balanced: "Balanced", quality: "Quality", strategy: "Routing strategy",
  blendedCost: "Blended cost · live policy", tokenUnit: "/ 1K tokens", requestsUnit: "req/s", errors: "Errors",
  gateway: "Gateway", routes: "Routes", share: "Share", latency: "P50 / P95 s", price: "$ / 1K", fallback: "Fallback",
  ifModel: "if", retryOn: "fails, retry on", sourceModel: "Failed model", targetModel: "Retry model",
  live: "Live on", draft: "Unpublished changes", policy: "Policy", deploy: "Deploy policy", deploying: "Deploying…",
  reset: "Discard changes", empty: "No model routes available.", invalidFallback: "Choose two different, available models for fallback.",
  deployError: "Policy could not be deployed. Your changes have been kept. Try again.", settings: "Router settings", close: "Close router",
  pause: "Pause traffic animation", resume: "Resume traffic animation",
};
const strategies: readonly ModelRouterStrategy[] = ["cost", "balanced", "quality"];

function isValidMetric(value: number | null, ratio = false): value is number {
  return value !== null && Number.isFinite(value) && value >= 0 && (!ratio || value <= 1);
}

function metric(value: number | null, formatter: Intl.NumberFormat, ratio = false) {
  return isValidMetric(value, ratio) ? formatter.format(value) : "—";
}

function equalPolicy(a: ModelRouterPolicy, b: ModelRouterPolicy) {
  return a.strategy === b.strategy && a.fallback.enabled === b.fallback.enabled
    && a.fallback.from === b.fallback.from && a.fallback.to === b.fallback.to;
}

function RouteDot({ route }: { route?: ModelRouterRoute }) {
  return <span aria-hidden="true" className="inline-block size-2 shrink-0 rounded-full bg-fg-subtle" style={route ? { backgroundColor: chartSeriesColor(route.id, route) } : undefined} />;
}

function ModelSelect({ routes, value, excluded, disabled, label, onChange }: {
  routes: readonly ModelRouterRoute[]; value: string; excluded: string; disabled: boolean; label: string; onChange: (id: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled} size="md">
      <SelectTrigger aria-label={label} prefix={<ModelLogo route={routes.find((route) => route.id === value)} />} wrapperClassName="min-w-0 max-w-full" />
      <SelectContent>
        {routes.map((route) => (
          <SelectItem key={route.id} value={route.id} label={route.name} textValue={route.name} disabled={route.id === excluded}>
            <span className="flex items-center gap-2"><ModelLogo route={route} />{route.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/** Environment changes remount local drafts; hosts can instead own the complete value. */
export function ModelRouter(props: ModelRouterProps) {
  return <ModelRouterState key={props.data.environment.id} {...props} />;
}

function ModelRouterState({ data, value, defaultValue, onValueChange, actions, operationState, labels: suppliedLabels,
  locale = "en-US", currency = "USD", animated = true, className, ...props }: ModelRouterProps) {
  const labels = { ...defaults, ...suppliedLabels };
  // A null draft follows live updates. Only actual edits own a local snapshot.
  const [draft, setDraft] = useState<ModelRouterPolicy | null>(defaultValue ?? null);
  if (draft !== null && equalPolicy(draft, data.policy)) {
    setDraft(null);
  }
  const [paused, setPaused] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredRouteId, setHoveredRouteId] = useState<string | null>(null);
  const [focusedRouteId, setFocusedRouteId] = useState<string | null>(null);
  const highlightedRouteId = hoveredRouteId ?? focusedRouteId;
  const activeRouteId = data.routes.some((route) => route.id === highlightedRouteId) ? highlightedRouteId : null;
  const inFlight = useRef(false);
  const policy = value ?? draft ?? data.policy;
  const pending = submitting || !!operationState?.pending;
  const dirty = !equalPolicy(policy, data.policy);
  const invalidFallback = policy.fallback.enabled && (policy.fallback.from === policy.fallback.to
    || !data.routes.some((route) => route.id === policy.fallback.from)
    || !data.routes.some((route) => route.id === policy.fallback.to));
  const Info = useIcon("doc-info-item");
  const Settings = useIcon("settings");
  const Close = useIcon("x");
  const Pause = useIcon("pause");
  const Play = useIcon("play");
  const { number, decimal, money, percent, errorPercent } = useMemo(() => ({
    number: new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    decimal: new Intl.NumberFormat(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    money: new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 4, maximumFractionDigits: 4 }),
    percent: new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: 0 }),
    errorPercent: new Intl.NumberFormat(locale, { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  }), [locale, currency]);

  function change(next: ModelRouterPolicy) {
    if (pending) return;
    setError(null);
    if (value === undefined) setDraft(equalPolicy(next, data.policy) ? null : next);
    onValueChange?.(next);
  }

  async function deploy() {
    if (!actions?.onDeploy || inFlight.current || pending || !dirty || invalidFallback || !data.routes.length) return;
    inFlight.current = true;
    setSubmitting(true);
    setError(null);
    try {
      await actions.onDeploy({ ...policy, fallback: { ...policy.fallback } }, data.environment.id);
    } catch {
      setError(labels.deployError);
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <Card {...props} aria-busy={pending || undefined} data-slot="model-router" className={cn("@container w-full max-w-3xl overflow-hidden rounded-2xl bg-surface-raised pb-0", className)}>
      <header className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex items-center gap-1">
          <h2 className="text-body font-medium text-fg-default">{labels.title}</h2>
          <Tooltip content={labels.info}><Button aria-label={labels.info} iconOnly size="sm" variant="ghost"><Info /></Button></Tooltip>
        </div>
        {(actions?.onSettings || actions?.onClose) && <div className="flex min-w-0 items-center gap-1">
          {actions?.onSettings && <Button aria-label={labels.settings} iconOnly onClick={actions.onSettings} disabled={pending} variant="ghost"><Settings /></Button>}
          {actions?.onClose && <Button aria-label={labels.close} iconOnly onClick={actions.onClose} variant="ghost"><Close /></Button>}
        </div>}
      </header>

      <section className="mx-1 rounded-xl border-hairline border-border bg-surface-floating px-5 pb-5 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="font-mono text-label uppercase tracking-wider text-fg-subtle">{labels.blendedCost}</p>
            <div className="mt-2 flex flex-wrap items-baseline gap-1">
              <strong className="text-heading font-semibold tabular-nums text-fg-default">{metric(data.metrics.costPer1kTokens, money)}</strong>
              <span className="text-body font-medium text-fg-muted">{labels.tokenUnit}</span>
            </div>
          </div>
          <Tabs value={policy.strategy} onValueChange={(strategy) => { if (strategies.includes(strategy as ModelRouterStrategy)) change({ ...policy, strategy: strategy as ModelRouterStrategy }); }} variant="segment" color="neutral">
            <TabsList aria-label={labels.strategy}>
              {strategies.map((strategy) => <TabItem key={strategy} value={strategy} label={labels[strategy]} disabled={pending || !data.routes.length} />)}
            </TabsList>
            {strategies.map((strategy) => <TabPanel key={strategy} value={strategy}><p className="mt-2 text-right text-label text-fg-subtle">{dirty ? labels.draft : `${labels.policy} · ${labels[strategy]}`}</p></TabPanel>)}
          </Tabs>
        </div>
        <p className="mt-3 flex flex-wrap gap-x-3 gap-y-1 font-mono text-label uppercase tracking-wide text-fg-muted">
          <span>{metric(data.metrics.requestsPerSecond, number)} {labels.requestsUnit}</span><span aria-hidden="true">·</span>
          <span>P95 {metric(data.metrics.p95Seconds, decimal)} s</span><span aria-hidden="true">·</span>
          <span>{metric(data.metrics.errorRate, errorPercent, true)} {labels.errors}</span>
        </p>
        {data.routes.length ? <div className="mt-7"><RouterFlow routes={data.routes} animated={animated && !paused} gateway={labels.gateway} locale={locale} activeRouteId={activeRouteId} onHoverRoute={setHoveredRouteId} onFocusRoute={setFocusedRouteId} /></div> : <p className="py-10 text-body text-fg-muted">{labels.empty}</p>}
        {animated && data.routes.length > 0 && <div className="mt-1 flex justify-end"><Button aria-label={paused ? labels.resume : labels.pause} aria-pressed={paused} iconOnly onClick={() => setPaused(!paused)} size="xs" variant="ghost">{paused ? <Play /> : <Pause />}</Button></div>}
      </section>

      <section className="mx-1 mt-1 rounded-xl border-hairline border-border bg-surface-floating px-3 pb-4 pt-3">
        <div className="overflow-x-auto rounded-lg focus-visible:outline-2 focus-visible:outline-focus-ring" role="region" aria-label={labels.routes} tabIndex={0}>
          <Table className="w-full min-w-[620px]">
            <TableHeader><TableRow>
              <TableHead className="text-left text-body font-medium text-fg-default">{labels.routes}</TableHead>
              <TableHead className="text-right font-mono text-label uppercase">{labels.share}</TableHead>
              <TableHead className="text-right font-mono text-label uppercase">{labels.latency}</TableHead>
              <TableHead className="text-right font-mono text-label uppercase">{currency === "USD" ? labels.price : `${currency} / 1K`}</TableHead>
              <TableHead className="text-right font-mono text-label uppercase">{labels.errors}</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {data.routes.map((route) => <TableRow key={route.id} data-slot="router-table-route" data-route-id={route.id} tabIndex={0}
                onMouseEnter={() => setHoveredRouteId(route.id)} onMouseLeave={() => setHoveredRouteId(null)}
                onFocus={() => setFocusedRouteId(route.id)} onBlur={() => setFocusedRouteId(null)}
                className={cn("focus-visible:outline-2 focus-visible:outline-focus-ring", activeRouteId === route.id && "bg-hover")}>
                <TableCell className="py-4"><div className="flex items-center gap-2.5"><RouteDot route={route} /><ModelLogo route={route} /><span className="whitespace-nowrap text-body text-fg-default">{route.name}</span><span className="whitespace-nowrap font-mono text-label uppercase text-fg-subtle">{route.provider}</span><span className="sr-only">{metric(route.requestsPerSecond, number)} {labels.requestsUnit}</span></div></TableCell>
                <TableCell><div className="flex items-center justify-end gap-3">
                  <SegmentedBar aria-hidden="true" className="h-1 w-10 rounded-full" mode="capacity" total={1} segments={[{ id: route.id, label: route.name, value: isValidMetric(route.share, true) ? route.share : null, color: chartSeriesColor(route.id, route) }]} valueText={metric(route.share, percent, true)} />
                  <span className="tabular-nums text-fg-default">{metric(route.share, percent, true)}</span>
                </div></TableCell>
                <TableCell className="whitespace-nowrap text-right tabular-nums">{metric(route.p50Seconds, decimal)} / {metric(route.p95Seconds, decimal)}</TableCell>
                <TableCell className="text-right tabular-nums text-fg-default">{metric(route.costPer1kTokens, money)}</TableCell>
                <TableCell className="text-right tabular-nums">{metric(route.errorRate, errorPercent, true)}</TableCell>
              </TableRow>)}
            </TableBody>
          </Table>
        </div>
        <div className="mx-2 mt-2 flex flex-wrap items-center gap-x-3 gap-y-3 border-t-hairline border-border-subtle pt-4">
          <Switch checked={policy.fallback.enabled} onCheckedChange={(enabled) => change({ ...policy, fallback: { ...policy.fallback, enabled } })} label={labels.fallback} disabled={pending || data.routes.length < 2} />
          <span className="text-body text-fg-subtle">{labels.ifModel}</span>
          <ModelSelect routes={data.routes} value={policy.fallback.from} excluded={policy.fallback.to} label={labels.sourceModel} disabled={pending || !policy.fallback.enabled} onChange={(from) => change({ ...policy, fallback: { ...policy.fallback, from } })} />
          <span className="text-body text-fg-subtle">{labels.retryOn}</span>
          <ModelSelect routes={data.routes} value={policy.fallback.to} excluded={policy.fallback.from} label={labels.targetModel} disabled={pending || !policy.fallback.enabled} onChange={(to) => change({ ...policy, fallback: { ...policy.fallback, to } })} />
        </div>
        {(invalidFallback || error || operationState?.error) && <div className="mx-2 mt-3"><InlineNotice role="alert" tone="danger" variant="emphasized"><InlineNoticeContent>{operationState?.error ?? error ?? labels.invalidFallback}</InlineNoticeContent></InlineNotice></div>}
      </section>

      <CardFooter className="justify-between gap-3 px-5 py-4">
        <p className="flex items-center gap-2 font-mono text-label uppercase tracking-wide text-fg-subtle">
          <span className={cn("size-1.5 shrink-0 rounded-full", dirty ? "bg-fg-warning" : "bg-fg-success")} aria-hidden="true" />
          {labels.policy} v{data.revision} · {labels.live} {data.environment.name}
        </p>
        <div className="ml-auto flex items-center gap-2">
          {dirty && <Button onClick={() => change(data.policy)} disabled={pending} size="sm" variant="ghost">{labels.reset}</Button>}
          {actions?.onDeploy && <Button onClick={deploy} disabled={!dirty || invalidFallback || !data.routes.length || pending} loading={pending} size="md">{pending ? labels.deploying : labels.deploy}</Button>}
        </div>
      </CardFooter>
    </Card>
  );
}
