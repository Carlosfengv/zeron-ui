import { execFileSync } from "node:child_process";
import { appendFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const fullChecks = { code: true, clean: true };

function documentationOnly(filename) {
  return ["README.md", "README.zh-CN.md", "docs/maintaining.md"].includes(filename) ||
    (/^docs\/plans\/.+\.md$/.test(filename) && !filename.split("/").some(part => part === "." || part === ".."));
}

function cleanCheckoutInput(filename) {
  return /^(scripts|metadata-templates|packages\/(cli|registry|tokens)|\.agents\/skills|\.github\/(actions|workflows))\//.test(filename) ||
    /(^|\/)(package\.json|pnpm-lock\.yaml|pnpm-workspace\.yaml|package-lock\.json|\.nvmrc)$/.test(filename) ||
    /^(metadata\.config\.json|next\.config\.[^/]+|postcss\.config\.[^/]+)$/.test(filename);
}

export function classifyChanges(files) {
  // An empty or unavailable diff must never bypass validation.
  if (!files.length) return { ...fullChecks };
  return {
    code: files.some(filename => !documentationOnly(filename)),
    clean: files.some(cleanCheckoutInput),
  };
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
    return { ...classifyChanges(files), count: files.length };
  } catch {
    return { ...fullChecks, count: null };
  }
}

async function main() {
  const scope = await detectChanges(process.cwd());
  if (scope.count === null) console.log("::warning::Unable to compare revisions; running all CI checks.");
  const summary = `CI scope: ${scope.code ? "code checks" : "documentation only"}; clean checkout: ${scope.clean}; changed files: ${scope.count ?? "unknown"}`;
  console.log(summary);
  if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, `code=${scope.code}\nclean=${scope.clean}\n`);
  if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
