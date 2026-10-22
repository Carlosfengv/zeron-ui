import type { HTMLAttributes, ReactNode } from "react";
import type { ChatThreadProps } from "@zeron/ui/chat-thread";
import type { ResizablePanelGroupProps } from "@zeron/ui/resizable";
import type { ArtifactResource, ArtifactLabels } from "@zeron/ui/artifact-panel";

export type { ArtifactReviewStatus, ArtifactReviewDecision, ArtifactView, ArtifactResource, ArtifactLabels, ArtifactPanelProps } from "@zeron/ui/artifact-panel";

export interface ArtifactCardProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  resources: readonly ArtifactResource[];
  title?: string;
  onOpen: (resource: ArtifactResource) => void;
  labels?: Partial<ArtifactLabels>;
  locale?: string;
}

export interface ChatWorkspaceProps extends ChatThreadProps {
  /** Usually ArtifactPanel; this slot can also contain a host-owned viewer. */
  artifacts: ReactNode;
  title?: string;
  /** Host-owned session actions, shown beside the content pane controls. */
  headerActions?: ReactNode;
  panelOpen?: boolean;
  defaultPanelOpen?: boolean;
  onPanelOpenChange?: (open: boolean) => void;
  activePane?: "chat" | "artifacts";
  defaultActivePane?: "chat" | "artifacts";
  onActivePaneChange?: (pane: "chat" | "artifacts") => void;
  chatDefaultSize?: string;
  chatMinSize?: string;
  artifactMinSize?: string;
  onLayoutChanged?: ResizablePanelGroupProps["onLayoutChanged"];
  workspaceLabels?: Partial<ArtifactLabels>;
}
