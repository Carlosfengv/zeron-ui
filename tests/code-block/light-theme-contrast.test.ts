import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { expect, test } from 'vitest';

type Theme = {
  colors: Record<string, string>;
  tokenColors: Array<{ settings: { foreground?: string } }>;
  semanticTokenColors: Record<string, string>;
};

const theme = JSON.parse(
  readFileSync(
    join(process.cwd(), 'packages/ui/src/system/code-engine/themes/pierre-light.json'),
    'utf8'
  )
) as Theme;

function luminance(hex: string): number {
  const channels = hex.match(/[0-9a-f]{2}/gi);
  if (channels?.length !== 3) throw new Error(`Expected an opaque hex color: ${hex}`);
  const [red, green, blue] = channels.map((channel) => {
    const value = parseInt(channel, 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

test('every default light syntax foreground remains legible on its background', () => {
  const background = luminance(theme.colors['editor.background']);
  const foregrounds = [
    ...theme.tokenColors.map((token) => token.settings.foreground),
    ...Object.values(theme.semanticTokenColors),
  ].filter((color): color is string => color != null);

  expect(foregrounds.length).toBeGreaterThan(0);
  for (const foreground of new Set(foregrounds)) {
    const value = luminance(foreground);
    const contrast = (Math.max(background, value) + 0.05) /
      (Math.min(background, value) + 0.05);
    expect(contrast, `${foreground} against ${theme.colors['editor.background']}`).toBeGreaterThanOrEqual(4.5);
  }
});
