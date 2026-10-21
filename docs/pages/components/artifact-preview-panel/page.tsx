"use client";
import { useTranslations } from "next-intl";
import { ComponentPreview } from "@docs/components/content/ComponentPreview";
import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { PropsTable } from "@docs/components/content/PropsTable";
import { ArtifactPreviewPanelExample, ArtifactPreviewStatesExample } from "./example";

const code = `"use client";
import { ArtifactPreviewPanel, type ArtifactPreviewPanelProps } from "@/components/ui/artifact-preview-panel";

export function RevisionPreview(props: ArtifactPreviewPanelProps) {
  return <div className="h-96 min-h-0"><ArtifactPreviewPanel {...props} /></div>;
}
// The host owns the document and its ordered revisions.
// onRestore appends a new revision before resolving; it never overwrites history.`;

export default function ArtifactPreviewPanelDoc() {
  const t = useTranslations("artifact-preview-panel");
  return <DocPage title="ArtifactPreviewPanel" slug="artifact-preview-panel" description={t("description")}>
    <DocSection title={t("basic")}><p className="mb-4 text-body text-fg-muted">{t("basicBody")}</p><ComponentPreview code={code} padding="none" coverSource><ArtifactPreviewPanelExample /></ComponentPreview></DocSection>
    <DocSection title={t("markdown")}><p className="mb-4 text-body text-fg-muted">{t("markdownBody")}</p><ComponentPreview code={`"use client";
import { useState } from "react";
import { ArtifactPreviewPanel, type ArtifactDocument } from "@/components/ui/artifact-preview-panel";

export function MarkdownRevisions() {
  const [artifact, setArtifact] = useState<ArtifactDocument>({
    id: "guide", title: "Project guide", filename: "README.md", kind: "markdown",
    revisions: [{ id: "v1", content: "# Guide" }, { id: "v2", content: "# Updated guide" }],
  });
  return <div className="h-96"><ArtifactPreviewPanel artifact={artifact}
    onRestore={(_, revision) => setArtifact((current) => ({ ...current,
      revisions: [...current.revisions, { id: crypto.randomUUID(), content: revision.content }],
    }))} /></div>;
}`} padding="none"><ArtifactPreviewPanelExample kind="markdown" /></ComponentPreview></DocSection>
    <DocSection title={t("states")}><p className="mb-4 text-body text-fg-muted">{t("statesBody")}</p><ComponentPreview code={'<ArtifactPreviewPanel artifact={documentSnapshot} onRetry={retryRevision} />'} padding="none"><ArtifactPreviewStatesExample /></ComponentPreview></DocSection>
    <DocSection title={t("behavior")}><p className="text-body text-fg-muted">{t("behaviorBody")}</p></DocSection>
    <DocSection title={t("rendering")}><p className="text-body text-fg-muted">{t("renderingBody")}</p></DocSection>
    <DocSection title={t("compatibility")}><p className="text-body text-fg-muted">{t("compatibilityBody")}</p></DocSection>
    <DocSection title={t("api")}><PropsTable props={[
      { name: "artifact", type: "ArtifactDocument | null", description: t("artifactProp") },
      { name: "revisionId / onRevisionChange", type: "string / (revisionId) => void", description: t("revisionProp") },
      { name: "onRestore", type: "(artifact, revision) => void | Promise<void>", description: t("restoreProp") },
      { name: "onRetry / onClose", type: "(artifact, revision) => void / () => void", description: t("actionsProp") },
      { name: "labels / locale / className", type: "Partial<ArtifactPreviewLabels> / string / string", description: t("labelsProp") },
    ]} /></DocSection>
  </DocPage>;
}
