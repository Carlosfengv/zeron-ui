import type { ReactNode } from "react";
import type { ChartColorIndex } from "@zeron/ui/chart-primitives";
import type { IconName } from "@zeron/ui/system/icon-context";

export type AgentRunStatus = "idle" | "working" | "done" | "paused" | "stopped" | "failed";
export type AgentRunControl = "pause" | "resume" | "stop";

export interface AgentRunTool {
  id: string;
  label: string;
  icon: IconName;
}

export interface AgentRunNode {
  /** Stable and unique within the run. */
  id: string;
  name: string;
  status: AgentRunStatus;
  summary: string;
  assignment?: string;
  model?: string;
  /** Model logo in the details. Claude models have a default logo. */
  modelIcon?: ReactNode;
  kind?: "agent" | "tool";
  icon?: IconName;
  /** Defaults to the parent's chart color, or chart color 1 at the root. */
  colorIndex?: ChartColorIndex;
  usage?: { tokens: number; limit: number };
  elapsedSeconds?: number;
  costUsd?: number;
  tools?: readonly AgentRunTool[];
  handoff?: { from: string; summary: string };
  /** Enables run controls in the details when the host supplies onControl. */
  controllable?: boolean;
  children?: readonly AgentRunNode[];
}

export interface AgentRunSnapshot {
  id: string;
  title: string;
  root: AgentRunNode | null;
}

export interface AgentRunLabels {
  status: Record<AgentRunStatus, string>;
  chooseRun: string;
  close: string;
  empty: string;
  elapsed: string;
  cost: string;
  tokens: string;
  message: string;
  send: string;
  pause: string;
  resume: string;
  stop: string;
  duration: (seconds: string) => string;
  workingCount: (count: number) => string;
  totalCount: (count: number) => string;
}

export interface AgentRunProps {
  /** Replace the snapshot as activity arrives, preserving run and node IDs. */
  run: AgentRunSnapshot;
  runs?: readonly Pick<AgentRunSnapshot, "id" | "title">[];
  onRunChange?: (runId: string) => void;
  onControl?: (runId: string, nodeId: string, control: AgentRunControl) => void;
  onMessage?: (runId: string, nodeId: string, message: string) => void;
  labels?: AgentRunLabels;
  locale?: string;
  className?: string;
}
