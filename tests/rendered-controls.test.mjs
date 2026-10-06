import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { chromium } from "playwright";
import { mkdtemp, readFile, rm, symlink } from "node:fs/promises";
import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
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
