import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  registryCssRules,
  registryCssVars,
  renderDocumentation,
  renderGlobalsBlock,
  renderRuntimeTokens,
} from "../scripts/generate-semantic-tokens.mjs";
import {
  foregroundColorTokens,
  fillColorTokens,
  interactionOverlayRgb,
  semanticTokens,
  shadowTokens,
  surfaceTokens,
  typographyTokens,
} from "../src/system/tokens/semantic-tokens.mjs";

function relativeLuminance(hex) {
  const channels = [1, 3, 5].map((index) =>
    Number.parseInt(hex.slice(index, index + 2), 16) / 255
  );
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  );
  return red * 0.2126 + green * 0.7152 + blue * 0.0722;
}

function contrastRatio(foreground, background) {
  const values = [relativeLuminance(foreground), relativeLuminance(background)]
    .sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

function tokenByName(tokens, name) {
  const token = tokens.find((candidate) => candidate.name === name);
  if (!token) throw new Error(`Missing token: ${name}`);
  return token;
}

const ROOT = new URL("..", import.meta.url).pathname;
const read = (path) => readFileSync(join(ROOT, path), "utf8");
const registry = JSON.parse(read("registry.json"));

describe("semantic token generation", () => {
  it("sets a 14px document default without changing the rem-based type scale", () => {
    const styles = read("app/globals.css");
    const sharedRules = styles.match(/html, body\s*\{(?<rules>[^}]*)\}/)
      ?.groups?.rules;

    expect(styles).toMatch(/^body\s*\{[^}]*font-size:\s*0\.875rem;/m);
    expect(sharedRules).not.toContain("font-size");
  });

  it("uses 14px / 20px for the default component text token", () => {
    expect(typographyTokens.find(({ name }) => name === "body-sm")).toMatchObject({
      px: 14,
      linePx: 20,
    });
  });

  it("keeps the generated globals.css block in sync with the token source", () => {
    expect(read("app/globals.css")).toContain(renderGlobalsBlock());
  });

  it("keeps the registry theme in sync with the token source", () => {
    const theme = registry.items.find((item) => item.name === "surfaces");
    expect(theme.cssVars).toEqual(registryCssVars());
    expect(theme.css).toEqual(registryCssRules());
  });

  it("publishes semantic surface and shadow roles as direct theme values", () => {
    const { theme, light, dark } = registryCssVars();

    expect(theme).toMatchObject({
      "color-surface-base": "var(--surface-base)",
      "color-surface-raised": "var(--surface-raised)",
      "color-surface-floating": "var(--surface-floating)",
      "color-surface-overlay": "var(--surface-overlay)",
      "color-surface-top": "var(--surface-top)",
      "shadow-raised": "var(--shadow-raised)",
      "shadow-floating": "var(--shadow-floating)",
      "shadow-overlay": "var(--shadow-overlay)",
    });
    expect(light).toMatchObject({
      ...Object.fromEntries(
        surfaceTokens.map((token) => [`surface-${token.name}`, token.light]),
      ),
      ...Object.fromEntries(
        shadowTokens.map((token) => [`shadow-${token.name}`, token.light]),
      ),
    });
    expect(dark).toMatchObject({
      ...Object.fromEntries(
        surfaceTokens.map((token) => [`surface-${token.name}`, token.dark]),
      ),
      ...Object.fromEntries(
        shadowTokens.map((token) => [`shadow-${token.name}`, token.dark]),
      ),
    });
    expect(renderGlobalsBlock()).toContain("--background: var(--surface-base);");
    expect(renderGlobalsBlock()).toContain("--card: var(--surface-raised);");
  });

  it("keeps readable foreground levels accessible on every surface", () => {
    for (const mode of ["light", "dark"]) {
      for (const name of ["fg-default", "fg-muted", "fg-subtle"]) {
        const foreground = tokenByName(foregroundColorTokens, name)[mode];
        for (const surface of surfaceTokens) {
          expect(
            contrastRatio(foreground, surface[mode]),
            `${name} must remain readable on surface-${surface.name} in ${mode}`
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  it("keeps filled actions paired with accessible on-colors", () => {
    const pairs = [
      ["fg-on-brand", ["brand", "brand-hover", "brand-active"]],
      ["fg-on-danger", ["destructive", "destructive-hover", "destructive-active"]],
      ["fg-on-inverse", ["inverse-background"]],
    ];

    for (const mode of ["light", "dark"]) {
      for (const [foregroundName, fillNames] of pairs) {
        for (const fillName of fillNames) {
          const foreground = tokenByName(foregroundColorTokens, foregroundName)[mode];
          const rawBackground = tokenByName(fillColorTokens, fillName)[mode];
          const background = rawBackground === "var(--fg-default)"
            ? tokenByName(foregroundColorTokens, "fg-default")[mode]
            : rawBackground;
          expect(
            contrastRatio(foreground, background),
            `${foregroundName} must remain readable on ${fillName} in ${mode}`
          ).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  });

  it("publishes absolute semantic color values without CSS color mixing", () => {
    const generated = [
      renderGlobalsBlock(),
      JSON.stringify(registryCssVars()),
      renderDocumentation(),
    ].join("\n");
    expect(generated).not.toContain(["color", "mix("].join("-"));
  });

  it("publishes the foreground vocabulary without legacy content-color names", () => {
    expect(foregroundColorTokens.map(({ name }) => name)).toEqual([
      "fg-default",
      "fg-muted",
      "fg-subtle",
      "fg-disabled",
      "fg-brand",
      "fg-danger",
      "fg-on-brand",
      "fg-on-danger",
      "fg-on-inverse",
    ]);

    const generated = [
      renderGlobalsBlock(),
      JSON.stringify(registryCssVars()),
      renderDocumentation(),
    ].join("\n");
    expect(generated).not.toMatch(/content-(?:primary|secondary|tertiary|disabled|brand|danger|on-)/);
  });

  it("keeps the interaction overlay RGB private and mode-aware", () => {
    const { theme, light, dark } = registryCssVars();
    expect(theme).not.toHaveProperty("color-interaction-overlay-rgb");
    expect(light["interaction-overlay-rgb"]).toBe(interactionOverlayRgb.light);
    expect(dark["interaction-overlay-rgb"]).toBe(interactionOverlayRgb.dark);
    expect(light.overlay).toBe("var(--interaction-overlay-rgb)");
    expect(dark.overlay).toBe("var(--interaction-overlay-rgb)");
  });

  it("does not generate numeric surface or shadow APIs", () => {
    const generated = [
      renderGlobalsBlock(),
      JSON.stringify(registryCssVars()),
      renderDocumentation(),
    ].join("\n");

    expect(generated).not.toMatch(/(?:surface|shadow)-(?:[1-8])\b/);
    expect(generated).not.toContain("shadow-surface-");
  });

  it("uses Tailwind native font weights instead of generated weight tokens", () => {
    const globals = renderGlobalsBlock();
    const cssVars = JSON.stringify(registryCssVars());
    const documentation = renderDocumentation();

    expect(globals).not.toContain("--type-weight-");
    expect(globals).not.toContain("--font-weight-medium");
    expect(cssVars).not.toContain("type-weight-");
    expect(cssVars).not.toContain("font-weight-medium");
    expect(documentation).not.toMatch(/^\| `typography\/font-weight\//m);
    expect(documentation).toContain("| `font-medium` | 500 |");
    expect(documentation).toContain("| `font-semibold` | 600 |");
  });

  it("uses Tailwind native layout spacing instead of generated spacing aliases", () => {
    const globals = renderGlobalsBlock();
    const cssVars = JSON.stringify(registryCssVars());
    const documentation = renderDocumentation();

    expect(semanticTokens).not.toHaveProperty("spacing");
    expect(globals).not.toMatch(/--space-(?:inline|stack|section|page-gutter|control-x)-/);
    expect(globals).not.toMatch(/--spacing-(?:inline|stack|section|page-gutter|control-x)-/);
    expect(cssVars).not.toMatch(/(?:space|spacing)-(?:inline|stack|section|page-gutter|control-x)-/);
    expect(documentation).not.toMatch(/`space\/(?:inline|stack|section|page\/gutter|control\/x)\//);
    expect(documentation).toContain("项目不发布普通间距设计令牌");
    expect(documentation).toContain("| `3` | 12px | `gap-3` / `px-3` |");
  });

  it("ships semantic tokens with every installable UI component", () => {
    for (const item of registry.items.filter((entry) => entry.type === "registry:ui")) {
      expect(item.registryDependencies, item.name).toContain("surfaces");
    }
  });

  it("keeps generated runtime radius values in sync", () => {
    expect(read("src/system/design-tokens.ts")).toBe(renderRuntimeTokens());
  });

  it("keeps the semantic token documentation in sync", () => {
    expect(read("SEMANTIC-TOKENS.md")).toBe(renderDocumentation());
  });
});

describe("component token adoption", () => {
  const componentSource = ["src/components/ui"]
    .flatMap((directory) => {
      return readdirSync(join(ROOT, directory), { withFileTypes: true })
        .filter((entry) => entry.isFile() && entry.name.endsWith(".tsx"))
        .map((entry) => read(`${directory}/${entry.name}`));
    })
    .join("\n");

  it("does not use arbitrary pixel typography", () => {
    expect(componentSource).not.toMatch(/text-\[\d+px\]/);
  });

  it("does not use arbitrary pixel margins, padding, or gaps", () => {
    expect(componentSource).not.toMatch(
      /(?:^|\s)-?(?:m[trblxy]?|p[trblxy]?|gap(?:-[xy])?)-\[-?\d+(?:\.\d+)?px\]/m
    );
  });

  it("uses standard font-weight utilities instead of the variable-font helper", () => {
    expect(componentSource).not.toContain("fontWeights");
    expect(componentSource).not.toContain("fontVariationSettings");
    expect(componentSource).not.toContain("@/lib/font-weight");
    expect(componentSource).not.toContain("font-variation-settings");
  });

  it("does not use legacy numeric control-height utilities", () => {
    expect(componentSource).not.toMatch(/\bh-(?:7|8|9|10)\b/);
  });

  it("does not use numeric global z-index utilities", () => {
    expect(componentSource).not.toMatch(/(?:^|\s)-?z-(?:0|10|20|30|40|50|\[\d+\])/m);
  });

  it("uses semantic shadow roles instead of numeric overrides", () => {
    expect(componentSource).not.toMatch(/\bshadowLevel\s*=/);
    expect(componentSource).not.toMatch(/(?:bg-surface|shadow-surface)-[1-8]\b/);
  });
});
