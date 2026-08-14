import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const UI_ROOT = join(ROOT, "packages/ui/src/components");
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
      if (path.endsWith("/color-picker.tsx") || path.endsWith("/badge-colors.ts")) continue;
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

  it("uses a semantic half-pixel boundary on switches", () => {
    const source = read(join(UI_ROOT, "switch.tsx"));

    expect(source).toContain("border-[0.5px] border-border");
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

  it("keeps keyboard focus visible when invalid controls use danger boundaries", () => {
    for (const path of ["input.tsx", "checkbox.tsx", "radio-group.tsx", "stepper.tsx"]) {
      const source = read(join(UI_ROOT, path));
      expect(source, path).toContain("aria-invalid:focus-visible:outline-focus-ring");
    }

    const inputGroup = read(join(UI_ROOT, "input-group.tsx"));
    expect(inputGroup).toContain("has-aria-invalid:has-[[data-slot=input-group-control]:focus-visible]:outline-focus-ring");
    expect(inputGroup).toContain("outline-focus-ring outline-offset-2");
  });

  it("uses selection, rather than active, for persistent table and grid selection", () => {
    const dataTable = read(join(UI_ROOT, "data-table.tsx"));
    const gridRow = read(join(UI_ROOT, "data-grid/data-grid-row.tsx"));
    const gridCell = read(join(UI_ROOT, "data-grid/data-grid-cell-wrapper.tsx"));

    expect(dataTable).toContain("data-[state=selected]:bg-selection");
    expect(dataTable).toContain("linear-gradient(var(--selection), var(--selection))");
    expect(dataTable).not.toContain("data-[state=selected]:bg-active");
    expect(gridRow).toContain('"bg-selection": isRowSelected');
    expect(gridRow).not.toContain('"bg-active": isRowSelected');
    expect(gridCell).toContain("(isSelected && !isEditing)");
    expect(gridCell).not.toContain('"bg-active": isSelected && !isEditing');
  });

  it("keeps pinned and unpinned data-table surfaces visually consistent", () => {
    const dataTable = read(join(UI_ROOT, "data-table.tsx"));

    expect(dataTable).toContain("border-border bg-surface-floating");
    expect(dataTable).toContain('className="h-control-md whitespace-nowrap"');
    expect(dataTable).not.toContain('className="h-control-md whitespace-nowrap bg-surface-raised"');
    expect(dataTable).toContain('backgroundColor = "var(--surface-floating)"');
    expect(dataTable).not.toContain('backgroundColor = "var(--surface-raised)"');
    expect(dataTable).not.toContain('backgroundColor = "var(--surface-base)"');
    expect(dataTable).not.toContain("bg-muted/25");
    expect(dataTable).not.toContain("opacity: isPinned");
  });

  it("uses border for input and table structure boundaries", () => {
    const input = read(join(UI_ROOT, "input.tsx"));
    const table = read(join(UI_ROOT, "table.tsx"));
    const dataTable = read(join(UI_ROOT, "data-table.tsx"));
    const dataGrid = read(join(UI_ROOT, "data-grid/data-grid.tsx"));
    const dataGridRow = read(join(UI_ROOT, "data-grid/data-grid-row.tsx"));
    const dataGridPrimitives = read(
      join(UI_ROOT, "data-grid/data-grid-primitives.tsx")
    );

    expect(input).toContain("border border-border bg-transparent");
    expect(table).toContain(
      "group/row relative z-content border-b transition-[border-color] duration-fast"
    );
    expect(table).toContain('"border-border"');
    expect(table).not.toContain("border-border-subtle");
    expect(dataTable).toContain(
      "overflow-hidden border border-border bg-surface-floating"
    );
    expect(dataGrid).toContain(
      "overflow-auto border border-border bg-surface-floating"
    );
    expect(dataGrid).not.toContain("border-border/70");
    expect(dataGrid).not.toContain("border-border-subtle");
    expect(dataGridRow).not.toContain("border-border-subtle");
    expect(dataGridPrimitives).toContain("shrink-0 bg-border");
  });

  it("uses floating surfaces for primary interactive component panels", () => {
    const colorPicker = read(join(UI_ROOT, "color-picker.tsx"));
    const dataGrid = read(join(UI_ROOT, "data-grid/data-grid.tsx"));
    const dataGridRow = read(join(UI_ROOT, "data-grid/data-grid-row.tsx"));
    const dataGridSystem = read(join(ROOT, "packages/ui/src/system/data-grid.ts"));
    const infoItem = read(join(UI_ROOT, "info-item.tsx"));
    const askUserQuestions = read(join(UI_ROOT, "ask-user-questions.tsx"));

    expect(colorPicker).toContain('const pickerSurface = "floating"');
    expect(colorPicker).toContain('const surface = "floating"');
    expect(colorPicker).toContain('surfaceClasses(pickerSurface, "floating")');
    expect(dataGrid).toContain("bg-surface-floating");
    expect(dataGrid).not.toContain("bg-surface-raised");
    expect(dataGridRow).toContain("bg-surface-floating");
    expect(dataGridRow).not.toContain("bg-surface-raised");
    expect(dataGridSystem).toContain('background: "var(--surface-floating)"');
    expect(dataGridSystem).not.toContain('background: "var(--surface-raised)"');
    expect(infoItem).toContain("bg-surface-floating");
    expect(infoItem).not.toContain("bg-surface-raised");
    expect(askUserQuestions).toContain("bg-surface-floating");
  });

  it("uses Tailwind's native rounded scale for component geometry", () => {
    const dropdown = read(join(UI_ROOT, "dropdown.tsx"));
    const menuItem = read(join(UI_ROOT, "menu-item.tsx"));
    const colorPicker = read(join(UI_ROOT, "color-picker.tsx"));
    const pageLayout = read(join(UI_ROOT, "page-layout.tsx"));
    const identityRow = read(join(UI_ROOT, "sidebar-identity-row.tsx"));
    const breadcrumb = read(join(UI_ROOT, "breadcrumb.tsx"));
    const card = read(join(UI_ROOT, "card.tsx"));

    for (const source of [dropdown, menuItem, colorPicker, card]) {
      expect(source).not.toContain("useShape");
      expect(source).not.toContain("shape.");
    }
    expect(pageLayout).toContain("rounded-xl");
    expect(identityRow).toContain("rounded-full");
    expect(identityRow).not.toContain("borderRadius: 6");
    expect(breadcrumb).toContain("rounded-lg");
    expect(breadcrumb).not.toContain("rounded-[4px]");
    expect(card).toContain("rounded-xl");
    expect(card).not.toContain("rounded-[2px]");
  });

  it("uses paired semantic typography and control-height tokens", () => {
    const pairedTypeOverride = /\btext-(?:label|body|title|heading)\b[^"`\n]*\bleading-(?:snug|tight|normal|relaxed)\b|\bleading-(?:snug|tight|normal|relaxed)\b[^"`\n]*\btext-(?:label|body|title|heading)\b/;

    for (const path of componentFiles()) {
      expect(read(path), path).not.toMatch(pairedTypeOverride);
    }

    const inputGroup = read(join(UI_ROOT, "input-group.tsx"));
    const shortcuts = read(join(UI_ROOT, "data-grid/data-grid-keyboard-shortcuts.tsx"));
    expect(inputGroup).toContain('xs: "h-control-xs');
    expect(inputGroup).toContain('"icon-xs": "size-control-xs');
    expect(shortcuts).toContain('className="h-control-sm pl-8"');
  });

  it("keeps input and input-group surfaces flat", () => {
    const input = read(join(UI_ROOT, "input.tsx"));
    const inputGroup = read(join(UI_ROOT, "input-group.tsx"));

    expect(input).not.toContain("shadow-control");
    expect(inputGroup).not.toContain("shadow-control");
    expect(input).toContain("focus-visible:ring-1 focus-visible:ring-focus-ring");
    expect(inputGroup).toContain(
      "has-[[data-slot=input-group-control]:focus-visible]:ring-1",
    );
  });

  it("uses medium emphasis for checked checkbox-item labels", () => {
    const checkboxGroup = read(join(UI_ROOT, "checkbox-group.tsx"));

    expect(checkboxGroup).toContain(
      'checked ? "font-medium" : "font-normal"',
    );
    expect(checkboxGroup).toContain("invisible font-medium");
    expect(checkboxGroup).not.toContain(
      'checked ? "font-semibold" : "font-normal"',
    );
  });

  it("keeps categorical and status badges separate", () => {
    const source = read(join(UI_ROOT, "badge.tsx"));
    const colors = read(join(UI_ROOT, "badge-colors.ts"));
    expect(source).toContain("badgeCategoricalTokens");
    expect(source).toContain("badgeStatusTokens");
    expect(colors).toContain("var(--warning-surface)");
    expect(colors).toContain("var(--danger-surface)");
    expect(colors).toContain("var(--info-surface)");
    expect(colors).toContain("var(--neutral-status-surface)");
  });
});
