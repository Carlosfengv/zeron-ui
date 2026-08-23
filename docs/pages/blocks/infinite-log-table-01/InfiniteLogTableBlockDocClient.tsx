"use client";

import { InfiniteLogTable } from "@zeron/blocks/infinite-log-table-01";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

export function InfiniteLogTableBlockDocClient({ code }: { code: string }) {
  const t = useTranslations("infiniteLogTableBlock");
  return (
    <BlockDetailPage
      code={code}
      description={t("description")}
      slug="infinite-log-table-01"
      title={t("title")}
      preview={<div className="h-[46rem] min-h-0 overflow-hidden bg-surface-raised"><InfiniteLogTable className="h-full border-0" /></div>}
    >
      <BlockDetailSection title={t("integrationTitle")}>
        <p className="text-body text-fg-muted">{t("integrationBody")}</p>
      </BlockDetailSection>
      <BlockDetailSection title={t("dataSourceTitle")}>
        <p className="text-body text-fg-muted">{t("dataSourceBody")}</p>
      </BlockDetailSection>
      <BlockDetailSection title={t("registryBoundaryTitle")}>
        <p className="text-body text-fg-muted">{t("registryBoundaryBody")}</p>
      </BlockDetailSection>
    </BlockDetailPage>
  );
}
