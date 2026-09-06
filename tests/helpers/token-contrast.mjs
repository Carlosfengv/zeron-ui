const VARIABLE = /^var\(--(?<name>[a-z0-9-]+)\)$/i;
const HEX = /^#(?<rgb>[0-9a-f]{6})(?<alpha>[0-9a-f]{2})?$/i;
const RGB = /^(?:rgb|rgba)\(\s*(?<red>\d+(?:\.\d+)?)\s*(?:,|\s)\s*(?<green>\d+(?:\.\d+)?)\s*(?:,|\s)\s*(?<blue>\d+(?:\.\d+)?)(?:\s*(?:,|\/)\s*(?<alpha>\d*\.?\d+))?\s*\)$/i;

function assertChannel(channel, value, maximum) {
  if (!Number.isFinite(value) || value < 0 || value > maximum) {
    throw new Error(`Invalid ${channel} channel: ${value}`);
  }
  return value;
}

/** Parses the concrete CSS color formats used by semantic tokens. */
export function parseCssColor(value) {
  if (typeof value !== "string") throw new Error(`Color must be a string; received ${typeof value}`);
  const input = value.trim();
  const hex = HEX.exec(input);
  if (hex?.groups) {
    const { rgb, alpha } = hex.groups;
    return {
      r: Number.parseInt(rgb.slice(0, 2), 16),
      g: Number.parseInt(rgb.slice(2, 4), 16),
      b: Number.parseInt(rgb.slice(4, 6), 16),
      a: alpha ? Number.parseInt(alpha, 16) / 255 : 1,
    };
  }

  const rgb = RGB.exec(input);
  if (rgb?.groups) {
    const { red, green, blue, alpha = "1" } = rgb.groups;
    return {
      r: assertChannel("red", Number(red), 255),
      g: assertChannel("green", Number(green), 255),
      b: assertChannel("blue", Number(blue), 255),
      a: assertChannel("alpha", Number(alpha), 1),
    };
  }

  throw new Error(`Unsupported CSS color: ${value}`);
}

export function compositeColors(foreground, background) {
  const outputAlpha = foreground.a + background.a * (1 - foreground.a);
  if (outputAlpha === 0) return { r: 0, g: 0, b: 0, a: 0 };
  const composite = (channel) => (
    (foreground[channel] * foreground.a + background[channel] * background.a * (1 - foreground.a)) / outputAlpha
  );
  return {
    r: composite("r"),
    g: composite("g"),
    b: composite("b"),
    a: outputAlpha,
  };
}

function relativeLuminance(color) {
  const [red, green, blue] = [color.r, color.g, color.b].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.04045
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

/**
 * Calculates contrast after compositing a possibly transparent background over
 * its actual surface, then compositing the foreground over that result.
 */
export function contrastRatio(foreground, background, surface = "#FFFFFF") {
  const resolvedBackground = compositeColors(parseCssColor(background), parseCssColor(surface));
  const resolvedForeground = compositeColors(parseCssColor(foreground), resolvedBackground);
  const [light, dark] = [relativeLuminance(resolvedForeground), relativeLuminance(resolvedBackground)]
    .sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

/** Resolves concrete semantic-token aliases for one explicit theme mode. */
export function resolveTokenColor(value, { mode, tokens, overrides = {}, trail = [] }) {
  const variable = typeof value === "string" ? VARIABLE.exec(value.trim()) : null;
  if (!variable?.groups?.name) return value;

  const name = variable.groups.name;
  if (trail.includes(name)) throw new Error(`Circular color token alias: ${[...trail, name].join(" -> ")}`);
  const token = overrides[name] ?? tokens.find((candidate) => candidate.name === name);
  if (!token) throw new Error(`Missing color token alias: --${name}`);
  if (!(mode in token)) throw new Error(`Color token --${name} has no ${mode} value`);
  return resolveTokenColor(token[mode], { mode, tokens, overrides, trail: [...trail, name] });
}
