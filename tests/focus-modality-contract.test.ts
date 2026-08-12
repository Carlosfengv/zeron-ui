import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (file: string) =>
  fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("focus modality contract", () => {
  const inputGroup = source("src/components/ui/input-group.tsx");
  const calendar = source("src/components/ui/data-grid/data-grid-calendar.tsx");
  const colorPicker = source("src/components/ui/color-picker.tsx");
  const preview = source("src/docs/ComponentPreview.tsx");
  const navMenu = source("src/components/ui/nav-menu.tsx");
  const sidebar = source("src/components/ui/sidebar.tsx");
  const tokenSource = source("src/system/tokens/semantic-tokens.mjs");

  it("uses focus-visible for action primitives instead of focus:ring", () => {
    for (const file of [
      "src/components/ui/button.tsx",
      "src/components/ui/checkbox.tsx",
      "src/components/ui/radio-group.tsx",
      "src/components/ui/switch.tsx",
      "src/components/ui/select.tsx",
    ]) {
      const component = source(file);
      expect(component).toContain("focus-visible:ring");
      expect(component).not.toMatch(/(?<!visible:)focus:ring-/);
    }
  });

  it("binds compound editing rings to explicit focus-visible controls", () => {
    expect(inputGroup).toContain(
      "has-[[data-slot=input-group-control]:focus-visible]:ring-1"
    );
    expect(inputGroup).not.toContain("focus-within:ring-focus-ring");
    expect(calendar).toContain("has-[select:focus-visible]:ring-1");
    expect(calendar).not.toContain("has-focus:ring-focus-ring");
    expect(colorPicker).toContain('data-slot="color-input-control"');
    expect(colorPicker).toContain(
      "has-[[data-slot=color-input-control]:focus-visible]:ring-1"
    );
  });

  it("does not route empty preview clicks into the first control", () => {
    expect(preview).not.toContain("routeKeyboardOnMouseDown");
    expect(preview).not.toContain("onMouseDown={handlePreviewMouseDown}");
    expect(preview).toContain("has-[:focus-visible]:border-fg-default/40");
    expect(fs.existsSync(path.join(process.cwd(), "src/docs/click-to-focus.ts"))).toBe(false);
  });

  it("gates the NavMenu moving indicator to visible primary focus", () => {
    expect(navMenu).toContain('[data-slot="nav-item-trigger"]:focus-visible');
    expect(navMenu).toContain("onPointerDownCapture={(event) => {");
    expect(navMenu).toContain('trigger?.matches(":focus-visible")');
    expect(navMenu).toContain("if (!trigger?.matches(\":focus-visible\")) setFocusedId(null);");
  });

  it("records compact-drawer final focus only for the next open session", () => {
    expect(sidebar).toContain("const finalFocusPreparedRef = useRef(false);");
    expect(sidebar).toContain("if (!finalFocusPreparedRef.current) triggerRef.current = null;");
    expect(sidebar).toContain("if (isMobile && !mobileOpen) setActiveTrigger(event.currentTarget);");
    expect(sidebar).toContain("activeElement !== document.body");
  });

  it("keeps focus-ring wording aligned in its source and localized docs", () => {
    const en = JSON.parse(source("messages/en/docs/semantic-tokens.json"));
    const zh = JSON.parse(source("messages/zh-CN/docs/semantic-tokens.json"));

    expect(tokenSource).toContain('usage: "可见焦点指示器');
    expect(en.semanticTokens.boundariesBody).toContain("visible focus");
    expect(en.semanticTokens.boundariesBody).toContain(":focus-visible");
    expect(zh.semanticTokens.boundariesBody).toContain("可见焦点");
    expect(zh.semanticTokens.boundariesBody).toContain(":focus-visible");
  });
});
