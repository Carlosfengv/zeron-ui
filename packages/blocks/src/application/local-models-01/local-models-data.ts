import type { LocalModel, LocalModelConfig, LocalModelPrecision, LocalModelsData, LocalModelsValue } from "./local-models-types";

export const localModelContexts = [8192, 32768, 131072] as const;
const precisions: readonly LocalModelPrecision[] = ["BF16", "FP8", "INT4", "MXFP4"];
const round = (value: number) => Number.isFinite(value * 1000) ? Math.round(value * 1000) / 1000 : value;
const nonnegative = (value: number) => Number.isFinite(value) ? Math.max(0, value) : 0;
const validMemory = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value >= 0;

export function getLocalModelPrecisions(model: LocalModel) {
  return precisions.filter((precision) => validMemory(model.weights[precision]));
}

/** Validate before applying or fitting; malformed input must never enter reduction loops. */
export function isLocalModelsConfigurationValid(data: LocalModelsData, value: LocalModelsValue) {
  const gpuIds = new Set(data.gpus.map((gpu) => gpu.id));
  const modelIds = new Set(data.models.map((model) => model.id));
  if (gpuIds.size !== data.gpus.length || modelIds.size !== data.models.length) return false;
  if (data.gpus.some((gpu) => !gpu.id || !validMemory(gpu.capacity) || gpu.capacity === 0)) return false;
  const valid = data.models.every((model) => {
    const config = value[model.id];
    return Boolean(model.id && config
      && validMemory(model.cachePer32K) && validMemory(model.runtime)
      && Object.values(model.weights).every((weight) => weight === undefined || validMemory(weight))
      && getLocalModelPrecisions(model).includes(config.precision)
      && Number.isFinite(config.context) && config.context > 0
      && Number.isInteger(config.parallel) && config.parallel >= 1 && config.parallel <= 16
      && Number.isFinite((model.weights[config.precision] ?? 0) + model.cachePer32K * config.context / 32768 * config.parallel + model.runtime)
      && typeof config.enabled === "boolean" && (config.overflow === "queue" || config.overflow === "cloud")
      && model.gpuIds.length > 0 && new Set(model.gpuIds).size === model.gpuIds.length
      && model.gpuIds.every((id) => gpuIds.has(id)));
  });
  return valid && Number.isFinite(data.gpus.reduce((total, gpu) => total + gpu.capacity, 0))
    && Number.isFinite(data.models.reduce((total, model) => total + getLocalModelMemory(model, value[model.id]).total, 0));
}

/** Safe rendering estimates; validation independently prevents applying malformed input. */
export function getLocalModelMemory(model: LocalModel, config: LocalModelConfig) {
  if (!config.enabled) return { weights: 0, cache: 0, runtime: 0, total: 0 };
  const weights = nonnegative(model.weights[config.precision] ?? 0);
  const cache = nonnegative(round(nonnegative(model.cachePer32K) * nonnegative(config.context) / 32768 * nonnegative(config.parallel)));
  const runtime = nonnegative(model.runtime);
  return { weights, cache, runtime, total: nonnegative(round(weights + cache + runtime)) };
}

/** Count each model once, then distribute its estimate across its assigned devices. */
export function getLocalModelsUsage(data: LocalModelsData, value: LocalModelsValue) {
  const usage = data.gpus.map((gpu) => ({ ...gpu, capacity: nonnegative(gpu.capacity), used: 0 }));
  const byId = new Map(usage.map((gpu) => [gpu.id, gpu]));
  for (const model of data.models) {
    const config = value[model.id];
    if (!config || !model.gpuIds.length) continue;
    const share = getLocalModelMemory(model, config).total / model.gpuIds.length;
    for (const id of new Set(model.gpuIds)) {
      const gpu = byId.get(id);
      if (gpu) gpu.used += share;
    }
  }
  const total = round(usage.reduce((sum, gpu) => sum + gpu.used, 0));
  for (const gpu of usage) gpu.used = round(gpu.used);
  return { gpus: usage, total,
    capacity: round(usage.reduce((sum, gpu) => sum + gpu.capacity, 0)),
    excess: round(usage.reduce((sum, gpu) => sum + Math.max(0, gpu.used - gpu.capacity), 0)) };
}

export function countLocalModelChanges(data: LocalModelsData, value: LocalModelsValue, applied: LocalModelsValue) {
  return data.models.filter(({ id }) => {
    const a = value[id]; const b = applied[id];
    if (!a || !b) return a !== b;
    return a.enabled !== b.enabled || a.precision !== b.precision || a.context !== b.context || a.parallel !== b.parallel || a.overflow !== b.overflow;
  }).length;
}

/** Reduce every affected model before considering unloading any model. */
export function fitLocalModelsToGpus(data: LocalModelsData, value: LocalModelsValue): LocalModelsValue {
  const next = Object.fromEntries(Object.entries(value).map(([id, config]) => [id, { ...config }]));
  if (!isLocalModelsConfigurationValid(data, value)) return next;
  const over = (model: LocalModel) => getLocalModelsUsage(data, next).gpus.some((gpu) => model.gpuIds.includes(gpu.id) && round(gpu.used - gpu.capacity) > 0);
  const enabled = data.models.filter((model) => next[model.id].enabled);
  for (const model of enabled) {
    const config = next[model.id];
    if (model.cachePer32K === 0) continue;
    while (over(model) && config.parallel > 1) config.parallel--;
  }
  for (const model of enabled) {
    const config = next[model.id];
    if (model.cachePer32K === 0) continue;
    while (over(model) && config.context > localModelContexts[0]) {
      config.context = [...localModelContexts].reverse().find((context) => context < config.context) ?? localModelContexts[0];
    }
  }
  for (const model of enabled) {
    const config = next[model.id];
    const options = getLocalModelPrecisions(model).sort((a, b) => model.weights[b]! - model.weights[a]!);
    for (const precision of options) {
      if (!over(model)) break;
      if (model.weights[precision]! < model.weights[config.precision]!) config.precision = precision;
    }
  }
  for (const model of enabled) if (getLocalModelMemory(model, next[model.id]).total > 0 && over(model)) next[model.id].enabled = false;
  return next;
}
