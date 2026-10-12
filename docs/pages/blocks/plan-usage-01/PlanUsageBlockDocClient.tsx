"use client";

import { useTranslations } from "next-intl";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { PlanUsageDemo } from "@docs/components/blocks/PlanUsageDemo";
import type { PreviewCode } from "@docs/lib/preview-source";

export function PlanUsageBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("planUsageBlock");
  return <BlockDetailPage slug="plan-usage-01" title={t("title")} description={t("description")} code={code} preview={<PlanUsageDemo />}>
    {(["composition", "data", "behavior"] as const).map((section) => <BlockDetailSection key={section} title={t(section)}>
      <p className="text-body text-fg-muted">{t(`${section}Body`)}</p>
    </BlockDetailSection>)}
  </BlockDetailPage>;
}
