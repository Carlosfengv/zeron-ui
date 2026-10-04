import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { agentGuideLoaders } from "../docs/generated/agent-guide-loaders.generated";

async function stop(server: ChildProcess) {
  if (server.exitCode !== null) return;
  server.kill("SIGTERM");
  await Promise.race([once(server, "exit"), new Promise((resolve) => setTimeout(resolve, 5000))]);
  if (server.exitCode === null) server.kill("SIGKILL");
}
describe("MCP and agent documents in a production Next.js build", () => {
  it("serves encoded item IDs, every guide, frozen snapshots, and protocol calls without locale redirects", async () => {
    const port = 4500 + Math.floor(Math.random() * 400);
    const origin = `http://127.0.0.1:${port}`;
    const server = spawn(process.execPath, [join(process.cwd(), "node_modules/next/dist/bin/next"), "start", "-p", String(port)], { stdio: "ignore" });
    try {
      let ready = false;
      const deadline = Date.now() + 30000;
      while (Date.now() < deadline && !ready) {
        if (server.exitCode !== null) throw new Error(`Production server exited: ${server.exitCode}`);
        try { ready = (await fetch(`${origin}/ai/catalog.json`)).ok; } catch { /* server is starting */ }
        if (!ready) await new Promise((resolve) => setTimeout(resolve, 150));
      }
      expect(ready).toBe(true);
      const catalogResponse = await fetch(`${origin}/ai/catalog.json`);
      const catalog = await catalogResponse.json();
      expect(catalog.mode).toBe("development"); expect(catalog.catalogUrl).toBeNull();
      expect(catalogResponse.headers.get("cache-control")).toContain("max-age=60");
      expect(catalogResponse.headers.get("etag")).not.toBeNull();
      for (const item of catalog.items) {
        const encoded = encodeURIComponent(item.id);
        const detail = await fetch(`${origin}/ai/items/${encoded}.json`, { redirect: "manual" });
        expect(detail.status, item.id).toBe(200); expect((await detail.json()).item.id).toBe(item.id);
        const markdown = await fetch(`${origin}/ai/items/${encoded}.md`, { redirect: "manual" });
        expect(markdown.status, item.id).toBe(200); expect(await markdown.text()).toContain(item.id);
      }
      for (const key of Object.keys(agentGuideLoaders)) {
        const response = await fetch(`${origin}/agent-guides/${key}`, { redirect: "manual" });
        expect(response.status, key).toBe(200); expect(response.headers.get("content-type")).toContain("text/markdown");
      }
      const runtime = JSON.parse(await readFile(join(process.cwd(), "docs/generated/agent-runtime/current.json"), "utf8"));
      const mappingResponse = await fetch(`${origin}/ai/releases/${catalog.catalogVersion}/guide-routes.json`);
      expect(mappingResponse.status).toBe(200);
      expect(mappingResponse.headers.get("cache-control")).toContain("immutable");
      expect(await mappingResponse.json()).toEqual(runtime.guideRoutes);
      expect(await (await fetch(`${origin}/ai/guide-routes.json`)).json()).toEqual(runtime.guideRoutes);
      for (const route of runtime.guideRoutes.routes as { path: string; itemId: string }[]) {
        const response = await fetch(`${origin}/agent-guides/${route.path}`, { redirect: "manual" });
        expect(response.status, route.path).toBe(200);
        expect(await response.text(), route.path).toBe(runtime.details[route.itemId].guide);
      }
      expect((await fetch(`${origin}/agent-guides/blocks/page-layout.md`)).status).toBe(404);
      expect((await fetch(`${origin}/agent-guides/components/not-a-real-guide.md`)).status).toBe(404);
      for (const name of ["llms.txt", "llms-small.txt", "llms-full.txt"]) expect((await fetch(`${origin}/${name}`)).status).toBe(200);
      const versioned = await fetch(`${origin}/ai/releases/${catalog.catalogVersion}/catalog.json`);
      expect(versioned.headers.get("cache-control")).toContain("immutable");
      expect((await versioned.json()).catalogVersion).toBe(catalog.catalogVersion);
      const response = await fetch(`${origin}/api/mcp`, { method: "POST", redirect: "manual", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/call", params: { name: "search_components", arguments: { query: "button", locale: "en" } } }) });
      expect(response.status).toBe(200); expect(response.headers.get("location")).toBeNull();
      expect(await response.text()).toContain("component:button");
      for (const name of ["list_components", "search_components"]) {
        const call = async (arguments_: Record<string, unknown>) => {
          const response = await fetch(`${origin}/api/mcp`, { method: "POST", redirect: "manual",
            headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
            body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/call", params: { name, arguments: arguments_ } }) });
          expect(response.status).toBe(200);
          expect(response.headers.get("location")).toBeNull();
          const body = await response.text();
          const envelope = response.headers.get("content-type")?.includes("text/event-stream")
            ? JSON.parse(body.split("\n").find(line => line.startsWith("data: "))!.slice(6)) : JSON.parse(body);
          expect(envelope.error).toBeUndefined();
          expect(envelope.result.isError).toBe(false);
          return envelope.result;
        };
        const first = await call({ limit: 1, ...(name === "search_components" ? { query: "resource" } : {}) });
        expect(first.structuredContent.data.nextCursor).not.toBeNull();
        const continuation = JSON.parse(first.content[0].text.split("these complete arguments:\n")[1]);
        expect(continuation.catalogVersion).toBe(catalog.catalogVersion);
        const second = await call(continuation);
        expect(second.structuredContent.data.items).toHaveLength(1);
        expect(second.structuredContent.data.items[0].id).not.toBe(first.structuredContent.data.items[0].id);
      }
      expect((await fetch(`${origin}/api/mcp`, { redirect: "manual" })).status).toBe(405);

      // Local source availability can mask missing Vercel bundle files. Inspect
      // Next's trace independently of the requests above.
      const guideTracePath = join(process.cwd(), ".next/server/app/agent-guides/[collection]/[slug]/route.js.nft.json");
      const guideTrace = JSON.parse(await readFile(guideTracePath, "utf8"));
      const tracedGuides = new Set(guideTrace.files.map((file: string) => resolve(dirname(guideTracePath), file)));
      for (const key of Object.keys(agentGuideLoaders)) expect(tracedGuides.has(join(process.cwd(), "docs/agent-guides", key)), `Guide not traced: ${key}`).toBe(true);
      const mcpTracePath = join(process.cwd(), ".next/server/app/api/mcp/route.js.nft.json");
      const mcpTrace = JSON.parse(await readFile(mcpTracePath, "utf8"));
      // pnpm's Next directory name contains its @playwright peer suffix even
      // when no Playwright files are bundled. Check actual package segments.
      expect(mcpTrace.files.some((file: string) => file.includes(".next/cache") || /\/node_modules\/(?:playwright(?:-core)?|@playwright)(?:\/|$)/.test(file))).toBe(false);
    } finally { await stop(server); }
  }, 90000);
});
