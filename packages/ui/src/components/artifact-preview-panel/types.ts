import type { HTMLAttributes } from "react";

export interface ArtifactRevision {
  /** Stable within a document. Append a new ID for each revision. */
  id: string;
  content: string;
  label?: string;
  status?: "ready" | "streaming" | "error";
  error?: string;
}

export interface ArtifactDocument {
  id: string;
  title: string;
  filename: string;
  kind: "html" | "markdown" | "code";
  /** Oldest first. Content and history are owned by the host. */
  revisions: readonly ArtifactRevision[];
}

export interface ArtifactPreviewLabels {
  panel: string;
  code: string;
  preview: string;
  changes: string;
  versions: string;
  version: (index: number, count: number) => string;
  latest: string;
  restore: string;
  restoring: string;
  restoreFailed: string;
  writing: string;
  ready: string;
  stopped: string;
  failed: string;
  retry: string;
  copy: string;
  copied: string;
  copyFailed: string;
  download: string;
  downloadFailed: string;
  refresh: string;
  expand: string;
  collapse: string;
  expandFailed: string;
  close: string;
  empty: string;
  emptyDescription: string;
  loading: string;
  lines: (count: number) => string;
}

export interface ArtifactPreviewPanelProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  artifact: ArtifactDocument | null;
  revisionId?: string;
  onRevisionChange?: (revisionId: string) => void;
  /** Persist by appending a new revision. Uncontrolled selection follows it after success unless the user navigated elsewhere. */
  onRestore?: (artifact: ArtifactDocument, revision: ArtifactRevision) => void | Promise<void>;
  onRetry?: (artifact: ArtifactDocument, revision: ArtifactRevision) => void;
  onClose?: () => void;
  locale?: string;
  labels?: Partial<ArtifactPreviewLabels>;
}
