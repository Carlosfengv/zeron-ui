import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";

const PLACEHOLDER_ALIASES = new Set(["ui", "lib", "hooks", "components"]);

function replacementFor(specifier, aliases) {
  const match = /^@(ui|lib|hooks|components)(\/.*)?$/.exec(specifier);
  if (match) {
    const alias = aliases[match[1]];
    return typeof alias === "string" ? `${alias}${match[2] ?? ""}` : specifier;
  }

  // shadcn resolves a `@lib/*` registry import through `aliases.components`
  // when that alias uses the Node `#` syntax. Correct that intermediate form
  // after installation so every generated import uses the consumer's intended
  // package.json#imports alias.
  const nested = /^(#components)\/(lib|hooks)(\/.*)?$/.exec(specifier);
  if (nested && aliases.components === nested[1] && typeof aliases[nested[2]] === "string") {
    return `${aliases[nested[2]]}${nested[3] ?? ""}`;
  }

  // shadcn 3 occasionally resolves the Registry's `@lib/tokens/*` import
  // relative to `components/ui`, producing a path that cannot exist in the
  // planned consumer layout. This narrow normalization leaves all ordinary
  // relative imports untouched.
  const relativeTokens = /^(?:\.\.\/)+tokens\/(.+)$/.exec(specifier);
  if (relativeTokens && typeof aliases.lib === "string") {
    return `${aliases.lib}/tokens/${relativeTokens[1]}`;
  }

  return specifier;
}

function scriptKindFor(filename) {
  if (/\.tsx$/i.test(filename)) return ts.ScriptKind.TSX;
  if (/\.jsx$/i.test(filename)) return ts.ScriptKind.JSX;
  if (/\.(?:[cm]?js)$/i.test(filename)) return ts.ScriptKind.JS;
  return ts.ScriptKind.TS;
}

function isSourceFile(filename) {
  return /\.(?:[cm]?[jt]sx?|mts|cts)$/i.test(filename);
}

function quotedReplacement(source, literal, replacement) {
  const start = literal.getStart();
  const quote = source[start];
  const content = replacement
    .replaceAll("\\", "\\\\")
    .replaceAll(quote, `\\${quote}`);
  return { start, end: literal.getEnd(), text: `${quote}${content}${quote}` };
}

export function resolveRegistryAliases(source, aliases, filename = "registry-item.tsx") {
  if (!Object.keys(aliases).some((key) => PLACEHOLDER_ALIASES.has(key))) return source;
  // Registry closures can include assets alongside source files. Parsing an
  // SVG (or another non-code asset) as TypeScript would make a safe install
  // fail even though there are no module specifiers to rewrite.
  if (!isSourceFile(filename)) return source;
  const sourceFile = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, scriptKindFor(filename));
  if (sourceFile.parseDiagnostics.length) {
    throw new Error(`Cannot safely resolve registry aliases in ${filename}: source has syntax errors`);
  }

  const replacements = [];
  const addReplacement = (literal) => {
    const replacement = replacementFor(literal.text, aliases);
    if (replacement !== literal.text) replacements.push(quotedReplacement(source, literal, replacement));
  };
  const visit = (node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) addReplacement(node.moduleSpecifier);
    else if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) addReplacement(node.moduleSpecifier);
    else if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) addReplacement(node.argument.literal);
    else if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && ts.isStringLiteral(node.arguments[0])) addReplacement(node.arguments[0]);
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);

  return replacements
    .sort((left, right) => right.start - left.start)
    .reduce((output, replacement) => `${output.slice(0, replacement.start)}${replacement.text}${output.slice(replacement.end)}`, source);
}

/** Resolve Registry placeholders after shadcn has written files using the consumer's own aliases. */
export async function resolveInstalledRegistryAliases(cwd, files) {
  if (!Array.isArray(files)) throw new Error("Registry alias resolution requires an explicit install-plan file list");
  const config = JSON.parse(await readFile(path.join(cwd, "components.json"), "utf8"));
  const aliases = config.aliases ?? {};
  if (!Object.keys(aliases).some((key) => PLACEHOLDER_ALIASES.has(key))) return;

  for (const planFile of files) {
    const file = typeof planFile === "string" ? planFile : planFile.targetPath;
    const relative = path.relative(cwd, file);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new Error(`Refusing to rewrite an install-plan file outside the project: ${file}`);
    }
    let input;
    let wasMissing = false;
    try {
      input = await readFile(file, "utf8");
    } catch (error) {
      if (error?.code !== "ENOENT" || typeof planFile === "string" || typeof planFile.expectedContent !== "string") throw error;
      // shadcn can omit a nested registry dependency when it decides an item
      // has already been processed. The install plan is authoritative and
      // contains the exact content that passed conflict checks, so materialize
      // only that missing planned target—never scan or rewrite user files.
      input = planFile.expectedContent;
      wasMissing = true;
    }
    const output = resolveRegistryAliases(input, aliases, file);
    if (output !== input || wasMissing) await writeFile(file, output);
  }
}
