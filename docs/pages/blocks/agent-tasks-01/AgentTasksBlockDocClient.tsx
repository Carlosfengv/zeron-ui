"use client";

import { useTranslations } from "next-intl";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { AgentTasksDemo } from "@docs/components/blocks/AgentTasksDemo";
import type { PreviewCode } from "@docs/lib/preview-source";

export function AgentTasksBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("agentTasksBlock");
  return (
    <BlockDetailPage slug="agent-tasks-01" title={t("title")} description={t("description")} code={code} preview={<AgentTasksDemo />}>
      <BlockDetailSection title={t("composition")}><p className="text-body text-fg-muted">{t("compositionBody")}</p></BlockDetailSection>
      <BlockDetailSection title={t("dataContract")}><p className="text-body text-fg-muted">{t("dataContractBody")}</p></BlockDetailSection>
      <BlockDetailSection title={t("behavior")}><p className="text-body text-fg-muted">{t("behaviorBody")}</p></BlockDetailSection>
    </BlockDetailPage>
  );
}
