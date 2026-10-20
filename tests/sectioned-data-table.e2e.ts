import { expect, test } from "@playwright/test";

const translations = {
  "zh-CN": { title: "大模型与云资源运维", status: "运行状态", kind: "资源类型", provider: "云平台", collapse: "收起 运行中", expand: "展开 运行中", more: "显示 运行中 的另外 10 条", less: "收起 运行中 的更多记录", search: "搜索资源", reset: "清空筛选", empty: "没有匹配的资源", total: "20 项匹配，共 20 项资源", one: "1 项匹配，共 20 项资源", view: "自定义列", hide: "显示 区域 列", region: "区域", addGroup: "添加到 已停止", sample: "示例资源 21", inspect: "查看 Atlas Chat · 32B", maintenance: "维护中" },
  en: { title: "AI resource operations", status: "Status", kind: "Resource type", provider: "Cloud platform", collapse: "Collapse Running", expand: "Expand Running", more: "Show 10 more in Running", less: "Show less in Running", search: "Search resources", reset: "Clear filters", empty: "No matching resources", total: "20 matching of 20 resources", one: "1 matching of 20 resources", view: "Customize columns", hide: "Show Region column", region: "Region", addGroup: "Add to Stopped", sample: "Sample resource 21", inspect: "Inspect Atlas Chat · 32B", maintenance: "Maintenance" },
} as const;

for (const locale of ["zh-CN", "en"] as const) {
  const copy = translations[locale];
  test(`${locale}: dimensions, previews, keyboard expansion and group creation`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`/${locale}/block-demo/grouped-data-table-02`);
    const block = page.locator('[data-slot="sectioned-data-table"]');
    await expect(block.getByRole("heading", { name: copy.title })).toBeVisible();
    await expect(block.getByRole("table")).toHaveCount(5);
    await expect(block.getByText("Atlas SFT · v3", { exact: true })).toHaveCount(0);
    await block.getByRole("button", { name: copy.more, exact: true }).click();
    await expect(block.getByText("Atlas SFT · v3", { exact: true })).toBeVisible();
    await block.getByRole("button", { name: copy.less, exact: true }).click();
    const collapse = block.getByRole("button", { name: copy.collapse, exact: true });
    await collapse.focus();
    await collapse.press("Enter");
    await expect(block.getByText("Atlas Chat · 32B", { exact: true })).toHaveCount(0);
    await expect(block.getByRole("button", { name: copy.expand, exact: true })).toBeFocused();
    await block.getByRole("tab", { name: copy.kind, exact: true }).click();
    await expect(block.getByText("Atlas Chat · 32B", { exact: true })).toBeVisible();
    await expect(block.getByRole("table")).toHaveCount(5);
    await block.getByRole("tab", { name: copy.status, exact: true }).click();
    await expect(block.getByText("Atlas Chat · 32B", { exact: true })).toHaveCount(0);
    await block.getByRole("button", { name: copy.expand, exact: true }).press("Space");
    await expect(block.getByText(copy.total, { exact: true })).toBeVisible();
    await block.getByRole("button", { name: copy.addGroup, exact: true }).click();
    const stopped = block.locator('[data-slot="table-section"][data-group-value="stopped"]');
    await expect(stopped.getByText(copy.sample, { exact: true })).toBeVisible();
    await block.getByRole("button", { name: copy.inspect, exact: true }).click();
    await expect(page.getByRole("dialog").getByText("infer-atlas-chat", { exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await block.getByRole("tab", { name: copy.provider, exact: true }).click();
    await expect(block.getByRole("table")).toHaveCount(4);
    expect(errors).toEqual([]);
  });

  test(`${locale}: complete-data search, shared facets and columns across dimensions`, async ({ page }) => {
    await page.goto(`/${locale}/block-demo/grouped-data-table-02`);
    const block = page.locator('[data-slot="sectioned-data-table"]');
    await block.getByRole("textbox", { name: copy.search, exact: true }).fill("train-atlas-sft");
    await expect(block.getByText("Atlas SFT · v3", { exact: true })).toBeVisible();
    await block.getByRole("tab", { name: copy.provider, exact: true }).click();
    await expect(block.getByText("Atlas SFT · v3", { exact: true })).toBeVisible();
    await expect(block.getByText(copy.one, { exact: true })).toBeVisible();
    await block.getByRole("textbox", { name: copy.search, exact: true }).fill("does-not-exist");
    await expect(block.getByText(copy.empty, { exact: true })).toBeVisible();
    await block.getByRole("button", { name: copy.reset, exact: true }).first().click();
    await block.getByRole("button", { name: copy.status, exact: true }).click();
    await page.getByRole("checkbox", { name: new RegExp(copy.maintenance) }).click();
    await page.keyboard.press("Escape");
    await expect(block.getByRole("table")).toHaveCount(2);
    await block.getByRole("tab", { name: copy.kind, exact: true }).click();
    await expect(block.getByRole("table")).toHaveCount(3);
    await block.getByRole("button", { name: copy.reset, exact: true }).click();
    await block.getByRole("button", { name: copy.view, exact: true }).click();
    await page.getByRole("checkbox", { name: copy.hide, exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(block.getByRole("columnheader", { name: copy.region, exact: true })).toHaveCount(0);
    await block.getByRole("tab", { name: copy.provider, exact: true }).click();
    await expect(block.getByRole("columnheader", { name: copy.region, exact: true })).toHaveCount(0);
  });
}

test("light/dark responsive geometry, tab keyboard navigation and focus", async ({ page }) => {
  await page.goto("/en/block-demo/grouped-data-table-02");
  const block = page.locator('[data-slot="sectioned-data-table"]');
  await expect(block.getByRole("heading", { name: "AI resource operations" })).toBeVisible();
  const status = block.getByRole("tab", { name: "Status", exact: true });
  await status.focus();
  await status.press("ArrowRight");
  await expect(block.getByRole("tab", { name: "Resource type", exact: true })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(block.getByRole("tab", { name: "Resource type", exact: true })).toHaveAttribute("aria-selected", "true");
  for (const theme of ["light", "dark"] as const) {
    await page.evaluate((value) => {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(value);
    }, theme);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const button = block.getByRole("button", { name: "Add sample resource", exact: true });
    const geometry = await button.evaluate((element) => {
      const icon = element.querySelector("svg")!.getBoundingClientRect();
      const label = element.querySelector('[data-slot="button-label"]')!.getBoundingClientRect();
      return { delta: Math.abs(icon.y + icon.height / 2 - label.y - label.height / 2), separated: icon.right <= label.left, height: element.getBoundingClientRect().height };
    });
    expect(geometry.height).toBe(32);
    expect(geometry.separated).toBe(true);
    expect(geometry.delta).toBeLessThanOrEqual(2);
    const toggle = block.getByRole("button", { name: "Collapse Model inference", exact: true });
    await toggle.focus();
    await expect(toggle).toBeFocused();
    await expect(toggle).not.toHaveCSS("box-shadow", "none");
    await page.screenshot({ path: test.info().outputPath(`sectioned-table-${theme}.png`) });
  }
});

test("loading, empty and error recovery", async ({ page }) => {
  await page.goto("/en/block-demo/grouped-data-table-02");
  const block = page.locator('[data-slot="sectioned-data-table"]');
  const settings = page.getByRole("button", { name: "Demo data settings", exact: true });
  await expect(block.getByRole("heading", { name: "AI resource operations" })).toBeVisible();
  await settings.click();
  await page.getByRole("menuitemradio", { name: "Loading", exact: true }).click();
  await expect(block.locator('[data-slot="table-skeleton-body"]')).toBeVisible();
  await expect(block.getByRole("button", { name: "Add sample resource", exact: true })).toBeDisabled();
  await settings.click();
  await page.getByRole("menuitemradio", { name: "Empty", exact: true }).click();
  await expect(block.getByText("No resources yet", { exact: true })).toBeVisible();
  await settings.click();
  await page.getByRole("menuitemradio", { name: "Error", exact: true }).click();
  await expect(block.getByRole("alert")).toContainText("Unable to load resources");
  await block.getByRole("button", { name: "Retry", exact: true }).click();
  await expect(block.getByText("20 matching of 20 resources", { exact: true })).toBeVisible();
});
