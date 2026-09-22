import { createThemeResolver, type ThemeResolver } from '#system/code-engine/theming/index';

import type { ThemeRegistrationResolved } from '../../types';

// The single code-engine-owned theme resolver. It replaces the former hand-rolled
// ResolvedThemes (sync cache) + ResolvingThemes (in-flight dedupe) +
// RegisteredCustomThemes (loader registry) trio with one shared
// resolver: it owns the cache, the concurrent-load
// dedupe, and the name→loader registry internally.
//
// This module is intentionally NOT re-exported from the package index — the
// resolver and the registered-name set are code engine internals. Public callers go
// through the wrapper functions (resolveTheme, getResolvedThemes, etc.) that
// add the code-specific behavior the generic resolver knows nothing about:
// the worker-context guard, Shiki normalization, the bundled-theme fallback,
// and the theme.name validation.
export const themeResolver: ThemeResolver<ThemeRegistrationResolved> =
  createThemeResolver<ThemeRegistrationResolved>();
