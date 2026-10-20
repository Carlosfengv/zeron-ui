import { expect, test } from "@playwright/test";

const translations = {
  "zh-CN": { title: "大模型与云资源", first: "模型推理", collapse: "收起 模型推理", expand: "展开 模型推理", collapseAll: "全部收起", expandAll: "全部展开", more: "显示 模型推理 的另外 2 条", less: "收起 模型推理 的更多记录", search: "搜索资源", reset: "清空筛选", noResults: "没有匹配的资源", summary: "20 项匹配，共 20 项资源", filtered: "1 项匹配，共 20 项资源", view: "自定义列", hide: "显示 区域 列", density: "表格密度", compact: "紧凑", add: "添加示例资源", status: "运行状态", risk: "维护中", inspect: "查看 Atlas Chat · 32B" },
  en: { title: "AI & cloud resources", first: "Model inference", collapse: "Collapse Model inference", expand: "Expand Model inference", collapseAll: "Collapse all", expandAll: "Expand all", more: "Show 2 more in Model inference", less: "Show less in Model inference", search: "Search resources", reset: "Clear filters", noResults: "No matching resources", summary: "20 matching of 20 resources", filtered: "1 matching of 20 resources", view: "Customize columns", hide: "Show Region column", density: "Table density", compact: "Compact", add: "Add sample resource", status: "Status", risk: "Maintenance", inspect: "Inspect Atlas Chat · 32B" },
} as const;

for (const locale of ["zh-CN", "en"] as const) {
  const copy = translations[locale];

  test(`${locale}: preview, keyboard expansion and record activation`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`/${locale}/block-demo/grouped-data-table-01`);
    const block = page.locator('[data-slot="grouped-data-table"]');
    await expect(block.getByRole("heading", { name: copy.title })).toBeVisible();
    await expect(block.locator('[data-slot="data-table-group"]')).toHaveCount(5);
    await expect(block.getByText("Vector Embed · 8B", { exact: true })).toHaveCount(0);
    await expect(block.getByText(copy.summary, { exact: true })).toBeVisible();
    await block.getByRole("button", { name: copy.more, exact: true }).click();
    await expect(block.getByText("Vector Embed · 8B", { exact: true })).toBeVisible();
    await block.getByRole("button", { name: copy.less, exact: true }).click();
    await expect(block.getByText("Vector Embed · 8B", { exact: true })).toHaveCount(0);
    const collapse = block.getByRole("button", { name: copy.collapse, exact: true });
    await collapse.focus();
    await collapse.press("Enter");
    await expect(block.getByText("Atlas Chat · 32B", { exact: true })).toHaveCount(0);
    const expand = block.getByRole("button", { name: copy.expand, exact: true });
    await expect(expand).toBeFocused();
    await expand.press("Space");
    await expect(block.getByText("Atlas Chat · 32B", { exact: true })).toBeVisible();
    await block.getByRole("button", { name: copy.collapseAll, exact: true }).click();
    await expect(block.getByText("Atlas Chat · 32B", { exact: true })).toHaveCount(0);
    await expect(block.getByText(copy.summary, { exact: true })).toBeVisible();
    await block.getByRole("button", { name: copy.expandAll, exact: true }).click();
    await block.getByRole("button", { name: copy.inspect, exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("dialog").getByRole("heading", { name: "Atlas Chat · 32B" })).toBeVisible();
    await expect(page.getByRole("dialog").getByText("infer-atlas-chat", { exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test(`${locale}: search, facets, column visibility and density`, async ({ page }) => {
    await page.goto(`/${locale}/block-demo/grouped-data-table-01`);
    const block = page.locator('[data-slot="grouped-data-table"]');
    await block.getByRole("textbox", { name: copy.search, exact: true }).fill("infer-vector-embed");
    await expect(block.getByText("Vector Embed · 8B", { exact: true })).toBeVisible();
    await expect(block.getByText(copy.filtered, { exact: true })).toBeVisible();
    await block.getByRole("textbox", { name: copy.search, exact: true }).fill("no-matching-record");
    await expect(block.getByText(copy.noResults, { exact: true })).toBeVisible();
    await block.getByRole("button", { name: copy.reset, exact: true }).first().click();
    await expect(block.getByText(copy.summary, { exact: true })).toBeVisible();
    await block.getByRole("button", { name: copy.status, exact: true }).click();
    await page.getByRole("checkbox", { name: new RegExp(copy.risk) }).click();
    await page.keyboard.press("Escape");
    await expect(block.locator('[data-slot="data-table-group"]')).toHaveCount(3);
    await block.getByRole("button", { name: copy.reset, exact: true }).first().click();
    await block.getByRole("button", { name: copy.view, exact: true }).click();
    await page.getByRole("checkbox", { name: copy.hide, exact: true }).click();
    await page.keyboard.press("Escape");
    const header = block.locator('[data-slot="data-table-group"] td').first();
    await expect(header).toHaveAttribute("colspan", "7");
    await block.getByRole("combobox", { name: copy.density, exact: true }).click();
    await page.getByRole("option", { name: copy.compact, exact: true }).click();
    await expect(block.locator('[data-slot="data-table"]')).toHaveAttribute("data-density", "compact");
    await expect(block.getByText("Atlas Chat · 32B", { exact: true }).locator("xpath=ancestor::td")).toHaveCSS("padding-top", "4px");
  });
}

test("light/dark layout, control geometry and focus on narrow and wide screens", async ({ page }) => {
  await page.goto("/en/block-demo/grouped-data-table-01");
  const block = page.locator('[data-slot="grouped-data-table"]');
  await expect(block.getByRole("heading", { name: "AI & cloud resources" })).toBeVisible();
  for (const theme of ["light", "dark"] as const) {
    await page.evaluate((value) => {
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(value);
    }, theme);
    const geometry = await block.getByRole("button", { name: "Add sample resource" }).evaluate((button) => {
      const icon = button.querySelector("svg")!.getBoundingClientRect();
      const label = button.querySelector('[data-slot="button-label"]')!.getBoundingClientRect();
      const rect = button.getBoundingClientRect();
      return { height: rect.height, delta: Math.abs(icon.y + icon.height / 2 - label.y - label.height / 2), separated: icon.right <= label.left, contained: icon.left >= rect.left && label.right <= rect.right };
    });
    expect(geometry).toMatchObject({ height: 32, separated: true, contained: true });
    expect(geometry.delta).toBeLessThanOrEqual(2);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const toggle = block.getByRole("button", { name: "Collapse Model inference", exact: true });
    await toggle.focus();
    await expect(toggle).toBeFocused();
    await expect(toggle).not.toHaveCSS("box-shadow", "none");
    await page.screenshot({ path: test.info().outputPath(`grouped-table-${theme}.png`) });
  }
});

test("loading, empty, error recovery and sample data updates", async ({ page }) => {
  await page.goto("/en/block-demo/grouped-data-table-01");
  const block = page.locator('[data-slot="grouped-data-table"]');
  const settings = page.getByRole("button", { name: "Demo data settings", exact: true });
  await block.getByRole("button", { name: "Add sample resource", exact: true }).click();
  await expect(block.getByText("21 matching of 21 resources", { exact: true })).toBeVisible();
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
  await expect(block.getByText("21 matching of 21 resources", { exact: true })).toBeVisible();
});
