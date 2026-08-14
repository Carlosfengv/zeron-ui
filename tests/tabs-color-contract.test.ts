import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (file: string) =>
  fs.readFileSync(path.join(process.cwd(), file), "utf8");

describe("Tabs selected color contract", () => {
  const tabs = source("packages/ui/src/components/tabs.tsx");
  const docs = source("docs/pages/components/tabs/page.tsx");

  it("defaults to the brand treatment and exposes a neutral alternative", () => {
    expect(tabs).toContain('export type TabsColor = "brand" | "neutral";');
    expect(tabs).toContain('color = "brand"');
    expect(docs).toContain('{ name: "color", type: \'"brand" | "neutral"\', default: \'"brand"\'');
  });

  it("pairs each selected background with its semantic foreground", () => {
    expect(tabs).toContain(
      'color === "neutral" ? "bg-inverse-background" : "bg-brand"'
    );
    expect(tabs).toContain('color === "neutral"');
    expect(tabs).toContain('"text-fg-on-inverse"');
    expect(tabs).toContain('"text-fg-on-brand"');
  });

  it("exposes the color choice in the interactive documentation", () => {
    expect(docs).toContain('const [color, setColor] = useState<TabsColor>("brand")');
    expect(docs).toContain('color={color}');
    expect(docs).toContain('{ value: "neutral", label: t("neutral") }');
  });
});
