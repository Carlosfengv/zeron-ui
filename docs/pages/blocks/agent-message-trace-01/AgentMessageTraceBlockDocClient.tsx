"use client";

import {
  AgentMessageTrace,
  agentMessageTraceDemoData,
} from "@zeron/blocks/agent-message-trace-01";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

export function AgentMessageTraceBlockDocClient({ code }: { code: string }) {
  const t = useTranslations("agentMessageTraceBlock");

  return (
    <BlockDetailPage
      code={code}
      description={t("description")}
      slug="agent-message-trace-01"
      title={t("title")}
      preview={(
        <div className="h-full min-h-0 w-full bg-surface-base p-3 sm:p-6">
          <AgentMessageTrace
            className="h-full w-full rounded-xl"
            data={agentMessageTraceDemoData}
            defaultExpandedDepth={2}
            nowOffsetMs={154_000}
          />
        </div>
      )}
    >
      <BlockDetailSection title={t("dataTitle")}>
        <p className="text-body text-fg-muted">{t("dataBody")}</p>
      </BlockDetailSection>
      <BlockDetailSection title={t("performanceTitle")}>
        <p className="text-body text-fg-muted">{t("performanceBody")}</p>
      </BlockDetailSection>
    </BlockDetailPage>
  );
}
