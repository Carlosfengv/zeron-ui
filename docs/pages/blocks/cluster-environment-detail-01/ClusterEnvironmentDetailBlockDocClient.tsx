"use client";

import { ClusterEnvironmentDetail } from "@zeron/blocks/cluster-environment-detail-01";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

export function ClusterEnvironmentDetailBlockDocClient({ code }: { code: string }) {
  const t = useTranslations("clusterEnvironmentDetailBlock");
  return <BlockDetailPage code={code} description={t("description")} slug="cluster-environment-detail-01" title={t("title")} preview={<div className="h-[42rem] overflow-hidden"><ClusterEnvironmentDetail className="h-full" /></div>}><BlockDetailSection title={t("guidance")}><p className="text-body text-fg-muted">{t("guidanceBody")}</p></BlockDetailSection></BlockDetailPage>;
}
