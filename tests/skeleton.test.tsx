// @vitest-environment jsdom

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Skeleton } from "../packages/ui/src/components/skeleton";

const source = readFileSync(
  join(process.cwd(), "packages/ui/src/components/skeleton.tsx"),
  "utf8"
);

afterEach(cleanup);

describe("Skeleton", () => {
  it("is a composable, token-native loading placeholder", () => {
    expect(source).toContain('data-slot="skeleton"');
    expect(source).toContain("animate-pulse");
    expect(source).toContain("bg-emphasis");
    expect(source).toContain("motion-reduce:animate-none");
    expect(source).toContain("className");
  });

  it("is decorative by default without preventing an explicit override", () => {
    expect(source).toContain('"aria-hidden": ariaHidden = true');
    expect(source).toContain("aria-hidden={ariaHidden}");
  });

  it("renders its token-native, decorative defaults at runtime", () => {
    const { rerender } = render(<Skeleton className="h-4 w-24" />);
    const placeholder = document.querySelector<HTMLElement>(
      '[data-slot="skeleton"]'
    );

    expect(placeholder).not.toBeNull();
    expect(placeholder?.getAttribute("aria-hidden")).toBe("true");
    expect(placeholder?.className).toContain("bg-emphasis");
    expect(placeholder?.className).toContain("motion-reduce:animate-none");
    expect(placeholder?.className).toContain("h-4");

    rerender(<Skeleton aria-hidden={false} />);
    expect(placeholder?.getAttribute("aria-hidden")).toBe("false");
  });

  it("does not hard-code visual colors", () => {
    expect(source).not.toMatch(/#[0-9a-f]{3,8}\b/i);
    expect(source).not.toMatch(/\b(?:rgb|hsl|oklch)\(/i);
  });
});
