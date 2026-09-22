import {
  createThemeCollection,
  type ThemeCollection,
  type ThemeDescriptor,
  type ThemeLike,
} from '../index';
import { createTheme } from '../modules/createTheme';

const PIERRE_COLLECTION = 'pierre';

/*
 * Pierre theme order
 */

const DARK_PIERRE_THEMES = [
  'pierre-dark',
  'pierre-dark-soft',
  'pierre-dark-vibrant',
  'pierre-dark-protanopia-deuteranopia',
  'pierre-dark-tritanopia',
] as const;
const LIGHT_PIERRE_THEMES = [
  'pierre-light',
  'pierre-light-soft',
  'pierre-light-vibrant',
  'pierre-light-protanopia-deuteranopia',
  'pierre-light-tritanopia',
] as const;
const PIERRE_THEMES = [...LIGHT_PIERRE_THEMES, ...DARK_PIERRE_THEMES] as const;

type PierreThemeName = (typeof PIERRE_THEMES)[number];

const LIGHT_PIERRE_THEME_NAMES = new Set<string>(LIGHT_PIERRE_THEMES);

function pierreColorScheme(name: PierreThemeName): 'light' | 'dark' {
  if (LIGHT_PIERRE_THEME_NAMES.has(name)) return 'light';
  return 'dark';
}

/*
 * Pierre theme metadata
 */

const PIERRE_THEME_DISPLAY_NAMES = {
  'pierre-dark': 'Pierre Dark',
  'pierre-dark-soft': 'Pierre Dark Soft',
  'pierre-dark-vibrant': 'Pierre Dark Vibrant',
  'pierre-dark-protanopia-deuteranopia':
    'Pierre Dark Protanopia & Deuteranopia',
  'pierre-dark-tritanopia': 'Pierre Dark Tritanopia',
  'pierre-light': 'Pierre Light',
  'pierre-light-soft': 'Pierre Light Soft',
  'pierre-light-vibrant': 'Pierre Light Vibrant',
  'pierre-light-protanopia-deuteranopia':
    'Pierre Light Protanopia & Deuteranopia',
  'pierre-light-tritanopia': 'Pierre Light Tritanopia',
} as const satisfies Record<PierreThemeName, string>;

/*
 * Pierre theme loaders
 */

function themeImport(
  loader: () => Promise<{ default: unknown }>
): () => Promise<{ default: ThemeLike }> {
  return async () => {
    const loadedTheme = await loader();
    return { default: loadedTheme.default as ThemeLike };
  };
}

const PIERRE_THEME_IMPORTS = {
  'pierre-dark': themeImport(() =>
    import('#system/code-engine/themes/pierre-dark.json')
  ),
  'pierre-dark-soft': themeImport(() =>
    import('#system/code-engine/themes/pierre-dark-soft.json')
  ),
  'pierre-dark-vibrant': themeImport(() =>
    import('#system/code-engine/themes/pierre-dark-vibrant.json')
  ),
  'pierre-dark-protanopia-deuteranopia': themeImport(() =>
    import('#system/code-engine/themes/pierre-dark-protanopia-deuteranopia.json')
  ),
  'pierre-dark-tritanopia': themeImport(() =>
    import('#system/code-engine/themes/pierre-dark-tritanopia.json')
  ),
  'pierre-light': themeImport(() =>
    import('#system/code-engine/themes/pierre-light.json')
  ),
  'pierre-light-soft': themeImport(() =>
    import('#system/code-engine/themes/pierre-light-soft.json')
  ),
  'pierre-light-vibrant': themeImport(() =>
    import('#system/code-engine/themes/pierre-light-vibrant.json')
  ),
  'pierre-light-protanopia-deuteranopia': themeImport(() =>
    import('#system/code-engine/themes/pierre-light-protanopia-deuteranopia.json')
  ),
  'pierre-light-tritanopia': themeImport(() =>
    import('#system/code-engine/themes/pierre-light-tritanopia.json')
  ),
} as const satisfies Record<
  PierreThemeName,
  () => Promise<{ default: ThemeLike }>
>;

function createPierreTheme(name: PierreThemeName): ThemeDescriptor {
  return createTheme({
    name,
    collection: PIERRE_COLLECTION,
    colorScheme: pierreColorScheme(name),
    displayName: PIERRE_THEME_DISPLAY_NAMES[name],
    load: PIERRE_THEME_IMPORTS[name],
  });
}

export const pierreThemes: ThemeCollection = createThemeCollection({
  themes: PIERRE_THEMES.map((name) => createPierreTheme(name)),
});
