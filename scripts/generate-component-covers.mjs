import { spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { once } from "node:events";
import { join } from "node:path";
import { chromium } from "@playwright/test";

const workspace = process.cwd();
const outputDirectory = join(workspace, "public", "component-covers");
const port = Number(process.env.COMPONENT_COVERS_PORT ?? 3901);
const origin = process.env.COMPONENT_COVERS_ORIGIN ?? `http://127.0.0.1:${port}`;
const chromeExecutable = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const allSlugs = readdirSync(join(workspace, "docs", "pages", "components"), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join(workspace, "docs", "pages", "components", entry.name, "page.tsx")))
  .map((entry) => entry.name)
  .sort();
const requestedSlugs = process.env.COMPONENT_COVERS_SLUGS?.split(",").filter(Boolean);
const slugs = requestedSlugs?.length ? allSlugs.filter((slug) => requestedSlugs.includes(slug)) : allSlugs;

if (requestedSlugs?.some((slug) => !allSlugs.includes(slug))) {
  throw new Error("COMPONENT_COVERS_SLUGS contains an unknown component slug");
}

function startServer() {
  if (process.env.COMPONENT_COVERS_ORIGIN) return null;
  return spawn("pnpm", ["exec", "next", "dev", "--turbopack", "--port", String(port)], {
    cwd: workspace,
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    stdio: "ignore",
  });
}

async function waitForServer(server) {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (server?.exitCode !== null && server?.exitCode !== undefined) {
      throw new Error(`Component cover server exited with code ${server.exitCode}`);
    }
    try {
      const response = await fetch(`${origin}/docs/components`);
      if (response.ok) return;
    } catch {
      // The development server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${origin}`);
}

async function stopServer(server) {
  if (!server || server.exitCode !== null) return;
  server.kill("SIGTERM");
  await Promise.race([
    once(server, "exit"),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);
  if (server.exitCode === null) server.kill("SIGKILL");
}

async function coverTarget(page, slug) {
  const explicitSource = page.locator("[data-component-cover-source]").first();
  if (await explicitSource.count()) {
    const preview = explicitSource.locator('[data-slot="component-preview-content"]').first();
    return (await preview.count()) ? preview : explicitSource;
  }

  const fallbackPreview = page.locator('[data-slot="component-preview-content"]').first();
  if (await fallbackPreview.count()) return fallbackPreview;
  throw new Error(`No cover source was found for ${slug}`);
}

async function coverSubject(target) {
  const children = target.locator(":scope > *");
  if (await children.count() !== 1) return null;
  return children.first();
}

async function captureCover(page, slug, theme) {
  await page.goto(`${origin}/docs/components/${slug}`, { waitUntil: "networkidle" });
  await page.evaluate((requestedTheme) => {
    const root = document.documentElement;
    root.classList.remove("light", "dark", "transitioning");
    root.classList.add(requestedTheme);
  }, theme);
  await page.evaluate(() => document.fonts.ready);

  const target = await coverTarget(page, slug);
  await target.scrollIntoViewIfNeeded();
  await target.evaluate((element) => element.setAttribute("data-component-cover-capture", ""));
  const subject = await coverSubject(target);
  if (subject) await subject.evaluate((element) => element.setAttribute("data-component-cover-subject", ""));
  await page.addStyleTag({
    content: `
      [data-component-cover-capture] {
        box-sizing: border-box !important;
        width: 640px !important;
        min-width: 640px !important;
        height: 400px !important;
        min-height: 400px !important;
        max-height: 400px !important;
        overflow: hidden !important;
      }
      [data-component-cover-capture],
      [data-component-cover-capture] * {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        caret-color: transparent !important;
        transition-duration: 0s !important;
      }
      [data-component-cover-capture] > [data-component-cover-subject] {
        scale: var(--component-cover-scale, 1);
        transform-origin: center !important;
      }
    `,
  });
  if (subject) {
    const subjectBox = await subject.boundingBox();
    if (subjectBox?.width && subjectBox.height) {
      const scale = Math.min(2.4, Math.max(1, Math.min(560 / subjectBox.width, 304 / subjectBox.height)));
      await subject.evaluate((element, value) => element.style.setProperty("--component-cover-scale", String(value)), scale);
    }
  }
  const box = await target.boundingBox();
  if (!box) throw new Error(`Cover source for ${slug} has no bounding box`);
  await page.screenshot({
    animations: "disabled",
    caret: "hide",
    clip: { x: Math.round(box.x), y: Math.round(box.y), width: 640, height: 400 },
    path: join(outputDirectory, `${slug}-${theme}.jpg`),
    quality: 88,
    type: "jpeg",
  });
}

async function main() {
  mkdirSync(outputDirectory, { recursive: true });
  const server = startServer();
  try {
    await waitForServer(server);
    const browser = await chromium.launch({
      executablePath: process.env.COMPONENT_COVERS_BROWSER ?? (existsSync(chromeExecutable) ? chromeExecutable : undefined),
      headless: true,
    });
    try {
      for (const theme of ["light", "dark"]) {
        const context = await browser.newContext({ colorScheme: theme, viewport: { width: 1280, height: 900 } });
        await context.addInitScript((requestedTheme) => {
          window.localStorage.setItem("zeron-design.theme", requestedTheme);
        }, theme);
        const page = await context.newPage();
        for (const slug of slugs) {
          process.stdout.write(`Generating ${theme} cover for ${slug}\n`);
          await captureCover(page, slug, theme);
        }
        await context.close();
      }
    } finally {
      await browser.close();
    }
  } finally {
    await stopServer(server);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
