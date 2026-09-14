import { expect, test } from "@playwright/test";

test("switching collections keeps links and keyboard paging in the active collection", async ({ page }) => {
  await page.goto("/docs/blocks");
  const header = page.locator("[data-slot=app-shell-header]");
  await header.getByRole("link", { name: "页面", exact: true }).click();
  await expect(page.getByRole("link", { name: "Agent Trace", exact: true })).toHaveAttribute("href", "/docs/pages/agent-trace-01");
  await expect(page.getByRole("link", { name: "Infinite Log Table", exact: true })).toHaveAttribute("href", "/docs/pages/infinite-log-table-01");
  await expect(page.getByRole("link", { name: "Resource List Table", exact: true })).toHaveCount(0);

  // The primary navigation owns its arrow keys; it must not turn the page.
  await header.getByRole("link", { name: "页面", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(header.getByRole("link", { name: "更新日志", exact: true })).toBeFocused();
  await expect(page).toHaveURL("/docs/pages");

  await page.getByRole("heading", { name: "页面", exact: true }).click();
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL("/docs/pages/login-01");
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL("/docs/pages/signup-01");

  await header.getByRole("link", { name: "区块", exact: true }).click();
  await page.getByRole("heading", { name: "区块", exact: true }).click();
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL("/docs/blocks/availability-monitor-01");
});

test("local search preserves spaces, URL state and browser history without route requests", async ({ page }) => {
  await page.goto("/en/docs/pages?source=review#artifact-gallery-title");
  const search = page.getByRole("textbox", { name: "Search pages or scenarios…" });
  await expect(search).toBeVisible();
  const routeRequests: string[] = [];
  page.on("request", (request) => {
    if (request.headers().rsc === "1" && new URL(request.url()).pathname === "/en/docs/pages") {
      routeRequests.push(request.url());
    }
  });
  await search.pressSequentially("agent ", { delay: 40 });
  await expect(search).toHaveValue("agent ");
  await expect(page).toHaveURL((url) => url.searchParams.get("q") === "agent ");
  await search.pressSequentially("trace", { delay: 40 });
  await expect(search).toHaveValue("agent trace");
  await expect(page).toHaveURL((url) => url.searchParams.get("q") === "agent trace"
    && url.searchParams.get("source") === "review" && url.hash === "#artifact-gallery-title");
  await expect(page.getByRole("link", { name: "Agent Trace", exact: true })).toBeVisible();
  expect(routeRequests).toEqual([]);

  await page.getByRole("link", { name: "Agent Trace", exact: true }).click();
  await expect(page).toHaveURL("/en/docs/pages/agent-trace-01");
  await page.goBack();
  await expect(search).toHaveValue("agent trace");
  await page.getByRole("link", { name: "切换至中文", exact: true }).click();
  await expect(page).toHaveURL((url) => url.pathname === "/docs/pages"
    && url.searchParams.get("q") === "agent trace" && url.searchParams.get("source") === "review");
  await page.getByRole("textbox", { name: "搜索页面或业务场景…" }).fill("no-such-page");
  await expect(page.getByText("没有符合当前搜索和筛选条件的内容。", { exact: true })).toBeVisible();
});

test("collection galleries fit the mobile viewport and keep all navigation reachable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const collection of ["blocks", "pages"]) {
    await page.goto(`/docs/${collection}`);
    await expect(page.locator("#artifact-gallery-title")).toBeVisible();
    const header = page.locator("[data-slot=app-shell-header]");
    for (const name of ["组件", "区块", "页面", "更新日志"]) {
      await expect(header.getByRole("link", { name, exact: true })).toBeInViewport();
    }
    expect(await page.evaluate(() => ({
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      verticalOverflow: document.documentElement.scrollHeight > window.innerHeight,
    }))).toEqual({ horizontalOverflow: false, verticalOverflow: false });
    const sidebar = page.locator("[data-slot=page-sidebar]").first();
    const scrollContainer = sidebar.locator("..");
    await scrollContainer.evaluate((element) => { element.scrollTop = element.scrollHeight; });
    await expect(page.getByRole("link", { name: collection === "pages" ? "ZLR Protection Groups" : "TopNav App Shell", exact: true })).toBeInViewport();
  }
});
