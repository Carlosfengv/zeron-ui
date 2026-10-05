import { afterEach, describe, expect, it, vi } from "vitest";
import { checkMcpConnection } from "../docs/lib/mcp-connection";
import { snapshots } from "../lib/agent-catalog/runtime";
import { createAgentMcpHandler } from "../lib/mcp/handler";

const endpoint = "http://localhost:3000/api/mcp";
const signal = () => new AbortController().signal;
const discovery = {
  jsonrpc: "2.0", id: "connection-check", result: { tools: [
    "search_components", "list_components", "get_component", "get_install_command", "get_skill",
  ].map((name) => ({ name })) },
};
afterEach(() => { vi.unstubAllGlobals(); });

describe("browser MCP connection check", () => {
  it("discovers the real handler's tools without changing installation readiness", async () => {
    const handler = createAgentMcpHandler(snapshots, { allowedOrigins: ["http://localhost:3000"] });
    vi.stubGlobal("fetch", (url: string, init: RequestInit) => handler(new Request(url, init)));
    await expect(checkMcpConnection(endpoint, signal())).resolves.toBeUndefined();
    const response = await handler(new Request(endpoint, {
      method: "POST", headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/call", params: {
        name: "get_install_command", arguments: { ids: ["button"], packageManager: "pnpm", targetFramework: "next" },
      } }),
    }));
    expect(await response.text()).toContain("INSTALLATION_UNVERIFIED");
  });
  it.each(["json", "sse"])("accepts %s discovery responses", async (format) => {
    const body = format === "json" ? JSON.stringify(discovery) : `: heartbeat\r\n\r\nevent: message\r\ndata: ${JSON.stringify(discovery)}\r\n\r\n`;
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { headers: { "content-type": format === "json" ? "application/json" : "text/event-stream" } })));
    await expect(checkMcpConnection(endpoint, signal())).resolves.toBeUndefined();
  });
  it.each([
    { status: 403, body: "Forbidden" },
    { status: 200, body: "<html>Sign in</html>" },
    { status: 200, body: JSON.stringify({ ...discovery, id: "other-request" }) },
    { status: 200, body: JSON.stringify({ ...discovery, error: { code: -32603 } }) },
    { status: 200, body: JSON.stringify({ ...discovery, result: { tools: discovery.result.tools.slice(1) } }) },
  ])("rejects unavailable, invalid or incomplete discovery: $body", async ({ status, body }) => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status })));
    await expect(checkMcpConnection(endpoint, signal())).rejects.toThrow();
  });
  it("passes cancellation to the request and propagates connection failures", async () => {
    const controller = new AbortController();
    const fetcher = vi.fn().mockRejectedValue(new DOMException("Aborted", "AbortError"));
    vi.stubGlobal("fetch", fetcher);
    controller.abort();
    await expect(checkMcpConnection(endpoint, controller.signal)).rejects.toThrow("Aborted");
    expect(fetcher).toHaveBeenCalledWith(endpoint, expect.objectContaining({ signal: controller.signal, method: "POST" }));
  });
});
