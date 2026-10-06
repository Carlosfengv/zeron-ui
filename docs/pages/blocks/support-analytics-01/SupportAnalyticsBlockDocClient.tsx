"use client";

import { useTranslations } from "next-intl";
import type { PreviewCode } from "@docs/lib/preview-source";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { SupportAnalyticsDemo } from "@docs/components/blocks/SupportAnalyticsDemo";

export function SupportAnalyticsBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("supportAnalyticsBlock");
  return <BlockDetailPage code={code} slug="support-analytics-01" title={t("title")} description={t("description")} preview={<SupportAnalyticsDemo />}>
    <BlockDetailSection title={t("composition")}><p className="text-body text-fg-muted">{t("compositionBody")}</p></BlockDetailSection>
    <BlockDetailSection title={t("dataContract")}><p className="text-body text-fg-muted">{t("dataContractBody")}</p></BlockDetailSection>
    <BlockDetailSection title={t("behavior")}><p className="text-body text-fg-muted">{t("behaviorBody")}</p></BlockDetailSection>
  </BlockDetailPage>;
}
