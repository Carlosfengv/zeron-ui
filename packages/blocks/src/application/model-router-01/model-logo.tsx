"use client";

import ClaudeColor from "@lobehub/icons/es/Claude/components/Color";
import OpenAIMono from "@lobehub/icons/es/OpenAI/components/Mono";
import QwenColor from "@lobehub/icons/es/Qwen/components/Color";
import { useIcon } from "@zeron/ui/system/icon-context";
import type { ModelRouterRoute } from "./model-router-types";

const logos = { claude: ClaudeColor, openai: OpenAIMono, qwen: QwenColor };

export function ModelLogo({ route }: { route?: ModelRouterRoute }) {
  const GenericModel = useIcon("brain");
  const provider = route?.provider.toLowerCase();
  const brand = route?.brand ?? (provider === "anthropic" ? "claude" : provider === "openai" ? "openai" : undefined);
  const Logo = brand ? logos[brand] : GenericModel;

  return (
    <span aria-hidden="true" data-slot="router-model-logo" data-brand={brand ?? "custom"} className="flex size-4 shrink-0 items-center justify-center text-fg-default [&>svg]:size-4 [&>img]:size-4">
      {route?.logo ?? <Logo size={16} />}
    </span>
  );
}
