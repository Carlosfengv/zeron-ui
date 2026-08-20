/** Two complete sessions for the left-nav detail-page demo. */
export const defaultAgentSessions = [
  { id: "openclaw-market-briefing", title: "搜集 OpenClaw 市场情报", description: "每 24 小时一帮我搜集 OpenClaw 市场情报", agent: "Zeron", updatedAt: "15分钟", badge: "定时任务", badgeColor: "gray", badgeTone: "neutral-button", data: { events: [
    { seq: 1, time: 1787060969259, type: "turn/start", data: { turn: 1 } },
    { seq: 2, time: 1787060969278, type: "user/message", data: { turn: 1, content: [{ type: "text", text: "搜集最近24小时 OpenClaw 的市场情报，并整理成一份简报。" }] } },
    { seq: 3, time: 1787060971623, type: "assistant/message", data: { turn: 1, step: 1, usage: { inputTokens: 3260, outputTokens: 124, reasoningTokens: 42 }, message: { role: "assistant", source: { kind: "model", provider: "zeron", model: "Zeron Agent" }, content: [{ type: "reasoning", text: "先聚合新闻、发布日志和公开市场信息，再筛选影响产品和生态的事件。" }, { type: "tool-call", id: "market-search-01", name: "web_search", arguments: "{\"query\":\"OpenClaw market news last 24 hours\"}" }] } } },
    { seq: 4, time: 1787060971674, type: "tool/call", data: { turn: 1, step: 1, name: "web_search", callId: "market-search-01", arguments: "{\"query\":\"OpenClaw market news last 24 hours\"}" } },
    { seq: 5, time: 1787060977568, type: "tool/result", data: { turn: 1, step: 1, message: { callId: "market-search-01", content: [{ type: "text", text: "Found product updates, ecosystem funding news, and enterprise adoption coverage." }] } } },
    { seq: 6, time: 1787060981637, type: "assistant/message", data: { turn: 1, step: 2, usage: { inputTokens: 842, outputTokens: 536, reasoningTokens: 71 }, message: { role: "assistant", source: { kind: "model", provider: "zeron", model: "Zeron Agent" }, content: [{ type: "text", text: "市场情报已生成：产品侧有新版本发布，生态侧出现新的企业级可观测性工具，竞争侧关注 Google 和 Microsoft 的相关动态。" }] } } },
    { seq: 7, time: 1787060981642, type: "turn/end", data: { turn: 1, reason: { kind: "completed" } } },
  ] } },
  { id: "build-an-agent", title: "如何构建 Agent", description: "梳理一个可上线 Agent 的架构和实现步骤", agent: "Zeron", updatedAt: "2分钟", data: { events: [
    { seq: 1, time: 1787064580259, type: "turn/start", data: { turn: 1 } },
    { seq: 2, time: 1787064580284, type: "user/message", data: { turn: 1, content: [{ type: "text", text: "如何构建一个可以调用工具、记录轨迹并持续评估的 Agent？" }] } },
    { seq: 3, time: 1787064582812, type: "assistant/message", data: { turn: 1, step: 1, usage: { inputTokens: 1860, outputTokens: 188, reasoningTokens: 55 }, message: { role: "assistant", source: { kind: "model", provider: "zeron", model: "Zeron Agent" }, content: [{ type: "reasoning", text: "需要从任务边界、工具契约、状态记录和评估闭环四个方面组织答案。" }, { type: "tool-call", id: "architecture-search-01", name: "knowledge_search", arguments: "{\"query\":\"agent architecture tools tracing evaluations\"}" }] } } },
    { seq: 4, time: 1787064582871, type: "tool/call", data: { turn: 1, step: 1, name: "knowledge_search", callId: "architecture-search-01", arguments: "{\"query\":\"agent architecture tools tracing evaluations\"}" } },
    { seq: 5, time: 1787064586568, type: "tool/result", data: { turn: 1, step: 1, message: { callId: "architecture-search-01", content: [{ type: "text", text: "Retrieved internal guidance for tool contracts, trace schemas, and task evaluations." }] } } },
    { seq: 6, time: 1787064590637, type: "assistant/message", data: { turn: 1, step: 2, usage: { inputTokens: 1115, outputTokens: 487, reasoningTokens: 88 }, message: { role: "assistant", source: { kind: "model", provider: "zeron", model: "Zeron Agent" }, content: [{ type: "text", text: "建议从单一任务闭环开始：定义输入输出和工具权限，持久化每个 turn 的事件，再用可回放的 trace 建立测试集和评估指标。" }] } } },
    { seq: 7, time: 1787064590644, type: "turn/end", data: { turn: 1, reason: { kind: "completed" } } },
  ] } },
] as const;
