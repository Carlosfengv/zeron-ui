import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import postcss from "postcss";
import { assertProjectPath } from "./project-paths.js";

/** Adapt only create-next-app's recognizable starter body colors.
 * Unlayered body rules otherwise override the installed theme's base layer.
 */
export function adaptNextStarterCss(source) {
  const root = postcss.parse(source);
  // Imported user styles can override the starter variables. Without resolving
  // that cascade, only the standard framework imports are safe to recognize.
  let customImport = false;
  root.walkAtRules((rule) => {
    if (rule.name.toLowerCase() === "import" && !/^(?:"(?:tailwindcss|tw-animate-css)"|'(?:tailwindcss|tw-animate-css)')$/.test(rule.params.trim())) customImport = true;
  });
  if (customImport) return source;
  const defaults = {
    "--background": { light: ["#fff", "#ffffff"], dark: ["#0a0a0a"] },
    "--foreground": { light: ["#171717"], dark: ["#ededed"] },
  };
  const light = new Set();
  let custom = false;
  root.walkDecls(/^--(?:background|foreground)$/, (decl) => {
    const rule = decl.parent;
    const parent = rule.parent;
    const mode = parent?.type === "root" ? "light"
      : parent?.type === "atrule" && parent.name === "media" && /^\(\s*prefers-color-scheme\s*:\s*dark\s*\)$/.test(parent.params) ? "dark" : null;
    if (rule.selector !== ":root" || !mode || decl.important || !defaults[decl.prop][mode].includes(decl.value.toLowerCase())) custom = true;
    if (mode === "light") light.add(decl.prop);
  });
  if (custom || light.size !== 2) return source;
  let changed = false;
  for (const rule of root.nodes) {
    if (rule.type !== "rule" || rule.selector !== "body") continue;
    const background = rule.nodes.filter((node) => node.type === "decl" && ["background", "background-color"].includes(node.prop));
    const foreground = rule.nodes.filter((node) => node.type === "decl" && node.prop === "color");
    if (background.length !== 1 || foreground.length !== 1) continue;
    if (background[0].value !== "var(--background)" || foreground[0].value !== "var(--foreground)" || background[0].important || foreground[0].important) continue;
    background[0].value = "var(--surface-base)";
    foreground[0].value = "var(--fg-default)";
    changed = true;
  }
  return changed ? root.toString() : source;
}

export async function adaptNextStarterStyles(cwd) {
  const packagePath = path.join(cwd, "package.json");
  await assertProjectPath(cwd, packagePath);
  const manifest = JSON.parse(await readFile(packagePath, "utf8"));
  if (!manifest.dependencies?.next && !manifest.devDependencies?.next) return;
  const configPath = path.join(cwd, "components.json");
  await assertProjectPath(cwd, configPath);
  const config = JSON.parse(await readFile(configPath, "utf8"));
  if (!config.tailwind?.css) return;
  const cssPath = path.resolve(cwd, config.tailwind.css);
  await assertProjectPath(cwd, cssPath);
  const before = await readFile(cssPath, "utf8");
  const after = adaptNextStarterCss(before);
  if (after !== before) {
    await assertProjectPath(cwd, cssPath);
    await writeFile(cssPath, after);
  }
}
