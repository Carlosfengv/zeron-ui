import type { ComponentPropsWithoutRef } from "react";
import type { StatusOverviewSegment } from "@zeron/ui/status-overview";
import type { IconName } from "@zeron/ui/system/icon-context";

export type DeploymentStatus = "ready" | "building" | "queued" | "error" | "cancelled" | "unknown";
export type DeploymentStageStatus = "success" | "running" | "pending" | "warning" | "error" | "unknown";
export interface DeploymentIssue {
  id: string;
  severity: "error" | "warning";
  message: string;
  detail?: string;
}
export interface DeploymentStage {
  id: string;
  kind: "build" | "summary" | "checks" | "domains";
  label: string;
  status: DeploymentStageStatus;
  /** Elapsed time in milliseconds; null means unknown. */
  durationMs: number | null;
  /** Real checks/nodes, or equally spaced time buckets when timeline is supplied. */
  segments: readonly StatusOverviewSegment[];
  timeline?: { start: number; end: number };
  metrics?: readonly { id: string; label: string; value: number | null; icon?: IconName }[];
  /** Undefined means issues have not been loaded; [] means no issues. */
  issues?: readonly DeploymentIssue[];
  actionLabel?: string;
}
export interface DeploymentDetailData {
  id: string;
  name: string;
  environment: string;
  status: DeploymentStatus;
  url?: string;
  shareUrl?: string;
  preview?: { src: string; alt: string };
  createdAt: number | null;
  completedAt?: number | null;
  durationMs: number | null;
  creator?: { name: string; avatarUrl?: string };
  domains: readonly { id: string; name: string; url?: string; kind: "custom" | "branch" | "commit" }[];
  source?: { branch: string; commit: string; message: string; url?: string; pullRequest?: { number: number; url?: string } };
  stages: readonly DeploymentStage[];
}
export interface DeploymentDetailLabels {
  title: string; share: string; sharing: string; copied: string; copyError: string;
  visit: string; environment: string; status: string; created: string; duration: string; completed: string;
  domains: string; moreDomains: string; source: string; stages: string; ready: string; building: string;
  queued: string; error: string; cancelled: string; unknown: string; success: string; running: string;
  pending: string; warning: string; noPreview: string; noDomains: string; noSource: string; noStages: string;
  errors: string; warnings: string; checksPassed: string; checksUnknown: string; investigate: string;
  logs: string; more: string; copyCommit: string; retry: string; loading: string; unavailable: string;
  stale: string; actionError: string;
}
export interface DeploymentDetailProps extends Omit<ComponentPropsWithoutRef<"div">, "children" | "onClick"> {
  data: DeploymentDetailData;
  state?: "ready" | "loading" | "stale" | "error";
  statusMessage?: string;
  actions?: {
    onShare?: (deployment: DeploymentDetailData) => void | Promise<void>;
    /** Opens details for non-build stages. Build summary is a presentation-only button. */
    onOpenStage?: (stage: DeploymentStage, deploymentId: string) => void | Promise<void>;
    onRetry?: () => void | Promise<void>;
  };
  labels?: Partial<DeploymentDetailLabels>;
  locale?: string;
  timeZone?: string;
  /** Optional reference timestamp for relative dates. Omit to show absolute dates. */
  now?: number;
}
