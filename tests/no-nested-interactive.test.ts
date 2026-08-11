import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const sourceRoots = ["app", "src"];
const interactiveNames = new Set(["a", "button", "Link", "Button"]);

function collectTsxFiles(directory: string): string[] {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return collectTsxFiles(filePath);
    return entry.isFile() && filePath.endsWith(".tsx") ? [filePath] : [];
  });
}

function getInteractiveElement(
  node: ts.JsxElement | ts.JsxSelfClosingElement
): { name: string; isSemantic: boolean } | null {
  const opening = ts.isJsxElement(node) ? node.openingElement : node;
  if (!ts.isIdentifier(opening.tagName)) return null;

  const name = opening.tagName.text;
  if (!interactiveNames.has(name)) return null;

  const usesAsChild =
    name === "Button" &&
    opening.attributes.properties.some(
      (attribute) =>
        ts.isJsxAttribute(attribute) && attribute.name.getText() === "asChild"
    );

  return { name, isSemantic: !usesAsChild };
}

describe("interactive element semantics", () => {
  it("does not nest links and buttons", () => {
    const violations: string[] = [];

    for (const filePath of sourceRoots.flatMap(collectTsxFiles)) {
      const source = ts.createSourceFile(
        filePath,
        fs.readFileSync(filePath, "utf8"),
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
      );

      function visit(node: ts.Node, ancestors: string[] = []) {
        const element =
          ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node)
            ? getInteractiveElement(node)
            : null;

        if (element?.isSemantic) {
          if (ancestors.length > 0) {
            const { line } = source.getLineAndCharacterOfPosition(
              node.getStart(source)
            );
            violations.push(
              `${filePath}:${line + 1} ${ancestors.at(-1)} contains ${element.name}`
            );
          }
          ancestors = [...ancestors, element.name];
        }

        ts.forEachChild(node, (child) => visit(child, ancestors));
      }

      visit(source);
    }

    expect(violations).toEqual([]);
  });
});
