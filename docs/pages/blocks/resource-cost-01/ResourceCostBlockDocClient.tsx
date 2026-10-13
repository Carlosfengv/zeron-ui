"use client";

import { useTranslations } from "next-intl";
import type { PreviewCode } from "@docs/lib/preview-source";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { ResourceCostDemo } from "@docs/components/blocks/ResourceCostDemo";

export function ResourceCostBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("resourceCostBlock");
  return <BlockDetailPage code={code} slug="resource-cost-01" title={t("title")} description={t("description")} preview={<ResourceCostDemo />}>
    {(["composition", "hierarchy", "integration"] as const).map((section) => <BlockDetailSection key={section} title={t(section)}><p className="text-body text-fg-muted">{t(`${section}Body`)}</p></BlockDetailSection>)}
  </BlockDetailPage>;
}
