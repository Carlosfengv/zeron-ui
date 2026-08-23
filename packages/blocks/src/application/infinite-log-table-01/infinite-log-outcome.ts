import type { BadgeColorInput } from "@zeron/ui/badge";
import type { HttpLogOutcome } from "./infinite-log-types";

interface InfiniteLogOutcomeVisual {
  badgeColor: BadgeColorInput;
  chartColor: string;
  markerClassName: string;
}

export const infiniteLogOutcomeVisuals = {
  success: {
    badgeColor: {
      base: "var(--brand)",
      onSoft: "var(--fg-brand)",
      onStrong: "var(--fg-on-brand)",
      softBackground: "color-mix(in oklab, var(--brand) 14%, transparent)",
    },
    chartColor: "var(--brand)",
    markerClassName: "bg-brand",
  },
  warning: {
    badgeColor: "yellow",
    chartColor: "var(--warning-border)",
    markerClassName: "bg-warning-border",
  },
  error: {
    badgeColor: "red",
    chartColor: "var(--danger-border)",
    markerClassName: "bg-destructive",
  },
} satisfies Record<HttpLogOutcome, InfiniteLogOutcomeVisual>;
