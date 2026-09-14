/**
 * Business-accurate demo catalog derived from “网关策略能力全集”.
 * Object identifiers are explicit fixture ids; wire names, closed enums and limits
 * mirror the gateway contract instead of using product/vendor placeholders.
 */

export const callTypes = ["模型调用", "MCP 调用", "连接器调用", "A2A 调用", "HTTP 直传"] as const;

export const policySets = ["model-gateway", "mcp-gateway", "a2a-gateway", "http-proxy-gateway"] as const;

export const modelServices = [
  "model-service-prod-cn",
  "model-service-private-rnd",
  "model-service-disaster-recovery",
] as const;

export const gatewayModels = [
  "gateway-model-general-prod",
  "gateway-model-private-rnd",
  "gateway-model-long-context",
] as const;

export const capabilityIds = [
  "capability-chat-completions",
  "capability-mcp-search",
  "capability-a2a-research",
  "capability-http-document-parser",
] as const;

export const principalOptions = [
  "service · gateway-router",
  "gatewayModelKey · gmkey-prod-cn",
  "consumerGroup · production-agents",
  "platformUser · user-ops-admin",
  "agent · agent-research-prod",
  "workspace · workspace-production",
  "externalMcpClient · mcp-client-analytics",
] as const;

export const rolloutCookies = ["zenova_canary", "zenova_rollout", "zenova_variant"] as const;

export const trafficLabelDisabledReason = "只读遗留条件：存量规则能显示，新规则写入面拒绝创建";

export const guardTemplates = ["通用", "证券", "医疗", "研发安全"] as const;
export const guardActions = ["拦截", "仅记录，放行", "放行，不做处理"] as const;

export const limitPolicyOptions = [
  "生产环境模型调用限速",
  "MCP 工具调用限速",
  "A2A 能力并发保护",
  "模型服务熔断保护",
] as const;

export const limitFamilies = ["限速（GCRA）", "并发", "熔断", "非法尝试保护", "上游超时", "豁免"] as const;

export const limitConditionFields = [
  "策略集",
  "客户端 IP",
  "具体能力",
  "网关模型",
  "模型服务",
  "依赖",
  "端点",
  "路由",
  "凭据指纹",
  "会话",
  "MCP 服务器",
  "MCP 工具",
  "服务名称",
  "服务实例",
  "服务命名空间",
  "部署环境",
  "部署区域",
  "数据中心",
  "Kubernetes 集群",
  "调用类型",
] as const;

export const limitDimensions = [
  "租户",
  "服务",
  "网关 API 令牌",
  "网关模型密钥",
  "调用方分组",
  "平台用户",
  "智能体",
  "工作区",
  "外部 MCP 客户端",
  "策略集",
  "客户端 IP",
  "具体能力",
  "网关模型",
  "模型服务",
  "依赖",
  "端点",
  "路由",
  "凭据指纹",
  "会话",
  "MCP 服务器",
  "MCP 工具",
] as const;

export const simulationFacts = {
  model: "gateway-model-general-prod",
  caller: "service · gateway-router",
  credential: "gatewayModelKey · gmkey-prod-cn",
  path: "/v1/chat/completions",
  time: "2026年9月11日 17:45",
  body: "请总结本季度服务稳定性报告，并保留关键指标。",
  clientIp: "203.0.113.24",
  requestHeaders: "x-tenant-tier: enterprise\nx-trace-id: 7d3b98f2c0e14f8a",
} as const;
