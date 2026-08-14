"use client";

import { ResourceStatusAll } from "@zeron/blocks/resource-status-all-01";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

export function ResourceStatusAllBlockDocClient({ code }: { code: string }) {
  const t = useTranslations("resourceStatusAllBlock");

  return (
    <BlockDetailPage
      code={code}
      description={t("description")}
      slug="resource-status-all-01"
      title={t("title")}
      preview={
        <div className="flex min-h-full items-center justify-center bg-surface-base p-4 sm:p-8">
          <ResourceStatusAll />
        </div>
      }
    >
      <BlockDetailSection title={t("guidance")}>
        <p className="text-body text-fg-muted">{t("guidanceBody")}</p>
      </BlockDetailSection>
    </BlockDetailPage>
  );
}
