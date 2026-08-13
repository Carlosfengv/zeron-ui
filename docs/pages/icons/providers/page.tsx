"use client";

import { DocPage, DocSection } from "@docs/components/content/DocPage";
import { useIconContext } from "@zeron/icons/context";
import { useTranslations } from "next-intl";

export default function IconProvidersPage() {
  const t = useTranslations();
  const { availableVariants, variant } = useIconContext();

  return (
    <DocPage title={t("title")} slug="providers" description={t("description")} collection="icons" showInstall={false}>
      <DocSection title={t("freeTitle")}>
        <p className="text-body text-fg-muted">{t("freeDescription")}</p>
      </DocSection>
      <DocSection title={t("proTitle")}>
        <p className="text-body text-fg-muted">{t("proDescription")}</p>
        <p className="text-label text-fg-subtle">Active: {variant}; available: {availableVariants.join(", ")}</p>
      </DocSection>
    </DocPage>
  );
}
