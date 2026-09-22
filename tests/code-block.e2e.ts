import { expect, test, type Page } from "@playwright/test";

const path = "/zh-CN/docs/components/code-block";

function collectUnexpectedConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    const source = message.location().url;
    if (
      source.includes("/_vercel/insights") ||
      source.includes("speed-insights") ||
      text.includes("/_vercel/insights") ||
      text.includes("speed-insights")
    ) {
      return;
    }
    errors.push(text);
  });
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

test("renders all interactive examples without hydration errors", async ({ page }) => {
  const errors = collectUnexpectedConsoleErrors(page);
  await page.goto(path);

  await expect(page.getByText("export async function loadStatus()", { exact: false })).toBeVisible();
  await expect(page.getByText("该行返回对用户可见的状态。", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "接受当前更改" })).toBeVisible();
  await expect(page.getByRole("button", { name: "接受传入更改" })).toBeVisible();
  await expect(
    page.locator('[data-merge-conflict-marker-label="当前更改"]')
  ).toBeVisible();
  await expect(
    page.locator('[data-merge-conflict-marker-label="传入更改"]')
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "多文件虚拟列表" })).toBeVisible();

  const virtualizedFiles = page.locator("zeron-code-container").filter({
    hasText: "module-",
  });
  await expect(virtualizedFiles.first()).toBeVisible();
  await expect(virtualizedFiles.first()).toHaveClass(/zeron-code-block/);
  expect(await virtualizedFiles.count()).toBeLessThan(24);

  const streamingFile = page.locator("zeron-code-container").filter({
    hasText: "export async function loadStatus()",
  });
  await expect(streamingFile).toHaveClass(/zeron-code-block/);

  const firstCodeBlock = page.locator("zeron-code-container").first();
  const codeStyle = await firstCodeBlock.locator("[data-code]").evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      bottom: style.paddingBottom,
      fontSize: style.fontSize,
      lineHeight: style.lineHeight,
      top: style.paddingTop,
    };
  });
  expect(codeStyle).toEqual({
    bottom: "6px",
    fontSize: "14px",
    lineHeight: "20px",
    top: "6px",
  });
  await expect(
    page.locator("zeron-code-container:not(.zeron-code-block)")
  ).toHaveCount(0);
  await firstCodeBlock.locator("[data-line-number-content]").nth(2).click();
  await expect(page.getByTestId("code-interaction-status")).toContainText("已选择第 3 行");
  await firstCodeBlock.locator("[data-line] span", { hasText: "StatusCard" }).click();
  await expect(page.getByTestId("code-interaction-status")).toContainText("Token：StatusCard");

  const diff = page.locator("zeron-code-container").nth(1);
  const renderedLinesBefore = await diff.locator("[data-line]").count();
  const expandButton = diff.locator("[data-expand-button]").first();
  await expect(expandButton).toBeVisible();
  await expandButton.focus();
  await expandButton.press("Enter");
  await expect.poll(() => diff.locator("[data-line]").count()).toBeGreaterThan(renderedLinesBefore);

  const wrapButton = page.getByRole("button", { name: "自动换行" }).first();
  await wrapButton.click();
  await expect(page.getByRole("button", { name: "横向滚动" }).first()).toBeVisible();

  expect(errors).toEqual([]);
});

test("copies the exact source and keeps editor typing inside the component", async ({
  browserName,
  page,
}) => {
  const errors = collectUnexpectedConsoleErrors(page);
  if (browserName !== "chromium") {
    await page.addInitScript(() => {
      let clipboardValue = "";
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          readText: async () => clipboardValue,
          writeText: async (value: string) => {
            clipboardValue = value;
          },
        },
      });
    });
  }
  await page.goto(path);

  await page.getByRole("button", { name: "复制代码" }).first().click();
  await expect(page.getByRole("button", { name: "已复制" }).first()).toBeVisible();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(
    `type Status = "healthy" | "degraded";

export function StatusCard({ status }: { status: Status }) {
  return <span data-status={status}>{status}</span>;
}`
  );

  const themeBefore = await page.locator("html").getAttribute("class");
  await page.getByRole("button", { name: "开始编辑" }).click();
  const editor = page.getByRole("textbox", { name: "status-card.tsx" });
  await expect(editor).toBeVisible();
  await editor.focus();
  await page.keyboard.insertText("d");
  await expect(editor).toContainText("d");
  expect(await page.locator("html").getAttribute("class")).toBe(themeBefore);

  await page.keyboard.press(process.platform === "darwin" ? "Meta+z" : "Control+z");
  await page.getByRole("button", { name: "结束编辑" }).click();
  expect(errors).toEqual([]);
});

test("supports find/replace and composition input", async ({ page }) => {
  const errors = collectUnexpectedConsoleErrors(page);
  await page.goto(path);
  await page.getByRole("button", { name: "开始编辑" }).click();

  const editor = page.getByRole("textbox", { name: "status-card.tsx" });
  await editor.focus();
  await page.keyboard.press("Meta+Alt+f");
  await page.getByPlaceholder("Search").fill("Status");
  await page.getByPlaceholder("Replace").fill("Health");
  await page.getByRole("button", { name: "Replace All" }).click();
  await expect(editor).toContainText("HealthCard");
  await page.getByPlaceholder("Search").press("Escape");
  await expect(page.getByPlaceholder("Search")).toBeHidden();

  await editor.focus();
  await editor.evaluate((node) => {
    node.dispatchEvent(
      new CompositionEvent("compositionstart", {
        bubbles: true,
        composed: true,
      })
    );
    node.dispatchEvent(
      new CompositionEvent("compositionend", {
        bubbles: true,
        composed: true,
        data: "中文",
      })
    );
  });
  await expect(editor).toContainText("中文");
  expect(errors).toEqual([]);
});

test("keeps the documentation page within a narrow viewport", async ({ page }, testInfo) => {
  test.skip(!testInfo.project.name.includes("mobile"), "mobile viewport assertion");
  const errors = collectUnexpectedConsoleErrors(page);
  await page.goto(path);

  await expect(page.getByRole("button", { name: "复制代码" }).first()).toBeVisible();
  await expect(page.getByText("export async function loadStatus()", { exact: false })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});
