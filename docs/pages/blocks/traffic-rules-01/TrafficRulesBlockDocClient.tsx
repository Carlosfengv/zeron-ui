"use client";

import { TrafficRules } from "@zeron/blocks/traffic-rules-01";
import { BlockDetailPage, BlockDetailSection } from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

export function TrafficRulesBlockDocClient({ code }: { code: string }) {
  const t = useTranslations("trafficRulesBlock");
  return <BlockDetailPage code={code} description={t("description")} registryName="traffic-rules-01" slug="traffic-rules-01" title={t("title")} preview={<TrafficRules className="h-full min-h-0" />}>
    <BlockDetailSection title={t("interactionTitle")}><p className="text-body text-fg-muted">{t("interactionBody")}</p></BlockDetailSection>
    <BlockDetailSection title={t("guidanceTitle")}><p className="text-body text-fg-muted">{t("guidanceBody")}</p></BlockDetailSection>
  </BlockDetailPage>;
}
