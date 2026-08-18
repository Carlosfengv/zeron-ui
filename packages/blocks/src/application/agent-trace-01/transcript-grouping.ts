import type { AgentTranscriptItem } from "./stream-projection";

/** Keeps a user bubble distinct while making its following assistant activity one compact stream flow. */
export function groupTranscriptFlows(items: readonly AgentTranscriptItem[]): readonly (readonly AgentTranscriptItem[])[] {
  return items.reduce<Array<readonly AgentTranscriptItem[]>>((groups, item) => {
    if (item.kind === "user" || groups.length === 0) return [...groups, [item]];
    const previous = groups.at(-1) ?? [];
    if (previous[0]?.kind === "user") return [...groups, [item]];
    return [...groups.slice(0, -1), [...previous, item]];
  }, []);
}
