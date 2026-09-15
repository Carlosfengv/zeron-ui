import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

import {
  mergeBorderWidthTokenNames,
  mergeMotionDurationTokenNames,
} from "#system/tailwind-merge-tokens";

// Tailwind v4 exposes both semantic font sizes and colors through `text-*`
// utilities. tailwind-merge cannot discover custom @theme names at runtime,
// so without this list it treats e.g. `text-body` as a color and removes
// either it or `text-fg-default`, depending on class order.
const mergeTailwindClasses = extendTailwindMerge({
  extend: {
    classGroups: {
      "border-w": [{ border: mergeBorderWidthTokenNames }],
      "border-w-x": [{ "border-x": mergeBorderWidthTokenNames }],
      "border-w-y": [{ "border-y": mergeBorderWidthTokenNames }],
      "border-w-s": [{ "border-s": mergeBorderWidthTokenNames }],
      "border-w-e": [{ "border-e": mergeBorderWidthTokenNames }],
      "border-w-t": [{ "border-t": mergeBorderWidthTokenNames }],
      "border-w-r": [{ "border-r": mergeBorderWidthTokenNames }],
      "border-w-b": [{ "border-b": mergeBorderWidthTokenNames }],
      "border-w-l": [{ "border-l": mergeBorderWidthTokenNames }],
      duration: [{ duration: mergeMotionDurationTokenNames }],
    },
    theme: {
      text: [
        "label",
        "body",
        "title",
        "heading",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return mergeTailwindClasses(clsx(inputs));
}
