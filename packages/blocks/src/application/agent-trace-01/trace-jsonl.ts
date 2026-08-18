type JsonRecord = Record<string, unknown>;

function record(value: unknown): JsonRecord | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as JsonRecord : null;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

/** Parse a JSON document or newline-delimited DSH session transcript. */
export function parseAgentTracePayload(text: string): unknown {
  const source = text.trim();
  if (!source) throw new Error("The selected file is empty.");
  try {
    return JSON.parse(source) as unknown;
  } catch {
    const lines = source.split(/\r?\n/).filter((line) => line.trim());
    try {
      return lines.map((line) => JSON.parse(line) as unknown);
    } catch (cause) {
      throw new Error(cause instanceof Error ? `Unable to parse JSONL: ${cause.message}` : "Unable to parse this JSONL file.");
    }
  }
}

/**
 * Expand DSH's compact JSONL delta rows into ordinary `assistant/chunk`
 * events. Invalid compact rows remain available as raw records.
 */
export function expandAgentTraceEntries(entries: readonly unknown[]): readonly unknown[] {
  return entries.flatMap((value) => {
    const item = record(value);
    if (!item || (item.type !== "text-chunks" && item.type !== "reasoning-chunks" && item.type !== "tool-call-chunks")) return [value];

    const data = record(item.data);
    const seq0 = numberValue(item.seq0);
    const time0 = numberValue(item.time0);
    const values = item.type === "tool-call-chunks" ? data?.args : data?.texts;
    const deltas = data?.dt;
    const turn = numberValue(data?.turn);
    const step = numberValue(data?.step);
    const index = numberValue(data?.index);
    if (!data || seq0 === undefined || time0 === undefined || turn === undefined || step === undefined || index === undefined
      || !Array.isArray(values) || values.length === 0 || values.some((entry) => typeof entry !== "string")
      || !Array.isArray(deltas) || deltas.length !== values.length - 1 || deltas.some((entry) => numberValue(entry) === undefined)) return [value];

    let time = time0;
    return values.map((entry, offset) => {
      if (offset > 0) time += numberValue(deltas[offset - 1]) ?? 0;
      const chunk = item.type === "text-chunks"
        ? { type: "text-delta", index, text: entry }
        : item.type === "reasoning-chunks"
          ? { type: "reasoning-delta", index, text: entry }
          : {
              type: "tool-call-delta",
              index,
              id: typeof data.id === "string" ? data.id : "",
              ...(typeof data.name === "string" ? { name: data.name } : {}),
              argumentsDelta: entry,
            };
      return { type: "assistant/chunk", seq: seq0 + offset, time, data: { turn, step, chunk } };
    });
  });
}
