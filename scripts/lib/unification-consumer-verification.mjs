import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { consumerRegistryClosureHash } from "./consumer-registry-expectations.mjs";
import { verifyChartTokenColors, verifySegmentedBarGeometry } from "./chart-token-verification.mjs";

/** Verify actual copied Registry files, compiled CSS and production-rendered examples. */
export async function verifyUnificationConsumer({ consumer, framework, component, packageManager, registrySnapshot }) {
  const { chromium } = await import("playwright");
  const probe = createServer();
  await new Promise(resolve => probe.listen(0, "127.0.0.1", resolve));
  const port = probe.address().port;
  await new Promise(resolve => probe.close(resolve));
  const app = spawn(join(consumer, "node_modules/.bin", framework), framework === "next"
    ? ["start", "--hostname", "127.0.0.1", "--port", String(port)]
    : ["preview", "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
  { cwd: consumer, stdio: ["ignore", "pipe", "pipe"] });
  let logs = "", spawnError, browser;
  app.on("error", error => { spawnError = error; });
  for (const stream of [app.stdout, app.stderr]) stream.on("data", chunk => { logs = (logs + chunk).slice(-8000); });
  const directory = process.env.ZERON_CONSUMER_EVIDENCE_DIR ?? new URL("../../.zeron/reports/stage-six/installed/", import.meta.url).pathname;
  const name = `${framework}-${packageManager}-${component}`;
  const result = { component, framework, packageManager, node: process.version, registryClosureSha256: consumerRegistryClosureHash(registrySnapshot, component), registrySha256: createHash("sha256").update([...registrySnapshot].sort(([a], [b]) => a.localeCompare(b)).map(([name, source]) => `${name}\0${source}`).join("\0")).digest("hex"), views: [], checks: [], pageErrors: [], consoleErrors: [], status: "failed" };
  try {
    await mkdir(directory, { recursive: true });
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (spawnError) throw spawnError;
      if (app.exitCode !== null) throw Error(logs);
      try { if ((await fetch(`http://127.0.0.1:${port}`, { signal: AbortSignal.timeout(1000) })).ok) { ready = true; break; } } catch { /* Waiting for this isolated server. */ }
      await delay(200);
    }
    assert.ok(ready, logs);
    browser = await chromium.launch();
    const page = await browser.newPage();
    page.on("pageerror", error => result.pageErrors.push(error.message));
    page.on("console", event => { if (event.type() === "error") result.consoleErrors.push(event.text()); });
    await page.goto(`http://127.0.0.1:${port}`);
    const example = page.locator(`[data-consumer="${component}"]`);
    await example.waitFor();
    assert.ok((await example.innerText()).trim().length, "Vite/Next example must mount actual content");
    const primitive = ["badge", "alert", "inline-notice", "chart", "chart-primitives", "list-pagination"].includes(component);
    const widths = primitive ? [320, 480, 800] : [390, 1440];
    for (const width of widths) for (const theme of ["light", "dark"]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.evaluate(dark => document.documentElement.classList.toggle("dark", dark), theme === "dark");
      await page.waitForTimeout(150);
      const layout = await page.evaluate(() => ({ documentWidth: document.documentElement.scrollWidth, viewportWidth: innerWidth, charts: [...document.querySelectorAll('[data-chart]')].filter(e => e.getBoundingClientRect().width > 0).map(e => ({ width: e.getBoundingClientRect().width, invalid: /NaN|Infinity/.test(e.innerHTML), svgWidth: e.querySelector('svg')?.getBoundingClientRect().width })) }));
      assert.ok(layout.documentWidth <= width + 1, `${component}: page overflow at ${width}/${theme}`);
      assert.ok(layout.charts.every(chart => !chart.invalid && chart.svgWidth !== 0), `${component}: invalid responsive chart`);
      if (component === "badge") {
        const pairs = await example.locator('[data-status][data-variant="strong"]').evaluateAll(es => es.map(e => ({ status: e.dataset.status, fg: getComputedStyle(e).color, bg: getComputedStyle(e).backgroundColor })));
        assert.equal(pairs.length, 5);
        for (const pair of pairs) {
          const luminance = rgb => { const c = rgb.match(/[\d.]+/g).slice(0, 3).map(v => +v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4); return c[0] * .2126 + c[1] * .7152 + c[2] * .0722; };
          const a = luminance(pair.fg), b = luminance(pair.bg); pair.contrast = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
          assert.ok(pair.contrast >= 4.5, `${pair.status}/${theme} contrast`);
        }
        layout.badges = pairs;
        const plain = await example.locator('[data-slot="badge"][data-variant="plain"]').evaluateAll(es => es.map(e => ({ background: getComputedStyle(e).backgroundColor, border: getComputedStyle(e).borderTopWidth, padding: getComputedStyle(e).paddingLeft, role: e.getAttribute("role") })));
        assert.equal(plain.length, 6);
        assert.ok(plain.every(e => e.background === "rgba(0, 0, 0, 0)" && e.border === "0px" && e.padding === "0px" && e.role !== "status" && e.role !== "alert"), "Plain badges have no box or implicit live region");
        assert.equal(await example.getByRole("img", { name: "Running" }).count(), 1);
      }
      if (component === "inline-notice") {
        const animations = await example.locator('.animate-spin').evaluateAll(es => es.map(e => getComputedStyle(e).animationName));
        assert.equal(animations.length, 1);
        assert.ok(animations.every(animation => animation === "none"), "Reduced motion stops activity animation");
        assert.equal(await example.locator('[role="status"], [role="alert"]').count(), 0, "Activity announcements remain opt-in");
      }
      if (["chart", "chart-primitives", "credit-usage-01", "cost-estimate-01", "model-router-01", "storage-usage-01", "project-monitor-01", "ai-gateway-overview-01", "availability-monitor-01", "model-detail-02", "personal-settings-01", "support-analytics-01", "security-overview-01", "infinite-log-table-01", "resource-status-all-01", "resource-metric-list-01"].includes(component)) {
        layout.chartTokens = await verifyChartTokenColors(page, {
          theme, scope: `[data-consumer="${component}"]`,
          requireMarks: !["model-detail-02", "personal-settings-01", "security-overview-01", "infinite-log-table-01"].includes(component),
        });
      }
      layout.segmentedBars = await verifySegmentedBarGeometry(page, { scope: `[data-consumer="${component}"]`, requireBars: ["chart-primitives", "credit-usage-01", "cost-estimate-01", "storage-usage-01", "resource-metric-list-01"].includes(component) });
      result.views.push({ width, theme, reducedMotion: true, ...layout });
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    const chartDestinations = component === "personal-settings-01" ? ["使用情况", "模型用量", "调用日志"]
      : component === "security-overview-01" ? ["态势"] : component === "project-monitor-01" ? ["存储", "报告"] : [];
    for (const destination of chartDestinations) {
      await example.getByText(destination, { exact: true }).first().click();
      for (const width of [390, 1440]) for (const theme of ["light", "dark"]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.emulateMedia({ colorScheme: theme });
        await page.evaluate(dark => document.documentElement.classList.toggle("dark", dark), theme === "dark");
        await page.waitForTimeout(150);
        result.views.push({ width, theme, destination, chartTokens: await verifyChartTokenColors(page, { theme, scope: `[data-consumer="${component}"]` }) });
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    if (component === "alert") {
      assert.equal(await example.locator('[data-slot="alert"]').getAttribute("role"), "group");
      await example.getByRole("button", { name: "Retry" }).click();
      await example.getByText("Recovered", { exact: true }).waitFor();
      result.checks.push("Direct Alert composition retains the host retry callback");
    }
    if (component === "mcp-detail-01") {
      const image = example.getByRole("img", { name: "Cursor 中配置 Supabase MCP 的示例界面" });
      await image.scrollIntoViewIfNeeded();
      await page.waitForFunction(() => [...document.images].some(image => image.alt === "Cursor 中配置 Supabase MCP 的示例界面" && image.complete && image.naturalWidth > 0));
      result.checks.push("Installed PNG loads through Next Image with non-zero dimensions");
    }
    if (component === "chart-primitives") {
      const toggle = example.getByRole("button", { name: /Long category label/ });
      assert.equal(await toggle.getAttribute("aria-pressed"), "true");
      await toggle.click(); assert.equal(await toggle.getAttribute("aria-pressed"), "false");
      const meter = example.getByRole("progressbar"); assert.equal(await meter.getAttribute("aria-valuetext"), "120 / 100");
      result.checks.push("Controlled legend and exact over-capacity value");
    } else if (component === "list-pagination") {
      await example.getByRole("button", { name: "下一页", exact: true }).click();
      await example.getByText("第 2 页，共 3 页", { exact: true }).waitFor();
      result.checks.push("Controlled page callback updates rendered summary");
    } else if (component === "availability-monitor-01") {
      const toggle = example.getByRole("button", { name: /Without Routing/ });
      assert.equal(await toggle.getAttribute("aria-pressed"), "true");
      await toggle.click(); assert.equal(await toggle.getAttribute("aria-pressed"), "false");
      result.checks.push("Installed availability legend toggles");
    }
    if (["chart", "availability-monitor-01", "personal-model-usage-01"].includes(component)) {
      const details = example.locator('details').first();
      assert.ok(await details.count(), "Accessible data alternative exists");
      await details.locator('summary').focus(); await page.keyboard.press('Enter');
      assert.equal(await details.getAttribute('open'), "");
      assert.ok(await details.getByRole('table').count());
      result.checks.push("Keyboard opens installed chart data table");
    }
    assert.deepEqual(result.pageErrors, [], `${component}: runtime exceptions`);
    assert.ok(!result.consoleErrors.some(error => /Hydration|hydration|Minified React error|Error:/.test(error)), `${component}: React runtime errors`);
    await page.screenshot({ path: join(directory, name + ".png") });
    result.status = "passed";
  } catch (error) {
    result.error = error.message;
    throw error;
  } finally {
    await writeFile(join(directory, name + ".json"), JSON.stringify(result, null, 2) + "\n");
    if (browser) await browser.close();
    if (app.exitCode === null && app.signalCode === null && !spawnError) {
      app.kill("SIGTERM"); await new Promise(resolve => app.once("exit", resolve));
    }
  }
}
