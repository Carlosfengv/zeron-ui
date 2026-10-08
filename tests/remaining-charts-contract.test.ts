import { readFileSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import baseline from "../docs/plans/2026-10-08-remaining-charts-api-baseline.json";
import registry from "../packages/ui/registry.json";
import manifest from "../packages/ui/package.json";

const roots = ["line-chart","bar-chart","pie-chart","heatmap-chart","live-line-chart"];
function file(path: string) { return readFileSync(new URL("../" + path,import.meta.url),"utf8"); }
function ast(path: string) {return ts.createSourceFile(path,file(path),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);}
describe("reference chart contracts and distribution", () => {
  it.each(baseline.contracts)("preserves $name field types and optionality", expected => {
    const source=ast("packages/ui/src/components/charts/"+expected.file);
    const node=source.statements.find(node => (ts.isInterfaceDeclaration(node)||ts.isTypeAliasDeclaration(node)) && node.name.text===expected.name)!;
    if (ts.isInterfaceDeclaration(node)) {
      const fields=node.members.filter(ts.isPropertySignature).map(property=>({name:property.name.getText(source),optional:!!property.questionToken,type:property.type?.getText(source).replace(/\s+/g," ")??"unknown"}));
      // The frozen reference remains unchanged. Selection is an explicit
      // additive API; all original fields still require exact equality.
      const additions = expected.name === "HeatmapChartProps" ? [{name:"onCellSelect",optional:true,type:"(bin: HeatmapBin) => void"}] : [];
      expect(fields.filter(field => !additions.some(addition => addition.name === field.name))).toEqual(expected.fields);
      for (const addition of additions) expect(fields.find(field => field.name === addition.name)).toEqual(addition);
    } else {
      expect(ts.isTypeAliasDeclaration(node) && node.type.getText(source).replace(/\s+/g," ")).toBe(expected.type);
    }
  });
  it("gives every chart file one registry owner and publishes five root exports", () => {
    const owners=new Map<string,string>();
    for (const item of registry.items) for (const entry of item.files ?? []) {
      if (!entry.path.startsWith("packages/ui/src/components/charts/")) continue;
      expect(owners.has(entry.path),entry.path).toBe(false);
      owners.set(entry.path,item.name);
    }
    for (const root of roots) {
      expect(manifest.exports).toHaveProperty("./"+root);
      const item=registry.items.find(item=>item.name===root)!;
      expect(item.registryDependencies).toContain("chart-core");
      expect(item.files?.some(entry=>entry.target==="components/ui/"+root+".tsx")).toBe(true);
    }
    expect(registry.items.find(item=>item.name==="chart-primitives")!.dependencies).not.toEqual(expect.arrayContaining(["recharts","d3-shape","@number-flow/react"]));
  });
  it.each(roots)("%s has complete client copy examples and an actual library page", root => {
    const source=ast("docs/pages/components/"+root+"/page.tsx");
    const snippets=source.statements.flatMap(statement=>ts.isVariableStatement(statement)?statement.declarationList.declarations.flatMap(declaration=>ts.isIdentifier(declaration.name)&&declaration.name.text.endsWith("Code")&&declaration.initializer&&ts.isStringLiteral(declaration.initializer)?[declaration.initializer.text]:[]):[]);
    expect(snippets.length).toBeGreaterThanOrEqual(3);
    for (const snippet of snippets) {
      expect(snippet.startsWith('"use client";')).toBe(true);
      expect(snippet).toContain("@/components/ui/"+root);
      expect(snippet).not.toContain("@zeron/");
      expect(snippet).toContain("export default function Example()");
      expect(ts.transpileModule(snippet,{fileName:root+".tsx",reportDiagnostics:true,compilerOptions:{jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ESNext}}).diagnostics).toEqual([]);
    }
    expect(file("docs/pages/components/"+root+"/page.tsx")).toContain("<figure");
    expect(file("docs/pages/components/"+root+"/page.tsx")).not.toContain("ChartTypeDoc");
  });
});
