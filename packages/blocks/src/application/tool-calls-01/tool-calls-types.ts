import type { HTMLAttributes } from "react";
import type { ChatAssistantMessageProps, ChatThreadProps, ChatUserMessageProps } from "@zeron/blocks/chat-thread-01";

export type ToolCallStatus = "queued" | "running" | "approval-required" | "completed" | "failed" | "denied" | "cancelled";
export type ToolCallDecision = "allow" | "deny";
export interface ToolCallFile { name: string; contents: string }
export interface ToolCallMatch { id: string; path: string; line?: number; preview: string }

interface ToolCallBase {
  /** Stable within a list; use a new id for a new execution. */
  id: string;
  label: string;
  status: ToolCallStatus;
  description?: string;
  durationMs?: number;
  output?: string;
  error?: string;
}

export type ToolCall = ToolCallBase & (
  | { kind: "search"; query: string; matches?: readonly ToolCallMatch[] }
  | { kind: "read" | "write"; file: ToolCallFile }
  | { kind: "edit"; oldFile: ToolCallFile; newFile: ToolCallFile }
  | { kind: "command"; command: string; cwd?: string; exitCode?: number }
  | { kind: "custom"; input?: string }
);

export interface ToolCallsLabels {
  title: string;
  empty: string;
  status: Record<ToolCallStatus, string>;
  input: string;
  output: string;
  noOutput: string;
  noMatches: string;
  directory: string;
  allow: string;
  deny: string;
  deciding: string;
  retry: string;
  actionFailed: string;
  approval: string;
  matches: (count: number) => string;
  exitCode: (code: number) => string;
}

export interface ToolCallsProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  items: readonly ToolCall[];
  labels?: Partial<Omit<ToolCallsLabels, "status">> & { status?: Partial<ToolCallsLabels["status"]> };
  locale?: string;
  /** Optional collapsed investigation summary. Omit to display the tool list directly. */
  summary?: string;
  defaultOpen?: boolean;
  expandedIds?: readonly string[];
  defaultExpandedIds?: readonly string[];
  onExpandedChange?: (ids: string[]) => void;
  /** Resolve after committing host state. Rejection keeps the request available. */
  onApproval?: (call: ToolCall, decision: ToolCallDecision) => void | Promise<void>;
  onRetry?: (call: ToolCall) => void | Promise<void>;
}

export type ToolCallsPart =
  | { id: string; kind: "text"; text: string; streaming?: boolean }
  | { id: string; kind: "tools"; items: readonly ToolCall[]; summary?: string; defaultOpen?: boolean; defaultExpandedIds?: readonly string[] };

export interface ToolCallsThreadProps extends Omit<ChatThreadProps, "children" | "busy"> {
  prompt: string;
  parts: readonly ToolCallsPart[];
  userMessageProps?: Omit<ChatUserMessageProps, "id" | "text" | "children">;
  assistantMessageProps?: Omit<ChatAssistantMessageProps, "id" | "text" | "children" | "streaming" | "last">;
  toolCallsProps?: Omit<ToolCallsProps, "items" | "summary" | "defaultOpen" | "defaultExpandedIds">;
}
