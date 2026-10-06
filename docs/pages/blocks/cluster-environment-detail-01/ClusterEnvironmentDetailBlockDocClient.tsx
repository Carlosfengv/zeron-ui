"use client";

import type { PreviewCode } from "@docs/lib/preview-source";
import { ClusterEnvironmentDetailDemo as ClusterEnvironmentDetail } from "@docs/components/blocks/OperationsWorkspaceDemos";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

export function ClusterEnvironmentDetailBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("clusterEnvironmentDetailBlock");
  return <BlockDetailPage code={code} description={t("description")} slug="cluster-environment-detail-01" title={t("title")} preview={<div className="h-[42rem] overflow-hidden"><ClusterEnvironmentDetail className="h-full" /></div>}><BlockDetailSection title={t("guidance")}><p className="text-body text-fg-muted">{t("guidanceBody")}</p></BlockDetailSection></BlockDetailPage>;
}
