import type {
  AgentMessageTraceKind,
  AgentMessageTraceSpan,
} from "./agent-message-trace-types";

export interface AgentMessageTraceNode {
  span: AgentMessageTraceSpan;
  parentId: string | null;
  childIds: readonly string[];
  depth: number;
  descendantCount: number;
}

export interface AgentMessageTraceModel {
  nodes: ReadonlyMap<string, AgentMessageTraceNode>;
  rootIds: readonly string[];
}

export interface AgentMessageTraceRow {
  node: AgentMessageTraceNode;
  /** Each boolean marks whether an ancestor connector continues through this row. */
  ancestorContinuation: readonly boolean[];
  isLast: boolean;
}

type MutableNode = {
  span: AgentMessageTraceSpan;
  parentId: string | null;
  childIds: string[];
  depth: number;
  descendantCount: number;
  order: number;
};

function numeric(value: number | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function safeParentId(
  span: AgentMessageTraceSpan,
  spans: ReadonlyMap<string, AgentMessageTraceSpan>
): string | null {
  const candidate = span.parentId;
  if (!candidate || !spans.has(candidate) || candidate === span.id) return null;

  const visited = new Set([span.id]);
  let current: string | null = candidate;
  while (current) {
    if (visited.has(current)) return null;
    visited.add(current);
    current = spans.get(current)?.parentId ?? null;
  }
  return candidate;
}

function sortIds(ids: string[], nodes: ReadonlyMap<string, MutableNode>): void {
  ids.sort((leftId, rightId) => {
    const left = nodes.get(leftId);
    const right = nodes.get(rightId);
    if (!left || !right) return 0;
    return numeric(left.span.startOffsetMs) - numeric(right.span.startOffsetMs) || left.order - right.order;
  });
}

/** Builds a stable, cycle-safe tree from the streaming-friendly flat span list. */
export function buildAgentMessageTraceModel(
  spans: readonly AgentMessageTraceSpan[]
): AgentMessageTraceModel {
  const uniqueSpans = new Map<string, AgentMessageTraceSpan>();
  for (const span of spans) {
    if (span.id && !uniqueSpans.has(span.id)) uniqueSpans.set(span.id, span);
  }

  const mutableNodes = new Map<string, MutableNode>();
  [...uniqueSpans.values()].forEach((span, order) => {
    mutableNodes.set(span.id, {
      span,
      parentId: safeParentId(span, uniqueSpans),
      childIds: [],
      depth: 0,
      descendantCount: 0,
      order,
    });
  });

  const rootIds: string[] = [];
  for (const node of mutableNodes.values()) {
    if (node.parentId) mutableNodes.get(node.parentId)?.childIds.push(node.span.id);
    else rootIds.push(node.span.id);
  }
  sortIds(rootIds, mutableNodes);
  for (const node of mutableNodes.values()) sortIds(node.childIds, mutableNodes);

  const traversal: string[] = [];
  const stack = [...rootIds].reverse().map((id) => ({ id, depth: 0 }));
  while (stack.length) {
    const current = stack.pop();
    if (!current) break;
    const node = mutableNodes.get(current.id);
    if (!node) continue;
    node.depth = current.depth;
    traversal.push(current.id);
    for (let index = node.childIds.length - 1; index >= 0; index -= 1) {
      stack.push({ id: node.childIds[index], depth: current.depth + 1 });
    }
  }

  for (let index = traversal.length - 1; index >= 0; index -= 1) {
    const node = mutableNodes.get(traversal[index]);
    if (!node) continue;
    node.descendantCount = node.childIds.reduce(
      (total, childId) => total + 1 + (mutableNodes.get(childId)?.descendantCount ?? 0),
      0
    );
  }

  const nodes = new Map<string, AgentMessageTraceNode>();
  for (const [id, node] of mutableNodes) {
    nodes.set(id, {
      span: node.span,
      parentId: node.parentId,
      childIds: node.childIds,
      depth: node.depth,
      descendantCount: node.descendantCount,
    });
  }
  return { nodes, rootIds };
}

export function defaultExpandedAgentMessageTraceIds(
  model: AgentMessageTraceModel,
  depth: number
): string[] {
  return [...model.nodes.values()]
    .filter((node) => node.childIds.length > 0 && node.depth < Math.max(0, depth))
    .map((node) => node.span.id);
}

function retainedIds(
  model: AgentMessageTraceModel,
  visibleKinds: ReadonlySet<AgentMessageTraceKind>
): Set<string> {
  const retained = new Set<string>();
  for (const node of model.nodes.values()) {
    if (!visibleKinds.has(node.span.kind)) continue;
    let current: AgentMessageTraceNode | undefined = node;
    while (current && !retained.has(current.span.id)) {
      retained.add(current.span.id);
      current = current.parentId ? model.nodes.get(current.parentId) : undefined;
    }
  }
  return retained;
}

/** Projects the tree into the rows currently visible after filtering and disclosure. */
export function flattenAgentMessageTraceRows(
  model: AgentMessageTraceModel,
  expandedIds: ReadonlySet<string>,
  visibleKinds: ReadonlySet<AgentMessageTraceKind>
): AgentMessageTraceRow[] {
  const retained = retainedIds(model, visibleKinds);
  const rows: AgentMessageTraceRow[] = [];
  const rootIds = model.rootIds.filter((id) => retained.has(id));
  const stack = rootIds.toReversed().map((id, reverseIndex) => ({
    id,
    ancestorContinuation: [] as boolean[],
    isLast: reverseIndex === 0,
  }));

  while (stack.length) {
    const current = stack.pop();
    if (!current) break;
    const node = model.nodes.get(current.id);
    if (!node) continue;
    rows.push({
      node,
      ancestorContinuation: current.ancestorContinuation,
      isLast: current.isLast,
    });

    if (!expandedIds.has(node.span.id)) continue;
    const childIds = node.childIds.filter((id) => retained.has(id));
    for (let index = childIds.length - 1; index >= 0; index -= 1) {
      stack.push({
        id: childIds[index],
        ancestorContinuation: [...current.ancestorContinuation, !current.isLast],
        isLast: index === childIds.length - 1,
      });
    }
  }
  return rows;
}

export function agentMessageTraceDuration(
  spans: readonly AgentMessageTraceSpan[],
  nowOffsetMs?: number
): number {
  const now = numeric(nowOffsetMs);
  return Math.max(
    1,
    ...spans.map((span) => {
      const start = Math.max(0, numeric(span.startOffsetMs));
      const duration = span.durationMs === undefined
        ? span.status === "running" ? Math.max(0, now - start) : 0
        : Math.max(0, numeric(span.durationMs));
      return start + duration;
    })
  );
}

function niceStep(value: number): number {
  const exponent = Math.floor(Math.log10(Math.max(value, 1)));
  const magnitude = 10 ** exponent;
  const fraction = value / magnitude;
  const niceFraction = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return niceFraction * magnitude;
}

export interface AgentMessageTraceTick {
  value: number;
  position: number;
}

export function createAgentMessageTraceTicks(
  durationMs: number,
  desiredCount = 6
): { domainEnd: number; ticks: AgentMessageTraceTick[] } {
  const step = niceStep(Math.max(1, durationMs) / Math.max(1, desiredCount - 1));
  const domainEnd = Math.max(step, Math.ceil(durationMs / step) * step);
  const ticks: AgentMessageTraceTick[] = [];
  for (let value = 0; value <= domainEnd; value += step) {
    ticks.push({ value, position: value / domainEnd });
  }
  return { domainEnd, ticks };
}

export function formatAgentMessageTraceDuration(value: number, locale = "en"): string {
  const milliseconds = Math.max(0, Number.isFinite(value) ? value : 0);
  const format = (amount: number, maximumFractionDigits: number) => new Intl.NumberFormat(locale, {
    maximumFractionDigits,
  }).format(amount);

  if (milliseconds < 1_000) return `${format(Math.round(milliseconds), 0)} ms`;
  if (milliseconds < 60_000) return `${format(milliseconds / 1_000, milliseconds < 10_000 ? 1 : 0)} s`;
  if (milliseconds < 3_600_000) return `${format(milliseconds / 60_000, 1)} min`;
  return `${format(milliseconds / 3_600_000, 1)} h`;
}
