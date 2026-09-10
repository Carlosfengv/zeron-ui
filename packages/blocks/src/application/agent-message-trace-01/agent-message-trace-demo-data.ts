import type { AgentMessageTraceData, AgentMessageTraceSpan } from "./agent-message-trace-types";

export function createAgentMessageTraceDemoData(groupCount = 14): AgentMessageTraceData {
  const spans: AgentMessageTraceSpan[] = [];
  let cursor = 0;

  for (let group = 1; group <= groupCount; group += 1) {
    const agentId = `agent-${group}`;
    const chatId = `chat-${group}`;
    const agentDuration = 8_400 + (group % 4) * 3_100;
    const chatStart = cursor + 24;
    const chatDuration = Math.max(1_200, agentDuration - 120);

    spans.push({
      id: agentId,
      parentId: null,
      kind: "agent",
      name: "ria.session.response",
      operation: "invoke_agent",
      model: "deepseek-v4-pro",
      provider: "DeepSeek",
      finishReason: group === groupCount ? undefined : "tool_calls",
      conversationId: "conversation-42",
      startOffsetMs: cursor,
      durationMs: agentDuration,
      status: group === groupCount ? "running" : "success",
      input: [
        { role: "system", content: "You are a product support agent. Use tools when current information is required." },
        { role: "user", content: `Resolve request batch ${group} and return a concise response.` },
      ],
      output: group === groupCount ? undefined : {
        role: "assistant",
        content: "The requested operations completed successfully.",
      },
      attributes: {
        "gen_ai.request.temperature": 0.2,
        "gen_ai.usage.input_tokens": 420 + group * 11,
        "gen_ai.usage.output_tokens": 92 + group * 3,
      },
      events: [
        {
          id: `agent-${group}-event-start`,
          name: "request.started",
          startOffsetMs: cursor,
          status: "success",
        },
        {
          id: `agent-${group}-event-model`,
          name: "model.response",
          startOffsetMs: cursor + Math.max(240, agentDuration - 760),
          status: group === groupCount ? "running" : "success",
          attributes: { cached: group % 2 === 0 },
        },
      ],
    });
    spans.push({
      id: chatId,
      parentId: agentId,
      kind: "chat",
      name: "chat",
      operation: "chat.completion",
      model: "deepseek-v4-pro",
      provider: "DeepSeek",
      finishReason: group === groupCount ? undefined : "stop",
      conversationId: "conversation-42",
      startOffsetMs: chatStart,
      durationMs: group === groupCount ? undefined : chatDuration,
      status: group === groupCount ? "running" : "success",
    });

    const toolNames = group % 3 === 0
      ? ["filesystem_list", "filesystem_read", "web_fetch"]
      : group % 2 === 0
        ? ["run_command", "update_work_order"]
        : ["web_fetch", "search"];

    toolNames.forEach((operation, index) => {
      const failed = group === 9 && index === toolNames.length - 1;
      spans.push({
        id: `tool-${group}-${index}`,
        parentId: chatId,
        kind: "tool",
        name: "execute_tool",
        operation,
        toolName: operation,
        conversationId: "conversation-42",
        startOffsetMs: chatStart + 180 + index * 760,
        durationMs: 18 + ((group + index) % 5) * 145,
        status: failed ? "error" : "success",
        input: { operation, group },
        output: failed ? undefined : { ok: true, resultCount: (group + index) % 7 + 1 },
        attributes: {
          "tool.name": operation,
          "tool.attempt": 1,
        },
        ...(failed ? { error: { message: "The upstream request timed out.", code: "UPSTREAM_TIMEOUT" } } : {}),
      });
    });

    cursor += agentDuration + 420;
  }

  return {
    id: "agent-message-trace-demo",
    messageId: "assistant-message-42",
    startedAt: "2026-09-10T10:30:00.000Z",
    spans,
  };
}

export const agentMessageTraceDemoData = createAgentMessageTraceDemoData();
