import { describe, expect, it } from "vitest";
import {
  agentMessageTraceDuration,
  buildAgentMessageTraceModel,
  createAgentMessageTraceTicks,
  defaultExpandedAgentMessageTraceIds,
  flattenAgentMessageTraceRows,
  formatAgentMessageTraceDuration,
} from "../packages/blocks/src/application/agent-message-trace-01/agent-message-trace-model";
import type { AgentMessageTraceSpan } from "../packages/blocks/src/application/agent-message-trace-01/agent-message-trace-types";

const spans: AgentMessageTraceSpan[] = [
  { id: "agent", parentId: null, kind: "agent", name: "response", startOffsetMs: 0, durationMs: 100, status: "success" },
  { id: "chat", parentId: "agent", kind: "chat", name: "chat", startOffsetMs: 4, durationMs: 80, status: "success" },
  { id: "tool-b", parentId: "chat", kind: "tool", name: "tool", operation: "b", startOffsetMs: 30, durationMs: 8, status: "success" },
  { id: "tool-a", parentId: "chat", kind: "tool", name: "tool", operation: "a", startOffsetMs: 10, durationMs: 5, status: "success" },
];

describe("AgentMessageTrace model", () => {
  it("builds a stable tree and sorts siblings by relative start time", () => {
    const model = buildAgentMessageTraceModel(spans);
    expect(model.rootIds).toEqual(["agent"]);
    expect(model.nodes.get("chat")?.depth).toBe(1);
    expect(model.nodes.get("agent")?.descendantCount).toBe(3);
    expect(model.nodes.get("chat")?.childIds).toEqual(["tool-a", "tool-b"]);
    expect(defaultExpandedAgentMessageTraceIds(model, 2)).toEqual(["agent", "chat"]);
  });

  it("retains ancestors when filtering to tool spans", () => {
    const model = buildAgentMessageTraceModel(spans);
    const rows = flattenAgentMessageTraceRows(
      model,
      new Set(["agent", "chat"]),
      new Set(["tool"])
    );
    expect(rows.map((row) => row.node.span.id)).toEqual(["agent", "chat", "tool-a", "tool-b"]);
  });

  it("promotes orphans and cycle members to roots instead of dropping data", () => {
    const model = buildAgentMessageTraceModel([
      { id: "orphan", parentId: "missing", kind: "tool", name: "orphan", startOffsetMs: 0, status: "success" },
      { id: "cycle-a", parentId: "cycle-b", kind: "agent", name: "a", startOffsetMs: 1, status: "success" },
      { id: "cycle-b", parentId: "cycle-a", kind: "chat", name: "b", startOffsetMs: 2, status: "success" },
    ]);
    expect(model.rootIds).toEqual(["orphan", "cycle-a", "cycle-b"]);
    expect(model.nodes.size).toBe(3);
  });

  it("derives a live duration and human-readable ticks from numeric data", () => {
    expect(agentMessageTraceDuration([
      { id: "running", parentId: null, kind: "agent", name: "running", startOffsetMs: 200, status: "running" },
    ], 1_450)).toBe(1_450);

    const scale = createAgentMessageTraceTicks(1_450);
    expect(scale.domainEnd).toBe(1_500);
    expect(scale.ticks.at(0)).toEqual({ value: 0, position: 0 });
    expect(scale.ticks.at(-1)).toEqual({ value: 1_500, position: 1 });
    expect(formatAgentMessageTraceDuration(1_248, "en")).toBe("1.2 s");
    expect(formatAgentMessageTraceDuration(7_200_000, "en")).toBe("2 h");
  });
});
