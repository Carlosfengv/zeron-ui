"use client";

import { useId, useMemo, useState } from "react";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Container, ContainerBody, ContainerFooter, ContainerHeader } from "@zeron/ui/container";
import { InlineNotice } from "@zeron/ui/inline-notice";
import { LiveLine, LiveLineChart } from "@zeron/ui/live-line-chart";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@zeron/ui/select";
import { TabItem, TabPanel, Tabs, TabsList } from "@zeron/ui/tabs";
import { Tooltip } from "@zeron/ui/tooltip";
import { createIconSlot } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { fleetHealthLabels, fleetMetricColor, fleetMetricValue } from "./fleet-health-data";
import { FleetHealthMatrix } from "./fleet-health-matrix";
import type { FleetHealthMetric, FleetHealthProps } from "./fleet-health-types";

const Info = createIconSlot("doc-info-item"); const Server = createIconSlot("monitor");
const Settings = createIconSlot("settings");

/** Domain visualization: segmented telemetry, not a control or a capacity claim when unknown. */
function TelemetryTicks({ value, total, label }: { value: number | null; total: number | null; label: string }) {
  const known = value !== null && total !== null && Number.isFinite(value) && Number.isFinite(total) && value >= 0 && total > 0;
  const ratio = known ? Math.min(1, value / total) : 0;
  return <div role="img" aria-label={label} className="mt-2 flex h-3 w-full gap-0.5" data-slot="fleet-telemetry-ticks" data-known={known}>
    {Array.from({ length: 26 }, (_, index) => <span key={index} aria-hidden className={cn("h-full min-w-0 flex-1 rounded-full", known && index / 26 < ratio ? "bg-brand" : "bg-border-subtle")} />)}
  </div>;
}

export function FleetHealth({ data, clusterId, clusters, onClusterChange, metric: controlledMetric, onMetricChange,
  selectedNodeId: controlledNode, onNodeSelect, temperatureThreshold = 84, live = false, refreshIntervalMs = 1600,
  region, onRebalance, rebalancing = false, onSettings, footerActions, notice, labels: overrides,
  locale = "en-US", className }: FleetHealthProps) {
  const titleId = useId();
  const labels = { ...fleetHealthLabels, ...overrides };
  const [localMetric, setLocalMetric] = useState<FleetHealthMetric>("utilization");
  const [localNode, setLocalNode] = useState<string | null>(null);
  const metric = controlledMetric ?? localMetric;
  const selected = controlledNode === undefined ? localNode : controlledNode;
  const selectedNode = data.nodes.some((node) => node.id === selected) ? selected : null;
  const threshold = Number.isFinite(temperatureThreshold) ? temperatureThreshold : 84;
  const numberFormats = useMemo(() => [
    new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }),
    new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }),
  ], [locale]);
  const format = (value: number | null, digits: 0 | 1 = 0) => value !== null && Number.isFinite(value) && value >= 0
    ? numberFormats[digits].format(value) : "—";
  const gpus = data.nodes.flatMap((node) => node.gpus);
  let hot = 0;
  let draining = 0;
  let observedTemperatures = 0;
  let unknownTemperature = false;
  for (const gpu of gpus) {
    if (gpu.status === "draining") draining++;
    if (gpu.status === "offline") continue;
    const temperature = fleetMetricValue(gpu, "temperature");
    if (temperature === null) unknownTemperature = true;
    else {
      observedTemperatures++;
      if (temperature >= threshold) hot++;
    }
  }
  const temperatureStatus = hot ? `${format(hot)} ${labels.hot}`
    : unknownTemperature || observedTemperatures === 0 ? labels.unknown : labels.healthy;
  const change = data.changePercent !== null && Number.isFinite(data.changePercent) ? data.changePercent : null;
  function selectNode(id: string | null) { setLocalNode(id); onNodeSelect?.(id); }
  const changeMetric = (value: string) => { const next = value as FleetHealthMetric; setLocalMetric(next); onMetricChange?.(next); };
  const metricLabel = metric === "temperature" ? labels.temperature : metric === "memory" ? labels.memory : labels.utilization;
  const matrix = <>
    {data.nodes.length === 0 ? <p role="status" className="py-12 text-center text-body text-fg-muted">{labels.empty}</p>
      : <FleetHealthMatrix nodes={data.nodes} metric={metric} selectedNodeId={selectedNode} onNodeSelect={selectNode} threshold={threshold} labels={labels} format={format} />}
    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-label text-fg-subtle">
      <span>{labels.hint}</span>
      <div className="flex items-center gap-2" aria-label={`${metricLabel}: ${metric === "temperature" ? "30–90°C" : "0–100%"}`}>
        <span>{metric === "temperature" ? "30°C" : "0%"}</span><span aria-hidden className="flex h-3 w-24 gap-0.5">{Array.from({ length: 26 }, (_, index) => <span key={index} className="h-full min-w-0 flex-1 rounded-full" style={{ backgroundColor: fleetMetricColor(metric === "temperature" ? 30 + index / 25 * 60 : index / 25 * 100, metric) }} />)}</span><span>{metric === "temperature" ? "90°C" : "100%"}</span>
      </div>
    </div>
    {selectedNode && <div className="mt-2 flex justify-end"><Button size="sm" variant="ghost" onClick={() => selectNode(null)}>{labels.clearFocus}</Button></div>}
  </>;

  return <Container role="region" aria-labelledby={titleId} className={cn("w-full max-w-xl", className)}>
    <ContainerHeader>
      <div className="flex items-center gap-2"><h2 id={titleId} className="text-body font-medium text-fg-default">{labels.title}</h2>
        <Tooltip content={labels.info}><Button variant="ghost" size="sm" iconOnly aria-label={labels.info}><Info /></Button></Tooltip>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        <Select size="sm" value={clusterId} onValueChange={onClusterChange} disabled={!onClusterChange}>
          <SelectTrigger icon={Server} aria-label={labels.cluster} />
          <SelectContent>{clusters.map((cluster) => <SelectItem key={cluster.id} value={cluster.id}>{cluster.label}</SelectItem>)}</SelectContent>
        </Select>
        {onSettings && <Button variant="ghost" size="sm" iconOnly onClick={onSettings} aria-label={labels.settings}><Settings /></Button>}
      </div>
    </ContainerHeader>
    <ContainerBody>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 basis-64"><p className="font-mono text-label uppercase tracking-wide text-fg-subtle">{labels.tokens}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3"><strong className="break-all text-display font-medium tabular-nums text-fg-default">{format(data.tokensPerSecond)}</strong>
            {change !== null && <Badge status={change < 0 ? "warning" : "success"} size="sm">{change >= 0 ? "↑" : "↓"} {format(Math.abs(change), 1)}%</Badge>}
          </div>
          <p className="mt-2 font-mono text-label uppercase text-fg-muted">{labels.comparison} · {labels.ttft} {format(data.ttftMs)} ms · {format(data.modelCount)} {labels.models}</p>
        </div>
        <div className="ml-auto w-40 shrink-0 pt-2">
          {data.throughput.length > 0 && data.tokensPerSecond !== null && Number.isFinite(data.tokensPerSecond) && data.tokensPerSecond >= 0
            ? <LiveLineChart data={data.throughput} value={data.tokensPerSecond} window={64} paused={!live} exaggerate margin={{ top: 8, right: 8, bottom: 8, left: 0 }} style={{ height: 64 }}><LiveLine dataKey="value" stroke="var(--brand)" dotSize={2.5} badge={false} pulse={live} /></LiveLineChart>
            : <div className="flex h-16 items-center justify-center text-label text-fg-subtle">—</div>}
          <p className="mt-1 text-right font-mono text-label uppercase text-fg-subtle">{labels.lastWindow}</p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-5 border-t-hairline border-dashed border-border-subtle pt-4">
        <div><dt className="font-mono text-label uppercase text-fg-subtle">{labels.utilization}</dt><dd className="mt-1 text-body font-medium tabular-nums text-fg-default">{format(data.utilization)} <span className="font-normal text-fg-subtle">%</span></dd><TelemetryTicks value={data.utilization} total={100} label={`${labels.utilization}: ${format(data.utilization)}%`} /></div>
        <div><dt className="font-mono text-label uppercase text-fg-subtle">{labels.queue}</dt><dd className="mt-1 text-body font-medium tabular-nums text-fg-default">{format(data.queueDepth)} <span className="font-normal text-fg-subtle">req</span></dd><TelemetryTicks value={data.queueDepth} total={data.queueCapacity} label={`${labels.queue}: ${format(data.queueDepth)} / ${format(data.queueCapacity)}`} /></div>
        <div><dt className="font-mono text-label uppercase text-fg-subtle">{labels.power}</dt><dd className="mt-1 text-body font-medium tabular-nums text-fg-default">{format(data.powerKw, 1)} <span className="font-normal text-fg-subtle">/ {format(data.powerCapacityKw)} kW</span></dd><TelemetryTicks value={data.powerKw} total={data.powerCapacityKw} label={`${labels.power}: ${format(data.powerKw, 1)} / ${format(data.powerCapacityKw)} kW`} /></div>
      </dl>
    </ContainerBody>
    <ContainerBody>
      <Tabs value={metric} onValueChange={changeMetric} variant="segment" color="default">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div><h3 className="text-body font-medium text-fg-default">{labels.gpus} · {format(gpus.length)}</h3>
            <p className="mt-1 font-mono text-label uppercase text-fg-subtle">{format(data.nodes.length)} {labels.nodes} · {temperatureStatus}{draining > 0 ? ` · ${format(draining)} ${labels.draining}` : ""}</p>
          </div>
          <TabsList aria-label={labels.matrix}><TabItem value="utilization" label={labels.utilization} /><TabItem value="memory" label={labels.memory} /><TabItem value="temperature" label={labels.temperature} /></TabsList>
        </div>
        <TabPanel value={metric}>{matrix}</TabPanel>
      </Tabs>
    </ContainerBody>
    {notice && <div className="px-3"><InlineNotice role="status">{notice}</InlineNotice></div>}
    <ContainerFooter>
      <div className="mr-auto flex min-w-0 flex-wrap items-center gap-2">{footerActions}<Badge variant="plain" status={live ? "success" : "neutral"} size="sm">{live ? labels.live : labels.paused}</Badge>
        <span className="font-mono text-label uppercase text-fg-subtle">· {labels.every} {format(refreshIntervalMs / 1000, 1)} s{region ? ` · ${region}` : ""}</span>
      </div>
      {onRebalance && <Button onClick={onRebalance} loading={rebalancing} disabled={gpus.length === 0} size="sm">{rebalancing ? labels.rebalancing : labels.rebalance}</Button>}
    </ContainerFooter>
  </Container>;
}
