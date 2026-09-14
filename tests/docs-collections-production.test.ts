import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { createServer } from "node:net";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { artifactCatalog } from "../docs/catalog/artifacts";
import { artifactPathname } from "../docs/catalog/artifact-collections";

async function startServer() {
  const socket = createServer();
  socket.listen(0, "127.0.0.1");
  await once(socket, "listening");
  const address = socket.address();
  if (!address || typeof address === "string") throw new Error("No test port assigned");
  const port = address.port;
  await new Promise<void>((resolve, reject) => socket.close((error) => error ? reject(error) : resolve()));
  const server = spawn(process.execPath, [join(process.cwd(), "node_modules/next/dist/bin/next"), "start", "--port", String(port)], {
    stdio: "ignore",
    env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1" },
  });
  return { server, origin: `http://127.0.0.1:${port}` };
}

async function stopServer(server: ChildProcess) {
  if (server.exitCode !== null) return;
  const exited = once(server, "exit");
  server.kill("SIGTERM");
  await exited;
}

describe("documentation collections in production", () => {
  it("serves both collections and their canonical details, retaining localized legacy links", async () => {
    const { server, origin } = await startServer();
    try {
      await expect.poll(async () => {
        if (server.exitCode !== null) throw new Error("Production server exited");
        return fetch(`${origin}/docs/pages`).then((response) => response.status).catch(() => 0);
      }, { timeout: 15_000 }).toBe(200);

      for (const prefix of ["", "/en"]) {
        for (const collection of ["blocks", "pages"] as const) {
          const response = await fetch(`${origin}${prefix}/docs/${collection}`);
          expect(response.status).toBe(200);
          const html = await response.text();
          expect(html).not.toMatch(/navigation\.(blocks|pages)/);
          expect(html).toContain(`href="${prefix}/docs/blocks"`);
          expect(html).toContain(`href="${prefix}/docs/pages"`);
          const title = collection === "pages" ? (prefix ? "Pages" : "页面") : (prefix ? "Blocks" : "区块");
          expect(html).toContain(`<title>${title}</title>`);
          expect(html).toMatch(new RegExp(`<h1[^>]*>${title}</h1>`));
          for (const artifact of artifactCatalog) {
            const cardLink = `href="${prefix}${artifactPathname(artifact.slug)}"`;
            if (artifact.collection === collection) expect(html).toContain(cardLink);
            else expect(html).not.toContain(cardLink);
          }
        }

        for (const artifact of artifactCatalog) {
          const pathname = `${prefix}${artifactPathname(artifact.slug)}`;
          const response = await fetch(`${origin}${pathname}`);
          expect(response.status, pathname).toBe(200);
          const html = await response.text();
          expect(html).toContain(`<link rel="canonical" href="https://zeron-ui.vercel.app${pathname}"`);
          expect(html).not.toMatch(/navigation\.(blocks|pages)/);
          if (artifact.collection === "pages") {
            const legacy = await fetch(`${origin}${prefix}/docs/blocks/${artifact.slug}?source=legacy`, { redirect: "manual" });
            expect(legacy.status).toBe(308);
            expect(legacy.headers.get("location")).toBe(`${pathname}?source=legacy`);
          }
        }
      }

      expect((await fetch(`${origin}/docs/pages/resource-list-table-01`)).status).toBe(404);
      const legacyFilter = await fetch(`${origin}/en/docs/blocks?kind=page&q=resource`, { redirect: "manual" });
      expect(legacyFilter.status).toBe(307);
      expect(legacyFilter.headers.get("location")).toBe("/en/docs/pages?kind=page&q=resource");

      for (const prefix of ["/zh-cn", "/zh-CN"]) {
        const legacy = await fetch(`${origin}${prefix}/docs/blocks/agent-trace-01?source=legacy`, { redirect: "manual" });
        expect(legacy.status).toBe(308);
        expect(legacy.headers.get("location")).toBe("/docs/pages/agent-trace-01?source=legacy");
      }
      const filtered = await (await fetch(`${origin}/docs/pages?q=infinite`)).text();
      expect(filtered).toContain('href="/docs/pages/infinite-log-table-01"');
      expect(filtered).not.toContain('href="/docs/pages/login-01"');

      const sitemap = await (await fetch(`${origin}/sitemap.xml`)).text();
      expect(sitemap).toContain("https://zeron-ui.vercel.app/docs/pages");
      expect(sitemap).toContain("https://zeron-ui.vercel.app/en/docs/blocks");
      expect(sitemap).not.toContain("https://zeron-ui.vercel.app/docs/blocks/login-01");
    } finally {
      await stopServer(server);
    }
  }, 60_000);
});
