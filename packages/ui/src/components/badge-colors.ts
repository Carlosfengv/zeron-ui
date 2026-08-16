/**
 * Badge-private categorical palette and component-token mapping.
 *
 * Categorical colours describe classification only. They deliberately do not
 * create global CSS variables or semantic status tokens.
 */
const categoricalPalette = {
  gray: { dot: "#A3A3A3", light: "#E5E5E5", dark: "#525252", strong: "#737373", onStrong: "#FAFAFA" },
  red: { dot: "#EF4444", light: "#F8DFDF", dark: "#B91C1C", strong: "#EF4444", onStrong: "#FEF2F2" },
  orange: { dot: "#F97316", light: "#FAE6D8", dark: "#9A3412", strong: "#F97316", onStrong: "#FFF7ED" },
  amber: { dot: "#F59E0B", light: "#F9ECD6", dark: "#92400E", strong: "#F59E0B", onStrong: "#FFFBEB" },
  yellow: { dot: "#EAB308", light: "#F8EFD6", dark: "#854D0E", strong: "#EAB308", onStrong: "#FEFCE8" },
  lime: { dot: "#84CC16", light: "#E8F3D8", dark: "#3F6212", strong: "#84CC16", onStrong: "#F7FEE7" },
  green: { dot: "#22C55E", light: "#DAF2E3", dark: "#166534", strong: "#22C55E", onStrong: "#F0FDF4" },
  emerald: { dot: "#10B981", light: "#D7F0E8", dark: "#065F46", strong: "#10B981", onStrong: "#ECFDF5" },
  teal: { dot: "#14B8A6", light: "#D8F0ED", dark: "#115E59", strong: "#14B8A6", onStrong: "#F0FDFA" },
  cyan: { dot: "#06B6D4", light: "#D5F0F4", dark: "#155E75", strong: "#06B6D4", onStrong: "#ECFEFF" },
  blue: { dot: "#3B82F6", light: "#DDE8F9", dark: "#1D4ED8", strong: "#3B82F6", onStrong: "#EFF6FF" },
  indigo: { dot: "#6366F1", light: "#E3E4F9", dark: "#4338CA", strong: "#6366F1", onStrong: "#EEF2FF" },
  violet: { dot: "#8B5CF6", light: "#E9E2F9", dark: "#6D28D9", strong: "#8B5CF6", onStrong: "#F5F3FF" },
  purple: { dot: "#A855F7", light: "#EEE1FA", dark: "#7E22CE", strong: "#A855F7", onStrong: "#FAF5FF" },
  fuchsia: { dot: "#D946EF", light: "#F5DFF8", dark: "#A21CAF", strong: "#D946EF", onStrong: "#FDF4FF" },
  pink: { dot: "#EC4899", light: "#F8DFEB", dark: "#9D174D", strong: "#EC4899", onStrong: "#FDF2F8" },
  rose: { dot: "#F43F5E", light: "#F9DEE3", dark: "#9F1239", strong: "#F43F5E", onStrong: "#FFF1F2" },
} as const;

export type BadgeColor = keyof typeof categoricalPalette;
export interface BadgeCustomColor {
  /** Anchor color used by the dot variant and as the strong fill. */
  base: string;
  /** Foreground paired with the strong fill. Must meet text contrast requirements. */
  onStrong: string;
  /** Explicit low-emphasis fill. Falls back to a translucent mix of `base`. */
  softBackground?: string;
  /** Foreground paired with the low-emphasis fill. */
  onSoft?: string;
  /** Optional dot override. Defaults to `base`. */
  dot?: string;
}
export type BadgeColorInput = BadgeColor | BadgeCustomColor;
export type BadgeStatus = "danger" | "warning" | "success" | "info" | "neutral";

export const badgeStatusTokens: Record<BadgeStatus, { foreground: string; background: string; border: string; icon: string }> = {
  danger: { foreground: "var(--fg-danger)", background: "var(--danger-surface)", border: "var(--danger-border)", icon: "var(--fg-danger)" },
  warning: { foreground: "var(--fg-warning)", background: "var(--warning-surface)", border: "var(--warning-border)", icon: "var(--fg-warning)" },
  success: { foreground: "var(--fg-success)", background: "var(--success-surface)", border: "var(--success-border)", icon: "var(--fg-success)" },
  info: { foreground: "var(--fg-info)", background: "var(--info-surface)", border: "var(--info-border)", icon: "var(--fg-info)" },
  neutral: { foreground: "var(--fg-neutral-status)", background: "var(--neutral-status-surface)", border: "var(--neutral-status-border)", icon: "var(--fg-neutral-status)" },
};

export function badgeCategoricalTokens(color: BadgeColorInput) {
  if (typeof color !== "string") {
    return {
      soft: {
        foreground: color.onSoft ?? "var(--fg-default)",
        background: color.softBackground ?? `color-mix(in oklab, ${color.base} 16%, transparent)`,
        border: "transparent",
      },
      strong: {
        foreground: color.onStrong,
        background: color.base,
        border: "transparent",
      },
      dot: color.dot ?? color.base,
    };
  }

  const palette = categoricalPalette[color];
  return {
    soft: {
      foreground: "var(--fg-default)",
      background: `light-dark(${palette.light}, ${palette.dark})`,
      border: "transparent",
    },
    strong: {
      foreground: palette.onStrong,
      background: palette.strong,
      border: "transparent",
    },
    dot: color === "gray" ? "var(--fg-muted)" : palette.dot,
  };
}

export const badgeColors = Object.freeze(
  Object.fromEntries(Object.entries(categoricalPalette).map(([name, palette]) => [name, palette.dot])) as Record<BadgeColor, string>
);
