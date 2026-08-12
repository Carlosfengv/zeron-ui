import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  deriveBrandTheme,
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

  it("derives a complete theme bundle while retaining the normalized seed at scale.500", () => {
    const result = deriveBrandTheme("7c3aed");
    expect(result.status).not.toBe("rejected");
    if (result.status === "rejected") return;

    expect(result.bundle.scale).toMatchObject({ 50: expect.any(String), 500: "#7C3AED", 950: expect.any(String) });
    expect(Object.keys(result.bundle.scale)).toHaveLength(11);
    for (const name of ["brand", "brand-hover", "brand-active", "fg-brand", "fg-on-brand"] as const) {
      expect(result.bundle.semantic[name]).toMatchObject({ light: expect.stringMatching(/^#[0-9A-F]{6}$/), dark: expect.stringMatching(/^#[0-9A-F]{6}$/) });
    }
  });
});
