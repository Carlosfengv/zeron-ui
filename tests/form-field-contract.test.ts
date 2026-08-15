import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const readSource = (name: string) =>
  readFileSync(join(ROOT, `packages/ui/src/components/${name}.tsx`), "utf8");
const fieldSource = readSource("field");
const inputSource = readSource("input");
const inputGroupSource = readSource("input-group");
const switchSource = readSource("switch");
const textareaSource = readSource("textarea");
const packageJson = JSON.parse(
  readFileSync(join(ROOT, "packages/ui/package.json"), "utf8")
);
const registry = JSON.parse(
  readFileSync(join(ROOT, "packages/ui/registry.json"), "utf8")
);

describe("form field primitives contract", () => {
  it("exports and registers Field and Textarea", () => {
    expect(packageJson.exports["./field"]).toBe("./src/components/field.tsx");
    expect(packageJson.exports["./textarea"]).toBe("./src/components/textarea.tsx");

    expect(registry.items.find((item: { name: string }) => item.name === "field"))
      .toMatchObject({ type: "registry:ui", dependencies: ["@base-ui/react", "tw-animate-css"] });
    expect(registry.items.find((item: { name: string }) => item.name === "textarea"))
      .toMatchObject({
        type: "registry:ui",
        dependencies: ["@base-ui/react", "class-variance-authority", "tw-animate-css"],
      });
  });

  it("shares Base UI Field semantics across text controls", () => {
    expect(fieldSource).toContain("FieldPrimitive.Root");
    expect(fieldSource).toContain("FieldPrimitive.Label");
    expect(fieldSource).toContain("FieldPrimitive.Description");
    expect(fieldSource).toContain("FieldPrimitive.Error");
    expect(inputSource).toContain("@base-ui/react/input");
    expect(textareaSource).toContain("FieldPrimitive.Control");
    expect(textareaSource).toContain("render={<textarea />}");
  });

  it("keeps the default InputGroup on the md control-height token", () => {
    expect(inputGroupSource).toContain("flex h-control-sm w-full");
    expect(inputGroupSource).toContain("h-full !min-h-0 flex-1 rounded-none");
    expect(inputGroupSource).toContain("has-[textarea]:h-auto");
  });

  it("keeps validation semantics on the control while the InputGroup owns the frame", () => {
    expect(inputGroupSource).toContain("has-aria-invalid:border-danger-border");
    expect(inputGroupSource).toContain("aria-invalid:border-0");
    expect(inputGroupSource).toContain("aria-invalid:ring-0");
    expect(inputGroupSource).toContain("aria-invalid:focus-visible:outline-0");
  });

  it("gives Switch controlled, uncontrolled, and native form APIs", () => {
    expect(switchSource).toContain("defaultChecked?: boolean");
    expect(switchSource).toContain("onCheckedChange?: (checked: boolean) => void");
    expect(switchSource).toContain("name?: string");
    expect(switchSource).toContain("required?: boolean");
    expect(switchSource).toContain("uncheckedValue?: string");
  });

  it("uses semantic styles without literal colors", () => {
    for (const source of [
      fieldSource,
      inputSource,
      inputGroupSource,
      textareaSource,
      switchSource,
    ]) {
      expect(source).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
    }
    expect(fieldSource).toContain("text-fg-danger");
    expect(fieldSource.match(/px-1\.5 text-body font-medium text-fg-muted/g)).toHaveLength(2);
    expect(fieldSource).toContain("px-1.5 text-label text-fg-subtle");
    expect(textareaSource).toContain("focus-visible:ring-focus-ring");
    expect(textareaSource).toContain("border-input");
  });
});
