import { expect, test, type Locator } from "@playwright/test";
import { readFileSync, readdirSync } from "node:fs";
import { createHash } from "node:crypto";
import { getPreviewSourceAssetUrls } from "../docs/lib/block-preview-sources.generated";

// Discover the built Recharts chunk rather than pinning a content hash.
const chartChunks = readdirSync(".next/static/chunks").filter((file) => file.endsWith(".js") && readFileSync(`.next/static/chunks/${file}`, "utf8").includes("recharts-surface"));
const aiPath = "/en/docs/pages/ai-gateway-overview-01";

// A minimum height alone does not establish the containing block required by
// the gateway's h-full sidebar. Assert geometry, not just rendered navigation.
async function expectGatewayHeight(demo: Locator) {
  await expect.poll(() => demo.evaluate((node) => Math.round(node.getBoundingClientRect().height))).toBe(1000);
  await expect.poll(() => demo.locator(":scope > section").evaluate((node) => Math.round(node.getBoundingClientRect().height))).toBe(1000);
}

for (const width of [1440, 1280, 1279, 390]) {
  test(`AI detail bounds and navigation at ${width}px`, async ({ page }, testInfo) => {
    // The matrix covers each viewport once; loading/recovery tests still run in both projects.
    test.skip(testInfo.project.name === "chromium-mobile", "Covered by the explicit viewport matrix");
    await page.setViewportSize({ width, height: width === 390 ? 844 : 960 });
    await page.goto(aiPath);
    const demo = page.locator('[data-detail-demo="ready"]');
    await expect(demo.locator(".recharts-surface").first()).toBeAttached();
    await expectGatewayHeight(demo);
    const trigger = demo.getByRole("button", { name: "Open AI gateway navigation", exact: true });
    if (width >= 1280) {
      await expect(trigger).toBeHidden();
      const sidebar = demo.locator('[data-slot="sidebar-panel"]');
      await expect(sidebar).toBeVisible();
      const bounds = await sidebar.boundingBox();
      const root = await demo.boundingBox();
      expect(bounds!.height).toBeCloseTo(1000, 0);
      expect(bounds!.width).toBeCloseTo(280, 0);
      expect(bounds!.y).toBeCloseTo(root!.y, 0);
      await sidebar.getByRole("link", { name: "Overview", exact: true }).click();
      await expect(page).toHaveURL(/#overview$/);
    } else {
      await expect(trigger).toBeVisible();
      await expect(demo.locator('[data-slot="sidebar-panel"]')).toHaveCount(0);
      await trigger.click();
      const drawer = page.getByRole("dialog", { name: "AI gateway navigation", exact: true });
      await expect(drawer).toBeVisible();
      await expect(drawer.getByRole("link", { name: "Settings", exact: true })).toBeInViewport();
      await drawer.getByRole("link", { name: "Overview", exact: true }).click();
      await expect(drawer).toBeHidden();
    }
    await demo.getByRole("tab", { name: "7d", exact: true }).click();
    await expect(demo.getByRole("tab", { name: "7d", exact: true })).toHaveAttribute("aria-selected", "true");
    const content = demo.locator('[data-slot="page-content"]');
    const scroll = await content.evaluate((node) => {
      node.scrollTop = node.scrollHeight;
      return { top: node.scrollTop, height: node.clientHeight, total: node.scrollHeight };
    });
    expect(scroll.total).toBeGreaterThan(scroll.height);
    expect(scroll.top).toBeGreaterThan(0);
    await expectGatewayHeight(demo);
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1)).toBe(false);
  });
}

test("standalone AI gateway retains viewport-height sidebar", async ({ page }) => {
  await page.goto("/en/block-demo/ai-gateway-overview-01");
  await expect(page.locator(".recharts-surface").first()).toBeAttached();
  await expect(page.locator("[data-detail-demo]")).toHaveCount(0);
  const layout = page.locator('[data-slot="page-layout"]');
  await expect.poll(() => layout.evaluate((node) => Math.round(node.getBoundingClientRect().height))).toBe(page.viewportSize()!.height);
  if (page.viewportSize()!.width >= 1280) {
    await expect.poll(() => page.locator('[data-slot="sidebar-panel"]').evaluate((node) => Math.round(node.getBoundingClientRect().height))).toBe(page.viewportSize()!.height);
  } else {
    await expect(page.getByRole("button", { name: "Open AI gateway navigation", exact: true })).toBeVisible();
  }
});

test("AI documentation is available while its chart dependency is held", async ({ page }) => {
  expect(chartChunks.length).toBeGreaterThan(0);
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  let held = 0;
  await page.route("**/*", async (route) => {
    if (route.request().headers()["next-router-prefetch"] === "1") return route.abort();
    if (chartChunks.some((chunk) => route.request().url().endsWith(`/${chunk}`))) { held++; await gate; }
    await route.continue().catch(() => {});
  });
  try {
    await page.goto("/en/docs/pages");
    await page.locator(`a[href="${aiPath}"]`).first().click();
    await expect(page.locator("#artifact-title")).toHaveText("AI Gateway Overview 1");
    await expect(page.getByRole("heading", { name: "Data integration", exact: true })).toBeAttached();
    await expect.poll(() => held).toBeGreaterThan(0);
    await expect(page.locator(".recharts-surface")).toHaveCount(0);
    await expect(page.locator('[data-detail-demo="pending"]')).toBeAttached();
    await expect.poll(() => page.locator("[data-detail-demo]").evaluate((node) => Math.round(node.getBoundingClientRect().height))).toBe(1000);
    await expect(page.getByText("Loading preview…", { exact: true })).toBeInViewport();
    release();
    await expect(page.locator(".recharts-surface").first()).toBeAttached();
    await expect(page.locator('[data-detail-demo="ready"]')).toBeAttached();
    await expectGatewayHeight(page.locator("[data-detail-demo]"));
  } finally {
    release();
    await page.unrouteAll({ behavior: "wait" });
  }
});

test("AI Code loads only on intent and preserves range across tab changes", async ({ page }) => {
  const sources: string[] = [];
  page.on("request", (request) => { if (request.url().includes("/docs-source/")) sources.push(request.url()); });
  await page.goto(aiPath);
  const preview = page.locator('[data-slot="component-preview-content"]');
  await expect(preview.locator(".recharts-surface").first()).toBeAttached();
  expect(sources).toHaveLength(0);
  await preview.getByRole("tab", { name: "7d", exact: true }).click();
  await expect(preview.getByRole("tab", { name: "7d", exact: true })).toHaveAttribute("aria-selected", "true");
  await expectGatewayHeight(preview.locator("[data-detail-demo]"));
  await page.getByRole("tab", { name: "Code", exact: true }).click();
  await expect.poll(() => sources.length).toBe(1);
  await expect(preview).toBeHidden();
  await expect(page.getByText('"use client";', { exact: false }).first()).toBeAttached();
  await page.getByRole("tab", { name: "Preview", exact: true }).click();
  await expect(preview.getByRole("tab", { name: "7d", exact: true })).toHaveAttribute("aria-selected", "true");
  await expectGatewayHeight(preview.locator("[data-detail-demo]"));
  await page.getByRole("tab", { name: "Code", exact: true }).click();
  expect(sources).toHaveLength(1);
});

test("DataGrid secondary demo activates on approach and preserves edits on scrolling away", async ({ page }) => {
  await page.goto("/en/docs/components/data-grid");
  const demos = page.locator("[data-detail-demo]");
  const first = demos.first();
  const second = demos.nth(1);
  await expect(first).toHaveAttribute("data-detail-demo", "ready");
  // On taller desktops the second example may already be near the viewport.
  await second.scrollIntoViewIfNeeded();
  await expect(second).toHaveAttribute("data-detail-demo", "ready");
  for (const demo of [first, second]) {
    expect(await demo.evaluate((node) => (node as HTMLElement).style.height)).toBe("");
    expect((await demo.boundingBox())!.height).toBeLessThan(1000);
    const bounds = await demo.evaluate((node) => ({
      height: node.getBoundingClientRect().height,
      minimum: parseFloat(getComputedStyle(node).minHeight),
      bottom: node.getBoundingClientRect().bottom,
      childBottom: node.firstElementChild!.getBoundingClientRect().bottom,
    }));
    expect(bounds.height).toBeGreaterThanOrEqual(bounds.minimum);
    expect(bounds.bottom + 1).toBeGreaterThanOrEqual(bounds.childBottom);
  }
  const cell = second.locator('[role="gridcell"]').first();
  const wrapper = cell.locator('[data-slot="grid-cell-wrapper"]');
  await wrapper.click();
  await wrapper.press("F2");
  const editor = cell.locator('[contenteditable="true"]');
  await expect(editor).toBeVisible();
  await editor.fill("Preserved pilot edit");
  await editor.press("Enter");
  await page.getByRole("heading", { name: "API Reference", exact: true }).scrollIntoViewIfNeeded();
  await second.scrollIntoViewIfNeeded();
  await expect(cell).toContainText("Preserved pilot edit");
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  expect(overflow).toBe(false);
});

for (const locale of ["en", "zh"] as const) {
  test(`${locale}: failed source request is localized and retry loads exact immutable source`, async ({ page, request }) => {
    let failed = false;
    let sourceUrl = "";
    await page.route("**/docs-source/*.txt", async (route) => {
      sourceUrl = route.request().url();
      if (!failed) { failed = true; return route.fulfill({ status: 503, contentType: "text/plain", body: "Unavailable" }); }
      return route.continue();
    });
    await page.goto(locale === "en" ? aiPath : "/docs/pages/ai-gateway-overview-01");
    await expect(page.locator("#artifact-title")).toHaveText(locale === "en" ? "AI Gateway Overview 1" : "AI 网关总览 1");
    await expect(page.getByRole("heading", { name: locale === "en" ? "Installation" : "安装", exact: true })).toBeAttached();
    await page.getByRole("tab", { name: locale === "en" ? "Code" : "代码", exact: true }).click();
    await expect(page.getByText(locale === "en" ? "Source code unavailable" : "源码加载失败", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: locale === "en" ? "Retry source" : "重试加载源码", exact: true }).click();
    await expect(page.getByText('"use client";', { exact: false }).first()).toBeAttached();
    const response = await request.get(sourceUrl);
    expect(response.ok()).toBe(true);
    expect(response.headers()["content-type"]).toContain("text/plain");
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response.headers()["cache-control"]).toContain("immutable");
    expect(await response.text()).toBe(readFileSync("packages/blocks/src/application/ai-gateway-overview-01/ai-gateway-overview.tsx", "utf8"));
  });
}

test("failed AI demo import leaves visible recovery without blocking documentation", async ({ page }) => {
  let fail = true;
  await page.route("**/*.js", async (route) => {
    if (fail && chartChunks.some((chunk) => route.request().url().endsWith(`/${chunk}`))) return route.abort("failed");
    return route.continue();
  });
  await page.goto(aiPath);
  await expect(page.locator("#artifact-title")).toHaveText("AI Gateway Overview 1");
  await expect(page.getByText("Preview unavailable", { exact: true })).toBeVisible();
  await expect.poll(() => page.locator("[data-detail-demo]").evaluate((node) => Math.round(node.getBoundingClientRect().height))).toBe(1000);
  const retry = page.locator("[data-detail-demo]").getByRole("button", { name: "Retry", exact: true });
  await expect(retry).toBeInViewport();
  fail = false;
  await retry.click();
  await expect(page.locator(".recharts-surface").first()).toBeAttached();
  await expectGatewayHeight(page.locator("[data-detail-demo]"));
});

for (const prefix of ["/en", ""] as const) {
  test(`${prefix || "zh"}: DataGrid server description and API labels match route locale`, async ({ page }) => {
    await page.goto(`${prefix}/docs/components/data-grid`);
    await expect(page.getByRole("heading", { name: "DataGrid", exact: true, level: 1 })).toBeAttached();
    await expect(page.getByRole("heading", { name: prefix ? "Installation" : "安装", exact: true })).toBeAttached();
    await expect(page.getByRole("heading", { name: prefix ? "API Reference" : "API 参考", exact: true })).toBeAttached();
    await expect(page.locator("th").filter({ hasText: prefix ? /^Prop$/ : /^属性$/ }).first()).toBeAttached();
  });
}

test("all generated sources are served as immutable plain text and unknown hashes are not", async ({ request }) => {
  for (const url of getPreviewSourceAssetUrls()) {
    const response = await request.get(url);
    expect(response.status()).toBe(200);
    expect(response.headers()["content-type"]).toContain("text/plain");
    expect(response.headers()["x-content-type-options"]).toBe("nosniff");
    expect(response.headers()["cache-control"]).toContain("immutable");
    expect(`/docs-source/${createHash("sha256").update(await response.body()).digest("hex")}.txt`).toBe(url);
  }
  const missing = await request.get(`/docs-source/${"0".repeat(64)}.txt`);
  expect(missing.status()).toBe(404);
  expect(missing.headers()["cache-control"] ?? "").not.toContain("immutable");
});

test("leaving a loading AI demo does not replace newer content when its chunk arrives", async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => { release = resolve; });
  let held = 0;
  await page.route("**/*.js", async (route) => {
    if (chartChunks.some((chunk) => route.request().url().endsWith(`/${chunk}`))) { held++; await gate; }
    await route.continue().catch(() => {});
  });
  try {
    await page.goto(aiPath, { waitUntil: "domcontentloaded" });
    await expect(page.locator("#artifact-title")).toHaveText("AI Gateway Overview 1");
    await expect.poll(() => held).toBeGreaterThan(0);
    await page.locator('[data-slot="app-shell-header"] a[href="/en/docs/components"]').last().click();
    await expect(page).toHaveURL(/\/en\/docs\/components$/);
    await expect(page.locator("#component-gallery-title")).toBeVisible();
    release();
    await page.unrouteAll({ behavior: "wait" });
    await expect(page.locator("#component-gallery-title")).toBeVisible();
    await expect(page.locator("#artifact-title")).toHaveCount(0);
    await page.goBack();
    await expect(page.locator("#artifact-title")).toHaveText("AI Gateway Overview 1");
    await expect(page.locator(".recharts-surface").first()).toBeAttached();
  } finally {
    release();
    await page.unrouteAll({ behavior: "wait" });
  }
});
