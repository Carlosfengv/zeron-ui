"use client";

import { useTranslations } from "next-intl";
import { ZaiopsOperations } from "@zeron/blocks/zaiops-operations-01";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";

const code = `<ZaiopsOperations />`;

export default function ZaiopsOperationsBlockDoc() {
  const t = useTranslations("zaiopsOperationsBlock");
  return (
    <BlockDetailPage
      code={code}
      description={t("description")}
      slug="zaiops-operations-01"
      title={t("title")}
      preview={<ZaiopsOperations />}
    >
      <BlockDetailSection title={t("guidance")}>
        <p className="text-body text-fg-muted">{t("guidanceBody")}</p>
      </BlockDetailSection>
    </BlockDetailPage>
  );
}
