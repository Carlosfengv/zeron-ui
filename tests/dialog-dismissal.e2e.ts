import { expect, test } from "@playwright/test";

for (const locale of ["en", "zh-CN"]) {
  for (const placement of ["right", "bottom"] as const) {
    const triggerName = placement === "right" ? "Open side panel" : "Open bottom panel";
    const dialogName = placement === "right" ? "Side panel" : "Bottom panel";

    test(`Dialog supports ${placement} placement (${locale})`, async ({ page }) => {
      await page.goto(`${locale === "en" ? "" : "/zh-CN"}/docs/components/dialog`);

      await page.getByRole("button", { name: triggerName, exact: true }).click();
      const dialog = page.getByRole("dialog", { name: dialogName });
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute("data-placement", placement);

      const bounds = await dialog.boundingBox();
      const viewport = page.viewportSize();
      if (!bounds || !viewport) throw new Error("Dialog bounds should be measurable");
      await expect
        .poll(async () => {
          const currentBounds = await dialog.boundingBox();
          if (!currentBounds) return false;
          return placement === "right"
            ? Math.abs(currentBounds.x + currentBounds.width - viewport.width) <= 8 &&
                currentBounds.y < 8
            : currentBounds.x < 8 &&
                Math.abs(currentBounds.y + currentBounds.height - viewport.height) <= 8;
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
              closeBounds.y >= 0 &&
              closeBounds.y + closeBounds.height <= viewport.height
            );
          })
          .toBe(true);
      }

      const backdrop = page.locator('[data-slot="dialog-backdrop"]');
      const backdropClass = await backdrop.getAttribute("class");
      expect(backdropClass).toContain(
        placement === "right" ? "backdrop-blur-none" : "backdrop-blur-[2px]"
      );
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
    });
  }

  test(`Dialog dismissal and custom close restore focus (${locale})`, async ({ page }) => {
    await page.goto(`${locale === "en" ? "" : "/zh-CN"}/docs/components/dialog`);

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
