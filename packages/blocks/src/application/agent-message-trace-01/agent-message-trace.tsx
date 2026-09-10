"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { badgeColors } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { Skeleton } from "@zeron/ui/skeleton";
import { Tooltip, TooltipProvider } from "@zeron/ui/tooltip";
import { useIcon, type IconName } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import {
  agentMessageTraceDuration,
  buildAgentMessageTraceModel,
  createAgentMessageTraceTicks,
  defaultExpandedAgentMessageTraceIds,
  flattenAgentMessageTraceRows,
  formatAgentMessageTraceDuration,
  type AgentMessageTraceRow,
} from "./agent-message-trace-model";
import {
  agentMessageTraceKinds,
  type AgentMessageTraceKind,
  type AgentMessageTraceLabels,
  type AgentMessageTraceProps,
  type AgentMessageTraceSpan,
  type AgentMessageTraceStatus,
} from "./agent-message-trace-types";

const HEADER_HEIGHT = 28;
const ROW_HEIGHT = 28;
const GRID_BASE_CLASS = "grid w-full";
const gridLayout = {
  compact: {
    className: "grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,2fr)]",
    timelineStart: "56.52%",
  },
  medium: {
    className: "grid-cols-[minmax(0,2fr)_minmax(0,1.25fr)_minmax(0,3.75fr)]",
    timelineStart: "46.43%",
  },
  wide: {
    className: "grid-cols-[minmax(0,2fr)_minmax(0,1.2fr)_minmax(0,6.8fr)]",
    timelineStart: "32%",
  },
} as const;

const defaultLabels: AgentMessageTraceLabels = {
  ariaLabel: "Agent message execution trace",
  spanColumn: "Span",
  operationColumn: "Operation",
  expandAll: "Expand all spans",
  collapseAll: "Collapse all spans",
  chat: "Chat",
  agent: "Agent",
  tool: "Tool",
  running: "Running",
  success: "Completed",
  error: "Failed",
  cancelled: "Cancelled",
  loading: "Loading trace",
  empty: "No spans are available for this message.",
  noMatchingSpans: "No spans match the selected types.",
  errorMessage: "The trace could not be displayed.",
};

const kindPresentation: Record<AgentMessageTraceKind, { color: string; icon: IconName }> = {
  chat: { color: badgeColors.violet, icon: "message-circle" },
  agent: { color: badgeColors.red, icon: "brain" },
  tool: { color: badgeColors.lime, icon: "settings" },
};

const statusIcon: Record<AgentMessageTraceStatus, IconName> = {
  running: "loader",
  success: "check",
  error: "x",
  cancelled: "pause",
};

function normalizeIds(ids: readonly string[]): string[] {
  return [...new Set(ids)].sort();
}

function sameIds(left: readonly string[], right: readonly string[]): boolean {
  const normalizedLeft = normalizeIds(left);
  const normalizedRight = normalizeIds(right);
  return normalizedLeft.length === normalizedRight.length
    && normalizedLeft.every((id, index) => id === normalizedRight[index]);
}

function statusLabel(status: AgentMessageTraceStatus, labels: AgentMessageTraceLabels): string {
  return labels[status];
}

function measuredSpanDuration(span: AgentMessageTraceSpan, nowOffsetMs?: number): number {
  if (span.durationMs !== undefined && Number.isFinite(span.durationMs)) return Math.max(0, span.durationMs);
  if (span.status === "running" && nowOffsetMs !== undefined) return Math.max(0, nowOffsetMs - span.startOffsetMs);
  return 0;
}

function TraceLegend({
  kind,
  active,
  label,
  onToggle,
}: {
  kind: AgentMessageTraceKind;
  active: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-lg px-1.5 text-label text-fg-muted outline-none transition-[background-color,color,opacity] duration-fast",
        "hover:bg-hover hover:text-fg-default focus-visible:ring-1 focus-visible:ring-focus-ring",
        !active && "opacity-40"
      )}
      onClick={onToggle}
    >
      <span aria-hidden className="size-1.5 rounded-full" style={{ backgroundColor: kindPresentation[kind].color }} />
      {label}
    </button>
  );
}

function TraceToolbar({
  activeKinds,
  hasBranches,
  labels,
  onKindsChange,
  onExpandAll,
  onCollapseAll,
}: {
  activeKinds: ReadonlySet<AgentMessageTraceKind>;
  hasBranches: boolean;
  labels: AgentMessageTraceLabels;
  onKindsChange: (kinds: readonly AgentMessageTraceKind[]) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}) {
  const ExpandIcon = useIcon("chevron-down");
  const CollapseIcon = useIcon("chevron-up");

  return (
    <div className="flex min-h-9 shrink-0 items-center justify-between gap-2 pb-2">
      <div className="flex min-w-0 flex-wrap items-center gap-1">
        {agentMessageTraceKinds.map((kind) => (
          <TraceLegend
            key={kind}
            active={activeKinds.has(kind)}
            kind={kind}
            label={labels[kind]}
            onToggle={() => {
              const next = new Set(activeKinds);
              if (next.has(kind)) next.delete(kind);
              else next.add(kind);
              onKindsChange(agentMessageTraceKinds.filter((item) => next.has(item)));
            }}
          />
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Tooltip content={labels.expandAll}>
          <Button aria-label={labels.expandAll} disabled={!hasBranches} iconOnly onClick={onExpandAll} size="xs" type="button" variant="ghost">
            <ExpandIcon aria-hidden size={16} />
          </Button>
        </Tooltip>
        <Tooltip content={labels.collapseAll}>
          <Button aria-label={labels.collapseAll} disabled={!hasBranches} iconOnly onClick={onCollapseAll} size="xs" type="button" variant="ghost">
            <CollapseIcon aria-hidden size={16} />
          </Button>
        </Tooltip>
      </div>
    </div>
  );
}

function TraceHeader({
  gridClassName,
  labels,
  ticks,
  locale,
}: {
  gridClassName: string;
  labels: AgentMessageTraceLabels;
  ticks: readonly { value: number; position: number }[];
  locale: string;
}) {
  return (
    <div className={cn(GRID_BASE_CLASS, gridClassName, "sticky top-0 z-action h-7 border-b border-border bg-surface-floating text-label font-medium text-fg-muted")} role="row">
      <div className="flex min-w-0 items-center bg-surface-floating px-2" role="columnheader">
        {labels.spanColumn}
      </div>
      <div className="flex min-w-0 items-center border-l border-border bg-surface-floating px-2" role="columnheader">
        {labels.operationColumn}
      </div>
      <div className="relative border-l border-border" role="columnheader">
        {ticks.map((tick, index) => (
          <span
            key={tick.value}
            className="absolute inset-y-0 text-label font-normal tabular-nums text-fg-subtle"
            style={{ left: `${tick.position * 100}%` }}
          >
            <span aria-hidden className="absolute bottom-0 left-0 h-1.5 border-l border-border" />
            <span className={cn(
              "absolute top-1 whitespace-nowrap pl-1",
              index === ticks.length - 1 && "-translate-x-full pl-0 pr-1"
            )}>
              {formatAgentMessageTraceDuration(tick.value, locale)}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function TreeConnectors({ row }: { row: AgentMessageTraceRow }) {
  const depth = row.node.depth;
  if (depth === 0) return null;

  return (
    <span aria-hidden className="pointer-events-none absolute inset-y-0 left-2">
      {row.ancestorContinuation.map((continues, index) => continues ? (
        <span key={index} className="absolute inset-y-0 border-l border-border-subtle" style={{ left: `${index * 16 + 8}px` }} />
      ) : null)}
      <span className="absolute top-0 h-1/2 border-l border-border-subtle" style={{ left: `${(depth - 1) * 16 + 8}px` }} />
      <span className="absolute top-1/2 w-3 border-t border-border-subtle" style={{ left: `${(depth - 1) * 16 + 8}px` }} />
    </span>
  );
}

function SpanCell({
  row,
  expanded,
  labels,
  selected,
  onToggle,
}: {
  row: AgentMessageTraceRow;
  expanded: boolean;
  labels: AgentMessageTraceLabels;
  selected: boolean;
  onToggle: () => void;
}) {
  const { node } = row;
  const presentation = kindPresentation[node.span.kind];
  const KindIcon = useIcon(presentation.icon);
  const StatusIcon = useIcon(statusIcon[node.span.status]);
  const hasChildren = node.childIds.length > 0;

  return (
    <div className={cn(
      "flex min-w-0 items-center overflow-hidden bg-surface-floating px-2 transition-colors duration-fast group-hover/trace-row:bg-hover",
      selected && "bg-selection group-hover/trace-row:bg-selection"
    )} role="gridcell">
      <TreeConnectors row={row} />
      <div className="relative flex min-w-0 items-center gap-1.5" style={{ paddingLeft: `${node.depth * 16}px` }}>
        {hasChildren ? (
          <button
            type="button"
            aria-label={`${expanded ? labels.collapseAll : labels.expandAll}: ${node.span.name}`}
            aria-expanded={expanded}
            className="relative grid size-4 shrink-0 place-items-center rounded-full bg-hover text-[10px] font-semibold leading-none text-fg-muted outline-none hover:bg-active hover:text-fg-default focus-visible:ring-1 focus-visible:ring-focus-ring"
            onClick={(event) => {
              event.stopPropagation();
              onToggle();
            }}
            onKeyDown={(event) => event.stopPropagation()}
          >
            {node.childIds.length}
          </button>
        ) : (
          <span aria-hidden className="grid size-4 shrink-0 place-items-center">
            <span className="size-1.5 rounded-full" style={{ backgroundColor: presentation.color }} />
          </span>
        )}
        <KindIcon aria-hidden className="shrink-0" primaryColor={presentation.color} size={14} strokeWidth={1.75} />
        <span className={cn("min-w-0 truncate text-label text-fg-default", node.span.status === "error" && "text-fg-danger")}>
          {node.span.name}
        </span>
        {node.span.status !== "success" && (
          <StatusIcon
            aria-label={statusLabel(node.span.status, labels)}
            className={cn(
              "ml-auto shrink-0",
              node.span.status === "running" && "animate-spin text-fg-info motion-reduce:animate-none",
              node.span.status === "error" && "text-fg-danger",
              node.span.status === "cancelled" && "text-fg-warning"
            )}
            size={12}
            strokeWidth={2}
          />
        )}
      </div>
    </div>
  );
}

function TimelineCell({
  span,
  domainEnd,
  labels,
  locale,
  nowOffsetMs,
  selected,
}: {
  span: AgentMessageTraceSpan;
  domainEnd: number;
  labels: AgentMessageTraceLabels;
  locale: string;
  nowOffsetMs?: number;
  selected: boolean;
}) {
  const duration = measuredSpanDuration(span, nowOffsetMs);
  const start = Math.max(0, span.startOffsetMs);
  const startPosition = Math.min(100, start / domainEnd * 100);
  const endPosition = Math.min(100, (start + duration) / domainEnd * 100);
  const width = Math.max(0, endPosition - startPosition);
  const nearEnd = endPosition > 80;
  const label = `${span.name} · ${span.operation ?? "—"} · ${statusLabel(span.status, labels)} · ${formatAgentMessageTraceDuration(duration, locale)}`;

  return (
    <div className="relative min-w-0 border-l border-border" role="gridcell">
      <Tooltip content={<span className="block max-w-72 whitespace-pre-wrap">{label}</span>}>
        <span
          aria-hidden
          className={cn(
            "absolute top-1/2 h-3.5 -translate-y-1/2 rounded-[3px]",
            "ring-offset-1 ring-offset-surface-floating",
            selected && "ring-1 ring-fg-default",
            span.status === "running" && "animate-pulse motion-reduce:animate-none",
            span.status === "error" && "outline outline-1 outline-offset-1 outline-fg-danger"
          )}
          style={{
            left: `${startPosition}%`,
            width: `max(${width}%, 3px)`,
            backgroundColor: kindPresentation[span.kind].color,
          }}
        />
      </Tooltip>
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute top-1/2 max-w-24 -translate-y-1/2 truncate font-mono text-label tabular-nums text-fg-subtle",
          nearEnd ? "mr-1.5" : "ml-1.5"
        )}
        style={nearEnd
          ? { right: `${Math.max(0, 100 - startPosition)}%` }
          : { left: `${endPosition}%` }}
      >
        {formatAgentMessageTraceDuration(duration, locale)}
      </span>
    </div>
  );
}

function TraceRow({
  gridClassName,
  row,
  rowIndex,
  expanded,
  labels,
  locale,
  nowOffsetMs,
  domainEnd,
  selected,
  tabIndex,
  onKeyDown,
  onSelect,
  onToggle,
  rowRef,
  style,
}: {
  gridClassName: string;
  row: AgentMessageTraceRow;
  rowIndex: number;
  expanded: boolean;
  labels: AgentMessageTraceLabels;
  locale: string;
  nowOffsetMs?: number;
  domainEnd: number;
  selected: boolean;
  tabIndex: number;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>, index: number) => void;
  onSelect: () => void;
  onToggle: () => void;
  rowRef: (element: HTMLDivElement | null) => void;
  style: CSSProperties;
}) {
  const span = row.node.span;
  const duration = measuredSpanDuration(span, nowOffsetMs);
  const accessibleLabel = `${span.name}, ${span.operation ?? labels[span.kind]}, ${statusLabel(span.status, labels)}, ${formatAgentMessageTraceDuration(duration, locale)}`;

  return (
    <div
      ref={rowRef}
      aria-label={accessibleLabel}
      aria-expanded={row.node.childIds.length > 0 ? expanded : undefined}
      aria-level={row.node.depth + 1}
      aria-posinset={rowIndex + 1}
      aria-selected={selected || undefined}
      className={cn(
        GRID_BASE_CLASS,
        gridClassName,
        "group/trace-row absolute left-0 h-7 cursor-default border-b border-border-subtle bg-surface-floating outline-none transition-colors duration-fast hover:bg-hover focus-visible:z-control focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-focus-ring",
        row.node.depth === 0 && "bg-surface-raised",
        selected && "bg-selection shadow-[inset_2px_0_0_var(--brand)]"
      )}
      data-span-kind={span.kind}
      data-span-status={span.status}
      onClick={onSelect}
      onKeyDown={(event) => onKeyDown(event, rowIndex)}
      role="row"
      style={style}
      tabIndex={tabIndex}
    >
      <SpanCell expanded={expanded} labels={labels} onToggle={onToggle} row={row} selected={selected} />
      <div className={cn(
        "flex min-w-0 items-center border-l border-border bg-surface-floating px-2 transition-colors duration-fast group-hover/trace-row:bg-hover",
        selected && "bg-selection group-hover/trace-row:bg-selection"
      )} role="gridcell">
        <span className="truncate font-mono text-label text-fg-muted" title={span.operation}>
          {span.operation ?? "—"}
        </span>
      </div>
      <TimelineCell
        domainEnd={domainEnd}
        labels={labels}
        locale={locale}
        nowOffsetMs={nowOffsetMs}
        selected={selected}
        span={span}
      />
    </div>
  );
}

function LoadingTrace({ labels, gridClassName }: { labels: AgentMessageTraceLabels; gridClassName: string }) {
  return (
    <div aria-label={labels.loading} className="overflow-hidden rounded-xl border border-border bg-surface-floating" role="status">
      <div className={cn(GRID_BASE_CLASS, gridClassName, "h-7 border-b border-border bg-surface-raised")}>
        <Skeleton className="m-2 h-3 w-20" />
        <Skeleton className="m-2 h-3 w-16" />
        <Skeleton className="m-2 h-3 w-2/3" />
      </div>
      {Array.from({ length: 8 }, (_, index) => (
        <div className={cn(GRID_BASE_CLASS, gridClassName, "h-7 border-b border-border-subtle last:border-b-0")} key={index}>
          <Skeleton className="mx-2 my-1.5 h-4" style={{ width: `${92 + index % 3 * 18}px` }} />
          <Skeleton className="mx-2 my-1.5 h-4 w-20" />
          <Skeleton className="mx-2 my-2 h-3" style={{ width: `${18 + index % 4 * 8}%` }} />
        </div>
      ))}
    </div>
  );
}

export function AgentMessageTraceTimeline({
  data,
  state = "ready",
  errorMessage,
  labels: labelOverrides,
  defaultExpandedDepth = 2,
  expandedSpanIds,
  onExpandedSpanIdsChange,
  selectedSpanId,
  onSelectedSpanIdChange,
  onSpanSelect,
  visibleKinds,
  onVisibleKindsChange,
  nowOffsetMs,
  maxHeight,
  locale = "en",
  showToolbar = true,
  className,
  ...props
}: AgentMessageTraceProps) {
  const labels = useMemo(() => ({ ...defaultLabels, ...labelOverrides }), [labelOverrides]);
  const model = useMemo(() => buildAgentMessageTraceModel(data.spans), [data.spans]);
  const defaultExpandedIds = useMemo(
    () => defaultExpandedAgentMessageTraceIds(model, defaultExpandedDepth),
    [defaultExpandedDepth, model]
  );
  const [internalExpandedIds, setInternalExpandedIds] = useState<readonly string[]>(defaultExpandedIds);
  const seededExpansionRef = useRef(defaultExpandedIds.length > 0);
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(null);
  const [internalKinds, setInternalKinds] = useState<readonly AgentMessageTraceKind[]>(agentMessageTraceKinds);
  const resolvedExpandedIds = expandedSpanIds ?? internalExpandedIds;
  const resolvedSelectedId = selectedSpanId === undefined ? internalSelectedId : selectedSpanId;
  const resolvedKinds = visibleKinds ?? internalKinds;
  const expandedSet = useMemo(() => new Set(resolvedExpandedIds), [resolvedExpandedIds]);
  const kindSet = useMemo(() => new Set(resolvedKinds), [resolvedKinds]);
  const rows = useMemo(
    () => flattenAgentMessageTraceRows(model, expandedSet, kindSet),
    [expandedSet, kindSet, model]
  );
  const duration = useMemo(
    () => agentMessageTraceDuration(data.spans, nowOffsetMs),
    [data.spans, nowOffsetMs]
  );
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewportWidth, setViewportWidth] = useState(0);
  const layoutName = viewportWidth === 0 || viewportWidth >= 960
    ? "wide"
    : viewportWidth < 640
      ? "compact"
      : "medium";
  const resolvedGridLayout = gridLayout[layoutName];
  const desiredTickCount = layoutName === "compact" ? 2 : layoutName === "medium" ? 4 : 6;
  const { domainEnd, ticks } = useMemo(
    () => createAgentMessageTraceTicks(duration, desiredTickCount),
    [desiredTickCount, duration]
  );
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => viewportRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: 12,
    paddingStart: HEADER_HEIGHT,
  });

  useEffect(() => {
    if (expandedSpanIds !== undefined) return;
    setInternalExpandedIds((current) => {
      const valid = current.filter((id) => model.nodes.has(id));
      const next = !seededExpansionRef.current && model.nodes.size > 0
        ? defaultExpandedIds
        : valid;
      if (!seededExpansionRef.current && model.nodes.size > 0) seededExpansionRef.current = true;
      return sameIds(current, next) ? current : next;
    });
  }, [defaultExpandedIds, expandedSpanIds, model]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const updateWidth = () => setViewportWidth(viewport.clientWidth);
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [state]);

  const setExpandedIds = (next: readonly string[]) => {
    const normalized = normalizeIds(next);
    if (expandedSpanIds === undefined) setInternalExpandedIds(normalized);
    onExpandedSpanIdsChange?.(normalized);
  };
  const setKinds = (next: readonly AgentMessageTraceKind[]) => {
    if (visibleKinds === undefined) setInternalKinds(next);
    onVisibleKindsChange?.(next);
  };
  const selectSpan = (span: AgentMessageTraceSpan) => {
    if (selectedSpanId === undefined) setInternalSelectedId(span.id);
    onSelectedSpanIdChange?.(span.id);
    onSpanSelect?.(span);
  };
  const toggleSpan = (spanId: string) => {
    const next = new Set(expandedSet);
    if (next.has(spanId)) next.delete(spanId);
    else next.add(spanId);
    setExpandedIds([...next]);
  };
  const focusRow = (index: number) => {
    const nextIndex = Math.max(0, Math.min(rows.length - 1, index));
    const row = rows[nextIndex];
    if (!row) return;
    selectSpan(row.node.span);
    virtualizer.scrollToIndex(nextIndex, { align: "auto" });
    requestAnimationFrame(() => rowRefs.current.get(row.node.span.id)?.focus());
  };
  const handleRowKeyDown = (event: KeyboardEvent<HTMLDivElement>, index: number) => {
    const row = rows[index];
    if (!row) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      focusRow(index + (event.key === "ArrowDown" ? 1 : -1));
    } else if (event.key === "ArrowRight") {
      if (row.node.childIds.length > 0 && !expandedSet.has(row.node.span.id)) {
        event.preventDefault();
        toggleSpan(row.node.span.id);
      }
    } else if (event.key === "ArrowLeft") {
      if (expandedSet.has(row.node.span.id)) {
        event.preventDefault();
        toggleSpan(row.node.span.id);
      } else if (row.node.parentId) {
        const parentIndex = rows.findIndex((candidate) => candidate.node.span.id === row.node.parentId);
        if (parentIndex >= 0) {
          event.preventDefault();
          focusRow(parentIndex);
        }
      }
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectSpan(row.node.span);
    }
  };

  const branchIds = useMemo(
    () => [...model.nodes.values()].filter((node) => node.childIds.length > 0).map((node) => node.span.id),
    [model]
  );
  const visibleItems = virtualizer.getVirtualItems();
  const resolvedError = errorMessage ?? labels.errorMessage;

  return (
    <TooltipProvider>
      <section
        {...props}
        aria-label={props["aria-label"] ?? labels.ariaLabel}
        className={cn("flex h-full min-h-0 w-full flex-col text-fg-default", className)}
        data-block="agent-message-trace-01"
      >
        {showToolbar && (
          <TraceToolbar
            activeKinds={kindSet}
            hasBranches={branchIds.length > 0}
            labels={labels}
            onCollapseAll={() => setExpandedIds([])}
            onExpandAll={() => setExpandedIds(branchIds)}
            onKindsChange={setKinds}
          />
        )}

        {state === "loading" ? <LoadingTrace gridClassName={resolvedGridLayout.className} labels={labels} /> : state === "error" ? (
          <div className="flex min-h-28 items-center justify-center rounded-xl border border-border bg-surface-floating p-4">
            <InlineNotice role="alert" tone="danger" variant="emphasized">
              <InlineNoticeContent>{resolvedError}</InlineNoticeContent>
            </InlineNotice>
          </div>
        ) : data.spans.length === 0 || rows.length === 0 ? (
          <div className="flex min-h-28 items-center justify-center rounded-xl border border-border bg-surface-floating px-4 text-center text-body text-fg-muted">
            {data.spans.length === 0 ? labels.empty : labels.noMatchingSpans}
          </div>
        ) : (
          <div
            ref={viewportRef}
            className="relative min-h-0 w-full flex-1 overflow-auto rounded-xl border border-border bg-surface-floating"
            style={{ maxHeight }}
          >
            <div
              aria-colcount={3}
              aria-rowcount={rows.length + 1}
              className="relative w-full"
              role="treegrid"
              style={{ height: `${virtualizer.getTotalSize()}px` }}
            >
              <TraceHeader gridClassName={resolvedGridLayout.className} labels={labels} locale={locale} ticks={ticks} />
              <div
                aria-hidden
                className="pointer-events-none absolute bottom-0 right-0 top-7"
                style={{ left: resolvedGridLayout.timelineStart }}
              >
                {ticks.slice(1).map((tick) => (
                  <span
                    key={tick.value}
                    className="absolute inset-y-0 border-l border-border-subtle"
                    style={{ left: `${tick.position * 100}%` }}
                  />
                ))}
              </div>
              <div className="absolute inset-0" role="rowgroup">
                {visibleItems.map((virtualRow) => {
                  const row = rows[virtualRow.index];
                  const spanId = row.node.span.id;
                  const selected = resolvedSelectedId === spanId;
                  return (
                    <TraceRow
                      key={spanId}
                      domainEnd={domainEnd}
                      expanded={expandedSet.has(spanId)}
                      gridClassName={resolvedGridLayout.className}
                      labels={labels}
                      locale={locale}
                      nowOffsetMs={nowOffsetMs}
                      onKeyDown={handleRowKeyDown}
                      onSelect={() => selectSpan(row.node.span)}
                      onToggle={() => toggleSpan(spanId)}
                      row={row}
                      rowIndex={virtualRow.index}
                      rowRef={(element) => {
                        if (element) rowRefs.current.set(spanId, element);
                        else rowRefs.current.delete(spanId);
                      }}
                      selected={selected}
                      style={{ height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)` }}
                      tabIndex={selected || resolvedSelectedId === null && virtualRow.index === 0 ? 0 : -1}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>
    </TooltipProvider>
  );
}
