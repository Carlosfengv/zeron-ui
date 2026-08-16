import { describe, expect, it } from "vitest";
import {
  controlSizeClasses,
  controlSizeRecipe,
  controlSizes,
} from "../packages/ui/src/tokens/control-size";
import { controlHeightTokens } from "../packages/ui/src/tokens/semantic-tokens.mjs";

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
});
