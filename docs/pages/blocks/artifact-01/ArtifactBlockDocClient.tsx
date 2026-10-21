"use client";

import { useTranslations } from "next-intl";
import { CodeBlock } from "@zeron/ui/code-block";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { ArtifactDemo } from "@docs/components/blocks/ArtifactDemo";
import { PropsTable } from "@docs/components/content/PropsTable";
import type { PreviewCode } from "@docs/lib/preview-source";

const example = `"use client";
import { useState } from "react";
import { ArtifactWorkspace, GeneratedArtifactCard } from "@/components/blocks/artifact-01";
import type { ArtifactDocument } from "@/components/ui/artifact-preview-panel";
import { ChatAssistantMessage } from "@/components/ui/chat-thread";
import { InputMessage } from "@/components/ui/input-message";

export function Workspace() {
  const [draft, setDraft] = useState("");
  const [revisionId, setRevisionId] = useState("v1");
  const [pane, setPane] = useState<"chat" | "artifacts">("chat");
  const [open, setOpen] = useState(true);
  const document: ArtifactDocument = { id: "page", title: "Welcome",
    filename: "welcome.html", kind: "html", revisions: [
      { id: "v1", content: "<h1>Hello world</h1>" }
    ] };
  return <div className="h-[640px]">
    <ArtifactWorkspace artifact={document} panelOpen={open}
      onPanelOpenChange={setOpen} activePane={pane} onActivePaneChange={setPane}
      previewProps={{ revisionId, onRevisionChange: setRevisionId,
        onClose: () => { setOpen(false); setPane("chat"); } }}
      composer={<InputMessage layout="compact" value={draft} onValueChange={setDraft} />}>
      <ChatAssistantMessage id="reply" text="Your page is ready.">
        <GeneratedArtifactCard artifact={document} onOpen={(_, version) => {
          setRevisionId(version); setOpen(true); setPane("artifacts");
        }} />
      </ChatAssistantMessage>
    </ArtifactWorkspace>
  </div>;
}`;

export function ArtifactBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("artifactBlock");
  return <BlockDetailPage slug="artifact-01" title={t("title")} description={t("description")} code={code} preview={<ArtifactDemo />}>
    <BlockDetailSection title={t("composition")}><p className="text-body text-fg-muted">{t("compositionBody")}</p></BlockDetailSection>
    <BlockDetailSection title={t("usage")}><CodeBlock file={{ name: "artifact-workspace.tsx", contents: example }} /></BlockDetailSection>
    <BlockDetailSection title={t("api")}><PropsTable props={[
      { name: "ArtifactWorkspace.artifact", type: "ArtifactDocument | null", description: t("apiArtifact") },
      { name: "ArtifactWorkspace.previewProps", type: "ArtifactPreviewPanelProps", description: t("apiPreview") },
      { name: "ArtifactPreviewPanel.revisionId / onRevisionChange", type: "string / (id) => void", description: t("apiRevision") },
      { name: "onRestore", type: "(document, revision) => void | Promise<void>", description: t("apiRestore") },
      { name: "onRetry / onClose", type: "callbacks", description: t("apiActions") },
      { name: "GeneratedArtifactCard.onOpen", type: "(document, revisionId) => void", description: t("apiCard") },
    ]} /></BlockDetailSection>
    <BlockDetailSection title={t("behavior")}><p className="text-body text-fg-muted">{t("behaviorBody")}</p></BlockDetailSection>
    <BlockDetailSection title={t("boundaries")}><p className="text-body text-fg-muted">{t("boundariesBody")}</p></BlockDetailSection>
  </BlockDetailPage>;
}
