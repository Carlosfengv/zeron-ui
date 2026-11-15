import type { AgentQueueLabels } from "./agent-queue-types";

function duration(milliseconds: number, seconds: string, minutes: string) {
  const value = Math.max(0, milliseconds) / 1000;
  if (value < 10) return `${Math.floor(value * 10) / 10}${seconds}`;
  if (value < 60) return `${Math.floor(value)}${seconds}`;
  const remainder = Math.floor(value % 60);
  return `${Math.floor(value / 60)}${minutes}${remainder ? ` ${remainder}${seconds}` : ""}`;
}

export const agentQueueEnglishLabels: AgentQueueLabels = {
  title: "Queue", waiting: "Waiting", running: "Running", workers: "Workers", throughput: "Throughput",
  perMinute: "/min", waitP95: "Wait p95", done: "Done", failed: "Failed", live: "Live", idle: "Idle",
  empty: "No jobs waiting", unassigned: "Unassigned", paused: "Paused", pause: "Pause", resume: "Resume",
  increase: "One worker more", decrease: "One worker less", depth: "Queue depth", now: "now",
  position: "Position", priority: "Priority", attempt: "Attempt", promote: "Move to front", cancel: "Cancel",
  closeDetails: "Close details",
  kinds: { llm: "LLM call", tool: "Tool call", agent: "Sub-agent", human: "Human review" },
  priorities: { high: "High", normal: "Normal", low: "Low" },
  duration: (ms) => duration(ms, "s", "m"),
  ago: (value) => `${value} ago`,
  outOf: (value, total) => `${value} of ${total}`,
  rateLimited: (remaining) => `Rate limited · ${remaining}`,
  rateLimitLifted: "Rate limit lifted",
  backpressure: (depth) => `Queue depth above ${depth}`,
  failures: (total) => `${total} failed jobs`,
  retry: (attempt) => `Retry ${attempt}`,
  depthSummary: (waiting, peak, limits) => `Queue depth: ${waiting} waiting now, peak ${peak}, ${limits} rate-limited periods`,
};

export const agentQueueChineseLabels: AgentQueueLabels = {
  title: "队列", waiting: "等待", running: "运行中", workers: "工作槽", throughput: "吞吐量",
  perMinute: "/分钟", waitP95: "等待 P95", done: "已完成", failed: "失败", live: "实时", idle: "空闲",
  empty: "暂无等待任务", unassigned: "未分配", paused: "已暂停", pause: "暂停", resume: "恢复",
  increase: "增加一个工作槽", decrease: "减少一个工作槽", depth: "队列深度", now: "现在",
  position: "队列位置", priority: "优先级", attempt: "尝试次数", promote: "移到队首", cancel: "取消任务",
  closeDetails: "关闭详情",
  kinds: { llm: "模型调用", tool: "工具调用", agent: "子 Agent", human: "人工审核" },
  priorities: { high: "高", normal: "普通", low: "低" },
  duration: (ms) => duration(ms, "秒", "分"),
  ago: (value) => `${value}前`,
  outOf: (value, total) => `${value} / ${total}`,
  rateLimited: (remaining) => `限流中 · ${remaining}`,
  rateLimitLifted: "限流已解除",
  backpressure: (depth) => `队列深度已超过 ${depth}`,
  failures: (total) => `${total} 个任务失败`,
  retry: (attempt) => `重试 ${attempt}`,
  depthSummary: (waiting, peak, limits) => `队列深度：当前 ${waiting} 个任务等待，峰值 ${peak}，限流 ${limits} 次`,
};
