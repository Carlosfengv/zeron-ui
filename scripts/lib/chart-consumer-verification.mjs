import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { basename, join } from "node:path";

const nativeOnly = new Set([
  "ai-gateway-overview-01", "resource-cost-01", "personal-settings-01",
  "resource-status-all-01", "project-monitor-01", "chart-summary",
]);

export async function assertChartInstall(consumer, component, manager) {
  if (!nativeOnly.has(component)) return;
  const lockfile = await readFile(join(consumer, manager === "npm" ? "package-lock.json" : "pnpm-lock.yaml"), "utf8");
  if (manager === "npm") {
    assert.ok(!Object.keys(JSON.parse(lockfile).packages).some(path => /(?:^|\/)node_modules\/recharts$/.test(path)), `${component} installed recharts`);
  } else {
    assert.doesNotMatch(lockfile, /^\s+['"]?recharts@/m, `${component} installed recharts`);
  }
}

export function chartConsumerExample(component, framework) {
  if (component !== "chart" && component !== "chart-summary") return undefined;
  const prefix = framework === "next" ? "@/" : "@/src/";
  const legacy = component === "chart";
  return [
    '"use client";',
    `import { DonutSummary, TimeSeriesChart${legacy ? ", ChartContainer, ChartTooltip, ChartTooltipContent" : ""} } from "${prefix}components/ui/${component}";`,
    ...(legacy ? [
      'import { AreaChart, Area } from "recharts";',
      'const data = [{ count: 2 }, { count: 4 }];',
      'const legacyChart = <ChartContainer config={{ count: { label: "Requests", color: "blue" } }} className="h-40"><AreaChart data={data}><Area dataKey="count" isAnimationActive={false} /><ChartTooltip content={<ChartTooltipContent />} /></AreaChart></ChartContainer>;',
    ] : []),
    `${framework === "next" ? "export default " : ""}function Page() { return <main>${legacy ? "{legacyChart}" : ""}<DonutSummary aria-label="Request breakdown" segments={[{ id: "ok", label: "Success", value: 4 }]} /><TimeSeriesChart label="Request history" data={[{timestamp: 0, values: { count: 2 }}, {timestamp: 3600000, values: { count: 4 }}]} series={[{id: "count", label: "Requests"}]} locale="en" timeZone="UTC" /></main>; }`,
    ...(framework === "next" ? [] : [
      'import { createRoot } from "react-dom/client";',
      'import "./index.css";',
      'createRoot(document.getElementById("root")!).render(<Page />);',
    ]),
  ].join("\n");
}

export async function verifyInstalledCharts(consumer, check) {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.route("http://zeron-consumer.test/**", route => {
      const { pathname } = new URL(route.request().url());
      if (pathname === "/") return route.fulfill({ path: join(consumer, "dist/index.html") });
      if (pathname.startsWith("/assets/")) return route.fulfill({ path: join(consumer, "dist/assets", basename(pathname)) });
      return route.abort();
    });
    await page.goto("http://zeron-consumer.test/");
    await check(page);
    assert.deepEqual(errors, [], "Installed charts have no browser exceptions");
  } finally {
    await browser.close();
  }
}

export async function verifyMountedChart(consumer, component) {
  if (!["chart", "chart-summary", "agent-queue-01"].includes(component)) return;
  await verifyInstalledCharts(consumer, async page => {
    if (component === "agent-queue-01") {
      const depth = page.getByRole("img", { name: /Queue depth: 1 waiting now/ });
      await depth.locator("path.recharts-area-area").waitFor();
      await depth.locator(".recharts-reference-dot").waitFor();
      return;
    }
    if (component === "chart") await page.locator("path.recharts-area-area").waitFor();
    await page.getByRole("img", { name: "Request breakdown" }).locator("svg path").first().waitFor();
    const table = page.locator('[data-slot="time-series-chart"] details');
    await table.locator("summary").click();
    await table.getByRole("cell", { name: "4", exact: true }).waitFor();
  });
}
