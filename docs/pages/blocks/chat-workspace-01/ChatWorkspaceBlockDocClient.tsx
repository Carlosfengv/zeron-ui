"use client";

import { useTranslations } from "next-intl";
import { CodeBlock } from "@zeron/ui/code-block";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { ArtifactPanelDemo, ChatWorkspaceDemo } from "@docs/components/blocks/ChatWorkspaceDemo";
import { PropsTable } from "@docs/components/content/PropsTable";
import type { PreviewCode } from "@docs/lib/preview-source";

const example = `"use client";
import { useState } from "react";
import { ChatWorkspace, ArtifactPanel, ArtifactCard, type ArtifactResource }
  from "@/components/blocks/chat-workspace-01";
import { ChatAssistantMessage } from "@/components/blocks/chat-thread-01";
import { InputMessage } from "@/components/ui/input-message";

export function Workspace() {
  const [draft, setDraft] = useState("");
  const [activeId, setActiveId] = useState("guide");
  const [pane, setPane] = useState<"chat" | "artifacts">("chat");
  const resources: ArtifactResource[] = [{ id: "guide", version: "1",
    kind: "markdown", name: "README.md", content: "# Project guide" }];
  return <div className="h-[640px]">
    <ChatWorkspace chatDefaultSize="38%" activePane={pane} onActivePaneChange={setPane} composer={
      <InputMessage layout="compact" value={draft} onValueChange={setDraft} />
    } artifacts={
      <ArtifactPanel resources={resources} activeId={activeId}
        onActiveIdChange={setActiveId} />
    }>
      <ChatAssistantMessage id="reply" text="Your guide is ready.">
        <ArtifactCard resources={resources} onOpen={(item) => { setActiveId(item.id); setPane("artifacts"); }} />
      </ChatAssistantMessage>
    </ChatWorkspace>
  </div>;
}
// ArtifactPanel also works by itself in any height-constrained container.
// The host owns requests, open resources, revisions and file operations.\n`;

export function ChatWorkspaceBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("chatWorkspaceBlock");
  return <BlockDetailPage slug="chat-workspace-01" title={t("title")} description={t("description")} code={code} preview={<ChatWorkspaceDemo />}>
    <BlockDetailSection title={t("composition")}><p className="text-body text-fg-muted">{t("compositionBody")}</p></BlockDetailSection>
    <BlockDetailSection title={t("usage")}><CodeBlock file={{ name: "workspace.tsx", contents: example }} /></BlockDetailSection>
    <BlockDetailSection title={t("standalone")}><p className="mb-3 text-body text-fg-muted">{t("standaloneBody")}</p><ArtifactPanelDemo /></BlockDetailSection>
    <BlockDetailSection title={t("api")}><PropsTable props={[
      { name: "ChatWorkspace.artifacts", type: "ReactNode", description: t("apiArtifacts") },
      { name: "title / headerActions", type: "string / ReactNode", description: t("apiHeader") },
      { name: "chatDefaultSize / chatMinSize / artifactMinSize", type: "string", default: "38% / 280px / 320px", description: t("apiResize") },
      { name: "panelOpen / onPanelOpenChange", type: "boolean / (open) => void", description: t("apiOpen") },
      { name: "activePane / onActivePaneChange", type: '"chat" | "artifacts" / (pane) => void', description: t("apiPane") },
      { name: "ArtifactPanel.resources", type: "readonly ArtifactResource[]", description: t("apiResources") },
      { name: "activeId / onActiveIdChange / onClose", type: "string | null / callbacks", description: t("apiTabs") },
      { name: "onCloseMany", type: "(resources: readonly ArtifactResource[]) => void", description: t("apiCloseMany") },
      { name: "addAction", type: "ReactNode", description: t("apiAddAction") },
      { name: "onReview", type: '(resource, "accept" | "reject") => void | Promise<void>', description: t("apiReview") },
      { name: "onReference / onRetry / renderPreview", type: "callbacks / (resource) => ReactNode | undefined", description: t("apiExtensions") },
    ]} /></BlockDetailSection>
    <BlockDetailSection title={t("behavior")}><p className="text-body text-fg-muted">{t("behaviorBody")}</p></BlockDetailSection>
    <BlockDetailSection title={t("boundaries")}><p className="text-body text-fg-muted">{t("boundariesBody")}</p></BlockDetailSection>
  </BlockDetailPage>;
}
