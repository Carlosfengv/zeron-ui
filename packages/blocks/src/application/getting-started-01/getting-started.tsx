"use client";

import { useId, useState } from "react";
import { Button } from "@zeron/ui/button";
import { Container, ContainerBody, ContainerHeader } from "@zeron/ui/container";
import { Stepper, StepperIndicator, StepperItem } from "@zeron/ui/stepper";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import type { GettingStartedLabels, GettingStartedProps } from "./getting-started-types";

const defaultLabels: GettingStartedLabels = {
  completed: "Completed",
  current: "Current step",
  pending: "Not completed",
  empty: "No setup tasks yet.",
  progress: (completed, total) => `${completed} of ${total} tasks completed`,
};

/** Embedded setup checklist. Actions never change the caller's completion state. */
export function GettingStarted({ title = "Getting started", tasks, open, defaultOpen = true,
  onOpenChange, onTaskAction, labels: suppliedLabels, className }: GettingStartedProps) {
  const [localOpen, setLocalOpen] = useState(defaultOpen);
  const panelId = useId();
  const isOpen = open ?? localOpen;
  const labels = { ...defaultLabels, ...suppliedLabels };
  const completed = tasks.filter((task) => task.status === "completed").length;
  const progressLabel = labels.progress(completed, tasks.length);
  const Check = useIcon("check");
  const ChevronUp = useIcon("chevron-up");
  const ChevronDown = useIcon("chevron-down");
  const ChevronRight = useIcon("chevron-right");

  function changeOpen() {
    const nextOpen = !isOpen;
    if (open === undefined) setLocalOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }

  return (
    <Container className={cn("w-full", className)} data-block="getting-started">
      <ContainerHeader>
        <h2 className="min-w-0 flex-1 break-words text-body font-medium text-fg-default">{title}</h2>
        <span className="shrink-0 text-label font-medium text-fg-muted" aria-label={progressLabel}>{completed}/{tasks.length}</span>
        <Button type="button" variant="ghost" iconOnly aria-label={`${title}, ${progressLabel}`}
          aria-expanded={isOpen} aria-controls={panelId} onClick={changeOpen}>
          {isOpen ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}
        </Button>
      </ContainerHeader>
      <ContainerBody id={panelId} hidden={!isOpen}>
        {tasks.length === 0 ? <p className="text-body text-fg-muted">{labels.empty}</p> : (
          <ol className="flex flex-col gap-3" aria-label={title}>
            {tasks.map((task, index) => {
              const done = task.status === "completed";
              const actionable = !done && Boolean(task.href || onTaskAction);
              const statusLabel = labels[task.status];
              return (
                <li key={task.id} className="flex min-w-0 items-center gap-3" aria-current={task.status === "current" ? "step" : undefined}>
                  {/* Isolate indicator state: checklist completion is explicit, not inferred from order. */}
                  <div className="shrink-0">
                    <Stepper value={task.status === "pending" ? "" : task.id} nonInteractive>
                      <StepperItem value={task.id} completed={done}>
                        <StepperIndicator role="img" aria-label={statusLabel}>
                          {done ? <Check className="size-4" aria-hidden="true" /> : index + 1}
                        </StepperIndicator>
                      </StepperItem>
                    </Stepper>
                  </div>
                  <p className={cn("min-w-0 flex-1 break-words py-1 text-body", done ? "text-fg-muted" : "text-fg-default")}>{task.title}</p>
                  {actionable ? (
                    task.href && !task.disabled ? (
                      <Button asChild variant="ghost" iconOnly aria-label={task.title}>
                        <a href={task.href}><ChevronRight aria-hidden="true" /></a>
                      </Button>
                    ) : (
                      <Button type="button" variant="ghost" iconOnly aria-label={task.title} disabled={task.disabled}
                        onClick={() => { if (!task.href) onTaskAction?.(task.id); }}>
                        <ChevronRight aria-hidden="true" />
                      </Button>
                    )
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
      </ContainerBody>
    </Container>
  );
}
