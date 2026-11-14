"use client";

import { useTranslations } from "next-intl";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { FallbackChainDemo } from "@docs/components/blocks/FallbackChainDemo";
import type { PreviewCode } from "@docs/lib/preview-source";

export function FallbackChainBlockDocClient({ code }: { code: PreviewCode }) {
  const t = useTranslations("fallbackChainBlock");
  return <BlockDetailPage slug="fallback-chain-01" title={t("title")} description={t("description")}
    code={code} preview={<FallbackChainDemo />}>
    <BlockDetailSection title={t("dataContract")}>
      <p className="text-body text-fg-muted">{t("dataContractBody")}</p>
    </BlockDetailSection>
    <BlockDetailSection title={t("interaction")}>
      <p className="text-body text-fg-muted">{t("interactionBody")}</p>
    </BlockDetailSection>
  </BlockDetailPage>;
}
