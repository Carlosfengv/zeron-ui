/**
 * Display-safe projection of the supplied `session.jsonl` fixture.
 * Harness bootstrap, permission, and system-context records are omitted because
 * they are internal runtime metadata rather than user-visible trace events.
 */
export const defaultAgentTracePayload = {
  events: [
    { seq: 4, time: 1787060969259, type: "turn/start", data: { turn: 1 } },
    { seq: 7, time: 1787060969278, type: "user/message", data: { turn: 1, content: [{ type: "text", text: "hello, 介绍一下你自己,以及你有哪些工具可以调用" }], source: { kind: "user" } } },
    { seq: 585, time: 1787060979623, type: "assistant/message", data: { turn: 1, step: 1, usage: { inputTokens: 8535, outputTokens: 576, reasoningTokens: 66 }, message: { role: "assistant", source: { kind: "model", provider: "deepseek-official", model: "deepseek-v4-pro" }, content: [{ type: "text", text: "你好，很高兴认识你 👋\n\n我是一个由 deepseek-v4-pro 模型驱动的 AI 编码代理，运行在 DeepSeek Harness 环境中。我可以协助编写与修改代码、调试排错、研究检索、浏览器自动化，以及构建设计与前端界面。" }] } } },
    { seq: 587, time: 1787060979629, type: "turn/end", data: { turn: 1, reason: { kind: "completed" } } },
    { seq: 589, time: 1787061010836, type: "turn/start", data: { turn: 2 } },
    { seq: 592, time: 1787061010866, type: "user/message", data: { turn: 2, content: [{ type: "text", text: "通过 websearch 搜索一下 deepseek 相关信息" }], source: { kind: "user" } } },
    { seq: 634, time: 1787061012812, type: "assistant/message", data: { turn: 2, step: 1, usage: { inputTokens: 611, outputTokens: 69, reasoningTokens: 17 }, message: { role: "assistant", source: { kind: "model", provider: "deepseek-official", model: "deepseek-v4-pro" }, content: [{ type: "reasoning", text: "用户要求通过 web_search 搜索 DeepSeek 相关信息，直接调用 web_search。" }, { type: "tool-call", id: "call_00_UEqnoC4U0UXd1a2giJ2p4557", name: "web_search", arguments: "{\"query\":\"DeepSeek 最新信息 大模型\"}" }] } } },
    { seq: 635, time: 1787061012819, type: "tool/call", data: { turn: 2, step: 1, name: "web_search", callId: "call_00_UEqnoC4U0UXd1a2giJ2p4557", arguments: "{\"query\":\"DeepSeek 最新信息 大模型\"}" } },
    { seq: 637, time: 1787061020568, type: "tool/result", data: { turn: 2, step: 1, message: { callId: "call_00_UEqnoC4U0UXd1a2giJ2p4557", source: { kind: "tool", callId: "call_00_UEqnoC4U0UXd1a2giJ2p4557" }, content: [{ type: "text", text: "Found sources covering DeepSeek V4, Harness, official API updates, and recent market coverage. Showing the first 8 sources; refine the query for more." }] } } },
    { seq: 1281, time: 1787061029637, type: "assistant/message", data: { turn: 2, step: 2, usage: { inputTokens: 825, outputTokens: 642, reasoningTokens: 77 }, message: { role: "assistant", source: { kind: "model", provider: "deepseek-official", model: "deepseek-v4-pro" }, content: [{ type: "text", text: "我搜索到了关于 DeepSeek 的最新信息：DeepSeek V4 正式版已发布，Agent 能力大幅升级，Harness 能力首次亮相；DeepSeek-V4-Flash 正式版近期表现突出。官方资料可参考 DeepSeek API 更新日志。" }] } } },
    { seq: 1283, time: 1787061029642, type: "turn/end", data: { turn: 2, reason: { kind: "completed" } } },
  ],
} as const;
