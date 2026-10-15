"use client";

import { useTranslations } from "next-intl";
import type { PreviewCode } from "@docs/lib/preview-source";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { UsageForecastDemo } from "@docs/components/blocks/UsageForecastDemo";

export function UsageForecastBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("usageForecastBlock");
  return <BlockDetailPage code={code} slug="usage-forecast-01" title={t("title")} description={t("description")} preview={<UsageForecastDemo />}>
    {(["composition", "interaction", "integration"] as const).map((section) => <BlockDetailSection key={section} title={t(section)}><p className="text-body text-fg-muted">{t(`${section}Body`)}</p></BlockDetailSection>)}
  </BlockDetailPage>;
}
