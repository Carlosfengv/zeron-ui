import { expect, test, type Locator, type Page } from "@playwright/test";

async function tabTo(page: Page, target: Locator) {
  for (let index = 0; index < 120; index += 1) {
    await page.keyboard.press("Tab");
    if (await target.evaluate((element) => document.activeElement === element)) return;
  }
  throw new Error("Keyboard navigation did not reach the expected control.");
}

test("desktop: compounds and previews follow focus-visible semantics", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "Desktop-only focus checks");

  await page.goto("/docs/components/input-group");

  const input = page.getByRole("textbox", { name: "Search projects" });
  const clear = page.getByRole("button", { name: "Clear search" });
  const group = clear.locator("xpath=ancestor::*[@data-slot='input-group']");
  const preview = clear.locator("xpath=ancestor::*[@data-slot='component-preview-content']");

  await preview.click({ position: { x: 4, y: 4 } });
  await expect(input).not.toBeFocused();

  await clear.click();
  expect(await clear.evaluate((element) => element.matches(":focus-visible"))).toBe(false);
  expect(
    await group.evaluate((element) =>
      element.matches(':has([data-slot="input-group-control"]:focus-visible)')
    )
  ).toBe(false);

  await input.click();
  expect(await input.evaluate((element) => element.matches(":focus-visible"))).toBe(true);
  expect(
    await group.evaluate((element) =>
      element.matches(':has([data-slot="input-group-control"]:focus-visible)')
    )
  ).toBe(true);

  await page.keyboard.press("Tab");
  await expect(clear).toBeFocused();
  expect(await clear.evaluate((element) => element.matches(":focus-visible"))).toBe(true);
  expect(
    await group.evaluate((element) =>
      element.matches(':has([data-slot="input-group-control"]:focus-visible)')
    )
  ).toBe(false);
});

test("desktop: NavMenu gives its moving indicator only to a visible primary trigger", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-desktop", "Desktop-only focus checks");

  await page.goto("/docs/components/nav-menu");

  const nav = page.getByRole("navigation", { name: "Preview navigation" });
  const projects = nav.getByRole("link", { name: "Projects" });
  const options = nav.getByRole("button", { name: "Project options" });
  const indicator = nav.locator('[data-slot="nav-item-focus-indicator"]');

  await projects.click();
  expect(await projects.evaluate((element) => element.matches(":focus-visible"))).toBe(false);
  await expect(indicator).toHaveCount(0);

  await tabTo(page, projects);
  expect(await projects.evaluate((element) => element.matches(":focus-visible"))).toBe(true);
  await expect(indicator).toHaveCount(1);

  await projects.click();
  await expect(indicator).toHaveCount(0);

  await tabTo(page, options);
  expect(await options.evaluate((element) => element.matches(":focus-visible"))).toBe(true);
  await expect(indicator).toHaveCount(0);
});

test("mobile: compact drawer restores the opening trigger after Escape", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium-mobile", "Compact drawer requires a mobile viewport");

  await page.goto("/docs/components/button");
  const openNavigation = page.getByRole("button", { name: "Open navigation" });

  await openNavigation.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");

  await expect(openNavigation).toBeFocused();
  expect(await openNavigation.evaluate((element) => element.matches(":focus-visible"))).toBe(true);
});
