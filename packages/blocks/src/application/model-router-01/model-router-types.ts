import type { ComponentPropsWithoutRef, ReactNode } from "react";
import type { BadgeColor } from "@zeron/ui/badge";

export type ModelRouterStrategy = "cost" | "balanced" | "quality";

export interface ModelRouterPolicy {
  strategy: ModelRouterStrategy;
  fallback: { enabled: boolean; from: string; to: string };
}

export interface ModelRouterRoute {
  id: string;
  name: string;
  provider: string;
  /** Model family, independent of hosting provider (for example self-hosted Qwen). */
  brand?: "claude" | "openai" | "qwen";
  logo?: ReactNode;
  color: BadgeColor;
  requestsPerSecond: number;
  /** All ratios are in the range 0..1. Null metrics are unavailable, not zero. */
  share: number | null;
  p50Seconds: number | null;
  p95Seconds: number | null;
  costPer1kTokens: number | null;
  errorRate: number | null;
}

export interface ModelRouterEnvironment { id: string; name: string }

export interface ModelRouterData {
  environment: ModelRouterEnvironment;
  revision: string;
  /** Confirmed live configuration. The host updates it after deployment succeeds. */
  policy: ModelRouterPolicy;
  /** Server aggregates from the same window as routes; never derived from route P95s. */
  metrics: { costPer1kTokens: number | null; requestsPerSecond: number | null; p95Seconds: number | null; errorRate: number | null };
  routes: readonly ModelRouterRoute[];
}

export interface ModelRouterLabels {
  title: string; info: string; cost: string; balanced: string; quality: string;
  blendedCost: string; tokenUnit: string; requestsUnit: string; errors: string; gateway: string;
  routes: string; share: string; latency: string; price: string; fallback: string; ifModel: string;
  retryOn: string; sourceModel: string; targetModel: string; live: string; draft: string;
  policy: string; deploy: string; deploying: string; reset: string; empty: string;
  invalidFallback: string; deployError: string; settings: string; close: string;
  pause: string; resume: string; strategy: string;
}

export interface ModelRouterProps extends Omit<ComponentPropsWithoutRef<"div">, "children" | "onChange" | "onClick" | "defaultValue"> {
  data: ModelRouterData;
  value?: ModelRouterPolicy;
  defaultValue?: ModelRouterPolicy;
  onValueChange?: (policy: ModelRouterPolicy) => void;
  actions?: {
    onDeploy?: (policy: ModelRouterPolicy, environmentId: string) => void | Promise<void>;
    onSettings?: () => void;
    onClose?: () => void;
  };
  operationState?: { pending?: boolean; error?: string | null };
  labels?: Partial<ModelRouterLabels>;
  locale?: string;
  currency?: string;
  animated?: boolean;
}
