const expectedTools = ["search_components", "list_components", "get_component", "get_install_command", "get_skill"];

/** Check this deployment's stateless MCP discovery, not client setup or installation readiness. */
export async function checkMcpConnection(endpoint: string, signal: AbortSignal): Promise<void> {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: "connection-check", method: "tools/list", params: {} }),
    signal,
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`MCP HTTP ${response.status}`);
  const body = await response.text();
  const messages: unknown[] = response.headers.get("content-type")?.includes("text/event-stream")
    ? body.split(/\r?\n\r?\n/).flatMap((event) => {
      const data = event.split(/\r?\n/).filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trimStart()).join("\n");
      return data ? [JSON.parse(data)] : [];
    })
    : [JSON.parse(body)];
  const valid = messages.some((message) => {
    if (!message || typeof message !== "object") return false;
    const rpc = message as { jsonrpc?: unknown; id?: unknown; error?: unknown; result?: { tools?: unknown } };
    if (rpc.jsonrpc !== "2.0" || rpc.id !== "connection-check" || rpc.error || !Array.isArray(rpc.result?.tools)) return false;
    const names = rpc.result.tools.map((tool: unknown) => tool && typeof tool === "object" && "name" in tool ? tool.name : null);
    return expectedTools.every((name) => names.includes(name));
  });
  if (!valid) throw new Error("MCP discovery did not return the expected Zeron tools");
}
