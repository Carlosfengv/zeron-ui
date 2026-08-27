import "server-only";

import type { DocPageLoader } from "./page-loader-types";

export const iconPageLoaders: Record<string, DocPageLoader> = {
  "icons/catalog": () => import("@docs/pages/icons/catalog/page"),
  "icons/overview": () => import("@docs/pages/icons/overview/page"),
  "icons/providers": () => import("@docs/pages/icons/providers/page"),
  "icons/usage": () => import("@docs/pages/icons/usage/page"),
};
