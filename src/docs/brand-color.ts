const DEFAULT_BRAND_COLOR = "#0060D2";
const LIGHT_TEXT_SURFACE = "#FFFFFF";
const DARK_TEXT_SURFACE = "#414141";
const MIN_TEXT_CONTRAST = 4.5;

function normalizeHex(value: string) {
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

function rgbToHex({ r, g, b }: { r: number; g: number; b: number }) {
  const channel = (value: number) =>
    Math.round(Math.max(0, Math.min(255, value)))
      .toString(16)
      .padStart(2, "0");
  return `#${channel(r)}${channel(g)}${channel(b)}`.toUpperCase();
}

function relativeLuminance(value: string) {
  const rgb = hexToRgb(value);
  if (!rgb) return 0;
  const channels = [rgb.r, rgb.g, rgb.b].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrastRatio(foreground: string, background: string) {
  const values = [relativeLuminance(foreground), relativeLuminance(background)]
    .sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
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

function srgbToLinear(channel: number) {
  return channel <= 0.04045
    ? channel / 12.92
    : ((channel + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(channel: number) {
  return channel <= 0.0031308
    ? channel * 12.92
    : 1.055 * channel ** (1 / 2.4) - 0.055;
}

function hexToOklab(value: string) {
  const rgb = hexToRgb(value);
  if (!rgb) return null;
  const [red, green, blue] = [rgb.r, rgb.g, rgb.b]
    .map((channel) => srgbToLinear(channel / 255));
  const l = Math.cbrt(0.4122214708 * red + 0.5363325363 * green + 0.0514459929 * blue);
  const m = Math.cbrt(0.2119034982 * red + 0.6806995451 * green + 0.1073969566 * blue);
  const s = Math.cbrt(0.0883024619 * red + 0.2817188376 * green + 0.6299787005 * blue);
  return {
    l: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

function oklabToHex({ l, a, b }: { l: number; a: number; b: number }) {
  const lRoot = l + 0.3963377774 * a + 0.2158037573 * b;
  const mRoot = l - 0.1055613458 * a - 0.0638541728 * b;
  const sRoot = l - 0.0894841775 * a - 1.291485548 * b;
  const lLinear = lRoot ** 3;
  const mLinear = mRoot ** 3;
  const sLinear = sRoot ** 3;
  const channels = [
    4.0767416621 * lLinear - 3.3077115913 * mLinear + 0.2309699292 * sLinear,
    -1.2684380046 * lLinear + 2.6097574011 * mLinear - 0.3413193965 * sLinear,
    -0.0041960863 * lLinear - 0.7034186147 * mLinear + 1.707614701 * sLinear,
  ].map((channel) => Math.max(0, Math.min(255, linearToSrgb(channel) * 255)));
  return rgbToHex({ r: channels[0], g: channels[1], b: channels[2] });
}

function mixOklab(from: string, to: string, amount: number) {
  const start = hexToOklab(from);
  const end = hexToOklab(to);
  if (!start || !end) return from;
  return oklabToHex({
    l: start.l + (end.l - start.l) * amount,
    a: start.a + (end.a - start.a) * amount,
    b: start.b + (end.b - start.b) * amount,
  });
}

function deriveBrandStates(brand: string, foreground: string) {
  const target = relativeLuminance(foreground) > 0.5 ? "#000000" : "#FFFFFF";
  return {
    brandHover: mixOklab(brand, target, 0.08),
    brandActive: mixOklab(brand, target, 0.14),
  };
}

/** Preserve the selected hue as far as sRGB mixing allows, then move toward
 * black/white only until normal-size text reaches the requested contrast. */
function ensureTextContrast(
  color: string,
  background: string,
  target: "#000000" | "#FFFFFF",
  minimum = MIN_TEXT_CONTRAST
) {
  if (contrastRatio(color, background) >= minimum) return color;
  let low = 0;
  let high = 1;
  for (let step = 0; step < 16; step += 1) {
    const midpoint = (low + high) / 2;
    const candidate = mixRgb(color, target, midpoint);
    if (contrastRatio(candidate, background) >= minimum) high = midpoint;
    else low = midpoint;
  }
  return mixRgb(color, target, high);
}

function deriveBrandPalette(value: string) {
  const brand = normalizeHex(value) ?? DEFAULT_BRAND_COLOR;
  const candidates = ["#171717", "#FFFFFF", "#000000"];
  const fgOnBrand = candidates.find((candidate) => {
    const states = deriveBrandStates(brand, candidate);
    return [brand, states.brandHover, states.brandActive]
      .every((background) => contrastRatio(candidate, background) >= MIN_TEXT_CONTRAST);
  }) ?? "#000000";
  const states = deriveBrandStates(brand, fgOnBrand);

  return {
    brand,
    ...states,
    fgOnBrand,
    fgBrandLight: ensureTextContrast(brand, LIGHT_TEXT_SURFACE, "#000000"),
    fgBrandDark: ensureTextContrast(brand, DARK_TEXT_SURFACE, "#FFFFFF"),
  };
}

export {
  DEFAULT_BRAND_COLOR,
  contrastRatio,
  deriveBrandPalette,
  mixOklab,
  ensureTextContrast,
  normalizeHex,
  rgbToHex,
};
