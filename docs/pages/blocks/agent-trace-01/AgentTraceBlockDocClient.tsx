"use client";

import { AgentTrace } from "@zeron/blocks/agent-trace-01";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

export function AgentTraceBlockDocClient({ code }: { code: string }) {
  const t = useTranslations("agentTraceBlock");

  return (
    <BlockDetailPage
      code={code}
      description={t("description")}
      slug="agent-trace-01"
      title={t("title")}
      preview={<AgentTrace className="h-full min-h-0 rounded-none border-0" />}
    >
      <BlockDetailSection title={t("guidance")}>
        <p className="text-body text-fg-muted">{t("guidanceBody")}</p>
      </BlockDetailSection>
    </BlockDetailPage>
  );
}
