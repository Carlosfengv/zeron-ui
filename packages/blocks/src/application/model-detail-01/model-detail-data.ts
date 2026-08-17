import ClaudeColor from "@lobehub/icons/es/Claude/components/Color";
import ClaudeCodeColor from "@lobehub/icons/es/ClaudeCode/components/Color";
import CodexColor from "@lobehub/icons/es/Codex/components/Color";
import MoonshotMono from "@lobehub/icons/es/Moonshot/components/Mono";
import OpenCodeMono from "@lobehub/icons/es/OpenCode/components/Mono";
import { createElement, type ComponentType, type ReactNode } from "react";
import clineLogo from "./assets/cline.svg";

function brandLogo(Icon: ComponentType<{ size?: number }>) {
  return createElement(Icon, { size: 24 });
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

export type ModelCodeLanguage = "typescript" | "python" | "curl" | "openai";

export interface CompatibleAgent {
  id: string;
  name: string;
  logo?: ReactNode;
  href?: string;
}

export interface ModelFeature {
  title: string;
  description: string;
}

export interface ModelCodeSample {
  language: ModelCodeLanguage;
  label: string;
  code: string;
}

export interface ModelBenchmarkColumn {
  key: string;
  label: string;
  isCurrent?: boolean;
}

export interface ModelBenchmarkGroup {
  name: string;
  columns: readonly ModelBenchmarkColumn[];
  rows: readonly {
    benchmark: string;
    values: Readonly<Partial<Record<string, string | number>>>;
  }[];
}

export interface ModelDetailData {
  id: string;
  name: string;
  provider: string;
  modelId: string;
  description: string;
  logo?: ReactNode;
  tags: readonly string[];
  readme: { introduction: readonly string[]; features: readonly ModelFeature[] };
  benchmarks: readonly ModelBenchmarkGroup[];
  endpoint: { description: string; url?: string; modes: readonly string[] };
  codeSamples: readonly ModelCodeSample[];
  agents: readonly CompatibleAgent[];
}

const benchmarkColumns: readonly ModelBenchmarkColumn[] = [
  { key: "kimi-2-6", label: "Kimi K2.6" },
  { key: "kimi-2-7", label: "Kimi K2.7 Code", isCurrent: true },
  { key: "gpt-5-5", label: "GPT-5.5" },
  { key: "claude-opus-4-8", label: "Claude Opus 4.8" },
];

export const defaultModelDetail: ModelDetailData = {
  id: "kimi-k2-7-code",
  name: "Kimi-K2.7-Code",
  provider: "Moonshot AI",
  modelId: "moonshotai/Kimi-K2.7-Code",
  description:
    "面向代码任务的 agentic 模型，支持长程软件工程、图像输入、Thinking mode 与多步工具调用。",
  logo: brandLogo(MoonshotMono),
  tags: ["对话", "Tools", "视觉", "1T", "256K", "MoE", "推理模型"],
  readme: {
    introduction: [
      "Kimi K2.7 Code 是 Moonshot AI 推出的面向代码任务的 agentic 模型。它强化了真实世界长程代码任务的端到端完成能力，并降低了复杂工作流中的思考 token 使用量。",
    ],
    features: [
      { title: "Long-horizon coding", description: "覆盖多语言、服务端、基础设施和测试等真实软件工程任务。" },
      { title: "Improved token efficiency", description: "在复杂任务中降低思考 token 消耗，同时保持任务完成质量。" },
      { title: "Stronger agentic tool use", description: "支持多步工具调用和 MCP 环境中的连续推理。" },
      { title: "Native multimodal", description: "支持图像、视频输入，以及 256K 上下文窗口。" },
    ],
  },
  benchmarks: [
    {
      name: "Coding",
      columns: benchmarkColumns,
      rows: [
        { benchmark: "Kimi Code Bench v2", values: { "kimi-2-6": 50.9, "kimi-2-7": 62, "gpt-5-5": 69, "claude-opus-4-8": 67.4 } },
        { benchmark: "Program Bench", values: { "kimi-2-6": 48.3, "kimi-2-7": 53.6, "gpt-5-5": 69.1, "claude-opus-4-8": 63.8 } },
        { benchmark: "MLS Bench Lite", values: { "kimi-2-6": 26.7, "kimi-2-7": 35.1, "gpt-5-5": 35.5, "claude-opus-4-8": 42.8 } },
      ],
    },
    {
      name: "Agentic",
      columns: benchmarkColumns,
      rows: [
        { benchmark: "Kimi Claw 24/7 Bench", values: { "kimi-2-6": 42.9, "kimi-2-7": 46.9, "gpt-5-5": 52.8, "claude-opus-4-8": 50.4 } },
        { benchmark: "MCP Atlas", values: { "kimi-2-6": 69.4, "kimi-2-7": 76, "gpt-5-5": 79.4, "claude-opus-4-8": 81.3 } },
      ],
    },
  ],
  endpoint: {
    description: "为给定的聊天对话发送模型响应请求，支持流式和非流式两种模式。",
    url: "https://api.zentrix.example/v1/chat/completions",
    modes: ["OpenAI Chat Completions", "Responses"],
  },
  codeSamples: [
    { language: "typescript", label: "TypeScript SDK", code: "import OpenAI from \"openai\";\n\nconst client = new OpenAI({\n  apiKey: process.env.ZENTRIX_API_KEY,\n  baseURL: \"https://api.zentrix.example/v1\",\n});\n\nconst response = await client.chat.completions.create({\n  model: \"moonshotai/Kimi-K2.7-Code\",\n  messages: [{ role: \"user\", content: \"Help me review this pull request.\" }],\n});" },
    { language: "python", label: "Python", code: "from openai import OpenAI\n\nclient = OpenAI(\n    api_key=os.environ[\"ZENTRIX_API_KEY\"],\n    base_url=\"https://api.zentrix.example/v1\",\n)\n\nresponse = client.chat.completions.create(\n    model=\"moonshotai/Kimi-K2.7-Code\",\n    messages=[{\"role\": \"user\", \"content\": \"Hello\"}],\n)" },
    { language: "curl", label: "cURL", code: "curl https://api.zentrix.example/v1/chat/completions \\\n  -H \"Authorization: Bearer $ZENTRIX_API_KEY\" \\\n  -H \"Content-Type: application/json\" \\\n  -d '{\"model\":\"moonshotai/Kimi-K2.7-Code\",\"messages\":[{\"role\":\"user\",\"content\":\"Hello\"}]}'" },
    { language: "openai", label: "OpenAI", code: "Use the OpenAI-compatible endpoint with your Zentrix API key and the model id moonshotai/Kimi-K2.7-Code." },
  ],
  agents: [
    { id: "claude", name: "Claude", logo: agentLogo(ClaudeColor) },
    { id: "codex", name: "Codex", logo: agentLogo(CodexColor) },
    { id: "cline", name: "Cline", logo: clineLogoNode() },
    { id: "claude-code", name: "Claude Code", logo: agentLogo(ClaudeCodeColor) },
    { id: "opencode", name: "OpenCode", logo: agentLogo(OpenCodeMono) },
  ],
};
