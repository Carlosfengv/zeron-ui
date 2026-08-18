"use client";

import { useState } from "react";
import { Badge } from "@zeron/ui/badge";
import { cn } from "@zeron/ui/system/utils";
import type { AgentTranscriptItem } from "./stream-projection";

type ToolItem = Extract<AgentTranscriptItem, { kind: "tool" }>;

function duration(value: number | undefined): string {
  if (value === undefined) return "Running";
  return value < 1_000 ? `${value} ms` : `${(value / 1_000).toFixed(value < 10_000 ? 1 : 0)} s`;
}

/** Compact lifecycle card: tool arguments and output are disclosed only when requested. */
export function ToolCallCard({ item }: { item: ToolItem }) {
  const [open, setOpen] = useState(item.status === "error");
  const color = item.status === "error" ? "red" : item.status === "success" ? "green" : "amber";
  const state = item.status === "running" ? "Running" : item.status === "error" ? "Failed" : "Completed";
  return <section className="self-start w-full max-w-3xl rounded-md bg-surface-raised/60 px-3 py-2" data-tool-state={item.status}>
    <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="flex w-full min-w-0 items-center gap-2 text-left outline-none focus-visible:ring-1 focus-visible:ring-focus-ring">
      <span aria-hidden="true" className={cn("inline-flex size-4 shrink-0 items-center justify-center leading-none text-fg-muted transition-transform", open && "rotate-90")}>›</span>
      <Badge size="sm" color={color} className="min-w-0 max-w-48"><span className="block truncate">{item.name}</span></Badge>
      <span className={cn("min-w-0 truncate text-label", item.status === "running" && "shimmer-text text-fg-default", item.status === "error" && "text-fg-danger", item.status === "success" && "text-fg-muted")}>{state}</span>
      <span className="ml-auto shrink-0 text-label tabular-nums text-fg-subtle">{duration(item.durationMs)}</span>
    </button>
    {open && <div className="space-y-2 pl-5 pt-2 text-label leading-5"><div><p className="text-fg-subtle">Input</p><pre className="mt-1 max-h-36 overflow-auto whitespace-pre-wrap break-words rounded bg-surface-base p-2 text-fg-muted">{item.argumentsText || "No arguments"}</pre></div>{item.result !== undefined && <div><p className="text-fg-subtle">Output</p><pre className={cn("mt-1 max-h-44 overflow-auto whitespace-pre-wrap break-words rounded bg-surface-base p-2", item.status === "error" ? "text-fg-danger" : "text-fg-default")}>{item.result}</pre></div>}</div>}
  </section>;
}
