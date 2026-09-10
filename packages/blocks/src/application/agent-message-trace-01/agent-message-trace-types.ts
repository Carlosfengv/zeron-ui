import type { ComponentPropsWithoutRef, CSSProperties } from "react";

export const agentMessageTraceKinds = ["chat", "agent", "tool"] as const;

export type AgentMessageTraceKind = (typeof agentMessageTraceKinds)[number];
export type AgentMessageTraceStatus = "running" | "success" | "error" | "cancelled";
export type AgentMessageTraceState = "ready" | "loading" | "error";

/** Message payload shape rendered as a role-aware card in Pretty mode. */
export interface AgentMessageTraceMessage {
  role: string;
  content: unknown;
}

export interface AgentMessageTraceEvent {
  id: string;
  name: string;
  /** Milliseconds relative to the beginning of the message trace. */
  startOffsetMs: number;
  status?: AgentMessageTraceStatus;
  payload?: unknown;
  attributes?: Record<string, unknown>;
}

export interface AgentMessageTraceSpan {
  /** Stable identity used for selection, streaming updates, and tree reconciliation. */
  id: string;
  /** Null marks a root span. Orphans are rendered as roots by the projection layer. */
  parentId: string | null;
  kind: AgentMessageTraceKind;
  name: string;
  /** The traced operation, such as `invoke_agent` or `execute_tool`. */
  operation?: string;
  model?: string;
  provider?: string;
  finishReason?: string;
  conversationId?: string;
  toolName?: string;
  /** Milliseconds relative to the beginning of this message trace. */
  startOffsetMs: number;
  /** Running spans may omit duration and use `nowOffsetMs` from the component. */
  durationMs?: number;
  status: AgentMessageTraceStatus;
  /** Pass AgentMessageTraceMessage or an array of messages for role-aware Pretty rendering. */
  input?: unknown;
  inputTruncated?: boolean;
  output?: unknown;
  outputTruncated?: boolean;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
  attributes?: Record<string, unknown>;
  events?: readonly AgentMessageTraceEvent[];
}

export interface AgentMessageTraceData {
  id: string;
  messageId?: string;
  /** Optional absolute start time, retained for host-side inspection. */
  startedAt?: string;
  spans: readonly AgentMessageTraceSpan[];
}

export interface AgentMessageTraceLabels {
  ariaLabel: string;
  spanColumn: string;
  operationColumn: string;
  expandAll: string;
  collapseAll: string;
  chat: string;
  agent: string;
  tool: string;
  running: string;
  success: string;
  error: string;
  cancelled: string;
  loading: string;
  empty: string;
  noMatchingSpans: string;
  errorMessage: string;
}

export interface AgentMessageTraceProps
  extends Omit<ComponentPropsWithoutRef<"section">, "children"> {
  data: AgentMessageTraceData;
  state?: AgentMessageTraceState;
  errorMessage?: string;
  labels?: Partial<AgentMessageTraceLabels>;
  /** Expands nodes shallower than this depth when state is uncontrolled. */
  defaultExpandedDepth?: number;
  expandedSpanIds?: readonly string[];
  onExpandedSpanIdsChange?: (spanIds: readonly string[]) => void;
  selectedSpanId?: string | null;
  onSelectedSpanIdChange?: (spanId: string | null) => void;
  onSpanSelect?: (span: AgentMessageTraceSpan) => void;
  visibleKinds?: readonly AgentMessageTraceKind[];
  onVisibleKindsChange?: (kinds: readonly AgentMessageTraceKind[]) => void;
  /** Current relative time for open running spans. */
  nowOffsetMs?: number;
  /** Optional viewport ceiling. By default the Block fills its parent height. */
  maxHeight?: CSSProperties["maxHeight"];
  locale?: string;
  showToolbar?: boolean;
}

export interface AgentMessageTraceInspectorLabels {
  ariaLabel: string;
  selectPrompt: string;
  missingSelection: string;
  inputOutput: string;
  attributes: string;
  events: string;
  input: string;
  output: string;
  pretty: string;
  json: string;
  model: string;
  provider: string;
  duration: string;
  finish: string;
  operation: string;
  conversation: string;
  spanId: string;
  parentSpanId: string;
  status: string;
  truncated: string;
  unavailable: string;
  pending: string;
  copy: string;
  copied: string;
  noAttributes: string;
  noEvents: string;
}

export interface AgentMessageTraceWorkspaceProps extends AgentMessageTraceProps {
  /** Seeds uncontrolled selection. Omit to select the first root span. */
  defaultSelectedSpanId?: string | null;
  inspectorLabels?: Partial<AgentMessageTraceInspectorLabels>;
  inspectorDefaultSize?: number | string;
  inspectorMinSize?: number | string;
  inspectorMaxSize?: number | string;
}
