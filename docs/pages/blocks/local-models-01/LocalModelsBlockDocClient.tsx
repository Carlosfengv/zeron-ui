"use client";
import { useTranslations } from "next-intl";
import type { PreviewCode } from "@docs/lib/preview-source";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { LocalModelsDemo } from "@docs/components/blocks/LocalModelsDemo";
export function LocalModelsBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("localModelsBlock");
  return <BlockDetailPage code={code} slug="local-models-01" title={t("title")} description={t("description")} preview={<LocalModelsDemo />}>
    {(["composition", "dataContract", "states"] as const).map((section) => <BlockDetailSection key={section} title={t(section)}><p className="text-body text-fg-muted">{t(`${section}Body`)}</p></BlockDetailSection>)}
  </BlockDetailPage>;
}
