/**
 * Badge-private categorical palette and component-token mapping.
 *
 * Categorical colours describe classification only. They deliberately do not
 * create global CSS variables or semantic status tokens.
 */
const categoricalPalette = {
  gray: { dot: "#A3A3A3", light: "#E5E5E5", dark: "#525252" },
  red: { dot: "#EF4444", light: "#F8DFDF", dark: "#371E1E" },
  orange: { dot: "#F97316", light: "#FAE6D8", dark: "#392517" },
  amber: { dot: "#F59E0B", light: "#F9ECD6", dark: "#382B15" },
  yellow: { dot: "#EAB308", light: "#F8EFD6", dark: "#372E15" },
  lime: { dot: "#84CC16", light: "#E8F3D8", dark: "#273217" },
  green: { dot: "#22C55E", light: "#DAF2E3", dark: "#193122" },
  emerald: { dot: "#10B981", light: "#D7F0E8", dark: "#162F27" },
  teal: { dot: "#14B8A6", light: "#D8F0ED", dark: "#172F2C" },
  cyan: { dot: "#06B6D4", light: "#D5F0F4", dark: "#142F33" },
  blue: { dot: "#3B82F6", light: "#DDE8F9", dark: "#1C2738" },
  indigo: { dot: "#6366F1", light: "#E3E4F9", dark: "#222338" },
  violet: { dot: "#8B5CF6", light: "#E9E2F9", dark: "#282138" },
  purple: { dot: "#A855F7", light: "#EEE1FA", dark: "#2D2039" },
  fuchsia: { dot: "#D946EF", light: "#F5DFF8", dark: "#341E37" },
  pink: { dot: "#EC4899", light: "#F8DFEB", dark: "#371E2B" },
  rose: { dot: "#F43F5E", light: "#F9DEE3", dark: "#381D22" },
} as const;

export type BadgeColor = keyof typeof categoricalPalette;
export type BadgeStatus = "danger" | "warning" | "info" | "neutral";

export const badgeStatusTokens: Record<BadgeStatus, { foreground: string; background: string; border: string; icon: string }> = {
  danger: { foreground: "var(--fg-danger)", background: "var(--danger-surface)", border: "var(--danger-border)", icon: "var(--fg-danger)" },
  warning: { foreground: "var(--fg-warning)", background: "var(--warning-surface)", border: "var(--warning-border)", icon: "var(--fg-warning)" },
  info: { foreground: "var(--fg-info)", background: "var(--info-surface)", border: "var(--info-border)", icon: "var(--fg-info)" },
  neutral: { foreground: "var(--fg-neutral-status)", background: "var(--neutral-status-surface)", border: "var(--neutral-status-border)", icon: "var(--fg-neutral-status)" },
};

export function badgeCategoricalTokens(color: BadgeColor) {
  const palette = categoricalPalette[color];
  return {
    foreground: "var(--fg-default)",
    background: `light-dark(${palette.light}, ${palette.dark})`,
    border: "transparent",
    dot: color === "gray" ? "var(--fg-muted)" : palette.dot,
  };
}

export const badgeColors = Object.freeze(
  Object.fromEntries(Object.entries(categoricalPalette).map(([name, palette]) => [name, palette.dot])) as Record<BadgeColor, string>
);
