export type ResourceDetailPageSection =
  | "overview"
  | "tools"
  | "scope"
  | "usage"
  | "audit";

export interface ResourceProtectionSettings {
  rateLimitEnabled: boolean;
  circuitBreakerEnabled: boolean;
  requestsPerMinute: number;
  timeoutSeconds: number;
  concurrency: number;
  overflowPolicy: string;
  scope: string;
}

export interface ResourceDetailPageData {
  id: string;
  name: string;
  description: string;
  status: string;
  recordIndex: number;
  recordTotal: number;
  toolCount: number;
  callCount: number;
  source: string;
  version: string;
  categories: readonly string[];
  categoryOptions: readonly string[];
  published: boolean;
  authentication: {
    endpoint: string;
    transport: string;
    credentialStatus: string;
  };
  security: {
    level: string;
    levelOptions: readonly string[];
    description: string;
  };
  protection: ResourceProtectionSettings;
  markdown: string;
}

export interface ResourceDetailPageLabels {
  aside: string;
  authentication: string;
  basicProperties: string;
  categories: string;
  categoryAction: string;
  circuitBreaker: string;
  circuitBreakerAction: string;
  closeAction: string;
  concurrency: string;
  credentialStatus: string;
  editAction: string;
  endpoint: string;
  emptySectionDescription: string;
  navigationLabel: string;
  nextAction: string;
  overflowPolicy: string;
  previousAction: string;
  protection: string;
  publishAction: string;
  publishStatus: string;
  rateLimit: string;
  rateLimitAction: string;
  recordUnit: string;
  requestsPerMinute: string;
  rootPath: string;
  scope: string;
  securityLevel: string;
  source: string;
  tabs: string;
  timeout: string;
  transport: string;
  unpublishedStatus: string;
  version: string;
  sections: Record<ResourceDetailPageSection, string>;
}

export type ResourceDetailPageLabelOverrides = Partial<
  Omit<ResourceDetailPageLabels, "sections">
> & {
  sections?: Partial<Record<ResourceDetailPageSection, string>>;
};

export type ResourceDetailPageChange =
  | { type: "categories"; value: readonly string[] }
  | { type: "protection"; value: ResourceProtectionSettings }
  | { type: "published"; value: boolean }
  | { type: "security-level"; value: string };

export const defaultResourceDetailPageLabels: ResourceDetailPageLabels = {
  aside: "MCP 服务属性",
  authentication: "认证配置",
  basicProperties: "基本属性",
  categories: "分类",
  categoryAction: "编辑 MCP 分类",
  circuitBreaker: "熔断",
  circuitBreakerAction: "启用熔断",
  closeAction: "关闭详情",
  concurrency: "并发数",
  credentialStatus: "凭证状态",
  editAction: "编辑 MCP",
  endpoint: "服务地址",
  emptySectionDescription: "通过 sectionContent 注入该区域的业务内容。",
  navigationLabel: "MCP 服务路径",
  nextAction: "下一个 MCP 服务",
  overflowPolicy: "溢出策略",
  previousAction: "上一个 MCP 服务",
  protection: "防护策略",
  publishAction: "发布 MCP 服务",
  publishStatus: "发布状态",
  rateLimit: "限流",
  rateLimitAction: "启用限流",
  recordUnit: "个 MCP 服务",
  requestsPerMinute: "每分钟请求",
  rootPath: "MCP 服务",
  scope: "生效范围",
  securityLevel: "安全级别",
  source: "来源",
  tabs: "MCP 服务详情",
  timeout: "超时",
  transport: "传输协议",
  unpublishedStatus: "未发布",
  version: "版本",
  sections: {
    overview: "基本信息",
    tools: "工具",
    scope: "可用范围",
    usage: "调用情况",
    audit: "操作审计",
  },
};

export const defaultResourceDetailPageData: ResourceDetailPageData = {
  id: "feishu-suite",
  name: "飞书套件",
  description: "飞书集成套件，支持消息、文档、日历等功能",
  status: "已发布",
  recordIndex: 12,
  recordTotal: 32,
  toolCount: 5,
  callCount: 32,
  source: "Marketplace",
  version: "v1.0",
  categories: ["沟通", "协作"],
  categoryOptions: ["沟通", "协作", "效率", "知识库"],
  published: true,
  authentication: {
    endpoint: "https://mcp.example.com/feishu",
    transport: "streamable_http",
    credentialStatus: "已配置",
  },
  security: {
    level: "强安全级别",
    levelOptions: ["强安全级别", "标准安全级别", "基础安全级别"],
    description:
      "工具只能执行只读操作。请求会经过鉴权、审计与内容安全检查。",
  },
  protection: {
    rateLimitEnabled: true,
    circuitBreakerEnabled: true,
    requestsPerMinute: 100,
    timeoutSeconds: 30,
    concurrency: 10,
    overflowPolicy: "排队",
    scope: "所有工具",
  },
  markdown: `## 飞书套件 MCP 服务

飞书套件 MCP 服务将消息、文档、日历等协作能力统一封装为可被智能体调用的工具。

### 主要能力

- 查询与发送飞书消息
- 读取与创建云文档
- 查询日历与日程信息
- 在统一安全策略下完成鉴权、限流与审计

### 接入说明

调用方需要先配置飞书应用凭证。服务通过 \`streamable_http\` 传输协议提供能力，并为每一次工具调用保留审计记录。

> 发布状态、可用范围和防护策略可在左侧属性区域直接调整。
`,
};
