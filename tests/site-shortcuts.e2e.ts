import { expect, test, type Page } from "@playwright/test";
import { build } from "esbuild";

test.use({ colorScheme: "light", contextOptions: { reducedMotion: "reduce" } });

function waitForThemeProvider(page: Page) {
  return page.waitForFunction(() => localStorage.getItem("zeron-design.theme") === "system");
}

function dispatchSiteKeys(page: Page) {
  return page.evaluate(() => ["i", "d"].map((key) => document.body.dispatchEvent(
    new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }),
  )));
}

test("public shortcuts switch themes and gallery covers, and internal pages leave single keys alone", async ({ page }) => {
  await page.goto("/en/updates");
  await waitForThemeProvider(page);
  const theme = page.locator("html");
  expect(await dispatchSiteKeys(page)).toEqual([true, false]);
  await expect(theme).toHaveClass(/\bdark\b/);
  await page.keyboard.press("d");
  await expect(theme).toHaveClass(/\blight\b/);

  await page.goto("/en/docs/components");
  const cover = page.locator('img[src*="/component-covers/"]').first();
  await expect(cover).toHaveAttribute("src", /-light\.jpg$/);
  await page.keyboard.press("d");
  await expect(cover).toHaveAttribute("src", /-dark\.jpg$/);
  await page.keyboard.press("d");
  await expect(cover).toHaveAttribute("src", /-light\.jpg$/);

  await page.evaluate(() => localStorage.clear());
  await page.goto("/workflow");
  await waitForThemeProvider(page);
  expect(await dispatchSiteKeys(page)).toEqual([true, true]);
  await expect(theme).not.toHaveClass(/\b(light|dark)\b/);
  expect(await page.evaluate(() => localStorage.getItem("zeron-design.icon-variant"))).toBeNull();
});

test.describe("documentation preview keyboard behavior", () => {
  let script: string;
  test.beforeAll(async () => {
    const bundle = await build({
      entryPoints: ["tests/fixtures/site-shortcuts.tsx"],
      bundle: true,
      jsx: "automatic",
      define: { "process.env.NODE_ENV": '"production"' },
      write: false,
    });
    script = bundle.outputFiles[0].text;
  });

  test.beforeEach(async ({ page }) => {
    await page.route("**/site-shortcuts-test", (route) => route.fulfill({
      contentType: "text/html",
      body: '<!doctype html><html><head><title>Shortcut previews</title></head><body></body></html>',
    }));
    await page.goto("/site-shortcuts-test");
    await page.addScriptTag({ content: script });
    await expect(page.locator("html")).toHaveClass(/\blight\b/);
  });

  for (const [key, label] of [["d", "Drafts"], ["i", "Inbox"]]) {
    test(`keeps ${key} available for Select and Dropdown typeahead`, async ({ page }) => {
      await page.getByRole("combobox", { name: "Folder" }).press("Enter");
      const listbox = page.getByRole("listbox");
      await expect(listbox).toBeVisible();
      await page.keyboard.press(key);
      await expect(listbox.getByRole("option", { name: label })).toHaveAttribute("data-highlighted", "");
      await page.keyboard.press("Escape");
      await expect(listbox).toBeHidden();

      await page.getByRole("button", { name: "Open folder menu" }).press("Enter");
      const menu = page.getByRole("menu");
      await expect(menu).toBeVisible();
      await page.keyboard.press(key);
      await expect(menu.getByRole("menuitem", { name: label })).toBeFocused();
      await expect(page.locator("html")).toHaveClass(/\blight\b/);
      await expect(page.getByLabel("Icon style")).toHaveText("stroke-rounded");
    });
  }

  test("keeps D and I available in text inputs and editable regions", async ({ page }) => {
    const input = page.getByRole("textbox", { name: "Text input" });
    await input.pressSequentially("id");
    await expect(input).toHaveValue("id");
    const editable = page.getByRole("textbox", { name: "Editable text" });
    await editable.pressSequentially("id");
    await expect(editable).toHaveText("id");
    await expect(page.locator("html")).toHaveClass(/\blight\b/);
    await expect(page.getByLabel("Icon style")).toHaveText("stroke-rounded");

    await editable.blur();
    await page.keyboard.press("i");
    await expect(page.getByLabel("Icon style")).toHaveText("stroke-standard");
  });
});
