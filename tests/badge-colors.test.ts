import { describe, expect, it } from "vitest";
import {
  badgeCategoricalTokens,
  type BadgeColor,
} from "../packages/ui/src/components/badge-colors";
import { contrastRatio } from "./helpers/token-contrast.mjs";

const softDarkColors = {
  gray: "#3E3E3E",
  red: "#7B1D1D",
  orange: "#692C17",
  amber: "#643315",
  yellow: "#5C3B15",
  lime: "#324717",
  green: "#1A492C",
  emerald: "#104536",
  teal: "#174542",
  cyan: "#194553",
  blue: "#1E3B8E",
  indigo: "#382F95",
  violet: "#4E248F",
  purple: "#582188",
  fuchsia: "#6E1D75",
  pink: "#77183F",
  rose: "#791432",
} satisfies Record<BadgeColor, string>;
const strongLightColors = {
  gray: ["#525252", "#FAFAFA"],
  red: ["#DC2626", "#FEF2F2"],
  orange: ["#EA580C", "#FFF7ED"],
  amber: ["#D97706", "#FFFBEB"],
  yellow: ["#CA8A04", "#FEFCE8"],
  lime: ["#65A30D", "#F7FEE7"],
  green: ["#16A34A", "#F0FDF4"],
  emerald: ["#059669", "#ECFDF5"],
  teal: ["#0D9488", "#F0FDFA"],
  cyan: ["#0891B2", "#ECFEFF"],
  blue: ["#2563EB", "#EFF6FF"],
  indigo: ["#4F46E5", "#EEF2FF"],
  violet: ["#7C3AED", "#F5F3FF"],
  purple: ["#9333EA", "#FAF5FF"],
  fuchsia: ["#C026D3", "#FDF4FF"],
  pink: ["#DB2777", "#FDF2F8"],
  rose: ["#E11D48", "#FFF1F2"],
} satisfies Record<BadgeColor, [string, string]>;
const strongDarkColors = {
  gray: "#A3A3A3",
  red: "#F87171",
  orange: "#FB923C",
  amber: "#FBBF24",
  yellow: "#FACC15",
  lime: "#A3E635",
  green: "#4ADE80",
  emerald: "#34D399",
  teal: "#2DD4BF",
  cyan: "#22D3EE",
  blue: "#60A5FA",
  indigo: "#818CF8",
  violet: "#A78BFA",
  purple: "#C084FC",
  fuchsia: "#E879F9",
  pink: "#F472B6",
  rose: "#FB7185",
} satisfies Record<BadgeColor, string>;

function themedPair(light: string, dark: string) {
  return `light-dark(${light}, ${dark})`;
}

describe("badge categorical colors", () => {
  it.each(Object.entries(strongLightColors) as [BadgeColor, [string, string]][])(
    "uses the %s 600 fill with its 50 foreground in the light theme",
    (color, [lightBackground, lightForeground]) => {
      const strong = badgeCategoricalTokens(color).strong;
      const darkBackground = strongDarkColors[color];

      expect(strong).toEqual({
        foreground: themedPair(lightForeground, "#00040D"),
        background: themedPair(lightBackground, darkBackground),
        border: "transparent",
      });
      expect(contrastRatio("#00040D", darkBackground)).toBeGreaterThanOrEqual(6);
      expect(contrastRatio(lightBackground, "#FFFFFF")).toBeGreaterThanOrEqual(1.5);
      expect(contrastRatio(darkBackground, "#1F1F1F")).toBeGreaterThanOrEqual(3);
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
        background: "light-dark(#DDE8F9, #1E3B8E)",
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
