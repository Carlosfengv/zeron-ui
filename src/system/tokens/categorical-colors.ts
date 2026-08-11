/**
 * Internal categorical colors for classification, not product status.
 *
 * These values are intentionally kept out of the global semantic CSS API.
 * Components that consume them must expose a categorical API (for example,
 * Badge's `color` prop) rather than reusing them for danger or warning state.
 */
export const categoricalColors = {
  gray: "#A3A3A3",
  red: "#EF4444",
  orange: "#F97316",
  amber: "#F59E0B",
  yellow: "#EAB308",
  lime: "#84CC16",
  green: "#22C55E",
  emerald: "#10B981",
  teal: "#14B8A6",
  cyan: "#06B6D4",
  blue: "#3B82F6",
  indigo: "#6366F1",
  violet: "#8B5CF6",
  purple: "#A855F7",
  fuchsia: "#D946EF",
  pink: "#EC4899",
  rose: "#F43F5E",
} as const;

export type CategoricalColor = keyof typeof categoricalColors;

export const categoricalBackgroundColors: Record<
  CategoricalColor,
  { light: string; dark: string }
> = {
  gray: { light: "#E5E5E5", dark: "#525252" },
  red: { light: "#F8DFDF", dark: "#371E1E" },
  orange: { light: "#FAE6D8", dark: "#392517" },
  amber: { light: "#F9ECD6", dark: "#382B15" },
  yellow: { light: "#F8EFD6", dark: "#372E15" },
  lime: { light: "#E8F3D8", dark: "#273217" },
  green: { light: "#DAF2E3", dark: "#193122" },
  emerald: { light: "#D7F0E8", dark: "#162F27" },
  teal: { light: "#D8F0ED", dark: "#172F2C" },
  cyan: { light: "#D5F0F4", dark: "#142F33" },
  blue: { light: "#DDE8F9", dark: "#1C2738" },
  indigo: { light: "#E3E4F9", dark: "#222338" },
  violet: { light: "#E9E2F9", dark: "#282138" },
  purple: { light: "#EEE1FA", dark: "#2D2039" },
  fuchsia: { light: "#F5DFF8", dark: "#341E37" },
  pink: { light: "#F8DFEB", dark: "#371E2B" },
  rose: { light: "#F9DEE3", dark: "#381D22" },
};
