import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(
  join(process.cwd(), "packages/ui/src/components/slider.tsx"),
  "utf8"
);

describe("Slider color contract", () => {
  it("exposes the supported semantic colors and defaults both sliders to brand", () => {
    expect(source).toContain(
      'type SliderColor = "brand" | "nature" | "danger" | "warning"'
    );
    expect(source.match(/color = "brand"/g)).toHaveLength(2);
    expect(source).toContain("SliderColor,");
  });

  it("maps every color to semantic tokens", () => {
    expect(source).toContain('fill: "var(--brand)"');
    expect(source).toContain('fill: "var(--neutral-status-border)"');
    expect(source).toContain('fill: "var(--destructive)"');
    expect(source).toContain('fill: "var(--warning-border)"');
  });

  it("applies the selected color to compact and comfortable fills", () => {
    expect(source).toContain("colorStyle.fillClassName, fillClassName");
    expect(source.match(/backgroundColor: colorStyle\.fill/g)).toHaveLength(2);
    expect(source.match(/color: colorStyle\.onFill/g)).toHaveLength(2);
  });

  it("allows embedded sliders to suppress the temporary hover range", () => {
    expect(source).toContain("showHoverPreview?: boolean;");
    expect(source).toContain("showHoverPreview = true");
    expect(source).toContain("!showHoverPreview || dragging.current");
  });
});
