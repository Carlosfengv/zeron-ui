import type { LocalModelsData, LocalModelsValue } from "./local-models-types";

export const localModelsDemoData: LocalModelsData = {
  serverName: "nimbus-gpu-01",
  gpus: Array.from({ length: 4 }, (_, i) => ({ id: String(i), label: `GPU ${i}`, capacity: 48 })),
  models: [
    { id: "gpt-oss-120b", name: "gpt-oss-120b", provider: "OpenAI", parameters: "117B", gpuIds: ["0", "1"], tokensToday: "3.42M", weights: { BF16: 234, MXFP4: 63.5 }, cachePer32K: 3, runtime: 1.8 },
    { id: "gpt-oss-20b", name: "gpt-oss-20b", provider: "OpenAI", parameters: "21B", gpuIds: ["2"], tokensToday: "6.81M", weights: { BF16: 41.9, MXFP4: 12.8 }, cachePer32K: 0.8, runtime: 1.6 },
    { id: "mistral-small", name: "Mistral Small 3.1", provider: "Mistral", parameters: "24B", gpuIds: ["2"], tokensToday: "0", weights: { BF16: 48, FP8: 24, INT4: 12 }, cachePer32K: 1.4, runtime: 1.2 },
    { id: "gemma-3-27b", name: "Gemma 3 27B", provider: "Google", parameters: "27B", gpuIds: ["3"], tokensToday: "1.29M", weights: { BF16: 54.8, FP8: 28.4, INT4: 14.2 }, cachePer32K: 3.05, runtime: 1.6 },
  ],
};
export const localModelsDemoValue: LocalModelsValue = {
  "gpt-oss-120b": { enabled: true, precision: "MXFP4", context: 32768, parallel: 4, overflow: "queue" },
  "gpt-oss-20b": { enabled: true, precision: "MXFP4", context: 32768, parallel: 16, overflow: "queue" },
  "mistral-small": { enabled: false, precision: "FP8", context: 32768, parallel: 4, overflow: "queue" },
  "gemma-3-27b": { enabled: true, precision: "FP8", context: 32768, parallel: 4, overflow: "queue" },
};
export const localModelsDemoAppliedValue: LocalModelsValue = {
  ...localModelsDemoValue,
  "gpt-oss-120b": { ...localModelsDemoValue["gpt-oss-120b"], parallel: 2 },
  "gemma-3-27b": { ...localModelsDemoValue["gemma-3-27b"], context: 8192 },
};
export const localModelsOverflowDemoValue: LocalModelsValue = {
  ...localModelsDemoValue,
  "gpt-oss-20b": { ...localModelsDemoValue["gpt-oss-20b"], precision: "BF16" },
};
