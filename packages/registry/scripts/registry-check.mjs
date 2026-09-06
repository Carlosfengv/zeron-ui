/**
 * Read-only verification of the generated Registry.  It models the files a
 * consumer receives for each recursive registry dependency closure, rather
 * than assuming other components happen to already be installed.
 */

import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, normalize, posix } from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const ROOT = new URL("../../..", import.meta.url).pathname;
const OUTPUT_DIR = join(ROOT, "public/r");
const SOURCE_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js", ".mjs", ".cjs", ".json", ".css", ".svg", ".png"];
const HOST_DEPENDENCIES = new Set(["react", "react-dom"]);
const ALIAS_TARGETS = [
  ["@ui/", "components/ui/"],
  ["@components/", "components/"],
  ["@lib/", "lib/"],
  ["@hooks/", "hooks/"],
];

function packageName(specifier) {
  if (!specifier.startsWith("@")) return specifier.split("/")[0];
  return specifier.split("/").slice(0, 2).join("/");
}

function dependencyPackage(dependency) {
  if (dependency.startsWith("@")) {
    const separator = dependency.indexOf("@", dependency.indexOf("/") + 1);
    return separator === -1 ? dependency : dependency.slice(0, separator);
  }
  return dependency.split("@")[0];
}

function dependencyName(dependency) {
  try {
    const url = new URL(dependency);
    return posix.basename(url.pathname, ".json");
  } catch {
    return dependency;
  }
}

function moduleSpecifiers(source, filename) {
  const scriptKind = filename.endsWith(".tsx") || filename.endsWith(".jsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const file = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, scriptKind);
  const specifiers = [];
  const addLiteral = (node) => {
    if (node && ts.isStringLiteralLike(node)) specifiers.push(node.text);
  };
  const visit = (node) => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) addLiteral(node.moduleSpecifier);
    if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) addLiteral(node.argument.literal);
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) addLiteral(node.arguments[0]);
    if (ts.isNewExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === "URL") addLiteral(node.arguments?.[0]);
    ts.forEachChild(node, visit);
  };
  visit(file);
  return specifiers;
}

function targetKeys(target) {
  const normalized = target.replace(/\\/g, "/");
  const extension = SOURCE_EXTENSIONS.find((candidate) => normalized.endsWith(candidate));
  const withoutExtension = extension ? normalized.slice(0, -extension.length) : normalized;
  return new Set([normalized, withoutExtension, withoutExtension.replace(/\/index$/, "")]);
}

function resolveInternalTarget(from, specifier) {
  const alias = ALIAS_TARGETS.find(([prefix]) => specifier.startsWith(prefix));
  if (alias) return `${alias[1]}${specifier.slice(alias[0].length)}`;
  if (specifier.startsWith(".")) return normalize(posix.join(posix.dirname(from), specifier)).replace(/\\/g, "/");
  return null;
}

function itemDependencies(item) {
  return new Set((item.dependencies ?? []).map(dependencyPackage));
}

function optionalDependencies(item) {
  return new Set(item.meta?.zeron?.optionalDependencies ?? []);
}

function closureFor(item, byName, errors) {
  const result = [];
  const seen = new Set();
  const visiting = [];
  const visit = (current) => {
    if (visiting.includes(current.name)) {
      errors.push(`${item.name}: Registry dependency cycle ${[...visiting, current.name].join(" -> ")}`);
      return;
    }
    if (seen.has(current.name)) return;
    seen.add(current.name);
    visiting.push(current.name);
    for (const reference of current.registryDependencies ?? []) {
      const dependency = byName.get(dependencyName(reference));
      if (!dependency) {
        errors.push(`${current.name}: missing Registry dependency ${reference}`);
      } else {
        visit(dependency);
      }
    }
    visiting.pop();
    result.push(current);
  };
  visit(item);
  return result;
}

/** Returns all errors, so CI can report the entire Registry in one run. */
export function checkRegistry(items, { scope = "all" } = {}) {
  const errors = [];
  const byName = new Map();
  for (const item of items) {
    if (byName.has(item.name)) errors.push(`duplicate Registry item name: ${item.name}`);
    byName.set(item.name, item);
    const meta = item.meta?.zeron;
    if (!meta || !["react", "next"].includes(meta.framework) || !["ui", "data-block", "template"].includes(meta.kind)) {
      errors.push(`${item.name}: missing valid meta.zeron compatibility metadata`);
    }
  }

  if (scope === "packages") return errors;

  for (const item of items) {
    const closure = closureFor(item, byName, errors);
    const files = new Map();
    const dependencies = new Set();
    const optional = new Set();
    const needsNext = closure.some((entry) => entry.meta?.zeron?.framework === "next");
    for (const entry of closure) {
      for (const dependency of itemDependencies(entry)) dependencies.add(dependency);
      for (const dependency of optionalDependencies(entry)) optional.add(dependency);
      for (const file of entry.files ?? []) {
        if (typeof file.target !== "string" || typeof file.content !== "string") {
          errors.push(`${entry.name}: file ${file.path ?? "(unknown)"} lacks install target or content`);
          continue;
        }
        const existing = files.get(file.target);
        if (existing && existing.content !== file.content) {
          errors.push(`${item.name}: target conflict at ${file.target} between ${existing.item} and ${entry.name}`);
        } else {
          files.set(file.target, { ...file, item: entry.name });
        }
      }
    }

    if (needsNext && item.meta?.zeron?.framework !== "next") {
      errors.push(`${item.name}: depends on a Next-only Registry item but is marked ${item.meta?.zeron?.framework}`);
    }

    const targetIndex = new Map();
    for (const file of files.values()) {
      for (const key of targetKeys(file.target)) targetIndex.set(key, file);
    }

    for (const file of files.values()) {
      for (const specifier of moduleSpecifiers(file.content, file.target)) {
        const internalTarget = resolveInternalTarget(file.target, specifier);
        if (internalTarget) {
          const resolved = [...targetKeys(internalTarget)].some((key) => targetIndex.has(key));
          if (!resolved) {
            errors.push(`${item.name}: ${file.target} imports ${specifier}; expected ${internalTarget} in its Registry closure`);
          }
          continue;
        }
        if (specifier.startsWith("@zeron/") || specifier.startsWith("#") || specifier.startsWith("@/")) {
          errors.push(`${item.name}: ${file.target} leaks workspace import ${specifier}`);
          continue;
        }
        const pkg = packageName(specifier);
        if (HOST_DEPENDENCIES.has(pkg)) continue;
        if (pkg === "next" && item.meta?.zeron?.framework === "next") continue;
        if (!dependencies.has(pkg) && !optional.has(pkg)) {
          errors.push(`${item.name}: ${file.target} imports ${specifier} but ${pkg} is not declared in its closure dependencies`);
        }
      }
    }
  }
  return errors;
}

async function run() {
  const scopeFlag = process.argv.indexOf("--scope");
  const scope = scopeFlag === -1 ? "all" : process.argv[scopeFlag + 1];
  if (!new Set(["all", "files", "packages"]).has(scope)) {
    throw new Error('Usage: registry:check [--scope all|files|packages]');
  }
  const catalogPath = join(OUTPUT_DIR, "registry.json");
  if (!existsSync(catalogPath)) throw new Error("Registry output is missing; run pnpm registry:build first");
  const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
  const items = await Promise.all((catalog.items ?? []).map(async ({ name }) => {
    const itemPath = join(OUTPUT_DIR, `${name}.json`);
    if (!existsSync(itemPath)) throw new Error(`Registry item output is missing: ${itemPath}`);
    return JSON.parse(await readFile(itemPath, "utf8"));
  }));
  const errors = checkRegistry(items, { scope });
  if (errors.length) throw new Error(`Registry check failed (${errors.length}):\n${errors.map((error) => `- ${error}`).join("\n")}`);
  console.log(`Registry check passed (${items.length} items; scope: ${scope})`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
