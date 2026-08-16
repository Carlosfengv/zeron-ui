import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const source = readFileSync(
  join(ROOT, "packages/ui/src/components/inline-notice.tsx"),
  "utf8"
);
const badgeSource = readFileSync(
  join(ROOT, "packages/ui/src/components/badge.tsx"),
  "utf8"
);
const badgeColorsSource = readFileSync(
  join(ROOT, "packages/ui/src/components/badge-colors.ts"),
  "utf8"
);
const packageJson = JSON.parse(
  readFileSync(join(ROOT, "packages/ui/package.json"), "utf8")
);
const registry = JSON.parse(
  readFileSync(join(ROOT, "packages/ui/registry.json"), "utf8")
);

describe("InlineNotice contract", () => {
  it("is publicly exported and installable", () => {
    expect(packageJson.exports["./inline-notice"]).toBe(
      "./src/components/inline-notice.tsx"
    );

    expect(
      registry.items.find((entry: { name: string }) => entry.name === "inline-notice")
    ).toMatchObject({
      type: "registry:ui",
      registryDependencies: ["surfaces", "utils", "badge"],
      files: [
        {
          path: "packages/ui/src/components/inline-notice.tsx",
          target: "components/ui/inline-notice.tsx",
        },
      ],
    });
  });

  it("defaults to subtle and makes semantic emphasis explicit", () => {
    for (const tone of ["neutral", "info", "success", "warning", "danger"]) {
      expect(source).toContain(`${tone}:`);
    }

    expect(source).toContain('variant?: "subtle"');
    expect(source).toContain('variant: "emphasized"');
    expect(source).toContain('tone: InlineNoticeTone');
    expect(source).toContain('variant = "subtle"');
    expect(source).toContain('"bg-surface-raised text-fg-default"');
    expect(source).toContain('data-variant={variant}');
    expect(source).toContain('data-slot="inline-notice"');
    expect(source).not.toContain('data-slot="inline-notice-badge"');
    expect(source).toContain('data-slot="inline-notice-content"');
    expect(source).toContain('data-slot="inline-notice-action"');
    expect(source).toContain("ComponentPropsWithoutRef<\"span\">");
  });

  it("composes Badge statuses without implicit live regions", () => {
    expect(badgeColorsSource).toContain('export type BadgeStatus = "danger" | "warning" | "success" | "info" | "neutral"');
    expect(badgeColorsSource).toContain('success: { foreground: "var(--fg-success)"');
    expect(source).not.toContain("role={role");
    expect(source).not.toContain("role={tone");
    expect(badgeSource).not.toContain('role={status ? "status" : undefined}');
    expect(source).toContain("{...props}");
    expect(source).toContain("consumers opt into live-region semantics");
  });
});
