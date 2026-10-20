import { describe, expect, it } from "vitest";
import { splitThreadHistory } from "../packages/blocks/src/application/chat-thread-01/chat-thread-history";
import {
  createChatThreadDemoData,
  getChatThreadDemoPath,
} from "../packages/blocks/src/application/chat-thread-01/chat-thread-demo-data";

describe("chat thread history", () => {
  it("includes the restored user message in removed without mutating the input", () => {
    const messages = Object.freeze([
      { id: "u1" },
      { id: "a1" },
      { id: "u2" },
      { id: "a2" },
    ]);
    expect(splitThreadHistory(messages, "u2")).toEqual({
      kept: messages.slice(0, 2),
      removed: messages.slice(2),
    });
    expect(splitThreadHistory(messages, "missing")).toEqual({
      kept: [...messages],
      removed: [],
    });
    expect(messages).toHaveLength(4);
  });

  it("switches reply versions together with their own continuation", () => {
    const data = createChatThreadDemoData();
    expect(getChatThreadDemoPath(data).at(-1)?.id).toBe("answer-3");
    const oldVersion = { ...data, selection: { "question-2": "answer-2-v1" } };
    expect(getChatThreadDemoPath(oldVersion).at(-1)?.id).toBe("answer-2-v1");
    expect(
      getChatThreadDemoPath({
        ...oldVersion,
        selection: { "question-2": "answer-2-v2" },
      }).at(-1)?.id,
    ).toBe("answer-3");
    expect(
      data.messages
        .filter((message) => message.parentId === "question-2")
        .map((message) => message.slotId),
    ).toEqual(["slot-answer-2", "slot-answer-2"]);
  });

  it("supports an explicit empty restored branch and terminates cyclic input", () => {
    const data = createChatThreadDemoData();
    expect(
      getChatThreadDemoPath({ ...data, selection: { root: null } }),
    ).toEqual([]);
    expect(
      getChatThreadDemoPath({ ...data, selection: { "answer-1": null } }).map(
        (message) => message.id,
      ),
    ).toEqual(["question-1", "answer-1"]);
    expect(getChatThreadDemoPath({ messages: [], selection: {} })).toEqual([]);
    const message = data.messages[0];
    expect(
      getChatThreadDemoPath({
        messages: [
          { ...message, id: "cycle", parentId: null },
          { ...message, id: "cycle", parentId: "cycle" },
        ],
        selection: {},
      }),
    ).toHaveLength(1);
  });
});
