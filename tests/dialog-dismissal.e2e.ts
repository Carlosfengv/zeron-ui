import { expect, test } from "@playwright/test";

test("Dialog blocks outside-pointer dismissal while Escape closes and restores focus", async ({ page }) => {
  await page.goto("/docs/components/dialog");

  const trigger = page.getByRole("button", { name: "Open settings", exact: true });
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: "Settings" });
  await expect(dialog).toBeVisible();

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
});
