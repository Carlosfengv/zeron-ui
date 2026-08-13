/** @deprecated Runtime brand derivation now lives in the UI workspace package. */
import { deriveBrandTheme } from "@zeron/ui/system/brand-theme";

export {
  DEFAULT_BRAND_COLOR,
  contrastRatio,
  deriveBrandTheme,
  normalizeHex,
  rgbToHex,
} from "@zeron/ui/system/brand-theme";
export type { BrandThemeBundle } from "@zeron/ui/system/brand-theme";

/** Compatibility projection for existing examples and callers. */
export function deriveBrandPalette(value: string) {
  const result = deriveBrandTheme(value);
  if (result.status === "rejected") {
    throw new Error(result.reasons.join(" "));
  }
  const { semantic } = result.bundle;
  return {
    brand: semantic.brand.light,
    brandHover: semantic["brand-hover"].light,
    brandActive: semantic["brand-active"].light,
    fgOnBrand: semantic["fg-on-brand"].light,
    fgBrandLight: semantic["fg-brand"].light,
    fgBrandDark: semantic["fg-brand"].dark,
  };
}
