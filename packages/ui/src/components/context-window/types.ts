import type { HTMLAttributes, ReactNode } from "react";

export type ContextWindowTab = "docs" | "memory" | "history";
export type ContextWindowCategory = "system" | "tools" | ContextWindowTab | "free";

export interface ContextWindowItem {
  id: string;
  title: string;
  tokens: number;
  /** Already-localized source and age/turn labels supplied by the host. */
  source?: string;
  detail?: string;
  pinned?: boolean;
}

export interface ContextWindowData {
  capacity: number;
  systemTokens: number;
  toolTokens: number;
  docs: readonly ContextWindowItem[];
  memory: readonly ContextWindowItem[];
  history: readonly ContextWindowItem[];
  /** Typical tokens added per turn; omit when an estimate is unavailable. */
  tokensPerTurn?: number;
  cache?: { hitRate: number | null; saved: number | null; cachedTokens: number | null; newTokens: number | null };
  session?: { model: string; turn: number; name: string };
}

export interface ContextWindowLabels {
  title: string; description: string; live: string; paused: string; settings: string; close: string;
  used: string; healthy: string; warning: string; full: string; tokens: string; cache: string;
  saved: string; cached: string; newTokens: string; contents: string; empty: string;
  system: string; tools: string; docs: string; memory: string; history: string; free: string;
  compact: string; compacting: string; pinned: string;
  invalid: string; loading: string; retry: string; turn: string; matrix: string;
  usage: (percent: string) => string;
  headroom: (turns: string) => string;
  hit: (percent: string) => string;
  summary: (count: string, tokens: string, percent: string) => string;
}

export interface ContextWindowProps {
  data: ContextWindowData;
  title?: string;
  live?: boolean;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  tab?: ContextWindowTab;
  defaultTab?: ContextWindowTab;
  onTabChange?: (tab: ContextWindowTab) => void;
  onCompact?: () => void;
  compacting?: boolean;
  onSettings?: () => void;
  onClose?: () => void;
  footerActions?: ReactNode;
  notice?: string;
  labels?: Partial<ContextWindowLabels>;
  /** Localizes percentages, integer counts and currency; token abbreviations use k/M/B. */
  locale?: string;
  currency?: string;
  className?: string;
}


export interface ContextWindowUsageProps extends Omit<HTMLAttributes<HTMLSpanElement>, "children"> {
  /** The same snapshot passed to ContextWindowCompact. */
  data: ContextWindowData;
  /** Malformed locales fall back to en-US. */
  locale?: string;
}

export interface ContextWindowCompactLabels {
  title: string;
  tokens: string;
  system: string;
  tools: string;
  docs: string;
  history: string;
  memory: string;
  contents: string;
  empty: string;
  compact: string;
  compacting: string;
  loading: string;
  invalid: string;
  retry: string;
  capacity: (tokens: string) => string;
  remaining: (tokens: string) => string;
  usage: (used: string, capacity: string, percent: string) => string;
}

/** Uses the same snapshot contract as ContextWindow; the host owns mutations. */
export interface ContextWindowCompactProps {
  data: ContextWindowData;
  /** Render content directly inside a host surface, without a Container frame. */
  embedded?: boolean;
  title?: string;
  /** Overrides the default Claude logo for Claude model names. */
  modelIcon?: ReactNode;
  onCompact?: () => void;
  compacting?: boolean;
  loading?: boolean;
  error?: string;
  onRetry?: () => void;
  /** Success feedback; hidden while loading, compacting, invalid or failed. */
  notice?: string;
  labels?: Partial<ContextWindowCompactLabels>;
  /** Localizes counts and percentages; malformed locales fall back to en-US. */
  locale?: string;
  className?: string;
}
