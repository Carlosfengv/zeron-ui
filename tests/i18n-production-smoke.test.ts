import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { describe, expect, it } from "vitest";
import { pageDocEntries, pathnameOf } from "../docs/manifest";
import { localizedUrl } from "../docs/seo/locale";

const port = 3200 + Math.floor(Math.random() * 400);
const origin = `http://127.0.0.1:${port}`;

async function waitForServer(server: ChildProcess) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`next start exited with code ${server.exitCode}`);
    try {
      const response = await fetch(origin);
      if (response.ok) return;
    } catch {
      // The server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Timed out waiting for the production server");
}

async function stop(server: ChildProcess) {
  if (server.exitCode !== null) return;
  server.kill("SIGTERM");
  await Promise.race([
    once(server, "exit"),
    new Promise((resolve) => setTimeout(resolve, 5_000)),
  ]);
  if (server.exitCode === null) server.kill("SIGKILL");
}

describe("i18n production smoke", () => {
  it("serves canonical localized documentation from a production build", async () => {
    const server = spawn("npm", ["run", "start", "--", "-p", String(port)], {
      stdio: "ignore",
      env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
    });

    try {
      await waitForServer(server);

      const english = await fetch(`${origin}/docs/components/button`);
      const englishHtml = await english.text();
      expect(english.status).toBe(200);
      expect(englishHtml).toContain('<html lang="en"');
      expect(englishHtml).toContain('<link rel="canonical" href="https://zeron-ui.vercel.app/docs/components/button"');
      expect(englishHtml).toContain('hrefLang="en"');
      expect(englishHtml).toContain('hrefLang="zh-CN"');

      const chinese = await fetch(`${origin}/zh-cn/docs/components/button`);
      const chineseHtml = await chinese.text();
      expect(chinese.status).toBe(200);
      expect(chineseHtml).toContain('<html lang="zh-CN"');
      expect(chineseHtml).toContain('<link rel="canonical" href="https://zeron-ui.vercel.app/zh-cn/docs/components/button"');
      expect(chineseHtml).toContain("基础用法");
      expect(chineseHtml).toContain("自定义外观");
      expect(chineseHtml).toContain("语言");

      const prefixedEnglish = await fetch(`${origin}/en/docs/components/button`, { redirect: "manual" });
      expect(prefixedEnglish.status).toBeGreaterThanOrEqual(300);
      expect(prefixedEnglish.headers.get("location")).toBe("/docs/components/button");

      const unknownLocale = await fetch(`${origin}/fr/docs/components/button`);
      expect(unknownLocale.status).toBe(404);

      const internalDemo = await fetch(`${origin}/demo`);
      expect(internalDemo.status).toBe(200);
      expect(await internalDemo.text()).toContain('<html lang="en"');

      const legacy = await fetch(`${origin}/zh-cn/docs/tabs-subtle`, { redirect: "manual" });
      expect(legacy.status).toBeGreaterThanOrEqual(300);
      expect(legacy.headers.get("location")).toBe("/zh-cn/docs/components/tabs");

      const oldButton = await fetch(`${origin}/docs/button`, { redirect: "manual" });
      expect(oldButton.status).toBe(308);
      expect(oldButton.headers.get("location")).toBe("/docs/components/button");

      const sitemap = await fetch(`${origin}/sitemap.xml`);
      const sitemapXml = await sitemap.text();
      expect(sitemap.status).toBe(200);
      for (const entry of pageDocEntries) {
        expect(sitemapXml).toContain(localizedUrl(pathnameOf(entry), "en"));
        expect(sitemapXml).toContain(localizedUrl(pathnameOf(entry), "zh-CN"));
      }
      expect(sitemapXml).not.toContain("[locale]");
      expect(sitemapXml).not.toContain("/en/docs/");

      const robots = await fetch(`${origin}/robots.txt`);
      expect(robots.status).toBe(200);
      expect(await robots.text()).toContain("Sitemap: https://zeron-ui.vercel.app/sitemap.xml");
    } finally {
      await stop(server);
    }
  }, 45_000);
});
