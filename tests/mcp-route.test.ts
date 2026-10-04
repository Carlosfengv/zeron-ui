import { CLIENT_CAPABILITIES_META_KEY, CLIENT_INFO_META_KEY, PROTOCOL_VERSION_META_KEY } from "@modelcontextprotocol/server";
import { describe, expect, it } from "vitest";
import { loadSnapshots, snapshots } from "../lib/agent-catalog/runtime";
import { createAgentMcpHandler } from "../lib/mcp/handler";
import { addSkillReference } from "./helpers/skill-reference-fixture";

const handler = createAgentMcpHandler(snapshots, { allowedOrigins: ["https://zeron-ui.vercel.app"] });
async function rpc(method: string, params: Record<string, unknown> = {}, modern = false, target = handler) {
  const _meta = modern ? { [PROTOCOL_VERSION_META_KEY]: "2026-07-28", [CLIENT_INFO_META_KEY]: { name: "zeron-tests", version: "1" }, [CLIENT_CAPABILITIES_META_KEY]: {} } : undefined;
  const response = await target(new Request("https://zeron-ui.vercel.app/api/mcp", { method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream", ...(modern ? { "mcp-protocol-version": "2026-07-28", "mcp-method": method, ...(typeof params.name === "string" ? { "mcp-name": params.name } : {}) } : {}) }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params: { ...params, ...(_meta ? { _meta } : {}) } }) }));
  const text = await response.text();
  const envelope = response.headers.get("content-type")?.includes("text/event-stream") ? JSON.parse(text.split("\n").find((line) => line.startsWith("data: "))!.slice(6)) : JSON.parse(text);
  return { response, envelope };
}

describe("real stateless MCP HTTP adapter", () => {
  it("supports legacy initialization and independently discovers five readonly tools", async () => {
    const initialized = await rpc("initialize", { protocolVersion: "2025-11-25", capabilities: {}, clientInfo: { name: "tests", version: "1" } });
    expect(initialized.response.status).toBe(200); expect(initialized.envelope.result.protocolVersion).toBe("2025-11-25");
    const { envelope } = await rpc("tools/list");
    expect(envelope.result.tools.map((tool: { name: string }) => tool.name).sort()).toEqual(["get_component", "get_install_command", "get_skill", "list_components", "search_components"]);
    expect(envelope.result.tools.every((tool: { annotations: { readOnlyHint: boolean }; outputSchema: unknown }) => tool.annotations.readOnlyHint && tool.outputSchema)).toBe(true);
  });
  it("supports modern discovery and per-request tool calls on a fresh handler", async () => {
    const fresh = createAgentMcpHandler(snapshots, { allowedOrigins: [] });
    const discovery = await rpc("server/discover", {}, true, fresh);
    expect(discovery.response.status, JSON.stringify(discovery.envelope)).toBe(200); expect(discovery.envelope.error).toBeUndefined();
    const called = await rpc("tools/call", { name: "get_component", arguments: { id: "button", locale: "en" } }, true, fresh);
    expect(called.envelope.error).toBeUndefined(); expect(JSON.stringify(called.envelope.result)).toContain("component:button");
  });
  it("exposes machine results, ordinary empty searches, and typed business errors", async () => {
    const empty = await rpc("tools/call", { name: "search_components", arguments: { query: "unobtainium-xyzqplkjh" } });
    expect(empty.envelope.error).toBeUndefined(); expect(empty.envelope.result.structuredContent.data.items).toEqual([]);
    const unknown = await rpc("tools/call", { name: "get_component", arguments: { id: "does-not-exist" } });
    expect(unknown.envelope.result.isError).toBe(true); expect(JSON.stringify(unknown.envelope.result)).toContain("ITEM_NOT_FOUND");
    const invalid = await rpc("tools/call", { name: "search_components", arguments: { query: "" } });
    expect(invalid.envelope.error || invalid.envelope.result?.isError).toBeTruthy();
    const unverified = await rpc("tools/call", { name: "get_install_command", arguments: { ids: ["button"], packageManager: "npm", targetFramework: "vite" } });
    expect(unverified.envelope.result.isError).toBe(true); expect(JSON.stringify(unverified.envelope.result)).toContain("INSTALLATION_UNVERIFIED");
  });
  it("does not leak locale or version between concurrent clients", async () => {
    const results = await Promise.all(Array.from({ length: 10 }, (_, index) => rpc("tools/call", { name: "search_components", arguments: { query: "button", locale: index % 2 ? "en" : "zh-CN", ...(index === 0 ? { catalogVersion: "c".repeat(64) } : {}) } })));
    expect(JSON.stringify(results[0].envelope.result)).toContain("VERSION_UNAVAILABLE");
    for (let index = 1; index < results.length; index++) {
      const body = JSON.stringify(results[index].envelope.result);
      expect(body).toContain(`"requestedLocale":"${index % 2 ? "en" : "zh-CN"}"`);
      expect(body).not.toContain("VERSION_UNAVAILABLE");
    }
  });
  it.each([
    ["list_components", false], ["list_components", true],
    ["search_components", false], ["search_components", true],
  ] as const)("follows the complete %s continuation arguments with modern protocol=%s", async (name, modern) => {
    let arguments_: Record<string, unknown> = { limit: 2, ...(name === "search_components" ? { query: "resource" } : {}) };
    const ids: string[] = [];
    let total = 0;
    let calls = 0;
    while (true) {
      const { response, envelope } = await rpc("tools/call", { name, arguments: arguments_ }, modern);
      expect(response.status).toBe(200);
      expect(envelope.error).toBeUndefined();
      expect(envelope.result.isError).toBe(false);
      const { meta, data } = envelope.result.structuredContent;
      total = data.total;
      ids.push(...data.items.map((item: { id: string }) => item.id));
      expect(++calls).toBeLessThan(100);
      if (!data.nextCursor) break;
      arguments_ = JSON.parse(envelope.result.content[0].text.split("these complete arguments:\n")[1]);
      expect(arguments_).toMatchObject({ cursor: data.nextCursor, catalogVersion: meta.catalogVersion });
    }
    expect(calls).toBeGreaterThan(1);
    expect(ids).toHaveLength(total);
    expect(new Set(ids).size).toBe(total);
  });
  it("rejects browser origins and caps streamed bodies without trusting Content-Length", async () => {
    expect((await handler(new Request("https://zeron-ui.vercel.app/api/mcp", { headers: { origin: "https://evil.example" } }))).status).toBe(403);
    const oversized = new Request("https://zeron-ui.vercel.app/api/mcp", { method: "POST", headers: { "content-length": "2", "content-type": "application/json" }, body: "x".repeat(65537) });
    expect((await handler(oversized)).status).toBe(413);
    const preflight = await handler(new Request("https://zeron-ui.vercel.app/api/mcp", { method: "OPTIONS", headers: { origin: "https://zeron-ui.vercel.app" } }));
    expect(preflight.status).toBe(204); expect(preflight.headers.get("access-control-allow-origin")).toBe("https://zeron-ui.vercel.app");
    for (const method of ["GET", "DELETE"]) expect((await handler(new Request("https://zeron-ui.vercel.app/api/mcp", { method }))).status).toBe(405);
  });
  it("logs only safe metrics and keeps responses within their byte budget", async () => {
    const logs: Record<string, unknown>[] = [];
    const observed = createAgentMcpHandler(snapshots, { allowedOrigins: [], log: (event) => logs.push(event) });
    const secretQuery = "private-project-name-xyz";
    const { response, envelope } = await rpc("tools/call", { name: "search_components", arguments: { query: secretQuery } }, false, observed);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(Buffer.byteLength(JSON.stringify(envelope))).toBeLessThan(32768);
    expect(JSON.stringify(logs)).not.toContain(secretQuery);
    expect(logs.some((entry) => entry.tool === "search_components")).toBe(true);
    expect(logs.every((entry) => entry.requestId === response.headers.get("x-request-id"))).toBe(true);
  });
  it("provides usable documentation to clients that only read text content", async () => {
    const found = await rpc("tools/call", { name: "search_components", arguments: { query: "button" } });
    const search = found.envelope.result.content.map((item: { text: string }) => item.text).join("\n");
    expect(search).toContain("component:button"); expect(search).toContain("component%3Abutton.md");
    const detail = await rpc("tools/call", { name: "get_component", arguments: { id: "button", sections: ["api"] } });
    const text = detail.envelope.result.content.map((item: { text: string }) => item.text).join("\n");
    expect(text).toContain("Public exports:"); expect(text).toContain("Button");
    // Read an actually reported section name rather than assuming a heading.
    const complete = await rpc("tools/call", { name: "get_skill", arguments: { name: "zeron-page-builder" } });
    const skill = await rpc("tools/call", { name: "get_skill", arguments: { name: "zeron-page-builder", section: complete.envelope.result.structuredContent.data.availableSections[0] } });
    expect(complete.envelope.result.content[0].text).toContain(complete.envelope.result.structuredContent.data.sections[0].text);
    expect(complete.envelope.result.content[0].text).toContain("Allowed references:");
    expect(skill.envelope.result.isError).toBe(false);
  });
  it("keeps paginated text and machine chapters within the combined transport budget", async () => {
    const fixture = structuredClone(snapshots.versions[0]);
    addSkillReference(fixture, "references/transport-large.md", `# Large\n\n\`\`\`tsx\n${Array.from({ length: 2200 }, (_, index) => `// ${index}: 文字与表情🙂`).join("\n")}\n\`\`\`\n`);
    const fresh = createAgentMcpHandler(loadSnapshots({ currentVersion: fixture.catalog.catalogVersion, versions: [fixture] }), { allowedOrigins: [] });
    let cursor: string | null = null;
    const text: string[] = [];
    do {
      const { envelope } = await rpc("tools/call", { name: "get_skill", arguments: { name: "zeron-page-builder", reference: "references/transport-large.md", ...(cursor ? { cursor } : {}) } }, false, fresh);
      expect(envelope.result.isError).toBe(false);
      expect(Buffer.byteLength(JSON.stringify(envelope))).toBeLessThan(65536);
      const data = envelope.result.structuredContent.data;
      const readable = envelope.result.content[0].text;
      for (const section of data.sections) expect(readable).toContain(section.text);
      text.push(readable);
      cursor = data.nextCursor;
      if (cursor) {
        const parameters = JSON.parse(readable.split("these complete arguments:\n")[1]);
        expect(parameters).toMatchObject({ name: "zeron-page-builder", reference: "references/transport-large.md", cursor, catalogVersion: fixture.catalog.catalogVersion });
      }
    } while (cursor);
    for (let index = 0; index < 2200; index++) expect(text.join("\n")).toContain(`// ${index}: 文字与表情🙂`);
  });
  it("transports every raw reference byte within budget and gives text clients exact continuation", async () => {
    const fixture = structuredClone(snapshots.versions[0]);
    const raw = "---\r\n# inert script\r\n```\r\n" + "中文🙂\\\"\t".repeat(5000) + "last-byte";
    addSkillReference(fixture, "scripts/transport-text.mjs", raw);
    const fresh = createAgentMcpHandler(loadSnapshots({ currentVersion: fixture.catalog.catalogVersion, versions: [fixture] }), { allowedOrigins: [] });
    let cursor: string | null = null;
    const parts: string[] = [];
    let pageCount = 0;
    do {
      const { envelope } = await rpc("tools/call", { name: "get_skill", arguments: { name: "zeron-page-builder", reference: "scripts/transport-text.mjs", ...(cursor ? { cursor } : {}) } }, pageCount % 2 === 0, fresh);
      expect(envelope.result.isError).toBe(false);
      expect(Buffer.byteLength(JSON.stringify(envelope))).toBeLessThan(65536);
      const data = envelope.result.structuredContent.data;
      const readable = envelope.result.content[0].text;
      expect(readable).toContain("Source format: text;");
      expect(readable).toContain(data.sourceSha256);
      for (const section of data.sections) {
        expect(readable).toContain(section.text);
        expect(readable).toContain(`[${section.startByte},${section.endByte})`);
        parts.push(section.text);
      }
      cursor = data.nextCursor;
      if (cursor) expect(JSON.parse(readable.split("these complete arguments:\n")[1])).toMatchObject({ reference: "scripts/transport-text.mjs", cursor, catalogVersion: fixture.catalog.catalogVersion });
      expect(++pageCount).toBeLessThan(100);
    } while (cursor);
    expect(pageCount).toBeGreaterThan(1);
    expect(Buffer.from(parts.join(""))).toEqual(Buffer.from(raw));
  });
  it("isolates request IDs under concurrency and tolerates a failing metrics sink", async () => {
    const logs: Record<string, unknown>[] = [];
    const observed = createAgentMcpHandler(snapshots, { allowedOrigins: [], log: (event) => logs.push(event) });
    const results = await Promise.all(Array.from({ length: 8 }, (_, index) => rpc("tools/call", { name: "get_component", arguments: { id: index % 2 ? "button" : "input" } }, false, observed)));
    const ids = results.map(({ response }) => response.headers.get("x-request-id"));
    expect(new Set(ids).size).toBe(8);
    for (const id of ids) {
      const events = logs.filter((entry) => entry.requestId === id);
      expect(events.some((entry) => entry.tool === "get_component")).toBe(true);
      expect(events.some((entry) => entry.status === 200)).toBe(true);
    }
    const broken = createAgentMcpHandler(snapshots, { allowedOrigins: [], log: () => { throw new Error("Metrics unavailable"); } });
    expect((await rpc("tools/call", { name: "get_component", arguments: { id: "button" } }, false, broken)).envelope.result.isError).toBe(false);
  });
});
