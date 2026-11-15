"use client";

import { useTranslations } from "next-intl";
import { AgentQueueDemo } from "@docs/components/blocks/AgentQueueDemo";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import type { PreviewCode } from "@docs/lib/preview-source";

export function AgentQueueBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("agentQueueBlock");
  return <BlockDetailPage slug="agent-queue-01" title={t("title")} description={t("description")} code={code} preview={<AgentQueueDemo />}>
    <BlockDetailSection title={t("dataContract")}><p className="text-body text-fg-muted">{t("dataContractBody")}</p></BlockDetailSection>
    <BlockDetailSection title={t("behavior")}><p className="text-body text-fg-muted">{t("behaviorBody")}</p></BlockDetailSection>
  </BlockDetailPage>;
}
