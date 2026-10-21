"use client";

import type { PreviewCode } from "@docs/lib/preview-source";
import { AgentMessageTraceDemo } from "@docs/components/blocks/AgentMessageTraceDemo";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

export function AgentMessageTraceBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("agentMessageTraceBlock");

  return (
    <BlockDetailPage
      code={code}
      description={t("description")}
      slug="agent-message-trace-01"
      title={t("title")}
      preview={<AgentMessageTraceDemo />}
    >
      <BlockDetailSection title={t("variantsTitle")}>
        <p className="text-body text-fg-muted">{t("variantsBody")}</p>
      </BlockDetailSection>
      <BlockDetailSection title={t("dataTitle")}>
        <p className="text-body text-fg-muted">{t("dataBody")}</p>
      </BlockDetailSection>
      <BlockDetailSection title={t("performanceTitle")}>
        <p className="text-body text-fg-muted">{t("performanceBody")}</p>
      </BlockDetailSection>
    </BlockDetailPage>
  );
}
