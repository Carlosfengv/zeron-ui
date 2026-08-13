"use client";

import {
  IconProvider,
  type IconComponent,
  type IconName,
  type IconVariant,
  type IconVariantLoader,
} from "#system/icon-context";
import type { ReactNode } from "react";

const proVariants: IconVariant[] = [
  "stroke-rounded",
  "stroke-standard",
  "bulk-rounded",
  "duotone-rounded",
];

const loadProVariant: IconVariantLoader = async (variant) => {
  switch (variant) {
    case "stroke-standard":
      return (await import("./icon-variants/stroke-standard")).strokeStandardIcons;
    case "bulk-rounded":
      return (await import("./icon-variants/bulk-rounded")).bulkRoundedIcons;
    case "duotone-rounded":
      return (await import("./icon-variants/duotone-rounded")).duotoneRoundedIcons;
  }
};

/** Adds the three licensed HugeIcons styles to the free Stroke Rounded base. */
function ProIconProvider({
  children,
  icons,
}: {
  children: ReactNode;
  icons?: Partial<Record<IconName, IconComponent>>;
}) {
  return (
    <IconProvider
      icons={icons}
      loadVariant={loadProVariant}
      availableVariants={proVariants}
    >
      {children}
    </IconProvider>
  );
}

export { ProIconProvider };
