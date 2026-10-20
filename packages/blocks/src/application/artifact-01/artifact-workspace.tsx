"use client";

import { ArtifactCard, ChatWorkspace, type ArtifactResource } from "@zeron/blocks/chat-workspace-01";
import { ArtifactPreviewPanel } from "./artifact-preview-panel";
import { resolveArtifactPreviewLabels } from "./artifact-labels";
import type { ArtifactDocument, ArtifactWorkspaceProps } from "./artifact-types";

export function ArtifactWorkspace({ artifact, previewProps, ...props }: ArtifactWorkspaceProps) {
  return <ChatWorkspace {...props} artifacts={<ArtifactPreviewPanel {...previewProps} artifact={artifact} locale={props.locale} />} />;
}

/** Uses the same resource card as ChatWorkspace, preserving its button and file contracts. */
export function GeneratedArtifactCard({ artifact, revisionId, onOpen, locale }: {
  artifact: ArtifactDocument; revisionId?: string; onOpen: (artifact: ArtifactDocument, revisionId: string) => void; locale?: string;
}) {
  const revision = artifact.revisions.find((item) => item.id === revisionId) ?? artifact.revisions.at(-1);
  if (!revision) return null;
  const index = artifact.revisions.indexOf(revision) + 1;
  const labels = resolveArtifactPreviewLabels(locale);
  const resource: ArtifactResource = { id: artifact.id, version: revision.id, name: artifact.filename, content: revision.content, kind: artifact.kind === "markdown" ? "markdown" : "code" };
  return <ArtifactCard locale={locale} title={`${artifact.title} · ${revision.status === "streaming" ? labels.writing : `v${index}`}`} resources={[resource]} onOpen={() => onOpen(artifact, revision.id)} />;
}
