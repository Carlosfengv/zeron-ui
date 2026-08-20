"use client";

import { AgentSessionDetail } from "@zeron/blocks/agent-session-detail-01";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

export function AgentSessionDetailBlockDocClient({ code }: { code: string }) {
  const t = useTranslations("agentSessionDetailBlock");
  return <BlockDetailPage code={code} description={t("description")} slug="agent-session-detail-01" title={t("title")} preview={<AgentSessionDetail className="h-full min-h-0" />}>
    <BlockDetailSection title={t("guidance")}><p className="text-body text-fg-muted">{t("guidanceBody")}</p></BlockDetailSection>
  </BlockDetailPage>;
}
