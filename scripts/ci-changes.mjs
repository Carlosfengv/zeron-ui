import { execFileSync } from "node:child_process";
import { appendFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const e2eSuites = ["documentation", "navigation", "focus", "code-block", "detail", "grouped-table"];
const fullChecks = { code: true, clean: true, consumers: true, migrations: true, e2e: true,
  consumerFull: true, suites: e2eSuites.join(",") };

function documentationOnly(filename) {
  return ["README.md", "README.zh-CN.md", "docs/maintaining.md"].includes(filename) ||
    (/^docs\/plans\/.+\.md$/.test(filename) && !filename.split("/").some(part => part === "." || part === ".."));
}

function cleanCheckoutInput(filename) {
  return /^(metadata-templates|packages\/(cli|registry|tokens)|\.agents\/skills|\.github\/(actions|workflows))\//.test(filename) ||
    /^scripts\/(?:ci-|check-agent-clean-checkout|build-|generate-|package-|create-skill)/.test(filename) ||
    /(^|\/)(package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|package-lock\.json|\.nvmrc)$/.test(filename) ||
    /^(metadata\.config\.json|next\.config\.[^/]+|postcss\.config\.[^/]+)$/.test(filename);
}

export function classifyChanges(files) {
  // An empty or unavailable diff must never bypass validation.
  if (!files.length) return { ...fullChecks };
  const changed = files.filter(filename => !documentationOnly(filename));
  const scope = { code: changed.length > 0, clean: changed.some(cleanCheckoutInput),
    consumers: false, migrations: false, e2e: false, consumerFull: false, suites: "" };
  const suites = new Set();
  for (const filename of changed) {
    // These affect installation across frameworks, rather than one component.
    if (cleanCheckoutInput(filename) || /^(packages\/(icons|lint)|scripts\/lib)\//.test(filename) ||
      /^scripts\/test-(?:consumer|unification)/.test(filename)) {
      scope.consumers = scope.consumerFull = scope.migrations = true;
      e2eSuites.forEach(suite => suites.add(suite));
    } else if (/^(packages\/(ui|blocks)|public\/r)\//.test(filename)) {
      scope.consumers = true;
      suites.add("documentation"); suites.add("detail");
      if (/code-block|code-engine|markdown|chat-message/.test(filename)) suites.add("code-block");
      if (/data-table|grouped-data|sectioned-data/.test(filename)) suites.add("grouped-table");
      if (/sidebar|tree|nav-menu|input-group|focus/.test(filename)) suites.add("focus");
      if (/(?:^|\/)(?:button|input|tabs|select|dialog|popover|container|surfaces|utils|scroll-area)\.(?:tsx?|json)$/.test(filename)) {
        e2eSuites.forEach(suite => suites.add(suite));
      }
      if (/\/system\/|\/hooks\/|\/tokens\/|\.css$/.test(filename)) {
        scope.consumerFull = scope.migrations = true;
        e2eSuites.forEach(suite => suites.add(suite));
      }
    } else if (filename === "scripts/preview-source-allowlist.mjs" ||
      /^(docs\/(pages|content|agent-guides|agent-data|catalog|generated)|public\/(docs-source|component-covers))\//.test(filename) ||
      /^docs\/(manifest\.ts|lib\/block-preview-sources\.generated\.ts)$/.test(filename) ||
      /^app\/\[locale\]\/docs\/(blocks|components)\/\(detail\)\//.test(filename) ||
      /^docs\/components\/(blocks|charts)\//.test(filename)) {
      suites.add("documentation"); suites.add("detail");
      if (/grouped-data|sectioned-data/.test(filename)) suites.add("grouped-table");
      if (/code-block|markdown/.test(filename)) suites.add("code-block");
    } else if (/^(app|docs|lib|public)\//.test(filename) || /^(middleware|instrumentation(?:-client)?)\./.test(filename)) {
      // Shared site inputs can affect every route. Keep their complete browser coverage.
      e2eSuites.forEach(suite => suites.add(suite));
    } else if (/^tests\//.test(filename)) {
      if (filename.endsWith(".e2e.ts") || filename.startsWith("tests/helpers/")) e2eSuites.forEach(suite => suites.add(suite));
      if (filename.startsWith("tests/fixtures/")) scope.consumers = scope.consumerFull = scope.migrations = true;
    } else {
      // Unrecognized tooling/configuration must never silently lose coverage.
      return { ...fullChecks };
    }
  }
  scope.suites = e2eSuites.filter(suite => suites.has(suite)).join(",");
  scope.e2e = suites.size > 0;
  return scope;
}

/** Install changed entries, plus a representative dependent of a changed UI entry.
 * Registry files preserve the source paths even after installation rewriting. */
export async function consumerMatrix(root, files, scope) {
  const index = JSON.parse(await readFile(path.join(root, "public/r/registry.json"), "utf8"));
  const items = await Promise.all(index.items.map(async item => JSON.parse(await readFile(path.join(root, "public/r", `${item.name}.json`), "utf8"))));
  const capabilities = JSON.parse(await readFile(path.join(root, "packages/blocks/block-capabilities.json"), "utf8"));
  const installable = items.filter(item => ["registry:ui", "registry:block"].includes(item.type));
  const owned = installable.filter(item => item.files?.some(file => files.includes(file.path)));
  const direct = owned.length ? owned : installable.filter(item => files.includes(`public/r/${item.name}.json`));
  const names = new Set(direct.map(item => item.name));
  for (const item of direct.filter(item => item.type === "registry:ui")) {
    const dependent = installable.find(candidate => candidate.type === "registry:block" && candidate.registryDependencies?.some(dep =>
      dep === item.name || dep.endsWith(`/r/${item.name}.json`)));
    if (dependent) names.add(dependent.name);
  }
  const full = scope.consumerFull || !names.size;
  const next = [...new Set([...(full ? ["button", "card", "ask-user-questions", "code-block", "infinite-log-table-01"] : []), ...names])];
  const vite = [...new Set([...(full ? ["button", "card", "ask-user-questions", "code-block"] : []), ...names])]
    .filter(name => capabilities[name]?.framework !== "next");
  const row = (group, nextManagers, viteManagers) => ({ group, "next-managers": nextManagers, "vite-managers": viteManagers,
    "next-components": next.join(","), "vite-components": vite.join(","), styles: full });
  return { include: full ? [row("next-npm", "npm", ""), row("next-pnpm", "pnpm", ""), row("vite-npm", "", "npm")]
    : [row("next-pnpm", "pnpm", "")] };
}

export function changedFiles(root, eventName, event) {
  let base;
  let head;
  let separator;
  if (eventName === "pull_request") {
    base = event.pull_request?.base?.sha;
    head = event.pull_request?.head?.sha;
    separator = "...";
  } else if (eventName === "push") {
    base = event.before;
    head = event.after;
    separator = "..";
  }
  if (![base, head].every(sha => typeof sha === "string" && /^[a-f0-9]{40}$/.test(sha) && !/^0+$/.test(sha))) {
    throw new Error("No complete comparison range");
  }
  // Disabling rename detection includes both the removed and added paths.
  const diff = execFileSync("git", ["diff", "--no-renames", "--name-only", "-z", `${base}${separator}${head}`, "--"],
    { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return diff.split("\0").filter(Boolean);
}

export async function detectChanges(root, env = process.env) {
  try {
    const event = JSON.parse(await readFile(env.GITHUB_EVENT_PATH, "utf8"));
    const files = changedFiles(root, env.GITHUB_EVENT_NAME, event);
    const scope = classifyChanges(files);
    return { ...scope, count: files.length, matrix: scope.consumers ? await consumerMatrix(root, files, scope) : { include: [] } };
  } catch {
    // Default component lists in the consumer runner are the broad fallback.
    const row = (group, next, vite) => ({ group, "next-managers": next, "vite-managers": vite, styles: true });
    return { ...fullChecks, count: null, matrix: { include: [row("next-npm", "npm", ""), row("next-pnpm", "pnpm", ""), row("vite-npm", "", "npm")] } };
  }
}

async function main() {
  const scope = await detectChanges(process.cwd());
  if (scope.count === null) console.log("::warning::Unable to compare revisions; running all CI checks.");
  const summary = `CI scope: ${scope.code ? "code checks" : "documentation only"}; bootstrap: ${scope.clean}; consumers: ${scope.consumers}; migrations: ${scope.migrations}; E2E: ${scope.suites || "none"}; changed files: ${scope.count ?? "unknown"}`;
  console.log(summary);
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT,
    ["code", "clean", "consumers", "migrations", "e2e", "suites"].map(key => `${key}=${scope[key]}\n`).join("") + `consumer-matrix=${JSON.stringify(scope.matrix)}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
