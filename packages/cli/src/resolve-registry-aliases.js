import { lstat, mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
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

  return specifier;
}

function updateSpecifier(factory, literal, aliases) {
  const replacement = replacementFor(literal.text, aliases);
  return replacement === literal.text ? literal : factory.createStringLiteral(replacement);
}

export function resolveRegistryAliases(source, aliases, filename = "registry-item.tsx") {
  if (!Object.keys(aliases).some((key) => PLACEHOLDER_ALIASES.has(key))) return source;
  const sourceFile = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const result = ts.transform(sourceFile, [
    (context) => {
      const { factory } = context;
      const visit = (node) => {
        if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
          return factory.updateImportDeclaration(node, node.modifiers, node.importClause, updateSpecifier(factory, node.moduleSpecifier, aliases), node.attributes);
        }
        if (ts.isExportDeclaration(node) && node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)) {
          return factory.updateExportDeclaration(node, node.modifiers, node.isTypeOnly, node.exportClause, updateSpecifier(factory, node.moduleSpecifier, aliases), node.attributes);
        }
        if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument) && ts.isStringLiteral(node.argument.literal)) {
          return factory.updateImportTypeNode(node, factory.updateLiteralTypeNode(node.argument, updateSpecifier(factory, node.argument.literal, aliases)), node.attributes, node.qualifier, node.typeArguments);
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

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await sourceFiles(file));
    else if (/\.(?:[cm]?tsx?|jsx?)$/.test(entry.name)) files.push(file);
  }
  return files;
}

function importTargetDirectory(alias, imports) {
  const target = imports?.[`${alias}/*`];
  if (typeof target !== "string" || !target.startsWith("./")) return null;
  return target.slice(2).replace(/\*.*$/, "").replace(/\/$/, "");
}

async function exists(file) {
  try {
    await lstat(file);
    return true;
  } catch {
    return false;
  }
}

async function moveDirectoryContents(sourceDirectory, destinationDirectory) {
  await mkdir(destinationDirectory, { recursive: true });
  for (const entry of await readdir(sourceDirectory, { withFileTypes: true })) {
    const source = path.join(sourceDirectory, entry.name);
    const destination = path.join(destinationDirectory, entry.name);
    if (entry.isDirectory()) {
      await moveDirectoryContents(source, destination);
    } else if (!await exists(destination)) {
      await rename(source, destination);
    }
  }
}

async function moveMisplacedHashTargets(cwd, imports) {
  for (const pattern of Object.keys(imports ?? {}).filter((key) => key.startsWith("#") && key.endsWith("/*"))) {
    const alias = pattern.slice(0, -2);
    const targetDirectory = importTargetDirectory(alias, imports);
    if (!targetDirectory) continue;

    const misplacedDirectory = path.join(cwd, alias);
    try {
      await readdir(misplacedDirectory, { withFileTypes: true });
    } catch {
      continue;
    }

    const destinationDirectory = path.join(cwd, targetDirectory);
    await moveDirectoryContents(misplacedDirectory, destinationDirectory);
  }
}

/** Resolve Registry placeholders after shadcn has written files using the consumer's own aliases. */
export async function resolveInstalledRegistryAliases(cwd) {
  const config = JSON.parse(await readFile(path.join(cwd, "components.json"), "utf8"));
  const aliases = config.aliases ?? {};
  if (!Object.keys(aliases).some((key) => PLACEHOLDER_ALIASES.has(key))) return;

  const packageJson = JSON.parse(await readFile(path.join(cwd, "package.json"), "utf8"));
  await moveMisplacedHashTargets(cwd, packageJson.imports);

  for (const file of await sourceFiles(cwd)) {
    const input = await readFile(file, "utf8");
    const output = resolveRegistryAliases(input, aliases, file);
    if (output !== input) await writeFile(file, output);
  }
}
