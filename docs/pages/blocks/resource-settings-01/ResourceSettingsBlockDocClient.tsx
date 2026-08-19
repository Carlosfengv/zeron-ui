"use client";

import { ResourceSettings } from "@zeron/blocks/resource-settings-01";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

export function ResourceSettingsBlockDocClient({ code }: { code: string }) {
  const t = useTranslations("resourceSettingsBlock");
  return <BlockDetailPage code={code} description={t("description")} registryName="resource-settings-01" slug="resource-settings-01" title={t("title")} preview={<ResourceSettings />}>
    <BlockDetailSection title={t("navigationTitle")}><p className="text-body text-fg-muted">{t("navigationBody")}</p></BlockDetailSection>
  </BlockDetailPage>;
}
