import { describe, expect, it } from "vitest";

import {
  resolveSurface,
  surfaceClasses,
} from "../packages/ui/src/system/surface-classes";

describe("semantic surface resolution", () => {
  it("uses the requested role as the minimum elevation", () => {
    expect(resolveSurface("base", "raised")).toBe("raised");
    expect(resolveSurface("base", "floating")).toBe("floating");
    expect(resolveSurface("raised", "floating")).toBe("floating");
    expect(resolveSurface("base", "overlay")).toBe("overlay");
  });

  it("raises nested surfaces and caps them at top", () => {
    expect(resolveSurface("floating", "floating")).toBe("overlay");
    expect(resolveSurface("overlay", "floating")).toBe("top");
    expect(resolveSurface("top", "floating")).toBe("top");
  });

  it("keeps surface and shadow semantics independent", () => {
    expect(surfaceClasses("top", "floating")).toBe(
      "bg-surface-top shadow-floating",
    );
    expect(surfaceClasses("raised")).toBe("bg-surface-raised");
  });
});
