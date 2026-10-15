"use client";

import { useTranslations } from "next-intl";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { AccountActivityDemo } from "@docs/components/blocks/AccountActivityDemo";
import type { PreviewCode } from "@docs/lib/preview-source";

export function AccountActivityBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("accountActivityBlock");
  return <BlockDetailPage slug="account-activity-01" title={t("title")} description={t("description")} code={code} preview={<AccountActivityDemo />}>
    {(["composition", "data", "behavior"] as const).map((section) => <BlockDetailSection key={section} title={t(section)}><p className="text-body text-fg-muted">{t(`${section}Body`)}</p></BlockDetailSection>)}
  </BlockDetailPage>;
}
