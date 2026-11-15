import type { HTMLAttributes, ReactNode } from "react";

export type ContextBlockKind = "system" | "tools" | "memory" | "file" | "chat" | "result" | "summary";
export type ContextMapView = "before" | "after";

export interface ContextBlock {
  id: string;
  label: string;
  kind: ContextBlockKind;
  tokens: number;
  detail?: string;
  icon?: ReactNode;
  items?: readonly { label: string; icon?: ReactNode }[];
}

export interface ContextAgent {
  id: string;
  label: string;
  limit: number;
  model?: string;
  modelIcon?: ReactNode;
}

export interface ContextCompaction {
  before: readonly ContextBlock[];
  summarized?: readonly string[];
  dropped?: readonly string[];
  /** ID of the replacement summary in the current blocks. */
  summary?: string;
}

export const contextMapEnglishLabels = {
  title: "Context",
  agent: "Agent",
  before: "Before",
  after: "After",
  comparison: "Compaction view",
  pending: "No compaction yet. Before and after snapshots will appear here.",
  free: "Free",
  tokens: "tokens",
  system: "System prompt",
  tools: "Tools",
  memory: "Memory",
  file: "File",
  chat: "Chat",
  result: "Tool result",
  summary: "Summary",
  kept: "kept",
  summarized: "summarized",
  dropped: "dropped",
  into: "into",
};

export type ContextMapLabels = typeof contextMapEnglishLabels;

export const contextMapZhLabels: ContextMapLabels = {
  title: "上下文",
  agent: "智能体",
  before: "压缩前",
  after: "压缩后",
  comparison: "压缩对比视图",
  pending: "压缩完成后，可在此对比前后的上下文。",
  free: "剩余",
  tokens: "token",
  system: "系统提示词",
  tools: "工具",
  memory: "记忆",
  file: "文件",
  chat: "对话",
  result: "工具结果",
  summary: "摘要",
  kept: "保留",
  summarized: "已总结",
  dropped: "已移除",
  into: "缩为",
};

export interface ContextMapProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "onSelect"> {
  blocks: readonly ContextBlock[];
  limit: number;
  model?: string;
  modelIcon?: ReactNode;
  agents?: readonly ContextAgent[];
  agent?: string;
  onAgentChange?: (id: string) => void;
  compaction?: ContextCompaction | null;
  view?: ContextMapView;
  onViewChange?: (view: ContextMapView) => void;
  status?: string;
  onSelect?: (block: ContextBlock | null) => void;
  labels?: Partial<ContextMapLabels>;
  locale?: string;
}

type Fate = "kept" | "summarized" | "dropped";

export function getContextBlocks(blocks: readonly ContextBlock[]) {
  const seen = new Set<string>();
  return blocks.filter(({ id, tokens }) => {
    if (!id || seen.has(id) || !Number.isFinite(tokens) || tokens <= 0) return false;
    seen.add(id);
    return true;
  });
}

export function sumContextTokens(blocks: readonly ContextBlock[]) {
  return blocks.reduce((total, block) => total + block.tokens, 0);
}

export function getCompactionFates(before: readonly ContextBlock[], compaction: ContextCompaction) {
  const summarized = new Set(compaction.summarized);
  const dropped = new Set(compaction.dropped);
  const byId = new Map<string, Fate>();
  const totals = {
    kept: { count: 0, tokens: 0 },
    summarized: { count: 0, tokens: 0 },
    dropped: { count: 0, tokens: 0 },
  };
  for (const block of before) {
    const fate = dropped.has(block.id) ? "dropped" : summarized.has(block.id) ? "summarized" : "kept";
    byId.set(block.id, fate);
    totals[fate].count++;
    totals[fate].tokens += block.tokens;
  }
  return { byId, totals };
}

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Split along the longer edge at the nearest half by weight, preserving input order. */
export function layoutContextMap(weights: readonly number[], width: number, height: number) {
  if (!weights.length) return [];
  const prefix = [0];
  for (const weight of weights) prefix.push(prefix[prefix.length - 1] + weight);
  if (!Number.isFinite(prefix[weights.length])) return [];

  const tiles: Rect[] = [];
  const partitions = [{ start: 0, end: weights.length, x: 0, y: 0, width, height }];
  while (partitions.length) {
    const { start, end, x, y, width, height } = partitions.pop()!;
    if (end - start === 1) {
      tiles[start] = { x, y, width, height };
      continue;
    }
    const total = prefix[end] - prefix[start];
    const halfway = prefix[start] + total / 2;
    let low = start + 1;
    let high = end - 1;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (prefix[mid] < halfway) low = mid + 1;
      else high = mid;
    }
    const split = low > start + 1 && halfway - prefix[low - 1] < prefix[low] - halfway ? low - 1 : low;
    const fraction = total > 0 ? (prefix[split] - prefix[start]) / total : (split - start) / (end - start);
    if (width >= height) {
      const first = width * fraction;
      partitions.push(
        { start: split, end, x: x + first, y, width: width - first, height },
        { start, end: split, x, y, width: first, height },
      );
    } else {
      const first = height * fraction;
      partitions.push(
        { start: split, end, x, y: y + first, width, height: height - first },
        { start, end: split, x, y, width, height: first },
      );
    }
  }
  return tiles;
}

export function contextMapFormatters(locale?: string) {
  function create(language?: string) {
    const number = new Intl.NumberFormat(language);
    const percent = new Intl.NumberFormat(language, { style: "percent", maximumFractionDigits: 0 });
    const share = new Intl.NumberFormat(language, { style: "percent", maximumFractionDigits: 1 });
    const compact = new Intl.NumberFormat(language, { notation: "compact", maximumFractionDigits: 1 });
    return { number, percent, share, compact: (value: number) => compact.format(value).replace(/K$/, "k") };
  }
  try {
    return create(locale);
  } catch {
    return create("en");
  }
}
