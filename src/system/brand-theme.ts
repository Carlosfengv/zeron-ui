/**
 * Runtime brand-theme derivation.
 *
 * The seed is retained as scale.500. Components consume the semantic bundle
 * below, never an individual reference-scale step.
 */

export const DEFAULT_BRAND_COLOR = "#0060D2";

const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
const LIGHT_SURFACE = "#FAFAFA";
const DARK_SURFACE = "#171717";
const LIGHT_TEXT_SURFACE = "#FFFFFF";
const DARK_TEXT_SURFACE = "#414141";
const MIN_TEXT_CONTRAST = 4.5;
const MIN_CONTROL_CONTRAST = 3;

export type BrandScaleStep = (typeof STEPS)[number];
export type BrandReferenceScale = Record<BrandScaleStep, string>;
export type ThemeModeValue = { light: string; dark: string };
export type BrandSemanticName = "brand" | "brand-hover" | "brand-active" | "fg-brand" | "fg-on-brand";

export interface BrandThemeBundle {
  seed: string;
  scale: BrandReferenceScale;
  semantic: Record<BrandSemanticName, ThemeModeValue>;
  mapping: {
    light: Record<BrandSemanticName, BrandScaleStep | "computed-ink">;
    dark: Record<BrandSemanticName, BrandScaleStep | "computed-ink">;
  };
}

export type BrandDerivationResult =
  | { status: "accepted"; bundle: BrandThemeBundle }
  | { status: "adjusted"; bundle: BrandThemeBundle; changes: string[] }
  | { status: "rejected"; reasons: string[] };

export function normalizeHex(value: string) {
  const match = /^#?([0-9a-f]{6})$/i.exec(value.trim());
  return match ? `#${match[1].toUpperCase()}` : null;
}

function hexToRgb(value: string) {
  const hex = normalizeHex(value);
  if (!hex) return null;
  return {
    r: Number.parseInt(hex.slice(1, 3), 16),
    g: Number.parseInt(hex.slice(3, 5), 16),
    b: Number.parseInt(hex.slice(5, 7), 16),
  };
}

export function rgbToHex({ r, g, b }: { r: number; g: number; b: number }) {
  const channel = (value: number) => Math.round(Math.max(0, Math.min(255, value)))
    .toString(16)
    .padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`.toUpperCase();
}

function rgbToHsv(value: string) {
  const rgb = hexToRgb(value);
  if (!rgb) return null;
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((channel) => channel / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;
  if (delta > 0) {
    if (max === r) h = 60 * (((g - b) / delta) % 6);
    else if (max === g) h = 60 * ((b - r) / delta + 2);
    else h = 60 * ((r - g) / delta + 4);
  }
  return { h: (h + 360) % 360, s: max === 0 ? 0 : delta / max, v: max };
}

function hsvToHex({ h, s, v }: { h: number; s: number; v: number }) {
  const hue = ((h % 360) + 360) % 360;
  const chroma = v * s;
  const x = chroma * (1 - Math.abs((hue / 60) % 2 - 1));
  const m = v - chroma;
  const [r, g, b] = hue < 60 ? [chroma, x, 0]
    : hue < 120 ? [x, chroma, 0]
      : hue < 180 ? [0, chroma, x]
        : hue < 240 ? [0, x, chroma]
          : hue < 300 ? [x, 0, chroma]
            : [chroma, 0, x];
  return rgbToHex({ r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 });
}

function relativeLuminance(value: string) {
  const rgb = hexToRgb(value);
  if (!rgb) return 0;
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}

export function contrastRatio(foreground: string, background: string) {
  const [light, dark] = [relativeLuminance(foreground), relativeLuminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

function mixRgb(from: string, to: string, amount: number) {
  const start = hexToRgb(from);
  const end = hexToRgb(to);
  if (!start || !end) return from;
  return rgbToHex({
    r: start.r + (end.r - start.r) * amount,
    g: start.g + (end.g - start.g) * amount,
    b: start.b + (end.b - start.b) * amount,
  });
}

function deriveStates(fill: string, foreground: string) {
  const target = relativeLuminance(foreground) > 0.5 ? "#000000" : "#FFFFFF";
  return { hover: mixRgb(fill, target, 0.08), active: mixRgb(fill, target, 0.14) };
}

function ensureTextContrast(color: string, background: string, target: "#000000" | "#FFFFFF") {
  if (contrastRatio(color, background) >= MIN_TEXT_CONTRAST) return color;
  let low = 0;
  let high = 1;
  for (let step = 0; step < 16; step += 1) {
    const midpoint = (low + high) / 2;
    const candidate = mixRgb(color, target, midpoint);
    if (contrastRatio(candidate, background) >= MIN_TEXT_CONTRAST) high = midpoint;
    else low = midpoint;
  }
  return mixRgb(color, target, high);
}

function scaleColor(seed: string, step: BrandScaleStep) {
  if (step === 500) return seed;
  const hsv = rgbToHsv(seed);
  if (!hsv) return seed;
  const deltaStep = step - 500;
  const delta = deltaStep / 100;
  const achromatic = hsv.s === 0;
  const h = achromatic ? 0 : hsv.h;
  const hue = achromatic ? 0 : step <= 500
    ? (h > 80 && h < 260 ? h + deltaStep * 0.01 : h - deltaStep * 0.02)
    : (h > 20 && h < 48 ? h - deltaStep * 0.03 : h >= 48 && h < 260 ? h + deltaStep * 0.01 : h - deltaStep * 0.02);
  const saturation = step < 500
    ? Math.max(0, Math.min(1, hsv.s + (delta * hsv.s / 5) - (step < 100 ? 0.02 : 0)))
    : step > 500
      ? Math.max(0, Math.min(1, hsv.s + (achromatic ? 0 : delta * (h < 30 || h > 200 ? 0.03 : 0.01))))
      : hsv.s;
  const value = step < 500
    ? Math.max(0, Math.min(1, hsv.v - delta * (1 - hsv.v) / 5 * (hsv.s < 0.1 ? 1.06 : 1)))
    : Math.max(0, Math.min(1, hsv.v - delta * ((h < 30 || h > 200) && h > 0 ? (hsv.v > 0.8 ? 0.14 : 0.08) : hsv.v / 6)));
  return hsvToHex({ h: hue, s: saturation, v: value });
}

export function generateBrandScale(value: string) {
  const seed = normalizeHex(value);
  if (!seed) return null;
  const scale = Object.fromEntries(STEPS.map((step) => [step, scaleColor(seed, step)])) as BrandReferenceScale;
  const changes: string[] = [];
  const adjustToward = (step: BrandScaleStep, target: "#FFFFFF" | "#000000", comparison: number, greater: boolean) => {
    const original = scale[step];
    let low = 0;
    let high = 1;
    for (let pass = 0; pass < 16; pass += 1) {
      const amount = (low + high) / 2;
      const candidate = mixRgb(original, target, amount);
      const qualifies = greater ? relativeLuminance(candidate) >= comparison : relativeLuminance(candidate) <= comparison;
      if (qualifies) high = amount;
      else low = amount;
    }
    scale[step] = mixRgb(original, target, high);
    if (scale[step] !== original) changes.push(`Adjusted brand.${step} to preserve luminance order.`);
  };
  for (let index = 4; index >= 0; index -= 1) {
    const step = STEPS[index];
    const next = STEPS[index + 1];
    if (relativeLuminance(scale[step]) < relativeLuminance(scale[next])) adjustToward(step, "#FFFFFF", relativeLuminance(scale[next]), true);
  }
  for (let index = 6; index < STEPS.length; index += 1) {
    const step = STEPS[index];
    const previous = STEPS[index - 1];
    if (relativeLuminance(scale[step]) > relativeLuminance(scale[previous])) adjustToward(step, "#000000", relativeLuminance(scale[previous]), false);
  }
  scale[500] = seed;
  return { seed, scale, changes };
}

function findThemeFill(scale: BrandReferenceScale, surface: string, steps: BrandScaleStep[]) {
  for (const step of steps) {
    const fill = scale[step];
    if (contrastRatio(fill, surface) < MIN_CONTROL_CONTRAST) continue;
    for (const foreground of ["#FFFFFF", "#171717", "#000000"]) {
      const states = deriveStates(fill, foreground);
      if ([fill, states.hover, states.active].every((value) => contrastRatio(foreground, value) >= MIN_TEXT_CONTRAST)) {
        return { step, fill, foreground, ...states };
      }
    }
  }
  return null;
}

export function deriveBrandTheme(value: string): BrandDerivationResult {
  const generated = generateBrandScale(value);
  if (!generated) return { status: "rejected", reasons: ["Brand seed must be a six-digit hexadecimal color."] };
  const light = findThemeFill(generated.scale, LIGHT_SURFACE, [500, 600, 700, 800, 900, 950, 400, 300, 200, 100, 50]);
  const dark = findThemeFill(generated.scale, DARK_SURFACE, [500, 400, 300, 200, 100, 50, 600, 700, 800, 900, 950]);
  if (!light || !dark) return { status: "rejected", reasons: ["Could not derive a readable action fill and common on-fill ink in both themes."] };
  const bundle: BrandThemeBundle = {
    seed: generated.seed,
    scale: generated.scale,
    semantic: {
      brand: { light: light.fill, dark: dark.fill },
      "brand-hover": { light: light.hover, dark: dark.hover },
      "brand-active": { light: light.active, dark: dark.active },
      "fg-on-brand": { light: light.foreground, dark: dark.foreground },
      "fg-brand": {
        light: ensureTextContrast(light.fill, LIGHT_TEXT_SURFACE, "#000000"),
        dark: ensureTextContrast(dark.fill, DARK_TEXT_SURFACE, "#FFFFFF"),
      },
    },
    mapping: {
      light: { brand: light.step, "brand-hover": light.step, "brand-active": light.step, "fg-brand": light.step, "fg-on-brand": "computed-ink" },
      dark: { brand: dark.step, "brand-hover": dark.step, "brand-active": dark.step, "fg-brand": dark.step, "fg-on-brand": "computed-ink" },
    },
  };
  const changes = [...generated.changes];
  if (light.step !== 500 || dark.step !== 500) changes.push("Mapped the seed to safer theme-specific action steps.");
  return changes.length ? { status: "adjusted", bundle, changes } : { status: "accepted", bundle };
}
