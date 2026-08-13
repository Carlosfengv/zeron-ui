"use client";

import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { useIcon } from "@zeron/icons/context";
import { useTranslations } from "next-intl";

export default function IconsOverviewPage() {
  const t = useTranslations();
  const Palette = useIcon("palette");

  return (
    <DocPage title={t("title")} slug="overview" description={t("description")} collection="icons" showInstall={false}>
      <DocSection title={t("modelTitle")}>
        <div className="flex items-start gap-3 rounded-lg border border-border p-4">
          <Palette className="mt-0.5 shrink-0 text-brand" size={20} />
          <p className="text-body text-fg-muted">{t("modelDescription")}</p>
        </div>
      </DocSection>
    </DocPage>
  );
}
