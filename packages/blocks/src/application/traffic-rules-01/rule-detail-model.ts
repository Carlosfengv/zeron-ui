import {
  actionTypes,
  afterActionTypes,
  definitionMap,
  type ActionItem,
  type ActionPhase,
  type ConditionItem,
  type RuleFormValue,
} from "./rule-config";

export type DetailField = { label: string; value: string };
export type DetailCondition = { id: string; label: string; summary: string; fields: DetailField[] };
export type DetailAction = {
  id: string;
  title: string;
  description: string;
  phase: ActionPhase | null;
  fields: DetailField[];
  unreachable: boolean;
};
export type RuleDetail = {
  legacy: boolean;
  logic: "and" | "or" | null;
  relationLabel: string;
  conditions: DetailCondition[];
  actions: DetailAction[];
  result: string;
  resultSummary: string;
  fallback: string;
};

const directFallbackType = "跳过意图识别，直接用虚拟模型的兜底模型服务";
const knownActionTypes = new Set(actionTypes);
const actionParameterLabels: Record<string, readonly string[]> = {
  "转发到": ["转发目标", "分流策略"],
  "内容检测（护栏）": ["检测模板", "命中后的处理"],
  "应用限额": ["限额策略", "超限处理"],
  "改写请求头": ["Header 名称", "Header 值"],
  "改写请求字段": ["改写操作", "JSON 指针"],
  "改写请求正文": ["改写操作", "JSON 指针"],
  "改写失败时": ["失败处理"],
  "挂载插件": ["插件绑定 ID"],
  "改写响应头": ["Header 名称", "Header 值"],
  "状态码映射": ["上游状态码", "返回状态码"],
  "改写响应字段": ["改写操作", "JSON 指针"],
  "上游失败判定": ["失败判定条件"],
  "镜像复制": ["目标端点", "采样比例"],
  "失败姿态": ["失败姿态"],
};

function displayValue(value: string | undefined, missing: string): string {
  return value === undefined || value === "" ? missing : value;
}

function conditionDetail(condition: ConditionItem): DetailCondition {
  const definition = definitionMap.get(condition.kind);
  const operator = displayValue(condition.operator, "未设置");
  const primary = displayValue(condition.primary, "未设置");
  const fields: DetailField[] = [
    { label: "判断方式", value: operator },
    { label: definition?.primaryLabel ?? "条件值", value: primary },
  ];
  const hasSecondary = condition.operator !== "存在" && Boolean(definition?.secondaryLabel || condition.secondary !== undefined);
  const secondary = displayValue(condition.secondary, "未设置");
  if (hasSecondary) fields.push({ label: definition?.secondaryLabel ?? "附加值", value: secondary });

  let summary = `${operator} ${primary}`;
  if (condition.kind === "caller" && hasSecondary) summary = `${primary} 的主体 ${operator} ${secondary}`;
  else if (condition.kind === "period" && hasSecondary) summary = `${operator} ${primary} · ${secondary}`;
  else if (hasSecondary) summary = `${primary} ${operator} ${secondary}`;

  return { id: condition.id, label: definition?.label ?? condition.kind, summary, fields };
}

function actionDetail(action: ActionItem, legacy: boolean): DetailAction {
  const title = action.type === "拒绝这个请求" ? "拒绝本次调用" : action.type;
  const labels = actionParameterLabels[title] ?? [];
  const missing = legacy ? "未记录" : "未设置";
  const fields: DetailField[] = [];
  if (labels[0] || action.primary !== undefined) fields.push({ label: labels[0] ?? "附加配置", value: displayValue(action.primary, missing) });
  if (labels[1] || action.secondary !== undefined) fields.push({ label: labels[1] ?? "附加值", value: displayValue(action.secondary, missing) });

  let description = fields.map((field) => `${field.label}：${field.value}`).join(" · ");
  if (title === "拒绝本次调用") description = "终止当前请求，不再执行后续动作";
  else if (title === directFallbackType) description = "使用虚拟模型的兜底模型服务，无需额外配置";
  else if (title === "镜像复制") description += " · 不改变主请求路由";
  else if (!description) description = legacy ? "仅记录了动作原文，未记录详细参数" : "未设置动作参数";

  return {
    id: action.id,
    title,
    description,
    phase: legacy
      ? knownActionTypes.has(title) ? afterActionTypes.has(title) ? "after" : "before" : null
      : action.phase === "before" || action.phase === "after" ? action.phase : null,
    fields,
    unreachable: false,
  };
}

/** Match the editor's phase order without sorting or rewriting the saved array. */
function orderedActions(actions: DetailAction[]): DetailAction[] {
  const ordered = [...actions.filter((action) => action.phase === "before"), ...actions.filter((action) => action.phase === "after"), ...actions.filter((action) => action.phase === null)];
  let rejected = false;
  return ordered.map((action) => {
    // Unknown phases have no dependable position relative to a rejection.
    const unreachable = action.phase !== null && rejected;
    if (action.title === "拒绝本次调用" && action.phase !== null) rejected = true;
    return { ...action, unreachable };
  });
}

function expectedResult(actions: DetailAction[]): Pick<RuleDetail, "result" | "resultSummary"> {
  if (!actions.length) return { resultSummary: "尚未配置处置动作", result: "当前规则未配置处置动作，无法确定命中后的处理方式。" };
  if (actions.some((action) => action.phase === null || !knownActionTypes.has(action.title))) return { resultSummary: "处理结果待确认", result: "存在无法识别的动作或执行阶段，请检查原始配置后确认处理结果。" };
  const active = actions.filter((action) => !action.unreachable);
  const rejection = active.find((action) => action.title === "拒绝本次调用");
  if (rejection) {
    const hasEarlierCheck = active.slice(0, active.indexOf(rejection)).some((action) => ["内容检测（护栏）", "应用限额", "上游失败判定"].includes(action.title));
    return { resultSummary: "执行至拒绝动作时终止请求", result: `当条件判断命中并执行到“拒绝本次调用”时，立即终止当前请求，后续动作不再执行。${hasEarlierCheck ? "前序检测或限额动作可能提前结束处理。" : ""}这里展示配置预期，不代表请求已经执行。` };
  }

  const routeActions = active.filter((action) => action.title === "转发到" || action.title === directFallbackType);
  if (routeActions.length > 1) return { resultSummary: "路由配置待确认", result: "当前配置包含多个路由动作，请检查目标与执行顺序后确认处理结果。" };
  const routeAction = routeActions[0];
  const routeTarget = routeAction?.title === directFallbackType ? "虚拟模型的兜底模型服务" : routeAction?.fields.find((field) => field.label === "转发目标")?.value;
  if (routeTarget === "未设置") return { resultSummary: "尚未设置转发目标", result: "当前转发动作尚未设置目标，无法确定命中后的路由结果。" };

  const conditional = active.some((action) => ["内容检测（护栏）", "应用限额", "上游失败判定"].includes(action.title));
  const after = active.some((action) => action.phase === "after");
  const normalRoute = routeTarget ? `按配置将请求转发到 ${routeTarget}` : "沿用网关既有路由";
  const resultSummary = conditional ? "按检测与动作配置处理请求" : routeTarget ? `转发到 ${routeTarget}` : "沿用网关既有路由";
  return {
    resultSummary,
    result: `当条件判断命中时，依次执行已配置动作；未被前序动作中止且相关组件可用时，${normalRoute}${after ? "，收到上游响应后继续执行响应阶段动作" : ""}。${conditional ? "敏感内容、超限或失败判定会按各自动作的配置影响最终结果；这里展示配置预期，不代表请求已经执行。" : "这里展示配置预期，不代表请求已经执行。"}`,
  };
}

/** Read-only projection: legacy summaries are evidence, not an editable draft. */
export function buildRuleDetail(rule: RuleFormValue): RuleDetail {
  const workflow = rule.workflow;
  if (!workflow) {
    const conditions: DetailCondition[] = [];
    if (rule.matcher !== "") conditions.push({ id: `${rule.id}-matcher`, label: "匹配范围", summary: rule.matcher, fields: [{ label: "原始配置", value: rule.matcher }] });
    rule.conditions.forEach((condition, index) => conditions.push({ id: `${rule.id}-condition-${index}`, label: "条件", summary: displayValue(condition, "未记录"), fields: [{ label: "原始配置", value: displayValue(condition, "未记录") }] }));
    const actions = orderedActions(rule.actions.map((type, index) => actionDetail({ id: `${rule.id}-action-${index}`, type, phase: "before" }, true)));
    return {
      legacy: true,
      logic: null,
      relationLabel: "未记录条件关系",
      conditions,
      actions,
      resultSummary: "未记录完整处理结果",
      result: "已保留规则中记录的原始条件与动作，但旧记录不包含完整工作流配置，无法仅据此确定最终处理结果。",
      fallback: "未记录",
    };
  }

  const logic = workflow.logic === "and" || workflow.logic === "or" ? workflow.logic : null;
  const actions = orderedActions(workflow.actions.map((action) => actionDetail(action, false)));
  return {
    legacy: false,
    logic,
    relationLabel: logic === "and" ? "全部条件（AND）" : logic === "or" ? "任一条件（OR）" : "未记录条件关系",
    conditions: workflow.conditions.map(conditionDetail),
    actions,
    ...expectedResult(actions),
    fallback: workflow.fallback === "allow" ? "放行请求，沿用原路由" : workflow.fallback === "reject" ? "拒绝本次调用" : "未记录",
  };
}
