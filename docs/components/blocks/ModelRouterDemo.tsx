"use client";

import { useState } from "react";
import { ModelRouter, modelRouterDemoData, type ModelRouterData } from "@zeron/blocks/model-router-01";

/** Local deployment simulation; no gateway credentials or remote mutation. */
export function ModelRouterDemo() {
  const [data, setData] = useState<ModelRouterData>(modelRouterDemoData);
  const [feedback, setFeedback] = useState("");
  return (
    <div className="flex h-full min-h-0 overflow-auto bg-surface-base p-3 sm:p-8">
      <div className="m-auto w-full max-w-3xl">
        <ModelRouter data={data} actions={{ onDeploy: async (policy) => {
          await new Promise((resolve) => setTimeout(resolve, 650));
          setData((previous) => ({ ...previous, policy, revision: String(Number(previous.revision) + 1) }));
          setFeedback("Demo policy deployed locally. Traffic metrics remain an illustrative snapshot.");
        } }} />
        <p aria-live="polite" className="mt-3 min-h-5 text-center text-label text-fg-subtle">{feedback || "Interactive demo · simulated traffic"}</p>
      </div>
    </div>
  );
}
