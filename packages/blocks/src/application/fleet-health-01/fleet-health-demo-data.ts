import type { FleetHealthSnapshot } from "./fleet-health-types";

export const fleetHealthDemoClusters = [
  { id: "kestrel-iad-3", label: "kestrel-iad-3" },
  { id: "kestrel-sfo-1", label: "kestrel-sfo-1" },
];

/** Deterministic, local fixture. Call with the host's current time to stream it. */
export function createFleetHealthDemoData(step = 0, nowSeconds = 0, clusterId = "kestrel-iad-3"): FleetHealthSnapshot {
  const remote = clusterId === "kestrel-sfo-1";
  const bases = remote ? [62, 70, 58, 46] : [81, 76, 89, 54, 70, 83, 79, 53];
  const nodes = bases.map((base, row) => ({
    id: `${clusterId}-node-${row}`, name: `ks-${row < 5 ? "a" : "b"}${String(row < 5 ? row + 1 : row - 4).padStart(2, "0")}`,
    model: row < 5 ? "H100" : "B200",
    gpus: Array.from({ length: 8 }, (_, col) => {
      const status = row === 3 && col === 6 ? "draining" as const
        : (row === 3 || row === 7) && col === 7 ? "idle" as const : "active" as const;
      const utilization = status === "idle" ? 0 : Math.max(0, Math.min(100, base + Math.round(Math.sin(step * 0.6 + col * 1.4 + row) * 4)));
      return { id: `gpu-${col}`, index: col + 1, status, utilization,
        memoryUsedGb: status === "idle" ? 0 : Math.round((base / 2 + col * 0.5) * 10) / 10,
        memoryTotalGb: row < 5 ? 80 : 180,
        temperatureC: status === "idle" ? 34 : row === 2 && col === 7 ? 86 : Math.round(39 + base * 0.44 + Math.sin(step + col) * 3),
        powerW: status === "idle" ? 45 : Math.round(140 + utilization * 5.2),
        job: status === "idle" ? null : row % 2 ? "quill-embed-v2" : "lumen-8b-chat" };
    }),
  }));
  const tokensPerSecond = Math.round((remote ? 960_000 : 1_890_000) + Math.sin(step * 0.7) * 22_000);
  return {
    tokensPerSecond, changePercent: 4.1 + Math.sin(step * 0.7) * 1.2,
    ttftMs: 216 + step % 5, modelCount: remote ? 3 : 5,
    utilization: remote ? 59 : 72 + step % 2, queueDepth: 88 + step % 7, queueCapacity: 400,
    powerKw: remote ? 18.4 : 38.2 + Math.sin(step) * 0.2, powerCapacityKw: remote ? 26 : 52,
    throughput: Array.from({ length: 41 }, (_, index) => ({ time: nowSeconds - (40 - index) * 1.6,
      value: index === 40 ? tokensPerSecond : Math.round((remote ? 960_000 : 1_890_000) + Math.sin((index + step) * 0.38) * 23_000 + Math.sin(index * 1.7) * 8_000) })),
    nodes,
  };
}
