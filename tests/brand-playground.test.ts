import { describe, expect, it } from "vitest";
import {
  contrastRatio,
  deriveBrandTheme,
  normalizeHex,
} from "../docs/lib/brand-color";

describe("brand playground palette derivation", () => {
  it("normalizes opaque six-digit colors", () => {
    expect(normalizeHex("6b97ff")).toBe("#6B97FF");
    expect(normalizeHex("#DB2777")).toBe("#DB2777");
    expect(normalizeHex("#fff")).toBeNull();
    expect(normalizeHex("rgba(0, 0, 0, .5)")).toBeNull();
  });

  it.each(["#0060D2", "#7C3AED", "#16A34A", "#FDE047", "#111111", "#FAFAFA"])(
    "derives an accessible theme bundle or explains why %s is rejected",
    (color) => {
      const result = deriveBrandTheme(color);
      if (result.status === "rejected") {
        expect(result.reasons).not.toHaveLength(0);
        return;
      }

      for (const mode of ["light", "dark"] as const) {
        const semantic = result.bundle.semantic;
        for (const fillName of ["brand", "brand-hover", "brand-active"] as const) {
          const fill = semantic[fillName][mode];
          expect(contrastRatio(semantic["fg-on-brand"][mode], fill)).toBeGreaterThanOrEqual(4.5);
          expect(fill).toMatch(/^#[0-9A-F]{6}$/);
        }
      }
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
