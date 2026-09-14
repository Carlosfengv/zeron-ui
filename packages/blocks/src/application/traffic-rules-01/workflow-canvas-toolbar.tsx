"use client";

import { Button } from "@zeron/ui/button";
import { cn } from "@zeron/ui/system/utils";
import { WorkflowZoomSelect } from "./workflow-zoom-select";

export function WorkflowCanvasToolbar({
  ariaLabel,
  className,
  onOverview,
  onZoomChange,
  zoom,
}: {
  ariaLabel: string;
  className?: string;
  onOverview: () => void;
  onZoomChange: (value: number) => void;
  zoom: number;
}) {
  return <div className={cn("flex w-40 items-center justify-between gap-1 rounded-lg border border-border bg-surface-floating p-1", className)}>
    <WorkflowZoomSelect ariaLabel={ariaLabel} onChange={onZoomChange} value={zoom} />
    <span aria-hidden className="h-4 border-r border-border" />
    <Button onClick={onOverview} size="sm" type="button" variant="ghost">流程总览</Button>
  </div>;
}
