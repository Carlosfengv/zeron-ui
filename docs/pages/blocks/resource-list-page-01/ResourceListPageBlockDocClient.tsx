"use client";

import { ResourceListPage } from "@zeron/blocks/resource-list-page-01";
import { defaultResourceListItems } from "@zeron/blocks/resource-list-table-01";
import {
  BlockDetailPage,
  BlockDetailSection,
} from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

export function ResourceListPageBlockDocClient({ code }: { code: string }) {
  const t = useTranslations("resourceListPageBlock");

  return (
    <BlockDetailPage
      code={code}
      description={t("description")}
      preview={
        <ResourceListPage
          className="h-full min-h-0"
          resources={defaultResourceListItems}
        />
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
