import { describe, expect, it } from "vitest";
import { typographyTokens } from "../src/system/tokens/semantic-tokens.mjs";
import { cn } from "../src/system/utils";

describe("cn semantic typography merging", () => {
  it.each(typographyTokens.map(({ name }) => name))(
    "keeps text-%s alongside a semantic text color",
    (name) => {
      expect(cn(`text-${name}`, "text-foreground")).toBe(
        `text-${name} text-foreground`
      );
      expect(cn("text-muted-foreground", `text-${name}`)).toBe(
        `text-muted-foreground text-${name}`
      );
    }
  );

  it("still lets a later semantic font size override an earlier one", () => {
    expect(cn("text-body", "text-body-sm", "text-foreground")).toBe(
      "text-body-sm text-foreground"
    );
  });

  it("preserves the Button and Select class combinations", () => {
    expect(cn("text-fg-on-brand", "text-body-sm")).toBe(
      "text-fg-on-brand text-body-sm"
    );
    expect(cn("text-body-sm", "text-fg-muted")).toBe(
      "text-body-sm text-fg-muted"
    );
  });
});
