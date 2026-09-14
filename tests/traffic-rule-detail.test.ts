import { describe, expect, it } from "vitest";
import { buildRuleDetail } from "../packages/blocks/src/application/traffic-rules-01/rule-detail-model";
import {
  actionTypes,
  afterActionTypes,
  conditionDefinitions,
  type ActionItem,
  type RuleFormValue,
  type RuleWorkflowDraft,
} from "../packages/blocks/src/application/traffic-rules-01/rule-config";

function rule(workflow?: Partial<RuleWorkflowDraft>): RuleFormValue {
  return {
    id: "saved-rule", priority: 2, name: "保存的规则", enabled: true,
    matcher: "/v1/chat/",
    conditions: ["模型服务 · 等于 model-service-prod-cn"], actions: ["拒绝这个请求"],
    ...(workflow ? { workflow: { name: "保存的规则", logic: "and", conditions: [], actions: [], fallback: "allow", ...workflow } as RuleWorkflowDraft } : {}),
  };
}

function action(type: string, id = type, primary?: string, secondary?: string): ActionItem {
  return { id, type, phase: afterActionTypes.has(type) ? "after" : "before", primary, secondary };
}

describe("traffic rule detail data projection", () => {
  it("preserves legacy matcher and raw conditions without fabricating a path, AND or fallback", () => {
    const detail = buildRuleDetail(rule());
    expect(detail).toMatchObject({ legacy: true, logic: null, relationLabel: "未记录条件关系", fallback: "未记录" });
    expect(detail.conditions).toMatchObject([
      { label: "匹配范围", summary: "/v1/chat/" },
      { label: "条件", summary: "模型服务 · 等于 model-service-prod-cn" },
    ]);
    expect(detail.actions[0]).toMatchObject({ title: "拒绝本次调用", phase: "before", fields: [] });
    expect(detail.result).toContain("无法仅据此确定");
    expect(JSON.stringify(detail)).not.toContain("请求路径");
  });

  it("does not insert default conditions or actions into empty legacy records", () => {
    const detail = buildRuleDetail({ ...rule(), matcher: "", conditions: [], actions: [] });
    expect(detail.conditions).toEqual([]);
    expect(detail.actions).toEqual([]);
    expect(JSON.stringify(detail)).not.toContain("/*");
    expect(JSON.stringify(detail)).not.toContain("gateway-model-general-prod");
  });

  it("labels missing legacy action parameters as unrecorded and retains unknown action text", () => {
    const detail = buildRuleDetail({ ...rule(), actions: ["改写响应头", "未识别动作：保留我", "转发到"] });
    expect(detail.actions.map((item) => item.phase)).toEqual(["before", "after", null]);
    expect(detail.actions[0]?.fields).toEqual([{ label: "转发目标", value: "未记录" }, { label: "分流策略", value: "未记录" }]);
    expect(detail.actions[1]?.fields).toEqual([{ label: "Header 名称", value: "未记录" }, { label: "Header 值", value: "未记录" }]);
    expect(detail.actions[2]?.title).toBe("未识别动作：保留我");
    expect(detail.actions[2]?.unreachable).toBe(false);
  });

  it("renders every structured condition type using saved values and definition labels", () => {
    const conditions = conditionDefinitions.map((definition, index) => ({ id: `condition-${index}`, kind: definition.kind, operator: definition.operators[0]!, primary: `${definition.kind}-saved-primary`, secondary: definition.secondaryLabel ? `${definition.kind}-saved-secondary` : undefined }));
    const detail = buildRuleDetail(rule({ logic: "or", conditions }));
    expect(detail.conditions).toHaveLength(conditionDefinitions.length);
    expect(detail.relationLabel).toBe("任一条件（OR）");
    for (const [index, definition] of conditionDefinitions.entries()) {
      const item = detail.conditions[index]!;
      expect(item.label).toBe(definition.label);
      expect(item.fields).toContainEqual({ label: "判断方式", value: definition.operators[0] });
      expect(item.fields).toContainEqual({ label: definition.primaryLabel, value: `${definition.kind}-saved-primary` });
      if (definition.secondaryLabel) expect(item.fields).toContainEqual({ label: definition.secondaryLabel, value: `${definition.kind}-saved-secondary` });
    }
  });

  it.each(["header", "query", "cookie"] as const)("does not display an irrelevant comparison value for %s existence", (kind) => {
    const detail = buildRuleDetail(rule({ conditions: [{ id: "exists", kind, operator: "存在", primary: "saved-key", secondary: "inactive-old-value" }] }));
    expect(detail.conditions[0]?.fields).toHaveLength(2);
    expect(detail.conditions[0]?.summary).toBe("存在 saved-key");
    expect(JSON.stringify(detail)).not.toContain("inactive-old-value");
  });

  it("preserves incomplete and long condition values instead of replacing the whole condition with an incomplete label", () => {
    const longValue = `/v1/${"very-long-segment/".repeat(80)}`;
    const detail = buildRuleDetail(rule({ conditions: [
      { id: "long", kind: "path", operator: "前缀", primary: longValue },
      { id: "incomplete", kind: "header", operator: "等于", primary: "x-preserved", secondary: "" },
    ] }));
    expect(detail.conditions[0]?.summary).toContain(longValue);
    expect(detail.conditions[1]?.fields).toContainEqual({ label: "Header 名称", value: "x-preserved" });
    expect(detail.conditions[1]?.fields).toContainEqual({ label: "比较值", value: "未设置" });
    expect(detail.conditions[1]?.summary).toContain("x-preserved");
  });

  it("covers every action type and keeps saved parameters", () => {
    const twoParameterActions = ["转发到", "内容检测（护栏）", "应用限额", "改写请求头", "改写请求字段", "改写请求正文", "改写响应头", "状态码映射", "改写响应字段", "镜像复制"];
    const actions = actionTypes.map((type) => action(type, type, type === "跳过意图识别" ? undefined : `${type}-primary`, twoParameterActions.includes(type) ? `${type}-secondary` : undefined));
    const detail = buildRuleDetail(rule({ actions }));
    expect(detail.actions).toHaveLength(actionTypes.length);
    for (const source of actions) {
      const item = detail.actions.find((item) => item.id === source.id)!;
      if (source.primary !== undefined) expect(item.fields.some((field) => field.value === source.primary)).toBe(true);
      if (source.secondary !== undefined) expect(item.fields.some((field) => field.value === source.secondary)).toBe(true);
    }
    expect(detail.actions.find((item) => item.title === "拒绝本次调用")?.fields).toEqual([{ label: "附加配置", value: "拒绝本次调用-primary" }]);
    expect(detail.actions.find((item) => item.title === "应用限额")?.fields.map((field) => field.label)).toEqual(["限额策略", "超限处理"]);
  });

  it("orders phases like the editor, preserves within-phase order and marks only actions after rejection unreachable", () => {
    const actions = [action("改写响应头", "after", "x-route", "saved"), action("转发到", "forward", "gateway-model-general-prod", "weightedHash"), action("拒绝本次调用", "reject", "policy_denied"), action("应用限额", "quota", "生产环境模型调用限速", "拒绝（429）")];
    const saved = rule({ actions });
    const snapshot = JSON.stringify(saved);
    const detail = buildRuleDetail(saved);
    expect(detail.actions.map((item) => item.id)).toEqual(["forward", "reject", "quota", "after"]);
    expect(detail.actions.map((item) => item.unreachable)).toEqual([false, false, true, true]);
    expect(detail.resultSummary).toContain("执行至拒绝动作");
    expect(JSON.stringify(saved)).toBe(snapshot);
    detail.actions[0]!.fields[0]!.value = "changed projection";
    expect(JSON.stringify(saved)).toBe(snapshot);
  });

  it.each(["内容检测（护栏）", "应用限额", "上游失败判定"])("describes %s outcomes conditionally, not as a successful execution", (type) => {
    const detail = buildRuleDetail(rule({ actions: [action(type, "check", "saved-config", "saved-handling"), action("转发到", "route", "gateway-model-general-prod", "weightedHash")] }));
    expect(detail.resultSummary).toBe("按检测与动作配置处理请求");
    expect(detail.result).toContain("未被前序动作中止");
    expect(detail.result).toContain("不代表请求已经执行");
    expect(detail.result).toContain("gateway-model-general-prod");
  });

  it("distinguishes forwarding, default-model routing, missing routing targets and no actions", () => {
    expect(buildRuleDetail(rule({ actions: [action("转发到", "route", "gateway-model-general-prod", "weightedHash")] })).resultSummary).toBe("转发到 gateway-model-general-prod");
    expect(buildRuleDetail(rule({ actions: [action("跳过意图识别")] })).resultSummary).toBe("沿用网关既有路由");
    expect(buildRuleDetail(rule({ actions: [action("转发到")] })).resultSummary).toBe("尚未设置转发目标");
    expect(buildRuleDetail(rule({ actions: [] })).resultSummary).toBe("尚未配置处置动作");
  });

  it.each(["allow", "reject"] as const)("uses only the saved %s fallback policy", (fallback) => {
    expect(buildRuleDetail(rule({ fallback })).fallback).toBe(fallback === "allow" ? "放行请求，沿用原路由" : "拒绝本次调用");
  });
});
