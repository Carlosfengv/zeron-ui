import { expect, test } from "@playwright/test";

for (const slug of ["grouped-data-table-01", "grouped-data-table-02"] as const) {
  for (const locale of ["zh-CN", "en"] as const) {
    test(`${slug} / ${locale}: localized sorting, facet clearing and resource search`, async ({ page }) => {
      await page.goto(`/${locale}/block-demo/${slug}`);
      const block = page.locator('[data-slot="grouped-data-table"], [data-slot="sectioned-data-table"]');
      const zh = locale === "zh-CN";
      await block.getByRole("button", { name: zh ? "利用率" : "Utilization", exact: true }).first().click();
      await expect(page.getByRole("menuitemradio", { name: zh ? "降序" : "Descending", exact: true })).toBeVisible();
      await page.getByRole("menuitemradio", { name: zh ? "降序" : "Descending", exact: true }).click();
      await block.getByRole("button", { name: zh ? "利用率" : "Utilization", exact: true }).first().click();
      await expect(page.getByRole("menuitem", { name: zh ? "清除排序" : "Reset sorting", exact: true })).toBeVisible();
      await page.getByRole("menuitem", { name: zh ? "清除排序" : "Reset sorting", exact: true }).click();
      await block.getByRole("button", { name: zh ? "运行状态" : "Status", exact: true }).click();
      await page.getByRole("checkbox", { name: zh ? /维护中/ : /Maintenance/ }).click();
      await page.locator('[data-slot="popover-content"]').getByRole("button", { name: zh ? "清空筛选" : "Clear filters", exact: true }).click();
      await expect(block.getByRole("status").filter({ hasText: zh ? "20 项匹配，共 20 项资源" : "20 matching of 20 resources" })).toBeVisible();
      await block.getByRole("textbox", { name: zh ? "搜索资源" : "Search resources" }).fill(zh ? "私有云" : "Private cloud");
      await expect(block.getByText("Atlas Chat · 32B", { exact: true })).toBeVisible();
      await expect(block.getByText("Vector Rerank · 4B", { exact: true })).toHaveCount(0);
    });
  }

  test(`${slug}: long titles and group labels stay within their scroll owners`, async ({ page }) => {
    await page.goto(`/en/block-demo/${slug}`);
    const block = page.locator('[data-slot="grouped-data-table"], [data-slot="sectioned-data-table"]');
    await expect(block.getByRole("heading").first()).toBeVisible();
    await block.evaluate((root) => {
      root.querySelector("h3")!.textContent = "CloudResource".repeat(50);
      if (root.getAttribute("data-slot") === "sectioned-data-table") {
        const label = root.querySelector("h4 [data-slot=badge-label]")!;
        // Replace the text node as React would, preserving the label's layout wrappers.
        document.createTreeWalker(label, NodeFilter.SHOW_TEXT).nextNode()!.nodeValue = "InferenceResourceGroup".repeat(30);
      }
    });
    const sizes = await block.evaluate((root) => {
      const header = root.querySelector<HTMLElement>('[data-slot="container-header"]')!;
      const body = root.querySelector<HTMLElement>('[data-slot="container-body"]')!;
      return { headerOverflow: header.scrollWidth - header.clientWidth, bodyOverflow: body.scrollWidth - body.clientWidth };
    });
    expect(sizes.headerOverflow).toBeLessThanOrEqual(1);
    expect(sizes.bodyOverflow).toBeLessThanOrEqual(1);
  });
}
