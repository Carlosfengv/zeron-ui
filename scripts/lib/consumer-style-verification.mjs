import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { basename, join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";

const output = new URL("../../output/consumer-styles/", import.meta.url).pathname;

export function consumerStyleExample(framework) {
  const prefix = framework === "next" ? "@/components/ui" : "@/src/components/ui";
  return [
    '"use client";',
    `import { Button } from "${prefix}/button";`,
    `import { Input } from "${prefix}/input";`,
    `import { Card, CardContent, CardTitle } from "${prefix}/card";`,
    `import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "${prefix}/dialog";`,
    'export default function Page() { return <main className="p-8 space-y-6"><Card><CardContent><CardTitle>Style verification</CardTitle><Input aria-label="Name" placeholder="Name" /><Button className="border-hairline border-border animate-in fade-in duration-fast">Save changes</Button><Dialog><DialogTrigger render={<Button />}>Open dialog</DialogTrigger><DialogContent><DialogTitle>Styled dialog</DialogTitle><p>Portal styles loaded</p></DialogContent></Dialog></CardContent></Card></main>; }',
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
      }
      metrics[mode] = await page.locator('body, [data-slot="button"], [data-slot="button-background"], [data-slot="input"], [data-slot="card"]').evaluateAll((nodes) => nodes.map((node) => {
        const style = getComputedStyle(node);
        return { slot: node.getAttribute("data-slot") ?? "body", radius: style.borderRadius, height: style.height, color: style.color, background: style.backgroundColor };
      }));
      await page.screenshot({ path: `${evidence}-${mode}.png`, fullPage: true });
    }
    if (phase === "components") {
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
    await writeFile(`${evidence}.json`, `${JSON.stringify({ framework, phase, metrics, errors }, null, 2)}\n`);
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
