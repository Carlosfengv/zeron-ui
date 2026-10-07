"use client";

import { useTranslations } from "next-intl";
import type { PreviewCode } from "@docs/lib/preview-source";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { DesignStackDemo } from "@docs/components/blocks/DesignStackDemo";

export function DesignStackBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("designStackBlock");
  return <BlockDetailPage code={code} slug="design-stack-01" title={t("title")} description={t("description")} preview={<DesignStackDemo />}>
    <BlockDetailSection title={t("composition")}><p className="text-body text-fg-muted">{t("compositionBody")}</p></BlockDetailSection>
    <BlockDetailSection title={t("behavior")}><p className="text-body text-fg-muted">{t("behaviorBody")}</p></BlockDetailSection>
  </BlockDetailPage>;
}
