import type { ComponentPropsWithoutRef } from "react";

export type SecurityOverviewRange = "7d" | "30d" | "90d";
export type SecurityOverviewView = "trend" | "findings" | "posture" | "assets";
export type SecurityOverviewSeverity = "critical" | "high" | "medium" | "low";
export type SecurityOverviewCounts = Record<SecurityOverviewSeverity, number>;
export type SecurityOverviewState = "ready" | "loading" | "stale" | "error";

export interface SecurityOverviewFinding {
  id: string;
  title: string;
  assetId: string;
  assetName: string;
  severity: SecurityOverviewSeverity;
  /** Caller-supplied 0–10 score. Unknown is null. */
  score: number | null;
  detectedAt: number;
}

export interface SecurityOverviewAsset {
  id: string;
  name: string;
  kind: string;
  lastScannedAt: number | null;
  findings: SecurityOverviewCounts;
}

export interface SecurityOverviewPostureArea {
  id: string;
  label: string;
  score: number | null;
  previousScore: number | null;
}

export interface SecurityOverviewSnapshot {
  id: string;
  scopeId: string;
  range: SecurityOverviewRange;
  asOf: number;
  window: { start: number; end: number; comparisonAt: number };
  score: number | null;
  grade: string | null;
  scoreTone: "success" | "warning" | "danger" | "neutral";
  previousScore: number | null;
  openBySeverity: SecurityOverviewCounts | null;
  resolvedInWindow: number | null;
  scannedAssetCount: number | null;
  newAssetsInWindow: number | null;
  affectedAssetCount: number | null;
  /** Server-aggregated median, in hours. */
  medianFixTimeHours: number | null;
  lastScanAt: number | null;
  /** Mutually exclusive severity counts at each instant. null is missing, not zero. */
  trend: readonly { at: number; counts: SecurityOverviewCounts | null }[] | null;
  posture: readonly SecurityOverviewPostureArea[] | null;
  /** Sorted preview subset or full collection; lengths are not summary totals. */
  findings: readonly SecurityOverviewFinding[] | null;
  assets: readonly SecurityOverviewAsset[] | null;
}

export type SecurityOverviewScanState =
  | { status: "idle" }
  | { status: "starting" }
  | { status: "running"; jobId: string; completed: number | null; total: number | null }
  | { status: "refreshing"; jobId: string }
  | { status: "succeeded"; jobId: string; snapshotId: string; newFindingCount: number }
  | { status: "failed"; jobId?: string; message: string };

export interface SecurityOverviewLabels {
  title: string; description: string; range: string; days7: string; days30: string; days90: string;
  trend: string; findings: string; posture: string; assets: string; navigation: string;
  securityScore: string; compare: string; points: string; open: string; resolved: string;
  scannedAssets: string; fixTime: string; median: string; days: string; hours: string;
  critical: string; high: string; medium: string; low: string; unknown: string;
  runScan: string; starting: string; scanning: string; refreshing: string; scanComplete: string;
  newFindings: string; previousSnapshot: string; progress: string; lastScan: string; neverScanned: string;
  export: string; exporting: string; exportError: string; close: string; retry: string;
  loading: string; error: string; stale: string; noData: string; noFindings: string; noAssets: string;
  trendDescription: string; total: string; viewValues: string; sortedByScore: string;
  viewAllFindings: string; viewAllAssets: string; affectedAssets: string;
  current: string; previous: string; postureDescription: string; change: string;
}

export interface SecurityOverviewProps extends Omit<ComponentPropsWithoutRef<"div">, "children" | "title" | "onChange" | "onClick"> {
  scopeId: string;
  data: SecurityOverviewSnapshot | null;
  state?: SecurityOverviewState;
  statusMessage?: string;
  range: SecurityOverviewRange;
  onRangeChange: (range: SecurityOverviewRange) => void;
  view?: SecurityOverviewView;
  defaultView?: SecurityOverviewView;
  onViewChange?: (view: SecurityOverviewView) => void;
  scan?: SecurityOverviewScanState;
  scanDisabledReason?: string;
  exportState?: "idle" | "pending" | "error";
  exportError?: string;
  actions?: {
    onRunScan?: (context: { scopeId: string }) => void;
    onExport?: (context: { scopeId: string; snapshotId: string; range: SecurityOverviewRange }) => void;
    onOpenFinding?: (id: string) => void;
    onOpenAsset?: (id: string) => void;
    onViewAll?: (kind: "findings" | "assets") => void;
    onRetry?: () => void;
    onClose?: () => void;
  };
  title?: string;
  description?: string;
  labels?: Partial<SecurityOverviewLabels>;
  locale?: string;
  timeZone?: string;
}
