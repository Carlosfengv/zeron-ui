"use client";

import type { PreviewCode } from "@docs/lib/preview-source";
import { ResourceListPage } from "@zeron/blocks/resource-list-page-01";
import {
  BlockDetailPage,
  BlockDetailSection,
} from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

export function ResourceListPageBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("resourceListPageBlock");

  return (
    <BlockDetailPage
      code={code}
      description={t("description")}
      preview={
        <ResourceListPage className="h-full min-h-0" />
      }
      slug="resource-list-page-01"
      title={t("title")}
    >
      <BlockDetailSection title={t("guidance")}>
        <p className="text-body text-fg-muted">{t("guidanceBody")}</p>
      </BlockDetailSection>
    </BlockDetailPage>
  );
}
