import { readFileSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import baseline from "../docs/plans/2026-10-08-radar-ring-reference-baseline.json";
import registry from "../packages/ui/registry.json";
import manifest from "../packages/ui/package.json";

const read = (path: string) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
describe("radar and ring reference contracts", () => {
  for (const entry of baseline.sources) for (const [name, fields] of Object.entries(entry.interfaces)) {
    it(`preserves ${name} fields and optionality`, () => {
      const source = ts.createSourceFile(entry.file, read("packages/ui/src/components/charts/" + entry.file), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      const declaration = source.statements.find(node => ts.isInterfaceDeclaration(node) && node.name.text === name);
      expect(declaration && ts.isInterfaceDeclaration(declaration)).toBe(true);
      if (!declaration || !ts.isInterfaceDeclaration(declaration)) return;
      const actual = declaration.members.filter(ts.isPropertySignature).map(property => ({
        name: property.name.getText(source), type: property.type?.getText(source).replace(/\s+/g, " "), optional: !!property.questionToken,
      }));
      // Preserve the frozen reference fields while allowing optional library extensions.
      const referenceNames = new Set(fields.map((field: { name: string }) => field.name));
      expect(actual.filter(field => referenceNames.has(field.name))).toEqual(fields);
      expect(actual.filter(field => !referenceNames.has(field.name)).every(field => field.optional)).toBe(true);
    });
  }
  it("publishes both roots and shares each registry file once", () => {
    const owners = new Map<string, string>();
    for (const item of registry.items) for (const file of item.files ?? []) {
      if (!file.path.startsWith("packages/ui/src/components/charts/")) continue;
      expect(owners.has(file.path), file.path).toBe(false);
      owners.set(file.path, item.name);
    }
    for (const slug of ["radar-chart", "ring-chart"]) {
      expect(manifest.exports).toHaveProperty("./" + slug);
      const item = registry.items.find(item => item.name === slug)!;
      expect(item.registryDependencies).toContain("chart-core");
      expect(item.files?.some(file => file.target === "components/ui/" + slug + ".tsx")).toBe(true);
    }
    for (const file of ["chart-stat-flow.tsx", "chart-center-typography.ts"]) expect(owners.get("packages/ui/src/components/charts/" + file)).toBe("chart-core");
  });
  it.each(["radar-chart", "ring-chart"])("%s has three complete consumer examples and its own API", slug => {
    const source = ts.createSourceFile(slug, read("docs/pages/components/" + slug + "/page.tsx"), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const snippets = source.statements.flatMap(node => ts.isVariableStatement(node) ? node.declarationList.declarations.flatMap(decl => ts.isIdentifier(decl.name) && decl.name.text.endsWith("Code") && decl.initializer && ts.isStringLiteral(decl.initializer) ? [decl.initializer.text] : []) : []);
    expect(snippets).toHaveLength(3);
    for (const code of snippets) {
      expect(code.startsWith('"use client";')).toBe(true);
      expect(code).toContain("@/components/ui/" + slug);
      expect(code).not.toContain("@zeron/");
      expect(code).toContain("export default function Example()");
      expect(ts.transpileModule(code, { fileName: "example.tsx", reportDiagnostics: true, compilerOptions: { jsx: ts.JsxEmit.ReactJSX } }).diagnostics).toEqual([]);
    }
    const api = JSON.parse(read("docs/pages/components/" + slug + "/api.json"));
    expect(api.length).toBeGreaterThan(20);
  });
});
