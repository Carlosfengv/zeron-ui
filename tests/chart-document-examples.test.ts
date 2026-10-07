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
const examples = [
  ...chartTypes.flatMap(({ kind }) => [false, true].map((advanced) => ({ name: `${kind}-${advanced ? "advanced" : "basic"}`, code: chartTypeExampleCode(kind, advanced) }))),
  { name: "bar-gradient", code: barChartGradientExampleCode },
  { name: "status-bar-basic", code: statusBarChartBasicCode },
  ...statusSnippets,
];

describe("copyable chart documentation examples", () => {
  it("covers every documented status example", () => {
    expect(statusSnippets.map(({ name }) => name)).toEqual(["basicCode", "activityCode", "denseNodesCode"]);
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
