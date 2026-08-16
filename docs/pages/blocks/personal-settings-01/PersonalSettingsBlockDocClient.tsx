"use client";

import { PersonalSettings } from "@zeron/blocks/personal-settings-01";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

export function PersonalSettingsBlockDocClient({ code }: { code: string }) {
  const t = useTranslations("personalSettingsBlock");
  return <BlockDetailPage code={code} description={t("description")} previewMinHeightClass="min-h-[48rem]" registryName="personal-settings-01" slug="personal-settings-01" title={t("title")} preview={<PersonalSettings />}>
    <BlockDetailSection title={t("interactionTitle")}><p className="text-body text-fg-muted">{t("interactionBody")}</p></BlockDetailSection>
    <BlockDetailSection title={t("guidanceTitle")}><p className="text-body text-fg-muted">{t("guidanceBody")}</p></BlockDetailSection>
    <BlockDetailSection title={t("dataBoundaryTitle")}><p className="text-body text-fg-muted">{t("dataBoundaryBody")}</p></BlockDetailSection>
  </BlockDetailPage>;
}
