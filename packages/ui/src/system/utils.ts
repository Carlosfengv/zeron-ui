import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Tailwind v4 exposes both semantic font sizes and colors through `text-*`
// utilities. tailwind-merge cannot discover custom @theme names at runtime,
// so without this list it treats e.g. `text-body` as a color and removes
// either it or `text-fg-default`, depending on class order.
const mergeTailwindClasses = extendTailwindMerge({
  extend: {
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
