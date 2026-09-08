"use client";

import { ModelDetail02 } from "@zeron/blocks/model-detail-02";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { PropsTable, type PropDef } from "@docs/components/content/PropsTable";
import { useTranslations } from "next-intl";

export function ModelDetail02BlockDocClient({ code }: { code: string }) {
  const t = useTranslations("modelAnalyticsDetailBlock");
  const props: PropDef[] = [
    { name: "data", type: "ModelAnalyticsDetailData", description: "Complete model, provider, pricing, performance, benchmark, app, activity, and FAQ data." },
    { name: "defaultSection", type: "SectionId", description: "Initial active local section." },
    { name: "onOpenPlayground", type: "() => void", description: "Handles the playground action." },
    { name: "onProviderSelect", type: "(providerId: string) => void", description: "Handles provider-row selection." },
    { name: "onRequestApiKey", type: "() => void", description: "Handles the API key action." },
    { name: "onNavigate", type: "(href: string) => void", description: "Lets the product layer handle the top navigation." },
  ];

  return (
    <BlockDetailPage
      code={code}
      description={t("description")}
      preview={<ModelDetail02 className="h-full min-h-0" />}
      registryName="model-detail-02"
      slug="model-detail-02"
      title={t("title")}
    >
      <BlockDetailSection title={t("props")}><PropsTable props={props} /></BlockDetailSection>
      <BlockDetailSection title={t("dataBoundary")}><p className="text-body text-fg-muted">{t("dataBoundaryBody")}</p></BlockDetailSection>
      <BlockDetailSection title={t("composition")}><p className="text-body text-fg-muted">{t("compositionBody")}</p></BlockDetailSection>
      <BlockDetailSection title={t("responsive")}><p className="text-body text-fg-muted">{t("responsiveBody")}</p></BlockDetailSection>
    </BlockDetailPage>
  );
}
