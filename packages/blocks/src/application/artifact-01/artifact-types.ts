import type { ChatWorkspaceProps } from "@zeron/blocks/chat-workspace-01";
import type { ArtifactDocument, ArtifactPreviewPanelProps } from "@zeron/ui/artifact-preview-panel";

export type { ArtifactRevision, ArtifactDocument, ArtifactPreviewLabels, ArtifactPreviewPanelProps } from "@zeron/ui/artifact-preview-panel";

export interface ArtifactWorkspaceProps extends Omit<ChatWorkspaceProps, "artifacts"> {
  artifact: ArtifactDocument | null;
  previewProps?: Omit<ArtifactPreviewPanelProps, "artifact" | "locale">;
}
