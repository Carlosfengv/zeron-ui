/**
 * Rewrites workspace-only module specifiers in Registry file content to
 * shadcn alias placeholders. TypeScript's parser/printer preserves the import
 * form (including type-only imports and re-exports) while changing only the
 * module specifier, unlike a text replacement pass.
 */
import ts from "typescript";

function registrySpecifier(specifier) {
  if (specifier.startsWith("@zeron/ui/hooks/")) return `@hooks/${specifier.slice("@zeron/ui/hooks/".length)}`;
  if (specifier.startsWith("@zeron/ui/system/")) return `@lib/${specifier.slice("@zeron/ui/system/".length)}`;
  if (specifier.startsWith("@zeron/ui/tokens/")) return `@lib/tokens/${specifier.slice("@zeron/ui/tokens/".length)}`;
  if (specifier.startsWith("@zeron/ui/")) return `@ui/${specifier.slice("@zeron/ui/".length)}`;
  if (specifier.startsWith("@zeron/blocks/")) return `@components/blocks/${specifier.slice("@zeron/blocks/".length)}`;
  if (specifier.startsWith("#components/")) return `@ui/${specifier.slice("#components/".length)}`;
  if (specifier.startsWith("#hooks/")) return `@hooks/${specifier.slice("#hooks/".length)}`;
  if (specifier.startsWith("#system/")) return `@lib/${specifier.slice("#system/".length)}`;
  if (specifier.startsWith("#tokens/")) return `@lib/tokens/${specifier.slice("#tokens/".length)}`;
  return specifier;
}

function rewriteLiteral(factory, literal) {
  const replacement = registrySpecifier(literal.text);
  return replacement === literal.text ? literal : factory.createStringLiteral(replacement);
}

export function transformRegistryImports(source, filename = "registry-item.tsx") {
  const sourceFile = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const result = ts.transform(sourceFile, [
    (context) => {
      const { factory } = context;
      const visit = (node) => {
        if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
          return factory.updateImportDeclaration(
            node,
            node.modifiers,
            node.importClause,
            rewriteLiteral(factory, node.moduleSpecifier),
            node.attributes,
          );
        }
        if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
          return factory.updateExportDeclaration(
            node,
            node.modifiers,
            node.isTypeOnly,
            node.exportClause,
            rewriteLiteral(factory, node.moduleSpecifier),
            node.attributes,
          );
        }
        if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) {
          return factory.updateImportTypeNode(
            node,
            factory.updateLiteralTypeNode(node.argument, rewriteLiteral(factory, node.argument.literal)),
            node.attributes,
            node.qualifier,
            node.typeArguments,
          );
        }
        return ts.visitEachChild(node, visit, context);
      };
      return (file) => ts.visitNode(file, visit);
    },
  ]);
  const output = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed }).printFile(result.transformed[0]);
  result.dispose();
  return output;
}
