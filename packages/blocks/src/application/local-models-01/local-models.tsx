"use client";

import { useId, useState } from "react";
import OpenAI from "@lobehub/icons/es/OpenAI/components/Mono";
import Gemini from "@lobehub/icons/es/Gemini/components/Color";
import Mistral from "@lobehub/icons/es/Mistral/components/Color";
import { Alert, AlertTitle, AlertDescription } from "@zeron/ui/alert";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { SegmentedBar } from "@zeron/ui/chart-primitives";
import { Container, ContainerBody, ContainerHeader, ContainerFooter } from "@zeron/ui/container";
import { Select, SelectTrigger, SelectContent, SelectItem } from "@zeron/ui/select";
import { SliderComfortable } from "@zeron/ui/slider";
import { Switch } from "@zeron/ui/switch";
import { Tabs, TabsList, TabItem, TabPanel } from "@zeron/ui/tabs";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { countLocalModelChanges, fitLocalModelsToGpus, getLocalModelMemory, getLocalModelPrecisions, getLocalModelsUsage, isLocalModelsConfigurationValid, localModelContexts } from "./local-models-data";
import { LocalModelsServer } from "./local-models-server";
import { LocalModelsGpuPicker } from "./local-models-gpu-picker";
import type { LocalModel, LocalModelConfig, LocalModelPrecision, LocalModelsProps } from "./local-models-types";
import styles from "./local-models.module.css";

const number = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 1 });
const contextName = (context: number) => `${context / 1024}K tokens`;
const memoryColors = {
  weights: "var(--brand)",
  cache: "color-mix(in srgb, var(--brand) 55%, var(--surface-floating))",
  runtime: "color-mix(in srgb, var(--brand) 25%, var(--surface-floating))",
};

function ProviderIcon({ model }: { model: LocalModel }) {
  return <span className={styles.provider} aria-hidden="true">{model.icon ?? (model.provider === "Google" ? <Gemini size={22} /> : model.provider === "Mistral" ? <Mistral size={22} /> : model.provider === "OpenAI" ? <OpenAI size={22} /> : <span className="text-body font-medium">{model.provider.slice(0, 1)}</span>)}</span>;
}

function ConfigTabs({ label, value, options, disabled, onChange }: {
  label: string; value: string; options: readonly string[]; disabled: boolean; onChange: (value: string) => void;
}) {
  return <Tabs variant="pill" color="brand" value={value} onValueChange={onChange}>
    <TabsList aria-label={label} className="w-full">{options.map((option) => <TabItem className="flex-1" key={option} value={option} label={option} disabled={disabled} />)}</TabsList>
    {options.map((option) => <TabPanel key={option} value={option} className="sr-only">{label}: {option}</TabPanel>)}
  </Tabs>;
}

/** A controlled local inference planner. Applying a draft is always a host action. */
export function LocalModels({ data, value, appliedValue, onValueChange, onApply, onDiscard,
  selectedModelId, defaultSelectedModelId, onSelectedModelChange, onCopy, actions,
  title = "Local Models", description = "Open weight models on your GPU server", busy = false, error, className }: LocalModelsProps) {
  const headingId = useId(); const prefix = useId();
  const [localSelection, setLocalSelection] = useState(defaultSelectedModelId ?? data.models[0]?.id);
  const [showChanges, setShowChanges] = useState(false);
  const model = data.models.find((item) => item.id === (selectedModelId ?? localSelection)) ?? data.models[0];
  const config = model ? value[model.id] : undefined;
  const usage = getLocalModelsUsage(data, value);
  const changes = countLocalModelChanges(data, value, appliedValue);
  const Chip = useIcon("doc-semantic-tokens"); const Copy = useIcon("copy"); const Edit = useIcon("pencil");
  const File = useIcon("file-text"); const Fit = useIcon("check");
  function select(id: string) { setLocalSelection(id); onSelectedModelChange?.(id); }
  function selectGpu(gpuId: string) {
    if (busy) return;
    const assigned = data.models.filter((item) => item.gpuIds.includes(gpuId));
    const target = assigned.find((item) => value[item.id]?.enabled) ?? assigned[0];
    if (target) select(target.id);
  }
  function update(patch: Partial<LocalModelConfig>) {
    if (model && config && !busy) onValueChange({ ...value, [model.id]: { ...config, ...patch } });
  }
  const memory = model && config ? getLocalModelMemory(model, config) : null;
  const modelGpus = model ? usage.gpus.filter((gpu) => model.gpuIds.includes(gpu.id)) : [];
  const capacity = modelGpus.reduce((sum, gpu) => sum + gpu.capacity, 0);
  const ownTotal = memory?.total ?? 0;
  const otherUsed = modelGpus.reduce((sum, gpu) => sum + gpu.used, 0) - ownTotal;
  // Tightest GPU is authoritative when a multi-GPU model shares a device.
  const shortage = modelGpus.length ? Math.max(0, ...modelGpus.map((gpu) => gpu.used - gpu.capacity)) * modelGpus.length : 0;
  const free = Math.max(0, capacity - ownTotal - otherUsed);
  const gpuLabel = modelGpus.map((gpu) => gpu.label).join(" + ");
  const invalid = !isLocalModelsConfigurationValid(data, value);
  const blocked = usage.gpus.filter((gpu) => gpu.used > gpu.capacity);

  return <Container className={cn("w-full", className)} data-block="local-models" role="region" aria-labelledby={headingId} aria-busy={busy}>
    <ContainerHeader className="gap-4 py-3">
      <div className="flex min-w-0 items-center gap-3"><span className={styles.provider}><Chip className="size-5" aria-hidden="true" /></span><div className="min-w-0"><h2 id={headingId} className="text-body font-semibold text-fg-default">{title}</h2><p className="text-body text-fg-muted">{description}</p></div></div>
      <div className="flex flex-wrap items-center gap-2">
        <LocalModelsGpuPicker data={data} value={value} usage={usage} selectedGpuIds={model?.gpuIds ?? []} disabled={busy} fitDisabled={invalid} onSelectGpu={selectGpu} onFit={() => onValueChange(fitLocalModelsToGpus(data, value))} />
        {usage.excess > 0 && <Button variant="tertiary" leadingIcon={Fit} disabled={busy || invalid} onClick={() => onValueChange(fitLocalModelsToGpus(data, value))}>Fit to GPUs</Button>}
        <Button variant="tertiary" leadingIcon={Edit} active={showChanges} aria-expanded={showChanges} aria-controls={`${prefix}-changes`} onClick={() => setShowChanges(!showChanges)}>Changes <span className="text-fg-muted">{changes}</span></Button>
        {onCopy && <Button variant="tertiary" iconOnly aria-label="Copy configuration" disabled={busy} onClick={() => onCopy(value)}><Copy aria-hidden="true" /></Button>}
        {actions}
      </div>
    </ContainerHeader>
    {showChanges && <ContainerBody id={`${prefix}-changes`} className="flex-none"><h3 className="mb-2 text-body font-medium">Pending changes</h3><ul className="space-y-1 text-label text-fg-muted">{data.models.filter((item) => countLocalModelChanges({ ...data, models: [item] }, value, appliedValue)).map((item) => <li key={item.id}>{item.name}: {value[item.id] ? `${value[item.id].enabled ? "Loaded" : "Unloaded"} · ${value[item.id].precision} · ${contextName(value[item.id].context)} · ${value[item.id].parallel} requests · ${value[item.id].overflow}` : "Missing configuration"}</li>)}</ul>{changes === 0 && <p className="text-label text-fg-muted">No pending changes</p>}</ContainerBody>}
    {error && <ContainerBody className="flex-none"><Alert status="danger"><AlertTitle>{error}</AlertTitle></Alert></ContainerBody>}
    {invalid && <ContainerBody className="flex-none"><Alert status="danger"><AlertTitle>Invalid configuration</AlertTitle><AlertDescription>Use unique model/GPU IDs, positive GPU capacities, finite nonnegative memory estimates, supported precisions, valid GPU allocations, a positive context window, and 1–16 parallel requests.</AlertDescription></Alert></ContainerBody>}
    <div className={styles.layout}>
      <div className="flex min-w-0 flex-col gap-1.5">
        <ContainerBody className={cn("p-0", styles.illustration)}>
          <div className={styles.illustrationArt}><LocalModelsServer gpus={data.gpus} usage={usage.gpus} selectableGpuIds={data.gpus.filter((gpu) => data.models.some((item) => item.gpuIds.includes(gpu.id))).map((gpu) => gpu.id)} selectedGpuIds={model?.gpuIds ?? []} disabled={busy} onSelectGpu={selectGpu} /></div>
          <div className="flex flex-wrap items-center justify-between gap-2 px-5 pb-5 text-label text-fg-muted"><span>Click a card to pick its model</span>{model && <span><span className="font-medium text-fg-default">{model.name}</span><span className="mx-2 text-fg-subtle">·</span>{number(ownTotal)} GB on {gpuLabel}</span>}</div>
        </ContainerBody>
        <ContainerBody className="flex-none p-4"><div className="space-y-2" aria-label="Local models">{data.models.map((item) => {
          const c = value[item.id]; const itemMemory = c ? getLocalModelMemory(item, c) : null;
          const itemGpus = usage.gpus.filter((gpu) => item.gpuIds.includes(gpu.id));
          const itemShort = c?.enabled ? Math.max(0, ...itemGpus.map((gpu) => gpu.used - gpu.capacity)) * itemGpus.length : 0;
          const itemCapacity = itemGpus.reduce((sum, gpu) => sum + gpu.capacity, 0);
          return <button key={item.id} type="button" className={styles.modelRow} aria-label={`Select ${item.name}`} aria-pressed={model?.id === item.id} onClick={() => select(item.id)} disabled={busy}>
            <ProviderIcon model={item} /><span className="min-w-0 flex-1"><span className="block truncate text-body font-medium text-fg-default">{item.name}</span><span className="block truncate text-label text-fg-muted">{itemGpus.map((gpu) => gpu.label).join(" + ")} · {item.tokensToday === "0" ? "Idle today" : `${item.tokensToday} tokens today`}</span></span>
            <span className="shrink-0 text-right">{!c?.enabled ? <Badge variant="dot" color="gray">Unloaded</Badge> : itemShort > 0 ? <Badge status="danger">Over by {number(itemShort)} GB</Badge> : <><span className="block text-label font-medium tabular-nums text-fg-default">{number(itemMemory?.total ?? 0)} GB</span><span className="mt-1 block w-16 sm:w-20"><SegmentedBar mode="capacity" total={itemCapacity} className="h-1.5" segments={[{ id: "used", label: item.name, value: itemMemory?.total ?? 0, color: memoryColors.weights }]} valueText={`${item.name}: ${number(itemMemory?.total ?? 0)} of ${number(itemCapacity)} GB`} /></span></>}</span>
          </button>;
        })}{data.models.length === 0 && <p className="p-4 text-body text-fg-muted">No local models. Add a model to configure your GPU server.</p>}</div></ContainerBody>
      </div>
      <ContainerBody className="p-5">
        {model && config && memory ? <div className="space-y-6">
          <div className="flex items-center gap-3"><ProviderIcon model={model} /><div className="min-w-0 flex-1"><h3 className="truncate text-body font-medium text-fg-default">{model.name}</h3><p className="text-label text-fg-muted">{model.provider} · {model.parameters} params</p></div><Switch checked={config.enabled} onCheckedChange={(enabled) => update({ enabled })} label={`Enable ${model.name}`} labelVisibility="sr-only" disabled={busy} /></div>
          <div className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2"><p className="text-body text-fg-muted"><span className="text-display font-semibold tracking-tight tabular-nums text-fg-default">{number(memory.total)}</span> GB</p><span className="text-label text-fg-muted">of {number(capacity)} GB on {gpuLabel}</span></div>
            <div className={styles.capacity}><SegmentedBar mode="capacity" total={capacity} className="h-2" valueText={`${number(memory.total)} GB used. ${shortage > 0 ? `${number(shortage)} GB short` : `${number(free)} GB free`}.`} segments={[
              { id: "weights", label: "Weights", value: memory.weights, color: memoryColors.weights },
              { id: "cache", label: "KV cache", value: memory.cache, color: memoryColors.cache },
              { id: "runtime", label: "Runtime", value: memory.runtime, color: memoryColors.runtime },
              { id: "other", label: "Other models", value: Math.max(0, otherUsed), color: "var(--border)" },
            ]} />{shortage > 0 && <span className={styles.capacityMark} style={{ left: `${Math.min(100, capacity / (memory.total + Math.max(0, otherUsed)) * 100)}%` }} />}</div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-label text-fg-muted">{[["Weights", memory.weights, memoryColors.weights], ["KV cache", memory.cache, memoryColors.cache], [shortage > 0 ? "Short" : "Free", shortage || free, shortage > 0 ? "var(--fg-danger)" : "var(--border)"]] .map(([label, amount, color]) => <span key={label} className="inline-flex items-center gap-1.5"><span aria-hidden="true" className="size-1.5 rounded-full" style={{ backgroundColor: String(color) }} />{label}<span className="ml-0.5 tabular-nums text-fg-default">{number(Number(amount))}</span></span>)}</div>
            {memory.runtime > 0 && <p className="sr-only">Runtime: {number(memory.runtime)} GB. Other models: {number(Math.max(0, otherUsed))} GB.</p>}
          </div>
          {shortage > 0 && <Alert status="danger"><AlertTitle>Doesn&apos;t fit on {gpuLabel}</AlertTitle><AlertDescription>Needs {number(shortage)} GB more. Lower the context or parallel requests, or pick a smaller precision.</AlertDescription></Alert>}
          <div className="space-y-2"><h4 id={`${prefix}-precision`} className="text-body font-medium text-fg-default">Precision</h4><ConfigTabs label="Precision" value={config.precision} options={getLocalModelPrecisions(model)} disabled={busy || !config.enabled} onChange={(precision) => update({ precision: precision as LocalModelPrecision })} /></div>
          <div className="space-y-2"><label id={`${prefix}-context`} className="text-body font-medium text-fg-default">Context window</label><Select value={String(config.context)} onValueChange={(context) => update({ context: Number(context) })} disabled={busy || !config.enabled}>
            <SelectTrigger aria-labelledby={`${prefix}-context`} icon={File} />
            <SelectContent><p className="px-3 py-2 text-label text-fg-muted">KV cache for {config.parallel} requests</p>{localModelContexts.map((context) => {
              const candidate = { ...config, context }; const estimate = getLocalModelMemory(model, candidate);
              const projected = getLocalModelsUsage(data, { ...value, [model.id]: candidate });
              const short = Math.max(0, ...projected.gpus.filter((gpu) => model.gpuIds.includes(gpu.id)).map((gpu) => gpu.used - gpu.capacity)) * model.gpuIds.length;
              return <SelectItem key={context} value={String(context)} label={contextName(context)}><div className="min-w-0 py-1"><div className="flex justify-between gap-6"><span>{contextName(context)}</span><span className={cn("text-label tabular-nums", short > 0 ? "text-fg-danger" : "text-fg-muted")}>{number(estimate.cache)} GB</span></div><p className={cn("mt-1 text-label", short > 0 ? "text-fg-danger" : "text-fg-muted")}>{short > 0 ? `Over by ${number(short)} GB` : `About ${context / 1024 * 1.5} pages`}</p></div></SelectItem>;
            })}</SelectContent></Select></div>
          <div className="space-y-2"><SliderComfortable value={config.parallel} onChange={(parallel: number) => update({ parallel })} min={1} max={16} step={1} label="Parallel requests" color="brand" disabled={busy || !config.enabled} /><p className="text-body text-fg-muted">Each request holds its own KV cache</p></div>
          <div className="space-y-2"><h4 className="text-body font-medium text-fg-default">When every slot is busy</h4><ConfigTabs label="When every slot is busy" value={config.overflow === "queue" ? "Queue" : "Use Cloud"} options={["Queue", "Use Cloud"]} disabled={busy || !config.enabled} onChange={(overflow) => update({ overflow: overflow === "Queue" ? "queue" : "cloud" })} /><p className="text-body text-fg-muted">{config.overflow === "queue" ? "Requests wait for a free slot" : "Overflow requests use your cloud provider"}</p></div>
        </div> : <div className="flex min-h-64 items-center justify-center text-body text-fg-muted">{data.models.length ? "Select a model with a valid configuration" : "No model selected"}</div>}
      </ContainerBody>
    </div>
    <ContainerFooter className="justify-between gap-3">
      <p role="status" className={cn("text-label", blocked.length ? "text-fg-danger" : "text-fg-muted")}>{blocked.length ? blocked.map((gpu) => `${gpu.label} over by ${number(gpu.used - gpu.capacity)} GB`).join(" · ") : `${changes} models edited`}</p>
      <div className="flex gap-2"><Button variant="tertiary" disabled={busy || !changes} onClick={() => { onValueChange(appliedValue); onDiscard?.(); }}>Discard</Button><Button variant="neutral" loading={busy} disabled={!onApply || !changes || usage.excess > 0 || invalid || busy} onClick={() => onApply?.(value)}>Apply</Button></div>
    </ContainerFooter>
  </Container>;
}
