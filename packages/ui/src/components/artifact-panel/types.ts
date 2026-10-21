import type { HTMLAttributes, ReactNode } from "react";

export type ArtifactReviewStatus = "pending" | "accepted" | "rejected";
export type ArtifactReviewDecision = "accept" | "reject";
export type ArtifactView = "preview" | "source" | "diff";

interface ArtifactBase {
  /** Unique within a panel. Preserve this ID across content revisions. */
  id: string;
  /** Change when content changes; review decisions belong to this version. */
  version: string;
  name: string;
  path?: string;
  messageId?: string;
  status?: "ready" | "loading" | "error";
  error?: string;
  downloadUrl?: string;
  /** File size in bytes. Text resources fall back to their UTF-8 content size. */
  size?: number;
}

export type ArtifactResource = ArtifactBase & (
  | { kind: "code"; content: string; previousContent?: string; previousPath?: string; review?: ArtifactReviewStatus }
  | { kind: "markdown"; content: string; previousContent?: string; review?: ArtifactReviewStatus }
  | { kind: "text"; content: string }
  | { kind: "image"; url: string; alt?: string }
  | { kind: "url"; url: string }
  | { kind: "file"; url?: string; mimeType?: string }
);

export interface ArtifactLabels {
  panel: string;
  resources: string;
  more: string;
  empty: string;
  emptyDescription: string;
  preview: string;
  source: string;
  diff: string;
  unified: string;
  split: string;
  copy: string;
  copied: string;
  copyFailed: string;
  download: string;
  reference: string;
  referenced: string;
  referenceFailed: string;
  openExternal: string;
  refresh: string;
  close: (name: string) => string;
  closeOthers: string;
  closeAll: string;
  loading: string;
  failed: string;
  retry: string;
  unsupported: string;
  unavailableUrl: string;
  webNotice: string;
  zoomIn: string;
  zoomOut: string;
  fit: string;
  actualSize: string;
  panImage: string;
  accept: string;
  reject: string;
  acceptAll: string;
  rejectAll: string;
  pending: string;
  accepted: string;
  rejected: string;
  reviewing: string;
  reviewFailed: string;
  reviewActions: string;
  reviewList: string;
  previousPending: string;
  nextPending: string;
  startReview: string;
  remaining: (count: number) => string;
  workspace: string;
  conversation: string;
  showPanel: string;
  hidePanel: string;
  resize: string;
}

export interface ArtifactPanelProps extends Omit<HTMLAttributes<HTMLElement>, "children" | "onSelect"> {
  /** The open resources, in tab order. The host owns closing and persistence. */
  resources: readonly ArtifactResource[];
  activeId?: string | null;
  defaultActiveId?: string;
  onActiveIdChange?: (id: string) => void;
  onClose?: (resource: ArtifactResource) => void;
  /** Handles every close operation atomically when supplied; otherwise calls onClose for each resource. */
  onCloseMany?: (resources: readonly ArtifactResource[]) => void;
  /** Optional action beside the content tabs, such as a plus-button resource picker. */
  addAction?: ReactNode;
  /** Resolve after committing this exact resource version; reject on failure. */
  onReview?: (resource: ArtifactResource, decision: ArtifactReviewDecision) => void | Promise<void>;
  onReference?: (resource: ArtifactResource) => void | Promise<void>;
  onRetry?: (resource: ArtifactResource) => void | Promise<void>;
  /** Return undefined to use the built-in viewer. */
  renderPreview?: (resource: ArtifactResource) => ReactNode | undefined;
  labels?: Partial<ArtifactLabels>;
  locale?: string;
}
