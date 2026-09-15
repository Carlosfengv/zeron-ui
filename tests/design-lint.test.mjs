import { readFileSync } from "node:fs";
import { ESLint } from "eslint";
import parser from "@typescript-eslint/parser";
import { describe, expect, it } from "vitest";
import {
  borderWidthClasses,
  createZeronConfig,
  controlSizes,
  shadowClasses,
  stateMarkerClasses,
  restyleCategories,
  typographyClasses,
} from "../packages/lint/index.mjs";
import {
  borderWidthTokens,
  shadowTokens,
  typographyTokens,
} from "../packages/ui/src/tokens/semantic-tokens.mjs";

function linter({ strict = false, unknown = false } = {}) {
  return new ESLint({
    overrideConfigFile: true,
    overrideConfig: [
      { files: ["**/*.{ts,tsx}"], languageOptions: { parser } },
      ...createZeronConfig({
        strict,
        componentFiles: ["packages/ui/src/**/*.{ts,tsx}"],
        paletteFiles: ["packages/ui/src/components/color-picker.tsx"],
      }),
      ...(!unknown ? [{ rules: { "shadcn/no-unknown-classes": "off" } }] : []),
    ],
  });
}

async function messages(code, options, filePath = "app/design-lint-probe.tsx") {
  const [result] = await linter(options).lintText(code, { filePath });
  return result.messages;
}

describe("Zeron design lint", () => {
  it("accepts semantic tokens and public size/variant props", async () => {
    expect(await messages(`
      import { Button } from "@zeron/ui/button";
      export const Page = () => <div className="bg-surface-floating text-fg-default">
        <Button size="lg" variant="primary" className="mt-4 w-full" />
      </div>;
    `)).toEqual([]);
  });

  it("protects control height and padding through renamed imports and cn", async () => {
    const found = await messages(`
      import { Button as Action } from "@zeron/ui/button";
      const cn = (...args: string[]) => args.join(" ");
      export const Page = () => <Action className={cn("md:h-20", "hover:p-4")} />;
    `);
    expect(found).toHaveLength(2);
    expect(found.every(({ ruleId }) => ruleId === "shadcn/no-restyle")).toBe(true);
    expect(found.every(({ message }) => message.includes("xs, sm, md, lg, xl"))).toBe(true);
  });

  it("directs SelectTrigger sizing to the parent Select", async () => {
    const found = await messages(`
      import { SelectTrigger } from "@zeron/ui/select";
      export const Page = () => <SelectTrigger className="h-20" />;
    `);
    expect(found).toHaveLength(1);
    expect(found[0].message).toContain("parent Select");
  });

  it("lets public content regions own their presentation", async () => {
    const code = `import { PageBody } from "@zeron/ui/page-layout";
      export const Page = () => <PageBody className="p-4 gap-2" />;`;
    expect(await messages(code)).toEqual([]);
    expect(await messages(code.replace("p-4 gap-2", "bg-surface-raised"))).toEqual([]);
  });

  it("allows public presentation slots while preserving explicit contracts", async () => {
    expect(await messages(`
      import { TableCell } from "@zeron/ui/table";
      import { Card } from "@zeron/ui/card";
      export const Page = () => <><TableCell className="w-32 text-right font-mono text-fg-muted" /><Card className="border-hairline border-border bg-surface-floating shadow-raised" /></>;
    `)).toEqual([]);
    expect(restyleCategories).toContain("motion");
  });

  it("does not apply component contracts to unrelated local components", async () => {
    expect(await messages(`
      const MarketingAction = ({ className }: { className: string }) => <div className={className} />;
      export const Page = () => <MarketingAction className="p-4 h-20" />;
    `)).toEqual([]);
  });

  it("catches palette colors, undeclared tokens and arbitrary appearance values", async () => {
    const found = await messages('export const Page = () => <div className="bg-blue-500 text-not-a-token p-[13px]" />;');
    expect(found.map(({ ruleId }) => ruleId).sort()).toEqual([
      "shadcn/no-arbitrary-values", "shadcn/no-raw-colors", "shadcn/no-raw-colors",
    ]);
  });

  it("uses the actual Tailwind theme for control tokens and misspelled variants", async () => {
    const found = await messages('export const Page = () => <div className="h-control-md text-body hovr:flex" />;', { unknown: true });
    expect(found).toHaveLength(1);
    expect(found[0].ruleId).toBe("shadcn/no-unknown-classes");
    expect(found[0].message).toContain("hover:flex");
  });

  it("accepts generated typography, shadow, hairline, and motion utilities", async () => {
    expect(await messages(`
      export const Page = () => <div className="border-hairline border-border shadow-floating transition-opacity duration-moderate animate-in fade-in" />;
    `, { unknown: true })).toEqual([]);
  });

  it("accepts only the audited table state marker", async () => {
    expect(await messages(
      'export const Row = () => <div className="is-active" />;',
      { unknown: true },
      "packages/ui/src/components/table.tsx",
    )).toEqual([]);
    const found = await messages(
      'export const Row = () => <div className="is-selected" />;',
      { unknown: true },
      "packages/ui/src/components/table.tsx",
    );
    expect(found.map(({ ruleId }) => ruleId)).toEqual(["shadcn/no-unknown-classes"]);
    expect(stateMarkerClasses).toEqual(["is-active"]);
  });

  it("checks dynamic class and style values only when strict is requested", async () => {
    const code = `import { Button } from "@zeron/ui/button";
      export const Page = ({ tone }: { tone: string }) => <Button className={tone} style={{ color: "red" }} />;`;
    expect(await messages(code)).toEqual([]);
    expect((await messages(code, { strict: true })).map(({ ruleId }) => ruleId).sort()).toEqual([
      "shadcn/no-inline-styles", "shadcn/require-static-classes",
    ]);
  });

  it("allows component implementation values while still checking colors", async () => {
    const code = 'export const Part = () => <div className="p-[13px] bg-blue-500" />;';
    const found = await messages(code, { strict: true }, "packages/ui/src/components/design-lint-probe.tsx");
    expect(found.map(({ ruleId }) => ruleId)).toEqual(["shadcn/no-raw-colors"]);
    expect(await messages(code, { strict: true }, "packages/ui/src/components/color-picker.tsx")).toEqual([]);
  });

  it("keeps explicit control-size guidance aligned with the component recipe", () => {
    const source = readFileSync(new URL("../packages/ui/src/tokens/control-size.ts", import.meta.url), "utf8");
    const names = source.match(/export const controlSizes = \[([^\]]+)\]/)?.[1].match(/"([^"]+)"/g)?.map((value) => JSON.parse(value));
    expect(controlSizes).toEqual(names);
    expect(typographyClasses).toEqual(typographyTokens.map(({ name }) => `text-${name}`));
    expect(shadowClasses).toEqual(shadowTokens.map(({ name }) => `shadow-${name}`));
    expect(borderWidthClasses).toContain("border-hairline");
    expect(borderWidthClasses).toContain("border-t-hairline");
    expect(borderWidthClasses).toHaveLength(borderWidthTokens.length * 9);
  });
});

describe("existing lint policy regressions", () => {
  const lint = new ESLint();

  it("does not mistake Zeron action tokens for reserved shadcn tokens", async () => {
    const [result] = await lint.lintText('export const Page = () => <div className="bg-primary-action hover:bg-secondary-action text-fg-on-primary-action" />;', { filePath: "app/design-lint-probe.tsx" });
    expect(result.messages).toEqual([]);
  });

  it("retains reserved-token and focus checks inside core components", async () => {
    const [result] = await lint.lintText('export const Part = () => <div className="bg-primary focus-visible:ring-[#123456]" />;', { filePath: "packages/ui/src/components/design-lint-probe.tsx" });
    expect(result.messages.some(({ message }) => message.includes("reserved"))).toBe(true);
    expect(result.messages.some(({ message }) => message.includes("Focus indicators"))).toBe(true);
  });
});
