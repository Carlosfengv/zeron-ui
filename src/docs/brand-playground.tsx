"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  DEFAULT_BRAND_COLOR,
  deriveBrandPalette,
  normalizeHex,
} from "@/docs/brand-color";

interface BrandPlaygroundValue {
  brandColor: string;
  setBrandColor: (value: string) => void;
}

const BrandPlaygroundContext = createContext<BrandPlaygroundValue | null>(null);

function useBrandColor() {
  const context = useContext(BrandPlaygroundContext);
  if (!context) {
    throw new Error("useBrandColor must be used within a BrandPlaygroundProvider");
  }
  return context;
}

function BrandPlaygroundProvider({ children }: { children: ReactNode }) {
  const [brandColor, setBrandColorState] = useState(DEFAULT_BRAND_COLOR);

  const setBrandColor = useCallback((value: string) => {
    const normalized = normalizeHex(value);
    if (normalized) setBrandColorState(normalized);
  }, []);

  useEffect(() => {
    const root = document.documentElement;

    if (brandColor === DEFAULT_BRAND_COLOR) {
      root.style.removeProperty("--brand");
      root.style.removeProperty("--brand-hover");
      root.style.removeProperty("--brand-active");
      root.style.removeProperty("--fg-on-brand");
      root.style.removeProperty("--fg-brand");
      return;
    }

    const palette = deriveBrandPalette(brandColor);
    root.style.setProperty("--brand", palette.brand);
    root.style.setProperty("--brand-hover", palette.brandHover);
    root.style.setProperty("--brand-active", palette.brandActive);
    root.style.setProperty("--fg-on-brand", palette.fgOnBrand);
    root.style.setProperty(
      "--fg-brand",
      `light-dark(${palette.fgBrandLight}, ${palette.fgBrandDark})`
    );
  }, [brandColor]);

  const value = useMemo(
    () => ({ brandColor, setBrandColor }),
    [brandColor, setBrandColor]
  );

  return (
    <BrandPlaygroundContext.Provider value={value}>
      {children}
    </BrandPlaygroundContext.Provider>
  );
}

export {
  BrandPlaygroundProvider,
  useBrandColor,
};
export { rgbToHex } from "@/docs/brand-color";
