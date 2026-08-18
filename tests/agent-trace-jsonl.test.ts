import { describe, expect, it } from "vitest";
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
});
