import { describe, expect, it } from "vitest";
import {
  badgeCategoricalTokens,
  badgeColors,
  type BadgeColor,
} from "../packages/ui/src/components/badge-colors";
import { contrastRatio } from "../packages/ui/src/system/brand-theme";

const strong500Colors = {
  ...badgeColors,
  gray: "#737373",
} satisfies Record<BadgeColor, string>;
const strong50Foregrounds = {
  gray: "#FAFAFA",
  red: "#FEF2F2",
  orange: "#FFF7ED",
  amber: "#FFFBEB",
  yellow: "#FEFCE8",
  lime: "#F7FEE7",
  green: "#F0FDF4",
  emerald: "#ECFDF5",
  teal: "#F0FDFA",
  cyan: "#ECFEFF",
  blue: "#EFF6FF",
  indigo: "#EEF2FF",
  violet: "#F5F3FF",
  purple: "#FAF5FF",
  fuchsia: "#FDF4FF",
  pink: "#FDF2F8",
  rose: "#FFF1F2",
} satisfies Record<BadgeColor, string>;
const softDarkColors = {
  gray: "#525252",
  red: "#B91C1C",
  orange: "#9A3412",
  amber: "#92400E",
  yellow: "#854D0E",
  lime: "#3F6212",
  green: "#166534",
  emerald: "#065F46",
  teal: "#115E59",
  cyan: "#155E75",
  blue: "#1D4ED8",
  indigo: "#4338CA",
  violet: "#6D28D9",
  purple: "#7E22CE",
  fuchsia: "#A21CAF",
  pink: "#9D174D",
  rose: "#9F1239",
} satisfies Record<BadgeColor, string>;

describe("badge categorical colors", () => {
  it.each(Object.entries(strong500Colors) as [BadgeColor, string][])(
    "uses the 500 step for the %s strong fill",
    (color, background) => {
      expect(badgeCategoricalTokens(color).strong.background).toBe(background);
    },
  );

  it.each(Object.entries(strong50Foregrounds) as [BadgeColor, string][])(
    "uses the 50 step for the %s strong foreground",
    (color, foreground) => {
      expect(badgeCategoricalTokens(color).strong.foreground).toBe(foreground);
    },
  );

  it.each(Object.entries(softDarkColors) as [BadgeColor, string][])(
    "keeps the %s dark soft fill distinct and readable",
    (color, background) => {
      expect(badgeCategoricalTokens(color).soft.background).toContain(background);
      expect(contrastRatio(background, "#1F1F1F")).toBeGreaterThanOrEqual(1.5);
      expect(contrastRatio("#F9F9F9", background)).toBeGreaterThanOrEqual(4.5);
    },
  );

  it("preserves the existing soft and dot recipes", () => {
    expect(badgeCategoricalTokens("blue")).toMatchObject({
      soft: {
        foreground: "var(--fg-default)",
        background: "light-dark(#DDE8F9, #1D4ED8)",
        border: "transparent",
      },
      dot: "#3B82F6",
    });
    expect(badgeCategoricalTokens("gray").dot).toBe("var(--fg-muted)");
  });

  it("accepts semantic CSS variables for a custom strong recipe", () => {
    expect(badgeCategoricalTokens({
      base: "var(--brand)",
      onStrong: "var(--fg-on-brand)",
    })).toEqual({
      soft: {
        foreground: "var(--fg-default)",
        background: "color-mix(in oklab, var(--brand) 16%, transparent)",
        border: "transparent",
      },
      strong: {
        foreground: "var(--fg-on-brand)",
        background: "var(--brand)",
        border: "transparent",
      },
      dot: "var(--brand)",
    });
  });

  it("honors every custom recipe override", () => {
    expect(badgeCategoricalTokens({
      base: "#6D28D9",
      onStrong: "#FFFFFF",
      softBackground: "#EDE9FE",
      onSoft: "#2E1065",
      dot: "#8B5CF6",
    })).toEqual({
      soft: {
        foreground: "#2E1065",
        background: "#EDE9FE",
        border: "transparent",
      },
      strong: {
        foreground: "#FFFFFF",
        background: "#6D28D9",
        border: "transparent",
      },
      dot: "#8B5CF6",
    });
  });
});
