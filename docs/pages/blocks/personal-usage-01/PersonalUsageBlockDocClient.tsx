"use client";

import { PersonalUsage } from "@zeron/blocks/personal-usage-01";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

export function PersonalUsageBlockDocClient({ code }: { code: string }) {
  const t = useTranslations("personalUsageBlock");
  return <BlockDetailPage code={code} description={t("description")} registryName="personal-usage-01" slug="personal-usage-01" title={t("title")} preview={<PersonalUsage />}>
    <BlockDetailSection title={t("navigationTitle")}><p className="text-body text-fg-muted">{t("navigationBody")}</p></BlockDetailSection>
  </BlockDetailPage>;
}
