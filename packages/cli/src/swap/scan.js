import path from "node:path";
import { isBuiltin } from "node:module";
import ts from "typescript";
import { hash, loadProject, portable, projectFiles, readProjectFile } from "./project.js";

export async function scanProject(cwd) {
  cwd = path.resolve(cwd);
  const unknowns = [];
  const project = await loadProject(cwd, unknowns);
  const files = await projectFiles(cwd, unknowns);
  const hashes = {};
  const imports = [];
  const jsx = [];
  const styles = [];
  const routes = [];
  const contents = new Map();
  for (const file of files) {
    const bytes = await readProjectFile(cwd, file);
    hashes[file] = hash(bytes);
    const text = bytes.toString("utf8");
    contents.set(file, text);
    if (/\.(css|scss|sass|less)$/.test(file)) {
      styles.push({ file, tokens: [...new Set(text.match(/--[\w-]+/g) ?? [])], imports: [...text.matchAll(/@(?:import|use|forward)\s+(?:url\(\s*)?["']?([^"'\s);]+)/g)].map((m) => m[1]) });
      continue;
    }
    if (!/\.[cm]?[jt]sx?$/.test(file) || file.endsWith(".d.ts")) continue;
    if (project.framework === "next") {
      if (/^(?:src\/)?app\/(?:.*\/)?(?:page|layout|loading|error|not-found|default)\.[jt]sx?$/.test(file)) routes.push(file);
      if (/^(?:src\/)?pages\//.test(file)) unknowns.push({ code: "unsupported-router", file, line: 0, detail: "Next Pages Router is outside the initial validated scope." });
    }
    const ast = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true);
    for (const diagnostic of ast.parseDiagnostics) unknowns.push({ code: "parse", file, line: 0, detail: ts.flattenDiagnosticMessageText(diagnostic.messageText, " ") });
    const lineOf = (node) => ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1;
    const unknown = (node, code, detail) => unknowns.push({ code, file, line: lineOf(node), detail });
    function addImport(node, literal, kind) {
      if (!literal || !ts.isStringLiteralLike(literal)) {
        unknown(node, "dynamic-reference", "Non-literal module reference requires inspection.");
        return;
      }
      const specifier = literal.text;
      const result = ts.resolveModuleName(specifier, path.join(cwd, file), project.options, ts.sys).resolvedModule;
      let resolved = result ? portable(path.relative(cwd, result.resolvedFileName)) : null;
      const asset = specifier.startsWith(".") && /\.(css|scss|sass|less|svg|png|jpe?g|webp|woff2?|json)$/.test(specifier);
      if (!resolved && asset && ts.sys.fileExists(path.resolve(cwd, path.dirname(file), specifier))) resolved = portable(path.relative(cwd, path.resolve(cwd, path.dirname(file), specifier)));
      if (!resolved && !isBuiltin(specifier)) unknown(node, "unresolved-import", `Cannot resolve ${specifier}`);
      if (resolved?.startsWith("../") && !resolved.includes("node_modules/")) unknown(node, "external-source", `Source outside selected application: ${specifier}`);
      imports.push({ file, line: lineOf(node), kind, specifier, resolved, bindings: node.importClause?.getText(ast) ?? null });
    }
    function visit(node) {
      if (ts.isImportDeclaration(node)) addImport(node, node.moduleSpecifier, "import");
      else if (ts.isExportDeclaration(node) && node.moduleSpecifier) addImport(node, node.moduleSpecifier, "export");
      else if (ts.isImportEqualsDeclaration(node) && ts.isExternalModuleReference(node.moduleReference)) addImport(node, node.moduleReference.expression, "require");
      else if (ts.isCallExpression(node) && (node.expression.kind === ts.SyntaxKind.ImportKeyword || (ts.isIdentifier(node.expression) && node.expression.text === "require"))) addImport(node, node.arguments[0], "dynamic");
      else if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
        const name = node.tagName.getText(ast);
        const spreads = node.attributes.properties.filter(ts.isJsxSpreadAttribute);
        jsx.push({ file, line: lineOf(node), name, props: node.attributes.properties.filter(ts.isJsxAttribute).map((a) => a.name.getText(ast)), spreads: spreads.map((s) => s.expression.getText(ast)) });
        if (spreads.length) unknown(node, "prop-spread", `${name}: inspect spread props and behavior before mapping.`);
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
  }
  if (project.framework === "vite") unknowns.push({ code: "route-inventory", file: "package.json", line: 0, detail: "Vite has no filesystem route contract. Verify routes and state branches explicitly." });
  if (project.framework === "next" && !routes.length) unknowns.push({ code: "unsupported-router", file: "package.json", line: 0, detail: "No Next App Router entries found." });
  for (const entry of unknowns) entry.id = hash(JSON.stringify(entry));
  const result = { schemaVersion: 1, project: { framework: project.framework, versions: project.versions, dependencies: project.dependencies }, files: hashes, snapshot: hash(JSON.stringify({ files: hashes, versions: project.versions })), imports, jsx, styles, routes, unknowns, status: unknowns.length ? "unchecked" : "passed" };
  // Keep source text internal; JSON output contains locations and facts, not source bodies.
  Object.defineProperty(result, "contents", { value: contents });
  return result;
}
