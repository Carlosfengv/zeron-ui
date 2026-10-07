"use client";

import { DesignStack, designStackDemoItems, useDesignStackHistory } from "@zeron/blocks/design-stack-01";

export function DesignStackDemo() {
  const { items, onItemsChange, history } = useDesignStackHistory(designStackDemoItems);
  return <div className="flex h-full min-h-0 w-full flex-col overflow-auto bg-surface-base p-4 sm:p-8">
    <DesignStack items={items} onItemsChange={onItemsChange} history={history} className="m-auto shrink-0" />
  </div>;
}
