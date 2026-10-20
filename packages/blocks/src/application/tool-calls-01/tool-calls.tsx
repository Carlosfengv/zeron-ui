"use client";

import { useEffect, useRef, useState } from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@zeron/ui/accordion";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { CodeBlock, CodeDiff } from "@zeron/ui/code-block";
import { Empty, EmptyHeader, EmptyTitle } from "@zeron/ui/empty";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { useIcon, type IconName } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { toolCallsEnLabels } from "./tool-calls-labels";
import type { ToolCall, ToolCallDecision, ToolCallsLabels, ToolCallsProps } from "./tool-calls-types";

const icons: Record<ToolCall["kind"], IconName> = {
  search: "search", read: "file-text", write: "file", edit: "pencil", command: "play", custom: "settings",
};

function ToolDetails({ call, labels }: { call: ToolCall; labels: ToolCallsLabels }) {
  switch (call.kind) {
    case "search":
      return <div className="space-y-2">
        <p className="break-all font-mono text-label text-fg-default">{call.query}</p>
        {call.matches?.length ? <ul className="space-y-2" aria-label={labels.matches(call.matches.length)}>
          {call.matches.map((match) => <li key={match.id} className="min-w-0 rounded-lg bg-surface-base p-3">
            <p className="break-all font-mono text-label text-fg-default">{match.path}{match.line != null && `:${match.line}`}</p>
            <pre className="mt-1 whitespace-pre-wrap break-all font-mono text-label text-fg-muted">{match.preview}</pre>
          </li>)}
        </ul> : <p className="text-label text-fg-muted">{call.status === "completed" ? labels.noMatches : labels.noOutput}</p>}
      </div>;
    case "read":
    case "write":
      return <CodeBlock file={call.file} options={{ overflow: "wrap" }} />;
    case "edit":
      return <CodeDiff oldFile={call.oldFile} newFile={call.newFile} options={{ diffStyle: "unified", overflow: "wrap" }} />;
    case "command":
      return <div className="space-y-2">
        {call.cwd && <p className="break-all text-label text-fg-muted">{labels.directory}: <span className="font-mono">{call.cwd}</span></p>}
        <CodeBlock file={{ name: "terminal.sh", contents: call.command }} options={{ overflow: "wrap" }} />
        {call.exitCode != null && <p className="text-label text-fg-muted">{labels.exitCode(call.exitCode)}</p>}
      </div>;
    case "custom":
      return call.input != null ? <section aria-label={labels.input} className="space-y-1">
        <h4 className="text-label font-medium text-fg-muted">{labels.input}</h4>
        <CodeBlock file={{ name: "input.json", contents: call.input }} options={{ overflow: "wrap" }} />
      </section> : null;
  }
}

function ToolCallRow({ call, labels, locale, open, onOpenChange, onApproval, onRetry }: {
  call: ToolCall; labels: ToolCallsLabels; locale: string; open: boolean; onOpenChange: (open: boolean) => void;
  onApproval: ToolCallsProps["onApproval"]; onRetry: ToolCallsProps["onRetry"];
}) {
  const Icon = useIcon(icons[call.kind]);
  const Allow = useIcon("check");
  const Deny = useIcon("x");
  const Retry = useIcon("rotate-ccw");
  const [pending, setPending] = useState(false);
  const [actionError, setActionError] = useState(false);
  const lock = useRef(false);
  const mounted = useRef(false);
  const request = useRef(0);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    // A new lifecycle state supersedes requests from the previous state.
    // Immutable refreshes of the same id/status retain their pending action.
    request.current += 1;
    lock.current = false;
    setPending(false);
    setActionError(false);
    return () => { request.current += 1; };
  }, [call.id, call.status]);

  async function act(decision?: ToolCallDecision) {
    if (lock.current) return;
    lock.current = true;
    setPending(true);
    setActionError(false);
    const attempt = ++request.current;
    try {
      if (decision) await onApproval?.(call, decision);
      else await onRetry?.(call);
    } catch {
      if (mounted.current && request.current === attempt) setActionError(true);
    } finally {
      if (mounted.current && request.current === attempt) {
        lock.current = false;
        setPending(false);
      }
    }
  }

  let elapsed: string | undefined;
  if (call.durationMs != null && Number.isFinite(call.durationMs) && call.durationMs >= 0) {
    let formatter: Intl.NumberFormat;
    try { formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }); }
    catch { formatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 }); }
    elapsed = call.durationMs < 1000 ? `${formatter.format(call.durationMs)} ms` : `${formatter.format(call.durationMs / 1000)} s`;
  }
  const status = call.status === "failed" ? "danger" : call.status === "completed" ? "success"
    : call.status === "approval-required" ? "warning" : call.status === "running" ? "info" : "neutral";

  return <Accordion value={open ? "call" : ""} onValueChange={(value: string) => onOpenChange(value === "call")}>
    <AccordionItem value="call" data-tool-call={call.id} data-tool-state={call.status}>
      <AccordionTrigger aria-label={`${call.label} · ${labels.status[call.status]}`}>
        <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <Icon size={16} className="shrink-0 text-fg-muted" aria-hidden="true" />
          <span className={cn("min-w-0 flex-1 break-all text-body", call.status === "running" && "motion-safe:animate-pulse")}>{call.label}</span>
          <span className="flex min-w-0 max-w-full flex-wrap items-center gap-2">
            <Badge variant="plain" size="sm" status={status}><span className="whitespace-normal break-all">{labels.status[call.status]}</span></Badge>
            {elapsed && <span className="text-label font-normal tabular-nums text-fg-subtle">{elapsed}</span>}
          </span>
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <div className="min-w-0 space-y-3">
          {call.description && <p className="break-words text-body text-fg-muted">{call.description}</p>}
          <ToolDetails call={call} labels={labels} />
          {call.output != null && <section aria-label={labels.output} className="space-y-1">
            <h4 className="text-label font-medium text-fg-muted">{labels.output}</h4>
            <CodeBlock file={{ name: "output.txt", contents: call.output }} options={{ overflow: "wrap" }} />
          </section>}
          {call.error && <InlineNotice tone="danger" variant="emphasized" role="alert"><InlineNoticeContent>{call.error}</InlineNoticeContent></InlineNotice>}
          {call.kind === "command" && call.status === "approval-required" && <div className="space-y-3">
            <InlineNotice variant="emphasized" tone="warning"><InlineNoticeContent>{labels.approval}</InlineNoticeContent></InlineNotice>
            {onApproval && <div className="flex flex-wrap items-center justify-end gap-2" aria-busy={pending}>
              <Button variant="secondary" size="sm" leadingIcon={Deny} disabled={pending} onClick={() => void act("deny")}>{labels.deny}</Button>
              <Button variant="primary" size="sm" leadingIcon={Allow} disabled={pending} loading={pending} onClick={() => void act("allow")}>{pending ? labels.deciding : labels.allow}</Button>
            </div>}
          </div>}
          {call.status === "failed" && onRetry && <Button variant="secondary" size="sm" leadingIcon={Retry} loading={pending} disabled={pending} onClick={() => void act()}>{labels.retry}</Button>}
          {actionError && <InlineNotice variant="emphasized" tone="danger" role="alert"><InlineNoticeContent>{labels.actionFailed}</InlineNoticeContent></InlineNotice>}
        </div>
      </AccordionContent>
    </AccordionItem>
  </Accordion>;
}

/** Disclosure and execution data are independent; actions only request host updates. */
export function ToolCalls({ items, summary, defaultOpen = false, expandedIds, defaultExpandedIds,
  onExpandedChange, onApproval, onRetry, labels: supplied, locale = "en-US", className, ...props }: ToolCallsProps) {
  const labels: ToolCallsLabels = { ...toolCallsEnLabels, ...supplied, status: { ...toolCallsEnLabels.status, ...supplied?.status } };
  const [localExpanded, setLocalExpanded] = useState<string[]>(() => [...(defaultExpandedIds ?? items.filter((item) => item.status === "approval-required" || item.status === "failed" || item.kind === "write" || item.kind === "edit").map((item) => item.id))]);
  const expanded = expandedIds ?? localExpanded;
  const List = useIcon("list");
  const content = items.length ? <ul className="min-w-0 space-y-1" aria-label={labels.title}>
    {items.map((call) => <li key={call.id} className="min-w-0">
      <ToolCallRow call={call} labels={labels} locale={locale} open={expanded.includes(call.id)}
        onOpenChange={(open) => {
          const ids = open ? [...new Set([...expanded, call.id])] : expanded.filter((id) => id !== call.id);
          if (expandedIds === undefined) setLocalExpanded(ids);
          onExpandedChange?.(ids);
        }} onApproval={onApproval} onRetry={onRetry} />
    </li>)}
  </ul> : <Empty reason="no-data"><EmptyHeader><EmptyTitle>{labels.empty}</EmptyTitle></EmptyHeader></Empty>;
  return <div {...props} data-block="tool-calls-01" className={cn("min-w-0 w-full", className)}>
    {summary ? <Accordion defaultValue={defaultOpen ? "group" : ""}>
      <AccordionItem value="group"><AccordionTrigger><span className="flex min-w-0 items-center gap-2"><List size={16} className="shrink-0" aria-hidden="true" /><span className="break-all">{summary}</span></span></AccordionTrigger>
        <AccordionContent>{content}</AccordionContent>
      </AccordionItem>
    </Accordion> : content}
    <span role="status" className="sr-only">{items.map((item) => `${item.label}: ${labels.status[item.status]}`).join("; ")}</span>
  </div>;
}
