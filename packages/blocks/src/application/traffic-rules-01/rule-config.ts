export type RuleFormValue = {
  id: string;
  priority: number;
  name: string;
  matcher: string;
  enabled: boolean;
  conditions: string[];
  actions: string[];
  workflow?: RuleWorkflowDraft;
};

export const ruleSkipExplanation = "跳过本规则，按优先级继续检查「规则清单」中的下一条规则";

export type ConditionGroupId = "request" | "identity" | "model";
export type ConditionKind =
  | "path"
  | "header"
  | "query"
  | "period"
  | "caller"
  | "cookie"
  | "cidr"
  | "declared-model"
  | "model-service"
  | "gateway-model"
  | "data-source"
  | "traffic-label"
  | "call-type"
  | "capability";

export type ConditionItem = {
  id: string;
  kind: ConditionKind;
  operator: string;
  primary: string;
  secondary?: string;
};

export type ActionPhase = "before" | "after";
export type ActionItem = {
  id: string;
  type: string;
  phase: ActionPhase;
  primary?: string;
  secondary?: string;
};

export type ConditionDefinition = {
  kind: ConditionKind;
  label: string;
  description: string;
  group: ConditionGroupId;
  operators: string[];
  primaryLabel: string;
  primaryPlaceholder: string;
  primaryOptions?: string[];
  secondaryLabel?: string;
  secondaryPlaceholder?: string;
  secondaryOptions?: string[];
};

export type Definition = ConditionDefinition;

export const conditionGroups: Array<{
  id: ConditionGroupId;
  label: string;
  description: string;
  icon: "globe" | "users" | "brain";
}> = [
  {
    id: "request",
    label: "请求基础",
    description: "路径、参数、请求头与时间窗口",
    icon: "globe",
  },
  {
    id: "identity",
    label: "身份与来源",
    description: "调用方、主体与客户端网络特征",
    icon: "users",
  },
  {
    id: "model",
    label: "模型与能力",
    description: "模型选择、服务与调用能力",
    icon: "brain",
  },
];

export const conditionDefinitions: ConditionDefinition[] = [
  {
    kind: "path",
    label: "请求路径",
    description: "所有调用面稳定存在；非正则值必须以 / 开头",
    group: "request",
    operators: ["等于", "前缀", "正则"],
    primaryLabel: "路径表达式",
    primaryPlaceholder: "例如 /v1/chat/completions",
  },
  {
    kind: "header",
    label: "请求头",
    description: "头名不区分大小写，仅支持小写 a-z、数字和连字符",
    group: "request",
    operators: ["等于", "前缀", "正则"],
    primaryLabel: "Header 名称",
    primaryPlaceholder: "例如 x-tenant-tier",
    secondaryLabel: "比较值",
    secondaryPlaceholder: "例如 enterprise",
  },
  {
    kind: "query",
    label: "URL 参数",
    description: "参数名区分大小写；MCP、连接器与 A2A 不可用",
    group: "request",
    operators: ["等于", "前缀", "正则"],
    primaryLabel: "参数名称",
    primaryPlaceholder: "例如 region",
    secondaryLabel: "比较值",
    secondaryPlaceholder: "例如 cn",
  },
  {
    kind: "period",
    label: "时段",
    description: "IANA 时区与多个 HH:MM–HH:MM 窗口，可跨零点",
    group: "request",
    operators: ["位于"],
    primaryLabel: "时间窗口",
    primaryPlaceholder: "例如 09:00–18:00",
    secondaryLabel: "时区",
    secondaryPlaceholder: "请选择时区",
    secondaryOptions: ["Asia/Shanghai", "UTC", "America/Los_Angeles"],
  },
  {
    kind: "caller",
    label: "调用方",
    description: "按主体类型与稳定对象 ID 精确匹配",
    group: "identity",
    operators: ["等于"],
    primaryLabel: "主体",
    primaryPlaceholder: "请选择主体类型与对象",
    primaryOptions: [...principalOptions],
  },
  {
    kind: "cookie",
    label: "灰度 Cookie",
    description: "仅支持三个固定 Cookie；值保存为 HMAC 摘要且不回显",
    group: "identity",
    operators: ["等于"],
    primaryLabel: "Cookie 名称",
    primaryPlaceholder: "请选择灰度 Cookie",
    primaryOptions: [...rolloutCookies],
    secondaryLabel: "比较值",
    secondaryPlaceholder: "例如 enabled",
  },
  {
    kind: "cidr",
    label: "客户端 CIDR",
    description: "1–32 个 IPv4 / IPv6 网段；地址缺失时不命中",
    group: "identity",
    operators: ["包含"],
    primaryLabel: "CIDR 网段",
    primaryPlaceholder: "例如 10.0.0.0/8",
  },
  {
    kind: "declared-model",
    label: "客户端声明的模型名",
    description: "大小写不敏感，不允许填写 UUID",
    group: "model",
    operators: ["等于", "前缀", "正则"],
    primaryLabel: "模型名称",
    primaryPlaceholder: "例如 gpt-4.1",
  },
  {
    kind: "model-service",
    label: "模型服务",
    description: "受信身份，只认相等；原生模型网关不产出",
    group: "model",
    operators: ["等于"],
    primaryLabel: "模型服务",
    primaryPlaceholder: "请选择模型服务",
    primaryOptions: [...modelServices],
  },
  {
    kind: "gateway-model",
    label: "解析后的网关模型",
    description: "仅在目标选定后存在，只能用于拒绝、改写或打标",
    group: "model",
    operators: ["等于"],
    primaryLabel: "网关模型",
    primaryPlaceholder: "请选择网关模型",
    primaryOptions: [...gatewayModels],
  },
  {
    kind: "data-source",
    label: "数据来源",
    description: "可信通道识别的数据类型，目前只有 MCP",
    group: "identity",
    operators: ["包含"],
    primaryLabel: "数据来源",
    primaryPlaceholder: "请选择数据来源",
    primaryOptions: ["mcp"],
  },
  {
    kind: "traffic-label",
    label: "流量标签",
    description: trafficLabelDisabledReason,
    group: "identity",
    operators: ["等于", "属于", "不等于"],
    primaryLabel: "标签键",
    primaryPlaceholder: "例如 environment",
    secondaryLabel: "标签值",
    secondaryPlaceholder: "例如 production",
  },
  {
    kind: "call-type",
    label: "调用类型",
    description: "五个封闭调用类型；多个条件取交集",
    group: "model",
    operators: ["等于"],
    primaryLabel: "调用类型",
    primaryPlaceholder: "请选择调用类型",
    primaryOptions: [...callTypes],
  },
  {
    kind: "capability",
    label: "具体能力",
    description: "能力或模型服务的稳定 ID；最多 32 个",
    group: "model",
    operators: ["等于"],
    primaryLabel: "能力 ID",
    primaryPlaceholder: "请选择能力",
    primaryOptions: [...capabilityIds],
  },
];

export const definitionMap = new Map(
  conditionDefinitions.map((definition) => [definition.kind, definition]),
);

export const actionTypes = [
  "拒绝本次调用",
  "转发到",
  "内容检测（护栏）",
  "应用限额",
  "改写请求头",
  "改写请求字段",
  "改写请求正文",
  "改写失败时",
  "挂载插件",
  "改写响应头",
  "状态码映射",
  "改写响应字段",
  "上游失败判定",
  "镜像复制",
  "跳过意图识别",
  "失败姿态",
];

export const afterActionTypes = new Set([
  "改写响应头",
  "状态码映射",
  "改写响应字段",
  "上游失败判定",
]);

export const defaultConditions: ConditionItem[] = [
  {
    id: "demo-path",
    kind: "path",
    operator: "前缀",
    primary: "/v1/chat/",
  },
  {
    id: "demo-header",
    kind: "header",
    operator: "等于",
    primary: "x-tenant-tier",
    secondary: "production",
  },
  {
    id: "demo-query",
    kind: "query",
    operator: "等于",
    primary: "region",
    secondary: "cn-east-1",
  },
  {
    id: "demo-caller",
    kind: "caller",
    operator: "等于",
    primary: "service · gateway-router",
  },
  {
    id: "demo-period",
    kind: "period",
    operator: "位于",
    primary: "09:00–18:00",
    secondary: "Asia/Shanghai",
  },
  {
    id: "demo-service",
    kind: "model-service",
    operator: "等于",
    primary: "model-service-prod-cn",
  },
  {
    id: "demo-capability",
    kind: "capability",
    operator: "等于",
    primary: "capability-chat-completions",
  },
];

export const defaultActions: ActionItem[] = [
  {
    id: "demo-forward",
    type: "转发到",
    phase: "before",
    primary: "gateway-model-general-prod",
    secondary: "weightedHash",
  },
  {
    id: "demo-safety",
    type: "内容检测（护栏）",
    phase: "before",
    primary: "通用",
    secondary: "拦截",
  },
  {
    id: "demo-limit",
    type: "应用限额",
    phase: "before",
    primary: "生产环境模型调用限速",
    secondary: "拒绝（429）",
  },
  {
    id: "demo-response-header",
    type: "改写响应头",
    phase: "after",
    primary: "x-ztx-route",
    secondary: "model-gateway",
  },
];

export function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createCondition(kind: ConditionKind): ConditionItem {
  const definition = definitionMap.get(kind)!;
  return {
    id: newId("condition"),
    kind,
    operator: definition.operators[0]!,
    primary: "",
    secondary: definition.secondaryLabel ? "" : undefined,
  };
}

export function hydrateConditions(initial?: RuleFormValue): ConditionItem[] {
  if (initial?.workflow) return initial.workflow.conditions.map((condition) => ({ ...condition }));
  if (!initial) return defaultConditions.map((condition) => ({ ...condition }));

  const items: ConditionItem[] = [];
  if (initial.matcher && initial.matcher !== "全部请求") {
    items.push({
      id: `${initial.id}-path`,
      kind: "path",
      operator: "前缀",
      primary: initial.matcher,
    });
  }

  initial.conditions.forEach((condition, index) => {
    const definition = conditionDefinitions.find((item) => condition.startsWith(item.label));
    const normalized = definition
      ? condition.slice(definition.label.length).replace(/^\s*[·：]?\s*/, "")
      : condition;
    const kind = definition?.kind ?? "header";
    const operators = "等于|不等于|包含|不属于|属于|位于|前缀|正则";
    const between = normalized.match(new RegExp(`^(.+?)\\s+(${operators})\\s*(.*)$`));
    const leading = normalized.match(new RegExp(`^(${operators})\\s+(.+)$`));
    const period = kind === "period" ? normalized.match(/^(位于)\s+(.+?)\s*·\s*(.+)$/) : null;
    items.push({
      id: `${initial.id}-condition-${index}`,
      kind,
      operator: period?.[1] ?? between?.[2] ?? leading?.[1] ?? definition?.operators[0] ?? "等于",
      primary: period?.[2] ?? between?.[1] ?? leading?.[2] ?? normalized,
      secondary: period?.[3] ?? between?.[3],
    });
  });

  return items.length ? items : [{ id: `${initial.id}-path`, kind: "path", operator: "前缀", primary: "/" }];
}

export function hydrateActions(initial?: RuleFormValue): ActionItem[] {
  if (initial?.workflow) return initial.workflow.actions.map((action) => ({ ...action }));
  if (!initial) return defaultActions.map((action) => ({ ...action }));
  return initial.actions.map((legacyType, index) => {
    const type = legacyType === "拒绝这个请求" ? "拒绝本次调用" : legacyType;
    return { id: `${initial.id}-action-${index}`, type, phase: afterActionTypes.has(type) ? "after" : "before" };
  });
}

export function conditionComplete(condition: ConditionItem) {
  const definition = definitionMap.get(condition.kind);
  if (!definition || !definition.operators.includes(condition.operator)) return false;
  if (!condition.primary.trim()) return false;
  return !definition.secondaryLabel || condition.operator === "存在" || Boolean(condition.secondary?.trim());
}

export function conditionSummary(condition: ConditionItem) {
  const definition = definitionMap.get(condition.kind)!;
  if (!conditionComplete(condition)) return "尚未完成配置";
  if (condition.kind === "period") {
    return `${condition.operator} ${condition.primary} · ${condition.secondary}`;
  }
  if (definition.secondaryLabel && condition.operator !== "存在") {
    return `${condition.primary} ${condition.operator} ${condition.secondary}`;
  }
  return `${condition.operator} ${condition.primary}`;
}

export type RuleWorkflowDraft = {
  name: string;
  logic: "and" | "or";
  conditions: ConditionItem[];
  actions: ActionItem[];
  fallback: "allow" | "reject";
};
import {
  callTypes,
  capabilityIds,
  gatewayModels,
  modelServices,
  principalOptions,
  rolloutCookies,
  trafficLabelDisabledReason,
} from "./gateway-policy-data";
