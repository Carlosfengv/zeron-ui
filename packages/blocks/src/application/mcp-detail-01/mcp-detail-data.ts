import ClaudeColor from "@lobehub/icons/es/Claude/components/Color";
import ClaudeCodeColor from "@lobehub/icons/es/ClaudeCode/components/Color";
import CodexColor from "@lobehub/icons/es/Codex/components/Color";
import OpenCodeMono from "@lobehub/icons/es/OpenCode/components/Mono";
import supabase from "@thesvg/icons/supabase";
import { createElement, type ComponentType, type ReactNode } from "react";
import clineLogo from "./assets/cline.svg";

function brandLogo(svg: string) {
  return createElement("span", {
    "aria-hidden": true,
    className: "[&>svg]:block [&>svg]:size-6",
    dangerouslySetInnerHTML: { __html: svg },
  });
}

function agentLogo(Icon: ComponentType<{ size: number }>) {
  return createElement(Icon, { size: 32 });
}

function assetSource(asset: string | { src: string }) {
  return typeof asset === "string" ? asset : asset.src;
}

function clineLogoNode() {
  return createElement(
    "span",
    { "aria-hidden": true, className: "relative block size-8 overflow-hidden" },
    createElement("img", {
      alt: "",
      className: "absolute left-0 top-0 max-w-none",
      height: 38.8511,
      src: assetSource(clineLogo),
      width: 39.7098,
    })
  );
}

export interface DetailSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface CompatibleAgent {
  id: string;
  name: string;
  logo?: ReactNode;
  href?: string;
}

export interface McpToolDefinition {
  name: string;
  description?: string;
  defaultInput?: Record<string, unknown>;
}

export interface McpConnectionOptions {
  transport: string;
  authMethod: string;
  expiration: string;
}

export interface McpConnectionResult {
  streamableHttpUrl?: string;
  jsonConfig?: string;
  expiresAt?: string;
}

export interface McpDetailData {
  id: string;
  name: string;
  description: string;
  category: string;
  provider: string;
  developer: string;
  license?: string;
  registryStatus?: string;
  logo?: ReactNode;
  overview: {
    title: string;
    lead: string;
    paragraphs: readonly string[];
    image?: { src: string; alt: string };
    setupSteps: readonly { title: string; description: string; href?: string }[];
  };
  connectionOptions: {
    transports: readonly DetailSelectOption[];
    authMethods: readonly DetailSelectOption[];
    expirations: readonly DetailSelectOption[];
  };
  tools: readonly McpToolDefinition[];
  agents: readonly CompatibleAgent[];
}

export const defaultMcpDetail: McpDetailData = {
  id: "supabase-mcp",
  name: "supabase-mcp",
  description:
    "Connect your Supabase projects to Cursor, Claude, Windsurf, and other AI assistants through MCP.",
  category: "开发者工具",
  provider: "Supabase",
  developer: "supabase-community",
  license: "Apache License 2.0",
  registryStatus: "MCP Registry · 可访问",
  logo: brandLogo(supabase.svg),
  overview: {
    title: "Supabase MCP 服务器",
    lead: "将您的 Supabase 项目连接到 Cursor、Claude、Windsurf 和其他 AI 助手。",
    paragraphs: [
      "模型上下文协议（MCP）标准化了大型语言模型与外部服务之间的通信方式。连接后，AI 助手可以在经过授权的范围内查询配置、检查数据库结构和执行工具调用。",
      "连接信息包含当前用户和组织权限。请仅在受信任的 Agent 中使用，并在不再需要时重新生成短期配置。",
    ],
    setupSteps: [
      { title: "阅读安全最佳实践", description: "了解 MCP 连接可以访问的数据范围和最小权限配置。" },
      { title: "配置 MCP 客户端", description: "选择传输方式和鉴权方式，生成连接 URL 或 JSON Config。" },
    ],
  },
  connectionOptions: {
    transports: [
      { value: "streamable-http", label: "Streamable HTTP" },
      { value: "stdio", label: "stdio" },
    ],
    authMethods: [
      { value: "none", label: "无鉴权" },
      { value: "oauth", label: "OAuth" },
    ],
    expirations: [
      { value: "48h", label: "48 小时" },
      { value: "24h", label: "24 小时" },
      { value: "7d", label: "7 天" },
    ],
  },
  tools: [
    { name: "list_tables", description: "列出项目中可访问的数据表。", defaultInput: { schema: "public" } },
    { name: "get_project_url", description: "读取当前项目的公开 URL。", defaultInput: {} },
  ],
  agents: [
    { id: "claude", name: "Claude", logo: agentLogo(ClaudeColor) },
    { id: "codex", name: "Codex", logo: agentLogo(CodexColor) },
    { id: "cline", name: "Cline", logo: clineLogoNode() },
    { id: "claude-code", name: "Claude Code", logo: agentLogo(ClaudeCodeColor) },
    { id: "opencode", name: "OpenCode", logo: agentLogo(OpenCodeMono) },
  ],
};
