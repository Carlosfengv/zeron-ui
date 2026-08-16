"use client";

import { ClusterEnvironmentList } from "@zeron/blocks/cluster-environment-list-01";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

export function ClusterEnvironmentListBlockDocClient({ code }: { code: string }) {
  const t = useTranslations("clusterEnvironmentListBlock");

  return (
    <BlockDetailPage
      code={code}
      description={t("description")}
      slug="cluster-environment-list-01"
      title={t("title")}
      preview={<ClusterEnvironmentList className="h-full min-h-0" />}
    >
      <BlockDetailSection title={t("guidance")}>
        <p className="text-body text-fg-muted">{t("guidanceBody")}</p>
      </BlockDetailSection>
    </BlockDetailPage>
  );
}
