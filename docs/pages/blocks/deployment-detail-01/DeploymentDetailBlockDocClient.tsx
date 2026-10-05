"use client";

import { useTranslations } from "next-intl";
import type { PreviewCode } from "@docs/lib/preview-source";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { DeploymentDetailDemo } from "@docs/components/blocks/DeploymentDetailDemo";

export function DeploymentDetailBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("deploymentDetailBlock");
  return <BlockDetailPage code={code} slug="deployment-detail-01" title={t("title")} description={t("description")} preview={<DeploymentDetailDemo />}>
    <BlockDetailSection title={t("composition")}><p className="text-body text-fg-muted">{t("compositionBody")}</p></BlockDetailSection>
    <BlockDetailSection title={t("dataContract")}><p className="text-body text-fg-muted">{t("dataContractBody")}</p></BlockDetailSection>
    <BlockDetailSection title={t("behavior")}><p className="text-body text-fg-muted">{t("behaviorBody")}</p></BlockDetailSection>
  </BlockDetailPage>;
}
