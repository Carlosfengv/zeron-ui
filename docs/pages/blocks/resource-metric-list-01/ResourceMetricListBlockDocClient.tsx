"use client";

import type { PreviewCode } from "@docs/lib/preview-source";
import { ResourceMetricList } from "@zeron/blocks/resource-metric-list-01";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

export function ResourceMetricListBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("resourceMetricListBlock");

  return (
    <BlockDetailPage
      code={code}
      description={t("description")}
      slug="resource-metric-list-01"
      title={t("title")}
      preview={
        <div className="flex min-h-full items-center justify-center bg-surface-base p-4 sm:p-8">
          <ResourceMetricList />
        </div>
      }
    >
      <BlockDetailSection title={t("guidance")}>
        <p className="text-body text-fg-muted">{t("guidanceBody")}</p>
      </BlockDetailSection>
    </BlockDetailPage>
  );
}
