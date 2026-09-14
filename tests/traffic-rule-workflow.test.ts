import { describe, expect, it } from "vitest";
import {
  afterActionTypes,
  defaultConditions,
  hydrateActions,
  hydrateConditions,
  type ActionItem,
  type ConditionItem,
  type RuleFormValue,
  type RuleWorkflowDraft,
} from "../packages/blocks/src/application/traffic-rules-01/rule-config";
import {
  createWorkflowDraft,
  createWorkflowSamples,
  serializeWorkflow,
  simulateWorkflow,
  validateWorkflow,
} from "../packages/blocks/src/application/traffic-rules-01/workflow-model";

function draft(overrides: Partial<RuleWorkflowDraft> = {}): RuleWorkflowDraft {
  return {
    ...createWorkflowDraft(),
    name: "企业租户路由",
    conditions: defaultConditions.slice(0, 2).map((condition) => ({ ...condition })),
    actions: [action("转发到", "gateway-model-general-prod", "weightedHash", "demo-forward")],
    ...overrides,
  };
}

function action(type: string, primary?: string, secondary?: string, id = "action-1"): ActionItem {
  return { id, type, phase: afterActionTypes.has(type) ? "after" : "before", primary, secondary };
}

function runCondition(condition: ConditionItem, actual: string) {
  return simulateWorkflow(draft({ conditions: [condition] }), { [condition.id]: actual }, "normal");
}

describe("traffic rule workflow persistence", () => {
  it("starts new rules with independent empty condition and action lists", () => {
    const first = createWorkflowDraft();
    const second = createWorkflowDraft();
    expect(first.name).toBe("");
    expect(first.conditions).toEqual([]);
    expect(first.actions).toEqual([]);
    expect(first.conditions).not.toBe(second.conditions);
    expect(first.actions).not.toBe(second.actions);
  });

  it("normalizes previously saved OR rules to the currently supported AND relationship", () => {
    const saved = serializeWorkflow(draft({ logic: "or" }));
    expect(createWorkflowDraft(saved).logic).toBe("and");
  });

  it("round-trips full condition, phase, action parameter, AND logic, fallback and rule metadata", () => {
    const original = draft({ logic: "and", fallback: "reject", actions: [action("内容检测（护栏）", "研发安全", "仅记录，放行"), action("改写响应头", "x-route", "model-gateway", "response")] });
    const initial: RuleFormValue = { id: "existing", priority: 7, name: "旧名称", matcher: "/old", enabled: true, conditions: [], actions: [] };
    const saved = serializeWorkflow(original, initial);
    expect(saved).toMatchObject({ id: "existing", priority: 7, enabled: true });
    expect(createWorkflowDraft(saved)).toEqual(original);
    expect(hydrateConditions(saved)).toEqual(original.conditions);
    expect(hydrateActions(saved)).toEqual(original.actions);
    const edited = createWorkflowDraft(saved);
    edited.actions[0]!.secondary = "拦截";
    edited.conditions[0]!.primary = "/different";
    expect(saved.workflow).toEqual(original);
  });

  it("hydrates known legacy summaries and rejection aliases without inventing missing action parameters", () => {
    const initial: RuleFormValue = { id: "legacy", priority: 1, name: "旧规则", matcher: "/v1/", enabled: false, conditions: ["请求头 · x-tenant-tier 等于 production", "时段 · 位于 09:00–18:00 · Asia/Shanghai", "调用方 · 等于 service · gateway-router"], actions: ["拒绝这个请求", "转发到"] };
    const restored = createWorkflowDraft(initial);
    expect(restored.conditions[1]).toMatchObject({ kind: "header", primary: "x-tenant-tier", secondary: "production" });
    expect(restored.conditions[2]).toMatchObject({ kind: "period", primary: "09:00–18:00", secondary: "Asia/Shanghai" });
    expect(restored.conditions[3]).toMatchObject({ kind: "caller", primary: "service · gateway-router" });
    expect(restored.actions[0]?.type).toBe("拒绝本次调用");
    expect(restored.actions[1]?.primary).toBeUndefined();
    expect(validateWorkflow(restored)).toContainEqual(expect.objectContaining({ nodeId: "legacy-action-1" }));
  });

  it("persists AND logic, full conditions, action parameters, phases and fallback for rule details", () => {
    const original = draft({ name: "自定义租户策略", logic: "and", fallback: "reject", actions: [action("转发到", "gateway-model-general-prod", "weightedHash"), action("改写响应头", "x-route-result", "model-gateway", "response")] });
    const saved = serializeWorkflow(original);
    expect(saved.workflow).toEqual(original);
    expect(saved.workflow?.logic).toBe("and");
    expect(saved.workflow?.fallback).toBe("reject");
    expect(saved.workflow?.actions).toEqual(expect.arrayContaining([
      expect.objectContaining({ phase: "before", primary: "gateway-model-general-prod", secondary: "weightedHash" }),
      expect.objectContaining({ phase: "after", primary: "x-route-result", secondary: "model-gateway" }),
    ]));
  });
});

describe("traffic rule workflow condition evaluation", () => {
  it("requires all conditions and skips all actions on a miss", () => {
    const rule = draft();
    const facts = { ...createWorkflowSamples(rule), "demo-header": "starter" };
    const missed = simulateWorkflow(rule, facts, "normal");
    expect(missed.matched).toBe(false);
    expect(missed.checks.map((check) => check.matched)).toEqual([true, false]);
    expect(missed.steps.find((step) => step.id === "demo-forward")?.status).toBe("skipped");
    expect(missed.outcome).toContain("下一条规则");
  });

  it("treats glob punctuation literally and supports prefix, inequality and existence operators", () => {
    expect(runCondition({ id: "c", kind: "path", operator: "正则", primary: "^/v1/a\\.b/.*$" }, "/v1/aXb/test").matched).toBe(false);
    expect(runCondition({ id: "c", kind: "path", operator: "前缀", primary: "/v1/" }, "/v1/chat").matched).toBe(true);
    expect(runCondition({ id: "c", kind: "traffic-label", operator: "不等于", primary: "tier", secondary: "free" }, "enterprise").matched).toBe(false);
    const missing = simulateWorkflow(draft(), {}, "normal");
    expect(missing.outcome).toContain("无法完成模拟");
  });

  it("compares IPv4 CIDR ranges including /0 and /32 and refuses malformed or IPv6 samples", () => {
    const condition: ConditionItem = { id: "ip", kind: "cidr", operator: "包含", primary: "10.0.0.0/8" };
    expect(runCondition(condition, "10.255.255.255").matched).toBe(true);
    expect(runCondition(condition, "11.0.0.0").matched).toBe(false);
    expect(runCondition({ ...condition, primary: "0.0.0.0/0" }, "255.255.255.255").matched).toBe(true);
    expect(runCondition({ ...condition, primary: "10.0.0.1/32" }, "10.0.0.2").matched).toBe(false);
    expect(runCondition(condition, "::1").outcome).toContain("无法完成模拟");
  });

  it("supports half-open overnight periods and converts timestamp samples into the configured timezone", () => {
    const condition: ConditionItem = { id: "time", kind: "period", operator: "位于", primary: "22:00–06:00", secondary: "Asia/Shanghai" };
    expect(runCondition(condition, "23:30").matched).toBe(true);
    expect(runCondition(condition, "05:59").matched).toBe(true);
    expect(runCondition(condition, "06:00").matched).toBe(false);
    expect(runCondition(condition, "2026-09-10T15:30:00Z").matched).toBe(true);
    expect(runCondition(condition, "2026-09-10T23:30:00").outcome).toContain("无法完成模拟");
  });

  it("refuses ambiguous local clock samples across timezones and accepts one explicit timestamp", () => {
    const rule = draft({ conditions: [
      { id: "shanghai", kind: "period", operator: "位于", primary: "09:00–18:00", secondary: "Asia/Shanghai" },
      { id: "utc", kind: "period", operator: "位于", primary: "09:00–18:00", secondary: "UTC" },
    ] });
    const ambiguous = simulateWorkflow(rule, { shanghai: "12:00", utc: "12:00" }, "normal");
    expect(ambiguous.matched).toBe(false);
    expect(ambiguous.checks.every((check) => check.error?.includes("跨时区条件"))).toBe(true);
    expect(ambiguous.outcome).toContain("无法完成模拟");
    const sameMoment = simulateWorkflow(rule, { shanghai: "2026-09-10T09:30:00Z", utc: "2026-09-10T09:30:00Z" }, "normal");
    expect(sameMoment.matched).toBe(true);
  });

  it("compares stable caller and capability ids", () => {
    const caller: ConditionItem = { id: "caller", kind: "caller", operator: "等于", primary: "service · gateway-router" };
    expect(runCondition(caller, "service · gateway-router").matched).toBe(true);
    expect(runCondition(caller, "service · billing-worker").matched).toBe(false);
    const capability: ConditionItem = { id: "cap", kind: "capability", operator: "等于", primary: "capability-chat-completions" };
    expect(runCondition(capability, "capability-chat-completions").matched).toBe(true);
    expect(runCondition(capability, "capability-mcp-search").matched).toBe(false);
  });
});

describe("traffic rule workflow actions and exceptions", () => {
  it("terminates on rejection and marks subsequent actions skipped", () => {
    const rule = draft({ actions: [action("拒绝本次调用", "policy_access_denied"), action("转发到", "gateway-model-general-prod", "weightedHash", "forward")] });
    const result = simulateWorkflow(rule, createWorkflowSamples(rule), "normal");
    expect(result.matched).toBe(true);
    expect(result.outcome).toBe("拒绝本次调用");
    expect(result.steps.find((step) => step.id === "forward")?.status).toBe("skipped");
  });

  it.each(["allow", "reject"] as const)("uses %s fallback when a configured component is unavailable", (fallback) => {
    const rule = draft({ fallback });
    const result = simulateWorkflow(rule, createWorkflowSamples(rule), "unavailable");
    expect(result.steps.find((step) => step.id === "fallback")?.status).toBe(fallback === "allow" ? "success" : "blocked");
    expect(result.outcome).toContain(fallback === "allow" ? "放行" : "拒绝");
  });

  it("applies sensitive/quota scenarios only to configured checks and respects record-only handling", () => {
    const plain = draft();
    for (const scenario of ["sensitive", "quota"] as const) expect(simulateWorkflow(plain, createWorkflowSamples(plain), scenario).outcome).toBe("转发到 gateway-model-general-prod");
    const safety = draft({ actions: [action("内容检测（护栏）", "通用", "仅记录，放行"), ...plain.actions] });
    expect(simulateWorkflow(safety, createWorkflowSamples(safety), "sensitive").outcome).toBe("转发到 gateway-model-general-prod");
    safety.actions[0]!.secondary = "拦截";
    const blocked = simulateWorkflow(safety, createWorkflowSamples(safety), "sensitive");
    expect(blocked.outcome).toContain("拒绝");
    expect(blocked.steps.find((step) => step.id === "demo-forward")?.status).toBe("skipped");
    const quota = draft({ actions: [action("应用限额", "生产环境模型调用限速", "拒绝（429）"), ...plain.actions] });
    expect(simulateWorkflow(quota, createWorkflowSamples(quota), "quota").outcome).toContain("429 TRAFFIC_RATE_LIMITED");
  });

  it("does not invent upstream response facts for threshold actions", () => {
    const rule = draft({ actions: [action("上游失败判定", "上游状态码 500、502、503、504")] });
    const result = simulateWorkflow(rule, createWorkflowSamples(rule), "normal");
    expect(result.steps.find((step) => step.id === "action-1")?.status).toBe("blocked");
    expect(result.outcome).toContain("缺少上游响应事实");
  });
});

describe("traffic rule workflow validation", () => {
  it("identifies incomplete and invalid values on the relevant nodes", () => {
    const rule = draft({ name: "  ", conditions: [{ id: "invalid", kind: "cidr", operator: "包含", primary: "10.0.0.0/33" }], actions: [action("转发到")] });
    expect(validateWorkflow(rule).map((issue) => issue.nodeId)).toEqual(expect.arrayContaining(["start", "conditions", "action-1"]));
    expect(validateWorkflow(draft({ fallback: "unknown" as "allow" }))).toContainEqual(expect.objectContaining({ nodeId: "fallback" }));
  });

  it("rejects conflicting routes, AND equalities, duplicate header writes, and invalid action phases", () => {
    expect(validateWorkflow(draft({ actions: [action("转发到", "gateway-model-general-prod", "weightedHash"), action("转发到", "gateway-model-private-rnd", "weightedRoundRobin", "fallback-route")] }))).toContainEqual(expect.objectContaining({ nodeId: "fallback-route", message: expect.stringContaining("只能设置一个路由目标") }));
    const conditions: ConditionItem[] = [{ id: "a", kind: "header", primary: "X-Tier", operator: "等于", secondary: "free" }, { id: "b", kind: "header", primary: "x-tier", operator: "等于", secondary: "enterprise" }];
    expect(validateWorkflow(draft({ conditions }))).toContainEqual(expect.objectContaining({ message: expect.stringContaining("互相冲突") }));
    expect(validateWorkflow(draft({ conditions, logic: "or" }))).toContainEqual(expect.objectContaining({ nodeId: "conditions", message: expect.stringContaining("仅支持全部条件") }));
    const headers = [action("改写请求头", "X-Tier", "free"), action("改写请求头", "x-tier", "enterprise", "rewrite")];
    expect(validateWorkflow(draft({ actions: headers }))).toContainEqual(expect.objectContaining({ nodeId: "rewrite", message: expect.stringContaining("重复改写") }));
    expect(afterActionTypes.has("改写请求头")).toBe(false);
    expect(validateWorkflow(draft({ actions: [{ ...headers[0]!, phase: "after" }] }))).toContainEqual(expect.objectContaining({ message: expect.stringContaining("必须在转发前") }));
  });
});
