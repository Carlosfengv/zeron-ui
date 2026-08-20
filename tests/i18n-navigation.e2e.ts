import { expect, test } from "@playwright/test";

test("desktop language switching preserves path, query, and hash", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/docs/components/button?source=e2e#basic");

  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await page.getByText("语言", { exact: true }).waitFor();
  const languageRow = page.getByText("语言", { exact: true }).locator("..");
  await languageRow.getByRole("combobox").click();
  await expect(page.getByText("English", { exact: true })).toBeVisible();
  await page.getByText("English", { exact: true }).click();

  await expect(page).toHaveURL(/\/en\/docs\/components\/button\?source=e2e#basic$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByText("Select variant", { exact: true })).toBeVisible();
  await expect(page.getByText("Language", { exact: true })).toBeVisible();

  await page.getByRole("navigation", { name: "Components navigation" }).getByRole("link", { name: "Card" }).click();
  await expect(page).toHaveURL("/en/docs/components/card");
  await page.getByRole("link", { name: "Previous: Button" }).click();
  await expect(page).toHaveURL("/en/docs/components/button");
});

test("mobile navigation exposes a locale-safe language switcher and keyboard pager", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/docs/components/button");

  await page.getByRole("button", { name: "打开导航" }).click();
  await page.getByText("语言", { exact: true }).waitFor();
  const languageRow = page.getByText("语言", { exact: true }).locator("..");
  await languageRow.getByRole("combobox").click();
  await expect(page.getByText("English", { exact: true })).toBeVisible();
  await page.getByText("English", { exact: true }).click();

  await expect(page).toHaveURL("/en/docs/components/button");
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL("/en/docs/components/card");
});
