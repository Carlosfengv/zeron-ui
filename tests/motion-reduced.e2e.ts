import { expect, test } from "@playwright/test";
import { build } from "esbuild";

let script: string;
test.beforeAll(async () => {
  const result = await build({
    entryPoints: ["tests/fixtures/motion-reduced.tsx"],
    bundle: true,
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"production"' },
    write: false,
  });
  script = result.outputFiles[0].text;
});

const cases = [
  { policy: "user", system: "reduce", reduceControls: true },
  { policy: "user", system: "no-preference", reduceControls: false },
  { policy: "always", system: "no-preference", reduceControls: true },
  { policy: "never", system: "reduce", reduceControls: false },
] as const;

for (const { policy, system, reduceControls } of cases) {
  test(`honors MotionConfig ${policy} with OS ${system}`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: system });
    await page.route("**/motion-policy-test?*", (route) => route.fulfill({
      contentType: "text/html",
      body: '<!doctype html><html><head><title>Motion policy</title></head><body></body></html>',
    }));
    await page.goto(`/motion-policy-test?policy=${policy}`);
    await page.addScriptTag({ content: script });
    await expect(page.getByRole("button", { name: "Move samples" })).toBeVisible();

    const movement = await page.evaluate(async () => {
      const transform = document.querySelector('[data-testid="transform"]')!;
      const layout = document.querySelector('[data-testid="layout"]')!;
      const startLeft = layout.getBoundingClientRect().left;
      document.querySelector<HTMLButtonElement>("#move")!.click();
      const measurements = { transform: [] as number[], layout: [] as number[] };
      for (let frame = 0; frame < 10; frame++) {
        await new Promise(requestAnimationFrame);
        measurements.transform.push(new DOMMatrixReadOnly(getComputedStyle(transform).transform).m41);
        measurements.layout.push(layout.getBoundingClientRect().left - startLeft);
      }
      return measurements;
    });
    for (const frames of Object.values(movement)) {
      expect(frames.some((x) => x > 1 && x < 79)).toBe(!reduceControls);
      if (reduceControls) expect(frames.at(-1)).toBeCloseTo(80);
    }

    const trigger = page.getByRole("combobox", { name: "Choice" });
    const selectMoved = await trigger.evaluate(async (element) => {
      (element as HTMLButtonElement).click();
      let moved = false;
      for (let frame = 0; frame < 14; frame++) {
        await new Promise(requestAnimationFrame);
        const popup = document.querySelector('[role="listbox"]')?.parentElement;
        if (!popup) continue;
        const matrix = new DOMMatrixReadOnly(getComputedStyle(popup).transform);
        moved ||= Math.abs(matrix.m42) > 0.5 || Math.abs(matrix.m22 - 1) > 0.01;
      }
      return moved;
    });
    await expect(page.getByRole("listbox")).toBeVisible();
    expect(selectMoved).toBe(!reduceControls);
    await page.keyboard.press("Escape");

    await page.getByRole("button", { name: "Show chart" }).click();
    const chart = page.locator('[data-slot="area-chart"]');
    const systemReduces = system === "reduce";
    await expect(chart.getByTestId("chart-timing")).toHaveAttribute("data-duration", systemReduces ? "0" : "1000");
    await expect(chart.locator('clipPath[id^="chart-area-grow-clip"]')).toHaveCount(systemReduces ? 0 : 1);
    await expect(chart.locator("svg path[d]").first()).toBeAttached();
  });
}
