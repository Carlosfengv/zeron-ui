/**
 * Badge-private categorical palette and component-token mapping.
 *
 * Categorical colours describe classification only. They deliberately do not
 * create global CSS variables or semantic status tokens.
 */
const strongBadgeInk = "#00040D";

const categoricalPalette = {
  gray: { dot: "#A3A3A3", softLight: "#E5E5E5", softDark: "#3E3E3E", strongLight: "#525252", strongDark: "#A3A3A3", strongInkLight: "#FAFAFA" },
  red: { dot: "#EF4444", softLight: "#F8DFDF", softDark: "#7B1D1D", strongLight: "#DC2626", strongDark: "#F87171", strongInkLight: "#FEF2F2" },
  orange: { dot: "#F97316", softLight: "#FAE6D8", softDark: "#692C17", strongLight: "#EA580C", strongDark: "#FB923C", strongInkLight: "#FFF7ED" },
  amber: { dot: "#F59E0B", softLight: "#F9ECD6", softDark: "#643315", strongLight: "#D97706", strongDark: "#FBBF24", strongInkLight: "#FFFBEB" },
  yellow: { dot: "#EAB308", softLight: "#F8EFD6", softDark: "#5C3B15", strongLight: "#CA8A04", strongDark: "#FACC15", strongInkLight: "#FEFCE8" },
  lime: { dot: "#84CC16", softLight: "#E8F3D8", softDark: "#324717", strongLight: "#65A30D", strongDark: "#A3E635", strongInkLight: "#F7FEE7" },
  green: { dot: "#22C55E", softLight: "#DAF2E3", softDark: "#1A492C", strongLight: "#16A34A", strongDark: "#4ADE80", strongInkLight: "#F0FDF4" },
  emerald: { dot: "#10B981", softLight: "#D7F0E8", softDark: "#104536", strongLight: "#059669", strongDark: "#34D399", strongInkLight: "#ECFDF5" },
  teal: { dot: "#14B8A6", softLight: "#D8F0ED", softDark: "#174542", strongLight: "#0D9488", strongDark: "#2DD4BF", strongInkLight: "#F0FDFA" },
  cyan: { dot: "#06B6D4", softLight: "#D5F0F4", softDark: "#194553", strongLight: "#0891B2", strongDark: "#22D3EE", strongInkLight: "#ECFEFF" },
  blue: { dot: "#3B82F6", softLight: "#DDE8F9", softDark: "#1E3B8E", strongLight: "#2563EB", strongDark: "#60A5FA", strongInkLight: "#EFF6FF" },
  indigo: { dot: "#6366F1", softLight: "#E3E4F9", softDark: "#382F95", strongLight: "#4F46E5", strongDark: "#818CF8", strongInkLight: "#EEF2FF" },
  violet: { dot: "#8B5CF6", softLight: "#E9E2F9", softDark: "#4E248F", strongLight: "#7C3AED", strongDark: "#A78BFA", strongInkLight: "#F5F3FF" },
  purple: { dot: "#A855F7", softLight: "#EEE1FA", softDark: "#582188", strongLight: "#9333EA", strongDark: "#C084FC", strongInkLight: "#FAF5FF" },
  fuchsia: { dot: "#D946EF", softLight: "#F5DFF8", softDark: "#6E1D75", strongLight: "#C026D3", strongDark: "#E879F9", strongInkLight: "#FDF4FF" },
  pink: { dot: "#EC4899", softLight: "#F8DFEB", softDark: "#77183F", strongLight: "#DB2777", strongDark: "#F472B6", strongInkLight: "#FDF2F8" },
  rose: { dot: "#F43F5E", softLight: "#F9DEE3", softDark: "#791432", strongLight: "#E11D48", strongDark: "#FB7185", strongInkLight: "#FFF1F2" },
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
      background: `light-dark(${palette.softLight}, ${palette.softDark})`,
      border: "transparent",
    },
    strong: {
      foreground: `light-dark(${palette.strongInkLight}, ${strongBadgeInk})`,
      background: `light-dark(${palette.strongLight}, ${palette.strongDark})`,
      border: "transparent",
    },
    dot: color === "gray" ? "var(--fg-muted)" : palette.dot,
  };
}

export const badgeColors = Object.freeze(
  Object.fromEntries(Object.entries(categoricalPalette).map(([name, palette]) => [name, palette.dot])) as Record<BadgeColor, string>
);
