"use client";

import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { useIcon } from "@zeron/icons/context";
import { useTranslations } from "next-intl";

export default function IconUsagePage() {
  const t = useTranslations();
  const Search = useIcon("search");

  return (
    <DocPage title={t("title")} slug="usage" description={t("description")} collection="icons" showInstall={false}>
      <DocSection title={t("exampleTitle")}>
        <div className="flex items-center gap-3 rounded-lg border border-border p-4">
          <Search size={20} className="text-fg-default" />
          <p className="text-body text-fg-muted">{t("exampleDescription")}</p>
        </div>
      </DocSection>
    </DocPage>
  );
}
