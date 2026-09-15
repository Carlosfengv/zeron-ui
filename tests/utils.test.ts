import { describe, expect, it } from "vitest";
import { typographyTokens } from "../packages/ui/src/tokens/semantic-tokens.mjs";
import { cn } from "../packages/ui/src/system/utils";

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

describe("cn semantic border and motion merging", () => {
  it("keeps a hairline width alongside a semantic border color", () => {
    expect(cn("border-hairline", "border-border")).toBe(
      "border-hairline border-border"
    );
    expect(cn("border-t-hairline", "border-t-border")).toBe(
      "border-t-hairline border-t-border"
    );
  });

  it("lets later widths override earlier widths", () => {
    expect(cn("border-hairline", "border-2")).toBe("border-2");
    expect(cn("border-2", "border-hairline")).toBe("border-hairline");
    expect(cn("sm:border-l-hairline", "sm:border-l-2")).toBe("sm:border-l-2");
  });

  it("lets later semantic and native durations override each other", () => {
    expect(cn("duration-fast", "duration-300")).toBe("duration-300");
    expect(cn("duration-300", "duration-fast")).toBe("duration-fast");
    expect(cn("data-open:duration-moderate", "data-open:duration-slow")).toBe(
      "data-open:duration-slow"
    );
  });
});
