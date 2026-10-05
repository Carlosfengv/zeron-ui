import { createRequire } from "node:module";
import { mkdir, realpath, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

/** Runs inside the browser; no application state is changed. */
export function inspectRenderedControls() {
  const checks = [];
  const visible = node => {
    const box = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return box.width > 0 && box.height > 0 && style.visibility !== "hidden" && style.display !== "none";
  };
  const record = (check, node, status, actual, expected, suggestion) => checks.push({
    check, name: node?.getAttribute("aria-label") || node?.textContent?.trim() || "unnamed",
    locator: node ? `[data-slot="${node.getAttribute("data-slot")}"]` : "html",
    status, actual, expected, suggestion,
  });
  const buttons = [...document.querySelectorAll('[data-slot="button"]')];
  if (!buttons.length) record("controls-found", null, "unchecked", 0, "At least one applicable control", "Open the affected business route/state.");
  for (const button of buttons) {
    if (!visible(button)) { record("visible-control", button, "unchecked", "hidden", "visible", "Prepare this state before measuring."); continue; }
    const iconOnly = button.querySelector('[data-slot="button-icon"]');
    if (iconOnly) {
      const name = button.getAttribute("aria-label")?.trim() || button.getAttribute("aria-labelledby")?.split(/\s+/).map(id => document.getElementById(id)?.textContent?.trim()).join(" ").trim() || button.textContent?.trim();
      record("icon-accessible-name", button, name ? "passed" : "failed", name || null, "nonempty accessible name", "Provide aria-label or visible/sr-only text.");
      continue;
    }
    const label = button.querySelector('[data-slot="button-label"]');
    if (!label) { record("standard-label", button, "not-applicable", null, "standard labeled Button", "Inspect custom compositions separately."); continue; }
    if (!visible(label) || getComputedStyle(label.parentElement).opacity === "0") {
      record("label-geometry", button, "unchecked", "hidden/loading", "visible label", "Measure normal and prepared loading states separately."); continue;
    }
    const icons = [...button.querySelectorAll('[data-slot="button-leading-icon"], [data-slot="button-trailing-icon"], [data-slot="button-label"] svg')];
    if (!icons.length) continue;
    const walker = document.createTreeWalker(label, NodeFilter.SHOW_TEXT);
    const textBounds = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.textContent.trim() || node.parentElement.closest("svg")) continue;
      const range = document.createRange(); range.selectNodeContents(node);
      textBounds.push(...[...range.getClientRects()].filter(rect => rect.width > 0));
    }
    // JSX labels often produce adjacent text nodes (e.g. "新增资源 " + size).
    // Merge same-line fragments; distinct lines/rich baselines remain unchecked.
    const first = textBounds[0];
    if (!first || textBounds.some(rect => Math.abs(rect.y + rect.height / 2 - first.y - first.height / 2) > 1)) {
      record("label-geometry", button, "unchecked", { textFragments: textBounds.length }, "one standard label fragment", "Inspect intentional multiline/rich content separately."); continue;
    }
    const left = Math.min(...textBounds.map(rect => rect.left)), right = Math.max(...textBounds.map(rect => rect.right));
    const top = Math.min(...textBounds.map(rect => rect.top)), bottom = Math.max(...textBounds.map(rect => rect.bottom));
    const text = { left, right, top, bottom, y: top, height: bottom - top }, root = button.getBoundingClientRect();
    for (const icon of icons) {
      if (!visible(icon)) { record("icon-geometry", button, "unchecked", "hidden", "visible icon", "Prepare the relevant state."); continue; }
      const box = icon.getBoundingClientRect();
      const delta = Math.abs(box.y + box.height / 2 - text.y - text.height / 2);
      const gap = Math.max(text.left - box.right, box.left - text.right);
      const inside = [box, text].every(rect => rect.left >= root.left - 1 && rect.right <= root.right + 1 && rect.top >= root.top - 1 && rect.bottom <= root.bottom + 1);
      record("icon-label-row", button, delta <= 2 && gap >= 1 && inside ? "passed" : "failed",
        { centerDelta: delta, gap, inside }, "centerDelta <= 2px, positive spacing and content within control",
        "Use leadingIcon/trailingIcon component types; keep children as the label. Check caller geometry overrides.");
    }
  }
  const overflow = document.documentElement.scrollWidth - innerWidth;
  record("page-horizontal-overflow", null, overflow <= 1 ? "passed" : "failed", overflow, "<= 1px", "Reflow whole action groups; let the table own local horizontal scrolling.");
  return { schemaVersion: 1, scope: "current-visible-state-read-only", viewport: { width: innerWidth, height: innerHeight }, checks };
}

export function parseControlCheckArgs(args) {
  const result = { viewport: { width: 1440, height: 1000 } };
  const seen = new Set();
  for (let index = 0; index < args.length; index += 2) {
    const key = args[index], value = args[index + 1];
    if (!["--url", "--output", "--viewport", "--executable-path"].includes(key) || !value || value.startsWith("--") || seen.has(key)) throw new Error("Use --url <http(s) URL> --output <json> [--viewport 1440x1000] [--executable-path <Chrome>]");
    seen.add(key);
    if (key === "--viewport") {
      if (!/^\d+x\d+$/.test(value)) throw new Error("Invalid viewport");
      const [width, height] = value.split("x").map(Number);
      if ([width, height].some(size => size < 100 || size > 10000)) throw new Error("Invalid viewport");
      result.viewport = { width, height };
    } else result[{ "--url": "url", "--output": "output", "--executable-path": "executablePath" }[key]] = value;
  }
  if (!result.url || !result.output || !["http:", "https:"].includes(new URL(result.url).protocol)) throw new Error("A page URL and output path are required");
  return result;
}

export async function checkRenderedControls(options) {
  const require = createRequire(path.join(process.cwd(), "package.json"));
  const { chromium } = require("playwright");
  let browser;
  try {
    browser = await chromium.launch({ headless: true, ...(options.executablePath ? { executablePath: options.executablePath } : {}) });
    const page = await browser.newPage({ viewport: options.viewport });
    const response = await page.goto(options.url, { waitUntil: "networkidle" });
    if (!response?.ok()) throw new Error(`Page HTTP ${response?.status() ?? "unavailable"}`);
    await page.evaluate(() => document.fonts.ready);
    return { ...(await page.evaluate(inspectRenderedControls)), url: options.url };
  } finally { await browser?.close(); }
}

// macOS /tmp and downloaded tool paths may be symlinks; compare canonical paths.
const entry = process.argv[1] ? await realpath(process.argv[1]).catch(() => null) : null;
if (entry && import.meta.url === pathToFileURL(entry).href) {
  const options = parseControlCheckArgs(process.argv.slice(2));
  let report;
  try { report = await checkRenderedControls(options); }
  catch (error) { report = { schemaVersion: 1, scope: "current-visible-state-read-only", checks: [{ check: "browser-available", status: "unchecked", actual: error.message, suggestion: "Install declared Playwright/browser dependencies and prepare the route." }] }; }
  await mkdir(path.dirname(path.resolve(options.output)), { recursive: true });
  await writeFile(options.output, JSON.stringify(report, null, 2) + "\n");
  process.exitCode = report.checks.some(check => check.status === "failed") ? 1 : report.checks.some(check => check.status === "unchecked") ? 2 : 0;
  console.log(`Control check: ${options.output}; exit ${process.exitCode}`);
}
