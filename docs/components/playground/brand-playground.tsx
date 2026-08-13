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
  deriveBrandTheme,
  normalizeHex,
  type BrandThemeBundle,
} from "@docs/lib/brand-color";

interface BrandPlaygroundValue {
  brandColor: string;
  brandTheme: BrandThemeBundle | null;
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
  const brandTheme = useMemo(() => {
    if (brandColor === DEFAULT_BRAND_COLOR) return null;
    const result = deriveBrandTheme(brandColor);
    return result.status === "rejected" ? null : result.bundle;
  }, [brandColor]);

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

    if (!brandTheme) return;
    for (const [token, value] of Object.entries(brandTheme.semantic)) {
      root.style.setProperty(`--${token}`, `light-dark(${value.light}, ${value.dark})`);
    }
  }, [brandColor, brandTheme]);

  const value = useMemo(
    () => ({ brandColor, brandTheme, setBrandColor }),
    [brandColor, brandTheme, setBrandColor]
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
export { rgbToHex } from "@docs/lib/brand-color";
