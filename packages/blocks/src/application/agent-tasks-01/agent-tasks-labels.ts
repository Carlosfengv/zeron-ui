import type { AgentTasksLabels } from "./agent-tasks-types";

export const agentTasksLabels: AgentTasksLabels = {
  title: "Agent tasks",
  all: "All",
  needsYou: "Needs you",
  running: "Running",
  done: "Done",
  failed: "Failed",
  open: "Open",
  newTask: "New task",
  empty: "No tasks in this view.",
  noActivity: "No activity yet.",
  activity: "Task activity",
  summary: (needsYou, running) => `${needsYou} needs you · ${running} running`,
};

export const agentTasksChineseLabels: AgentTasksLabels = {
  title: "Agent 任务",
  all: "全部",
  needsYou: "待处理",
  running: "运行中",
  done: "已完成",
  failed: "失败",
  open: "打开",
  newTask: "新建任务",
  empty: "此分类暂无任务。",
  noActivity: "暂无活动记录。",
  activity: "任务动态",
  summary: (needsYou, running) => `${needsYou} 项待处理 · ${running} 项运行中`,
};
