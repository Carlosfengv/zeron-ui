"use client";

import type { PreviewCode } from "@docs/lib/preview-source";
import { PersonalModelUsage } from "@zeron/blocks/personal-model-usage-01";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

export function PersonalModelUsageBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("personalModelUsageBlock");
  return <BlockDetailPage code={code} description={t("description")} registryName="personal-model-usage-01" slug="personal-model-usage-01" title={t("title")} preview={<PersonalModelUsage />}>
    <BlockDetailSection title={t("navigationTitle")}><p className="text-body text-fg-muted">{t("navigationBody")}</p></BlockDetailSection>
  </BlockDetailPage>;
}
