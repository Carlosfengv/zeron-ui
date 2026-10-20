"use client";

import { useTranslations } from "next-intl";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { ChatWorkspaceDemo } from "@docs/components/blocks/ChatWorkspaceDemo";
import type { PreviewCode } from "@docs/lib/preview-source";

export function ChatWorkspaceBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("chatWorkspaceBlock");
  return <BlockDetailPage slug="chat-workspace-01" title={t("title")} description={t("description")} code={code} preview={<ChatWorkspaceDemo />}>
    <BlockDetailSection title={t("composition")}><p className="text-body text-fg-muted">{t("compositionBody")}</p></BlockDetailSection>
  </BlockDetailPage>;
}
