"use client";

import { useMemo, useState } from "react";
import {
  AiGatewaySessionList,
  aiGatewaySessionListDemoQuery,
  createAiGatewaySessionListDemoData,
  type AiGatewaySessionListQuery,
} from "@zeron/blocks/ai-gateway-session-list-01";
import {
  BlockDetailPage,
  BlockDetailSection,
} from "@docs/components/blocks/BlockDetailPage";
import { useTranslations } from "next-intl";

export function AiGatewaySessionListBlockDocClient({ code }: { code: string }) {
  const t = useTranslations("aiGatewaySessionListBlock");
  const [query, setQuery] = useState<AiGatewaySessionListQuery>(() => ({
    ...aiGatewaySessionListDemoQuery,
  }));
  const data = useMemo(() => createAiGatewaySessionListDemoData(query), [query]);

  return (
    <BlockDetailPage
      code={code}
      description={t("description")}
      slug="ai-gateway-session-list-01"
      title={t("title")}
      preview={
        <div className="h-[48rem] min-h-0 bg-surface-base">
          <AiGatewaySessionList
            actions={{ onQueryChange: setQuery }}
            className="h-full min-h-0"
            data={data}
            now={data.generatedAt}
            query={query}
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
