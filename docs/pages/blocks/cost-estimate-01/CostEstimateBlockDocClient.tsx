"use client";
import { useTranslations } from "next-intl";
import type { PreviewCode } from "@docs/lib/preview-source";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { CostEstimateDemo } from "@docs/components/blocks/CostEstimateDemo";
export function CostEstimateBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("costEstimateBlock");
  return <BlockDetailPage code={code} slug="cost-estimate-01" title={t("title")} description={t("description")} preview={<CostEstimateDemo />}>
    {(["composition", "calculation", "behavior"] as const).map((section) => <BlockDetailSection key={section} title={t(section)}><p className="text-body text-fg-muted">{t(`${section}Body`)}</p></BlockDetailSection>)}
  </BlockDetailPage>;
}
