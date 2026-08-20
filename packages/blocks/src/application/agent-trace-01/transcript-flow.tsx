"use client";

import { useMemo } from "react";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { ChatMessage } from "@zeron/ui/chat-message";
import { ThinkingIndicator } from "@zeron/ui/thinking-indicator";
import { StreamMarkdown } from "./markdown-content";
import { ReasoningRow } from "./reasoning-row";
import type { AgentTranscriptBlock, AgentTranscriptItem } from "./stream-projection";
import { ToolCallCard } from "./tool-call-card";
import { groupTranscriptFlows } from "./transcript-grouping";
import { formatTraceTime } from "./trace-time";
import { useStreamScroll } from "./use-stream-scroll";

function compactNumber(value: number | undefined): string {
  if (value === undefined) return "—";
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000) return `${(value / 1_000_000).toFixed(2)} M`;
  if (absolute >= 1_000) return `${(value / 1_000).toFixed(2)} K`;
  return new Intl.NumberFormat("en").format(value);
}

function AssistantBlocks({ blocks, streaming }: { blocks: readonly AgentTranscriptBlock[]; streaming: boolean }) {
  const last = blocks.length - 1;
  return <div className="space-y-3">{blocks.map((block, index) => {
    if (block.kind === "reasoning") return <ReasoningRow key={`reasoning:${index}`} text={block.text} running={streaming && index === last} />;
    if (block.kind === "text") return <StreamMarkdown key={`text:${index}`} text={block.text} streaming={streaming && index === last} />;
    if (block.kind === "unknown") return <pre key={`unknown:${index}`} className="max-h-44 overflow-auto whitespace-pre-wrap break-words rounded bg-surface-raised p-2 text-label text-fg-muted">{block.text}</pre>;
    return null;
  })}{streaming && !blocks.some((block) => block.kind === "text" || block.kind === "reasoning") && <ThinkingIndicator className="px-0 py-0" />}</div>;
}

function TurnStatus() {
  return <div role="status" aria-live="polite" className="self-start py-1 text-body shimmer-text">Deep diving…</div>;
}

/** Stable, bottom-following conversation flow for replayed and live stream snapshots. */
export function TranscriptFlow({ items, replaying, timeZone, locale }: { items: readonly AgentTranscriptItem[]; replaying: boolean; timeZone?: string; locale?: string }) {
  const signature = useMemo(() => items.map((item) => {
    if (item.kind === "assistant") return `${item.id}:${item.status}:${item.blocks.map((block) => block.text.length).join(",")}`;
    if (item.kind === "tool") return `${item.id}:${item.status}:${item.result?.length ?? 0}`;
    return `${item.id}:${item.text.length}`;
  }).join("|"), [items]);
  const { ref, onScroll, scrollToBottom, showBackToBottom } = useStreamScroll(signature);
  const running = replaying || items.some((item) => item.kind === "assistant" && item.status === "running");
  const finalUsage = [...items].reverse().find((item): item is Extract<AgentTranscriptItem, { kind: "assistant" }> => item.kind === "assistant" && (item.input !== undefined || item.output !== undefined || item.think !== undefined));
  const flows = useMemo(() => groupTranscriptFlows(items), [items]);
  const renderItem = (item: AgentTranscriptItem) => {
    if (item.kind === "user") return <ChatMessage key={item.id} from="user" time={formatTraceTime(item.time, { locale, timeZone })} className="[&>div:first-child]:rounded-xl [&>div:first-child]:bg-brand [&>div:first-child]:text-fg-on-brand">{item.text}</ChatMessage>;
    if (item.kind === "assistant") return <ChatMessage key={item.id} from="assistant" data-streaming={item.status === "running" || undefined} className="min-w-0 max-w-full [&>div:first-child]:min-w-0 [&>div:first-child]:max-w-full"><div><AssistantBlocks blocks={item.blocks} streaming={item.status === "running"} />{item.status === "interrupted" && <p role="status" className="mt-2 text-label text-fg-danger">Stream interrupted</p>}</div></ChatMessage>;
    if (item.kind === "tool") return <ToolCallCard key={item.id} item={item} />;
    return <div key={item.id} className="self-center flex items-center gap-2 text-label text-fg-subtle"><Badge size="sm" color="gray">{item.kind === "system" ? "SYSTEM" : "CONTEXT"}</Badge><span className="max-w-xl truncate">{item.text}</span></div>;
  };

  return <div className="relative h-full min-h-0">
    <div ref={ref} onScroll={onScroll} data-conversation-scroll className="h-full overflow-y-auto">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 pb-8 sm:p-6 sm:pb-10">
        {flows.map((flow, index) => flow[0]?.kind === "user" ? renderItem(flow[0]) : <div key={`stream:${flow[0]?.id ?? index}`} className="flex min-w-0 flex-col gap-0">{flow.map(renderItem)}</div>)}
        {running && <TurnStatus />}
        {!running && finalUsage && <p className="self-start text-label tabular-nums text-fg-subtle">Input {compactNumber(finalUsage.input)} · Output {compactNumber(finalUsage.output)} · Think {compactNumber(finalUsage.think)}</p>}
        {items.length === 0 && <div className="flex min-h-48 items-center justify-center text-body text-fg-muted">No conversation records found in this JSON.</div>}
      </div>
    </div>
    {showBackToBottom && <Button type="button" size="sm" variant="secondary" className="absolute bottom-4 right-4 shadow-md" onClick={scrollToBottom}>Back to bottom</Button>}
  </div>;
}
