import type { ReactNode } from "react";

export type LocalModelPrecision = "BF16" | "FP8" | "INT4" | "MXFP4";
export interface LocalModelConfig {
  enabled: boolean;
  precision: LocalModelPrecision;
  context: number;
  parallel: number;
  overflow: "queue" | "cloud";
}
export interface LocalModel {
  id: string;
  name: string;
  provider: string;
  parameters: string;
  icon?: ReactNode;
  gpuIds: readonly string[];
  tokensToday: string;
  /** Measured or estimated weight memory in GB for each supported precision. */
  weights: Partial<Record<LocalModelPrecision, number>>;
  /** GB per request at 32K context. Scales linearly in this estimator. */
  cachePer32K: number;
  runtime: number;
}
export interface LocalModelGpu { id: string; label: string; capacity: number }
export interface LocalModelsData {
  serverName?: string;
  gpus: readonly LocalModelGpu[];
  models: readonly LocalModel[];
}
export type LocalModelsValue = Record<string, LocalModelConfig>;
export interface LocalModelsProps {
  data: LocalModelsData;
  /** Host-owned draft and last successfully applied configuration. */
  value: LocalModelsValue;
  appliedValue: LocalModelsValue;
  onValueChange: (value: LocalModelsValue) => void;
  onApply?: (value: LocalModelsValue) => void;
  onDiscard?: () => void;
  selectedModelId?: string;
  defaultSelectedModelId?: string;
  onSelectedModelChange?: (id: string) => void;
  onCopy?: (value: LocalModelsValue) => void;
  actions?: ReactNode;
  title?: string;
  description?: string;
  busy?: boolean;
  error?: string;
  className?: string;
}
