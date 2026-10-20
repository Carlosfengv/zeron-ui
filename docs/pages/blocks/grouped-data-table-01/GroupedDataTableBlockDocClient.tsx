"use client";

import { useTranslations } from "next-intl";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { GroupedDataTableDemo } from "@docs/components/blocks/GroupedDataTableDemo";
import { PropsTable } from "@docs/components/content/PropsTable";
import type { PreviewCode } from "@docs/lib/preview-source";

export function GroupedDataTableBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("groupedDataTableBlock");
  return <BlockDetailPage code={code} slug="grouped-data-table-01" title={t("title")} description={t("description")} preview={<GroupedDataTableDemo />}>
    {(["composition", "behavior", "integration"] as const).map((section) => <BlockDetailSection key={section} title={t(section)}><p className="text-body text-fg-muted">{t(`${section}Body`)}</p></BlockDetailSection>)}
    <BlockDetailSection title={t("api")}><PropsTable props={[
      { name: "data / columns / getRowId", type: "TData[] / ColumnDef<TData>[] / (item) => string", description: t("dataApi") },
      { name: "groupBy / groups", type: "string / GroupedDataTableGroup[]", description: t("groupsApi") },
      { name: "previewRowCount", type: "number", default: "3", description: t("previewApi") },
      { name: "expanded / defaultExpanded / onExpandedChange", type: "ExpandedState / OnChangeFn<ExpandedState>", description: t("expandedApi") },
      { name: "title / description / actions", type: "ReactNode", description: t("headerApi") },
      { name: "renderFilters / renderSummary", type: "(table) => ReactNode / (context) => ReactNode", description: t("slotsApi") },
      { name: "activeRowId / onRowActivate", type: "string / (item: TData) => void", description: t("activationApi") },
      { name: "state / errorMessage / onRetry", type: '"ready" | "loading" | "error" / ReactNode / () => void', description: t("stateApi") },
      { name: "labels", type: "Partial<GroupedDataTableLabels>", description: t("labelsApi") },
    ]} /></BlockDetailSection>
  </BlockDetailPage>;
}
