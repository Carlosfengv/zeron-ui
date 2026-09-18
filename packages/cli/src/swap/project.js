import { createHash } from "node:crypto";
import { readFile, readdir, realpath } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import ts from "typescript";

export const hash = (value) => createHash("sha256").update(value).digest("hex");
export const portable = (value) => value.split(path.sep).join("/");
export const isWithin = (file, root) => root === "." || file === root || file.startsWith(`${root}/`);
const skipped = new Set(["node_modules", "dist", "build", "coverage", "output", "vendor", "public"]);
const sourcePattern = /\.(?:[cm]?[jt]sx?|css|scss|sass|less)$/;
const configPattern = /(?:^|\/)(?:package\.json|(?:ts|js)config[^/]*\.json|components\.json|pnpm-lock\.yaml|package-lock\.json|yarn\.lock|(?:next|vite|postcss|tailwind)\.config\.[^/]+)$/;

export function relativePath(value) {
  return typeof value === "string" && value.length > 0 && !value.includes("\\") && !path.isAbsolute(value)
    && value === path.posix.normalize(value) && !value.split("/").some((part) => part === ".." || part === "") && !value.startsWith("~");
}

export async function readProjectFile(cwd, file) {
  if (!relativePath(file)) throw new Error(`Expected project-relative path: ${file}`);
  const root = await realpath(cwd);
  const target = await realpath(path.resolve(root, file));
  const relative = path.relative(root, target);
  if (relative.startsWith(`..${path.sep}`) || relative === ".." || path.isAbsolute(relative)) {
    throw new Error(`File escapes project: ${file}`);
  }
  return readFile(target);
}

export async function projectFiles(cwd, unknowns) {
  const files = [];
  async function visit(dir) {
    for (const entry of (await readdir(path.join(cwd, dir), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      if (entry.name.startsWith(".") || skipped.has(entry.name)) continue;
      const file = portable(path.join(dir, entry.name));
      if (entry.isSymbolicLink()) {
        unknowns.push({ code: "source-symlink", file, line: 0, detail: "Linked source is not traversed; inspect its shared scope." });
      } else if (entry.isDirectory()) {
        await visit(file);
      } else if (sourcePattern.test(file) || configPattern.test(file)) {
        files.push(file);
      }
    }
  }
  await visit("");
  return files.sort();
}

export async function loadProject(cwd, unknowns) {
  const pkg = JSON.parse(await readFile(path.join(cwd, "package.json"), "utf8"));
  const dependencies = { ...pkg.dependencies, ...pkg.devDependencies };
  const require = createRequire(path.join(cwd, "package.json"));
  const versions = {};
  for (const [name, expected] of [["react", 19], ["tailwindcss", 4]]) {
    try {
      versions[name] = JSON.parse(await readFile(require.resolve(`${name}/package.json`), "utf8")).version;
      if (Number(versions[name].split(".")[0]) !== expected) throw new Error(`requires ${expected}.x, resolved ${versions[name]}`);
    } catch (error) {
      unknowns.push({ code: "compatibility", file: "package.json", line: 0, detail: `${name}: ${error.message}` });
    }
  }
  const framework = dependencies.next ? "next" : dependencies.vite ? "vite" : "unknown";
  if (framework === "unknown" || pkg.workspaces) unknowns.push({ code: "unsupported-project", file: "package.json", line: 0, detail: "Select one Next App Router or Vite React application root." });
  const config = ["tsconfig.json", "jsconfig.json"].find((name) => ts.sys.fileExists(path.join(cwd, name)));
  let options = { jsx: ts.JsxEmit.ReactJSX, moduleResolution: ts.ModuleResolutionKind.Bundler, allowJs: true, resolveJsonModule: true };
  if (config) {
    const parsed = ts.getParsedCommandLineOfConfigFile(path.join(cwd, config), {}, {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (d) => unknowns.push({ code: "config", file: config, line: 0, detail: ts.flattenDiagnosticMessageText(d.messageText, " ") }),
    });
    if (parsed) {
      options = { ...options, ...parsed.options };
      for (const d of parsed.errors.filter((d) => d.code !== 18003)) unknowns.push({ code: "config", file: config, line: 0, detail: ts.flattenDiagnosticMessageText(d.messageText, " ") });
    }
  }
  return { dependencies, versions, framework, options };
}
