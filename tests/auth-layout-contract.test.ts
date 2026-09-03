import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const source = readFileSync(
  join(ROOT, "packages/ui/src/components/auth-layout.tsx"),
  "utf8"
);
const packageJson = JSON.parse(
  readFileSync(join(ROOT, "packages/ui/package.json"), "utf8")
);
const registry = JSON.parse(
  readFileSync(join(ROOT, "packages/ui/registry.json"), "utf8")
);

describe("AuthLayout contract", () => {
  it("is publicly exported and installable from the UI registry", () => {
    expect(packageJson.exports["./auth-layout"]).toBe(
      "./src/components/auth-layout.tsx"
    );

    const item = registry.items.find(
      (entry: { name: string }) => entry.name === "auth-layout"
    );
    expect(item).toMatchObject({
      type: "registry:ui",
      dependencies: ["class-variance-authority", "tw-animate-css"],
      registryDependencies: ["surfaces", "utils"],
    });
    expect(item.files).toHaveLength(1);
  });

  it("provides the complete compositional anatomy", () => {
    for (const slot of [
      "auth-layout",
      "auth-layout-content",
      "auth-layout-header",
      "auth-layout-body",
      "auth-layout-footer",
    ]) {
      expect(source).toContain(`data-slot="${slot}"`);
    }
  });

  it("supports common authentication widths and robust viewport centering", () => {
    expect(source).toContain('export type AuthLayoutSize = "sm" | "md" | "lg";');
    expect(source).toContain('sm: "max-w-sm"');
    expect(source).toContain('md: "max-w-md"');
    expect(source).toContain('lg: "max-w-xl"');
    expect(source).toContain('"m-auto flex w-full min-w-0 flex-col items-center gap-6"');
    expect(source).toContain("min-h-svh");
    expect(source).toContain("bg-surface-base");
  });

  it("keeps page landmarks explicit and remains token-native", () => {
    expect(source).toContain("landmark?: boolean;");
    expect(source).toContain('const Root = landmark ? "main" : "div";');
    expect(source).not.toMatch(/#[0-9A-Fa-f]{3,8}\b/);
    expect(source).not.toMatch(/rgba?\(/);
  });
});
