import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  deriveBrandPalette,
  normalizeHex,
} from "../src/docs/brand-color";

describe("brand playground palette derivation", () => {
  it("normalizes opaque six-digit colors", () => {
    expect(normalizeHex("6b97ff")).toBe("#6B97FF");
    expect(normalizeHex("#DB2777")).toBe("#DB2777");
    expect(normalizeHex("#fff")).toBeNull();
    expect(normalizeHex("rgba(0, 0, 0, .5)")).toBeNull();
  });

  it.each(["#0060D2", "#7C3AED", "#DB2777", "#DC2626", "#EA580C", "#16A34A"])(
    "derives accessible content for %s",
    (color) => {
      const palette = deriveBrandPalette(color);
      for (const fill of [palette.brand, palette.brandHover, palette.brandActive]) {
        expect(contrastRatio(palette.fgOnBrand, fill)).toBeGreaterThanOrEqual(4.5);
        expect(fill).toMatch(/^#[0-9A-F]{6}$/);
      }
      expect(contrastRatio(palette.fgBrandLight, "#FFFFFF")).toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(palette.fgBrandDark, "#414141")).toBeGreaterThanOrEqual(4.5);
    }
  );
});
