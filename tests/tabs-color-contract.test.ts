import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (file: string) =>
  fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("Tabs selected color contract", () => {
  const tabs = source("packages/ui/src/components/tabs.tsx");
  const docs = source("docs/pages/components/tabs/page.tsx");

  it("defaults to the brand treatment and exposes neutral and default alternatives", () => {
    expect(tabs).toContain('export type TabsColor = "brand" | "neutral" | "default";');
    expect(tabs).toContain('color = "brand"');
    expect(docs).toContain('{ name: "color", type: \'"brand" | "neutral" | "default"\', default: \'"brand"\'');
  });

  it("pairs each selected background with its semantic foreground", () => {
    expect(tabs).toContain('brand: "bg-brand"');
    expect(tabs).toContain('neutral: "bg-inverse-background"');
    expect(tabs).toContain(
      'default: "border-[0.5px] border-border bg-surface-floating"'
    );
    expect(tabs).toContain('brand: "text-fg-on-brand"');
    expect(tabs).toContain('neutral: "text-fg-on-inverse"');
    expect(tabs).toContain('default: "text-fg-default"');
  });

  it("keeps the default underline treatment linear", () => {
    expect(tabs).toContain('const underlineIndicatorClasses');
    expect(tabs).toContain('default: "bg-fg-default"');
  });

  it("exposes the color choice in the interactive documentation", () => {
    expect(docs).toContain('const [color, setColor] = useState<TabsColor>("brand")');
    expect(docs).toContain('color={color}');
    expect(docs).toContain('{ value: "neutral", label: t("neutral") }');
    expect(docs).toContain('{ value: "default", label: t("default") }');
  });
});
