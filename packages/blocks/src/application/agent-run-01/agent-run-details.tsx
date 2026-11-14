"use client";

import ClaudeColor from "@lobehub/icons/es/Claude/components/Color";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Input } from "@zeron/ui/input";
import { PopoverClose, PopoverDescription, PopoverFooter, PopoverHeader, PopoverTitle } from "@zeron/ui/popover";
import { Separator } from "@zeron/ui/separator";
import { useIcon } from "@zeron/ui/system/icon-context";
import type { AgentRunLabels, AgentRunNode, AgentRunProps, AgentRunTool } from "./agent-run-types";

export function AgentRunToolBadge({ tool, compact }: { tool: AgentRunTool; compact?: boolean }) {
  const Icon = useIcon(tool.icon);
  return <Badge size="sm" leadingIcon={<Icon />} title={compact ? tool.label : undefined}>
    {compact ? <span className="sr-only">{tool.label}</span> : tool.label}
  </Badge>;
}

export function AgentRunHandoff({ handoff, compact }: { handoff: NonNullable<AgentRunNode["handoff"]>; compact?: boolean }) {
  const HandoffIcon = useIcon("corner-down-right");
  return <span className="flex min-w-0 items-center gap-1 text-label text-fg-muted" title={compact ? `${handoff.from} · ${handoff.summary}` : undefined}>
    <HandoffIcon className="size-3.5 shrink-0" aria-hidden="true" />
    <span className={compact ? "truncate" : "wrap-anywhere"}><span className="font-medium">{handoff.from}</span>{" "}{handoff.summary}</span>
  </span>;
}

export function AgentRunDetails({ node, runId, labels, locale, onMessage, onControl }: {
  node: AgentRunNode;
  runId: string;
  labels: AgentRunLabels;
  locale: string;
  onMessage: AgentRunProps["onMessage"];
  onControl: AgentRunProps["onControl"];
}) {
  const [composing, setComposing] = useState(false);
  const [message, setMessage] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const messageButton = useRef<HTMLButtonElement>(null);
  const Close = useIcon("x");
  const modelIcon = node.modelIcon ?? (/^claude(?:[-\s]|$)/i.test(node.model?.trim() ?? "") ? <ClaudeColor size={16} /> : undefined);
  const { number, currency } = useMemo(() => ({
    number: new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }),
    currency: new Intl.NumberFormat(locale, { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  }), [locale]);
  const canControl = onControl && node.controllable && (node.status === "working" || node.status === "paused");
  const paused = node.status === "paused";
  const metrics = [
    [labels.elapsed, node.elapsedSeconds == null ? undefined : labels.duration(number.format(node.elapsedSeconds))],
    [labels.cost, node.costUsd == null ? undefined : currency.format(node.costUsd)],
    [labels.tokens, node.usage == null ? undefined : number.format(node.usage.tokens)],
  ].filter(([, value]) => value !== undefined);

  useEffect(() => {
    if (composing) input.current?.focus();
  }, [composing]);

  return <>
    <PopoverHeader className="gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <PopoverTitle className="wrap-anywhere">{node.name}</PopoverTitle>
        <PopoverClose render={<Button type="button" variant="ghost" size="xs" iconOnly aria-label={labels.close}><Close /></Button>} />
      </div>
      <PopoverDescription className="wrap-anywhere">{node.assignment ?? node.summary}</PopoverDescription>
      {node.assignment && node.assignment !== node.summary && <p className="wrap-anywhere text-label text-fg-muted">{node.summary}</p>}
      {node.model && <Badge size="sm" leadingIcon={modelIcon}>{node.model}</Badge>}
    </PopoverHeader>
    {metrics.length > 0 && <>
      <Separator tone="subtle" />
      <dl className="flex flex-wrap gap-x-5 gap-y-2 tabular-nums">
        {metrics.map(([label, value]) => <div key={label} className="min-w-0 flex-1">
          <dt className="text-label text-fg-muted">{label}</dt><dd className="font-medium">{value}</dd>
        </div>)}
      </dl>
    </>}
    {(Boolean(node.tools?.length) || node.handoff) && <>
      <Separator tone="subtle" />
      <div className="grid gap-2">
        {Boolean(node.tools?.length) && <div className="flex flex-wrap gap-1">
          {node.tools?.map((tool) => <AgentRunToolBadge key={tool.id} tool={tool} />)}
        </div>}
        {node.handoff && <AgentRunHandoff handoff={node.handoff} />}
      </div>
    </>}
    {(onMessage || canControl) && <PopoverFooter className="mt-1 flex-wrap justify-start gap-1.5">
      {onMessage && <Button ref={messageButton} type="button" variant="secondary" size="lg" className="flex-1" aria-expanded={composing} onClick={() => setComposing((open) => !open)}>{labels.message}</Button>}
      {canControl && <>
        <Button type="button" variant="secondary" size="lg" className="flex-1" onClick={() => onControl(runId, node.id, paused ? "resume" : "pause")}>{paused ? labels.resume : labels.pause}</Button>
        <Button type="button" variant="secondary" size="lg" className="flex-1" onClick={() => onControl(runId, node.id, "stop")}>{labels.stop}</Button>
      </>}
    </PopoverFooter>}
    {onMessage && composing && <form className="flex gap-2" onSubmit={(event) => {
      event.preventDefault();
      const text = message.trim();
      if (!text) return;
      onMessage(runId, node.id, text);
      setMessage("");
      setComposing(false);
      messageButton.current?.focus();
    }}>
      <Input ref={input} size="sm" value={message} onChange={(event) => setMessage(event.target.value)} aria-label={labels.message} />
      <Button type="submit" size="sm" disabled={!message.trim()}>{labels.send}</Button>
    </form>}
  </>;
}
