import type { IconName } from "@zeron/ui/system/icon-context";

export type ResourceCatalogKind = "model" | "mcp";

export type McpBrandIcon =
  | "alibabacloud"
  | "arxiv"
  | "bing"
  | "chrome"
  | "cloudflare"
  | "docker"
  | "figma"
  | "github"
  | "google-drive"
  | "grafana"
  | "linear"
  | "notion"
  | "playwright"
  | "postgresql"
  | "redis"
  | "sentry"
  | "slack"
  | "supabase"
  | "tavily"
  | "vercel"
  | "wechat";

export interface ResourceCatalogItem {
  id: string;
  kind: ResourceCatalogKind;
  name: string;
  description: string;
  category: string;
  typeLabel: string;
  provider: string;
  modelId?: string;
  icon?: IconName;
  /** Brand mark from @thesvg/icons. Only applies to MCP catalog entries. */
  brandIcon?: McpBrandIcon;
  context?: string;
  maxOutput?: string;
  handle?: string;
  createdAt: string;
  usageCount: number;
}

export const modelCatalogItems = [
  { id: "glm-5.2", kind: "model", name: "GLM-5.2", description: "Long-context reasoning for agentic engineering, tool use, and reliable multi-step work.", category: "chat", typeLabel: "Chat", provider: "Z.ai", modelId: "glm-5.2", context: "1049k", maxOutput: "262k", createdAt: "2026-08-12", usageCount: 9820 },
  { id: "kimi-k2", kind: "model", name: "Kimi K2", description: "A coding-focused agentic model for long-horizon implementation and repository tasks.", category: "chat", typeLabel: "Chat", provider: "Moonshot AI", modelId: "kimi-k2", context: "256k", maxOutput: "16k", createdAt: "2026-08-10", usageCount: 8640 },
  { id: "deepseek-v3", kind: "model", name: "DeepSeek V3", description: "Efficient general reasoning for analysis, code generation, and multilingual support.", category: "chat", typeLabel: "Chat", provider: "DeepSeek", modelId: "deepseek-v3", context: "128k", maxOutput: "8k", createdAt: "2026-08-08", usageCount: 11420 },
  { id: "qwen-max", kind: "model", name: "Qwen Max", description: "Balanced enterprise model for Chinese and English conversations with structured output.", category: "chat", typeLabel: "Chat", provider: "Alibaba Cloud", modelId: "qwen-max", context: "128k", maxOutput: "8k", createdAt: "2026-08-06", usageCount: 7230 },
  { id: "gpt-4o", kind: "model", name: "GPT-4o", description: "Fast multimodal reasoning for interactive assistants and production workflows.", category: "chat", typeLabel: "Chat", provider: "OpenAI", modelId: "gpt-4o", context: "128k", maxOutput: "16k", createdAt: "2026-08-04", usageCount: 12060 },
  { id: "claude-3-7-sonnet", kind: "model", name: "Claude 3.7 Sonnet", description: "Careful reasoning and code review with strong instruction following for complex tasks.", category: "chat", typeLabel: "Chat", provider: "Anthropic", modelId: "claude-3-7-sonnet", context: "200k", maxOutput: "64k", createdAt: "2026-08-01", usageCount: 9080 },
  { id: "gemini-2.5-pro", kind: "model", name: "Gemini 2.5 Pro", description: "Multimodal analysis across long documents, codebases, images, and research material.", category: "chat", typeLabel: "Chat", provider: "Google", modelId: "gemini-2.5-pro", context: "1m", maxOutput: "64k", createdAt: "2026-07-30", usageCount: 6750 },
  { id: "flux-1.1-pro", kind: "model", name: "FLUX 1.1 Pro", description: "High-fidelity image generation for product concepts and visual iteration.", category: "image", typeLabel: "Image", provider: "Black Forest Labs", modelId: "flux-1.1-pro", context: "Prompt", maxOutput: "1 image", createdAt: "2026-07-28", usageCount: 4180 },
  { id: "text-embedding-3-large", kind: "model", name: "Text Embedding 3 Large", description: "Dense representations for semantic search, retrieval, clustering, and recommendations.", category: "embedding", typeLabel: "Embedding", provider: "OpenAI", modelId: "text-embedding-3-large", context: "8191", maxOutput: "3072 dims", createdAt: "2026-07-26", usageCount: 5920 },
  { id: "bge-reranker-v2", kind: "model", name: "BGE Reranker v2", description: "Cross-encoder ranking for improving precision in retrieval augmented generation.", category: "rerank", typeLabel: "Rerank", provider: "BAAI", modelId: "bge-reranker-v2", context: "512", maxOutput: "Score", createdAt: "2026-07-23", usageCount: 3370 },
  { id: "qwen-audio", kind: "model", name: "Qwen Audio", description: "Speech understanding and transcription for conversational audio workflows.", category: "speech", typeLabel: "Speech", provider: "Alibaba Cloud", modelId: "qwen-audio", context: "30 min", maxOutput: "Text", createdAt: "2026-07-20", usageCount: 2650 },
  { id: "wan-2.1", kind: "model", name: "Wan 2.1", description: "Video generation for short product explainers and storyboard-driven concepts.", category: "video", typeLabel: "Video", provider: "Alibaba Cloud", modelId: "wan-2.1", context: "Prompt", maxOutput: "5 sec", createdAt: "2026-07-18", usageCount: 1890 },
  { id: "glm-4.6", kind: "model", name: "GLM-4.6", description: "A balanced general model for Chinese language workflows, tool calls, and enterprise knowledge tasks.", category: "chat", typeLabel: "Chat", provider: "Z.ai", modelId: "glm-4.6", context: "200k", maxOutput: "16k", createdAt: "2026-07-16", usageCount: 8120 },
  { id: "kimi-thinking", kind: "model", name: "Kimi Thinking", description: "Deliberate reasoning for research, planning, and multi-step technical problem solving.", category: "chat", typeLabel: "Chat", provider: "Moonshot AI", modelId: "kimi-thinking", context: "256k", maxOutput: "32k", createdAt: "2026-07-14", usageCount: 7310 },
  { id: "deepseek-r1", kind: "model", name: "DeepSeek R1", description: "Reasoning-first inference for complex analysis, mathematics, and code-generation tasks.", category: "chat", typeLabel: "Chat", provider: "DeepSeek", modelId: "deepseek-r1", context: "128k", maxOutput: "32k", createdAt: "2026-07-12", usageCount: 10680 },
  { id: "qwen-plus", kind: "model", name: "Qwen Plus", description: "Fast conversational generation with structured responses and strong bilingual support.", category: "chat", typeLabel: "Chat", provider: "Alibaba Cloud", modelId: "qwen-plus", context: "128k", maxOutput: "8k", createdAt: "2026-07-10", usageCount: 6940 },
  { id: "gpt-4-1", kind: "model", name: "GPT-4.1", description: "Reliable coding, analysis, and long-context instruction following for production agents.", category: "chat", typeLabel: "Chat", provider: "OpenAI", modelId: "gpt-4.1", context: "1m", maxOutput: "32k", createdAt: "2026-07-08", usageCount: 10920 },
  { id: "claude-3-5-haiku", kind: "model", name: "Claude 3.5 Haiku", description: "Low-latency assistance for concise answers, classification, and high-volume automation.", category: "chat", typeLabel: "Chat", provider: "Anthropic", modelId: "claude-3-5-haiku", context: "200k", maxOutput: "8k", createdAt: "2026-07-06", usageCount: 5680 },
  { id: "gemini-2-5-flash", kind: "model", name: "Gemini 2.5 Flash", description: "Fast multimodal model for document extraction, image understanding, and everyday agent steps.", category: "chat", typeLabel: "Chat", provider: "Google", modelId: "gemini-2.5-flash", context: "1m", maxOutput: "16k", createdAt: "2026-07-04", usageCount: 6420 },
  { id: "flux-kontext-pro", kind: "model", name: "FLUX Kontext Pro", description: "Reference-aware image generation and editing for high-quality visual production.", category: "image", typeLabel: "Image", provider: "Black Forest Labs", modelId: "flux-kontext-pro", context: "Image + prompt", maxOutput: "1 image", createdAt: "2026-07-02", usageCount: 3870 },
  { id: "qwen-image", kind: "model", name: "Qwen Image", description: "Text-to-image generation for product concepts, campaign assets, and visual explorations.", category: "image", typeLabel: "Image", provider: "Alibaba Cloud", modelId: "qwen-image", context: "Prompt", maxOutput: "1 image", createdAt: "2026-06-30", usageCount: 3510 },
  { id: "text-embedding-3-small", kind: "model", name: "Text Embedding 3 Small", description: "Cost-efficient semantic vectors for retrieval, grouping, recommendations, and intent matching.", category: "embedding", typeLabel: "Embedding", provider: "OpenAI", modelId: "text-embedding-3-small", context: "8191", maxOutput: "1536 dims", createdAt: "2026-06-28", usageCount: 7140 },
  { id: "bge-m3", kind: "model", name: "BGE-M3", description: "Multilingual embeddings optimized for hybrid retrieval and enterprise knowledge bases.", category: "embedding", typeLabel: "Embedding", provider: "BAAI", modelId: "bge-m3", context: "8192", maxOutput: "1024 dims", createdAt: "2026-06-26", usageCount: 4890 },
  { id: "qwen-vl-max", kind: "model", name: "Qwen VL Max", description: "Vision-language reasoning for extracting data from screenshots, documents, and diagrams.", category: "chat", typeLabel: "Vision", provider: "Alibaba Cloud", modelId: "qwen-vl-max", context: "128k", maxOutput: "8k", createdAt: "2026-06-24", usageCount: 5340 },
  { id: "gemini-embedding-001", kind: "model", name: "Gemini Embedding 001", description: "Semantic vector generation for multimodal knowledge discovery and long-document retrieval.", category: "embedding", typeLabel: "Embedding", provider: "Google", modelId: "gemini-embedding-001", context: "2048", maxOutput: "3072 dims", createdAt: "2026-06-22", usageCount: 2950 },
  { id: "gpt-4o-mini-tts", kind: "model", name: "GPT-4o mini TTS", description: "Natural speech synthesis for interactive assistants, narrated reports, and support experiences.", category: "speech", typeLabel: "Speech", provider: "OpenAI", modelId: "gpt-4o-mini-tts", context: "4k", maxOutput: "Audio", createdAt: "2026-06-20", usageCount: 3120 },
  { id: "qwen-omni", kind: "model", name: "Qwen Omni", description: "Unified speech and text understanding for real-time conversational experiences.", category: "speech", typeLabel: "Speech", provider: "Alibaba Cloud", modelId: "qwen-omni", context: "30 min", maxOutput: "Text + audio", createdAt: "2026-06-18", usageCount: 2480 },
  { id: "wan-2-2", kind: "model", name: "Wan 2.2", description: "Storyboard-aware video generation for product demos, social clips, and creative prototypes.", category: "video", typeLabel: "Video", provider: "Alibaba Cloud", modelId: "wan-2.2", context: "Prompt", maxOutput: "10 sec", createdAt: "2026-06-16", usageCount: 2270 },
  { id: "bge-reranker-large", kind: "model", name: "BGE Reranker Large", description: "High-precision passage reranking for research assistants and retrieval-augmented answers.", category: "rerank", typeLabel: "Rerank", provider: "BAAI", modelId: "bge-reranker-large", context: "1024", maxOutput: "Score", createdAt: "2026-06-14", usageCount: 2740 },
  { id: "glm-4v-plus", kind: "model", name: "GLM-4V Plus", description: "Visual understanding for screenshots, charts, scanned documents, and UI-oriented automation.", category: "chat", typeLabel: "Vision", provider: "Z.ai", modelId: "glm-4v-plus", context: "64k", maxOutput: "8k", createdAt: "2026-06-12", usageCount: 4210 },
  { id: "claude-opus-4", kind: "model", name: "Claude Opus 4", description: "Deep analysis and expert-level coding for difficult agent workflows and sensitive reviews.", category: "chat", typeLabel: "Chat", provider: "Anthropic", modelId: "claude-opus-4", context: "200k", maxOutput: "32k", createdAt: "2026-06-10", usageCount: 7650 },
  { id: "deepseek-ocr", kind: "model", name: "DeepSeek OCR", description: "Document OCR and layout extraction for converting scans into structured knowledge.", category: "chat", typeLabel: "Vision", provider: "DeepSeek", modelId: "deepseek-ocr", context: "64k", maxOutput: "16k", createdAt: "2026-06-08", usageCount: 3390 },
] as const satisfies readonly ResourceCatalogItem[];

export const mcpCatalogItems = [
  { id: "tianyancha", kind: "mcp", name: "天眼查 MCP", description: "查询企业工商、股权、风险与融资信息，为智能体提供可信商业检索能力。", category: "search", typeLabel: "搜索工具", provider: "TianYanCha", icon: "search", handle: "@TianYanCha", createdAt: "2026-08-12", usageCount: 4210 },
  { id: "supabase", kind: "mcp", name: "Supabase MCP", description: "让 Cursor、Claude 与其他 MCP 客户端安全读取项目结构和数据库上下文。", category: "database", typeLabel: "数据查询", provider: "Supabase", icon: "file-spreadsheet", brandIcon: "supabase", handle: "@supabase-community", createdAt: "2026-08-10", usageCount: 6380 },
  { id: "bing-search", kind: "mcp", name: "必应搜索中文", description: "通过统一接口获取中文网页搜索结果和关联页面内容。", category: "search", typeLabel: "搜索工具", provider: "Bing", icon: "globe", brandIcon: "bing", handle: "@slcatwujian", createdAt: "2026-08-08", usageCount: 3080 },
  { id: "amap", kind: "mcp", name: "高德地图", description: "为 MCP 客户端提供地理编码、路线规划和地点搜索服务。", category: "life", typeLabel: "生活服务", provider: "Amap", icon: "pin", handle: "@amap", createdAt: "2026-08-06", usageCount: 2760 },
  { id: "wechat-reader", kind: "mcp", name: "微信读书", description: "在授权范围内检索书架、笔记和阅读进度，支持个人知识整理。", category: "content", typeLabel: "内容生成", provider: "WeRead", icon: "square-library", brandIcon: "wechat", handle: "@package", createdAt: "2026-08-04", usageCount: 1930 },
  { id: "variflight", kind: "mcp", name: "飞常准 Aviation", description: "查询航班动态、机场信息和天气数据，为出行 Agent 提供实时上下文。", category: "cloud", typeLabel: "云原生", provider: "VariFlight", icon: "rocket", handle: "@variflight-ai", createdAt: "2026-08-01", usageCount: 1680 },
  { id: "agentbay", kind: "mcp", name: "无影 AgentBay", description: "为 AI Agent 提供隔离的代码、终端和浏览器执行环境。", category: "developer", typeLabel: "开发者工具", provider: "Alibaba Cloud", icon: "monitor", handle: "@AgentBay", createdAt: "2026-07-30", usageCount: 5340 },
  { id: "chrome-devtools", kind: "mcp", name: "Chrome 开发者工具 MCP", description: "允许编码 Agent 检查、控制和调试浏览器中的实时页面。", category: "developer", typeLabel: "开发者工具", provider: "Chrome", icon: "doc-app-shell", brandIcon: "chrome", handle: "@ChromeDevTools", createdAt: "2026-07-28", usageCount: 4870 },
  { id: "dingtalk", kind: "mcp", name: "钉钉 MCP", description: "连接组织消息、日程和文档，让工作流自动化具备协作上下文。", category: "enterprise", typeLabel: "企业服务", provider: "DingTalk", icon: "message-circle", handle: "@open-dingtalk", createdAt: "2026-07-26", usageCount: 3520 },
  { id: "holores", kind: "mcp", name: "Hologres", description: "面向分析和实时数据查询的云原生数据仓库 MCP 服务。", category: "database", typeLabel: "数据查询", provider: "Alibaba Cloud", icon: "file-spreadsheet", handle: "@Alibaba Cloud", createdAt: "2026-07-23", usageCount: 2850 },
  { id: "cloudops", kind: "mcp", name: "阿里云 CloudOps", description: "连接云资源管理与运维信息，帮助 Agent 处理日常工程任务。", category: "cloud", typeLabel: "云原生", provider: "Alibaba Cloud", icon: "settings", brandIcon: "alibabacloud", handle: "@Alibaba Cloud", createdAt: "2026-07-20", usageCount: 2240 },
  { id: "data-v", kind: "mcp", name: "DataV Atlas 地理可视化", description: "检索地图图层、空间数据与可视化配置，支持数据故事构建。", category: "content", typeLabel: "内容生成", provider: "Alibaba Cloud", icon: "palette", handle: "@Alibaba Cloud", createdAt: "2026-07-18", usageCount: 1560 },
  { id: "github", kind: "mcp", name: "GitHub MCP", description: "读取仓库、Issue、Pull Request 与代码变更，为编码 Agent 提供项目上下文。", category: "developer", typeLabel: "开发者工具", provider: "GitHub", icon: "doc-app-shell", brandIcon: "github", handle: "@github", createdAt: "2026-07-16", usageCount: 7920 },
  { id: "notion", kind: "mcp", name: "Notion MCP", description: "搜索团队文档、知识库与项目页面，将内容连接到智能工作流。", category: "content", typeLabel: "内容生成", provider: "Notion", icon: "square-library", brandIcon: "notion", handle: "@notion", createdAt: "2026-07-14", usageCount: 6140 },
  { id: "postgres", kind: "mcp", name: "PostgreSQL MCP", description: "在授权范围内检查数据库结构、执行只读分析并生成查询建议。", category: "database", typeLabel: "数据查询", provider: "PostgreSQL", icon: "file-spreadsheet", brandIcon: "postgresql", handle: "@postgres", createdAt: "2026-07-12", usageCount: 5810 },
  { id: "redis", kind: "mcp", name: "Redis MCP", description: "连接缓存与队列运行状态，辅助排查应用性能和异步任务问题。", category: "database", typeLabel: "数据查询", provider: "Redis", icon: "file-spreadsheet", brandIcon: "redis", handle: "@redis", createdAt: "2026-07-10", usageCount: 3260 },
  { id: "figma", kind: "mcp", name: "Figma MCP", description: "读取设计节点、变量和组件信息，帮助产品与前端协作还原界面。", category: "developer", typeLabel: "开发者工具", provider: "Figma", icon: "palette", brandIcon: "figma", handle: "@figma", createdAt: "2026-07-08", usageCount: 7050 },
  { id: "slack", kind: "mcp", name: "Slack MCP", description: "检索频道讨论、共享文件和决策记录，为团队问答补充协作语境。", category: "enterprise", typeLabel: "企业服务", provider: "Slack", icon: "message-circle", brandIcon: "slack", handle: "@slack", createdAt: "2026-07-06", usageCount: 4890 },
  { id: "linear", kind: "mcp", name: "Linear MCP", description: "创建和检索研发事项、项目计划与状态更新，衔接工程执行流程。", category: "enterprise", typeLabel: "企业服务", provider: "Linear", icon: "message-circle", brandIcon: "linear", handle: "@linear", createdAt: "2026-07-04", usageCount: 4120 },
  { id: "sentry", kind: "mcp", name: "Sentry MCP", description: "聚合错误事件、性能问题和版本影响范围，支持智能故障定位。", category: "developer", typeLabel: "开发者工具", provider: "Sentry", icon: "monitor", brandIcon: "sentry", handle: "@sentry", createdAt: "2026-07-02", usageCount: 3560 },
  { id: "cloudflare", kind: "mcp", name: "Cloudflare MCP", description: "查询域名、边缘配置与运行日志，辅助完成安全和网络运维任务。", category: "cloud", typeLabel: "云原生", provider: "Cloudflare", icon: "settings", brandIcon: "cloudflare", handle: "@cloudflare", createdAt: "2026-06-30", usageCount: 3010 },
  { id: "vercel", kind: "mcp", name: "Vercel MCP", description: "访问部署、构建日志和项目配置，帮助 Agent 定位发布问题。", category: "cloud", typeLabel: "云原生", provider: "Vercel", icon: "rocket", brandIcon: "vercel", handle: "@vercel", createdAt: "2026-06-28", usageCount: 2780 },
  { id: "google-drive", kind: "mcp", name: "Google Drive MCP", description: "检索受权限控制的团队文件、会议资料和项目附件。", category: "content", typeLabel: "内容生成", provider: "Google", icon: "square-library", brandIcon: "google-drive", handle: "@google-drive", createdAt: "2026-06-26", usageCount: 4670 },
  { id: "calendar", kind: "mcp", name: "日历 MCP", description: "读取日程空闲时间、创建协作会议并协调跨团队安排。", category: "life", typeLabel: "生活服务", provider: "Calendar", icon: "pin", handle: "@calendar", createdAt: "2026-06-24", usageCount: 2380 },
  { id: "weather", kind: "mcp", name: "天气服务 MCP", description: "提供城市天气预报、降水提醒与出行相关的实时环境信息。", category: "life", typeLabel: "生活服务", provider: "Weather", icon: "globe", handle: "@weather", createdAt: "2026-06-22", usageCount: 1910 },
  { id: "arxiv", kind: "mcp", name: "arXiv Research MCP", description: "搜索研究论文、摘要与引用线索，加速技术调研和知识发现。", category: "search", typeLabel: "搜索工具", provider: "arXiv", icon: "search", brandIcon: "arxiv", handle: "@arxiv", createdAt: "2026-06-20", usageCount: 3840 },
  { id: "tavily", kind: "mcp", name: "Tavily Search MCP", description: "为研究型 Agent 提供经过整理的网页搜索、摘要和来源引用。", category: "search", typeLabel: "搜索工具", provider: "Tavily", icon: "search", brandIcon: "tavily", handle: "@tavily", createdAt: "2026-06-18", usageCount: 4620 },
  { id: "playwright", kind: "mcp", name: "Playwright MCP", description: "自动化浏览器测试、表单交互和页面验证，适合端到端开发流程。", category: "developer", typeLabel: "开发者工具", provider: "Playwright", icon: "doc-app-shell", brandIcon: "playwright", handle: "@playwright", createdAt: "2026-06-16", usageCount: 5270 },
  { id: "docker", kind: "mcp", name: "Docker MCP", description: "检查镜像、容器和本地服务状态，为开发环境排障提供执行上下文。", category: "developer", typeLabel: "开发者工具", provider: "Docker", icon: "monitor", brandIcon: "docker", handle: "@docker", createdAt: "2026-06-14", usageCount: 3430 },
  { id: "grafana", kind: "mcp", name: "Grafana MCP", description: "访问监控面板、指标趋势和告警信息，支持生产环境的可观测性分析。", category: "cloud", typeLabel: "云原生", provider: "Grafana", icon: "settings", brandIcon: "grafana", handle: "@grafana", createdAt: "2026-06-12", usageCount: 2890 },
  { id: "feishu", kind: "mcp", name: "飞书 MCP", description: "连接消息、云文档和多维表格，为组织协同提供统一的智能入口。", category: "enterprise", typeLabel: "企业服务", provider: "Feishu", icon: "message-circle", handle: "@feishu", createdAt: "2026-06-10", usageCount: 4380 },
  { id: "filesystem", kind: "mcp", name: "Filesystem MCP", description: "在限定工作区内浏览、读取和组织文件，帮助 Agent 完成资料处理任务。", category: "content", typeLabel: "内容生成", provider: "Filesystem", icon: "square-library", handle: "@filesystem", createdAt: "2026-06-08", usageCount: 4010 },
] as const satisfies readonly ResourceCatalogItem[];

export const catalogLabels = {
  model: { title: "模型广场", search: "搜索模型", all: "全部", newest: "最新上架", mostUsed: "最多使用", empty: "没有找到匹配的模型" },
  mcp: { title: "MCP 广场", search: "搜索 MCP", all: "全部", newest: "最新上架", mostUsed: "最多使用", empty: "没有找到匹配的 MCP 服务" },
} as const;

export const categoryLabels: Record<string, string> = {
  chat: "对话",
  image: "生图",
  embedding: "嵌入",
  rerank: "重排序",
  speech: "语音",
  video: "视频",
  cloud: "云原生",
  developer: "开发者工具",
  search: "搜索工具",
  database: "数据查询",
  content: "内容生成",
  enterprise: "企业服务",
  life: "生活服务",
};
