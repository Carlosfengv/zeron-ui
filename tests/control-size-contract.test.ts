import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  controlSizeClasses,
  controlSizeRecipe,
  controlSizes,
} from "../packages/ui/src/tokens/control-size";
import { controlHeightTokens } from "../packages/ui/src/tokens/semantic-tokens.mjs";
import { cn } from "@zeron/ui/system/utils";

const ROOT = new URL("..", import.meta.url).pathname;
const buttonSource = readFileSync(
  join(ROOT, "packages/ui/src/components/button.tsx"),
  "utf8"
);

describe("Control Size contract", () => {
  it("uses md as the 32px system default in a four-pixel visual scale", () => {
    expect(controlSizes).toEqual(["xs", "sm", "md", "lg", "xl"]);
    expect(controlHeightTokens.map(({ name, px }) => [name, px])).toEqual([
      ["xs", 24],
      ["sm", 28],
      ["md", 32],
      ["lg", 36],
      ["xl", 40],
    ]);
    expect(Object.fromEntries(
      controlSizes.map((size) => [size, controlSizeRecipe[size].height])
    )).toEqual({ xs: 24, sm: 28, md: 32, lg: 36, xl: 40 });
  });

  it("keeps API and Tailwind suffixes aligned", () => {
    expect(controlSizeClasses).toEqual({
      xs: "h-control-xs",
      sm: "h-control-sm",
      md: "h-control-md",
      lg: "h-control-lg",
      xl: "h-control-xl",
    });
  });

  it("merges semantic and standard height classes in the same group", () => {
    expect(cn("h-control-md", "h-auto")).toBe("h-auto");
    expect(cn("min-h-control-sm h-badge-md", "min-h-0")).toBe("h-badge-md min-h-0");
    expect(cn("h-auto min-h-0", "h-badge-sm min-h-badge-lg")).toBe("h-badge-sm min-h-badge-lg");
    expect(cn("h-control-xl sm:h-control-lg", "sm:h-auto")).toBe("h-control-xl sm:h-auto");
  });

  it("uses the specified icon sizes in small icon-only buttons", () => {
    expect(buttonSource).toContain("const iconOnlyIconSizeClasses");
    expect(buttonSource).toMatch(
      /xs: "\[&_svg\]:size-4"[\s\S]*?sm: "\[&_svg\]:size-4"[\s\S]*?md: "\[&_svg\]:size-5"/
    );
    expect(buttonSource).toContain(
      "iconOnlyIconSizeClasses[resolvedSize]"
    );
  });
});
