import {
  actionTypes,
  afterActionTypes,
  conditionComplete,
  conditionSummary,
  definitionMap,
  hydrateActions,
  hydrateConditions,
  newId,
  ruleSkipExplanation,
  type ActionItem,
  type ConditionItem,
  type RuleFormValue,
  type RuleWorkflowDraft,
} from "./rule-config";
import { gatewayModels, guardActions, guardTemplates, limitPolicyOptions } from "./gateway-policy-data";

export type { RuleWorkflowDraft } from "./rule-config";

export type WorkflowIssue = { nodeId: string; message: string };
export type WorkflowScenario = "normal" | "unavailable" | "sensitive" | "quota";
export type WorkflowSimulation = {
  matched: boolean;
  checks: Array<{ id: string; label: string; actual: string; expected: string; matched: boolean; error?: string }>;
  steps: Array<{ id: string; label: string; status: "success" | "skipped" | "blocked"; detail: string }>;
  outcome: string;
};

const headerName = /^[!#$%&'*+.^_`|~0-9A-Za-z-]+$/;
const primaryOptions: Record<string, string[]> = {
  "转发到": [...gatewayModels],
  "镜像复制": ["capability-mcp-search", "capability-a2a-research", "capability-http-document-parser"],
  "内容检测（护栏）": [...guardTemplates],
  "应用限额": [...limitPolicyOptions],
  "上游失败判定": ["上游状态码 500、502、503、504", "响应体指针 /error/code 等于 timeout"],
};
const secondaryOptions: Record<string, string[]> = {
  "内容检测（护栏）": [...guardActions],
  "应用限额": ["拒绝（429）"],
};

function cloneDraft(draft: RuleWorkflowDraft): RuleWorkflowDraft {
  return { ...draft, conditions: draft.conditions.map((condition) => ({ ...condition })), actions: draft.actions.map((action) => ({ ...action })) };
}

export function createWorkflowDraft(initial?: RuleFormValue): RuleWorkflowDraft {
  if (initial?.workflow) return { ...cloneDraft(initial.workflow), logic: "and" };
  return {
    name: initial?.name ?? "",
    logic: "and",
    // New rules start as an empty draft. Existing rules still hydrate their
    // persisted conditions/actions above, so editing never loses configuration.
    conditions: initial ? hydrateConditions(initial) : [],
    actions: initial ? hydrateActions(initial) : [],
    fallback: "allow",
  };
}

function ipv4(value: string): number | undefined {
  const parts = value.trim().split(".");
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part) || Number(part) > 255)) return undefined;
  return parts.reduce((sum, part) => sum * 256 + Number(part), 0);
}

function cidrRange(value: string): { network: number; size: number } | undefined {
  const [address, prefix, extra] = value.trim().split("/");
  const numeric = ipv4(address ?? "");
  if (extra !== undefined || numeric === undefined || prefix === undefined || !/^\d{1,2}$/.test(prefix) || Number(prefix) > 32) return undefined;
  const size = 2 ** (32 - Number(prefix));
  return { network: Math.floor(numeric / size) * size, size };
}

function minutes(value: string): number | undefined {
  const match = value.trim().match(/^(\d{2}):(\d{2})$/);
  if (!match || Number(match[1]) > 23 || Number(match[2]) > 59) return undefined;
  return Number(match[1]) * 60 + Number(match[2]);
}

function periodRange(value: string): [number, number] | undefined {
  const match = value.trim().match(/^(\d{2}:\d{2})\s*[-–—~至]\s*(\d{2}:\d{2})$/);
  if (!match) return undefined;
  const start = minutes(match[1]!);
  const end = minutes(match[2]!);
  return start === undefined || end === undefined || start === end ? undefined : [start, end];
}

function validTimezone(value: string): boolean {
  try { new Intl.DateTimeFormat("en", { timeZone: value }); return Boolean(value); } catch { return false; }
}

/** Return local minutes. Bare HH:mm is already in the condition's configured timezone. */
function sampleMinutes(value: string, timezone: string): number | undefined {
  const local = minutes(value);
  if (local !== undefined) return local;
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/.test(value)) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: timezone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(date);
  return Number(parts.find((part) => part.type === "hour")?.value) * 60 + Number(parts.find((part) => part.type === "minute")?.value);
}

function isRoute(action: ActionItem): boolean {
  return action.type === "转发到";
}

export function validateWorkflow(draft: RuleWorkflowDraft): WorkflowIssue[] {
  const issues: WorkflowIssue[] = [];
  const add = (nodeId: string, message: string) => issues.push({ nodeId, message });
  if (!draft.name.trim()) add("start", "请填写规则名称");
  if (draft.logic !== "and") add("conditions", "当前仅支持全部条件（AND）");
  if (!draft.conditions.length) add("conditions", "请至少添加一个条件");
  const conditionIds = new Set<string>();
  const equalities = new Map<string, string>();
  for (const condition of draft.conditions) {
    const definition = definitionMap.get(condition.kind);
    if (!condition.id || conditionIds.has(condition.id)) add("conditions", "条件标识缺失或重复，请重新添加该条件");
    conditionIds.add(condition.id);
    if (!definition) { add("conditions", "存在不支持的条件类型"); continue; }
    if (condition.kind === "traffic-label") { add("conditions", "流量标签是只读遗留条件，新规则不能创建或修改"); continue; }
    if (!conditionComplete(condition)) { add("conditions", `请完成${definition.label}的配置，并选择有效运算符`); continue; }
    if (definition.primaryOptions && !definition.primaryOptions.includes(condition.primary)) add("conditions", `${definition.label}的选项无效，请重新选择`);
    if (definition.secondaryOptions && !definition.secondaryOptions.includes(condition.secondary ?? "")) add("conditions", `${definition.label}的${definition.secondaryLabel}无效`);
    if (condition.kind === "path" && condition.operator !== "正则" && !condition.primary.startsWith("/")) add("conditions", "非正则请求路径必须以 / 开头");
    if (condition.kind === "header" && (!headerName.test(condition.primary) || condition.primary !== condition.primary.toLowerCase() || condition.primary.length > 64)) add("conditions", "请求头名称仅支持小写字母、数字和连字符，且不能超过 64 字节");
    if (condition.kind === "cidr" && !cidrRange(condition.primary)) add("conditions", condition.primary.includes(":") ? "当前预览仅支持 IPv4 CIDR，不支持 IPv6 网段" : "请输入有效的 IPv4 CIDR，例如 10.0.0.0/8");
    if (condition.kind === "period") {
      if (!periodRange(condition.primary)) add("conditions", "时段须使用 HH:mm–HH:mm，起止时间不能相同；支持跨午夜");
      if (!validTimezone(condition.secondary ?? "")) add("conditions", "请选择有效时区");
    }
    if (draft.logic === "and" && condition.operator === "等于") {
      const keyed = ["header", "query", "cookie", "traffic-label"].includes(condition.kind);
      const key = `${condition.kind}:${keyed ? condition.kind === "header" ? condition.primary.toLowerCase() : condition.primary : ""}`;
      const value = keyed ? condition.secondary ?? "" : condition.primary;
      if (equalities.has(key) && equalities.get(key) !== value) add("conditions", `${definition.label}存在互相冲突的相等条件，AND 关系无法命中`);
      equalities.set(key, value);
    }
  }
  if (!draft.actions.length) add("actions", "请至少添加一个处置动作");
  const actionIds = new Set<string>();
  let route: ActionItem | undefined;
  let seenAfter = false;
  const headers = new Map<string, string>();
  for (const action of draft.actions) {
    const id = action.id || "actions";
    if (!action.id || actionIds.has(action.id) || ["start", "conditions", "actions", "fallback", "result"].includes(action.id)) add(id, "动作标识缺失、重复或与系统节点冲突");
    actionIds.add(action.id);
    if (!actionTypes.includes(action.type)) { add(id, "请选择支持的动作类型"); continue; }
    const phase = afterActionTypes.has(action.type) ? "after" : "before";
    if (action.phase !== phase) add(id, `${action.type}必须在${phase === "before" ? "转发前" : "收到响应后"}执行`);
    if (seenAfter && phase === "before") add(id, "转发前动作不能放在响应后动作之后，请调整顺序");
    seenAfter ||= phase === "after";
    if (primaryOptions[action.type] && !primaryOptions[action.type]!.includes(action.primary ?? "")) add(id, `请为${action.type}选择有效的${isRoute(action) || action.type === "镜像复制" ? "目标" : "配置"}`);
    if (secondaryOptions[action.type] && !secondaryOptions[action.type]!.includes(action.secondary ?? "")) add(id, `请选择${action.type}的处理方式`);
    if (action.type === "拒绝本次调用" && (!action.primary?.trim() || action.primary.length > 64)) add(id, "请填写 1–64 字节的原因代码");
    if (action.type === "转发到" && !["weightedHash", "weightedRoundRobin"].includes(action.secondary ?? "")) add(id, "请选择 weightedHash 或 weightedRoundRobin 分流策略");
    if (["改写请求字段", "改写请求正文", "改写响应字段"].includes(action.type) && (!action.secondary?.startsWith("/") || action.secondary.length > 160)) add(id, "JSON 指针必须以 / 开头且不超过 160 字节");
    if (action.type === "挂载插件" && !action.primary?.trim()) add(id, "请填写本租户的插件绑定 ID");
    if (action.type === "状态码映射" && (!/^\d{3}(,\d{3})*$/.test(action.primary ?? "") || !/^\d{3}$/.test(action.secondary ?? ""))) add(id, "请填写合法的上游状态码列表和返回状态码");
    if (action.type === "镜像复制" && (!/^\d{1,3}%$/.test(action.secondary ?? "") || Number(action.secondary?.replace("%", "")) < 1 || Number(action.secondary?.replace("%", "")) > 100)) add(id, "镜像采样比例必须为 1–100%");
    if (action.type === "跳过意图识别" && draft.conditions.some((condition) => !["path", "declared-model", "model-service"].includes(condition.kind))) add(id, "关闭意图识别时只允许请求路径、客户端声明的模型名和模型服务条件");
    if (action.type === "改写请求头" || action.type === "改写响应头") {
      if (!headerName.test(action.primary ?? "")) add(id, "请填写有效的 Header 名称");
      if (!action.secondary?.trim() || /[\r\n]/.test(action.secondary)) add(id, "请填写 Header 值，且不能包含换行符");
      const key = `${phase}:${action.primary?.toLowerCase()}`;
      if (headers.has(key) && headers.get(key) !== action.secondary) add(id, "同一阶段重复改写同一 Header 且值不同，请合并配置");
      headers.set(key, action.secondary ?? "");
    }
    if (isRoute(action)) {
      if (route) add(id, "同一规则只能设置一个路由目标，转发与直接使用兜底模型不能同时配置");
      route = action;
    }
  }
  if (draft.fallback !== "allow" && draft.fallback !== "reject") add("fallback", "请选择组件不可用时放行或拒绝请求");
  return issues;
}

export function serializeWorkflow(draft: RuleWorkflowDraft, initial?: RuleFormValue): RuleFormValue {
  const workflow = cloneDraft({ ...draft, name: draft.name.trim() });
  return {
    id: initial?.id ?? newId("rule"),
    priority: initial?.priority ?? 1,
    name: workflow.name,
    matcher: workflow.conditions.find((condition) => condition.kind === "path")?.primary || "全部请求",
    enabled: initial?.enabled ?? false,
    conditions: workflow.conditions.filter((condition) => condition.kind !== "path").map((condition) => `${definitionMap.get(condition.kind)?.label ?? condition.kind} · ${conditionSummary(condition)}`),
    actions: workflow.actions.map((action) => action.type),
    workflow,
  };
}

export function workflowSampleHint(condition: ConditionItem): string {
  if (condition.kind === "period") return `HH:mm（${condition.secondary || "配置时区"}）或含时区的 ISO 时间`;
  if (condition.kind === "cidr") return "客户端 IPv4 地址，例如 10.0.0.1";
  if (condition.kind === "caller" || condition.kind === "capability") return condition.primary || "稳定对象 ID";
  if (["header", "query", "cookie"].includes(condition.kind)) return `${condition.primary || "该字段"} 的实际值`;
  return condition.kind === "path" ? "实际请求路径，例如 /v1/chat/completions" : "该条件的实际值";
}

export function createWorkflowSamples(draft: RuleWorkflowDraft): Record<string, string> {
  return Object.fromEntries(draft.conditions.map((condition) => {
    let sample = condition.primary;
    if (["header", "query", "cookie"].includes(condition.kind)) sample = condition.secondary ?? "存在";
    if (condition.kind === "caller" || condition.kind === "capability") sample = condition.primary;
    if (condition.kind === "period") sample = condition.primary.slice(0, 5);
    if (condition.kind === "cidr") sample = condition.primary.split("/")[0] ?? "";
    if (condition.operator === "正则") sample = sample.replace(/\^|\$|\\/g, "");
    return [condition.id, sample];
  }));
}

function compare(actual: string, expected: string, operator: string): boolean {
  switch (operator) {
    case "等于": case "属于": return actual === expected;
    case "不等于": case "不属于": return actual !== expected;
    case "包含": return actual.includes(expected);
    case "前缀": return actual.startsWith(expected);
    case "正则": try { return new RegExp(expected).test(actual); } catch { return false; }
    default: return false;
  }
}

function evaluateCondition(condition: ConditionItem, samples: Record<string, string>): { matched: boolean; error?: string } {
  const present = Object.hasOwn(samples, condition.id);
  const actual = samples[condition.id] ?? "";
  if (condition.operator === "存在") return { matched: present };
  if (!present) return { matched: false, error: "未提供该条件的样本事实" };
  if (condition.kind === "cidr") {
    const ip = ipv4(actual);
    if (ip === undefined) return { matched: false, error: "当前预览仅支持有效的 IPv4 地址样本" };
    const range = cidrRange(condition.primary)!;
    const inside = ip >= range.network && ip < range.network + range.size;
    return { matched: condition.operator === "不属于" ? !inside : inside };
  }
  if (condition.kind === "period") {
    const time = sampleMinutes(actual, condition.secondary!);
    if (time === undefined) return { matched: false, error: "时段样本须为 HH:mm 或带时区的 ISO 时间戳" };
    const [start, end] = periodRange(condition.primary)!;
    const inside = start < end ? time >= start && time < end : time >= start || time < end;
    return { matched: condition.operator === "不在" ? !inside : inside };
  }
  if (condition.kind === "caller" || condition.kind === "capability") return { matched: compare(actual, condition.primary, condition.operator) };
  const expected = ["header", "query", "cookie"].includes(condition.kind) ? condition.secondary ?? "" : condition.primary;
  return { matched: compare(actual, expected, condition.operator) };
}

export function simulateWorkflow(draft: RuleWorkflowDraft, samples: Record<string, string>, scenario: WorkflowScenario): WorkflowSimulation {
  const issues = validateWorkflow(draft);
  if (issues.length) return { matched: false, checks: [], steps: issues.map((issue) => ({ id: issue.nodeId, label: "配置待完善", status: "blocked", detail: issue.message })), outcome: "配置未通过校验，请先完善规则" };
  const periodTimezones = new Set(draft.conditions.filter((condition) => condition.kind === "period").map((condition) => condition.secondary));
  const evaluations = draft.conditions.map((condition) => {
    if (condition.kind === "period" && periodTimezones.size > 1 && minutes(samples[condition.id] ?? "") !== undefined) {
      return { matched: false, error: "跨时区条件请提供同一个含时区的 ISO 时间戳，HH:mm 无法确定同一请求的时间点" };
    }
    return evaluateCondition(condition, samples);
  });
  const checks = draft.conditions.map((condition, index) => ({
    id: condition.id,
    label: `${definitionMap.get(condition.kind)!.label}${["header", "query", "cookie"].includes(condition.kind) ? ` · ${condition.primary}` : ""}`,
    actual: Object.hasOwn(samples, condition.id) ? samples[condition.id]! : "（未提供）",
    expected: conditionSummary(condition),
    matched: evaluations[index]!.matched,
    error: evaluations[index]!.error,
  }));
  const hasErrors = evaluations.some((evaluation) => evaluation.error);
  // A missing or unsupported fact cannot prove a rule false or true. Do not invent a request fact.
  if (hasErrors) return { matched: false, checks, steps: [{ id: "conditions", label: "条件判断", status: "blocked", detail: "样本事实不足或格式不受支持，请按条件提示修正" }, ...draft.actions.map((action) => ({ id: action.id, label: action.type, status: "skipped" as const, detail: "条件尚无法判断" }))], outcome: "无法完成模拟：请补全或修正样本事实" };
  const matched = draft.logic === "and" ? checks.every((check) => check.matched) : checks.some((check) => check.matched);
  const steps: WorkflowSimulation["steps"] = [{ id: "conditions", label: "条件判断", status: matched ? "success" : "skipped", detail: matched ? `已满足${draft.logic === "and" ? "全部条件" : "至少一个条件"}` : ruleSkipExplanation }];
  if (!matched) return { matched, checks, steps: [...steps, ...draft.actions.map((action) => ({ id: action.id, label: action.type, status: "skipped" as const, detail: "规则未命中" }))], outcome: ruleSkipExplanation };
  let terminated = false;
  let route = "";
  let outcome = "放行请求，沿用原路由";
  for (const action of draft.actions) {
    if (terminated) { steps.push({ id: action.id, label: action.type, status: "skipped", detail: "前序动作已终止本次规则执行" }); continue; }
    let detail = "";
    let status: "success" | "blocked" = "success";
    const dependency = isRoute(action) || ["内容检测（护栏）", "应用限额", "镜像复制", "上游失败判定"].includes(action.type);
    if (scenario === "unavailable" && dependency) {
      steps.push({ id: action.id, label: action.type, status: "blocked", detail: "模拟该动作依赖的组件不可用" });
      outcome = draft.fallback === "allow" ? "组件不可用，按异常配置放行请求" : "组件不可用，按异常配置拒绝本次调用";
      steps.push({ id: "fallback", label: "异常处理", status: draft.fallback === "allow" ? "success" : "blocked", detail: outcome });
      terminated = true;
      continue;
    }
    if (action.type === "拒绝本次调用") { detail = outcome = "拒绝本次调用"; status = "blocked"; terminated = true; }
    else if (isRoute(action)) { route = action.primary!; detail = `路由目标设为 ${route}`; }
    else if (action.type === "内容检测（护栏）") {
      detail = scenario !== "sensitive" ? `使用${action.primary}模拟检测，未命中敏感内容` : `使用${action.primary}模拟命中敏感内容；${action.secondary}`;
      if (scenario === "sensitive" && action.secondary === "拦截") { outcome = "命中敏感内容，拒绝本次调用"; status = "blocked"; terminated = true; }
    } else if (action.type === "应用限额") {
      detail = scenario !== "quota" ? `模拟检查${action.primary}，未超过限额` : `模拟超过${action.primary}；${action.secondary}`;
      if (scenario === "quota") { outcome = "超过限额，返回 429 TRAFFIC_RATE_LIMITED"; status = "blocked"; terminated = true; }
    } else if (action.type === "改写请求头" || action.type === "改写响应头") detail = `${action.primary} → ${action.secondary}`;
    else if (action.type === "镜像复制") detail = `模拟复制流量到 ${action.primary}，不改变主请求路由`;
    else if (action.type === "上游失败判定") {
      detail = `判断 ${action.primary} 需要上游响应事实；当前预览未提供响应状态码、耗时或正文，无法判断`;
      outcome = "无法完成响应阈值模拟：缺少上游响应事实";
      status = "blocked";
      terminated = true;
    }
    steps.push({ id: action.id, label: action.type, status, detail });
  }
  if (!terminated && route) outcome = `转发到 ${route}`;
  return { matched, checks, steps, outcome };
}
