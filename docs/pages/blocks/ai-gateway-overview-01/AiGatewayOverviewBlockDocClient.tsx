"use client";

import { useMemo, useState } from "react";
import {
  AiGatewayOverview,
  createAiGatewayOverviewDemoData,
  type AiGatewayOverviewRange,
} from "@zeron/blocks/ai-gateway-overview-01";
import {
  BlockDetailPage,
  BlockDetailSection,
} from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

export function AiGatewayOverviewBlockDocClient({ code }: { code: string }) {
  const t = useTranslations("aiGatewayOverviewBlock");
  const [range, setRange] = useState<AiGatewayOverviewRange>("30d");
  const [refreshCount, setRefreshCount] = useState(0);
  const data = useMemo(() => {
    const next = createAiGatewayOverviewDemoData(range);
    return {
      ...next,
      window: {
        ...next.window,
        generatedAt: new Date(Date.parse(next.window.generatedAt) + refreshCount * 1000).toISOString(),
      },
    };
  }, [range, refreshCount]);

  return (
    <BlockDetailPage
      code={code}
      description={t("description")}
      slug="ai-gateway-overview-01"
      title={t("title")}
      preview={
        <div className="h-[1000px] min-h-0 bg-surface-base">
          <AiGatewayOverview
            actions={{
              onRangeChange: setRange,
              onRefresh: () => setRefreshCount((value) => value + 1),
            }}
            data={data}
            range={range}
          />
        </div>
      }
    >
      <BlockDetailSection title={t("composition")}>
        <p className="text-body text-fg-muted">{t("compositionBody")}</p>
      </BlockDetailSection>
      <BlockDetailSection title={t("dataContract")}>
        <p className="text-body text-fg-muted">{t("dataContractBody")}</p>
      </BlockDetailSection>
      <BlockDetailSection title={t("states")}>
        <p className="text-body text-fg-muted">{t("statesBody")}</p>
      </BlockDetailSection>
    </BlockDetailPage>
  );
}
