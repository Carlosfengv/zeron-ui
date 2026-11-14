import type { AgentRunLabels } from "./agent-run-types";

export const agentRunEnglishLabels: AgentRunLabels = {
  status: { idle: "Idle", working: "Working", done: "Done", paused: "Paused", stopped: "Stopped", failed: "Failed" },
  chooseRun: "Switch run",
  close: "Close details",
  empty: "No agents in this run yet",
  elapsed: "Time",
  cost: "Cost",
  tokens: "Tokens",
  message: "Message",
  send: "Send",
  pause: "Pause",
  resume: "Resume",
  stop: "Stop",
  duration: (seconds) => `${seconds}s`,
  workingCount: (count) => `${count} working`,
  totalCount: (count) => `${count} ${count === 1 ? "agent" : "agents"}`,
};

export const agentRunChineseLabels: AgentRunLabels = {
  status: { idle: "待命", working: "运行中", done: "已完成", paused: "已暂停", stopped: "已停止", failed: "失败" },
  chooseRun: "切换任务",
  close: "关闭详情",
  empty: "此任务暂无 Agent",
  elapsed: "耗时",
  cost: "费用",
  tokens: "Token",
  message: "发消息",
  send: "发送",
  pause: "暂停",
  resume: "继续",
  stop: "停止",
  duration: (seconds) => `${seconds} 秒`,
  workingCount: (count) => `${count} 个运行中`,
  totalCount: (count) => `${count} 个 Agent`,
};
