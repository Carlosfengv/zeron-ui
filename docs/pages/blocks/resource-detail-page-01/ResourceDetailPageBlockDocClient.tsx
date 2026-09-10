"use client";

import {
  defaultResourceDetailPageData,
  ResourceDetailPage,
} from "@zeron/blocks/resource-detail-page-01";
import {
  BlockDetailPage,
  BlockDetailSection,
} from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

export function ResourceDetailPageBlockDocClient({ code }: { code: string }) {
  const t = useTranslations("resourceDetailPageBlock");

  return (
    <BlockDetailPage
      code={code}
      description={t("description")}
      preview={
        <ResourceDetailPage
          className="h-full min-h-0"
          data={defaultResourceDetailPageData}
        />
      }
      slug="resource-detail-page-01"
      title={t("title")}
    >
      <BlockDetailSection title={t("guidance")}>
        <p className="text-body text-fg-muted">
          {t("guidanceBody")}
        </p>
      </BlockDetailSection>
    </BlockDetailPage>
  );
}
