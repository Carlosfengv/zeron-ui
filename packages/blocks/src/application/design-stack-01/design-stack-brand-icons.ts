import figma from "@thesvg/icons/figma";
import framer from "@thesvg/icons/framer";
import linear from "@thesvg/icons/linear";
import loom from "@thesvg/icons/loom";
import vercel from "@thesvg/icons/vercel";

// Trusted bundled artwork only. Monochrome marks inherit Zeron foreground tokens.
const decorative = (svg: string) => svg.replace(/<title>[\s\S]*?<\/title>/g, "");
const monochrome = (icon: { svg: string; variants: Record<string, string> }) =>
  decorative(icon.variants.mono ?? icon.svg).replace("<svg ", '<svg fill="currentColor" ');

export const designStackBrandIcons: Readonly<Record<string, string | undefined>> = {
  figma: decorative(figma.svg), linear: decorative(linear.svg), loom: decorative(loom.svg),
  framer: monochrome(framer), vercel: monochrome(vercel),
};
