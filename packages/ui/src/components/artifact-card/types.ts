import type { HTMLAttributes, ReactNode } from "react";

export type ArtifactCardReviewStatus = "pending" | "accepted" | "rejected";

/** Display data only: no content, revision history, preview runtime or workspace required. */
export interface ArtifactCardItem {
  id: string;
  name: string;
  kind: "code" | "markdown" | "text" | "image" | "url" | "file";
  description?: ReactNode;
  review?: ArtifactCardReviewStatus;
}

export interface ArtifactCardLabels {
  resources: string;
  preview: string;
  pending: string;
  accepted: string;
  rejected: string;
}

export interface ArtifactCardProps<TResource extends ArtifactCardItem = ArtifactCardItem> extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  resources: readonly TResource[];
  title?: string;
  /** The exact original object is returned; the host owns opening its viewer. */
  onOpen: (resource: TResource) => void;
  getDescription?: (resource: TResource) => ReactNode;
  getReviewStatus?: (resource: TResource) => ArtifactCardReviewStatus | undefined;
  labels?: Partial<ArtifactCardLabels>;
  locale?: string;
}
