export type AgentTranscriptBlock = {
  kind: "text" | "reasoning" | "tool-call" | "unknown";
  text: string;
  name?: string;
  callId?: string;
};

export type AgentTranscriptItem =
  | { id: string; kind: "user" | "system" | "context"; seq: number; time?: number; text: string }
  | { id: string; kind: "assistant"; seq: number; time?: number; status: "running" | "settled" | "interrupted"; blocks: readonly AgentTranscriptBlock[]; input?: number; output?: number; think?: number }
  | { id: string; kind: "tool"; seq: number; time?: number; name: string; argumentsText: string; result?: string; status: "running" | "success" | "error"; durationMs?: number };

type JsonRecord = Record<string, unknown>;

type AssistantState = {
  id: string;
  seq: number;
  time?: number;
  turn: number;
  step: number;
  status: "running" | "settled" | "interrupted";
  blocks: Map<number, AgentTranscriptBlock>;
  input?: number;
  output?: number;
  think?: number;
};

type ToolState = Extract<AgentTranscriptItem, { kind: "tool" }>;

function record(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : null;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function text(value: unknown): string {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join("\n");
  const item = record(value);
  if (!item) return "";
  for (const key of ["text", "content", "output", "input", "reasoning", "thinking", "arguments"]) {
    if (item[key] !== undefined) {
      const resolved = text(item[key]);
      if (resolved) return resolved;
    }
  }
  try {
    return JSON.stringify(value);
  } catch {
    return "[unserializable value]";
  }
}

function sourceType(item: JsonRecord): string {
  if (typeof item.type === "string") return item.type;
  if (typeof item.role === "string") return `${item.role}/message`;
  return "event";
}

function dataOf(item: JsonRecord): JsonRecord {
  return record(item.data) ?? item;
}

function coordinates(item: JsonRecord): { turn?: number; step?: number } {
  const data = dataOf(item);
  return {
    turn: numberValue(item.turn) ?? numberValue(data.turn),
    step: numberValue(item.step) ?? numberValue(data.step),
  };
}

function timeOf(item: JsonRecord): number | undefined {
  const data = dataOf(item);
  for (const value of [item.time, item.timestamp, item.createdAt, data.time, data.timestamp]) {
    const numeric = numberValue(value);
    if (numeric !== undefined) return numeric;
    if (typeof value === "string") {
      const parsed = Date.parse(value);
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function blocksOf(value: unknown): AgentTranscriptBlock[] {
  const values = Array.isArray(value) ? value : value === undefined ? [] : [value];
  return values.flatMap((value): AgentTranscriptBlock[] => {
    const block = record(value);
    const type = typeof block?.type === "string" ? block.type : "unknown";
    if (type === "text") return [{ kind: "text", text: text(block?.text) }];
    if (type === "reasoning") return [{ kind: "reasoning", text: text(block?.text) }];
    if (type === "tool-call") return [{
      kind: "tool-call",
      text: text(block?.arguments ?? block?.args),
      name: typeof block?.name === "string" ? block.name : "Tool call",
      callId: typeof block?.id === "string" ? block.id : undefined,
    }];
    return [{ kind: "unknown", text: text(value) }];
  }).filter((block) => block.text || block.kind === "tool-call");
}

function usageOf(value: unknown): Pick<AssistantState, "input" | "output" | "think"> {
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

function itemText(data: JsonRecord, item: JsonRecord): string {
  return text(data.content ?? data.message ?? item.content);
}

function sortedBlocks(blocks: ReadonlyMap<number, AgentTranscriptBlock>): AgentTranscriptBlock[] {
  return [...blocks.entries()].sort(([left], [right]) => left - right).map(([, block]) => block);
}

function visibleAssistant(state: AssistantState): boolean {
  return sortedBlocks(state.blocks).some((block) => block.kind !== "tool-call" && block.text.trim() !== "");
}

function finalStatus(reason: unknown): "settled" | "interrupted" {
  const kind = record(reason)?.kind;
  return kind === "error" || kind === "aborted" || kind === "interrupted" ? "interrupted" : "settled";
}

/**
 * Projects raw session events into stable Chat keys. Replaying a prefix and a
 * live stream share this reducer, so a Step or tool call updates in place.
 */
export function projectAgentTranscript(entries: readonly unknown[]): readonly AgentTranscriptItem[] {
  const assistants = new Map<string, AssistantState>();
  const tools = new Map<string, ToolState>();
  const records: AgentTranscriptItem[] = [];
  const rows = new Map<string, AgentTranscriptItem>();

  const write = (next: AgentTranscriptItem) => {
    if (!rows.has(next.id)) records.push(next);
    rows.set(next.id, next);
  };
  const publishAssistant = (state: AssistantState) => {
    if (!visibleAssistant(state)) return;
    write({
      id: state.id,
      kind: "assistant",
      seq: state.seq,
      ...(state.time === undefined ? {} : { time: state.time }),
      status: state.status,
      blocks: sortedBlocks(state.blocks),
      ...(state.input === undefined ? {} : { input: state.input }),
      ...(state.output === undefined ? {} : { output: state.output }),
      ...(state.think === undefined ? {} : { think: state.think }),
    });
  };

  for (const [index, value] of entries.entries()) {
    const item = record(value);
    if (!item) continue;
    const type = sourceType(item);
    const data = dataOf(item);
    const seq = numberValue(item.seq) ?? index + 1;
    const time = timeOf(item);
    const { turn, step } = coordinates(item);

    if (type === "assistant/chunk" && turn !== undefined && step !== undefined) {
      const key = `${turn}:${step}`;
      const state = assistants.get(key) ?? {
        id: `assistant:${key}`,
        seq,
        ...(time === undefined ? {} : { time }),
        turn,
        step,
        status: "running" as const,
        blocks: new Map<number, AgentTranscriptBlock>(),
      };
      const chunk = record(data.chunk);
      const chunkType = typeof chunk?.type === "string" ? chunk.type : "";
      const blockIndex = numberValue(chunk?.index);
      if (chunkType === "usage") Object.assign(state, usageOf(chunk?.usage));
      else if (chunkType === "finish") state.status = finalStatus(chunk?.reason);
      else if (blockIndex !== undefined) {
        const previous = state.blocks.get(blockIndex);
        if (chunkType === "block-start") {
          const blockType = chunk?.blockType;
          state.blocks.set(blockIndex, { kind: blockType === "text" ? "text" : blockType === "reasoning" ? "reasoning" : blockType === "tool-call" ? "tool-call" : "unknown", text: "" });
        } else if (chunkType === "text-delta" || chunkType === "reasoning-delta") {
          state.blocks.set(blockIndex, { kind: chunkType === "text-delta" ? "text" : "reasoning", text: `${previous?.text ?? ""}${text(chunk?.text)}` });
        } else if (chunkType === "tool-call-delta") {
          state.blocks.set(blockIndex, { kind: "tool-call", name: typeof chunk?.name === "string" ? chunk.name : previous?.name ?? "Tool call", callId: typeof chunk?.id === "string" ? chunk.id : previous?.callId, text: `${previous?.text ?? ""}${text(chunk?.argumentsDelta)}` });
        } else if (chunkType === "block-end") {
          const [block] = blocksOf(chunk?.block);
          if (block) state.blocks.set(blockIndex, block);
        }
      }
      assistants.set(key, state);
      publishAssistant(state);
      continue;
    }

    if ((type === "assistant/message" || type === "assistant") && turn !== undefined && step !== undefined) {
      const key = `${turn}:${step}`;
      const message = record(data.message) ?? data;
      const previous = assistants.get(key);
      const state: AssistantState = {
        id: previous?.id ?? `assistant:${key}`,
        seq: previous?.seq ?? seq,
        ...(previous?.time === undefined && time !== undefined ? { time } : previous?.time === undefined ? {} : { time: previous.time }),
        turn,
        step,
        status: "settled",
        blocks: new Map(blocksOf(message.content ?? message.text ?? item.content).map((block, index) => [index, block])),
        ...usageOf(data.usage ?? message.usage),
      };
      assistants.set(key, state);
      publishAssistant(state);
      continue;
    }

    if (type === "tool/call") {
      const callId = typeof data.callId === "string" ? data.callId : `call:${seq}`;
      const tool: ToolState = {
        id: `tool:${callId}`,
        kind: "tool",
        seq,
        ...(time === undefined ? {} : { time }),
        name: typeof data.name === "string" ? data.name : "Tool call",
        argumentsText: text(data.arguments),
        status: "running",
      };
      tools.set(callId, tool);
      write(tool);
      continue;
    }

    if (type === "tool/result" || type === "tool") {
      const message = record(data.message) ?? data;
      const callId = typeof message.callId === "string" ? message.callId : typeof data.callId === "string" ? data.callId : undefined;
      if (!callId) continue;
      const previous = tools.get(callId);
      const error = data.error !== undefined || item.error !== undefined || item.status === "error";
      const tool: ToolState = {
        id: previous?.id ?? `tool:${callId}`,
        kind: "tool",
        seq: previous?.seq ?? seq,
        ...(previous?.time === undefined && time !== undefined ? { time } : previous?.time === undefined ? {} : { time: previous.time }),
        name: previous?.name ?? "Tool call",
        argumentsText: previous?.argumentsText ?? "",
        result: text(message.content ?? message.output ?? data.content),
        status: error ? "error" : "success",
        ...(time !== undefined && previous?.time !== undefined ? { durationMs: Math.max(0, time - previous.time) } : {}),
      };
      tools.set(callId, tool);
      write(tool);
      continue;
    }

    if (type === "turn/end" && turn !== undefined) {
      const status = finalStatus(data.reason);
      for (const assistant of assistants.values()) {
        if (assistant.turn === turn && assistant.status === "running") {
          assistant.status = status;
          publishAssistant(assistant);
        }
      }
      continue;
    }

    if (type === "user/message" || type === "user" || type === "system/message" || type === "system" || type === "context/message" || type === "context") {
      const kind = type.startsWith("user") ? "user" : type.startsWith("system") ? "system" : "context";
      write({ id: `${kind}:${seq}`, kind, seq, ...(time === undefined ? {} : { time }), text: itemText(data, item) });
    }
  }

  return records.map((item) => rows.get(item.id) ?? item).sort((left, right) => left.seq - right.seq);
}
