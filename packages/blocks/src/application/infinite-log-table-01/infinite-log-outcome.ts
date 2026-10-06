import type { BadgeStatus } from "@zeron/ui/badge";
import type { HttpLogOutcome } from "./infinite-log-types";

interface InfiniteLogOutcomeVisual {
  status: BadgeStatus;
  chartColor: string;
  markerClassName: string;
}

export const infiniteLogOutcomeVisuals = {
  success: {
    status: "success",
    chartColor: "var(--fg-success)",
    markerClassName: "bg-fg-success",
  },
  warning: {
    status: "warning",
    chartColor: "var(--fg-warning)",
    markerClassName: "bg-fg-warning",
  },
  error: {
    status: "danger",
    chartColor: "var(--fg-danger)",
    markerClassName: "bg-fg-danger",
  },
} satisfies Record<HttpLogOutcome, InfiniteLogOutcomeVisual>;
