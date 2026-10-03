"use client";

import { DeferredDetailDemo } from "@docs/components/content/DeferredDetailDemo";

const loadDemo = () => import("./AiGatewayOverviewDemo").then((module) => module.AiGatewayOverviewDemo);

export function AiGatewayOverviewBlockDocClient() {
  return <div className="h-[1000px] min-h-0 bg-surface-base"><DeferredDetailDemo loader={loadDemo} demoProps={{}} minHeight={1000} fillHeight /></div>;
}
