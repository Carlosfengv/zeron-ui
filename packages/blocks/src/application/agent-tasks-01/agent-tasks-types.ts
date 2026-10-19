export type AgentTaskStatus = "failed" | "needs-you" | "running" | "done";
export type AgentTaskFilter = "all" | "needs-you" | "running" | "done";

export interface AgentTaskEvent {
  id: string;
  message: string;
  time: string;
  current?: boolean;
}

export interface AgentTask {
  id: string;
  title: string;
  model: string;
  duration: string;
  status: AgentTaskStatus;
  events?: readonly AgentTaskEvent[];
}

export interface AgentTasksLabels {
  title: string;
  all: string;
  needsYou: string;
  running: string;
  done: string;
  failed: string;
  open: string;
  newTask: string;
  empty: string;
  noActivity: string;
  activity: string;
  summary: (needsYou: number, running: number) => string;
}

export interface AgentTasksProps {
  tasks: readonly AgentTask[];
  filter?: AgentTaskFilter;
  defaultFilter?: AgentTaskFilter;
  onFilterChange?: (filter: AgentTaskFilter) => void;
  /** Undefined uses local expansion state; null collapses every task. */
  expandedTaskId?: string | null;
  defaultExpandedTaskId?: string | null;
  onExpandedTaskChange?: (taskId: string | null) => void;
  /** Host-owned navigation/action; Open is disabled when omitted. */
  onOpenTask?: (task: AgentTask) => void;
  /** Host-owned creation flow; New task is disabled when omitted. */
  onNewTask?: () => void;
  labels?: Partial<AgentTasksLabels>;
  className?: string;
}
