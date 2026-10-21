"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import Loading02Icon from "@hugeicons/core-free-icons/Loading02Icon";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useIsPresent,
  useReducedMotion,
  useSpring,
  type MotionValue,
} from "framer-motion";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { InlineNotice, InlineNoticeContent } from "@zeron/ui/inline-notice";
import { Popover, PopoverContent, PopoverTitle } from "@zeron/ui/popover";
import { Skeleton } from "@zeron/ui/skeleton";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { spring } from "@zeron/ui/system/springs";
import { useTraceRowMotion, type TraceRowPresenceData } from "./agent-message-trace-motion";
import {
  agentMessageTraceDuration,
  buildAgentMessageTraceModel,
  defaultExpandedAgentMessageTraceIds,
  flattenAgentMessageTraceRows,
  type AgentMessageTraceModel,
  type AgentMessageTraceRow,
} from "./agent-message-trace-model";
import {
  buildAgentMessageTraceUsage,
  createLiveTraceTicks,
  finiteTraceValue,
  formatLiveTraceCost,
  formatLiveTraceDuration,
  liveSpanDuration,
  liveTraceDomainEnd,
} from "./agent-message-trace-live-model";
import {
  agentMessageTraceKinds,
  type AgentMessageTraceLiveLabels,
  type AgentMessageTraceSpan,
  type AgentMessageTraceWorkspaceProps,
} from "./agent-message-trace-types";

const ROW_HEIGHT = 40;
const HEADER_HEIGHT = 40;
// A critically damped follower preserves velocity when a snapshot arrives.
// Duration-based springs reset velocity; derive the response from the same token.
const clockFrequency = 4 / spring.moderate.duration;
const clockSpring = {
  stiffness: clockFrequency ** 2,
  damping: 2 * clockFrequency,
  mass: 1,
};
const columns = "grid grid-cols-[minmax(0,1.05fr)_minmax(0,2fr)]";
const defaultLabels: AgentMessageTraceLiveLabels = {
  trace: "Trace",
  duration: "Duration",
  cost: "Cost",
  tokens: "Tokens",
  llmCalls: "LLM calls",
  toolCalls: "Tool calls",
  errors: "Errors",
  live: "Live",
  done: "Done",
  failed: "Failed",
  cancelled: "Cancelled",
  started: "Started",
  slowest: "Slowest",
  input: "Input",
  output: "Output",
  inputTokens: "Tokens in",
  outputTokens: "Tokens out",
  close: "Close span details",
  spanDetails: "Span details",
};

function spanColor(span: AgentMessageTraceSpan): string {
  if (span.status === "error") return "var(--danger-border)";
  return span.kind === "chat"
    ? "var(--chart-5)"
    : span.kind === "tool"
      ? "var(--chart-2)"
      : "var(--border)";
}

function SpanIcon({
  span,
  renderIcon,
}: {
  span: AgentMessageTraceSpan;
  renderIcon?: (span: AgentMessageTraceSpan) => ReactNode;
}) {
  const Icon = useIcon(span.kind === "tool" ? "settings" : "brain");
  return (
    <span
      aria-hidden
      className="flex size-7 shrink-0 items-center justify-center rounded-lg border-hairline border-border bg-surface-floating text-fg-muted"
    >
      {renderIcon?.(span) ?? <Icon size={20} />}
    </span>
  );
}

function descendantSpans(
  model: AgentMessageTraceModel,
  id: string,
): AgentMessageTraceSpan[] {
  const result: AgentMessageTraceSpan[] = [];
  const stack = [...(model.nodes.get(id)?.childIds ?? [])].reverse();
  while (stack.length) {
    const node = model.nodes.get(stack.pop()!);
    if (!node) continue;
    if (node.span.kind !== "agent") result.push(node.span);
    stack.push(...node.childIds.toReversed());
  }
  return result;
}

function Payload({ label, value }: { label: string; value: unknown }) {
  if (value === undefined) return null;
  let content: string;
  try {
    content =
      typeof value === "string" ? value : JSON.stringify(value, null, 2);
  } catch {
    content = String(value);
  }
  return (
    <div className="space-y-1">
      <p className="text-body uppercase tracking-wide text-fg-subtle">
        {label}
      </p>
      <pre className="whitespace-pre-wrap break-words font-sans text-body text-fg-muted">
        {content}
      </pre>
    </div>
  );
}

function SpanDetails({
  span,
  labels,
  locale,
  nowOffsetMs,
  cost,
  renderIcon,
  onClose,
}: {
  span: AgentMessageTraceSpan;
  labels: AgentMessageTraceLiveLabels;
  locale: string;
  nowOffsetMs?: number;
  cost: number;
  renderIcon?: (span: AgentMessageTraceSpan) => ReactNode;
  onClose: () => void;
}) {
  const CloseIcon = useIcon("x");
  const ErrorIcon = useIcon("circle-x");
  const metrics = [
    [
      labels.duration,
      formatLiveTraceDuration(liveSpanDuration(span, nowOffsetMs), locale),
    ],
    [labels.started, `+${formatLiveTraceDuration(span.startOffsetMs, locale)}`],
    ...(cost > 0 ? [[labels.cost, formatLiveTraceCost(cost, locale)]] : []),
    ...(span.usage?.inputTokens !== undefined
      ? [
          [
            labels.inputTokens,
            new Intl.NumberFormat(locale, { notation: "compact" }).format(
              finiteTraceValue(span.usage.inputTokens),
            ),
          ],
        ]
      : []),
    ...(span.usage?.outputTokens !== undefined
      ? [
          [
            labels.outputTokens,
            new Intl.NumberFormat(locale, { notation: "compact" }).format(
              finiteTraceValue(span.usage.outputTokens),
            ),
          ],
        ]
      : []),
  ];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <SpanIcon renderIcon={renderIcon} span={span} />
        <div className="min-w-0 flex-1">
          <PopoverTitle className="break-words text-body">
            {span.name}
          </PopoverTitle>
          <p className="text-body text-fg-subtle">
            {span.kind === "chat"
              ? labels.llmCalls
              : span.kind === "tool"
                ? labels.toolCalls
                : labels.trace}
            {span.subtitle || span.model || span.provider
              ? ` · ${span.subtitle ?? span.model ?? span.provider}`
              : ""}
          </p>
        </div>
        <Badge
          size="sm"
          status={
            span.status === "error"
              ? "danger"
              : span.status === "running"
                ? "info"
                : span.status === "cancelled"
                  ? "neutral"
                  : "success"
          }
        >
          {span.status === "error"
            ? labels.failed
            : span.status === "running"
              ? labels.live
              : span.status === "cancelled"
                ? labels.cancelled
                : labels.done}
        </Badge>
        <Button
          aria-label={labels.close}
          iconOnly
          onClick={onClose}
          size="xs"
          variant="ghost"
        >
          <CloseIcon size={16} />
        </Button>
      </div>
      <dl className="grid grid-cols-3 gap-x-3 gap-y-4 rounded-xl border-hairline border-border bg-surface-raised p-3">
        {metrics.map(([label, value]) => (
          <div key={label} className="min-w-0 space-y-1">
            <dt className="text-body uppercase tracking-wide text-fg-subtle">
              {label}
            </dt>
            <dd className="text-body tabular-nums text-fg-default">{value}</dd>
          </div>
        ))}
      </dl>
      {span.error && (
        <InlineNotice tone="danger" variant="emphasized">
          <ErrorIcon className="mt-0.5 shrink-0" size={16} />
          <InlineNoticeContent className="text-body">
            {span.error.message}
          </InlineNoticeContent>
        </InlineNotice>
      )}
      <Payload label={labels.input} value={span.input} />
      <Payload label={labels.output} value={span.output} />
    </div>
  );
}

type LiveTimelineMotion = {
  clock: MotionValue<number>;
  timelineWidth: MotionValue<number>;
  reduceMotion: boolean;
};

// SVG geometry updates outside React and never changes the row's HTML layout.
// Every bar, label, tick and cursor reads the same clock and scale each frame.
function useSpanGeometry(
  span: AgentMessageTraceSpan,
  timeline: LiveTimelineMotion,
) {
  const start = finiteTraceValue(span.startOffsetMs);
  const finish =
    span.durationMs === undefined && span.status === "running"
      ? Infinity
      : start + finiteTraceValue(span.durationMs);
  const read = useCallback(() => {
    const time = timeline.clock.get();
    const unit = timeline.timelineWidth.get() / liveTraceDomainEnd(time);
    const x = start * unit;
    const end = Math.max(start, Math.min(finish, time)) * unit;
    return { x, end, width: Math.max(3, end - x) };
  }, [start, finish, timeline.clock, timeline.timelineWidth]);
  const initial = read();
  const x = useMotionValue(initial.x);
  const width = useMotionValue(initial.width);
  const labelX = useMotionValue(initial.end + 8);
  useEffect(() => {
    // Set all fields from one clock sample, including after a paused seek.
    const update = () => {
      const geometry = read();
      x.set(geometry.x);
      width.set(geometry.width);
      labelX.set(geometry.end + 8);
    };
    update();
    const stopClock = timeline.clock.on("change", update);
    const stopSize = timeline.timelineWidth.on("change", update);
    return () => {
      stopClock();
      stopSize();
    };
  }, [read, timeline.clock, timeline.timelineWidth, x, width, labelX]);
  return { x, width, labelX };
}

function CollapsedSpanBar({
  span,
  timeline,
}: {
  span: AgentMessageTraceSpan;
  timeline: LiveTimelineMotion;
}) {
  const { x, width } = useSpanGeometry(span, timeline);
  return (
    <motion.rect
      x={x}
      width={width}
      y={7}
      height={6}
      rx={2}
      fill={spanColor(span)}
    />
  );
}

function TimelineMark({
  value,
  timeline,
  className,
  children,
}: {
  value?: number;
  timeline: LiveTimelineMotion;
  className: string;
  children?: ReactNode;
}) {
  const read = useCallback(() => {
    const time = timeline.clock.get();
    return (
      ((value ?? time) * timeline.timelineWidth.get()) /
      liveTraceDomainEnd(time)
    );
  }, [value, timeline.clock, timeline.timelineWidth]);
  const x = useMotionValue(read());
  useEffect(() => {
    const update = () => x.set(read());
    update();
    const stopClock = timeline.clock.on("change", update);
    const stopSize = timeline.timelineWidth.on("change", update);
    return () => {
      stopClock();
      stopSize();
    };
  }, [read, timeline.clock, timeline.timelineWidth, x]);
  return (
    <motion.span
      className={className}
      style={{ x }}
      initial={timeline.reduceMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={timeline.reduceMotion ? { duration: 0 } : spring.moderate}
    >
      {children}
    </motion.span>
  );
}

function LiveRow({
  row,
  rowIndex,
  model,
  expanded,
  selected,
  timeline,
  nowOffsetMs,
  locale,
  labels,
  cost,
  slowest,
  renderIcon,
  onToggle,
  onSelect,
  onKeyDown,
  onFocus,
  setRef,
  tabIndex,
  expandLabel,
  collapseLabel,
}: {
  row: AgentMessageTraceRow;
  rowIndex: number;
  model: AgentMessageTraceModel;
  expanded: boolean;
  selected: boolean;
  timeline: LiveTimelineMotion;
  nowOffsetMs?: number;
  locale: string;
  labels: AgentMessageTraceLiveLabels;
  cost: number;
  slowest: boolean;
  renderIcon?: (span: AgentMessageTraceSpan) => ReactNode;
  onToggle: () => void;
  onSelect: (element: HTMLElement) => void;
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void;
  onFocus: () => void;
  setRef: (element: HTMLDivElement | null) => void;
  tabIndex: number;
  expandLabel: string;
  collapseLabel: string;
}) {
  const present = useIsPresent();
  const { node } = row;
  const { span } = node;
  const ChevronIcon = useIcon("chevron-right");
  const ErrorIcon = useIcon("circle-x");
  const duration = liveSpanDuration(span, nowOffsetMs);
  const { x, width, labelX } = useSpanGeometry(span, timeline);
  const hasChildren = node.childIds.length > 0;
  const collapsedSpans = useMemo(
    () => (hasChildren && !expanded ? descendantSpans(model, span.id) : []),
    [expanded, hasChildren, model, span.id],
  );
  const color = spanColor(span);

  return (
    <div
      ref={setRef}
      role="row"
      aria-hidden={!present || undefined}
      inert={!present || undefined}
      aria-rowindex={rowIndex + 2}
      aria-level={node.depth + 1}
      aria-expanded={hasChildren ? expanded : undefined}
      aria-selected={selected}
      aria-label={`${span.name}, ${formatLiveTraceDuration(duration, locale)}, ${span.status === "error" ? labels.failed : span.status === "running" ? labels.live : span.status === "cancelled" ? labels.cancelled : labels.done}`}
      tabIndex={present ? tabIndex : -1}
      data-span-id={span.id}
      className={cn(
        columns,
        "group/live-row absolute inset-x-0 cursor-pointer outline-none transition-colors duration-fast hover:bg-hover focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-focus-ring",
        selected && "bg-selection",
      )}
      onClick={(event) => onSelect(event.currentTarget)}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
    >
      <div
        role="gridcell"
        className="relative flex h-10 min-w-0 items-center gap-2 overflow-hidden border-r-hairline border-border-subtle pr-3"
        style={{ paddingLeft: `${16 + Math.min(node.depth, 10) * 20}px` }}
      >
        {node.depth > 0 && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 border-l-hairline border-border"
            style={{
              left: `${16 + (Math.min(node.depth, 10) - 1) * 20 + 8}px`,
            }}
          />
        )}
        {hasChildren ? (
          <button
            type="button"
            tabIndex={-1}
            aria-label={`${expanded ? collapseLabel : expandLabel} ${span.name}`}
            aria-expanded={expanded}
            className="grid size-4 shrink-0 place-items-center rounded text-fg-subtle hover:bg-active"
            onClick={(event) => {
              event.stopPropagation();
              onToggle();
            }}
            onKeyDown={(event) => event.stopPropagation()}
          >
            <ChevronIcon
              aria-hidden
              className={cn(
                "transition-transform duration-fast motion-reduce:transition-none",
                expanded && "rotate-90",
              )}
              size={14}
            />
          </button>
        ) : (
          <span aria-hidden className="w-4 shrink-0" />
        )}
        <SpanIcon renderIcon={renderIcon} span={span} />
        <span
          className={cn(
            "shrink-0 truncate text-body text-fg-default",
            hasChildren && "font-medium",
          )}
          style={{ maxWidth: "70%" }}
        >
          {span.name}
        </span>
        <span className="min-w-0 truncate text-body text-fg-subtle">
          {span.subtitle ?? span.model ?? span.provider}
        </span>
        {!expanded && hasChildren && (
          <span className="ml-auto shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-body tabular-nums text-fg-muted">
            +{node.descendantCount}
          </span>
        )}
        {span.status === "running" && (
          <HugeiconsIcon
            icon={Loading02Icon}
            fill="currentColor"
            strokeWidth={0}
            aria-label={labels.live}
            className="ml-auto shrink-0 animate-spin text-fg-info motion-reduce:animate-none"
            size={13}
          />
        )}
        {span.status === "error" && (
          <ErrorIcon
            aria-label={labels.failed}
            className="ml-auto shrink-0 text-fg-danger"
            size={14}
          />
        )}
      </div>
      <div
        role="gridcell"
        className="relative flex h-10 min-w-0 items-center overflow-hidden"
      >
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-x-0 h-5 w-full overflow-hidden"
        >
          <motion.rect
            data-live-bar=""
            x={x}
            width={width}
            y={0.5}
            height={19}
            rx={5}
            stroke={
              selected
                ? "var(--fg-default)"
                : `color-mix(in oklab, ${color} 45%, transparent)`
            }
            fill={`color-mix(in oklab, ${color} ${span.kind === "agent" ? 28 : 12}%, transparent)`}
          />
          {collapsedSpans.map((child) => (
            <CollapsedSpanBar key={child.id} span={child} timeline={timeline} />
          ))}
        </svg>
        <motion.span
          aria-hidden
          className={cn(
            "pointer-events-none absolute flex max-w-full items-center gap-2 whitespace-nowrap text-body tabular-nums text-fg-muted",
            span.status === "error" && "text-fg-danger",
          )}
          style={{ left: 0, x: labelX }}
        >
          {formatLiveTraceDuration(duration, locale)}
          {cost > 0 && ` · ${formatLiveTraceCost(cost, locale)}`}
          {slowest && (
            <Badge size="sm" status="warning">
              {labels.slowest}
            </Badge>
          )}
        </motion.span>
      </div>
    </div>
  );
}

export function AgentMessageTraceLive({
  data,
  state = "ready",
  errorMessage,
  labels: timelineLabels,
  defaultExpandedDepth = 2,
  expandedSpanIds,
  onExpandedSpanIdsChange,
  selectedSpanId,
  defaultSelectedSpanId = null,
  onSelectedSpanIdChange,
  onSpanSelect,
  visibleKinds = agentMessageTraceKinds,
  nowOffsetMs,
  maxHeight,
  locale = "en",
  heading,
  headingIcon,
  description,
  liveLabels,
  renderSpanIcon,
  className,
  // Workspace-only options must never reach the native section.
  inspectorLabels: _inspectorLabels,
  inspectorDefaultSize: _inspectorDefaultSize,
  inspectorMinSize: _inspectorMinSize,
  inspectorMaxSize: _inspectorMaxSize,
  showToolbar: _showToolbar,
  onVisibleKindsChange: _onVisibleKindsChange,
  variant: _variant,
  ...props
}: AgentMessageTraceWorkspaceProps) {
  const labels = { ...defaultLabels, ...liveLabels };
  const reduceMotion = useReducedMotion() ?? false;
  const model = useMemo(
    () => buildAgentMessageTraceModel(data.spans),
    [data.spans],
  );
  const [internalExpanded, setInternalExpanded] = useState(() =>
    defaultExpandedAgentMessageTraceIds(model, defaultExpandedDepth),
  );
  const seenBranches = useRef(
    new Set(
      [...model.nodes.values()]
        .filter((node) => node.childIds.length > 0)
        .map((node) => node.span.id),
    ),
  );
  useEffect(() => {
    const additions = defaultExpandedAgentMessageTraceIds(
      model,
      defaultExpandedDepth,
    ).filter((id) => !seenBranches.current.has(id));
    seenBranches.current = new Set([
      ...seenBranches.current,
      ...[...model.nodes.values()]
        .filter((node) => node.childIds.length > 0)
        .map((node) => node.span.id),
    ]);
    if (expandedSpanIds === undefined && additions.length)
      setInternalExpanded((current) => [
        ...new Set([...current, ...additions]),
      ]);
  }, [model, defaultExpandedDepth, expandedSpanIds]);
  const expanded = useMemo(
    () => new Set(expandedSpanIds ?? internalExpanded),
    [expandedSpanIds, internalExpanded],
  );
  const rows = useMemo(
    () => flattenAgentMessageTraceRows(model, expanded, new Set(visibleKinds)),
    [model, expanded, visibleKinds],
  );
  const usage = useMemo(
    () => buildAgentMessageTraceUsage(data.spans, model),
    [data.spans, model],
  );
  const elapsed = agentMessageTraceDuration(data.spans, nowOffsetMs);
  const { ticks } = createLiveTraceTicks(elapsed);
  const clock = useSpring(
    elapsed,
    reduceMotion ? { duration: 0 } : clockSpring,
  );
  const previousElapsed = useRef(elapsed);
  useEffect(() => {
    // A backward seek starts a new visual position rather than rewinding every bar.
    if (reduceMotion || elapsed < previousElapsed.current) clock.jump(elapsed);
    else clock.set(elapsed);
    previousElapsed.current = elapsed;
  }, [clock, elapsed, reduceMotion]);
  const timelineWidth = useMotionValue((620 * 2) / 3.05);
  const timeline = useMemo(
    () => ({ clock, timelineWidth, reduceMotion }),
    [clock, timelineWidth, reduceMotion],
  );
  const running = [...model.nodes.values()].some(({ span }) => span.status === "running");
  const cancelled =
    !running &&
    model.rootIds.some(
      (id) => model.nodes.get(id)?.span.status === "cancelled",
    );
  const rootFailed =
    !running &&
    model.rootIds.some(
      (id) => model.nodes.get(id)?.span.status === "error",
    );
  const [internalSelected, setInternalSelected] = useState<string | null>(
    defaultSelectedSpanId,
  );
  const selectedId =
    selectedSpanId === undefined ? internalSelected : selectedSpanId;
  const selected = selectedId ? model.nodes.get(selectedId)?.span : undefined;
  const viewportRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewportElement] = useState<HTMLDivElement | null>(null);
  const setViewport = useCallback((element: HTMLDivElement | null) => {
    viewportRef.current = element;
    setViewportElement(element);
  }, []);
  useEffect(() => {
    if (!viewport) return;
    const measure = () =>
      timelineWidth.set((Math.max(620, viewport.clientWidth) * 2) / 3.05);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [viewport, timelineWidth]);
  const rowRefs = useRef(new Map<string, HTMLDivElement>());
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const getItemKey = useCallback((index: number) => rows[index].node.span.id, [rows]);
  const virtualizer = useVirtualizer({
    useFlushSync: false,
    count: rows.length,
    getScrollElement: () => viewport,
    estimateSize: () => ROW_HEIGHT,
    overscan: 8,
    paddingStart: HEADER_HEIGHT,
    getItemKey,
  });
  const totalHeight = virtualizer.getTotalSize() + 16;
  const { previousVisibleIds, presenceData, heldHeight, interruptScrollMotion } = useTraceRowMotion(
    rows, totalHeight, viewportRef, reduceMotion,
  );
  const virtualItems = virtualizer.getVirtualItems();
  const focusableId = virtualItems.some((item) => rows[item.index].node.span.id === focusedId)
    ? focusedId
    : rows[virtualItems[0]?.index ?? 0]?.node.span.id;
  const BrainIcon = useIcon("brain");

  const select = (id: string | null, element?: HTMLElement) => {
    if (selectedSpanId === undefined) setInternalSelected(id);
    onSelectedSpanIdChange?.(id);
    if (id) {
      setAnchor(element ?? rowRefs.current.get(id) ?? null);
      const span = model.nodes.get(id)?.span;
      if (span) onSpanSelect?.(span);
    }
  };
  const toggle = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    if (expandedSpanIds === undefined) setInternalExpanded([...next]);
    onExpandedSpanIdsChange?.([...next]);
  };
  const keyboard = (
    event: KeyboardEvent<HTMLDivElement>,
    index: number,
    row: AgentMessageTraceRow,
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      select(row.node.span.id, event.currentTarget);
      return;
    }
    if (event.key === "Escape") {
      select(null);
      return;
    }
    let nextIndex = index;
    if (event.key === "ArrowDown")
      nextIndex = Math.min(rows.length - 1, index + 1);
    else if (event.key === "ArrowUp") nextIndex = Math.max(0, index - 1);
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = rows.length - 1;
    else if (event.key === "ArrowRight") {
      if (row.node.childIds.length && !expanded.has(row.node.span.id))
        toggle(row.node.span.id);
      else if (row.node.childIds.length) nextIndex = index + 1;
    } else if (event.key === "ArrowLeft") {
      if (row.node.childIds.length && expanded.has(row.node.span.id))
        toggle(row.node.span.id);
      else if (row.node.parentId)
        nextIndex = rows.findIndex(
          (item) => item.node.span.id === row.node.parentId,
        );
    } else return;
    event.preventDefault();
    const id = rows[nextIndex]?.node.span.id;
    if (!id) return;
    setFocusedId(id);
    virtualizer.scrollToIndex(nextIndex, { align: "auto" });
    requestAnimationFrame(() => rowRefs.current.get(id)?.focus());
  };
  const metrics = [
    [labels.duration, formatLiveTraceDuration(elapsed, locale)],
    [labels.cost, formatLiveTraceCost(usage.costUsd, locale)],
    [
      labels.tokens,
      new Intl.NumberFormat(locale, {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(usage.tokens),
    ],
    [labels.llmCalls, String(usage.llmCalls)],
    [labels.toolCalls, String(usage.toolCalls)],
    [labels.errors, String(usage.errors)],
  ];

  return (
    <section
      {...props}
      data-block="agent-message-trace-01"
      data-variant="live"
      aria-label={
        props["aria-label"] ?? timelineLabels?.ariaLabel ?? "Live agent message execution trace"
      }
      className={cn(
        "@container flex max-h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl border-hairline border-border bg-surface-floating text-body text-fg-default",
        className,
      )}
      style={{
        ...props.style,
        ...(maxHeight === undefined ? {} : { maxHeight }),
      }}
    >
      <header className="flex min-h-14 shrink-0 items-center gap-3 border-b-hairline border-border-subtle px-5 py-3">
        <span aria-hidden className="flex shrink-0 text-fg-brand">
          {headingIcon ?? <BrainIcon size={20} />}
        </span>
        <h2 className="shrink-0 text-body font-medium">
          {heading ?? labels.trace}
        </h2>
        {description && (
          <p
            className="min-w-0 truncate text-body text-fg-subtle"
            title={description}
          >
            {description}
          </p>
        )}
        {state === "ready" && data.spans.length > 0 && (
          <span className="ml-auto shrink-0" role="status">
            <Badge
              size="md"
              status={
                running
                  ? "info"
                  : rootFailed
                    ? "danger"
                    : cancelled
                      ? "neutral"
                      : "success"
              }
              leadingIcon={
                running ? (
                  <span className="size-1.5 animate-pulse rounded-full bg-current motion-reduce:animate-none" />
                ) : undefined
              }
            >
              {running
                ? labels.live
                : rootFailed
                  ? labels.failed
                  : cancelled
                    ? labels.cancelled
                    : labels.done}
            </Badge>
          </span>
        )}
      </header>
      <dl className="grid shrink-0 grid-cols-3 gap-y-4 border-b-hairline border-border-subtle py-4 @2xl:grid-cols-6">
        {metrics.map(([label, value], index) => (
          <div
            key={label}
            className="min-w-0 space-y-1 border-r-hairline border-border-subtle px-3 last:border-r-0 @2xl:px-5"
          >
            <dt className="truncate text-body uppercase tracking-wide text-fg-subtle">
              {label}
            </dt>
            <dd
              className={cn(
                "text-body font-medium tabular-nums",
                index === 5 && usage.errors > 0 && "text-fg-danger",
              )}
            >
              {state === "ready" ? value : "—"}
            </dd>
          </div>
        ))}
      </dl>
      {state === "loading" ? (
        <div
          role="status"
          className="space-y-4 p-5"
          aria-label={timelineLabels?.loading ?? "Loading trace"}
        >
          {[0, 1, 2].map((id) => (
            <Skeleton key={id} className="h-7 w-full" />
          ))}
        </div>
      ) : state === "error" ? (
        <div className="p-5">
          <InlineNotice role="alert" tone="danger" variant="emphasized">
            <InlineNoticeContent>
              {errorMessage ??
                timelineLabels?.errorMessage ??
                "The trace could not be displayed."}
            </InlineNoticeContent>
          </InlineNotice>
        </div>
      ) : rows.length === 0 ? (
        <p className="p-6 text-body text-fg-muted" role="status">
          {data.spans.length
            ? (timelineLabels?.noMatchingSpans ??
              "No spans match the selected types.")
            : (timelineLabels?.empty ??
              "No spans are available for this message.")}
        </p>
      ) : (
        <Popover
          open={!!selected}
          onOpenChange={(open) => {
            if (!open) select(null);
          }}
        >
          <div
            ref={setViewport}
            tabIndex={-1}
            className="min-h-0 flex-1 overflow-auto"
            style={{ maxHeight: "100%", overflowAnchor: "none" }}
            onWheelCapture={interruptScrollMotion}
            onTouchStartCapture={interruptScrollMotion}
            onKeyDownCapture={(event) => {
              if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(event.key)) interruptScrollMotion();
            }}
          >
            <div
              role="treegrid"
              aria-label={timelineLabels?.ariaLabel ?? "Trace spans"}
              aria-rowcount={rows.length + 1}
              aria-colcount={2}
              className="relative min-w-0"
              style={{ minWidth: 620, height: Math.max(totalHeight, heldHeight) }}
            >
              <div
                role="row"
                className={cn(
                  columns,
                  "sticky top-0 z-action h-10 border-b-hairline border-border-subtle bg-surface-floating text-body text-fg-subtle",
                )}
              >
                <div
                  role="columnheader"
                  className="flex items-center border-r-hairline border-border-subtle px-5 uppercase tracking-wide"
                >
                  {timelineLabels?.spanColumn ?? "Span"}
                </div>
                <div role="columnheader" className="relative overflow-hidden">
                  <AnimatePresence initial={false}>
                    {ticks.map((tick) => (
                      <TimelineMark
                        key={tick.value}
                        value={tick.value}
                        timeline={timeline}
                        className="absolute left-0 top-3 whitespace-nowrap pl-2 tabular-nums"
                      >
                        {formatLiveTraceDuration(tick.value, locale)}
                      </TimelineMark>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 right-0"
                style={{ left: "34.42623%" }}
              >
                <AnimatePresence initial={false}>
                  {ticks.map((tick) => (
                    <TimelineMark
                      key={tick.value}
                      value={tick.value}
                      timeline={timeline}
                      className="absolute inset-y-0 left-0 border-l-hairline border-border-subtle"
                    />
                  ))}
                </AnimatePresence>
                {running && (
                  <TimelineMark
                    timeline={timeline}
                    className="absolute inset-y-0 left-0 border-l border-info-border opacity-60"
                  >
                    <span className="absolute top-10 size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-info-strong ring-4 ring-surface-floating" />
                  </TimelineMark>
                )}
              </div>
              <AnimatePresence initial={false} custom={presenceData}>
                {virtualItems.map((item) => {
                  const row = rows[item.index];
                  return (
                    <motion.div
                      key={item.key}
                      className="absolute inset-x-0 top-0"
                      role="rowgroup"
                      initial={
                        reduceMotion || previousVisibleIds.current.has(row.node.span.id) ? false : { opacity: 0, y: item.start + 6 }
                      }
                      animate={{ opacity: 1, y: item.start }}
                      exit="removed"
                      variants={{
                        removed: ({ visibleIds: nextVisibleIds, reduceMotion: reduced }: TraceRowPresenceData) => ({
                          opacity: 0,
                          transition: reduced || nextVisibleIds.has(row.node.span.id)
                            ? { duration: 0 }
                            : spring.moderate.exit,
                        }),
                      }}
                      transition={
                        reduceMotion ? { duration: 0 } : spring.moderate
                      }
                    >
                      <LiveRow
                        row={row}
                        rowIndex={item.index}
                        model={model}
                        expanded={expanded.has(row.node.span.id)}
                        selected={selectedId === row.node.span.id}
                        timeline={timeline}
                        nowOffsetMs={nowOffsetMs}
                        locale={locale}
                        labels={labels}
                        cost={usage.costs.get(row.node.span.id) ?? 0}
                        slowest={row.node.span.id === usage.slowestSpanId}
                        renderIcon={renderSpanIcon}
                        onToggle={() => toggle(row.node.span.id)}
                        onSelect={(element) =>
                          select(row.node.span.id, element)
                        }
                        onKeyDown={(event) => keyboard(event, item.index, row)}
                        onFocus={() => setFocusedId(row.node.span.id)}
                        setRef={(element) => {
                          if (element)
                            rowRefs.current.set(row.node.span.id, element);
                          else rowRefs.current.delete(row.node.span.id);
                        }}
                        tabIndex={focusableId === row.node.span.id ? 0 : -1}
                        expandLabel={timelineLabels?.expandAll ?? "Expand"}
                        collapseLabel={timelineLabels?.collapseAll ?? "Collapse"}
                      />
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
          {selected && (
            <PopoverContent
              aria-label={labels.spanDetails}
              anchor={
                anchor?.isConnected
                  ? anchor
                  : (rowRefs.current.get(selected.id) ?? viewport)
              }
              align="end"
              side="top"
              sideOffset={8}
              surfaceClassName="border-hairline border-border"
              surfaceShadow="none"
              className="max-h-[80vh] w-lg max-w-[calc(100vw-2rem)] overflow-y-auto p-5"
              finalFocus={() => (anchor?.isConnected ? anchor : viewport)}
            >
              <SpanDetails
                span={selected}
                labels={labels}
                locale={locale}
                nowOffsetMs={nowOffsetMs}
                cost={usage.costs.get(selected.id) ?? 0}
                renderIcon={renderSpanIcon}
                onClose={() => select(null)}
              />
            </PopoverContent>
          )}
        </Popover>
      )}
    </section>
  );
}
