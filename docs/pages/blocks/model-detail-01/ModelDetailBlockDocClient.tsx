"use client";

import { useState } from "react";
import { ModelDetail } from "@zeron/blocks/model-detail-01";
import { InlineNotice } from "@zeron/ui/inline-notice";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { useTranslations } from "next-intl";
import { DetailBlockPreviewShell } from "../_components/DetailBlockPreviewShell";

export function ModelDetailBlockDocClient({ code }: { code: string }) {
  const t = useTranslations("modelDetailBlock");
  const [notice, setNotice] = useState<string | null>(null);
  const props: PropDef[] = [
    { name: "model", type: "ModelDetailData", description: "Complete model data, including code samples and benchmarks." },
    { name: "defaultLanguage", type: "ModelCodeLanguage", description: "Initial code sample when present; otherwise the first sample." },
    { name: "onRequestApiKey", type: "() => void", description: "Product-owned handoff to key management." },
    { name: "onLanguageChange", type: "(language) => void", description: "Observes local code-tab changes." },
    { name: "onCopyCode", type: "(language) => void", description: "Runs after successful code copy." },
  ];

  return (
    <BlockDetailPage
      code={code}
      description={t("description")}
      previewMinHeightClass="min-h-[44rem]"
      registryName="model-detail-01"
      slug="model-detail-01"
      title={t("title")}
      preview={<DetailBlockPreviewShell active="models"><ModelDetail onRequestApiKey={() => setNotice(t("apiKeyRequested"))} onAgentSelect={(agent) => setNotice(t("agentSelected", { agent }))} /></DetailBlockPreviewShell>}
    >
      <BlockDetailSection title={t("props")}><PropsTable props={props} /></BlockDetailSection>
      <BlockDetailSection title={t("dataBoundary")}><p className="text-body text-fg-muted">{t("dataBoundaryBody")}</p></BlockDetailSection>
      <BlockDetailSection title={t("mockBehavior")}><p className="text-body text-fg-muted">{t("mockBehaviorBody")}</p>{notice && <InlineNotice variant="emphasized" tone="success">{notice}</InlineNotice>}</BlockDetailSection>
      <BlockDetailSection title={t("responsive")}><p className="text-body text-fg-muted">{t("responsiveBody")}</p></BlockDetailSection>
    </BlockDetailPage>
  );
}
