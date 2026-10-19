"use client";

import { useTranslations } from "next-intl";
import type { PreviewCode } from "@docs/lib/preview-source";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { UsageBudgetForecastDemo } from "@docs/components/blocks/UsageBudgetForecastDemo";

export function UsageBudgetForecastBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("usageBudgetForecastBlock");
  return <BlockDetailPage slug="usage-forecast-02" title={t("title")} description={t("description")} code={code} preview={<UsageBudgetForecastDemo />}>
    {(["composition", "interaction", "integration"] as const).map(section => <BlockDetailSection key={section} title={t(section)}><p className="text-body text-fg-muted">{t(`${section}Body`)}</p></BlockDetailSection>)}
  </BlockDetailPage>;
}
