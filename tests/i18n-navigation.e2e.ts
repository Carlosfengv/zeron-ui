import { expect, test } from "@playwright/test";

test("desktop language switching preserves path, query, and hash", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto("/docs/button?source=e2e#basic");

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByText("Language", { exact: true }).waitFor();
  const languageRow = page.getByText("Language", { exact: true }).locator("..");
  await languageRow.getByRole("combobox").click();
  await expect(page.getByText("简体中文", { exact: true })).toBeVisible();
  await page.getByText("简体中文", { exact: true }).click();

  await expect(page).toHaveURL(/\/zh-cn\/docs\/button\?source=e2e#basic$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN");
  await expect(page.getByText("选择变体", { exact: true })).toBeVisible();
  await expect(page.getByText("语言", { exact: true })).toBeVisible();

  await page.getByRole("navigation", { name: "组件导航" }).getByRole("link", { name: "Card" }).click();
  await expect(page).toHaveURL("/zh-cn/docs/card");
  await page.getByRole("link", { name: "上一页：Button" }).click();
  await expect(page).toHaveURL("/zh-cn/docs/button");
});

test("mobile navigation exposes a locale-safe language switcher and keyboard pager", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/zh-cn/docs/button");

  await page.getByRole("button", { name: "打开导航" }).click();
  await page.getByText("语言", { exact: true }).waitFor();
  const languageRow = page.getByText("语言", { exact: true }).locator("..");
  await languageRow.getByRole("combobox").click();
  await expect(page.getByText("English", { exact: true })).toBeVisible();
  await page.getByText("English", { exact: true }).click();

  await expect(page).toHaveURL("/docs/button");
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL("/docs/card");
});
