import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";
import { verifyChartTokenColors, verifySegmentedBarGeometry } from "./lib/chart-token-verification.mjs";

const origin = process.env.ZERON_CHART_ORIGIN ?? "http://localhost:3001";
const directory = process.env.ZERON_CHART_EVIDENCE_DIR
  ? pathToFileURL(resolve(process.env.ZERON_CHART_EVIDENCE_DIR) + "/")
  : new URL("../output/playwright/chart-tokens/", import.meta.url);
const pilots = ["credit-usage-01", "cost-estimate-01", "model-router-01"];
const resources = ["resource-status-all-01", "resource-metric-list-01"];
const blocks = process.env.ZERON_CHART_BLOCKS?.split(",").filter(Boolean) ?? [...pilots, "storage-usage-01", "project-monitor-01", "ai-gateway-overview-01", "model-detail-02", "personal-settings-01", "support-analytics-01", "security-overview-01", ...resources];
const baseline = await readFile(new URL("before.json", directory), "utf8").then(JSON.parse).catch(() => []);
const report = { origin, views: [], baselines: [], interactions: [], errors: [], status: "failed" };
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  page.on("pageerror", (error) => report.errors.push(error.message));
  await page.emulateMedia({ reducedMotion: "reduce" });
  for (const block of blocks) {
    await page.goto(`${origin}/zh-CN/block-demo/${block}`);
    await page.locator('[data-slot]').first().waitFor();
    await page.addStyleTag({ content: "*,*::before,*::after{transition:none!important;animation:none!important}" });
    if ([...pilots, ...resources].includes(block)) for (const theme of ["light", "dark"]) {
      await page.setViewportSize({ width: 1100, height: 900 });
      await page.evaluate((theme) => { document.documentElement.classList.remove("light", "dark"); document.documentElement.classList.add(theme); }, theme);
      const before = baseline.find((view) => (view.name ?? view.block) === block && (view.mode ?? view.theme) === theme);
      const text = await page.locator("body").innerText();
      if (before) assert.equal(text.replace(/\s+/gu, " "), before.text.replace(/\s+/gu, " "), `${block}: visible data and labels unchanged`);
      report.baselines.push({ block, theme, compared: Boolean(before) });
      await page.screenshot({ path: new URL(`after-${block}-${theme}.png`, directory).pathname });
    }
    // The account demo deliberately disables its usage destinations; installed fixtures cover them.
    const destinations = block === "security-overview-01" ? ["态势"] : block === "project-monitor-01" ? [null, "存储", "报告"] : [null];
    for (const destination of destinations) {
      if (destination) await page.getByText(destination, { exact: true }).first().click();
      for (const width of [390, 1440]) for (const theme of ["light", "dark"]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.emulateMedia({ colorScheme: theme });
        await page.evaluate((theme) => { document.documentElement.classList.remove("light", "dark"); document.documentElement.classList.add(theme); }, theme);
        await page.waitForTimeout(100);
        const colors = await verifyChartTokenColors(page, { theme, requireMarks: block !== "personal-settings-01" });
        const dimensions = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth }));
        assert.ok(dimensions.document <= width + 1, `${block}: horizontal overflow ${width}`);
        report.views.push({ block, destination, width, theme, ...colors, segmentedBars: await verifySegmentedBarGeometry(page, { requireBars: ["credit-usage-01", "cost-estimate-01", "storage-usage-01", "resource-metric-list-01"].includes(block) || block === "project-monitor-01" && destination === "存储" }) });
        await page.screenshot({ path: new URL(`${block}-${destination ?? "default"}-${width}-${theme}.png`, directory).pathname });
      }
    }
    if (block === "cost-estimate-01") {
      await page.getByRole("button", { name: "Hobby", exact: true }).click();
      const bars = await verifySegmentedBarGeometry(page);
      assert.equal(bars.length, 1);
      assert.ok(bars[0].hidden.length > 0, "Zero-cost categories consume no gap");
      report.interactions.push("Hobby retains zero-cost categories in its details without adding chart gaps");
    }
    if (block === "model-detail-02") {
      const slots = await page.locator('[aria-label="Price series"] [data-series] span[aria-hidden]').evaluateAll((nodes) => nodes.map((node) => node.style.backgroundColor));
      assert.equal(slots.length, 5);
      assert.equal(new Set(slots).size, 5, "Five known providers retain distinct colors");
      report.interactions.push("Five pricing providers have distinct stable slots");
    }
    console.log(`Chart colors passed: ${block}`);
  }
  assert.deepEqual(report.errors, []);
  report.status = "passed";
} catch (error) {
  report.error = error.message;
  throw error;
} finally {
  await writeFile(new URL("after.json", directory), JSON.stringify(report, null, 2) + "\n");
  await browser.close();
}
