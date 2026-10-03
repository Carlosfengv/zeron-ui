import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const header = (page: Page) => page.locator("[data-slot=app-shell-header]");
const pending = (page: Page) => page.locator('[data-navigation-pending="true"]');
const link = (page: Page, href: string) => header(page).locator(`a[href="${href}"]`).last();

/** Install before goto so viewport prefetch cannot win the race. Each target's
 * real RSC request stays pending until explicitly released; HTML/JS are real. */
async function holdRoutes(page: Page, paths: string[]) {
  const gates = new Map(paths.map((path) => {
    let release!: () => void;
    const promise = new Promise<void>((resolve) => { release = resolve; });
    const gate = { promise, release, requests: 0 };
    return [path, gate] as const;
  }));
  await page.route("**/*", async (route) => {
    const gate = gates.get(new URL(route.request().url()).pathname);
    if (gate && route.request().headers().rsc === "1") {
      gate.requests++;
      await gate.promise;
    }
    await route.continue().catch(() => { /* A superseded request may be canceled. */ });
  });
  return {
    release: (path: string) => gates.get(path)!.release(),
    releaseAll: () => gates.forEach((gate) => gate.release()),
    requests: (path: string) => gates.get(path)!.requests,
  };
}

async function expectComplete(page: Page, path: string) {
  await expect(page).toHaveURL((url) => url.pathname === path);
  const selector = path.endsWith("/components") ? "#component-gallery-title"
    : /\/(blocks|pages)$/.test(path) ? "#artifact-gallery-title"
      : path.endsWith("/updates") ? "#updates-title" : "main h1";
  await expect(page.locator(selector)).toBeVisible();
  await expect(pending(page)).toHaveCount(0);
  await expect(page.locator("[data-route-loading]")).toHaveCount(0);
  // Scope to route fallbacks: live component previews can intentionally demo Skeleton.
  await expect(page.locator('section[aria-labelledby="updates-title"] [aria-busy="true"]')).toHaveCount(0);
}

for (const prefix of ["", "/en"]) {
  test(`${prefix || "zh"}: five primary links show router pending and complete`, async ({ context }) => {
    for (const suffix of ["", "/docs/components", "/docs/blocks", "/docs/pages", "/updates"]) {
      const path = `${prefix}${suffix}` || "/";
      // A fresh document realm prevents a previous target's prefetch from
      // satisfying a later case before its request gate is installed.
      const page = await context.newPage();
      const held = await holdRoutes(page, [path]);
      try {
        await page.goto(`${prefix}/docs`);
        // Pending may correctly end as soon as a route fallback commits. Capture
        // its rendered marker, live status and motion style in the same DOM commit.
        await page.evaluate(() => {
          const state = window as Window & { pendingSnapshots?: Array<{ href: string | null; text: string; animation: string }> };
          state.pendingSnapshots = [];
          new MutationObserver(() => {
            document.querySelectorAll('[data-navigation-pending="true"]').forEach((marker) => {
              const rect = marker.getBoundingClientRect();
              if (!rect.width || !rect.height || getComputedStyle(marker).visibility === "hidden") return;
              const anchor = marker.closest("a");
              state.pendingSnapshots!.push({ href: anchor?.getAttribute("href") ?? null,
                text: anchor?.querySelector('[role="status"]')?.textContent ?? "",
                animation: getComputedStyle(marker).animationName });
            });
          }).observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
        });
        await link(page, path).click({ noWaitAfter: true });
        await expect.poll(() => page.evaluate(({ path, reduced, label }) => {
          const state = window as Window & { pendingSnapshots?: Array<{ href: string | null; text: string; animation: string }> };
          return state.pendingSnapshots?.some((snapshot) => snapshot.href === path && snapshot.text === label
            && (!reduced || snapshot.animation === "none")) ?? false;
        }, { path, reduced: test.info().project.name.includes("reduced"), label: prefix ? "Loading page…" : "正在加载页面…" })).toBe(true);
        await expect.poll(() => held.requests(path)).toBeGreaterThan(0);
        held.release(path);
        await expectComplete(page, path);
      } finally {
        held.releaseAll();
        await page.unrouteAll({ behavior: "wait" });
        await page.close();
      }
    }
  });
}

test("newer A → B → C navigation wins even when B resolves last", async ({ page }) => {
  const b = "/en/docs/blocks", c = "/en/docs/pages";
  const held = await holdRoutes(page, [b, c]);
  try {
    await page.goto("/en/docs");
    await link(page, b).click({ noWaitAfter: true });
    await expect(link(page, b).locator('[data-navigation-pending="true"]')).toBeVisible();
    await link(page, c).click({ noWaitAfter: true });
    await expect(link(page, c).locator('[data-navigation-pending="true"]')).toBeVisible();
    held.release(c);
    await expectComplete(page, c);
    held.release(b);
    await page.unrouteAll({ behavior: "wait" });
    await page.waitForLoadState("networkidle");
    await expectComplete(page, c);
  } finally { held.releaseAll(); }
});

test("same target, modified clicks, external links and history leave no stuck pending", async ({ page, context }) => {
  await page.goto("/en/docs/pages");
  await expectComplete(page, "/en/docs/pages");
  await link(page, "/en/docs/pages").click();
  await expectComplete(page, "/en/docs/pages");

  const popupPromise = context.waitForEvent("page");
  await link(page, "/en/docs/blocks").click({ modifiers: ["ControlOrMeta"] });
  const popup = await popupPromise;
  await popup.waitForLoadState("domcontentloaded");
  await expect(popup).toHaveURL(/\/en\/docs\/blocks$/);
  await popup.close();
  await expectComplete(page, "/en/docs/pages");

  // Do not depend on GitHub availability: the real target=_blank link is clicked,
  // but the test substitutes the external document rather than contacting it.
  await context.route("https://github.com/**", (route) => route.fulfill({ status: 200, body: "External navigation test" }));
  const externalPromise = context.waitForEvent("page");
  await header(page).locator('a[href="https://github.com/Carlosfengv/zeron-ui"]').click();
  const external = await externalPromise;
  await external.waitForLoadState("domcontentloaded");
  await external.close();
  await expectComplete(page, "/en/docs/pages");

  await link(page, "/en/docs/blocks").click();
  await expectComplete(page, "/en/docs/blocks");
  await page.goBack();
  await expectComplete(page, "/en/docs/pages");
  await page.goForward();
  await expectComplete(page, "/en/docs/blocks");
});

test("unavailable component code keeps visible feedback and the shared header", async ({ page }) => {
  const manifest = JSON.parse(readFileSync(".next/app-build-manifest.json", "utf8")) as { pages: Record<string, string[]> };
  const readyChunks = new Set([
    ...manifest.pages["/[locale]/layout"],
    ...manifest.pages["/[locale]/updates/page"],
    ...manifest.pages["/[locale]/updates/loading"],
    ...manifest.pages["/[locale]/docs/components/loading"],
  ]);
  // A route entry chunk can be an empty stub; hold actual component-only code.
  // Start outside docs: its existing sidebar already imports ComponentsGallery.
  const componentChunks = new Set(manifest.pages["/[locale]/docs/components/page"]
    .filter((chunk) => !readyChunks.has(chunk)).map((chunk) => `/_next/${chunk}`));
  expect(componentChunks.size).toBeGreaterThan(0);
  let release!: () => void;
  let chunkRequests = 0;
  const heldChunk = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/_next/static/chunks/**", async (route) => {
    const pathname = decodeURIComponent(new URL(route.request().url()).pathname);
    if (componentChunks.has(pathname)) {
      chunkRequests++;
      await heldChunk;
    }
    await route.continue().catch(() => { /* Page teardown can cancel a held request. */ });
  });
  try {
    await page.goto("/en/updates");
    const originalHeader = await header(page).elementHandle();
    expect(originalHeader).not.toBeNull();
    await link(page, "/en/docs/components").click({ noWaitAfter: true });
    await expect.poll(() => chunkRequests).toBeGreaterThan(0);
    // Next can wait for ancestor client references before exposing loading.tsx.
    // Until that boundary is ready, the Link indicator must cover the gap.
    await expect(pending(page).or(page.locator('[data-route-loading="components"]')).first()).toBeVisible();
    await expect(page.locator("#component-gallery-title")).toHaveCount(0);
    expect(await originalHeader!.evaluate((node) => node.isConnected
      && node === document.querySelector("[data-slot=app-shell-header]"))).toBe(true);
    await page.screenshot({ path: test.info().outputPath("components-code-pending.png") });
    release();
    await expectComplete(page, "/en/docs/components");
    expect(await originalHeader!.evaluate((node) => node.isConnected
      && node === document.querySelector("[data-slot=app-shell-header]"))).toBe(true);
    await originalHeader!.dispose();
  } finally {
    release();
    await page.unrouteAll({ behavior: "wait" });
  }
});

test("aborted target RSC recovers through Next document navigation", async ({ page }) => {
  const target = "/en/docs/components";
  let abortedRsc = 0;
  let targetDocuments = 0;
  page.on("request", (request) => {
    if (request.isNavigationRequest() && request.resourceType() === "document"
      && new URL(request.url()).pathname === target) targetDocuments++;
  });
  // Both prefetch and demand RSC fail at the transport level. Next owns the
  // recovery; this test does not inject app state, errors, or a replacement UI.
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (new URL(request.url()).pathname === target && request.headers().rsc === "1") {
      abortedRsc++;
      await route.abort("failed");
    } else await route.continue();
  });
  await page.goto("/en/docs");
  await link(page, target).click({ noWaitAfter: true });
  await expectComplete(page, target);
  expect(abortedRsc).toBeGreaterThan(0);
  expect(targetDocuments).toBeGreaterThan(0);
});

test("Back interrupts a pending link without letting its late response replace history", async ({ page }) => {
  const target = "/en/docs/blocks";
  const held = await holdRoutes(page, [target]);
  try {
    await page.goto("/en/docs/pages");
    await link(page, "/en/updates").click();
    await expectComplete(page, "/en/updates");
    await link(page, target).click({ noWaitAfter: true });
    await expect(pending(page)).toHaveCount(1);
    await page.goBack();
    await expectComplete(page, "/en/docs/pages");
    held.release(target);
    await page.unrouteAll({ behavior: "wait" });
    await page.waitForLoadState("networkidle");
    await expectComplete(page, "/en/docs/pages");
    await page.goForward();
    await expectComplete(page, "/en/updates");
  } finally { held.releaseAll(); }
});
