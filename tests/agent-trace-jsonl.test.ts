import { describe, expect, it } from "vitest";
import { projectAgentTranscript } from "../packages/blocks/src/application/agent-trace-01/stream-projection";
import { groupTranscriptFlows } from "../packages/blocks/src/application/agent-trace-01/transcript-grouping";
import { expandAgentTraceEntries, parseAgentTracePayload } from "../packages/blocks/src/application/agent-trace-01/trace-jsonl";

describe("AgentTrace JSONL projection", () => {
  it("parses newline-delimited records and expands packed text chunks into one streaming response", () => {
    const payload = parseAgentTracePayload(`
{"type":"session","version":0,"id":"s"}
{"type":"turn/start","seq":0,"time":100,"data":{"turn":1}}
{"type":"user/message","seq":1,"time":101,"data":{"turn":1,"content":[{"type":"text","text":"Hello"}]}}
{"type":"assistant/chunk","seq":2,"time":102,"data":{"turn":1,"step":1,"chunk":{"type":"block-start","index":0,"blockType":"text"}}}
{"type":"text-chunks","seq0":3,"time0":103,"data":{"turn":1,"step":1,"index":0,"dt":[4],"texts":["Hi"," there"]}}
{"type":"assistant/chunk","seq":5,"time":108,"data":{"turn":1,"step":1,"chunk":{"type":"block-end","index":0,"block":{"type":"text","text":"Hi there"}}}}
{"type":"assistant/chunk","seq":6,"time":109,"data":{"turn":1,"step":1,"chunk":{"type":"finish","reason":{"kind":"stop"}}}}
{"type":"turn/end","seq":7,"time":110,"data":{"turn":1,"reason":{"kind":"completed"}}}
`);

    const entries = expandAgentTraceEntries(payload as readonly unknown[]);
    expect(entries).toHaveLength(9);
    expect(entries.slice(4, 6)).toEqual([
      { type: "assistant/chunk", seq: 3, time: 103, data: { turn: 1, step: 1, chunk: { type: "text-delta", index: 0, text: "Hi" } } },
      { type: "assistant/chunk", seq: 4, time: 107, data: { turn: 1, step: 1, chunk: { type: "text-delta", index: 0, text: " there" } } },
    ]);
  });

  it("preserves malformed compact records for raw inspection", () => {
    const invalid = { type: "text-chunks", seq0: 4, time0: 10, data: { turn: 1, step: 1, index: 0, dt: [], texts: ["a", "b"] } };
    expect(expandAgentTraceEntries([invalid])).toEqual([invalid]);
  });

  it("keeps assistant and tool identities stable as chunk lifecycle events settle", () => {
    const stream = [
      { type: "user/message", seq: 1, time: 100, data: { turn: 1, content: [{ type: "text", text: "Inspect the service" }] } },
      { type: "assistant/chunk", seq: 2, time: 101, data: { turn: 1, step: 1, chunk: { type: "block-start", index: 0, blockType: "reasoning" } } },
      { type: "assistant/chunk", seq: 3, time: 102, data: { turn: 1, step: 1, chunk: { type: "reasoning-delta", index: 0, text: "Checking logs" } } },
      { type: "assistant/chunk", seq: 4, time: 103, data: { turn: 1, step: 1, chunk: { type: "block-start", index: 1, blockType: "text" } } },
      { type: "assistant/chunk", seq: 5, time: 104, data: { turn: 1, step: 1, chunk: { type: "text-delta", index: 1, text: "I found the issue." } } },
      { type: "tool/call", seq: 6, time: 105, data: { turn: 1, step: 1, callId: "logs", name: "search_logs", arguments: "{\"service\":\"api\"}" } },
      { type: "tool/result", seq: 7, time: 145, data: { turn: 1, step: 1, message: { callId: "logs", content: "500 errors" } } },
      { type: "assistant/message", seq: 8, time: 150, data: { turn: 1, step: 1, message: { content: [{ type: "text", text: "I found the issue." }] }, usage: { inputTokens: 10, outputTokens: 8, reasoningTokens: 4 } } },
    ];

    const partial = projectAgentTranscript(stream.slice(0, 5));
    const streaming = partial.find((item) => item.kind === "assistant");
    expect(streaming).toMatchObject({ id: "assistant:1:1", kind: "assistant", status: "running" });
    expect(streaming?.kind === "assistant" && streaming.blocks).toEqual([
      { kind: "reasoning", text: "Checking logs" },
      { kind: "text", text: "I found the issue." },
    ]);

    const settled = projectAgentTranscript(stream);
    expect(settled.find((item) => item.id === "assistant:1:1")).toMatchObject({ status: "settled", input: 10, output: 8, think: 4 });
    expect(settled.find((item) => item.id === "tool:logs")).toMatchObject({ status: "success", result: "500 errors", durationMs: 40 });
  });

  it("freezes an unfinished assistant step as interrupted at turn end", () => {
    const rows = projectAgentTranscript([
      { type: "assistant/chunk", seq: 1, data: { turn: 3, step: 2, chunk: { type: "text-delta", index: 0, text: "Partial response" } } },
      { type: "turn/end", seq: 2, data: { turn: 3, reason: { kind: "aborted" } } },
    ]);
    expect(rows).toContainEqual(expect.objectContaining({ id: "assistant:3:2", status: "interrupted" }));
  });

  it("keeps user and its following stream in separate visual flow groups", () => {
    const items = projectAgentTranscript([
      { type: "user/message", seq: 1, data: { content: [{ type: "text", text: "Question" }] } },
      { type: "assistant/chunk", seq: 2, data: { turn: 1, step: 1, chunk: { type: "text-delta", index: 0, text: "Answer" } } },
      { type: "tool/call", seq: 3, data: { callId: "search", name: "web_search", arguments: "{}" } },
    ]);
    expect(groupTranscriptFlows(items).map((group) => group.map((item) => item.kind))).toEqual([
      ["user"],
      ["assistant", "tool"],
    ]);
  });
});
