"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@zeron/ui/system/utils";

function firstLine(text: string): string {
  return text.split("\n", 1)[0] ?? "";
}

function latestLine(text: string): string {
  const lines = text.trimEnd().split("\n");
  return lines.at(-1) ?? "";
}

/** Harness-style transparent Think disclosure: the tail follows the latest delta while running. */
export function ReasoningRow({ text, running }: { text: string; running: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const summaryRef = useRef<HTMLSpanElement>(null);
  const summary = running ? latestLine(text) : firstLine(text);

  useEffect(() => {
    const element = summaryRef.current;
    if (running && element) element.scrollLeft = element.scrollWidth;
  }, [running, summary]);

  return <section className="relative overflow-hidden" data-reasoning-state={running ? "running" : "settled"}>
    <button type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)} className="group flex min-h-9 w-full min-w-0 items-center gap-2 overflow-hidden rounded-md px-2 py-1.5 text-left outline-none hover:bg-hover focus-visible:ring-1 focus-visible:ring-focus-ring">
      <span aria-hidden="true" className={cn("inline-flex size-4 shrink-0 items-center justify-center leading-none text-fg-muted transition-transform", expanded && "rotate-90")}>›</span>
      <span aria-hidden="true" className={cn("size-1.5 rounded-full bg-fg-muted", running && "animate-pulse")} />
      <span className={cn("text-body", running ? "shimmer-text text-fg-default" : "text-fg-muted")}>Think</span>
      <span aria-hidden="true" className="size-0.5 rounded-full bg-fg-subtle" />
      <span ref={summaryRef} className="min-w-0 flex-1 truncate text-label text-fg-subtle">{summary}</span>
    </button>
    {expanded && <p className="whitespace-pre-wrap break-words px-7 pb-2 pt-1 text-sm leading-5 text-fg-muted">{text}</p>}
    {running && <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 animate-[pulse_2.6s_ease-out_infinite] bg-gradient-to-r from-transparent via-surface-base/60 to-transparent" />}
  </section>;
}
