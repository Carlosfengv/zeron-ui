import baseConfig from "./eslint.config.mjs";
import { createZeronConfig } from "./packages/lint/index.mjs";

const reviewedArbitraryValues = (files, allow, reason) => ({
  name: `zeron/reviewed-arbitrary-values/${reason}`,
  files,
  rules: {
    "shadcn/no-arbitrary-values": ["error", { allow: ["layout", ...allow] }],
  },
});

// Separate migration check: it reports existing design-policy violations
// without changing the repository's established lint gate.
export default [
  ...baseConfig,
  {
    ignores: ["app/test/**"],
  },
  ...createZeronConfig({
    files: ["app/**/*.{ts,tsx}", "docs/pages/**/*.{ts,tsx}", "packages/ui/src/**/*.{ts,tsx}", "packages/blocks/src/**/*.{ts,tsx}"],
    componentFiles: ["packages/ui/src/**/*.{ts,tsx}"],
    paletteFiles: ["packages/ui/src/components/color-picker.tsx", "packages/ui/src/components/badge-colors.ts"],
    componentImports: ["^@zeron/ui(/|$)", "^@/components/ui(/|$)", "^#components/"],
  }),
  reviewedArbitraryValues(
    ["packages/blocks/src/application/agent-message-trace-01/agent-message-trace.tsx"],
    [
      "transition-[background-color,color,opacity]",
      "text-[10px]",
      "shadow-[inset_2px_0_0_var(--brand)]",
    ],
    "trace-visualization",
  ),
  reviewedArbitraryValues(
    ["packages/blocks/src/application/agent-session-detail-01/agent-session-detail.tsx"],
    ["text-[10px]"],
    "session-graph-labels",
  ),
  reviewedArbitraryValues(
    ["packages/blocks/src/application/agent-trace-01/agent-trace.tsx"],
    ["text-[9px]"],
    "provider-glyph",
  ),
  reviewedArbitraryValues(
    ["packages/blocks/src/application/agent-trace-01/reasoning-row.tsx"],
    ["animate-[pulse_2.6s_ease-out_infinite]"],
    "reasoning-pulse",
  ),
  reviewedArbitraryValues(
    ["packages/blocks/src/application/cluster-environment-detail-01/cluster-environment-detail.tsx"],
    ["bg-[linear-gradient(160deg,var(--info-surface)_-80%,var(--surface-floating)_52%)]"],
    "environment-illustration",
  ),
  reviewedArbitraryValues(
    ["packages/blocks/src/application/credit-usage-01/credit-usage.tsx"],
    [
      "transition-[flex-grow]",
      "text-[3.25rem]",
      "leading-[0.9]",
      "tracking-[-0.05em]",
      "sm:text-[3.5rem]",
    ],
    "credit-metric",
  ),
  reviewedArbitraryValues(
    ["packages/blocks/src/application/file-manager-01/file-manager.tsx"],
    ["rounded-[inherit]"],
    "thumbnail-radius",
  ),
  reviewedArbitraryValues(
    ["packages/blocks/src/application/infinite-log-table-01/infinite-log-generic-table-view.tsx"],
    [
      "shadow-[1px_0_0_var(--border-subtle)]",
      "shadow-[inset_2px_0_0_var(--brand)]",
    ],
    "generic-log-sticky-columns",
  ),
  reviewedArbitraryValues(
    ["packages/blocks/src/application/infinite-log-table-01/infinite-log-table-view.tsx"],
    [
      "before:bg-[color-mix(in_oklch,var(--info-surface)_70%,var(--surface-floating))]",
      "bg-[color-mix(in_oklch,var(--info-surface)_50%,var(--surface-floating))]",
      "hover:bg-[color-mix(in_oklch,var(--info-surface)_70%,var(--surface-floating))]",
      "shadow-[1px_0_0_var(--border-subtle)]",
      "shadow-[inset_2px_0_0_var(--brand)]",
    ],
    "log-status-and-sticky-columns",
  ),
  reviewedArbitraryValues(
    ["packages/blocks/src/application/provider-create-form-01/provider-create-form.tsx"],
    ["pb-[max(0.5rem,env(safe-area-inset-bottom))]"],
    "mobile-safe-area",
  ),
  reviewedArbitraryValues(
    ["packages/blocks/src/application/resource-metric-list-01/resource-metric-list.tsx"],
    ["py-[3.5px]"],
    "metric-row-optical-alignment",
  ),
  reviewedArbitraryValues(
    ["packages/blocks/src/application/rule-flow-editor-01/rule-flow-editor.tsx"],
    [
      "transition-[stroke,stroke-width,opacity]",
      "transition-[border-color,box-shadow,opacity]",
    ],
    "flow-editor-transitions",
  ),
  reviewedArbitraryValues(
    ["packages/blocks/src/application/traffic-rules-01/traffic-rules-v2.tsx"],
    [
      "shadow-[inset_0_2px_var(--brand)]",
      "shadow-[inset_0_-2px_var(--brand)]",
    ],
    "traffic-rule-drop-position",
  ),
];
