import type { ContextWindowLabels } from "./context-window-types";

export const contextWindowEnglishLabels: ContextWindowLabels = {
  title: "Context window", description: "Token allocation across system instructions, tools, memory, documents and conversation history.",
  live: "Live", paused: "Paused", settings: "Context settings", close: "Close context window",
  used: "Context used", healthy: "Healthy", warning: "Filling up", full: "Near capacity", tokens: "tokens",
  cache: "Prompt cache", saved: "saved", cached: "cached", newTokens: "new", contents: "Contents",
  empty: "No items in this category.", system: "System", tools: "Tools", docs: "Docs", memory: "Memory", history: "History", free: "Free",
  compact: "Compact history", compacting: "Compacting history…", pinned: "Pinned",
  invalid: "Context data is invalid. Check capacity, token counts and item ids.",
  loading: "Loading context…", retry: "Retry", turn: "Turn", matrix: "Context token allocation",
  usage: (percent) => `${percent} full`, headroom: (turns) => `~${turns} turns of headroom`,
  hit: (percent) => `${percent} hit`, summary: (count, tokens, percent) => `${count} items · ${tokens} tokens · ${percent} of window`,
};

export const contextWindowZhLabels: ContextWindowLabels = {
  title: "上下文窗口", description: "查看系统指令、工具、记忆、文档与对话历史的 token 分配。",
  live: "实时", paused: "已暂停", settings: "上下文设置", close: "关闭上下文窗口",
  used: "已用上下文", healthy: "充足", warning: "接近上限", full: "容量紧张", tokens: "tokens",
  cache: "提示词缓存", saved: "已节省", cached: "已缓存", newTokens: "新增", contents: "内容",
  empty: "此分类暂无内容。", system: "系统", tools: "工具", docs: "文档", memory: "记忆", history: "历史", free: "剩余",
  compact: "压缩历史", compacting: "正在压缩历史…", pinned: "已固定",
  invalid: "上下文数据无效，请检查容量、token 数量与条目标识。",
  loading: "正在加载上下文…", retry: "重试", turn: "轮次", matrix: "上下文 token 分配",
  usage: (percent) => `已占用 ${percent}`, headroom: (turns) => `预计还可对话 ${turns} 轮`,
  hit: (percent) => `命中 ${percent}`, summary: (count, tokens, percent) => `${count} 项 · ${tokens} tokens · 占窗口 ${percent}`,
};
