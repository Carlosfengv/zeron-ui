import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = new URL("..", import.meta.url).pathname;
const source = readFileSync(join(ROOT, "packages/blocks/src/application/mcp-detail-01/mcp-detail.tsx"), "utf8");
const data = readFileSync(join(ROOT, "packages/blocks/src/application/mcp-detail-01/mcp-detail-data.ts"), "utf8");
const registry = readFileSync(join(ROOT, "packages/blocks/registry.json"), "utf8");

describe("MCP detail block contract", () => {
  it("keeps the mobile Aside-first DOM order while using PageColumns", () => {
    expect(source).toContain('<PageColumns asideWidth="407px" columnsAt="xl" className="mt-5 gap-5">');
    expect(source.indexOf("<PageAside")).toBeLessThan(source.indexOf("<PagePrimary>"));
  });

  it("invalidates sensitive connection results after option changes and expiry", () => {
    expect(source).toContain("requestRevision.current += 1;");
    expect(source).toContain('setConnectionResult(null);');
    expect(source).toContain('setConnectionStatus("expired")');
    expect(source).toContain('disabled={connectionStatus === "loading"}');
    expect(source).toContain("window.setTimeout");
  });

  it("provides safe mock behavior and validates JSON object tool input", () => {
    expect(source).toContain("example.invalid/mcp/supabase-mcp");
    expect(source).toContain("Array.isArray(parsed)");
    expect(source).toContain("参数必须是 JSON Object");
    expect(data).toContain("export interface McpConnectionResult");
    expect(registry).toContain('"name": "mcp-detail-01"');
    expect(source).toContain('import supabaseMcpCursor from "./assets/supabase-mcp-cursor.png"');
    expect(existsSync(join(ROOT, "packages/blocks/src/application/mcp-detail-01/assets/supabase-mcp-cursor.png"))).toBe(true);
    expect(registry).toContain('"path": "packages/blocks/src/application/mcp-detail-01/assets/supabase-mcp-cursor.png"');
  });

  it("labels mock results and protects asynchronous state when the page is hidden or unmounted", () => {
    expect(source).toContain("示例连接信息，仅用于文档预览。");
    expect(source).toContain("示例结果，未执行真实工具调用。");
    expect(source).toContain('document.addEventListener("visibilitychange", recheckExpiry)');
    expect(source).toContain("requestRevision.current += 1;");
    expect(source).toContain("toolRevision.current += 1;");
  });

  it("matches the Figma Agent icon rail and exposes names through tooltips", () => {
    expect(data).toContain('from "@thesvg/icons/supabase"');
    expect(data).toContain("ClaudeColor");
    expect(data).toContain("CodexColor");
    expect(data).toContain('import clineLogo from "./assets/cline.svg"');
    expect(data).toContain("ClaudeCodeColor");
    expect(data).toContain("OpenCodeMono");
    expect(source).toContain("agent.logo &&");
    expect(source).toContain('from "@zeron/ui/tooltip"');
    expect(source).toContain("content={agent.name}");
    expect(source).toContain("size=\"xl\" iconOnly");
    expect(source).toContain("gap-3 p-1");
    expect(source).toContain("size-10 !p-1 border border-border bg-transparent leading-none");
    expect(source).toContain("items-center justify-center align-middle leading-none");
    expect(registry).toContain('"tooltip"');
    expect(registry).toContain('"dependencies": ["tw-animate-css", "@lobehub/icons", "@thesvg/icons"]');
  });
});
