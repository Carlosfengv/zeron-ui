"use client";

import type { PreviewCode } from "@docs/lib/preview-source";
import { InspectionReportListDemo as InspectionReportList } from "@docs/components/blocks/OperationsWorkspaceDemos";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

export function InspectionReportListBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("inspectionReportListBlock");
  return <BlockDetailPage code={code} description={t("description")} slug="inspection-report-list-01" title={t("title")} preview={<InspectionReportList className="h-full min-h-0" />}><BlockDetailSection title={t("guidance")}><p className="text-body text-fg-muted">{t("guidanceBody")}</p></BlockDetailSection></BlockDetailPage>;
}
