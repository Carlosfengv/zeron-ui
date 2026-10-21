import { expect, test } from "@playwright/test";

for (const locale of ["en", "zh-CN"]) {
  test(`Nested Dialog backdrop preserves dismissal and focus (${locale})`, async ({ page }) => {
    await page.goto(`${locale === "en" ? "/en" : ""}/docs/components/dialog`);
    const names = locale === "en"
      ? { openParent: "Open parent dialog", parent: "Parent dialog", openChild: "Open child dialog", child: "Child dialog" }
      : { openParent: "打开父弹窗", parent: "父弹窗", openChild: "打开子弹窗", child: "子弹窗" };
    const parentTrigger = page.getByRole("button", { name: names.openParent, exact: true });
    await parentTrigger.click();
    const parent = page.getByRole("dialog", { name: names.parent, exact: true });
    await expect(parent).toBeVisible();
    await expect(page.locator('[data-slot="dialog-backdrop"]')).toHaveCount(1);
    const childTrigger = parent.getByRole("button", { name: names.openChild, exact: true });
    await childTrigger.click();
    const child = page.getByRole("dialog", { name: names.child, exact: true });
    await expect(child).toBeVisible();
    const backdrops = page.locator('[data-slot="dialog-backdrop"]');
    await expect(backdrops).toHaveCount(2);
    await expect(backdrops.last()).toHaveClass(/backdrop-blur-none/);
    const bounds = await backdrops.last().boundingBox();
    if (!bounds) throw new Error("Nested backdrop should be measurable");
    await page.mouse.click(bounds.x + 8, bounds.y + 8);
    await expect(child).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(child).toBeHidden();
    await expect(parent).toBeVisible();
    await expect(backdrops).toHaveCount(1);
    await expect(childTrigger).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(parent).toBeHidden();
    await expect(backdrops).toHaveCount(0);
    await expect(parentTrigger).toBeFocused();
  });

  for (const placement of ["right", "bottom"] as const) {
    const triggerName = placement === "right" ? "Open side panel" : "Open bottom panel";
    const dialogName = placement === "right" ? "Side panel" : "Bottom panel";

    test(`Dialog supports ${placement} placement (${locale})`, async ({ page }) => {
      await page.goto(`${locale === "en" ? "/en" : ""}/docs/components/dialog`);

      await page.getByRole("button", { name: triggerName, exact: true }).click();
      const dialog = page.getByRole("dialog", { name: dialogName });
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute("data-placement", placement);

      const backdrop = page.locator('[data-slot="dialog-backdrop"]');
      const backdropBounds = await backdrop.boundingBox();
      if (!backdropBounds) throw new Error("Dialog backdrop should be measurable");
      await expect
        .poll(async () => {
          const currentBounds = await dialog.boundingBox();
          const currentBackdropBounds = await backdrop.boundingBox();
          if (!currentBounds || !currentBackdropBounds) return false;
          return placement === "right"
            ? Math.abs(
                currentBounds.x + currentBounds.width -
                  (currentBackdropBounds.x + currentBackdropBounds.width)
              ) <= 8 && Math.abs(currentBounds.y - currentBackdropBounds.y) <= 8
            : Math.abs(currentBounds.x - currentBackdropBounds.x) <= 8 &&
                Math.abs(
                  currentBounds.y + currentBounds.height -
                    (currentBackdropBounds.y + currentBackdropBounds.height)
                ) <= 8;
        })
        .toBe(true);

      if (placement === "right") {
        await dialog.evaluate((element) => {
          const longContent = document.createElement("div");
          longContent.style.height = "1500px";
          element.append(longContent);
        });
        expect(
          await dialog.evaluate((element) => element.scrollHeight > element.clientHeight)
        ).toBe(true);
        await dialog.evaluate((element) => {
          element.scrollTop = element.scrollHeight;
        });
        expect(await dialog.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
        const closeButton = dialog.getByRole("button", { name: "Close" });
        await expect
          .poll(async () => {
            const closeBounds = await closeButton.boundingBox();
            return (
              closeBounds !== null &&
              closeBounds.y >= backdropBounds.y &&
              closeBounds.y + closeBounds.height <= backdropBounds.y + backdropBounds.height
            );
          })
          .toBe(true);
      }

      const backdropClass = await backdrop.getAttribute("class");
      expect(backdropClass).toContain(
        placement === "right" ? "backdrop-blur-none" : "backdrop-blur-[2px]"
      );
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
    });
  }

  test(`Dialog dismissal and custom close restore focus (${locale})`, async ({ page }) => {
    await page.goto(`${locale === "en" ? "/en" : ""}/docs/components/dialog`);

    const trigger = page.getByRole("button", { name: "Open settings", exact: true });
    await trigger.click();

    const dialog = page.getByRole("dialog", { name: "Settings" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Close", exact: true })).toHaveCount(0);

    const backdrop = page.locator(
      '[data-base-ui-portal] [role="presentation"][aria-hidden="true"]'
    ).last();
    const backdropBounds = await backdrop.boundingBox();
    if (!backdropBounds) throw new Error("Dialog backdrop should be visible");
    await page.mouse.click(backdropBounds.x + 8, backdropBounds.y + 8);
    await expect(dialog).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();

    await trigger.click();
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Close settings", exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(trigger).toBeFocused();
  });
}
