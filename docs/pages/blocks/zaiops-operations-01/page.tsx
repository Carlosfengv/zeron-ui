"use client";

import { useTranslations } from "next-intl";
import { ZaiopsOperationsDemo } from "@docs/components/blocks/AccountBlocksDemo";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";

const code = `<ZaiopsOperations account={{ user, theme, onThemeChange, locale, localeOptions, onLocaleChange, onSignOut, extraSections: [{ items: [{ id: "notifications", label: "通知", closeOnClick: false }, { id: "settings", label: "个人设置", closeOnClick: false }] }] }} />`;

export default function ZaiopsOperationsBlockDoc() {
  const t = useTranslations("zaiopsOperationsBlock");
  return (
    <BlockDetailPage
      code={code}
      description={t("description")}
      slug="zaiops-operations-01"
      title={t("title")}
      preview={<ZaiopsOperationsDemo />}
    >
      <BlockDetailSection title={t("guidance")}>
        <p className="text-body text-fg-muted">{t("guidanceBody")}</p>
      </BlockDetailSection>
    </BlockDetailPage>
  );
}
