"use client";

import { useMemo, useState } from "react";
import { DataStateDemoControls, useDataStateDemo } from "@docs/components/blocks/DataStateDemoControls";
import { AiGatewayOverview, createAiGatewayOverviewDemoData, type AiGatewayOverviewRange } from "@zeron/blocks/ai-gateway-overview-01";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@zeron/ui/dialog";

export function AiGatewayOverviewDemo() {
  const [range, setRange] = useState<AiGatewayOverviewRange>("30d");
  const demo = useDataStateDemo();
  const [providerId, setProviderId] = useState<string | null>(null);
  const data = useMemo(() => {
    const next = createAiGatewayOverviewDemoData(range);
    return {
      ...next,
      window: {
        ...next.window,
        generatedAt: new Date(Date.parse(next.window.generatedAt) + demo.revision * 1000).toISOString(),
      },
    };
  }, [range, demo.revision]);

  return <div className="flex h-full min-h-0 flex-col">
    <DataStateDemoControls value={demo.scenario} onChange={demo.changeScenario} failNextRefresh={demo.failNextRefresh} onFailNextRefreshChange={demo.setFailNextRefresh} />
    <AiGatewayOverview className="min-h-0 flex-1"
      actions={{ onRangeChange: setRange, onRefresh: demo.refresh, onRetry: demo.recover, onProviderSelect: setProviderId }}
      status={demo.loading ? "loading" : demo.failed ? "error" : demo.refreshing ? "refreshing" : "ready"}
      stale={demo.stale} data={demo.empty || demo.loading || (demo.failed && !demo.retainData) ? null : data}
      range={range} />
    <Dialog open={providerId !== null} onOpenChange={(open) => { if (!open) setProviderId(null); }}><DialogContent><DialogHeader><DialogTitle>{data.providers.find((provider) => provider.id === providerId)?.name ?? providerId}</DialogTitle><DialogDescription>示例提供商详情 · 当前窗口 {range}</DialogDescription></DialogHeader></DialogContent></Dialog>
  </div>;
}
