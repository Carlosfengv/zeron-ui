import type { ContextWindowCategory, ContextWindowData } from "./context-window-types";

export const contextWindowCategories: readonly ContextWindowCategory[] = ["system", "tools", "memory", "docs", "history", "free"];
export const contextWindowColors: Record<ContextWindowCategory, string> = {
  system: "var(--chart-1)", tools: "var(--chart-2)", memory: "color-mix(in oklab, var(--chart-1) 50%, var(--chart-5))",
  docs: "var(--chart-4)", history: "var(--chart-5)", free: "var(--chart-6)",
};

const validTokens = (value: number) => Number.isFinite(value) && value >= 0;

/** Totals come from the same records displayed in Contents, avoiding stale summary counters. */
export function getContextWindowUsage(data: ContextWindowData) {
  if (!Number.isFinite(data.capacity) || data.capacity <= 0 || !validTokens(data.systemTokens) || !validTokens(data.toolTokens)) return null;
  for (const category of ["docs", "memory", "history"] as const) {
    const ids = new Set<string>();
    for (const item of data[category]) {
      if (!item.id || ids.has(item.id) || !validTokens(item.tokens)) return null;
      ids.add(item.id);
    }
  }
  const totals: Record<ContextWindowCategory, number> = {
    system: data.systemTokens, tools: data.toolTokens,
    memory: data.memory.reduce((sum, item) => sum + item.tokens, 0),
    docs: data.docs.reduce((sum, item) => sum + item.tokens, 0),
    history: data.history.reduce((sum, item) => sum + item.tokens, 0), free: 0,
  };
  const used = totals.system + totals.tools + totals.memory + totals.docs + totals.history;
  if (!Number.isFinite(used)) return null;
  totals.free = Math.max(0, data.capacity - used);
  const ratio = used / data.capacity;
  if (!Number.isFinite(ratio)) return null;
  const tokensPerTurn = data.tokensPerTurn;
  const estimate = tokensPerTurn !== undefined && validTokens(tokensPerTurn) && tokensPerTurn > 0
    ? Math.floor(totals.free / tokensPerTurn)
    : null;
  const headroom = estimate !== null && Number.isFinite(estimate) ? estimate : null;
  return {
    totals, used, ratio,
    status: ratio >= 0.95 ? "danger" as const : ratio >= 0.8 ? "warning" as const : "success" as const,
    headroom,
  };
}

/** Largest-remainder allocation keeps the categorical bitmap at exactly 400 cells. */
export function allocateContextWindowCells(totals: Record<ContextWindowCategory, number>, capacity: number): ContextWindowCategory[] {
  const denominator = Math.max(capacity, contextWindowCategories.reduce((sum, category) => sum + totals[category], 0));
  const counts = contextWindowCategories.map((category) => {
    const exact = totals[category] / denominator * 400;
    return { category, count: Math.floor(exact), remainder: exact % 1 };
  });
  let remaining = 400 - counts.reduce((sum, value) => sum + value.count, 0);
  for (const value of [...counts].sort((a, b) => b.remainder - a.remainder)) {
    if (remaining-- > 0) value.count++;
  }
  return counts.flatMap(({ category, count }) => Array<ContextWindowCategory>(count).fill(category));
}
