"use client";

import ClaudeColor from "@lobehub/icons/es/Claude/components/Color";
import { ContextWindowCompact as SharedContextWindowCompact } from "@zeron/ui/context-window";
import type { ContextWindowCompactProps } from "./context-window-compact-types";

/** Preserve the block's default provider logo; shared UI accepts a host icon. */
export function ContextWindowCompact(props: ContextWindowCompactProps) {
  const modelIcon = props.modelIcon ?? (/^claude(?:[-\s]|$)/i.test(props.data.session?.model ?? "") ? <ClaudeColor size={16} /> : undefined);
  return <SharedContextWindowCompact {...props} modelIcon={modelIcon} />;
}
