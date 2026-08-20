"use client";

import { Children, Fragment, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ComponentPropsWithoutRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { WebhookIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Badge, type BadgeColor } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { InfoItem, InfoItemContent, InfoItemDescription, InfoItemGroup, InfoItemTitle } from "@zeron/ui/info-item";
import { Input } from "@zeron/ui/input";
import { PageBody, PageContent, PageHeader, PageHeaderContent, PageLayout, PageTitle } from "@zeron/ui/page-layout";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@zeron/ui/resizable";
import { ScrollArea } from "@zeron/ui/scroll-area";
import { useIcon, type IconComponentProps, type IconName } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@zeron/ui/table";
import { TabItem, TabPanel, Tabs, TabsList } from "@zeron/ui/tabs";
import { Tooltip } from "@zeron/ui/tooltip";
import { defaultAgentTracePayload } from "./session-default";
import { projectAgentTranscript } from "./stream-projection";
import { expandAgentTraceEntries, parseAgentTracePayload } from "./trace-jsonl";
import { DEFAULT_TRACE_LOCALE, DEFAULT_TRACE_TIME_ZONE, formatTraceTime } from "./trace-time";
import { TranscriptFlow } from "./transcript-flow";

export { defaultAgentTracePayload } from "./session-default";

type JsonRecord = Record<string, unknown>;
type TraceKind = "user" | "assistant" | "tool" | "system" | "context" | "event";
type AgentTraceView = "chat" | "trace";
type TraceDisplayControl = "duration" | "turns" | "calls";

type AgentTraceContentBlock = {
  kind: "text" | "reasoning" | "tool-call" | "unknown";
  text: string;
  name?: string;
};

/** Keeps the server and first client render identical when icon variants load on the client. */
function TraceIcon({ name, size = 14, strokeWidth = 1.5, ...props }: { name: IconName } & IconComponentProps) {
  const Icon = useIcon(name);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  return hydrated ? <Icon size={size} strokeWidth={strokeWidth} aria-hidden="true" {...props} /> : <span aria-hidden="true" className="inline-block size-3.5" />;
}

const DurationTabIcon = (props: IconComponentProps) => <TraceIcon name="clock" {...props} />;
const TurnsTabIcon = (props: IconComponentProps) => <TraceIcon name="list" {...props} />;
const CallsTabIcon = (props: IconComponentProps) => <HugeiconsIcon icon={WebhookIcon} aria-hidden="true" {...props} />;

export interface AgentTraceRow {
  id: string;
  kind: TraceKind;
  label: string;
  preview: string;
  raw: unknown;
  seq?: number;
  step?: number;
  callId?: string;
  result?: string;
  status?: "running" | "success" | "error";
  /** Recorded event time, when the uploaded log carries one. */
  time?: number;
  /** Measured call duration. Tool calls receive this from their matching result. */
  durationMs?: number;
  input?: number;
  output?: number;
  think?: number;
  /** Ordered message blocks reconstructed from DSH content or raw stream chunks. */
  content?: readonly AgentTraceContentBlock[];
}

export interface AgentTraceTurn {
  id: string;
  label: string;
  status?: "completed" | "error" | "aborted" | "running";
  /** Boundary timestamps are retained so the Turn ledger can show total elapsed time. */
  startedAt?: number;
  endedAt?: number;
  groups: readonly { id: string; label: string; rows: readonly AgentTraceRow[] }[];
}

export interface AgentTraceProps extends Omit<ComponentPropsWithoutRef<"section">, "children"> {
  /** A DSH-style session log, a `{ events }` / `{ messages }` envelope, or an array of agent messages. */
  data?: unknown;
  /** Enables the built-in local JSON picker. No file content leaves the browser. */
  allowUpload?: boolean;
  /** Called after a valid local JSON file has been parsed. Use with `data` to control the component. */
  onDataChange?: (data: unknown) => void;
  /** Short label displayed above the trace. */
  title?: string;
  /** Initial workspace surface. Trace remains the default for backwards compatibility. */
  defaultView?: AgentTraceView;
  /** IANA timezone used for every recorded timestamp. */
  timeZone?: string;
  /** Locale used for every recorded timestamp. */
  locale?: string;
}

function record(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : null;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function plainText(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(plainText).filter(Boolean).join("\n");
  const item = record(value);
  if (!item) return "";
  for (const key of ["text", "content", "output", "input", "reasoning", "thinking", "arguments"]) {
    if (item[key] !== undefined) {
      const text = plainText(item[key]);
      if (text) return text;
    }
  }
  if (item.type === "image" || item.image_url !== undefined) return "[image]";
  try {
    return JSON.stringify(value);
  } catch {
    return "[unserializable value]";
  }
}

function preview(value: unknown, fallback: string): string {
  const text = plainText(value).replace(/\s+/g, " ").trim();
  if (!text) return fallback;
  return text.length > 180 ? `${text.slice(0, 177)}…` : text;
}

function envelopeEntries(payload: unknown): readonly unknown[] {
  if (Array.isArray(payload)) return payload;
  const root = record(payload);
  if (!root) return [];
  if (Array.isArray(root.events)) return root.events;
  if (Array.isArray(root.messages)) return root.messages;
  const data = record(root.data);
  if (data && Array.isArray(data.events)) return data.events;
  if (data && Array.isArray(data.messages)) return data.messages;
  return [root];
}

function traceEntries(payload: unknown): readonly unknown[] {
  return expandAgentTraceEntries(envelopeEntries(payload));
}

function eventTurn(item: JsonRecord): number | undefined {
  const data = record(item.data);
  return numberValue(item.turn) ?? numberValue(data?.turn);
}

function eventStep(item: JsonRecord): number | undefined {
  const data = record(item.data);
  return numberValue(item.step) ?? numberValue(data?.step);
}

function eventData(item: JsonRecord): JsonRecord {
  return record(item.data) ?? item;
}

function eventTime(item: JsonRecord): number | undefined {
  const data = record(item.data);
  for (const value of [item.time, item.timestamp, item.createdAt, data?.time, data?.timestamp]) {
    const number = numberValue(value);
    if (number !== undefined) return number;
    if (typeof value === "string") {
      const parsed = Date.parse(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function usageFields(value: unknown): Pick<AgentTraceRow, "input" | "output" | "think"> {
  const usage = record(value);
  if (!usage) return {};
  const input = numberValue(usage.inputTokens) ?? numberValue(usage.input);
  const output = numberValue(usage.outputTokens) ?? numberValue(usage.output);
  const think = numberValue(usage.reasoningTokens) ?? numberValue(usage.think);
  return {
    ...(input === undefined ? {} : { input }),
    ...(output === undefined ? {} : { output }),
    ...(think === undefined ? {} : { think }),
  };
}

function traceContentBlocks(value: unknown): readonly AgentTraceContentBlock[] {
  const values = Array.isArray(value) ? value : value === undefined ? [] : [value];
  const blocks: AgentTraceContentBlock[] = [];
  for (const entry of values) {
    const block = record(entry);
    const type = typeof block?.type === "string" ? block.type : "unknown";
    if (type === "text") blocks.push({ kind: "text", text: plainText(block?.text) });
    else if (type === "reasoning") blocks.push({ kind: "reasoning", text: plainText(block?.text) });
    else if (type === "tool-call") {
      const name = typeof block?.name === "string" ? block.name : "Tool call";
      const argumentsText = plainText(block?.arguments ?? block?.args ?? "");
      blocks.push({ kind: "tool-call", text: argumentsText, name });
    } else blocks.push({ kind: "unknown", text: plainText(entry) });
  }
  return blocks.filter((block) => block.text || block.kind === "tool-call");
}

function contentPreview(blocks: readonly AgentTraceContentBlock[], fallback: string): string {
  const visible = blocks.filter((block) => block.kind !== "tool-call").map((block) => block.text).filter(Boolean).join("\n");
  if (visible) return preview(visible, fallback);
  const calls = blocks.filter((block) => block.kind === "tool-call").map((block) => block.name).filter(Boolean);
  return calls.length ? `Calling ${calls.join(", ")}` : fallback;
}

type ChunkAccumulator = {
  turn: number;
  step: number;
  seq: number;
  time?: number;
  blocks: Map<number, AgentTraceContentBlock>;
  raw: unknown[];
  usage?: Pick<AgentTraceRow, "input" | "output" | "think">;
  finished?: "success" | "error";
};

function chunkKey(turn: number, step: number): string {
  return `${turn}:${step}`;
}

function updateChunk(accumulator: ChunkAccumulator, item: JsonRecord, data: JsonRecord): void {
  const chunk = record(data.chunk);
  const type = typeof chunk?.type === "string" ? chunk.type : "";
  const index = numberValue(chunk?.index);
  accumulator.raw.push(item);
  if (type === "usage") {
    accumulator.usage = usageFields(chunk?.usage);
    return;
  }
  if (type === "finish") {
    const reason = record(chunk?.reason);
    accumulator.finished = reason?.kind === "error" || reason?.kind === "aborted" ? "error" : "success";
    return;
  }
  if (index === undefined) return;
  const previous = accumulator.blocks.get(index);
  if (type === "block-start") {
    const blockType = typeof chunk?.blockType === "string" ? chunk.blockType : "unknown";
    accumulator.blocks.set(index, { kind: blockType === "text" ? "text" : blockType === "reasoning" ? "reasoning" : blockType === "tool-call" ? "tool-call" : "unknown", text: "" });
    return;
  }
  if (type === "text-delta" || type === "reasoning-delta") {
    const kind = type === "text-delta" ? "text" : "reasoning";
    accumulator.blocks.set(index, { kind, text: `${previous?.text ?? ""}${plainText(chunk?.text)}` });
    return;
  }
  if (type === "tool-call-delta") {
    accumulator.blocks.set(index, {
      kind: "tool-call",
      name: typeof chunk?.name === "string" ? chunk.name : previous?.name ?? "Tool call",
      text: `${previous?.text ?? ""}${plainText(chunk?.argumentsDelta)}`,
    });
    return;
  }
  if (type === "block-end") {
    const [block] = traceContentBlocks(chunk?.block);
    if (block) accumulator.blocks.set(index, block);
  }
}

function sourceType(item: JsonRecord): string {
  if (typeof item.type === "string") return item.type;
  if (typeof item.role === "string") return `${item.role}/message`;
  return "event";
}

function statusFromReason(value: unknown): AgentTraceTurn["status"] {
  const reason = record(value);
  const kind = typeof reason?.kind === "string" ? reason.kind : "";
  if (kind === "completed") return "completed";
  if (kind === "error" || kind === "max-tokens") return "error";
  if (kind === "aborted" || kind === "blocked" || kind === "interrupted") return "aborted";
  return "running";
}

/**
 * Projects real agent messages into the small, portable ledger consumed by this block.
 * It understands the DSH session-event vocabulary and also accepts common `{ role, content }`
 * message arrays. Tool results are joined back to their calls through `callId`.
 */
export function normalizeAgentTracePayload(payload: unknown): readonly AgentTraceTurn[] {
  const entries = traceEntries(payload).map((value, index) => ({
    item: record(value),
    index,
  })).filter((entry): entry is { item: JsonRecord; index: number } => entry.item !== null);

  const completedMessages = new Set(entries.flatMap(({ item }) => {
    const type = sourceType(item);
    const turn = eventTurn(item);
    const step = eventStep(item);
    return type === "assistant/message" && turn !== undefined && step !== undefined ? [`${turn}:${step}`] : [];
  }));
  const upcomingTurns: Array<number | undefined> = [];
  let followingTurn: number | undefined;
  for (let index = entries.length - 1; index >= 0; index--) {
    upcomingTurns[index] = followingTurn;
    const turn = eventTurn(entries[index].item);
    if (turn !== undefined) followingTurn = turn;
  }

  const turns = new Map<string, { label: string; status?: AgentTraceTurn["status"]; startedAt?: number; endedAt?: number; groups: Map<string, { label: string; rows: AgentTraceRow[] }> }>();
  const calls = new Map<string, AgentTraceRow>();
  const chunks = new Map<string, ChunkAccumulator>();
  const ensureGroup = (turn: number | undefined, step: number | undefined) => {
    const key = turn === undefined ? "prelude" : String(turn);
    let traceTurn = turns.get(key);
    if (!traceTurn) {
      traceTurn = { label: turn === undefined ? "准备阶段" : `Turn ${turn}`, groups: new Map() };
      turns.set(key, traceTurn);
    }
    const groupKey = step === undefined ? "messages" : `step:${step}`;
    let group = traceTurn.groups.get(groupKey);
    if (!group) {
      group = { label: step === undefined ? "Messages" : `Step ${step}`, rows: [] };
      traceTurn.groups.set(groupKey, group);
    }
    return { key, traceTurn, group };
  };
  const add = (turn: number | undefined, step: number | undefined, row: AgentTraceRow) => {
    ensureGroup(turn, step).group.rows.push(row);
  };

  for (const { item, index } of entries) {
    const type = sourceType(item);
    const data = eventData(item);
    const seq = numberValue(item.seq) ?? index + 1;
    const directTurn = eventTurn(item);
    const turn = directTurn ?? ((type === "user/message" || type === "request/header") ? upcomingTurns[index] : undefined);
    const step = eventStep(item);
    const id = `trace:${seq}:${type}`;
    const time = eventTime(item);

    if (type === "turn/end") {
      const traceTurn = ensureGroup(directTurn, undefined).traceTurn;
      traceTurn.status = statusFromReason(data.reason);
      traceTurn.endedAt = time;
      continue;
    }
    if (type === "turn/start") {
      ensureGroup(directTurn, undefined).traceTurn.startedAt = time;
      continue;
    }
    if (type === "assistant/chunk") {
      if (turn === undefined || step === undefined) continue;
      const key = chunkKey(turn, step);
      let accumulator = chunks.get(key);
      if (!accumulator) {
        accumulator = { turn, step, seq, ...(time === undefined ? {} : { time }), blocks: new Map(), raw: [] };
        chunks.set(key, accumulator);
      }
      updateChunk(accumulator, item, data);
      continue;
    }
    if (type === "step/start" || type === "step/end") continue;
    if (type === "request/header") {
      const header = record(data.header);
      const tools = Array.isArray(header?.tools) ? header.tools.length : 0;
      add(turn, step, { id, kind: "system", label: "Request context", preview: tools ? `System prompt · ${tools} tools available` : "System prompt updated", raw: item, seq, step, time });
      continue;
    }
    if (type === "user/message" || type === "user") {
      add(turn, step, { id, kind: "user", label: "User", preview: preview(data.content ?? item.content, "User message"), raw: item, seq, step, time });
      continue;
    }
    if (type === "assistant/message" || type === "assistant/chunk" || type === "assistant") {
      const message = record(data.message) ?? data;
      const content = traceContentBlocks(message.content ?? message.text ?? item.content);
      add(turn, step, { id, kind: "assistant", label: "Assistant", preview: contentPreview(content, "Assistant response"), raw: item, seq, step, time, status: "success", ...usageFields(data.usage ?? message.usage), ...(content.length ? { content } : {}) });
      continue;
    }
    if (type === "tool/call") {
      const callId = typeof data.callId === "string" ? data.callId : `call:${seq}`;
      const toolName = typeof data.name === "string" ? data.name : "Tool call";
      const row: AgentTraceRow = { id, kind: "tool", label: toolName, preview: preview(data.arguments, "No arguments"), raw: item, seq, step, time, callId, status: "running" };
      calls.set(callId, row);
      add(turn, step, row);
      continue;
    }
    if (type === "tool/result" || type === "tool") {
      const message = record(data.message) ?? data;
      const callId = typeof message.callId === "string" ? message.callId : typeof data.callId === "string" ? data.callId : undefined;
      const result = preview(message.content ?? message.output ?? data.content, "Tool completed");
      const errored = data.error !== undefined || item.error !== undefined || item.status === "error";
      const paired = callId ? calls.get(callId) : undefined;
      if (paired) {
        paired.result = result;
        paired.status = errored ? "error" : "success";
        paired.raw = { call: paired.raw, result: item };
        if (time !== undefined && paired.time !== undefined) paired.durationMs = Math.max(0, time - paired.time);
      } else {
        add(turn, step, { id, kind: "tool", label: "Tool result", preview: result, raw: item, seq, step, time, callId, status: errored ? "error" : "success" });
      }
      continue;
    }
    if (type === "system/message" || type === "system") {
      add(turn, step, { id, kind: "system", label: "System", preview: preview(data.content ?? item.content, "System message"), raw: item, seq, step, time });
      continue;
    }
    if (type === "context/message" || type === "context") {
      add(turn, step, { id, kind: "context", label: "Context", preview: preview(data.content ?? item.content, "Injected context"), raw: item, seq, step, time });
    }
  }

  for (const accumulator of chunks.values()) {
    if (completedMessages.has(chunkKey(accumulator.turn, accumulator.step))) continue;
    const content = [...accumulator.blocks.entries()].sort(([left], [right]) => left - right).map(([, block]) => block);
    if (content.length === 0) continue;
    add(accumulator.turn, accumulator.step, {
      id: `stream:${accumulator.turn}:${accumulator.step}:${accumulator.seq}`,
      kind: "assistant",
      label: accumulator.finished === "error" ? "Assistant · interrupted" : "Assistant · streaming",
      preview: contentPreview(content, "Assistant response"),
      raw: accumulator.raw,
      seq: accumulator.seq,
      step: accumulator.step,
      ...(accumulator.time === undefined ? {} : { time: accumulator.time }),
      status: accumulator.finished ?? "running",
      ...(accumulator.usage ?? {}),
      content,
    });
  }

  return [...turns.entries()].map(([id, turn]) => ({
    id,
    label: turn.label,
    ...(turn.status === undefined ? {} : { status: turn.status }),
    ...(turn.startedAt === undefined ? {} : { startedAt: turn.startedAt }),
    ...(turn.endedAt === undefined ? {} : { endedAt: turn.endedAt }),
    groups: [...turn.groups.entries()].map(([groupId, group]) => ({ id: groupId, label: group.label, rows: group.rows.toSorted((left, right) => (left.seq ?? Number.MAX_SAFE_INTEGER) - (right.seq ?? Number.MAX_SAFE_INTEGER)) })),
  })).filter((turn) => turn.groups.some((group) => group.rows.length > 0));
}

const kindStyle: Record<TraceKind, { dot: string; lane: number; label: string }> = {
  user: { dot: "bg-fg-brand", lane: 0, label: "USER" },
  assistant: { dot: "bg-fg-success", lane: 1, label: "ASSISTANT" },
  tool: { dot: "bg-fg-warning", lane: 2, label: "TOOL" },
  system: { dot: "bg-fg-muted", lane: 0, label: "SYSTEM" },
  context: { dot: "bg-fg-info", lane: 0, label: "CONTEXT" },
  event: { dot: "bg-fg-subtle", lane: 0, label: "EVENT" },
};

const kindBadgeColor: Record<TraceKind, BadgeColor> = {
  user: "blue",
  assistant: "green",
  tool: "amber",
  system: "gray",
  context: "indigo",
  event: "gray",
};

type InspectorTab = "summary" | "preview" | "raw" | "source" | "input" | "output" | "schema" | "timing";
type TimelineRange = { start: number; end: number };

const desktopQuery = "(min-width: 1024px)";

function subscribeToDesktopLayout(listener: () => void) {
  const media = window.matchMedia(desktopQuery);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

function desktopLayoutSnapshot() {
  return window.matchMedia(desktopQuery).matches;
}

/** Keeps mobile Trace content stacked rather than squeezing a horizontal split pane. */
function useDesktopLayout() {
  return useSyncExternalStore(subscribeToDesktopLayout, desktopLayoutSnapshot, () => false);
}

function TraceSplitLayout({ desktop, children }: { desktop: boolean; children: ReactNode }) {
  const panels = Children.toArray(children);

  if (!desktop || panels.length !== 2) {
    return <div className="flex min-h-0 flex-1 flex-col">{children}</div>;
  }

  return (
    <ResizablePanelGroup
      id="agent-trace-layout"
      orientation="horizontal"
      resizeTargetMinimumSize={{ fine: 12, coarse: 24 }}
      className="min-h-0 flex-1"
    >
      <ResizablePanel id="agent-trace-ledger" defaultSize="68%" minSize="28rem">
        <div className="size-full min-h-0 min-w-0 [&>[data-slot=scroll-area]]:size-full">
          {panels[0]}
        </div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel id="agent-trace-inspector" defaultSize="32%" minSize="18rem" maxSize="30rem">
        {panels[1]}
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}

function rawJson(value: unknown): string {
  try { return JSON.stringify(value, null, 2); } catch { return String(value); }
}

function compactNumber(value: number | undefined): string {
  if (value === undefined) return "—";
  const absolute = Math.abs(value);
  if (absolute >= 1_000_000) return `${(value / 1_000_000).toFixed(2)} M`;
  if (absolute >= 1_000) return `${(value / 1_000).toFixed(2)} K`;
  return new Intl.NumberFormat("en").format(value);
}

function formatDuration(milliseconds: number | undefined): string {
  if (milliseconds === undefined) return "—";
  if (milliseconds < 1000) return `${Math.round(milliseconds)} ms`;
  return `${(milliseconds / 1000).toFixed(milliseconds < 10_000 ? 2 : 1)} s`;
}

function turnMetrics(turn: AgentTraceTurn): Pick<AgentTraceRow, "input" | "output" | "think" | "durationMs"> {
  const rows = turn.groups.flatMap((group) => group.rows);
  const assistantRows = rows.filter((row) => row.kind === "assistant");
  const total = (key: "input" | "output" | "think") => {
    const values = assistantRows.flatMap((row) => row[key] === undefined ? [] : [row[key]]);
    return values.length ? values.reduce((sum, value) => sum + value, 0) : undefined;
  };
  const timedRows = rows.flatMap((row) => row.time === undefined ? [] : [{ start: row.time, end: row.time + (row.durationMs ?? 0) }]);
  const startedAt = turn.startedAt ?? (timedRows.length ? Math.min(...timedRows.map((row) => row.start)) : undefined);
  const endedAt = turn.endedAt ?? (timedRows.length ? Math.max(...timedRows.map((row) => row.end)) : undefined);

  return {
    ...(total("input") === undefined ? {} : { input: total("input") }),
    ...(total("output") === undefined ? {} : { output: total("output") }),
    ...(total("think") === undefined ? {} : { think: total("think") }),
    ...(startedAt === undefined || endedAt === undefined ? {} : { durationMs: Math.max(0, endedAt - startedAt) }),
  };
}

function TurnStatusIcon({ status }: { status: AgentTraceTurn["status"] }) {
  const state = status ?? "running";
  const presentation = {
    completed: { label: "Completed", icon: "check" as IconName, className: "bg-fg-success" },
    error: { label: "Error", icon: "x" as IconName, className: "bg-fg-danger" },
    aborted: { label: "Aborted", icon: "pause" as IconName, className: "bg-fg-warning" },
    running: { label: "Running", icon: "loader" as IconName, className: "bg-fg-info" },
  }[state];

  return <span role="img" aria-label={`Turn status: ${presentation.label}`} title={presentation.label} className={cn("grid size-4 shrink-0 place-items-center rounded-sm text-white", presentation.className)}><TraceIcon name={presentation.icon} size={14} className={state === "running" ? "animate-spin" : undefined} /></span>;
}

function primaryEvent(row: AgentTraceRow): JsonRecord | null {
  const raw = record(row.raw);
  return record(raw?.call) ?? raw;
}

function resultEvent(row: AgentTraceRow): JsonRecord | null {
  return record(record(row.raw)?.result);
}

function rowData(row: AgentTraceRow): JsonRecord | null {
  const event = primaryEvent(row);
  return event ? eventData(event) : null;
}

function resultData(row: AgentTraceRow): JsonRecord | null {
  const event = resultEvent(row);
  return event ? eventData(event) : null;
}

function rowMessage(row: AgentTraceRow): JsonRecord | null {
  const data = rowData(row);
  return record(data?.message) ?? data;
}

function contentText(value: unknown): string {
  const blocks = traceContentBlocks(value);
  if (blocks.length) return blocks.map((block) => block.text).filter(Boolean).join("\n\n");
  return plainText(value);
}

function rowSource(row: AgentTraceRow): unknown {
  const message = rowMessage(row);
  const data = rowData(row);
  const result = resultData(row);
  const resultMessage = record(result?.message);
  return message?.source ?? resultMessage?.source ?? result?.source ?? data?.source;
}

function sourceLabel(source: unknown): string {
  const value = record(source);
  if (!value) return "Not recorded";
  if (value.kind === "user") return "User";
  if (value.kind === "tool") return "Tool";
  if (value.kind === "plugin") return typeof value.plugin === "string" ? `Plugin · ${value.plugin}` : "Plugin";
  if (value.kind === "model") {
    const provider = typeof value.provider === "string" ? value.provider : "Model";
    const model = typeof value.model === "string" ? value.model : undefined;
    return model ? `${provider} · ${model}` : provider;
  }
  return typeof value.kind === "string" ? value.kind : "Recorded source";
}

function rowUsage(row: AgentTraceRow): { input?: number; cacheRead?: number; cacheWrite?: number; output?: number; reasoning?: number } {
  const data = rowData(row);
  const message = rowMessage(row);
  const usage = record(data?.usage) ?? record(message?.usage);
  if (!usage) return {};
  const input = numberValue(usage.inputTokens) ?? numberValue(usage.input);
  const cacheRead = numberValue(usage.cacheReadTokens) ?? numberValue(usage.cacheRead);
  const cacheWrite = numberValue(usage.cacheWriteTokens) ?? numberValue(usage.cacheWrite);
  const output = numberValue(usage.outputTokens) ?? numberValue(usage.output);
  const reasoning = numberValue(usage.reasoningTokens) ?? numberValue(usage.think);
  return { ...(input === undefined ? {} : { input }), ...(cacheRead === undefined ? {} : { cacheRead }), ...(cacheWrite === undefined ? {} : { cacheWrite }), ...(output === undefined ? {} : { output }), ...(reasoning === undefined ? {} : { reasoning }) };
}

function assistantReasoning(row: AgentTraceRow): string {
  if (row.content) return row.content.filter((block) => block.kind === "reasoning").map((block) => block.text).filter(Boolean).join("\n\n");
  return traceContentBlocks(rowMessage(row)?.content).filter((block) => block.kind === "reasoning").map((block) => block.text).filter(Boolean).join("\n\n");
}

function assistantOutput(row: AgentTraceRow): string {
  if (row.content) return row.content.filter((block) => block.kind === "text" || block.kind === "unknown").map((block) => block.text).filter(Boolean).join("\n\n");
  return traceContentBlocks(rowMessage(row)?.content).filter((block) => block.kind === "text" || block.kind === "unknown").map((block) => block.text).filter(Boolean).join("\n\n");
}

function toolCalls(row: AgentTraceRow): readonly AgentTraceContentBlock[] {
  if (row.content) return row.content.filter((block) => block.kind === "tool-call");
  return traceContentBlocks(rowMessage(row)?.content).filter((block) => block.kind === "tool-call");
}

function rowInput(row: AgentTraceRow): string {
  const data = rowData(row);
  if (row.kind === "tool") return typeof data?.arguments === "string" ? data.arguments : data?.arguments === undefined ? "No payload captured." : rawJson(data.arguments);
  if (row.kind === "assistant" && row.content) return row.content.map((block) => block.kind === "tool-call" ? `${block.name ?? "tool"}: ${block.text}` : block.text).filter(Boolean).join("\n\n");
  if (row.kind === "assistant") return contentText(rowMessage(row)?.content);
  return contentText(data?.content ?? data?.message ?? row.preview);
}

function rowOutput(row: AgentTraceRow): string {
  if (row.kind === "assistant") return assistantOutput(row) || "No output recorded.";
  if (row.kind === "tool") {
    const result = resultData(row);
    const message = record(result?.message);
    return contentText(message?.content ?? result?.content) || row.result || "No result captured.";
  }
  return row.result ?? "No output recorded.";
}

function inspectorTabs(row: AgentTraceRow): readonly { id: InspectorTab; label: string }[] {
  if (row.kind === "tool") return [
    { id: "summary", label: "Summary" },
    { id: "input", label: "Payload" },
    { id: "output", label: "Result" },
    { id: "schema", label: "Schema" },
    { id: "timing", label: "Timing" },
  ];
  if (row.kind === "user" || row.kind === "assistant" || row.kind === "context") return [
    { id: "summary", label: "Summary" },
    { id: "preview", label: "Preview" },
    { id: "raw", label: "Raw" },
    ...(rowSource(row) === undefined ? [] : [{ id: "source" as const, label: "Source" }]),
  ];
  return [
    { id: "summary", label: "Summary" },
    { id: "input", label: "Payload" },
    { id: "raw", label: "Raw" },
    ...(rowSource(row) === undefined ? [] : [{ id: "source" as const, label: "Source" }]),
  ];
}

function InspectorCode({ children, error = false }: { children: string; error?: boolean }) {
  return <pre className={cn("overflow-x-auto whitespace-pre-wrap break-words text-sm leading-5 text-fg-muted", error && "text-fg-danger")}>{children}</pre>;
}

function InspectorSummary({ row, formatTime }: { row: AgentTraceRow; formatTime: (value: number | undefined) => string }) {
  const usage = rowUsage(row);
  const source = rowSource(row);
  return <InfoItemGroup>
    <InspectorInfoItem title="Status">{row.status ?? "Recorded"}</InspectorInfoItem>
    {source !== undefined && <InspectorInfoItem title="Source">{sourceLabel(source)}</InspectorInfoItem>}
    <InspectorInfoItem title="Sequence">#{row.seq ?? "—"}</InspectorInfoItem>
    {row.kind === "assistant" && <><InspectorInfoItem title="Input">{usage.input === undefined ? "Not reported" : `${compactNumber(usage.input)} tok`}</InspectorInfoItem>{usage.cacheRead !== undefined && <InspectorInfoItem title="Cached">{compactNumber(usage.cacheRead)} tok</InspectorInfoItem>}{usage.cacheWrite !== undefined && <InspectorInfoItem title="Cache created">{compactNumber(usage.cacheWrite)} tok</InspectorInfoItem>}<InspectorInfoItem title="Output">{usage.output === undefined ? "Not reported" : `${compactNumber(usage.output)} tok`}</InspectorInfoItem>{usage.reasoning !== undefined && <InspectorInfoItem title="Reasoning">{compactNumber(usage.reasoning)} tok</InspectorInfoItem>}</>}
    {row.callId && <InspectorInfoItem title="Call ID">{row.callId}</InspectorInfoItem>}
    <InspectorInfoItem title="Started">{formatTime(row.time)}</InspectorInfoItem>
    <InspectorInfoItem title="Duration">{formatDuration(row.durationMs)}</InspectorInfoItem>
  </InfoItemGroup>;
}

function InspectorPreview({ row }: { row: AgentTraceRow }) {
  const reasoning = row.kind === "assistant" ? assistantReasoning(row) : "";
  const output = row.kind === "assistant" ? assistantOutput(row) : row.kind === "tool" ? rowOutput(row) : rowInput(row);
  const calls = row.kind === "assistant" ? toolCalls(row) : [];
  return <div className="space-y-3">
    {reasoning && <details className="rounded-lg border border-border-subtle p-2.5 text-sm text-fg-muted"><summary className="cursor-pointer font-normal text-fg-default">Thinking</summary><InspectorCode>{reasoning}</InspectorCode></details>}
    {output && <InspectorCode>{output}</InspectorCode>}
    {calls.map((call, index) => <section key={`${call.name ?? "tool-call"}:${index}`} className="rounded-lg border border-border-subtle p-2.5"><p className="text-sm font-normal text-fg-default">Tool call · {call.name ?? "Unknown"}</p><InspectorCode>{call.text}</InspectorCode></section>)}
  </div>;
}

function InspectorSchema({ row }: { row: AgentTraceRow }) {
  const data = rowData(row);
  const schema = data?.schema ?? data?.parameters;
  return schema === undefined ? <p className="text-sm text-fg-muted">Schema unavailable in this JSONL record.</p> : <InspectorCode>{rawJson(schema)}</InspectorCode>;
}

function InspectorInfoItem({ children, title }: { children: ReactNode; title: string }) {
  return <InfoItem><InfoItemContent><InfoItemTitle className="text-sm font-normal">{title}</InfoItemTitle><InfoItemDescription className="text-sm">{children}</InfoItemDescription></InfoItemContent></InfoItem>;
}

/** A high-fidelity, browser-local replica of DSH's Trajectory ledger. */
export function AgentTrace({
  allowUpload = true,
  className,
  data,
  defaultView = "trace",
  timeZone = DEFAULT_TRACE_TIME_ZONE,
  locale = DEFAULT_TRACE_LOCALE,
  onDataChange,
  title = "Trajectory",
  ...props
}: AgentTraceProps) {
  const [localData, setLocalData] = useState<unknown>(defaultAgentTracePayload);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [durationMode, setDurationMode] = useState(true);
  const [collapsedTurns, setCollapsedTurns] = useState<Set<string>>(new Set());
  const [hideCalls, setHideCalls] = useState(false);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>("summary");
  const [range, setRange] = useState<TimelineRange | null>(null);
  const [view, setView] = useState<AgentTraceView>(defaultView);
  const [activeDisplayControl, setActiveDisplayControl] = useState<TraceDisplayControl>("duration");
  const [replayIndex, setReplayIndex] = useState<number | null>(null);
  const desktopLayout = useDesktopLayout();
  const inputRef = useRef<HTMLInputElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const pointerStart = useRef<number | null>(null);
  const payload = data ?? localData;
  const replayEntries = useMemo(() => traceEntries(payload), [payload]);
  const turns = useMemo(() => normalizeAgentTracePayload(payload), [payload]);
  const rows = useMemo(() => turns.flatMap((turn) => turn.groups.flatMap((group) => group.rows)), [turns]);
  const transcript = useMemo(() => projectAgentTranscript(replayIndex === null ? replayEntries : replayEntries.slice(0, replayIndex)), [replayEntries, replayIndex]);
  const selected = rows.find((row) => row.id === selectedId) ?? null;
  const times = rows.flatMap((row) => row.time === undefined ? [] : [row.time]);
  const domainStart = times.length ? Math.min(...times) : 0;
  const domainEnd = times.length ? Math.max(...times, domainStart + 1) : 1;
  const domainDuration = Math.max(1, domainEnd - domainStart);
  const query = search.trim().toLocaleLowerCase();
  const formatTime = (value: number | undefined) => formatTraceTime(value, { locale, precision: "millisecond", timeZone }) || "—";
  const allTurnsCollapsed = turns.length > 0 && turns.every((turn) => collapsedTurns.has(turn.id));
  const replaying = replayIndex !== null;

  useEffect(() => {
    if (replayIndex === null) return;
    if (replayIndex >= replayEntries.length) {
      setReplayIndex(null);
      return;
    }
    const current = record(replayEntries[replayIndex]);
    const previous = replayIndex > 0 ? record(replayEntries[replayIndex - 1]) : null;
    const gap = (eventTime(current ?? {}) ?? 0) - (eventTime(previous ?? {}) ?? 0);
    const delay = replayIndex === 0 ? 0 : Math.min(480, Math.max(36, gap));
    const timer = window.setTimeout(() => setReplayIndex((index) => index === null ? null : index + 1), delay);
    return () => window.clearTimeout(timer);
  }, [replayEntries, replayIndex]);

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const next = parseAgentTracePayload(await file.text());
      if (envelopeEntries(next).length === 0) throw new Error("No messages or events were found.");
      setLocalData(next);
      onDataChange?.(next);
      setSelectedId(null);
      setRange(null);
      setReplayIndex(null);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to read that JSON file.");
    }
  };

  const pointerTime = (clientX: number) => {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return domainStart;
    const fraction = Math.max(0, Math.min(1, (clientX - rect.left) / Math.max(1, rect.width)));
    return domainStart + domainDuration * fraction;
  };
  const beginRange = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    const start = pointerTime(event.clientX);
    pointerStart.current = start;
    setRange({ start, end: start });
  };
  const moveRange = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (pointerStart.current === null) return;
    setRange({ start: pointerStart.current, end: pointerTime(event.clientX) });
  };
  const endRange = () => {
    if (range && Math.abs(range.end - range.start) < domainDuration * 0.012) setRange(null);
    pointerStart.current = null;
  };

  return (
    <PageLayout
      className={cn("min-h-[42rem]", className)}
      {...props}
    >
      <PageHeader>
        <PageHeaderContent>
          <PageTitle className="truncate text-body font-semibold">{title}</PageTitle>
        </PageHeaderContent>
      </PageHeader>

      <PageContent>
        <PageBody className="flex max-w-none flex-col overflow-hidden">
          <Tabs value={view} onValueChange={(value) => setView(value as AgentTraceView)} variant="pill" color="neutral" className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-center justify-between border-b border-border">
              <TabsList className="!bg-transparent !rounded-none px-3 py-2" aria-label="Agent workspace">
                <TabItem value="chat" label="Chat" />
                <TabItem value="trace" label="Trace" />
              </TabsList>
              <div className="flex shrink-0 items-center gap-1 px-3 py-2">
                {view === "chat" && <Button type="button" size="sm" variant={replaying ? "secondary" : "tertiary"} onClick={() => setReplayIndex(replaying ? null : 0)}>{replaying ? "Stop replay" : "Replay"}</Button>}
                <Tooltip content="Load sample"><Button type="button" size="md" variant="tertiary" iconOnly aria-label="Load sample" className="[&_svg]:!size-4" onClick={() => { setLocalData(defaultAgentTracePayload); onDataChange?.(defaultAgentTracePayload); setError(null); setSelectedId(null); setReplayIndex(null); }}><TraceIcon name="rotate-ccw" /></Button></Tooltip>
                {allowUpload && <><input ref={inputRef} className="sr-only" type="file" accept="application/json,application/x-ndjson,.json,.jsonl,.ndjson" onChange={(event) => { void importFile(event.target.files?.[0]); event.currentTarget.value = ""; }} /><Tooltip content="Upload JSON"><Button type="button" size="md" variant="tertiary" iconOnly aria-label="Upload JSON" className="[&_svg]:!size-4" onClick={() => inputRef.current?.click()}><TraceIcon name="upload" /></Button></Tooltip></>}
              </div>
            </div>
            <TabPanel value="chat" className="min-h-0 flex-1">
              <TranscriptFlow items={transcript} replaying={replaying} timeZone={timeZone} locale={locale} />
            </TabPanel>
            <TabPanel value="trace" className="flex min-h-0 flex-1 flex-col [&_[role=tab]_*]:!font-normal">
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border bg-surface-raised px-3 py-2">
                <Tabs value={activeDisplayControl} onValueChange={(value) => setActiveDisplayControl(value as TraceDisplayControl)} variant="segment" color="neutral" aria-label="Trace display controls">
                  <TabsList labelVisibility="active" className="my-0">
                    <TabItem value="duration" icon={DurationTabIcon} label="Duration" onClick={() => setDurationMode((current) => !current)} />
                    <TabItem value="turns" icon={TurnsTabIcon} label="Turns" onClick={() => setCollapsedTurns(allTurnsCollapsed ? new Set() : new Set(turns.map((turn) => turn.id)))} />
                    <TabItem value="calls" icon={CallsTabIcon} label="Calls" onClick={() => setHideCalls((current) => !current)} />
                  </TabsList>
                </Tabs>
                <label className="relative w-32 sm:w-40"><span className="sr-only">Search trace</span><span aria-hidden="true" className="pointer-events-none absolute left-2 top-1/2 z-content -translate-y-1/2 text-fg-subtle"><TraceIcon name="search" /></span><Input size="md" type="text" role="searchbox" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search trace" aria-label="Search trace" className={cn("pl-7", query && "pr-8")} />{query && <Button type="button" size="xs" variant="ghost" iconOnly aria-label="Clear trace search" onClick={() => setSearch("")} className="absolute right-1 top-1/2 z-content -translate-y-1/2"><TraceIcon name="x" /></Button>}</label>
              </div>
              {error && <p role="alert" className="border-b border-danger-border bg-danger-surface-subtle px-3 py-2 text-label text-fg-danger">{error}</p>}
      <section className="grid shrink-0 grid-cols-[48px_minmax(0,1fr)] border-b border-border bg-surface-raised" aria-label="Trajectory overview">
        <div className="relative border-r border-border text-label text-fg-subtle"><span className="absolute right-1 top-1">Input</span><span className="absolute right-1 top-[20px]">Model</span><span className="absolute right-1 top-[35px]">Tools</span></div>
        <div ref={timelineRef} onPointerDown={beginRange} onPointerMove={moveRange} onPointerUp={endRange} onPointerCancel={endRange} onContextMenu={(event) => { event.preventDefault(); setRange(null); }} className="relative h-[50px] cursor-crosshair overflow-hidden touch-none">
          {range && <span className="absolute inset-y-0 bg-brand/10" style={{ left: `${(Math.min(range.start, range.end) - domainStart) / domainDuration * 100}%`, width: `${Math.abs(range.end - range.start) / domainDuration * 100}%` }} />}
          {rows.map((row, index) => {
            const style = kindStyle[row.kind];
            const left = row.time === undefined ? index / Math.max(1, rows.length) * 100 : (row.time - domainStart) / domainDuration * 100;
            const width = durationMode && row.durationMs ? Math.max(0.8, row.durationMs / domainDuration * 100) : Math.max(1.2, 86 / Math.max(1, rows.length));
            const inRange = range === null || row.time === undefined || row.time >= Math.min(range.start, range.end) && row.time <= Math.max(range.start, range.end);
            return <Tooltip key={row.id} content={<span className="block max-w-64 whitespace-pre-wrap">{style.label} · {row.label}{"\n"}{formatTime(row.time)} · {formatDuration(row.durationMs)}</span>}><button type="button" onClick={(event) => { event.stopPropagation(); setSelectedId(row.id); setInspectorTab("summary"); }} aria-label={`${style.label}: ${row.label}`} className={cn("absolute h-2 rounded-[2px] outline-none transition-opacity focus-visible:ring-1 focus-visible:ring-focus-ring", style.dot, selected?.id === row.id && "ring-1 ring-fg-default ring-offset-1 ring-offset-surface-raised", !inRange && "opacity-20")} style={{ top: `${7 + style.lane * 14}px`, left: `${Math.min(98.5, left)}%`, width: `${Math.min(100 - left, width)}%` }} /></Tooltip>;
          })}
        </div>
      </section>

      {turns.length === 0 ? <div className="flex min-h-48 flex-1 items-center justify-center text-body text-fg-muted">No renderable message records found in this JSON.</div> : <TraceSplitLayout desktop={desktopLayout}>
        <ScrollArea className="min-h-0 min-w-0 flex-1" viewportClassName="h-full" orientation="both">
          <Table className="w-full min-w-[720px] table-fixed border-collapse text-sm">
            <colgroup><col className="w-12" /><col className="w-28" /><col /><col className="w-[4.5rem]" /><col className="w-[4.5rem]" /><col className="w-[4.5rem]" /><col className="w-[4.5rem]" /></colgroup>
            <TableHeader className="sticky top-0 z-20 bg-surface-raised text-fg-subtle"><TableRow className="h-8 border-b border-border"><TableHead className="px-2 text-right text-sm font-normal">#</TableHead><TableHead className="px-2 text-left text-sm font-normal">Event</TableHead><TableHead className="px-2 text-left text-sm font-normal">Content</TableHead><TableHead className="px-2 text-right text-sm font-normal">Input</TableHead><TableHead className="px-2 text-right text-sm font-normal">Output</TableHead><TableHead className="px-2 text-right text-sm font-normal">Think</TableHead><TableHead className="px-2 text-right text-sm font-normal">Time</TableHead></TableRow></TableHeader>
            <TableBody>{turns.map((turn) => {
              const collapsed = collapsedTurns.has(turn.id);
              const metrics = turnMetrics(turn);
              return <Fragment key={turn.id}><TableRow className="sticky top-8 z-10 border-y border-border bg-surface-base"><TableCell colSpan={7} className="h-8 px-2"><button type="button" onClick={() => setCollapsedTurns((current) => { const next = new Set(current); if (next.has(turn.id)) next.delete(turn.id); else next.add(turn.id); return next; })} className="flex w-full items-center gap-2 text-left outline-none focus-visible:ring-1 focus-visible:ring-focus-ring"><span className="text-fg-muted">{collapsed ? "▸" : "▾"}</span><TurnStatusIcon status={turn.status} /><span className="font-normal text-fg-default">{turn.label}</span><span className="ml-auto grid w-[18rem] grid-cols-4 text-right font-normal tabular-nums text-fg-subtle"><span title="Input">{compactNumber(metrics.input)}</span><span title="Output">{compactNumber(metrics.output)}</span><span title="Think">{compactNumber(metrics.think)}</span><span title="Time">{formatDuration(metrics.durationMs)}</span></span></button></TableCell></TableRow>
                {!collapsed && turn.groups.map((group) => <Fragment key={`${turn.id}:${group.id}`}>
                  <TableRow className="border-b border-border-subtle bg-surface-raised/60"><TableCell colSpan={7} className="h-7 px-2 text-xs font-normal text-fg-subtle"><span>{group.label}</span><span className="ml-2">{group.rows.length} record{group.rows.length === 1 ? "" : "s"}</span></TableCell></TableRow>
                  {group.rows.filter((row) => !hideCalls || row.kind !== "tool").map((row) => {
                    const style = kindStyle[row.kind];
                    const match = !query || `${row.label} ${row.preview} ${row.result ?? ""} ${row.callId ?? ""}`.toLocaleLowerCase().includes(query);
                    const inRange = range === null || row.time === undefined || row.time >= Math.min(range.start, range.end) && row.time <= Math.max(range.start, range.end);
                    const selectedRow = selected?.id === row.id;
                    return <TableRow key={row.id} tabIndex={0} onClick={() => { setSelectedId(row.id); setInspectorTab("summary"); }} className={cn("h-9 cursor-pointer border-b border-border-subtle outline-none transition-colors focus-visible:ring-1 focus-visible:ring-focus-ring", selectedRow ? "bg-info-surface hover:bg-info-surface" : "hover:bg-hover", (!match || !inRange) && "opacity-25")}>
                      <TableCell className="px-2 text-right tabular-nums text-fg-subtle">{row.seq ? `#${row.seq}` : ""}</TableCell>
                      <TableCell className="px-2"><Badge size="sm" className="!font-normal" color={kindBadgeColor[row.kind]}>{style.label}</Badge></TableCell>
                      <TableCell className="px-2"><div className="flex min-w-0 items-center gap-2"><span className="shrink-0 font-normal text-fg-default">{row.label}</span><span className="truncate text-fg-muted">{row.preview}</span>{row.result && <span className={cn("truncate text-fg-subtle", row.status === "error" && "text-fg-danger")}>→ {row.result}</span>}</div></TableCell>
                      <TableCell className="px-2 text-right tabular-nums text-fg-subtle">{row.kind === "assistant" ? compactNumber(row.input) : ""}</TableCell><TableCell className="px-2 text-right tabular-nums text-fg-subtle">{row.kind === "assistant" ? compactNumber(row.output) : ""}</TableCell><TableCell className="px-2 text-right tabular-nums text-fg-subtle">{row.kind === "assistant" ? compactNumber(row.think) : ""}</TableCell><TableCell className="px-2 text-right tabular-nums text-fg-subtle">{formatDuration(row.durationMs)}</TableCell>
                    </TableRow>;
                  })}
                </Fragment>)}</Fragment>;
            })}</TableBody>
          </Table>
        </ScrollArea>
        {selected && <aside className="flex min-h-[18rem] w-full shrink-0 flex-col border-t border-border bg-surface-raised text-sm lg:h-full lg:border-l lg:border-t-0" aria-label="Record inspector">
          <Tabs value={inspectorTab} onValueChange={(value) => setInspectorTab(value as InspectorTab)} variant="underline" color="neutral" className="flex min-h-0 flex-1 flex-col">
            <header className="border-b border-border px-3 py-2"><div className="flex items-center justify-between gap-2"><span className="text-sm text-fg-subtle">Record #{selected.seq ?? "—"}</span><Badge size="sm" className="!font-normal" color={selected.status === "error" ? "red" : selected.kind === "tool" ? "amber" : "blue"}>{kindStyle[selected.kind].label}</Badge></div><h3 className="mt-1 text-sm font-normal text-fg-default">{selected.label}</h3></header>
            <TabsList className="mx-0 px-2" aria-label="Inspector tabs">{inspectorTabs(selected).map((tab) => <TabItem key={tab.id} value={tab.id} label={tab.label} />)}</TabsList>
            <ScrollArea className="min-h-0 flex-1" viewportClassName="h-full" orientation="vertical">
              <TabPanel value="summary" className="p-3"><InspectorSummary formatTime={formatTime} row={selected} /></TabPanel>
              <TabPanel value="preview" className="p-3"><InspectorPreview row={selected} /></TabPanel>
              <TabPanel value="input" className="p-3"><InspectorCode>{rowInput(selected)}</InspectorCode></TabPanel>
              <TabPanel value="output" className="p-3"><InspectorCode error={selected.status === "error"}>{rowOutput(selected)}</InspectorCode></TabPanel>
              <TabPanel value="schema" className="p-3"><InspectorSchema row={selected} /></TabPanel>
              <TabPanel value="timing" className="p-3"><InfoItemGroup><InspectorInfoItem title="Started">{formatTime(selected.time)}</InspectorInfoItem><InspectorInfoItem title="Duration">{formatDuration(selected.durationMs)}</InspectorInfoItem><InspectorInfoItem title="Timing source">{selected.time === undefined ? "Not available" : "Session timestamps"}</InspectorInfoItem></InfoItemGroup></TabPanel>
              <TabPanel value="raw" className="p-3"><InspectorCode>{rawJson(primaryEvent(selected) ?? selected.raw)}</InspectorCode></TabPanel>
              <TabPanel value="source" className="p-3"><InspectorCode>{rowSource(selected) === undefined ? "Source not recorded." : rawJson(rowSource(selected))}</InspectorCode></TabPanel>
            </ScrollArea>
          </Tabs>
        </aside>}
      </TraceSplitLayout>}
            </TabPanel>
          </Tabs>
        </PageBody>
      </PageContent>
    </PageLayout>
  );
}
