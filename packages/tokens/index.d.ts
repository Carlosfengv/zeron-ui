export type ColorToken = {
  name: string;
  light: string;
  dark: string;
  usage: string;
  classification?: {
    channel: string;
    intent: string;
    variant?: { interaction: "hover" | "active" };
  };
};

export type ValueToken = {
  name: string;
  value: string | number;
  usage: string;
};

export type TypographyToken = {
  name: string;
  size: string;
  px: number;
  lineHeight: string;
  linePx: number;
  usage: string;
};

export const colors: readonly ColorToken[];
export const foregroundColorTokens: readonly ColorToken[];
export const fillColorTokens: readonly ColorToken[];
export const boundaryColorTokens: readonly ColorToken[];
export const overlayColorTokens: readonly ColorToken[];
export const supportColorTokens: readonly ColorToken[];
export const surfaceTokens: readonly ColorToken[];
export const shadowTokens: readonly ColorToken[];
export const typographyTokens: readonly TypographyToken[];
export const motionDurationTokens: readonly ValueToken[];
export const fontTokens: { readonly family: string };
export const controlHeightTokens: readonly ValueToken[];
export const badgeHeightTokens: readonly ValueToken[];
export const layerTokens: readonly ValueToken[];

export const semanticTokens: {
  readonly colors: readonly ColorToken[];
  readonly foregrounds: readonly ColorToken[];
  readonly fills: readonly ColorToken[];
  readonly boundaries: readonly ColorToken[];
  readonly overlays: readonly ColorToken[];
  readonly supportColors: readonly ColorToken[];
  readonly surfaces: readonly ColorToken[];
  readonly shadows: readonly ColorToken[];
  readonly typography: readonly TypographyToken[];
  readonly motionDurations: readonly ValueToken[];
  readonly fonts: { readonly family: string };
  readonly controlHeights: readonly ValueToken[];
  readonly badgeHeights: readonly ValueToken[];
  readonly layers: readonly ValueToken[];
};

export default semanticTokens;
