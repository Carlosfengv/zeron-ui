import { readFileSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { chartTypeExampleCode } from "../docs/components/charts/chart-type-example";
import { barChartGradientExampleCode } from "../docs/components/charts/bar-chart-gradient-example";
import { statusBarChartBasicCode } from "../docs/components/charts/status-bar-chart-basic-demo";
import { chartTypes } from "../docs/lib/chart-types";

const statusPage = ts.createSourceFile("status-overview.tsx", readFileSync(new URL("../docs/pages/components/status-overview/page.tsx", import.meta.url), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const statusSnippets = statusPage.statements.flatMap((statement) => {
  if (!ts.isVariableStatement(statement)) return [];
  return statement.declarationList.declarations.flatMap((declaration) =>
    ts.isIdentifier(declaration.name) && ["basicCode", "activityCode", "denseNodesCode"].includes(declaration.name.text) && declaration.initializer && ts.isNoSubstitutionTemplateLiteral(declaration.initializer)
      ? [{ name: declaration.name.text, code: declaration.initializer.text }]
      : [],
  );
});
const funnelPage = ts.createSourceFile("funnel-chart.tsx", readFileSync(new URL("../docs/pages/components/funnel-chart/page.tsx", import.meta.url), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const funnelStrings = new Map<string, string>();
for (const statement of funnelPage.statements) {
  if (!ts.isVariableStatement(statement)) continue;
  for (const declaration of statement.declarationList.declarations) {
    if (!ts.isIdentifier(declaration.name) || !declaration.initializer) continue;
    const value = declaration.initializer;
    if (ts.isNoSubstitutionTemplateLiteral(value)) funnelStrings.set(declaration.name.text, value.text);
    else if (ts.isTemplateExpression(value)) {
      const spans = value.templateSpans.map((span) => ts.isIdentifier(span.expression) ? funnelStrings.get(span.expression.text) : undefined);
      if (spans.every((span) => span !== undefined)) funnelStrings.set(declaration.name.text, value.head.text + value.templateSpans.map((span, index) => spans[index] + span.literal.text).join(""));
    }
  }
}
const funnelSnippets = ["basicCode", "verticalCode", "straightCode", "fillsCode"].map((name) => ({ name: `funnel-${name}`, code: funnelStrings.get(name)! }));
const areaPage = ts.createSourceFile("area-chart.tsx", readFileSync(new URL("../docs/pages/components/area-chart/page.tsx", import.meta.url), "utf8"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const areaSnippets = areaPage.statements.flatMap(statement => ts.isVariableStatement(statement) ? statement.declarationList.declarations.flatMap(declaration =>
  ts.isIdentifier(declaration.name) && ["basicCode", "comparisonCode", "stylingCode", "loadingCode", "brushCode"].includes(declaration.name.text) && declaration.initializer && ts.isNoSubstitutionTemplateLiteral(declaration.initializer)
    ? [{ name: `area-${declaration.name.text}`, code: declaration.initializer.text }] : []) : []);
const examples = [
  ...chartTypes.filter(({ kind }) => kind !== "area").flatMap(({ kind }) => [false, true].map((advanced) => ({ name: `${kind}-${advanced ? "advanced" : "basic"}`, code: chartTypeExampleCode(kind, advanced) }))),
  { name: "bar-gradient", code: barChartGradientExampleCode },
  { name: "status-bar-basic", code: statusBarChartBasicCode },
  ...statusSnippets,
  ...funnelSnippets,
  ...areaSnippets,
];

describe("copyable chart documentation examples", () => {
  it("covers all five new area examples", () => { expect(areaSnippets).toHaveLength(5); });
  it("covers every documented status example", () => {
    expect(statusSnippets.map(({ name }) => name)).toEqual(["basicCode", "activityCode", "denseNodesCode"]);
  });

  it("covers all four funnel examples", () => {
    expect(funnelSnippets.every(({ code }) => typeof code === "string")).toBe(true);
  });

  it("keeps the controlled funnel feedback in copied code without a second live region", () => {
    const code = funnelStrings.get("basicCode")!;
    expect(code).toContain("max-w-3xl");
    expect(code).toContain("highlighted.label");
    expect(code).toContain("formatValue(highlighted.value)");
    expect(code).not.toContain('role="status"');
    const source = readFileSync(new URL("../docs/pages/components/funnel-chart/page.tsx", import.meta.url), "utf8");
    expect(source).not.toContain('<p role="status"');
  });

  it.each(examples)("$name is a complete client module using consumer aliases", ({ name, code }) => {
    const source = ts.createSourceFile(`${name}.tsx`, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const first = source.statements[0];
    expect(first && ts.isExpressionStatement(first) && ts.isStringLiteral(first.expression) && first.expression.text).toBe("use client");
    const imports = source.statements.filter(ts.isImportDeclaration).map((declaration) => (declaration.moduleSpecifier as ts.StringLiteral).text);
    expect(imports.some((specifier) => specifier.startsWith("@/components/ui/"))).toBe(true);
    expect(imports.some((specifier) => specifier.startsWith("@zeron/"))).toBe(false);
    const result = ts.transpileModule(code, { fileName: `${name}.tsx`, reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.ES2023, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, strict: true } });
    expect(result.diagnostics).toEqual([]);
    expect(result.outputText).toContain("export default function Example");
  });
});
