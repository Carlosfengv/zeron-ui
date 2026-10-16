"use client";

import { useTranslations } from "next-intl";
import type { PreviewCode } from "@docs/lib/preview-source";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { AppearanceSettingsDemo } from "@docs/components/blocks/AppearanceSettingsDemo";

export function AppearanceSettingsBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("appearanceSettingsBlock");
  return <BlockDetailPage code={code} slug="appearance-settings-01" title={t("title")} description={t("description")} preview={<AppearanceSettingsDemo />}>
    <BlockDetailSection title={t("composition")}><p className="text-body text-fg-muted">{t("compositionBody")}</p></BlockDetailSection>
    <BlockDetailSection title={t("behavior")}><p className="text-body text-fg-muted">{t("behaviorBody")}</p></BlockDetailSection>
  </BlockDetailPage>;
}
