import { createMcpHandler } from "mcp-handler";
import { AsyncLocalStorage } from "node:async_hooks";
import { outputSchemas, toolSchemas, type QueryResult, type ToolName } from "../agent-catalog/contracts";
import { createCatalogQuery } from "../agent-catalog/query";
import type { AgentRuntime } from "../agent-catalog/schema";

const descriptions: Record<ToolName, string> = {
  search_components: "Find Zeron components and blocks by Chinese or English task. Inspect details and local environment before installation. Retain catalogVersion for subsequent calls.",
  list_components: "Browse a stable, filtered Zeron catalog. Support dependencies are hidden unless explicitly requested. Cursor is bound to version and filters.",
  get_component: "Read exact-version usage, exports, constraints, sources, and documentation coverage by stable ID or registered alias. Installed public types remain authoritative.",
  get_install_command: "Generate dry-run and install commands only for a verified published CLI and immutable Registry combination. Does not execute commands or modify projects. Inspect local Next/Vite environment first.",
  get_skill: "Read one exact-version Zeron skill or allowlisted reference, optionally by section. Does not install Skills; use the paired ZIP installation guide for complete installation.",
};

function textSummary(name: ToolName, result: QueryResult, input: unknown) {
  const lines = [`Catalog: ${result.meta.catalogVersion ?? "unavailable"}; mode: ${result.meta.mode ?? "unavailable"}; locale: ${result.meta.requestedLocale}.`];
  if (result.meta.catalogUrl) lines.push(`Fixed catalog: ${result.meta.catalogUrl}`);
  lines.push(...result.meta.warnings.map((warning) => `Warning: ${warning}`));
  if ("error" in result) return [...lines, `${result.error.code}: ${result.error.message}`, JSON.stringify(result.error.details, null, 2)].join("\n\n");
  const { data } = outputSchemas[name].parse(result);
  if (!data) throw new Error("Missing tool data");
  if ("items" in data) {
    lines.push(`${data.items.length} of ${data.total} matching catalog items.`);
    for (const item of data.items) lines.push(`${item.id} — ${item.title}\nFramework: ${item.framework ?? "unknown"}; compatibility: ${item.compatibility}; installable: ${item.installable}; coverage: ${item.coverage}.\nMarkdown: ${item.markdown}`);
  }
  if ("item" in data) lines.push(`${data.item.id} — ${data.item.title}\nFramework: ${data.item.framework ?? "unknown"}; coverage: ${data.item.coverage}; installable: ${data.item.installable}.\nMarkdown: ${data.item.markdown}`);
  if ("name" in data) lines.push(`Skill: ${data.name}; reference: ${data.reference}; version: ${data.skillVersion ?? "unavailable"}.\nFull installation guide: ${data.installationGuide}\nAllowed references: ${data.references.join(", ")}`);
  if ("contentFormat" in data && data.contentFormat) lines.push(`Source format: ${data.contentFormat}; UTF-8 bytes: ${data.sourceBytes}; SHA-256: ${data.sourceSha256}.`);
  if ("sections" in data) {
    for (const section of data.sections) lines.push(`## ${section.name}${section.startByte !== undefined ? `; source bytes [${section.startByte},${section.endByte})` : ""}\n\n${section.text}`);
    lines.push(`Available sections: ${data.availableSections.join(", ")}.`);
  }
  if ("commands" in data) {
    lines.push(`CLI: ${data.cliVersion}; framework: ${data.targetFramework}; package manager: ${data.packageManager}.\nRegistry: ${data.registryBase}\nPackage integrity: ${data.cliDistIntegrity}`);
    lines.push(`Preflight:\n${data.commands.dryRun}\n\nInstall:\n${data.commands.install}`);
    lines.push(...data.prerequisites.map((prerequisite) => `Prerequisite: ${prerequisite}`));
    lines.push(...data.itemVerification.map((item) => `${item.id}: dependency closure checked; consumer-tested: ${item.consumerTested}.`));
  }
  if ("nextCursor" in data && data.nextCursor) {
    lines.push(`More content remains. Continue with ${name} and these complete arguments:\n${JSON.stringify({ ...toolSchemas[name].parse(input), catalogVersion: result.meta.catalogVersion, cursor: data.nextCursor })}`);
  }
  return lines.join("\n\n");
}
function toolResult(name: ToolName, result: QueryResult, input: unknown) {
  return { isError: "error" in result, structuredContent: result,
    content: [{ type: "text" as const, text: textSummary(name, result, input) }] };
}
function response(status: number, message: string, requestId: string) {
  return Response.json({ error: message, requestId }, { status, headers: { "cache-control": "no-store", "x-request-id": requestId } });
}
export function configuredOrigins(): string[] {
  const origins = [process.env.SITE_BASE_URL ?? "https://zeron-ui.vercel.app", ...(process.env.MCP_ALLOWED_ORIGINS?.split(",") ?? [])].map((origin) => origin.trim()).filter(Boolean);
  if (process.env.NODE_ENV === "development") origins.push("http://localhost:3000", "http://127.0.0.1:3000");
  for (const origin of origins) if (new URL(origin).origin !== origin) throw new Error("MCP origin configuration must contain exact origins");
  return origins;
}

export function createAgentMcpHandler(snapshots: { currentVersion: string; versions: AgentRuntime[] }, options: { allowedOrigins: string[]; log?: (event: Record<string, unknown>) => void }) {
  const query = createCatalogQuery(snapshots);
  const allowedOrigins = new Set(options.allowedOrigins);
  const requestContext = new AsyncLocalStorage<{ requestId: string }>();
  const log = (event: Record<string, unknown>) => {
    try { options.log?.({ ...event, requestId: requestContext.getStore()?.requestId }); }
    catch { /* Metrics cannot change the outcome of a documentation request. */ }
  };
  const handler = createMcpHandler((server) => {
    for (const name of Object.keys(toolSchemas) as ToolName[]) {
      server.registerTool(name, { title: name, description: descriptions[name], inputSchema: toolSchemas[name], outputSchema: outputSchemas[name],
        annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false } }, async (input: unknown) => {
        const started = performance.now();
        let result: QueryResult;
        try { result = query.call(name, input); }
        catch {
          const requestId = requestContext.getStore()?.requestId ?? crypto.randomUUID();
          log({ tool: name, requestId, errorCode: "INTERNAL_ERROR" });
          result = { meta: { schemaVersion: 1, catalogVersion: null, catalogUrl: null, sourceRevision: null, mode: null,
            requestedLocale: input && typeof input === "object" && "locale" in input && input.locale === "en" ? "en" : "zh-CN", warnings: [] },
            error: { code: "INTERNAL_ERROR", message: "The tool could not complete this request.", details: { requestId } } };
        }
        let output = toolResult(name, result, input);
        let bytes = Buffer.byteLength(JSON.stringify(output), "utf8") + 1024;
        if (bytes > (name === "search_components" || name === "list_components" ? 32768 : 65536)) {
          result = { meta: result.meta, error: { code: "INTERNAL_ERROR", message: "The response exceeds this tool's byte budget. Select fewer items or sections.", details: { requestId: requestContext.getStore()?.requestId } } };
          output = toolResult(name, result, input);
          bytes = Buffer.byteLength(JSON.stringify(output), "utf8") + 1024;
        }
        log({ tool: name, catalogVersion: result.meta.catalogVersion, durationMs: Math.round(performance.now() - started),
          count: "data" in result && Array.isArray(result.data.items) ? result.data.items.length : undefined, errorCode: "error" in result ? result.error.code : undefined, bytes });
        return output;
      });
    }
  }, { serverInfo: { name: "zeron-ui", version: "1.0.0" }, maxSubscriptions: 0, verboseLogs: false,
    instructions: "Search the catalog, preserve catalogVersion, read candidate details, and check the local framework before requesting installation commands. Tools only read public documentation. No server-side project writes or sessions." });

  async function handleRequest(request: Request, requestId: string): Promise<Response> {
    const started = performance.now();
    const reject = (status: number, message: string, errorCode: string) => {
      log({ status, errorCode, durationMs: Math.round(performance.now() - started) });
      return response(status, message, requestId);
    };
    const origin = request.headers.get("origin");
    if (origin && !allowedOrigins.has(origin)) return reject(403, "Origin is not allowed", "ORIGIN_REJECTED");
    if (request.method === "OPTIONS") {
      log({ status: 204, durationMs: Math.round(performance.now() - started) });
      return new Response(null, { status: 204, headers: { ...(origin ? { "access-control-allow-origin": origin, vary: "Origin" } : {}),
        "access-control-allow-methods": "GET, POST, DELETE, OPTIONS", "access-control-allow-headers": "Content-Type, Accept, MCP-Protocol-Version, MCP-Method, MCP-Name", "cache-control": "no-store" } });
    }
    try {
      let bounded = request;
      if (request.method === "POST" && request.body) {
        if (Number(request.headers.get("content-length")) > 65536) return reject(413, "Request exceeds 64 KiB", "REQUEST_TOO_LARGE");
        const reader = request.body.getReader();
        const chunks: Uint8Array[] = [];
        let size = 0;
        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            size += value.byteLength;
            if (size > 65536) { await reader.cancel(); return reject(413, "Request exceeds 64 KiB", "REQUEST_TOO_LARGE"); }
            chunks.push(value);
          }
        } finally { reader.releaseLock(); }
        const bytes = new Uint8Array(size);
        let offset = 0;
        for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
        bounded = new Request(request.url, { method: request.method, headers: request.headers, body: bytes, signal: request.signal });
      }
      const result = await handler(bounded);
      const headers = new Headers(result.headers);
      headers.set("cache-control", "no-store"); headers.set("x-request-id", requestId);
      if (origin) { headers.set("access-control-allow-origin", origin); headers.set("vary", "Origin"); }
      log({ requestId, status: result.status, durationMs: Math.round(performance.now() - started) });
      return new Response(result.body, { status: result.status, headers });
    } catch {
      log({ requestId, status: 500, errorCode: "INTERNAL_ERROR", durationMs: Math.round(performance.now() - started) });
      return response(500, "MCP request failed", requestId);
    }
  }
  return (request: Request): Promise<Response> => {
    const requestId = crypto.randomUUID();
    return requestContext.run({ requestId }, () => handleRequest(request, requestId));
  };
}
