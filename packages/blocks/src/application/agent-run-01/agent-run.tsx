"use client";

import { useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { Badge, type BadgeStatus } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Card, CardContent } from "@zeron/ui/card";
import { SegmentedBar, chartColor } from "@zeron/ui/chart-primitives";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "@zeron/ui/dropdown";
import { Empty, EmptyTitle } from "@zeron/ui/empty";
import { InfoItem, InfoItemContent, InfoItemDescription, InfoItemLeading, InfoItemTitle, InfoItemTrailing } from "@zeron/ui/info-item";
import { MenuItem } from "@zeron/ui/menu-item";
import { Popover, PopoverContent, PopoverTrigger } from "@zeron/ui/popover";
import { useIcon, type IconName } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { AgentRunDetails, AgentRunHandoff, AgentRunToolBadge } from "./agent-run-details";
import { agentRunEnglishLabels } from "./agent-run-labels";
import type { AgentRunLabels, AgentRunNode, AgentRunProps, AgentRunStatus } from "./agent-run-types";
import styles from "./agent-run.module.css";

const statusAppearance = {
  idle: { status: "neutral", icon: "circle" },
  working: { status: "info", icon: "circle" },
  done: { status: "success", icon: "check" },
  paused: { status: "warning", icon: "pause" },
  stopped: { status: "neutral", icon: "circle-x" },
  failed: { status: "danger", icon: "circle-x" },
} as const satisfies Record<AgentRunStatus, { status: BadgeStatus; icon: IconName }>;

function summarizeTree(root: AgentRunNode | null) {
  let working = 0;
  const ids = new Set<string>();
  function visit(node: AgentRunNode) {
    ids.add(node.id);
    if (node.status === "working") working += 1;
    node.children?.forEach(visit);
  }
  if (root) visit(root);
  return { working, ids };
}

interface AgentRunTreeContext {
  runId: string;
  openId: string | null;
  onOpenChange: (id: string, open: boolean) => void;
  labels: AgentRunLabels;
  locale: string;
  compactNumber: Intl.NumberFormat;
  fullNumber: Intl.NumberFormat;
  onMessage: AgentRunProps["onMessage"];
  onControl: AgentRunProps["onControl"];
}

function useAgentRunActivity(node: AgentRunNode) {
  const handoffFrom = node.handoff?.from;
  const handoffSummary = node.handoff?.summary;
  const [previous, setPrevious] = useState({ status: node.status, handoffFrom, handoffSummary, pulse: 0 });
  const handoffChanged = handoffFrom !== previous.handoffFrom || handoffSummary !== previous.handoffSummary;
  if (previous.status !== node.status || handoffChanged) {
    const started = node.status === "working" && previous.status !== "working";
    let pulse = previous.pulse;
    if (started || (handoffChanged && node.handoff)) pulse += 1;
    setPrevious({ status: node.status, handoffFrom, handoffSummary, pulse });
  }
  return node.status === "paused" || node.status === "stopped" ? 0 : previous.pulse;
}

function AgentRunCard({ node, color, context, pulse }: { node: AgentRunNode; color: string; context: AgentRunTreeContext; pulse: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const statusId = useId();
  const summaryId = useId();
  const compact = node.kind === "tool";
  const open = context.openId === node.id;
  const appearance = statusAppearance[node.status];
  const StatusIcon = useIcon(appearance.icon);
  const AgentIcon = useIcon(node.icon ?? (compact ? "settings" : "doc-data-grid"));
  const { labels, compactNumber, fullNumber } = context;
  const usage = node.usage;
  const hasUsage = usage && Number.isFinite(usage.tokens) && usage.tokens >= 0 && Number.isFinite(usage.limit) && usage.limit > 0;
  const nearLimit = hasUsage && usage.tokens / usage.limit >= 0.8;

  return <Popover open={open} onOpenChange={(next) => context.onOpenChange(node.id, next)}>
    <Card ref={cardRef} className={cn("relative border-hairline border-border-subtle pb-3 shadow-control transition-colors duration-fast hover:bg-hover", open && "border-border", compact ? "min-h-29" : "min-h-40")} data-agent-node={node.id} data-status={node.status}>
      <InfoItem className="px-3.5 pt-3.5 pb-0">
        <InfoItemLeading className={styles.nodeIcon} aria-hidden="true"><AgentIcon /></InfoItemLeading>
        <InfoItemContent>
          <InfoItemTitle id={titleId} className="truncate" title={node.name}>{node.name}</InfoItemTitle>
          {!compact && node.model && <InfoItemDescription className="truncate" title={node.model}>{node.model}</InfoItemDescription>}
        </InfoItemContent>
        <InfoItemTrailing>
          <Badge id={statusId} size="sm" status={appearance.status} className={cn(styles.statusBadge, compact && "min-w-5 justify-center gap-0 px-0")} leadingIcon={
            <span className={styles.statusEnter} key={node.status}><StatusIcon className={cn(
              node.status === "idle" && styles.idleIcon,
              node.status === "working" && cn(styles.workingIcon, "motion-safe:animate-spin"),
            )} /></span>
          }>
            <span key={node.status} className={compact ? "sr-only" : styles.statusEnter}>{labels.status[node.status]}</span>
          </Badge>
        </InfoItemTrailing>
      </InfoItem>
      <CardContent className={cn("grid gap-2 px-3.5", compact ? "pt-2" : "pt-3")}>
        <InfoItemDescription id={summaryId} className="truncate" title={node.summary}>{node.summary}</InfoItemDescription>
        {hasUsage && <div className="flex items-center gap-2">
          <SegmentedBar className={cn(styles.usage, "h-1 flex-1 gap-0")} mode="capacity" total={usage.limit}
            segmentSlot="agent-run-usage-fill" remainderSlot="agent-run-usage-remainder"
            style={{ "--agent-run-usage-ratio": Math.min(1, usage.tokens / usage.limit) } as CSSProperties}
            valueText={`${fullNumber.format(usage.tokens)} / ${fullNumber.format(usage.limit)} ${labels.tokens}`}
            segments={[{ id: node.id, label: labels.tokens, value: usage.tokens, color: nearLimit ? "var(--warning-strong)" : color }]} />
          <InfoItemDescription aria-hidden="true" className={cn("shrink-0 tabular-nums transition-colors duration-moderate motion-reduce:transition-none", nearLimit && "text-fg-warning")}>{compactNumber.format(usage.tokens)} / {compactNumber.format(usage.limit)}</InfoItemDescription>
        </div>}
        {!compact && <div className="mt-1 flex min-h-5 min-w-0 items-center gap-1.5">
          {node.tools?.slice(0, 2).map((tool) => <AgentRunToolBadge key={tool.id} tool={tool} compact />)}
          {node.handoff && <AgentRunHandoff handoff={node.handoff} compact />}
        </div>}
      </CardContent>
      {pulse > 0 && <span key={pulse} className={cn(styles.activityGlow, "rounded-xl")} aria-hidden="true" />}
      <PopoverTrigger className="absolute inset-0 z-action cursor-pointer rounded-xl outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-focus-ring" aria-labelledby={`${titleId} ${statusId}`} aria-describedby={summaryId} />
    </Card>
    <PopoverContent anchor={cardRef} side={compact ? "top" : "bottom"} align="start" sideOffset={8} surfaceShadow="overlay" className={cn(styles.details, "p-0")}>
      <div className={cn(styles.detailsBody, "grid gap-2.5 overflow-y-auto p-3.5")}>
        <AgentRunDetails node={node} runId={context.runId} labels={labels} locale={context.locale} onMessage={context.onMessage} onControl={context.onControl} />
      </div>
    </PopoverContent>
  </Popover>;
}

function AgentRunBranch({ node, color, root = false, context }: {
  node: AgentRunNode;
  color: string;
  root?: boolean;
  context: AgentRunTreeContext;
}) {
  const resolvedColor = node.colorIndex == null ? color : chartColor(node.colorIndex);
  const children = node.children ?? [];
  const pulse = useAgentRunActivity(node);
  return <li className={root ? styles.root : styles.branch} style={{ "--agent-run-color": resolvedColor } as CSSProperties} data-active={node.status === "working"}>
    <div className={cn(styles.card, pulse > 0 && (pulse % 2 ? styles.activityOdd : styles.activityEven))}>
      <AgentRunCard node={node} color={resolvedColor} context={context} pulse={pulse} />
    </div>
    {children.length > 0 && <ul role="list" className={cn(styles.children, root && children.length <= 3 && styles.branches)}>
      {children.map((child) => <AgentRunBranch key={child.id} node={child} color={resolvedColor} context={context} />)}
    </ul>}
  </li>;
}

type AgentRunTreeProps = Pick<AgentRunProps, "run" | "onControl" | "onMessage"> & {
  ids: ReadonlySet<string>;
  labels: AgentRunLabels;
  locale: string;
};

function AgentRunTree({ run, ids, labels, locale, onControl, onMessage }: AgentRunTreeProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const numbers = useMemo(() => ({
    compactNumber: new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 }),
    fullNumber: new Intl.NumberFormat(locale),
  }), [locale]);
  if (openId !== null && !ids.has(openId)) setOpenId(null);
  if (!run.root) return <Empty scope="inline" reason="no-data"><EmptyTitle>{labels.empty}</EmptyTitle></Empty>;

  const context: AgentRunTreeContext = {
    runId: run.id,
    openId,
    onOpenChange: (id, open) => setOpenId((current) => open ? id : current === id ? null : current),
    labels,
    locale,
    ...numbers,
    onMessage,
    onControl,
  };
  return <ul role="list" className={styles.tree}><AgentRunBranch node={run.root} color={chartColor(1)} context={context} root /></ul>;
}

export function AgentRun({ run, runs, onRunChange, labels = agentRunEnglishLabels, locale = "en", onControl, onMessage, className }: AgentRunProps) {
  const titleId = useId();
  const Folder = useIcon("folder");
  const Chevron = useIcon("chevron-down");
  const { working, ids } = summarizeTree(run.root);
  return <section aria-labelledby={titleId} className={cn(styles.panel, "min-w-0 bg-surface-base p-4 sm:p-8", className)} data-block="agent-run">
    <header className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-1">
      {onRunChange && runs && runs.length > 0 ? <DropdownMenu>
        <DropdownTrigger render={<Button type="button" variant="ghost" size="md" className="min-w-0 max-w-full" leadingIcon={Folder} trailingIcon={Chevron} aria-label={`${labels.chooseRun}: ${run.title}`} />}>
          <span id={titleId} className="truncate">{run.title}</span>
        </DropdownTrigger>
        <DropdownContent checkedIndex={runs.findIndex((candidate) => candidate.id === run.id)}>
          {runs.map((candidate, index) => <MenuItem key={candidate.id} index={index} label={candidate.title} icon={Folder} checked={run.id === candidate.id} onSelect={() => onRunChange(candidate.id)} />)}
        </DropdownContent>
      </DropdownMenu> : <h2 id={titleId} className="flex min-w-0 items-center gap-2 text-body font-medium text-fg-default"><Folder size={16} aria-hidden="true" /><span className="wrap-anywhere">{run.title}</span></h2>}
      <p role="status" className="flex shrink-0 gap-3 text-body tabular-nums">
        <span className={working ? "text-fg-info" : "text-fg-subtle"}>{labels.workingCount(working)}</span>
        <span className="text-fg-muted">{labels.totalCount(ids.size)}</span>
      </p>
    </header>
    <AgentRunTree key={run.id} run={run} ids={ids} labels={labels} locale={locale} onControl={onControl} onMessage={onMessage} />
  </section>;
}
