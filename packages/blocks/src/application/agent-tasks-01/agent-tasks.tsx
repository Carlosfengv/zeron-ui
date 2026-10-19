"use client";

import { useId, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { AlertCircleIcon, ArrowUpRight01Icon, Loading02Icon } from "@hugeicons/core-free-icons";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Container, ContainerBody, ContainerFooter } from "@zeron/ui/container";
import { Tabs, TabsList, TabPanel, TabItem } from "@zeron/ui/tabs";
import { useIcon, type IconComponent } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { agentTasksLabels } from "./agent-tasks-labels";
import type { AgentTask, AgentTaskFilter, AgentTasksProps } from "./agent-tasks-types";

const OpenIcon: IconComponent = (props) => <HugeiconsIcon icon={ArrowUpRight01Icon} {...props} />;
const filters: AgentTaskFilter[] = ["all", "needs-you", "running", "done"];

function TaskIndicator({ status }: { status: AgentTask["status"] }) {
  const Check = useIcon("check");
  return (
    <span aria-hidden="true" className={cn("flex size-4 shrink-0 items-center justify-center rounded-full", {
      "bg-danger-surface-subtle text-fg-danger": status === "failed",
      "bg-warning-surface-subtle text-fg-warning": status === "needs-you",
      "bg-success-surface text-fg-success": status === "done",
      "text-fg-info": status === "running",
    })}>
      {status === "running" ? <HugeiconsIcon icon={Loading02Icon} fill="currentColor" strokeWidth={0} className="size-4 animate-spin motion-reduce:animate-none" />
        : status === "done" ? <Check className="size-3" />
        : <HugeiconsIcon icon={AlertCircleIcon} size={14} />}
    </span>
  );
}

export function AgentTasks({ tasks, filter, defaultFilter = "all", onFilterChange, expandedTaskId, defaultExpandedTaskId = null,
  onExpandedTaskChange, onOpenTask, onNewTask, labels: suppliedLabels, className }: AgentTasksProps) {
  const labels = { ...agentTasksLabels, ...suppliedLabels };
  const [localFilter, setLocalFilter] = useState<AgentTaskFilter>(defaultFilter);
  const [localExpanded, setLocalExpanded] = useState<string | null>(defaultExpandedTaskId);
  const selectedFilter = filter ?? localFilter;
  const expanded = expandedTaskId === undefined ? localExpanded : expandedTaskId;
  const id = useId();
  const Plus = useIcon("plus");
  const taskGroups: Record<AgentTaskFilter, AgentTask[]> = { all: [], "needs-you": [], running: [], done: [] };
  for (const task of tasks) {
    taskGroups.all.push(task);
    taskGroups[task.status === "failed" ? "needs-you" : task.status].push(task);
  }
  const filterLabels = { all: labels.all, "needs-you": labels.needsYou, running: labels.running, done: labels.done };
  const statusLabels = { failed: labels.failed, "needs-you": labels.needsYou, running: labels.running, done: labels.done };

  function selectFilter(value: string) {
    const next = filters.find((item) => item === value);
    if (!next) return;
    if (filter === undefined) setLocalFilter(next);
    onFilterChange?.(next);
  }

  function toggleTask(taskId: string) {
    const next = expanded === taskId ? null : taskId;
    if (expandedTaskId === undefined) setLocalExpanded(next);
    onExpandedTaskChange?.(next);
  }

  return (
    <Container className={cn("w-full max-w-md", className)} data-block="agent-tasks" role="region" aria-label={labels.title}>
      <ContainerBody>
        <Tabs value={selectedFilter} onValueChange={selectFilter} variant="pill" color="default">
          <div className="overflow-x-auto pb-1" onFocusCapture={(event) => event.target.scrollIntoView?.({ block: "nearest", inline: "nearest" })}>
            <TabsList className="flex w-full" aria-label={labels.title}>
              {filters.map((item) => <TabItem key={item} value={item} label={filterLabels[item]} badge={taskGroups[item].length} aria-label={`${filterLabels[item]} ${taskGroups[item].length}`} className="flex-1 justify-center" />)}
            </TabsList>
          </div>
          {filters.map((view) => {
            const visibleTasks = taskGroups[view];
            return (
              <TabPanel key={view} value={view}>
                {visibleTasks.length === 0 ? <p className="px-4 py-10 text-center text-body text-fg-subtle">{labels.empty}</p> : (
                  <ul className="flex flex-col gap-0.5">
                    {visibleTasks.map((task) => {
                      const open = expanded === task.id;
                      const taskId = `${id}-${view}-${encodeURIComponent(task.id)}`;
                      const events = task.events ?? [];
                      return (
                        <li key={task.id} className={cn("rounded-xl transition-colors duration-fast", open ? "bg-muted" : "hover:bg-hover")}>
                          <button type="button" id={`${taskId}-trigger`} aria-expanded={open} aria-controls={open ? `${taskId}-activity` : undefined}
                            onClick={() => toggleTask(task.id)} className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-2.5 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-focus-ring">
                            <TaskIndicator status={task.status} />
                            <span className="min-w-0 flex-1">
                              <span className="block break-words text-body font-medium text-fg-default">{task.title}</span>
                              <span className="block break-words text-label text-fg-subtle">{task.model} · {task.duration}</span>
                            </span>
                            <Badge status={task.status === "failed" ? "danger" : task.status === "done" ? "success" : task.status === "needs-you" ? "warning" : "info"}
                              className="min-w-16 shrink-0 justify-center">{statusLabels[task.status]}</Badge>
                          </button>
                          {open ? (
                            <section id={`${taskId}-activity`} aria-labelledby={`${taskId}-trigger`} className="pb-2.5">
                              {events.length > 0 ? (
                                <ol aria-label={labels.activity} className="space-y-1 px-2.5 pb-2.5">
                                  {events.map((event, index) => (
                                    <li key={event.id} className="relative flex items-start gap-2.5 text-label">
                                      {index < events.length - 1 ? <span aria-hidden="true" className="absolute bottom-0 left-2 top-3 w-px translate-y-2 bg-border" /> : null}
                                      <span aria-hidden="true" className="relative flex h-5 w-4 shrink-0 items-center justify-center">
                                        <span className={cn("rounded-full", event.current ? "size-2 bg-brand ring-3 ring-brand/20" : "size-1.5 bg-fg-subtle/40")} />
                                      </span>
                                      <span className={cn("min-w-0 flex-1 break-words leading-5", event.current ? "text-fg-default" : "text-fg-subtle")}>{event.message}</span>
                                      <span className="shrink-0 leading-5 text-fg-subtle">{event.time}</span>
                                    </li>
                                  ))}
                                </ol>
                              ) : <p className="pb-3 pl-9 pr-2.5 text-label text-fg-subtle">{labels.noActivity}</p>}
                              <div className="pl-9">
                                <Button size="sm" variant="tertiary" trailingIcon={OpenIcon} disabled={!onOpenTask} onClick={() => onOpenTask?.(task)}>{labels.open}</Button>
                              </div>
                            </section>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </TabPanel>
            );
          })}
        </Tabs>
      </ContainerBody>
      <ContainerFooter className="justify-between">
        <p role="status" className="text-label text-fg-subtle">{labels.summary(taskGroups["needs-you"].length, taskGroups.running.length)}</p>
        <Button variant="ghost" size="sm" leadingIcon={Plus} onClick={onNewTask} disabled={!onNewTask}>{labels.newTask}</Button>
      </ContainerFooter>
    </Container>
  );
}
