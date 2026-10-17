"use client";

import { useState } from "react";
import { Button } from "@zeron/ui/button";
import { SegmentedBar } from "@zeron/ui/chart-primitives";
import { Popover, PopoverContent, PopoverDescription, PopoverFooter, PopoverHeader, PopoverTitle, PopoverTrigger } from "@zeron/ui/popover";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import type { getLocalModelsUsage } from "./local-models-data";
import type { LocalModelsData, LocalModelsValue } from "./local-models-types";
import styles from "./local-models.module.css";

const number = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 1 });

export function LocalModelsGpuPicker({ data, value, usage, selectedGpuIds, disabled, fitDisabled, onSelectGpu, onFit }: {
  data: LocalModelsData;
  value: LocalModelsValue;
  usage: ReturnType<typeof getLocalModelsUsage>;
  selectedGpuIds: readonly string[];
  disabled: boolean;
  fitDisabled: boolean;
  onSelectGpu: (id: string) => void;
  onFit: () => void;
}) {
  const [open, setOpen] = useState(false);
  const Chip = useIcon("doc-semantic-tokens"); const Fit = useIcon("check");
  const free = usage.gpus.reduce((sum, gpu) => sum + Math.max(0, gpu.capacity - gpu.used), 0);
  const uniformCapacity = usage.gpus.length > 0 && usage.gpus.every((gpu) => gpu.capacity === usage.gpus[0].capacity);
  const summary = `${data.serverName ?? "GPU server"}, ${usage.gpus.length} cards${uniformCapacity ? ` of ${number(usage.gpus[0].capacity)} GB` : ` · ${number(usage.capacity)} GB total`}`;

  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger render={<Button variant="tertiary" leadingIcon={Chip} active={open} disabled={disabled}
      aria-label="GPU Memory" aria-description={`${number(usage.total)} of ${number(usage.capacity)} GB used`}>
      {usage.excess > 0 ? <span className="tabular-nums text-fg-danger">Over by {number(usage.excess)} GB</span> : <span className="tabular-nums">{number(usage.total)} <span className="text-fg-muted">/ {number(usage.capacity)} GB</span></span>}
    </Button>} />
    <PopoverContent align="end" className="w-96 max-h-[calc(100dvh-2rem)] overflow-y-auto">
      <PopoverHeader><PopoverTitle>GPU Memory</PopoverTitle><PopoverDescription>{summary}</PopoverDescription></PopoverHeader>
      <div className="mt-4 space-y-2" aria-label="GPU cards">{usage.gpus.map((gpu) => {
        const assigned = data.models.filter((model) => model.gpuIds.includes(gpu.id));
        const loaded = assigned.filter((model) => value[model.id]?.enabled);
        const names = loaded.length ? loaded.map((model) => model.name).join(", ") : assigned.length ? "Unloaded" : "No models assigned";
        const over = gpu.used > gpu.capacity;
        return <button key={gpu.id} type="button" className={styles.modelRow} disabled={disabled || assigned.length === 0}
          aria-label={`Inspect ${gpu.label}`} aria-description={`${names}. ${number(gpu.used)} of ${number(gpu.capacity)} GB used${over ? `; over by ${number(gpu.used - gpu.capacity)} GB` : ""}`}
          aria-pressed={selectedGpuIds.includes(gpu.id)} onClick={() => { onSelectGpu(gpu.id); setOpen(false); }}>
          <span className="min-w-0 flex-1"><span className="block text-body font-medium text-fg-default">{gpu.label}</span><span className="block truncate text-label text-fg-muted" title={names}>{names}</span></span>
          <span className="shrink-0 text-right"><span className={cn("block text-body font-medium tabular-nums", over ? "text-fg-danger" : "text-fg-default")}>{number(gpu.used)} GB</span>
            <span className="mt-1 block w-20"><SegmentedBar mode="capacity" total={gpu.capacity} className="h-1.5" segments={[{ id: gpu.id, label: gpu.label, value: gpu.used, color: over ? "var(--fg-danger)" : "var(--brand)" }]} valueText={`${gpu.label}: ${number(gpu.used)} of ${number(gpu.capacity)} GB${over ? `; over by ${number(gpu.used - gpu.capacity)} GB` : ""}`} /></span>
          </span>
        </button>;
      })}{usage.gpus.length === 0 && <p className="py-4 text-body text-fg-muted">No GPUs available</p>}</div>
      <PopoverFooter className="flex-wrap justify-between">
        <p role="status" className="text-label text-fg-muted">{number(free)} GB free</p>
        <Button variant="tertiary" leadingIcon={Fit} disabled={disabled || fitDisabled || usage.gpus.length === 0} onClick={onFit}>Fit to GPUs</Button>
      </PopoverFooter>
    </PopoverContent>
  </Popover>;
}
