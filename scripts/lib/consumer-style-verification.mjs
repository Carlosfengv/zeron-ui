import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { basename, join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { inspectRenderedControls } from "../../.agents/skills/zeron-page-builder/scripts/check-rendered-controls.mjs";

const output = new URL("../../output/consumer-styles/", import.meta.url).pathname;

export function consumerStyleExample(framework) {
  const prefix = framework === "next" ? "@/components/ui" : "@/src/components/ui";
  return [
    '"use client";',
    'import { useState, type ComponentProps } from "react";',
    `import { Button } from "${prefix}/button";`,
    `import { Input } from "${prefix}/input";`,
    `import { Card, CardContent, CardTitle } from "${prefix}/card";`,
    `import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "${prefix}/dialog";`,
    'function ActionIcon({ size = 24, ...props }: ComponentProps<"svg"> & { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}><path d="M12 4v16M4 12h16" /></svg>; }',
    'export default function Page() { const [loading, setLoading] = useState(false); return <main className="p-4 md:p-8 space-y-6"><Card><CardContent><CardTitle>Style verification</CardTitle><Input aria-label="Name" placeholder="Name" /><Button className="border-hairline border-border animate-in fade-in duration-fast">Save changes</Button><div className="flex flex-wrap gap-2">{(["xs", "sm", "md", "lg", "xl"] as const).map(size => <Button key={size} size={size} leadingIcon={ActionIcon} trailingIcon={ActionIcon}>新增资源 {size}</Button>)}<Button iconOnly aria-label="Add resource"><ActionIcon /></Button><Button leadingIcon={ActionIcon} disabled>暂不可用</Button><Button leadingIcon={ActionIcon} loading={loading} onClick={() => setLoading(true)}>提交中文业务操作</Button></div><Dialog><DialogTrigger render={<Button />}>Open dialog</DialogTrigger><DialogContent><DialogTitle>Styled dialog</DialogTitle><p>Portal styles loaded</p></DialogContent></Dialog></CardContent></Card></main>; }',
    ...(framework === "vite" ? [
      'import { createRoot } from "react-dom/client";',
      'import "./index.css";',
      'createRoot(document.getElementById("root")!).render(<Page />);',
    ] : []),
    "",
  ].join("\n");
}

async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return port;
}

export async function verifyConsumerStyles({ consumer, framework, phase }) {
  const { chromium, expect } = await import("@playwright/test");
  const port = await freePort();
  const app = spawn(join(consumer, "node_modules/.bin", framework), framework === "next"
    ? ["start", "--hostname", "127.0.0.1", "--port", String(port)]
    : ["preview", "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
  { cwd: consumer, stdio: ["ignore", "pipe", "pipe"] });
  let logs = "";
  let spawnError;
  app.on("error", (error) => { spawnError = error; });
  for (const stream of [app.stdout, app.stderr]) stream.on("data", (chunk) => { logs = (logs + chunk).slice(-16000); });
  let browser;
  let page;
  const evidence = join(output, `${basename(consumer)}-${phase}`);
  try {
    await mkdir(output, { recursive: true });
    let ready = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      if (spawnError) throw spawnError;
      if (app.exitCode !== null) throw new Error(`Consumer server exited: ${logs}`);
      try {
        if ((await fetch(`http://127.0.0.1:${port}`, { signal: AbortSignal.timeout(1000) })).ok) { ready = true; break; }
      } catch { /* Server is starting. */ }
      await delay(200);
    }
    assert.ok(ready, `Consumer server did not start: ${logs}`);
    browser = await chromium.launch({ headless: true });
    page = await browser.newPage({ viewport: { width: 1280, height: 900 }, colorScheme: "light" });
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${port}`);
    await expect(page.getByText(phase === "init" ? "Initialization verified" : "Style verification", { exact: true })).toBeVisible();
    const metrics = {};
    const controlChecks = [];
    for (const mode of ["light", "dark"]) {
      await page.evaluate((dark) => document.documentElement.classList.toggle("dark", dark), mode === "dark");
      const foreground = mode === "light" ? "rgb(0, 3, 10)" : "rgb(249, 249, 249)";
      await expect(page.locator("body")).toHaveCSS("background-color", mode === "light" ? "rgb(246, 248, 251)" : "rgb(27, 27, 27)");
      await expect(page.locator("body")).toHaveCSS("color", foreground);
      if (phase === "components") {
        const button = page.getByRole("button", { name: "Save changes", exact: true });
        await expect(button).toHaveCSS("height", "32px");
        await expect(button).toHaveCSS("border-radius", "8px");
        await expect(button).toHaveCSS("color", "rgb(255, 255, 255)");
        await expect(button.locator('[data-slot="button-background"]')).toHaveCSS("background-color", "rgb(0, 96, 210)");
        await expect(page.getByRole("textbox", { name: "Name" })).toHaveCSS("height", "32px");
        await expect(page.getByRole("textbox", { name: "Name" })).toHaveCSS("border-radius", "8px");
        await expect(page.getByRole("textbox", { name: "Name" })).toHaveCSS("color", foreground);
        await expect(page.locator('[data-slot="card"]')).toHaveCSS("border-radius", "12px");
        await expect(page.locator('[data-slot="card"]')).toHaveCSS("background-color", mode === "light" ? "rgb(255, 255, 255)" : "rgb(41, 41, 41)");
        for (const width of [390, 1440]) {
          await page.setViewportSize({ width, height: 900 });
          await page.evaluate(() => document.fonts.ready);
          const report = await page.evaluate(inspectRenderedControls);
          assert.equal(report.checks.filter(check => check.check === "icon-label-row" && check.status === "passed").length, 12);
          assert.equal(report.checks.some(check => check.status === "failed" || check.status === "unchecked"), false, JSON.stringify(report));
          controlChecks.push({ mode, width, report });
          await page.screenshot({ path: `${evidence}-${mode}-${width}.png`, fullPage: true });
        }
        await page.setViewportSize({ width: 1280, height: 900 });
      }
      metrics[mode] = await page.locator('body, [data-slot="button"], [data-slot="button-background"], [data-slot="input"], [data-slot="card"]').evaluateAll((nodes) => nodes.map((node) => {
        const style = getComputedStyle(node);
        return { slot: node.getAttribute("data-slot") ?? "body", radius: style.borderRadius, height: style.height, color: style.color, background: style.backgroundColor };
      }));
      await page.screenshot({ path: `${evidence}-${mode}.png`, fullPage: true });
    }
    if (phase === "components") {
      // Reproduce the original consumer misuse on a disposable clone of an installed Button.
      await page.getByRole("button", { name: "新增资源 md", exact: true }).evaluate(node => {
        const clone = node.cloneNode(true); clone.setAttribute("aria-label", "Negative icon fixture");
        const icon = clone.querySelector('[data-slot="button-leading-icon"]');
        icon.removeAttribute("data-slot"); clone.querySelector('[data-slot="button-label"]').prepend(icon);
        clone.querySelector('[data-slot="button-trailing-icon"]').remove(); document.body.append(clone);
      });
      const negative = (await page.evaluate(inspectRenderedControls)).checks.find(check => check.name === "Negative icon fixture" && check.check === "icon-label-row");
      assert.equal(negative?.status, "failed", "portable checker detects icon-in-label misuse in installed consumer CSS");
      controlChecks.push({ state: "negative-icon-child", expected: "failed", check: negative });
      await page.getByRole("button", { name: "Negative icon fixture" }).evaluate(node => node.remove());
      const submit = page.getByRole("button", { name: "提交中文业务操作", exact: true });
      const before = await submit.boundingBox();
      await submit.click();
      await expect(submit).toBeDisabled();
      const after = await submit.boundingBox();
      assert.ok(before && after && Math.abs(before.width - after.width) <= 1 && Math.abs(before.height - after.height) <= 1, "loading preserves control dimensions");
      controlChecks.push({ state: "loading", before, after, report: await page.evaluate(inspectRenderedControls) });
      await page.getByRole("button", { name: "Open dialog", exact: true }).click();
      const dialog = page.getByRole("dialog", { name: "Styled dialog" });
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveCSS("border-radius", "12px");
      await expect(dialog).toHaveCSS("background-color", "rgb(41, 41, 41)");
      await expect(dialog).toHaveCSS("position", "fixed");
      await expect(dialog).toHaveCSS("z-index", "50");
      await expect(dialog).not.toHaveCSS("box-shadow", "none");
      await expect(page.locator(".bg-scrim")).toHaveCSS("backdrop-filter", "blur(2px)");
      await expect(page.locator(".bg-scrim")).toHaveCSS("background-color", "rgba(17, 17, 17, 0.6)");
      await page.screenshot({ path: `${evidence}-dialog.png`, fullPage: true });
    }
    assert.deepEqual(errors, [], "consumer must not report browser runtime errors");
    await writeFile(`${evidence}.json`, `${JSON.stringify({ framework, phase, metrics, controlChecks, errors }, null, 2)}\n`);
    console.log(`Browser styles passed: ${basename(consumer)}/${phase}`);
  } catch (error) {
    await page?.screenshot({ path: `${evidence}-failure.png`, fullPage: true }).catch(() => {});
    throw error;
  } finally {
    await browser?.close();
    if (app.exitCode === null && app.signalCode === null && !spawnError) {
      const exited = new Promise((resolve) => app.once("exit", resolve));
      app.kill("SIGTERM");
      const force = setTimeout(() => app.kill("SIGKILL"), 3000);
      await exited;
      clearTimeout(force);
    }
  }
}
