"use client";

import { useMemo, useState } from "react";
import { AiGatewayOverview, createAiGatewayOverviewDemoData, type AiGatewayOverviewRange } from "@zeron/blocks/ai-gateway-overview-01";

export function AiGatewayOverviewDemo() {
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

  return <AiGatewayOverview actions={{ onRangeChange: setRange, onRefresh: () => setRefreshCount((value) => value + 1) }} data={data} range={range} />;
}
