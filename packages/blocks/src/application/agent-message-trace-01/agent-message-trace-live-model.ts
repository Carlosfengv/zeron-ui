import {
  buildAgentMessageTraceModel,
  type AgentMessageTraceModel,
} from "./agent-message-trace-model";
import type { AgentMessageTraceSpan } from "./agent-message-trace-types";

// Reuse formatters across streamed snapshots; bound the cache for varied locales.
const numberFormats = new Map<string, Intl.NumberFormat>();
function numberFormat(locale: string, decimals: number, currency = false) {
  const key = `${locale}:${decimals}:${currency}`;
  let format = numberFormats.get(key);
  if (!format) {
    format = new Intl.NumberFormat(locale, currency
      ? { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: decimals }
      : { maximumFractionDigits: decimals });
    if (numberFormats.size >= 24) numberFormats.delete(numberFormats.keys().next().value!);
    numberFormats.set(key, format);
  }
  return format;
}

export function finiteTraceValue(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, value)
    : 0;
}

export function liveSpanDuration(
  span: AgentMessageTraceSpan,
  nowOffsetMs?: number,
): number {
  return span.durationMs === undefined && span.status === "running"
    ? Math.max(
        0,
        finiteTraceValue(nowOffsetMs) - finiteTraceValue(span.startOffsetMs),
      )
    : finiteTraceValue(span.durationMs);
}

/** Values are exclusive on input, inclusive only in the derived per-span rollup. */
export function buildAgentMessageTraceUsage(
  spans: readonly AgentMessageTraceSpan[],
  model: AgentMessageTraceModel = buildAgentMessageTraceModel(spans),
) {
  const costs = new Map<string, number>();
  let costUsd = 0;
  let tokens = 0;
  let llmCalls = 0;
  let toolCalls = 0;
  let errors = 0;
  let slowestSpanId: string | null = null;
  let longest = -1;

  for (const { span } of model.nodes.values()) {
    const cost = finiteTraceValue(span.usage?.costUsd);
    costs.set(span.id, cost);
    costUsd += cost;
    tokens +=
      finiteTraceValue(span.usage?.inputTokens) +
      finiteTraceValue(span.usage?.outputTokens);
    if (span.kind === "chat") llmCalls += 1;
    if (span.kind === "tool") toolCalls += 1;
    if (span.status === "error") errors += 1;
    if (
      span.kind !== "agent" &&
      span.status === "success" &&
      span.durationMs !== undefined &&
      finiteTraceValue(span.durationMs) > longest
    ) {
      longest = finiteTraceValue(span.durationMs);
      slowestSpanId = span.id;
    }
  }

  // Descending depth ensures every descendant has contributed before its parent.
  for (const node of [...model.nodes.values()].sort(
    (a, b) => b.depth - a.depth,
  )) {
    if (node.parentId)
      costs.set(
        node.parentId,
        (costs.get(node.parentId) ?? 0) + (costs.get(node.span.id) ?? 0),
      );
  }
  return { costUsd, tokens, llmCalls, toolCalls, errors, costs, slowestSpanId };
}

export function formatLiveTraceDuration(value: number, locale = "en"): string {
  const ms = finiteTraceValue(value);
  if (ms < 1000 && ms > 0) return `${Math.round(ms)}ms`;
  const seconds = ms / 1000;
  if (seconds < 60)
    return `${numberFormat(locale, seconds < 10 ? 1 : 0).format(seconds)}s`;
  const rounded = Math.round(seconds);
  const remainder = rounded % 60;
  return `${Math.floor(rounded / 60)}m${remainder ? ` ${String(remainder).padStart(2, "0")}s` : ""}`;
}

export function formatLiveTraceCost(value: number, locale = "en"): string {
  const cost = finiteTraceValue(value);
  return numberFormat(locale, cost > 0 && cost < 0.01 ? 3 : 2, true).format(cost);
}

/** Keep one third of the timeline available for duration and cost labels. */
export function liveTraceDomainEnd(elapsed: number): number {
  return Math.max(1000, finiteTraceValue(elapsed) * 1.35);
}

export function createLiveTraceTicks(elapsed: number) {
  const domainEnd = liveTraceDomainEnd(elapsed);
  const steps = [
    1000, 2000, 3000, 5000, 10_000, 15_000, 20_000, 30_000, 60_000, 120_000,
    300_000, 600_000, 1_800_000, 3_600_000,
  ];
  const target = domainEnd / 4;
  const step =
    steps.find((value) => value >= target) ??
    Math.ceil(target / 3_600_000) * 3_600_000;
  const ticks = Array.from(
    { length: Math.floor(domainEnd / step) + 1 },
    (_, index) => ({
      value: index * step,
      position: (index * step) / domainEnd,
    }),
  );
  return { domainEnd, ticks };
}
