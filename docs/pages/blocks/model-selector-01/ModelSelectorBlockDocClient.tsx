"use client";

import { useTranslations } from "next-intl";
import type { PreviewCode } from "@docs/lib/preview-source";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { ModelSelectorDemo } from "@docs/components/blocks/ModelSelectorDemo";

export function ModelSelectorBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("modelSelectorBlock");
  return (
    <BlockDetailPage code={code} slug="model-selector-01" title={t("title")} description={t("description")} preview={<ModelSelectorDemo />}>
      <BlockDetailSection title={t("composition")}><p className="text-body text-fg-muted">{t("compositionBody")}</p></BlockDetailSection>
      <BlockDetailSection title={t("dataContract")}><p className="text-body text-fg-muted">{t("dataContractBody")}</p></BlockDetailSection>
      <BlockDetailSection title={t("behavior")}><p className="text-body text-fg-muted">{t("behaviorBody")}</p></BlockDetailSection>
    </BlockDetailPage>
  );
}
