"use client";

import { useTranslations } from "next-intl";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { SectionedDataTableDemo } from "@docs/components/blocks/SectionedDataTableDemo";
import { PropsTable } from "@docs/components/content/PropsTable";
import type { PreviewCode } from "@docs/lib/preview-source";

export function SectionedDataTableBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("sectionedDataTableBlock");
  return <BlockDetailPage code={code} slug="grouped-data-table-02" title={t("title")} description={t("description")} preview={<SectionedDataTableDemo />}>
    {(["composition", "behavior", "integration"] as const).map((section) => <BlockDetailSection key={section} title={t(section)}><p className="text-body text-fg-muted">{t(`${section}Body`)}</p></BlockDetailSection>)}
    <BlockDetailSection title={t("api")}><PropsTable props={[
      { name: "data / columns / getRowId", type: "TData[] / ColumnDef<TData>[] / (item) => string", description: t("dataApi") },
      { name: "dimensions", type: "readonly [SectionedDataTableDimension, ...SectionedDataTableDimension[]]", description: t("groupsApi") },
      { name: "groupBy / defaultGroupBy / onGroupByChange", type: "string / string / (columnId) => void", description: t("expandedApi") },
      { name: "previewRowCount", type: "number", default: "3", description: t("previewApi") },
      { name: "onAddToGroup", type: "({ columnId, value }) => void", description: t("addApi") },
      { name: "title / description / actions / renderStats", type: "ReactNode / (context) => ReactNode", description: t("headerApi") },
      { name: "renderFilters / renderSummary", type: "(table) => ReactNode / (context) => ReactNode", description: t("slotsApi") },
      { name: "activeRowId / onRowActivate", type: "string / (item: TData) => void", description: t("activationApi") },
      { name: "state / errorMessage / onRetry", type: '"ready" | "loading" | "error" / ReactNode / () => void', description: t("stateApi") },
      { name: "labels", type: "Partial<SectionedDataTableLabels>", description: t("labelsApi") },
    ]} /></BlockDetailSection>
  </BlockDetailPage>;
}
