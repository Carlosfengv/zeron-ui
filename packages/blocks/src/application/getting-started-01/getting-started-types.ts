/** Tasks have unique ids and at most one current task. Completion is owned by the caller. */
export interface GettingStartedTask {
  id: string;
  title: string;
  status: "completed" | "current" | "pending";
  href?: string;
  disabled?: boolean;
}

export interface GettingStartedLabels {
  completed: string;
  current: string;
  pending: string;
  empty: string;
  progress: (completed: number, total: number) => string;
}

export interface GettingStartedProps {
  title?: string;
  tasks: readonly GettingStartedTask[];
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Called only for tasks without an href; completed tasks remain static. */
  onTaskAction?: (taskId: string) => void;
  labels?: Partial<GettingStartedLabels>;
  /** External layout only. */
  className?: string;
}
