"use client";

import type { PreviewCode } from "@docs/lib/preview-source";
import { StorageUsage, storageUsageDemoData } from "@zeron/blocks/storage-usage-01";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

export function StorageUsageBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("storageUsageBlock");

  return (
    <BlockDetailPage
      code={code}
      description={t("description")}
      slug="storage-usage-01"
      title={t("title")}
      preview={
        <div className="flex min-h-full items-center justify-center bg-surface-base p-4 sm:p-8">
          <div className="w-full max-w-4xl">
            <StorageUsage data={storageUsageDemoData} />
          </div>
        </div>
      }
    >
      <BlockDetailSection title={t("composition")}>
        <p className="text-body text-fg-muted">{t("compositionBody")}</p>
      </BlockDetailSection>
      <BlockDetailSection title={t("dataContract")}>
        <p className="text-body text-fg-muted">{t("dataContractBody")}</p>
      </BlockDetailSection>
      <BlockDetailSection title={t("states")}>
        <p className="text-body text-fg-muted">{t("statesBody")}</p>
      </BlockDetailSection>
    </BlockDetailPage>
  );
}
