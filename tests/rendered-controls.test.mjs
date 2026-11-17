import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium } from "playwright";
import { mkdtemp, readFile, rm, symlink } from "node:fs/promises";
import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import { build } from "esbuild";
import postcss from "postcss";
import tailwindcss from "@tailwindcss/postcss";
import { inspectRenderedControls, parseControlCheckArgs } from "../.agents/skills/zeron-page-builder/scripts/check-rendered-controls.mjs";

let browser;
// Browser process startup/shutdown needs a separate budget from the UI assertions.
beforeAll(async () => { browser = await chromium.launch({ headless: true }); }, 30000);
afterAll(async () => { await browser?.close(); }, 30000);
const svg = '<svg width="14" height="14" viewBox="0 0 24 24"><path d="M12 4v16M4 12h16" /></svg>';
const css = '<style>button{display:inline-flex;align-items:center;gap:8px;padding:8px;font:14px/20px Arial;white-space:nowrap}svg{display:block;flex-shrink:0}button>span{display:flex;align-items:center;gap:8px}</style>';
async function measure(html) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  try { await page.setContent(css + html); return await page.evaluate(inspectRenderedControls); }
  finally { await page.close(); }
}

async function renderFixture(page, fixture) {
  const stylesheet = fileURLToPath(new URL("../app/globals.css", import.meta.url));
  const [style, script] = await Promise.all([
    readFile(stylesheet, "utf8").then(css => postcss([tailwindcss()]).process(css, { from: stylesheet })),
    build({
      entryPoints: [fileURLToPath(new URL(`./fixtures/${fixture}.tsx`, import.meta.url))],
      bundle: true,
      jsx: "automatic",
      define: { "process.env.NODE_ENV": '"production"' },
      write: false,
    }),
  ]);
  await page.setContent('<!doctype html><div id="root"></div>');
  await page.addStyleTag({ content: style.css });
  await page.addScriptTag({ content: script.outputFiles[0].text });
}

it("renders fixed, content-sized and link controls at their intended heights", async () => {
  const page = await browser.newPage();
  try {
    await renderFixture(page, "control-heights");
    async function measureControl(role, name) {
      return page.getByRole(role, { name }).evaluate(element => ({
        height: element.getBoundingClientRect().height,
        minHeight: getComputedStyle(element).minHeight,
      }));
    }
    expect(await measureControl("button", "Fixed button")).toMatchObject({ height: 32 });
    expect(await measureControl("combobox", "Fixed select")).toMatchObject({ height: 32 });
    const richButton = await measureControl("button", "Content button");
    expect(richButton.minHeight).toBe("28px");
    expect(richButton.height).toBeGreaterThan(32);
    expect(await measureControl("button", "Short button")).toEqual({ height: 24, minHeight: "0px" });
    const richSelect = await measureControl("combobox", "Content select");
    expect(richSelect.minHeight).toBe("0px");
    expect(richSelect.height).toBeGreaterThan(32);
    const linkButton = await measureControl("link", "Link button");
    expect(linkButton.minHeight).toBe("0px");
    expect(linkButton.height).toBeGreaterThan(0);
    expect(linkButton.height).toBeLessThan(32);
  } finally {
    await page.close();
  }
}, 30000);

async function expectIndicator(indicator, item) {
  await expect.poll(async () => {
    if (!(await indicator.count()) || !(await item.count())) return false;
    const [marker, target] = await Promise.all([indicator.boundingBox(), item.boundingBox()]);
    return Boolean(marker && target && ["x", "y", "height", "width"].every(
      key => Math.abs(marker[key] - target[key]) < 2,
    ));
  }).toBe(true);
}

describe("portable current-state control observations (actual Chromium)", () => {
  it("executes through a symlink and writes an unchecked report when a route is unavailable", async () => {
    const directory = await mkdtemp(path.join(tmpdir(), "zeron-control-cli-"));
    const server = createServer((_request, response) => response.writeHead(404).end());
    try {
      await new Promise(resolve => server.listen(0, "127.0.0.1", resolve));
      const script = path.join(directory, "check.mjs"), output = path.join(directory, "report.json");
      await symlink(fileURLToPath(new URL("../.agents/skills/zeron-page-builder/scripts/check-rendered-controls.mjs", import.meta.url)), script);
      await expect(promisify(execFile)(process.execPath, [script, "--url", `http://127.0.0.1:${server.address().port}`, "--output", output], { cwd: process.cwd() })).rejects.toMatchObject({ code: 2 });
      const report = JSON.parse(await readFile(output, "utf8"));
      expect(report.checks[0]).toMatchObject({ status: "unchecked", actual: "Page HTTP 404" });
    } finally { await new Promise(resolve => server.close(resolve)); await rm(directory, { recursive: true, force: true }); }
  }, 30000); // This integration case starts and closes a separate Chromium CLI process.
  it("detects the original icon-in-label wrong-row composition and offers a public-slot fix", async () => {
    const report = await measure(`<button data-slot="button"><span><span data-slot="button-label">${svg}新增资源</span></span></button>`);
    const check = report.checks.find(check => check.check === "icon-label-row");
    expect(check.status).toBe("failed"); expect(check.suggestion).toContain("leadingIcon/trailingIcon");
    expect(check.actual.centerDelta).toBeGreaterThan(2);
  });
  it("accepts slot composition and detects missing icon names and page overflow", async () => {
    const report = await measure(`<button data-slot="button"><span>${svg.replace("<svg", '<svg data-slot="button-leading-icon"')}<span data-slot="button-label">新增资源</span></span></button><button data-slot="button"><span data-slot="button-icon">${svg}</span></button><div style="width:600px">wide content</div>`);
    expect(report.checks.find(check => check.check === "icon-label-row").status).toBe("passed");
    expect(report.checks.find(check => check.check === "icon-accessible-name").status).toBe("failed");
    expect(report.checks.find(check => check.check === "page-horizontal-overflow").status).toBe("failed");
  });
  it("measures a standard dynamic label split across adjacent text nodes", async () => {
    const report = await measure(`<button data-slot="button"><span>${svg.replace("<svg", '<svg data-slot="button-leading-icon"')}<span data-slot="button-label">新增资源 <span>md</span></span></span></button>`);
    expect(report.checks.find(check => check.check === "icon-label-row").status).toBe("passed");
  });
  it("keeps hidden, rich and absent controls distinct from passing measurements", async () => {
    const absent = await measure("<p>No controls on this route</p>");
    expect(absent.checks[0].status).toBe("unchecked");
    const report = await measure(`<button data-slot="button" style="display:none">Hidden</button><button data-slot="button"><span style="opacity:0"><span data-slot="button-label">Loading</span></span></button><button data-slot="button">Custom content</button>`);
    expect(report.checks.map(check => check.status)).toEqual(["unchecked", "unchecked", "not-applicable", "passed"]);
  });
  it("does not count whitespace or unresolved label references as an icon name", async () => {
    const report = await measure(`<button data-slot="button" aria-label="  " aria-labelledby="missing-a missing-b"><span data-slot="button-icon">${svg}</span></button>`);
    expect(report.checks.find(check => check.check === "icon-accessible-name").status).toBe("failed");
  });
  it("validates required arguments without accepting non-page URLs or duplicate options", () => {
    expect(parseControlCheckArgs(["--url", "http://127.0.0.1:3000/orders", "--output", "output.json", "--viewport", "390x844"]).viewport).toEqual({ width: 390, height: 844 });
    for (const args of [["--url", "file:///etc/passwd", "--output", "out.json"], ["--url", "https://example.test", "--output", "out", "--viewport", "0x900"], ["--url", "https://example.test", "--url", "https://other.test", "--output", "out"]]) expect(() => parseControlCheckArgs(args)).toThrow();
  });
});
