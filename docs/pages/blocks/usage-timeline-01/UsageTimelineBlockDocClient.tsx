"use client";

import { useTranslations } from "next-intl";
import type { PreviewCode } from "@docs/lib/preview-source";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { UsageTimelineDemo } from "@docs/components/blocks/UsageTimelineDemo";

export function UsageTimelineBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("usageTimelineBlock");
  return <BlockDetailPage slug="usage-timeline-01" title={t("title")} description={t("description")} code={code} preview={<UsageTimelineDemo />}>
    {(["composition", "interaction", "integration"] as const).map((section) => <BlockDetailSection key={section} title={t(section)}><p className="text-body text-fg-muted">{t(`${section}Body`)}</p></BlockDetailSection>)}
  </BlockDetailPage>;
}
