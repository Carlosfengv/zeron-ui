import type {
  FilterRuleClause,
  FilterRuleDraft,
  FilterRuleField,
  FilterRulePreset,
} from "./filter-rule-builder-types";

const isOperator = [{ value: "is", label: "is" }] as const;

export const filterRuleBuilderDemoFields: readonly FilterRuleField[] = [
  {
    id: "channel",
    label: "Channel",
    group: "Conversation",
    type: "multiSelect",
    color: "cyan",
    operators: [{ value: "isAnyOf", label: "is any of" }],
    defaultOperator: "isAnyOf",
    searchable: true,
    options: [
      { value: "messenger", label: "Messenger" },
      { value: "whatsapp", label: "WhatsApp" },
      { value: "email", label: "Email" },
      { value: "web", label: "Web chat" },
    ],
  },
  {
    id: "resolution-status",
    label: "Resolution Status",
    group: "Fin AI & automation",
    type: "select",
    color: "green",
    operators: isOperator,
    defaultOperator: "is",
    options: [
      { value: "autonomous", label: "Autonomous (Fin AI)" },
      { value: "assisted", label: "Agent assisted" },
      { value: "human", label: "Human resolved" },
    ],
  },
  {
    id: "response-sla",
    label: "Response SLA",
    group: "Conversation",
    type: "number",
    color: "purple",
    unit: "m",
    min: 0,
    operators: [
      { value: "lessThan", label: "less than" },
      { value: "greaterThanOrEqual", label: ">= (at least)" },
    ],
    defaultOperator: "lessThan",
  },
  {
    id: "customer-tier",
    label: "Customer Tier",
    group: "Conversation",
    type: "multiSelect",
    color: "yellow",
    operators: [{ value: "isAnyOf", label: "is any of" }],
    defaultOperator: "isAnyOf",
    options: [
      { value: "enterprise", label: "Enterprise" },
      { value: "vip", label: "VIP" },
      { value: "growth", label: "Growth" },
      { value: "standard", label: "Standard" },
    ],
  },
  {
    id: "ai-confidence",
    label: "Fin AI Confidence Score",
    group: "Fin AI & automation",
    type: "number",
    color: "purple",
    unit: "%",
    min: 0,
    max: 100,
    operators: [
      { value: "greaterThanOrEqual", label: ">= (at least)" },
      { value: "lessThan", label: "less than" },
    ],
    defaultOperator: "greaterThanOrEqual",
  },
  {
    id: "route-node",
    label: "Route Node / Model",
    group: "Fin AI & automation",
    type: "select",
    color: "blue",
    operators: isOperator,
    defaultOperator: "is",
    options: [
      { value: "fin-2", label: "Fin 2" },
      { value: "fin-2-mini", label: "Fin 2 Mini" },
      { value: "fallback", label: "Fallback model" },
    ],
  },
  {
    id: "response-latency",
    label: "Response Latency",
    group: "Fin AI & automation",
    type: "number",
    color: "blue",
    unit: "ms",
    min: 0,
    operators: [
      { value: "lessThan", label: "less than" },
      { value: "greaterThanOrEqual", label: ">= (at least)" },
    ],
    defaultOperator: "lessThan",
  },
  {
    id: "containment-status",
    label: "Containment Status",
    group: "Fin AI & automation",
    type: "select",
    color: "green",
    operators: isOperator,
    defaultOperator: "is",
    options: [
      { value: "contained", label: "Contained" },
      { value: "escalated", label: "Escalated" },
    ],
  },
] as const;

export const filterRuleBuilderDemoValue: readonly FilterRuleClause[] = [
  { id: "channel-rule", field: "channel", operator: "isAnyOf", value: ["messenger", "whatsapp"] },
  { id: "resolution-rule", field: "resolution-status", operator: "is", value: "autonomous" },
  { id: "sla-rule", field: "response-sla", operator: "lessThan", value: 5 },
  { id: "tier-rule", field: "customer-tier", operator: "isAnyOf", value: ["enterprise", "vip"] },
] as const;

export const filterRuleBuilderDemoDraft: FilterRuleDraft = {
  field: "ai-confidence",
  operator: "greaterThanOrEqual",
  value: 90,
};

export const filterRuleBuilderDemoPresets: readonly FilterRulePreset[] = [
  {
    id: "all-active",
    label: "All active",
    filters: filterRuleBuilderDemoValue,
  },
  {
    id: "fin-ai-agent",
    label: "Fin AI Agent",
    filters: [
      { id: "fin-resolution", field: "resolution-status", operator: "is", value: "autonomous" },
      { id: "fin-confidence", field: "ai-confidence", operator: "greaterThanOrEqual", value: 85 },
    ],
  },
  {
    id: "escalations",
    label: "Escalations",
    filters: [
      { id: "escalated", field: "containment-status", operator: "is", value: "escalated" },
    ],
  },
  {
    id: "sla-risk",
    label: "SLA Risk",
    filters: [
      { id: "sla-risk-rule", field: "response-sla", operator: "lessThan", value: 5 },
    ],
  },
] as const;
