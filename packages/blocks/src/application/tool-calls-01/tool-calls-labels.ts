import type { ToolCallsLabels } from "./tool-calls-types";

export const toolCallsEnLabels: ToolCallsLabels = {
  title: "Tool calls", empty: "No tool calls yet", input: "Input", output: "Output",
  noOutput: "No output yet", noMatches: "No matches", directory: "Working directory",
  allow: "Allow command", deny: "Deny command", deciding: "Submitting…", retry: "Retry tool",
  actionFailed: "Could not submit this action. Try again.", approval: "Approval required to run this command.",
  status: { queued: "Queued", running: "Running", "approval-required": "Needs approval", completed: "Completed", failed: "Failed", denied: "Denied", cancelled: "Cancelled" },
  matches: (count) => `${count} ${count === 1 ? "match" : "matches"}`,
  exitCode: (code) => `Exit code ${code}`,
};

export const toolCallsZhLabels: ToolCallsLabels = {
  title: "工具调用", empty: "暂无工具调用", input: "输入", output: "输出",
  noOutput: "暂无输出", noMatches: "未找到匹配结果", directory: "工作目录",
  allow: "允许执行", deny: "拒绝执行", deciding: "正在提交…", retry: "重试工具",
  actionFailed: "操作提交失败，请重试。", approval: "此命令需要确认后执行。",
  status: { queued: "排队中", running: "执行中", "approval-required": "等待确认", completed: "已完成", failed: "失败", denied: "已拒绝", cancelled: "已取消" },
  matches: (count) => `${count} 个匹配结果`, exitCode: (code) => `退出码 ${code}`,
};
