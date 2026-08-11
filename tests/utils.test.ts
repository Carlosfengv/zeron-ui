import { describe, expect, it } from "vitest";
import { typographyTokens } from "../src/system/tokens/semantic-tokens.mjs";
import { cn } from "../src/system/utils";

describe("cn semantic typography merging", () => {
  it.each(typographyTokens.map(({ name }) => name))(
    "keeps text-%s alongside a semantic text color",
    (name) => {
      expect(cn(`text-${name}`, "text-fg-default")).toBe(
        `text-${name} text-fg-default`
      );
      expect(cn("text-fg-muted", `text-${name}`)).toBe(
        `text-fg-muted text-${name}`
      );
    }
  );

  it("still lets a later semantic font size override an earlier one", () => {
    expect(cn("text-label", "text-body", "text-fg-default")).toBe(
      "text-body text-fg-default"
    );
  });

  it("preserves the Button and Select class combinations", () => {
    expect(cn("text-fg-on-brand", "text-body")).toBe(
      "text-fg-on-brand text-body"
    );
    expect(cn("text-body", "text-fg-muted")).toBe(
      "text-body text-fg-muted"
    );
  });
});
