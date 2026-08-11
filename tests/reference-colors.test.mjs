import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { referenceColors } from "../src/system/tokens/reference-colors.mjs";
import {
  colorTokens,
  supportColorTokens,
  surfaceTokens,
} from "../src/system/tokens/semantic-tokens.mjs";

const HEX_COLOR = /^#[0-9A-F]{6}$/;
const semanticTokenSource = readFileSync(
  new URL("../src/system/tokens/semantic-tokens.mjs", import.meta.url),
  "utf8"
);

function relativeLuminance(hex) {
  const channels = [1, 3, 5].map((index) =>
    Number.parseInt(hex.slice(index, index + 2), 16) / 255
  );
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  );
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

function colorValues(palette) {
  return Object.entries(palette)
    .filter(([key]) => key !== "optical")
    .map(([, value]) => value);
}

function orderedStops(palette) {
  return Object.entries(palette)
    .filter(([key]) => key !== "optical")
    .sort(([left], [right]) => Number(left) - Number(right));
}

function opticalValues(palette) {
  return Object.values(palette.optical ?? {});
}

describe("reference colors", () => {
  it("uses uppercase six-digit hex values and monotonically darkens numeric scales", () => {
    for (const palette of Object.values(referenceColors)) {
      for (const value of [...colorValues(palette), ...opticalValues(palette)]) {
        expect(value).toMatch(HEX_COLOR);
      }

      const stops = orderedStops(palette);
      for (let index = 1; index < stops.length; index += 1) {
        const [, previous] = stops[index - 1];
        const [, current] = stops[index];
        expect(relativeLuminance(previous)).toBeGreaterThan(relativeLuminance(current));
      }

      const opticalStops = orderedStops(palette.optical ?? {});
      for (let index = 1; index < opticalStops.length; index += 1) {
        const [, previous] = opticalStops[index - 1];
        const [, current] = opticalStops[index];
        expect(relativeLuminance(previous)).toBeGreaterThan(relativeLuminance(current));
      }
    }
  });

  it("keeps every optical neutral and danger stop connected to a semantic consumer", () => {
    const semanticValues = new Set(
      [...colorTokens, ...supportColorTokens, ...surfaceTokens]
        .flatMap((token) => [token.light, token.dark])
    );

    for (const palette of [referenceColors.neutral, referenceColors.danger]) {
      for (const value of opticalValues(palette)) {
        expect(semanticValues).toContain(value);
      }
    }
  });

  it("does not repeat reference palette hex values in the semantic token source", () => {
    const referenceHexes = new Set(
      Object.values(referenceColors).flatMap((palette) => [
        ...colorValues(palette),
        ...opticalValues(palette),
      ])
    );

    for (const hex of referenceHexes) {
      expect(semanticTokenSource).not.toContain(hex);
    }
  });
});
