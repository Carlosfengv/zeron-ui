"use client";

import { useTranslations } from "next-intl";
import { AgentRunDemo } from "@docs/components/blocks/AgentRunDemo";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import type { PreviewCode } from "@docs/lib/preview-source";

export function AgentRunBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("agentRunBlock");
  return <BlockDetailPage slug="agent-run-01" title={t("title")} description={t("description")} code={code} preview={<AgentRunDemo />}>
    <BlockDetailSection title={t("dataContract")}><p className="text-body text-fg-muted">{t("dataContractBody")}</p></BlockDetailSection>
    <BlockDetailSection title={t("behavior")}><p className="text-body text-fg-muted">{t("behaviorBody")}</p></BlockDetailSection>
  </BlockDetailPage>;
}
