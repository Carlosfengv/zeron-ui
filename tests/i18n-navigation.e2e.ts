import { expect, test } from "@playwright/test";

test("desktop language switching preserves path, query, and hash", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/docs/components/button?source=e2e#basic");

  const header = page.getByRole("banner");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await header.getByRole("link", { name: "Switch to English", exact: true }).click();

  await expect(page).toHaveURL(/\/en\/docs\/components\/button\?source=e2e#basic$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("textbox", { name: "Button label", exact: true })).toBeVisible();
  await expect(header.getByRole("link", { name: "切换至中文", exact: true })).toBeVisible();

  const nextComponent = page.getByRole("navigation", { name: "Triggers & execution", exact: true })
    .getByRole("link", { name: "ButtonGroup", exact: true });
  await expect(nextComponent).toHaveAttribute("href", "/en/docs/components/button-group");
  await nextComponent.click();
  await expect(page).toHaveURL("/en/docs/components/button-group");
  await page.getByRole("link", { name: "Previous: Button", exact: true }).click();
  await expect(page).toHaveURL("/en/docs/components/button");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("locale links preserve the latest fragment for same-page changes and new tabs", async ({ page, context }) => {
  await page.goto("/docs/components/button?source=e2e#basic");
  const languageSwitch = page.getByRole("banner").getByRole("link", { name: "Switch to English", exact: true });
  await expect(languageSwitch).toHaveAttribute("href", "/en/docs/components/button?source=e2e#basic");

  await page.evaluate(() => { window.location.hash = "#updated"; });
  await expect(languageSwitch).toHaveAttribute("href", "/en/docs/components/button?source=e2e#updated");
  const [modifiedTab] = await Promise.all([
    context.waitForEvent("page"),
    languageSwitch.click({ modifiers: ["ControlOrMeta"] }),
  ]);
  await expect(modifiedTab).toHaveURL("/en/docs/components/button?source=e2e#updated");
  await expect(modifiedTab.locator("html")).toHaveAttribute("lang", "en");
  await modifiedTab.close();
  await expect(page).toHaveURL("/docs/components/button?source=e2e#updated");

  // Local galleries also update history directly, without firing hashchange.
  await page.evaluate(() => { window.history.replaceState(window.history.state, "", "#latest"); });
  const [middleClickTab] = await Promise.all([
    context.waitForEvent("page"),
    languageSwitch.click({ button: "middle" }),
  ]);
  await expect(middleClickTab).toHaveURL("/en/docs/components/button?source=e2e#latest");
  await expect(middleClickTab.locator("html")).toHaveAttribute("lang", "en");
  await middleClickTab.close();
  await expect(page).toHaveURL("/docs/components/button?source=e2e#latest");

  await page.evaluate(() => { window.history.replaceState(window.history.state, "", "#current"); });
  await languageSwitch.click();
  await expect(page).toHaveURL("/en/docs/components/button?source=e2e#current");
  await page.getByRole("banner").getByRole("link", { name: "切换至中文", exact: true }).click();
  await expect(page).toHaveURL("/docs/components/button?source=e2e#current");
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
});

test("mobile navigation exposes a locale-safe language switcher and keyboard pager", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/components/button");

  // Component pages expose the locale switch directly in the header on mobile.
  const languageSwitch = page.getByRole("banner").getByRole("link", { name: "Switch to English", exact: true });
  await expect(languageSwitch).toBeInViewport();
  await languageSwitch.click();

  await expect(page).toHaveURL("/en/docs/components/button");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("banner").getByRole("link", { name: "切换至中文", exact: true })).toBeInViewport();

  // Editing controls must keep their arrow keys instead of changing pages.
  await page.getByRole("textbox", { name: "Button label", exact: true }).press("ArrowRight");
  await expect(page).toHaveURL("/en/docs/components/button");
  await page.getByRole("heading", { name: "Button", exact: true, level: 1 }).click();
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL("/en/docs/components/button-group");
  await page.keyboard.press("ArrowLeft");
  await expect(page).toHaveURL("/en/docs/components/button");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});
