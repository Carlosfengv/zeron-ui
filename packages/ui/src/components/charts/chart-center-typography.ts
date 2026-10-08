/**
 * Fluid typography for pie / ring / gauge center labels.
 *
 * Uses CSS container query units (`cqw`) so values scale with the center
 * hole — not the viewport — which keeps stat text readable on small charts.
 */
export const chartCenterContainerClassName =
  "@container/chart-center size-full min-w-0";

/** Primary stat — 22% of center width, clamped between 12px and 30px. */
export const chartCenterValueClassName =
  "font-bold tabular-nums leading-none";
export const chartCenterValueStyle = { fontSize: "clamp(0.75rem,22cqw,1.875rem)" };

/** Supporting label — ~9% of center width, clamped between 10px and text-label. */
export const chartCenterLabelClassName =
  "max-w-full truncate leading-tight";
export const chartCenterLabelStyle = { fontSize: "clamp(0.625rem,9cqw,0.75rem)" };
