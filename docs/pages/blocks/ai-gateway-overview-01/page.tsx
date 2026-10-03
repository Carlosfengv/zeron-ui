import { createTranslator, type AbstractIntlMessages } from "next-intl";
import type { AppLocale } from "@/app/_i18n/routing";
import { loadPageMessages } from "@docs/i18n/content-loaders.generated";
import { getBlockPreviewSource } from "@docs/lib/block-preview-sources.generated";
import { BlockDetailPageServer, BlockDetailSection } from "@docs/components/blocks/BlockDetailPageServer";
import { AiGatewayOverviewBlockDocClient } from "./AiGatewayOverviewBlockDocClient";

export default async function AiGatewayOverviewBlockDoc({ locale }: { locale: AppLocale }) {
  const messages = await loadPageMessages(locale, "blocks/ai-gateway-overview-01");
  const t = createTranslator({ locale, messages: messages as AbstractIntlMessages, namespace: "aiGatewayOverviewBlock" });
  const common = createTranslator({ locale, messages: messages as AbstractIntlMessages, namespace: "common" });
  const preview = createTranslator({ locale, messages: messages as AbstractIntlMessages, namespace: "preview" });
  return (
    <BlockDetailPageServer locale={locale} installationLabel={common("installation")} previewLabel={preview("preview")} preservePreview code={getBlockPreviewSource("ai-gateway-overview-01")} description={t("description")} slug="ai-gateway-overview-01" title={t("title")} preview={<AiGatewayOverviewBlockDocClient />}>
      <BlockDetailSection title={t("composition")}><p className="text-body text-fg-muted">{t("compositionBody")}</p></BlockDetailSection>
      <BlockDetailSection title={t("dataContract")}><p className="text-body text-fg-muted">{t("dataContractBody")}</p></BlockDetailSection>
      <BlockDetailSection title={t("states")}><p className="text-body text-fg-muted">{t("statesBody")}</p></BlockDetailSection>
    </BlockDetailPageServer>
  );
}
