import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const source = readFileSync(
  join(ROOT, "packages/ui/src/components/empty.tsx"),
  "utf8"
);
const packageJson = JSON.parse(
  readFileSync(join(ROOT, "packages/ui/package.json"), "utf8")
);
const registry = JSON.parse(
  readFileSync(join(ROOT, "packages/ui/registry.json"), "utf8")
);

describe("Empty contract", () => {
  it("is publicly exported and installable", () => {
    expect(packageJson.exports["./empty"]).toBe(
      "./src/components/empty.tsx"
    );
    expect(
      registry.items.find((entry: { name: string }) => entry.name === "empty")
    ).toMatchObject({
      type: "registry:ui",
      registryDependencies: ["surfaces", "utils"],
      files: [
        {
          path: "packages/ui/src/components/empty.tsx",
          target: "components/ui/empty.tsx",
        },
      ],
    });
  });

  it("separates reason, scope, density, and alignment", () => {
    for (const reason of [
      "first-use",
      "no-data",
      "no-results",
      "no-filter-results",
      "no-condition-results",
      "empty-group",
      "informational",
    ]) {
      expect(source).toContain(`| "${reason}"`);
    }
    expect(source).toContain('export type EmptyScope = "page" | "section" | "inline"');
    expect(source).toContain('export type EmptyDensity = "compact" | "default" | "comfortable"');
    expect(source).toContain('export type EmptyAlign = "center" | "start"');
    expect(source).toContain('data-reason={reason}');
    expect(source).toContain('data-scope={scope}');
    expect(source).toContain('as?: "h2" | "h3" | "h4"');
  });

  it("keeps live-region semantics opt in", () => {
    expect(source).toContain("announce = false");
    expect(source).toContain('role={role ?? (announce ? "status" : undefined)}');
    expect(source).toContain('ariaLive ?? (announce ? "polite" : undefined)');
    expect(source).not.toContain('role="alert"');
  });

  it("provides composable parts and theme-aware built-in illustrations", () => {
    for (const slot of [
      "empty-media",
      "empty-header",
      "empty-title",
      "empty-description",
      "empty-content",
      "empty-actions",
      "empty-help",
      "empty-illustration",
    ]) {
      expect(source).toContain(`data-slot="${slot}"`);
    }
    for (const variant of [
      "general",
      "resources",
      "preview",
      "search",
      "filter",
      "inbox",
      "analytics",
    ]) {
      expect(source).toContain(`| "${variant}"`);
    }
    expect(source).toContain('fill="var(--surface-raised)"');
    expect(source).toContain('fill="var(--surface-floating)"');
    expect(source).toContain('fill="var(--emphasis)"');
    expect(source).toContain('fill="var(--brand)"');
    expect(source).toContain('? "0 0 208 96"');
    expect(source).toContain('? "0 0 224 112"');
    expect(source).toContain('? "0 0 72 80"');
    expect(source).toContain('viewBox={viewBox}');
    expect(source).toContain("const generalMaskId");
    expect(source).toContain("const previewClipId");
    expect(source).toContain('data-slot="empty-illustration-media"');
    expect(source).toContain("matrix(0.3091312 -0.15753973");
    expect(source).toContain("<foreignObject");
    expect(source).toContain('stroke="var(--border-subtle)"');
  });

  it("keeps page and section illustrations at a restrained default size", () => {
    expect(source).toContain(
      '"h-auto w-40 max-w-full [&_svg]:h-auto [&_svg]:w-full"'
    );
  });
});
