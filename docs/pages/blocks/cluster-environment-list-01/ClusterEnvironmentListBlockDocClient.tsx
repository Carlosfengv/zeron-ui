"use client";

import type { PreviewCode } from "@docs/lib/preview-source";
import { ClusterEnvironmentListDemo } from "@docs/components/blocks/OperationsListDemos";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

export function ClusterEnvironmentListBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("clusterEnvironmentListBlock");

  return (
    <BlockDetailPage
      code={code}
      description={t("description")}
      slug="cluster-environment-list-01"
      title={t("title")}
      preview={<ClusterEnvironmentListDemo />}
    >
      <BlockDetailSection title={t("guidance")}>
        <p className="text-body text-fg-muted">{t("guidanceBody")}</p>
      </BlockDetailSection>
    </BlockDetailPage>
  );
}
