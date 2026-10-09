"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { Tooltip, TooltipProvider } from "@zeron/ui/tooltip";
import { cn } from "@zeron/ui/system/utils";
import { fleetMetricColor, fleetMetricValue, fleetNodeAverage } from "./fleet-health-data";
import type { FleetGpu, FleetHealthLabels, FleetHealthMetric, FleetNode } from "./fleet-health-types";

export function FleetHealthMatrix({ nodes, metric, selectedNodeId, onNodeSelect, threshold, labels, format }: {
  nodes: readonly FleetNode[]; metric: FleetHealthMetric; selectedNodeId: string | null;
  onNodeSelect: (id: string | null) => void; threshold: number; labels: FleetHealthLabels;
  format: (value: number | null, digits?: 0 | 1) => string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const allIds = nodes.flatMap((node) => node.gpus.map((gpu) => JSON.stringify([node.id, gpu.id])));
  const gpuColumns = nodes.reduce((max, node) => Math.max(max, node.gpus.length), 0);
  const tabStop = focusedId && allIds.includes(focusedId) ? focusedId : allIds[0];
  const valueText = (value: number | null) => `${format(value)}${value === null ? "" : metric === "temperature" ? "°C" : "%"}`;
  function inspect(event: KeyboardEvent<HTMLButtonElement>, row: number, col: number) {
    let nextRow = row; let nextCol = col;
    switch (event.key) {
      case "ArrowRight": nextCol++; break;
      case "ArrowLeft": nextCol--; break;
      case "ArrowDown":
      case "ArrowUp": {
        const direction = event.key === "ArrowDown" ? 1 : -1;
        for (let candidate = row + direction; candidate >= 0 && candidate < nodes.length; candidate += direction) {
          if (nodes[candidate].gpus.length) { nextRow = candidate; break; }
        }
        break;
      }
      case "Home": nextCol = 0; if (event.ctrlKey || event.metaKey) nextRow = nodes.findIndex((node) => node.gpus.length > 0); break;
      case "End":
        if (event.ctrlKey || event.metaKey) nextRow = nodes.findLastIndex((node) => node.gpus.length > 0);
        nextCol = nodes[nextRow].gpus.length - 1;
        break;
      case "Escape": onNodeSelect(null); return;
      default: return;
    }
    event.preventDefault();
    nextRow = Math.max(0, Math.min(nodes.length - 1, nextRow));
    nextCol = Math.max(0, Math.min(nodes[nextRow].gpus.length - 1, nextCol));
    const gpu = nodes[nextRow].gpus[nextCol];
    if (!gpu) return;
    const id = JSON.stringify([nodes[nextRow].id, gpu.id]);
    const target = Array.from(root.current?.querySelectorAll<HTMLButtonElement>("[data-gpu]") ?? []).find((button) => button.dataset.gpu === id);
    setFocusedId(id); target?.focus();
  }
  function details(node: FleetNode, gpu: FleetGpu) {
    const rows = [
      [labels.utilization, `${format(fleetMetricValue(gpu, "utilization"))}%`],
      [labels.memory, `${format(gpu.memoryUsedGb, 1)} / ${format(gpu.memoryTotalGb)} GB`],
      [labels.temperature, `${format(gpu.temperatureC)}°C`],
      [labels.power, `${format(gpu.powerW)} W`], [labels.job, gpu.job ?? labels.noJob],
    ];
    return <div className="min-w-48 space-y-2 text-label">
      <div className="flex items-center justify-between gap-4"><span className="font-medium">{node.name} · GPU {gpu.index}</span><span className="opacity-70">{node.model}</span></div>
      <dl className="space-y-1">{rows.map(([label, value]) => <div key={label} className="flex justify-between gap-4"><dt className="opacity-70">{label}</dt><dd className="max-w-48 break-words text-right tabular-nums">{value}</dd></div>)}</dl>
      {gpu.status !== "active" && <p className="border-t-hairline border-current pt-1 opacity-70">{gpu.status === "draining" ? labels.draining : gpu.status === "offline" ? labels.offline : labels.idle}</p>}
    </div>;
  }
  return <TooltipProvider delayDuration={120}><div ref={root} className="min-w-0 overflow-x-auto py-1">
    <table aria-label={labels.matrix} className="w-full min-w-80 border-separate border-spacing-x-1 border-spacing-y-1 text-label">
      <tbody>{nodes.map((node, row) => {
        const dimmed = selectedNodeId !== null && selectedNodeId !== node.id;
        return <tr key={node.id} data-node={node.id} className={cn("transition-opacity duration-fast motion-reduce:transition-none", dimmed && "opacity-35")}>
          <th scope="row" className="w-24 pr-2 text-left font-normal"><button type="button" aria-pressed={selectedNodeId === node.id}
            aria-label={`${labels.focusNode} ${node.name}`} onClick={() => onNodeSelect(selectedNodeId === node.id ? null : node.id)}
            className="flex w-full items-center gap-2 rounded-sm text-fg-muted outline-none hover:text-fg-default focus-visible:ring-2 focus-visible:ring-focus-ring">
            <span className="whitespace-nowrap font-mono">{node.name}</span><span className="text-label text-fg-subtle">{node.model}</span>
          </button></th>
          {node.gpus.map((gpu, col) => {
            const id = JSON.stringify([node.id, gpu.id]);
            const value = gpu.status === "offline" ? null : fleetMetricValue(gpu, metric);
            const temperature = fleetMetricValue(gpu, "temperature");
            const hot = gpu.status !== "offline" && temperature !== null && temperature >= threshold;
            return <td key={gpu.id}><Tooltip content={details(node, gpu)}><button type="button" data-gpu={id}
              aria-label={`${node.name} · GPU ${gpu.index} · ${metric === "temperature" ? labels.temperature : metric === "memory" ? labels.memory : labels.utilization}: ${valueText(value)}${hot ? ` · ${labels.hot}` : ""}${gpu.status !== "active" ? ` · ${gpu.status === "draining" ? labels.draining : gpu.status === "idle" ? labels.idle : labels.offline}` : ""}`}
              tabIndex={id === tabStop ? 0 : -1} onFocus={() => setFocusedId(id)} onKeyDown={(event) => inspect(event, row, col)}
              aria-pressed={selectedNodeId === node.id}
              onClick={() => onNodeSelect(selectedNodeId === node.id ? null : node.id)}
              className="relative block h-6 w-full min-w-5 rounded-sm border-hairline border-border-subtle outline-none transition-colors duration-fast hover:ring-2 hover:ring-focus-ring focus-visible:ring-2 focus-visible:ring-focus-ring motion-reduce:transition-none"
              style={{ backgroundColor: fleetMetricColor(value, metric),
                backgroundImage: gpu.status === "draining" ? "repeating-linear-gradient(135deg, transparent, transparent 2px, var(--surface-floating) 2px, var(--surface-floating) 4px)" : undefined }}>
              {hot && <span aria-hidden className="absolute right-0.5 top-0.5 size-1.5 rounded-full bg-fg-danger ring-1 ring-surface-floating" />}
              {value === null && <span aria-hidden className="block text-label text-fg-muted">—</span>}
            </button></Tooltip></td>;
          })}
          {node.gpus.length < gpuColumns && <td colSpan={gpuColumns - node.gpus.length} />}
          <td className="w-12 pl-2 text-right font-mono text-fg-subtle">{valueText(fleetNodeAverage(node.gpus, metric))}</td>
        </tr>;
      })}</tbody>
    </table>
  </div></TooltipProvider>;
}
