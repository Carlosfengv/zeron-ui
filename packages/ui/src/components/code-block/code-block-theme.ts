import type { CSSProperties } from 'react';

export type CodeBlockAppearance = 'zeron' | 'engine';
export type CodeBlockThemeMode = 'light' | 'dark' | 'system' | 'inherit';

export function getCodeBlockStyle(
  themeMode: CodeBlockThemeMode,
  style?: CSSProperties
): CSSProperties {
  const colorScheme =
    themeMode === 'light' || themeMode === 'dark'
      ? themeMode
      : themeMode === 'system'
        ? 'light dark'
        : undefined;

  return {
    ...(colorScheme == null ? undefined : { colorScheme }),
    ...style,
  };
}
