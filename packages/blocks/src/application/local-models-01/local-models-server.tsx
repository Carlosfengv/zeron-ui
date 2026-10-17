"use client";

import { useId } from "react";
import { cn } from "@zeron/ui/system/utils";
import type { LocalModelGpu } from "./local-models-types";
import { LocalModelsServerArtwork } from "./local-models-server-artwork";
import styles from "./local-models.module.css";

export function LocalModelsServer({ gpus, usage, selectableGpuIds, selectedGpuIds, onSelectGpu, disabled = false }: {
  gpus: readonly LocalModelGpu[];
  usage?: readonly (LocalModelGpu & { used: number })[];
  selectableGpuIds?: readonly string[];
  selectedGpuIds: readonly string[];
  onSelectGpu: (id: string) => void;
  disabled?: boolean;
}) {
  const shadowId = useId();
  return <svg viewBox="7 8 577 402" className={styles.server} role="group"
    aria-label="GPU server. Select a graphics card to inspect its model."
    strokeWidth="0.7" strokeLinejoin="round" strokeLinecap="round">
    <LocalModelsServerArtwork shadowId={shadowId} renderGpu={(index, body, vents) => {
      const gpu = gpus[index];
      const device = usage?.find((item) => item.id === gpu?.id);
      const selected = gpu ? selectedGpuIds.includes(gpu.id) : false;
      const over = device ? device.used > device.capacity : false;
      const occupied = device ? Math.min(vents.length, Math.max(device.used > 0 ? 1 : 0, Math.floor(device.used / Math.max(device.capacity, 1) * vents.length))) : 0;
      if (!gpu) return <g key={index} aria-hidden="true">{body}{vents.map((d, slot) => <path key={slot} d={d} className={styles.freeVent} />)}</g>;
      const cardDisabled = disabled || (selectableGpuIds !== undefined && !selectableGpuIds.includes(gpu.id));
      return <g key={gpu.id} role="button" tabIndex={cardDisabled ? -1 : 0} aria-label={`Select ${gpu.label}`}
        aria-pressed={selected} aria-disabled={cardDisabled || undefined} data-gpu-id={gpu.id} data-occupied-slots={occupied}
        className={cn(styles.gpu, selected && styles.selectedGpu, over && styles.overGpu)}
        onClick={() => { if (!cardDisabled) onSelectGpu(gpu.id); }}
        onKeyDown={(event) => { if (!cardDisabled && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); onSelectGpu(gpu.id); } }}>
        <title>{`${gpu.label} · ${device ? `${device.used.toFixed(1)} / ` : ""}${gpu.capacity} GB`}</title>
        {body}
        {vents.map((d, slot) => <path key={slot} d={d} className={slot < occupied ? styles.activeVent : styles.freeVent} />)}
      </g>;
    }} />
  </svg>;
}
