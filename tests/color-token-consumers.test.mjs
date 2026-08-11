import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const UI_ROOT = join(ROOT, "src/components/ui");
const PALETTE_UTILITY = /\b(?:bg|text|border|ring|outline|fill|stroke)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-[0-9]{2,3}\b|\b(?:bg|text|border|ring|outline|fill|stroke)-(?:white|black)\b/;
const RAW_COLOR = /#[0-9a-fA-F]{3,8}\b|\b(?:rgb|rgba|hsl|hsla)\((?!var\(--)/;
const LEGACY_COLOR_UTILITY = /\b(?:bg|text|border|fill|stroke|ring|outline|decoration|ring-offset|from|to|via)-(?:background|foreground|card|card-foreground|muted-foreground|accent|accent-hover|accent-active|accent-subtlest|accent-subtle|accent-foreground|selected|brand-foreground|destructive-subtle|destructive-light|destructive-foreground)(?:\/|\b)/;
const LEGACY_COLOR_VARIABLE = /--(?:background|foreground|card|card-foreground|muted-foreground|accent|accent-hover|accent-active|accent-subtlest|accent-subtle|accent-foreground|selected|brand-foreground|destructive-subtle|destructive-light|destructive-foreground)\b/;

function componentFiles(directory = UI_ROOT) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return componentFiles(path);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

const read = (path) => readFileSync(path, "utf8");

describe("semantic color consumers", () => {
  it("keeps raw palettes out of core components", () => {
    for (const path of componentFiles()) {
      if (path.endsWith("/color-picker.tsx")) continue;
      const source = read(path);
      expect(source, path).not.toMatch(PALETTE_UTILITY);
      expect(source, path).not.toMatch(RAW_COLOR);
    }
  });

  it("uses the secondary action fill with the default foreground", () => {
    const source = read(join(UI_ROOT, "button.tsx"));
    expect(source).toContain("bg-secondary-action");
    expect(source).toContain("text-fg-default");
    expect(source).not.toContain("bg-accent");
  });

  it("does not use retired compatibility color names", () => {
    for (const path of componentFiles()) {
      const source = read(path);
      expect(source, path).not.toMatch(LEGACY_COLOR_UTILITY);
      expect(source, path).not.toMatch(LEGACY_COLOR_VARIABLE);
    }
  });

  it("uses danger status tokens for invalid form controls", () => {
    for (const path of ["input.tsx", "select.tsx", "checkbox.tsx", "radio-group.tsx", "input-group.tsx"]) {
      const source = read(join(UI_ROOT, path));
      expect(source, path).toContain("danger-border");
      expect(source, path).not.toMatch(/aria-invalid:(?:border|ring)-destructive/);
    }
  });

  it("keeps categorical and status badges separate", () => {
    const source = read(join(UI_ROOT, "badge.tsx"));
    expect(source).toContain("categoricalColors");
    expect(source).toContain('type BadgeStatus = "danger" | "warning"');
    expect(source).toContain("var(--warning-surface)");
    expect(source).toContain("var(--danger-surface)");
  });
});
