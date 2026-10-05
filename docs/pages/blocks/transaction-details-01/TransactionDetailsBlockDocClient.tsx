"use client";

import { useTranslations } from "next-intl";
import type { PreviewCode } from "@docs/lib/preview-source";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { TransactionDetailsDemo } from "@docs/components/blocks/TransactionDetailsDemo";

export function TransactionDetailsBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("transactionDetailsBlock");
  return <BlockDetailPage code={code} slug="transaction-details-01" title={t("title")} description={t("description")} preview={<TransactionDetailsDemo />}>
    <BlockDetailSection title={t("composition")}><p className="text-body text-fg-muted">{t("compositionBody")}</p></BlockDetailSection>
    <BlockDetailSection title={t("dataContract")}><p className="text-body text-fg-muted">{t("dataContractBody")}</p></BlockDetailSection>
    <BlockDetailSection title={t("behavior")}><p className="text-body text-fg-muted">{t("behaviorBody")}</p></BlockDetailSection>
  </BlockDetailPage>;
}
