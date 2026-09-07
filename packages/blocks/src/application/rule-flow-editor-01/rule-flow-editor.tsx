"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@zeron/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@zeron/ui/select";
import { Input } from "@zeron/ui/input";
import {
  SortableCollection,
  type SortableCollectionItem,
} from "@zeron/ui/sortable-collection";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import type {
  RuleFlowAction,
  RuleFlowActionBranch,
  RuleFlowActionField,
  RuleFlowActionOption,
  RuleFlowActionPhase,
  RuleFlowClause,
  RuleFlowEditorLabels,
  RuleFlowExceptionGroup,
  RuleFlowExceptionPolicyOption,
  RuleFlowField,
  RuleFlowOperator,
  RuleFlowPosition,
  RuleFlowTriggerOption,
  RuleFlowValue,
} from "./rule-flow-types";

const canvasPadding = 16;
const kindLabelOffset = 30;
const edgeAnchorInset = 24;
const estimatedNodeHeight = 112;
const nodeCollisionGap = 56;
const minimumCanvasWidth = 1040;
const minimumCompactCanvasWidth = 360;
const actionRowGap = 176;
const primaryCardWidth = 620;
const exceptionCardWidth = 360;
const unmatchedCardWidth = 292;
const branchCardGap = 24;
const primaryFlowBadgeColor = {
  base: "var(--brand)",
  onStrong: "var(--fg-on-brand)",
} as const;

export const defaultRuleFlowTriggers: readonly RuleFlowTriggerOption[] = [
  {
    value: "incoming-request",
    label: "进入服务的请求",
    description: "对进入当前服务的每个请求执行规则",
  },
  {
    value: "new-event",
    label: "收到新事件",
    description: "新事件到达时执行规则",
  },
  {
    value: "alert-raised",
    label: "触发告警",
    description: "告警产生时执行规则",
  },
] as const;

export const defaultRuleFlowFields: readonly RuleFlowField[] = [
  {
    value: "request.source",
    label: "流量来源",
    sourceLabel: "请求",
    options: [
      { value: "public", label: "公网流量" },
      { value: "internal", label: "内部流量" },
      { value: "partner", label: "合作方流量" },
    ],
  },
  {
    value: "request.environment",
    label: "运行环境",
    sourceLabel: "请求",
    options: [
      { value: "production", label: "生产环境" },
      { value: "staging", label: "预发布环境" },
      { value: "development", label: "开发环境" },
    ],
  },
  {
    value: "request.risk",
    label: "风险等级",
    sourceLabel: "请求",
    options: [
      { value: "low", label: "低" },
      { value: "medium", label: "中" },
      { value: "high", label: "高" },
    ],
  },
] as const;

export const defaultRuleFlowOperators: readonly RuleFlowOperator[] = [
  { value: "equals", label: "等于" },
  { value: "not-equals", label: "不等于" },
] as const;

export const defaultRuleFlowActions: readonly RuleFlowActionOption[] = [
  {
    value: "reject-request",
    label: "拒绝本次调用",
    branches: ["matched"],
    phase: "before-upstream",
  },
  {
    value: "forward-to-upstream",
    label: "转发到",
    branches: ["matched"],
    phase: "before-upstream",
    fields: [
      {
        key: "upstream",
        label: "转发到",
        control: "select",
        placeholder: "请选择",
        options: [],
      },
    ],
  },
  {
    value: "skip-intent-recognition",
    label: "跳过意图识别，直接用虚拟模型的兜底模型服务",
    branches: ["matched"],
    phase: "before-upstream",
  },
  {
    value: "sensitive-content-check",
    label: "敏感内容信息检测",
    branches: ["matched"],
    phase: "before-upstream",
    fields: [
      {
        key: "detection",
        label: "敏感内容信息检测",
        control: "select",
        placeholder: "请选择",
        options: [],
      },
      {
        key: "template",
        label: "模板",
        control: "select",
        placeholder: "请选择",
        options: [],
      },
    ],
  },
  {
    value: "rate-limit",
    label: "流量控制",
    branches: ["matched"],
    phase: "before-upstream",
    fields: [
      {
        key: "dimension",
        label: "计数维度",
        control: "select",
        placeholder: "请选择",
        options: [],
      },
      {
        key: "window",
        label: "时间窗",
        control: "select",
        placeholder: "请选择",
        options: [],
      },
      {
        key: "requests",
        label: "周期内请求数",
        control: "select",
        placeholder: "请选择",
        options: [],
      },
      {
        key: "burst",
        label: "即时突发量",
        control: "select",
        placeholder: "请选择",
        options: [],
      },
    ],
  },
  {
    value: "rewrite-request-header",
    label: "请求头",
    branches: ["matched"],
    phase: "after-response",
    fields: [
      {
        key: "header",
        label: "请求头",
        control: "select",
        placeholder: "请选择",
        options: [],
      },
      {
        key: "value",
        prefix: "改为",
        control: "input",
        placeholder: "请填写",
      },
    ],
  },
  {
    value: "rewrite-response-header",
    label: "响应头",
    branches: ["matched"],
    phase: "after-response",
    fields: [
      {
        key: "header",
        label: "响应头",
        control: "select",
        placeholder: "请选择",
        options: [],
      },
      {
        key: "value",
        prefix: "改为",
        control: "input",
        placeholder: "请填写",
      },
    ],
  },
  {
    value: "map-upstream-failure",
    label: "上游返回值为以下值时判定为失败，返回502",
    branches: ["matched"],
    phase: "after-response",
    fields: [
      {
        key: "status",
        label: "上游返回值为以下值时判定为失败，返回502",
        control: "select",
        placeholder: "请选择",
        options: [],
      },
    ],
  },
  {
    value: "mirror-traffic",
    label: "复制流量到",
    branches: ["matched"],
    phase: "after-response",
    fields: [
      {
        key: "gateway",
        label: "复制流量到",
        control: "select",
        placeholder: "请选择模型网关",
        options: [],
      },
    ],
  },
] as const;

export const defaultRuleFlowErrorActions: readonly RuleFlowExceptionPolicyOption[] = [
  {
    value: "quota-exceeded",
    label: "超出限额时",
    branches: ["error"],
    group: "matched-result",
    resultLabel: "终止处理",
    resultColor: "red",
    fields: [
      {
        key: "responseTemplate",
        label: "返回内容",
        control: "select",
        placeholder: "请选择返回内容",
        options: [
          {
            value: "sensitive-content-rejected",
            label: "命中敏感信息被拒",
          },
        ],
      },
    ],
  },
  {
    value: "sensitive-content-detected",
    label: "检测到敏感信息时",
    branches: ["error"],
    group: "matched-result",
    resultLabel: "继续处理",
    resultColor: "cyan",
    fields: [
      {
        key: "behavior",
        label: "处理方式",
        control: "select",
        placeholder: "请选择处理方式",
        options: [
          {
            value: "sanitize-with-template",
            label: "按模板脱敏后继续处理",
          },
        ],
      },
    ],
  },
  {
    value: "detection-service-unavailable",
    label: "检测服务不可用时",
    branches: ["error"],
    group: "execution-failure",
    resultLabel: "放行",
    resultColor: "green",
    fields: [
      {
        key: "behavior",
        label: "处理方式",
        control: "select",
        placeholder: "请选择处理方式",
        options: [{ value: "allow", label: "放行" }],
      },
    ],
  },
  {
    value: "rewrite-step-failed",
    label: "改写步骤执行失败时",
    branches: ["error"],
    group: "execution-failure",
    resultLabel: "拒绝",
    resultColor: "red",
    fields: [
      {
        key: "behavior",
        label: "处理方式",
        control: "select",
        placeholder: "请选择处理方式",
        options: [{ value: "reject-call", label: "拒绝本次调用" }],
      },
    ],
  },
] as const;

export const defaultRuleFlow: RuleFlowValue = {
  trigger: null,
  conditions: [],
  conditionMatch: "all",
  outcomes: {
    matched: [],
    unmatched: { behavior: "skip-rule" },
    error: [],
  },
};

const defaultLabels: RuleFlowEditorLabels = {
  ariaLabel: "规则流程编辑器",
  trigger: "触发器",
  condition: "条件规则",
  matchedAction: "处置动作",
  unmatched: "未命中",
  errorAction: "异常处理",
  field: "条件字段",
  operator: "判断方式",
  value: "条件值",
  when: "如果",
  and: "且",
  chooseTrigger: "选择流量入口",
  chooseTriggerDescription: "选择进入当前规则的流量",
  matchAllConditions: "满足以下全部条件",
  conditionsDescription: "以下条件必须全部成立",
  matchedActionsDescription: "命中后按顺序执行以下动作",
  emptyMatchedActions: "尚未添加处置动作",
  actionPhaseDivider:
    "以上在转发到上游之前执行 · 以下在收到响应之后执行",
  matchedResults: "命中后的结果",
  executionFailures: "执行失败时",
  exceptionPoliciesDescription: (configured, total) =>
    `${configured}/${total} 项策略已配置`,
  chooseTriggerFirst: "请先选择流量入口",
  addCondition: "添加条件",
  removeCondition: "删除条件",
  addMatchedAction: "选择处置动作",
  showErrorBranch: "添加异常分支",
  removeAction: "删除动作",
  skipRule: "结束——不执行本规则",
  skipRuleDescription: "未命中流量直接离开，不执行任何处置动作",
  matchedBranch: "全部命中",
  unmatchedBranch: "未命中",
  errorBranch: "执行异常",
  moveNode: (title) => `移动${title}`,
  selectNode: (title) => `选择${title}`,
};

type RuleFlowEditorProps = Omit<
  ComponentPropsWithoutRef<"section">,
  "children" | "defaultValue" | "onChange"
> & {
  value?: RuleFlowValue;
  defaultValue?: RuleFlowValue;
  onValueChange?: (value: RuleFlowValue) => void;
  triggers?: readonly RuleFlowTriggerOption[];
  fields?: readonly RuleFlowField[];
  operators?: readonly RuleFlowOperator[];
  actions?: readonly RuleFlowActionOption[];
  errorActions?: readonly RuleFlowExceptionPolicyOption[];
  labels?: Partial<RuleFlowEditorLabels>;
  selectedNodeId?: string | null;
  defaultSelectedNodeId?: string | null;
  onSelectedNodeIdChange?: (id: string | null) => void;
  readOnly?: boolean;
  /** Optional minimum height. By default the editor fills its parent. */
  minHeight?: number;
};

type CanvasNodeKind =
  | "trigger"
  | "condition"
  | "matched-actions"
  | "error-actions"
  | "unmatched";

interface CanvasNode {
  id: string;
  kind: CanvasNodeKind;
  position: RuleFlowPosition;
  title: string;
  description?: string;
  width: number;
  draggable: boolean;
}

interface CanvasEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  branch?: "default" | "matched" | "unmatched" | "error";
  enabled: boolean;
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

function blankClause(existingClauses: readonly RuleFlowClause[]): RuleFlowClause {
  let sequence = existingClauses.length + 1;
  const existingIds = new Set(existingClauses.map((clause) => clause.id));
  while (existingIds.has(`condition-${sequence}`)) sequence += 1;
  return {
    id: `condition-${sequence}`,
    field: "",
    operator: "",
    value: "",
  };
}

function nextActionId(
  branch: RuleFlowActionBranch,
  actions: readonly RuleFlowAction[],
) {
  let sequence = actions.length + 1;
  const existingIds = new Set(actions.map((action) => action.id));
  while (existingIds.has(`${branch}-action-${sequence}`)) sequence += 1;
  return `${branch}-action-${sequence}`;
}

function ConditionEditor({
  conditions,
  enabled,
  errorBranchAvailable,
  errorBranchVisible,
  fields,
  labels,
  operators,
  readOnly,
  onChange,
  onShowErrorBranch,
}: {
  conditions: readonly RuleFlowClause[];
  enabled: boolean;
  errorBranchAvailable: boolean;
  errorBranchVisible: boolean;
  fields: readonly RuleFlowField[];
  labels: RuleFlowEditorLabels;
  operators: readonly RuleFlowOperator[];
  readOnly: boolean;
  onChange: (
    update: (
      conditions: readonly RuleFlowClause[],
    ) => readonly RuleFlowClause[],
  ) => void;
  onShowErrorBranch: () => void;
}) {
  const PlusIcon = useIcon("plus");
  const TrashIcon = useIcon("trash");

  const updateClause = (clauseId: string, patch: Partial<RuleFlowClause>) => {
    onChange((current) =>
      current.map((clause) =>
        clause.id === clauseId ? { ...clause, ...patch } : clause,
      ),
    );
  };

  return (
    <>
      <CardContent className="flex flex-col gap-2 px-3 pt-2">
        {conditions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-subtle px-3 py-3 text-label text-fg-muted">
            {enabled ? labels.conditionsDescription : labels.chooseTriggerFirst}
          </div>
        ) : (
          conditions.map((clause, index) => {
            const field = fields.find(
              (candidate) => candidate.value === clause.field,
            );
            const sourceLabel = field?.sourceLabel ?? "流量";
            return (
              <div
                className="grid min-w-0 grid-cols-[3rem_minmax(0,1fr)] items-start gap-2 sm:grid-cols-[3rem_auto_minmax(7rem,1fr)_minmax(6rem,.72fr)_minmax(8rem,1.05fr)_auto] sm:items-center"
                key={clause.id}
              >
                <span className="pt-1.5 text-label text-fg-muted sm:pt-0">
                  {index === 0 ? labels.when : labels.and}
                </span>
                <Badge className="mt-0.5 sm:mt-0" color="blue" size="sm">
                  {sourceLabel}
                </Badge>
                <span
                  className="col-span-2 min-w-0 sm:col-span-1"
                  data-flow-control
                >
                  <Select
                    disabled={readOnly || !enabled || fields.length === 0}
                    onValueChange={(fieldValue) =>
                      updateClause(clause.id, {
                        field: fieldValue,
                        operator: "",
                        value: "",
                      })
                    }
                    size="md"
                    value={clause.field}
                  >
                    <SelectTrigger
                      aria-label={labels.field}
                      className="w-full min-w-0"
                      placeholder={labels.field}
                    />
                    <SelectContent
                      animated={false}
                      className="min-w-44"
                      data-flow-control
                    >
                      {fields.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </span>
                <span
                  className="col-span-2 min-w-0 sm:col-span-1"
                  data-flow-control
                >
                  <Select
                    disabled={readOnly || !enabled || !field}
                    onValueChange={(operator) =>
                      updateClause(clause.id, { operator })
                    }
                    size="md"
                    value={clause.operator}
                  >
                    <SelectTrigger
                      aria-label={labels.operator}
                      className="w-full min-w-0"
                      placeholder={labels.operator}
                    />
                    <SelectContent
                      animated={false}
                      className="min-w-32"
                      data-flow-control
                    >
                      {operators.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </span>
                <span
                  className="col-span-2 min-w-0 sm:col-span-1"
                  data-flow-control
                >
                  <Select
                    disabled={readOnly || !enabled || !field}
                    onValueChange={(nextValue) =>
                      updateClause(clause.id, { value: nextValue })
                    }
                    size="md"
                    value={clause.value}
                  >
                    <SelectTrigger
                      aria-label={labels.value}
                      className="w-full min-w-0"
                      placeholder={labels.value}
                    />
                    <SelectContent
                      animated={false}
                      className="min-w-44"
                      data-flow-control
                    >
                      {(field?.options ?? []).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </span>
                {!readOnly && (
                  <span
                    className="col-span-2 justify-self-end sm:col-span-1"
                    data-flow-control
                  >
                    <Button
                      aria-label={labels.removeCondition}
                      iconOnly
                      onClick={() =>
                        onChange((current) =>
                          current.filter(
                            (candidate) => candidate.id !== clause.id,
                          ),
                        )
                      }
                      size="md"
                      type="button"
                      variant="ghost"
                    >
                      <TrashIcon aria-hidden size={14} />
                    </Button>
                  </span>
                )}
              </div>
            );
          })
        )}
      </CardContent>
      {!readOnly && (
        <CardFooter
          className="flex items-center justify-between gap-2 px-3 pb-3 pt-2"
          data-flow-control
        >
          <Button
            disabled={!enabled || fields.length === 0 || operators.length === 0}
            leadingIcon={PlusIcon}
            onClick={() =>
              onChange((current) => [...current, blankClause(current)])
            }
            size="md"
            type="button"
            variant="ghost"
          >
            {labels.addCondition}
          </Button>
          {errorBranchAvailable && !errorBranchVisible && (
            <Button
              disabled={!enabled}
              leadingIcon={PlusIcon}
              onClick={onShowErrorBranch}
              size="md"
              type="button"
              variant="ghost"
            >
              {labels.showErrorBranch}
            </Button>
          )}
        </CardFooter>
      )}
    </>
  );
}

interface MatchedActionItem extends SortableCollectionItem {
  action: RuleFlowAction;
  option?: RuleFlowActionOption;
  title: string;
  description?: string;
}

function actionConfigValue(action: RuleFlowAction, field: RuleFlowActionField) {
  const value = action.config?.[field.key];
  return typeof value === "string" ? value : "";
}

function ActionConfiguration({
  action,
  contextualLabels = false,
  option,
  readOnly,
  onConfigChange,
}: {
  action: RuleFlowAction;
  contextualLabels?: boolean;
  option?: RuleFlowActionOption;
  readOnly: boolean;
  onConfigChange: (field: RuleFlowActionField, value: string) => void;
}) {
  const fields = option?.fields ?? [];
  if (fields.length === 0) {
    return (
      <div className="min-h-control-md content-center font-medium text-fg-default">
        {option?.label ?? action.type}
      </div>
    );
  }

  return (
    <div className="grid w-full min-w-0 grid-flow-col auto-cols-fr items-center gap-2">
      {fields.map((field) => {
        const value = actionConfigValue(action, field);
        const fieldLabel = field.label ?? field.prefix ?? "";
        const label = contextualLabels
          ? `${option?.label ?? action.type}${fieldLabel}`
          : field.label ??
            `${option?.label ?? action.type}${field.prefix ?? ""}`;
        return (
          <label
            className="grid min-w-0 grid-cols-[auto_minmax(3rem,1fr)] items-center gap-2"
            key={field.key}
          >
            <span className="shrink-0 whitespace-nowrap text-label font-medium text-fg-muted">
              {field.label ?? field.prefix}
            </span>
            <span className="min-w-0">
              {field.control === "select" ? (
                <Select
                  disabled={readOnly}
                  onValueChange={(nextValue) =>
                    onConfigChange(field, nextValue)
                  }
                  size="md"
                  value={value}
                >
                  <SelectTrigger
                    aria-label={label}
                    className="w-full min-w-0 bg-surface-floating"
                    placeholder={field.placeholder ?? "请选择"}
                  />
                  <SelectContent
                    animated={false}
                    className="min-w-48"
                    data-flow-control
                  >
                    {(field.options ?? []).map((fieldOption) => (
                      <SelectItem
                        key={fieldOption.value}
                        value={fieldOption.value}
                      >
                        {fieldOption.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  aria-label={label}
                  className="bg-surface-floating"
                  disabled={readOnly}
                  onChange={(event) =>
                    onConfigChange(field, event.currentTarget.value)
                  }
                  placeholder={field.placeholder ?? "请填写"}
                  size="md"
                  value={value}
                />
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
}

function ExceptionPoliciesEditor({
  actions,
  enabled,
  labels,
  options,
  readOnly,
  onChange,
}: {
  actions: readonly RuleFlowAction[];
  enabled: boolean;
  labels: RuleFlowEditorLabels;
  options: readonly RuleFlowExceptionPolicyOption[];
  readOnly: boolean;
  onChange: (
    update: (
      actions: readonly RuleFlowAction[],
    ) => readonly RuleFlowAction[],
  ) => void;
}) {
  const updatePolicyConfig = (
    option: RuleFlowExceptionPolicyOption,
    field: RuleFlowActionField,
    value: string,
  ) => {
    onChange((current) => {
      const existing = current.find((action) => action.type === option.value);
      if (existing) {
        return current.map((action) =>
          action.id === existing.id
            ? {
                ...action,
                config: { ...action.config, [field.key]: value },
              }
            : action,
        );
      }
      return [
        ...current,
        {
          id: `error-policy-${option.value}`,
          type: option.value,
          config: { [field.key]: value },
        },
      ];
    });
  };

  const renderGroup = (
    group: RuleFlowExceptionGroup,
    title: string,
  ) => {
    const groupOptions = options.filter((option) => option.group === group);
    if (groupOptions.length === 0) return null;

    return (
      <section aria-label={title} className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-label font-medium text-fg-muted">
          <span className="shrink-0">{title}</span>
          <span className="h-px flex-1 bg-border-subtle" />
        </div>
        {groupOptions.map((option) => {
          const action = actions.find(
            (candidate) => candidate.type === option.value,
          ) ?? { id: `error-policy-${option.value}`, type: option.value };
          return (
            <div
              className="grid min-w-0 grid-cols-[auto_minmax(6rem,.8fr)_minmax(8rem,1.2fr)] items-center gap-2"
              key={option.value}
            >
              <Badge color={option.resultColor} size="sm">
                {option.resultLabel}
              </Badge>
              <span className="min-w-0 truncate text-label font-medium text-fg-default">
                {option.label}
              </span>
              <ActionConfiguration
                action={action}
                contextualLabels
                onConfigChange={(field, value) =>
                  updatePolicyConfig(option, field, value)
                }
                option={option}
                readOnly={readOnly || !enabled}
              />
            </div>
          );
        })}
      </section>
    );
  };

  return (
    <CardContent
      className="flex flex-col gap-3 px-3 pb-3 pt-2"
      data-flow-control
    >
      {renderGroup("matched-result", labels.matchedResults)}
      {renderGroup("execution-failure", labels.executionFailures)}
    </CardContent>
  );
}

function MatchedActionsEditor({
  actions,
  enabled,
  labels,
  options,
  readOnly,
  onChange,
}: {
  actions: readonly RuleFlowAction[];
  enabled: boolean;
  labels: RuleFlowEditorLabels;
  options: readonly RuleFlowActionOption[];
  readOnly: boolean;
  onChange: (
    update: (
      actions: readonly RuleFlowAction[],
    ) => readonly RuleFlowAction[],
  ) => void;
}) {
  const TrashIcon = useIcon("trash");
  const items = useMemo<MatchedActionItem[]>(
    () =>
      actions.map((action) => {
        const option = options.find(
          (candidate) => candidate.value === action.type,
        );
        return {
          action,
          description: option?.description,
          draggable: !readOnly,
          id: action.id,
          option,
          removable: false,
          title: option?.label ?? action.type,
        };
      }),
    [actions, options, readOnly],
  );
  const beforeItems = items.filter(
    (item) => item.option?.phase !== "after-response",
  );
  const afterItems = items.filter(
    (item) => item.option?.phase === "after-response",
  );

  const updateActionConfig = (
    actionId: string,
    field: RuleFlowActionField,
    value: string,
  ) => {
    onChange((current) =>
      current.map((action) =>
        action.id === actionId
          ? {
              ...action,
              config: { ...action.config, [field.key]: value },
            }
          : action,
      ),
    );
  };

  const commitPhaseOrder = (
    phase: RuleFlowActionPhase,
    nextItems: MatchedActionItem[],
  ) => {
    const phaseActions = nextItems.map((item) => item.action);
    const otherActions = (phase === "before-upstream" ? afterItems : beforeItems)
      .map((item) => item.action);
    onChange(() =>
      phase === "before-upstream"
        ? [...phaseActions, ...otherActions]
        : [...otherActions, ...phaseActions],
    );
  };

  const addAction = (actionType: string) => {
    const option = options.find((candidate) => candidate.value === actionType);
    onChange((current) => {
      const action: RuleFlowAction = {
        id: nextActionId("matched", current),
        type: actionType,
      };
      if (option?.phase === "after-response") return [...current, action];

      const firstAfterResponseIndex = current.findIndex((candidate) =>
        options.find((entry) => entry.value === candidate.type)?.phase ===
        "after-response",
      );
      if (firstAfterResponseIndex < 0) return [...current, action];

      return [
        ...current.slice(0, firstAfterResponseIndex),
        action,
        ...current.slice(firstAfterResponseIndex),
      ];
    });
  };

  const renderActionRows = (
    phase: RuleFlowActionPhase,
    phaseItems: MatchedActionItem[],
  ) => {
    if (phaseItems.length === 0) return null;
    if (readOnly) {
      return (
        <div className="flex flex-col gap-1.5">
          {phaseItems.map((item) => (
            <div
              className="rounded-lg bg-surface-raised px-2 py-2 text-body"
              key={item.id}
            >
              <ActionConfiguration
                action={item.action}
                onConfigChange={() => undefined}
                option={item.option}
                readOnly
              />
            </div>
          ))}
        </div>
      );
    }

    return (
      <SortableCollection<MatchedActionItem>
        className="border-0 bg-transparent p-0"
        dragHandlePosition="start"
        items={phaseItems}
        onItemsChange={(nextItems) => commitPhaseOrder(phase, nextItems)}
        renderActions={(item) => (
          <Button
            aria-label={labels.removeAction}
            className="hover:text-fg-danger"
            iconOnly
            onClick={() =>
              onChange((current) =>
                current.filter((action) => action.id !== item.id),
              )
            }
            size="md"
            type="button"
            variant="ghost"
          >
            <TrashIcon aria-hidden size={14} />
          </Button>
        )}
        renderContent={(item) => (
          <ActionConfiguration
            action={item.action}
            onConfigChange={(field, value) =>
              updateActionConfig(item.id, field, value)
            }
            option={item.option}
            readOnly={false}
          />
        )}
      />
    );
  };

  return (
    <>
      <CardContent className="px-3 pt-2" data-flow-control>
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border-subtle px-3 py-3 text-label text-fg-muted">
            {labels.emptyMatchedActions}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {renderActionRows("before-upstream", beforeItems)}
            {afterItems.length > 0 && (
              <div className="flex items-center gap-2 py-1 text-label text-fg-muted">
                <span className="h-px flex-1 bg-border-subtle" />
                <span className="shrink-0">{labels.actionPhaseDivider}</span>
                <span className="h-px flex-1 bg-border-subtle" />
              </div>
            )}
            {renderActionRows("after-response", afterItems)}
          </div>
        )}
      </CardContent>
      {!readOnly && (
        <CardFooter className="px-3 pb-3 pt-2" data-flow-control>
          <Select
            disabled={!enabled || options.length === 0}
            onValueChange={addAction}
            size="md"
            value=""
          >
            <SelectTrigger
              aria-label={labels.addMatchedAction}
              className="w-full min-w-0"
              placeholder={labels.addMatchedAction}
            />
            <SelectContent
              animated={false}
              className="min-w-56"
              data-flow-control
            >
              {options.map((action) => (
                <SelectItem key={action.value} value={action.value}>
                  {action.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardFooter>
      )}
    </>
  );
}

export function RuleFlowEditor({
  value: valueProp,
  defaultValue = defaultRuleFlow,
  onValueChange,
  triggers = defaultRuleFlowTriggers,
  fields = defaultRuleFlowFields,
  operators = defaultRuleFlowOperators,
  actions = defaultRuleFlowActions,
  errorActions = defaultRuleFlowErrorActions,
  labels: labelsProp,
  selectedNodeId: selectedNodeIdProp,
  defaultSelectedNodeId = null,
  onSelectedNodeIdChange,
  readOnly = false,
  minHeight,
  className,
  ...props
}: RuleFlowEditorProps) {
  const labels = useMemo(
    () => ({ ...defaultLabels, ...labelsProp }),
    [labelsProp],
  );
  const [internalValue, setInternalValue] = useState(defaultValue);
  const flow = valueProp ?? internalValue;
  const flowRef = useRef(flow);
  const [internalSelectedNodeId, setInternalSelectedNodeId] = useState<
    string | null
  >(defaultSelectedNodeId);
  const selectedNodeId =
    selectedNodeIdProp === undefined
      ? internalSelectedNodeId
      : selectedNodeIdProp;
  const canvasRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef(new Map<string, HTMLDivElement>());
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [canvasViewportHeight, setCanvasViewportHeight] = useState(0);
  const [nodeHeights, setNodeHeights] = useState<Record<string, number>>({});
  const [errorBranchRequested, setErrorBranchRequested] = useState(false);
  const TriggerIcon = useIcon("play");
  const ConditionIcon = useIcon("list-checks");
  const ActionIcon = useIcon("rocket");
  const MoveIcon = useIcon("doc-motion");

  useEffect(() => {
    flowRef.current = flow;
  }, [flow]);

  const commit = useCallback(
    (next: RuleFlowValue) => {
      flowRef.current = next;
      if (valueProp === undefined) setInternalValue(next);
      onValueChange?.(next);
    },
    [onValueChange, valueProp],
  );

  const selectNode = useCallback(
    (id: string | null) => {
      if (selectedNodeIdProp === undefined) setInternalSelectedNodeId(id);
      onSelectedNodeIdChange?.(id);
    },
    [onSelectedNodeIdChange, selectedNodeIdProp],
  );

  const updateFlow = useCallback(
    (update: (current: RuleFlowValue) => RuleFlowValue) => {
      commit(update(flowRef.current));
    },
    [commit],
  );

  const selectedTrigger = triggers.find(
    (trigger) => trigger.value === flow.trigger?.type,
  );
  const conditionsReady =
    flow.conditions.length > 0 &&
    flow.conditions.every(
      (condition) =>
        condition.field !== "" &&
        condition.operator !== "" &&
        condition.value !== "",
    );
  const outcomeEnabled = Boolean(flow.trigger) && conditionsReady;

  const compactLayout = canvasWidth > 0 && canvasWidth < 760;
  const drawingWidth = compactLayout
    ? Math.max(canvasWidth, minimumCompactCanvasWidth)
    : Math.max(canvasWidth, minimumCanvasWidth);
  const triggerLaneCenter = compactLayout
    ? drawingWidth / 2
    : canvasPadding + 340 / 2;
  const conditionLaneCenter = compactLayout
    ? drawingWidth / 2
    : canvasPadding + primaryCardWidth / 2;
  const actionLaneCenter = compactLayout
    ? drawingWidth / 2
    : canvasPadding + primaryCardWidth / 2;
  const errorLaneCenter = compactLayout
    ? drawingWidth / 2
    : canvasPadding +
      primaryCardWidth +
      branchCardGap +
      exceptionCardWidth / 2;
  const unmatchedLaneCenter = compactLayout
    ? drawingWidth / 2
    : drawingWidth - canvasPadding - unmatchedCardWidth / 2;
  const triggerLaneX = triggerLaneCenter / drawingWidth;
  const conditionLaneX = conditionLaneCenter / drawingWidth;
  const actionLaneX = actionLaneCenter / drawingWidth;
  const unmatchedLaneX = unmatchedLaneCenter / drawingWidth;
  const errorLaneX = errorLaneCenter / drawingWidth;
  const errorBranchVisible =
    errorBranchRequested || flow.outcomes.error.length > 0;
  const savedPosition = useCallback(
    (id: string, fallback: RuleFlowPosition) =>
      flow.layout?.nodePositions[id] ?? fallback,
    [flow.layout?.nodePositions],
  );
  const conditionTop = savedPosition("conditions", {
    x: conditionLaneX,
    y: 190,
  }).y;
  const branchTop =
    conditionTop + (nodeHeights.conditions ?? estimatedNodeHeight) + 112;
  const compactErrorTop = branchTop + actionRowGap;
  const compactUnmatchedTop = errorBranchVisible
    ? compactErrorTop + actionRowGap
    : branchTop + actionRowGap;
  const desktopUnmatchedTop = conditionTop;

  const matchedOptions = actions.filter(
    (action) => !action.branches || action.branches.includes("matched"),
  );
  const exceptionOptions = errorActions.filter(
    (action) => !action.branches || action.branches.includes("error"),
  );
  const configuredExceptionPolicyCount = exceptionOptions.filter((option) => {
    const action = flow.outcomes.error.find(
      (candidate) => candidate.type === option.value,
    );
    return (option.fields ?? []).some(
      (field) => actionConfigValue(action ?? { id: "", type: "" }, field) !== "",
    );
  }).length;

  const canvasNodes = useMemo(() => {
    const nodes: CanvasNode[] = [
      {
        id: "trigger",
        kind: "trigger",
        position: savedPosition("trigger", { x: triggerLaneX, y: 24 }),
        title: selectedTrigger?.label ?? labels.chooseTrigger,
        description:
          selectedTrigger?.description ?? labels.chooseTriggerDescription,
        width: 340,
        draggable: Boolean(flow.trigger),
      },
      {
        id: "conditions",
        kind: "condition",
        position: savedPosition("conditions", { x: conditionLaneX, y: 190 }),
        title: labels.matchAllConditions,
        description: labels.conditionsDescription,
        width: primaryCardWidth,
        draggable: Boolean(flow.trigger),
      },
    ];

    nodes.push({
      id: "matched-actions",
      kind: "matched-actions",
      position: savedPosition("matched-actions", {
        x: actionLaneX,
        y: branchTop,
      }),
      title: labels.matchedAction,
      description: labels.matchedActionsDescription,
      width: primaryCardWidth,
      draggable: Boolean(flow.trigger),
    });

    nodes.push({
      id: "unmatched-end",
      kind: "unmatched",
      position: {
        x: unmatchedLaneX,
        y: compactLayout ? compactUnmatchedTop : desktopUnmatchedTop,
      },
      title: labels.skipRule,
      description: labels.skipRuleDescription,
      width: unmatchedCardWidth,
      draggable: false,
    });

    if (errorBranchVisible) {
      nodes.push({
        id: "error-actions",
        kind: "error-actions",
        position: savedPosition("error-actions", {
          x: errorLaneX,
          y: compactLayout ? compactErrorTop : branchTop,
        }),
        title: labels.errorAction,
        description: labels.exceptionPoliciesDescription(
          configuredExceptionPolicyCount,
          exceptionOptions.length,
        ),
        width: exceptionCardWidth,
        draggable: true,
      });
    }

    return nodes;
  }, [
    branchTop,
    actionLaneX,
    compactErrorTop,
    compactLayout,
    compactUnmatchedTop,
    configuredExceptionPolicyCount,
    desktopUnmatchedTop,
    errorBranchVisible,
    errorLaneX,
    exceptionOptions,
    flow.outcomes.error,
    flow.trigger,
    labels,
    conditionLaneX,
    matchedOptions,
    savedPosition,
    selectedTrigger?.description,
    selectedTrigger?.label,
    triggerLaneX,
    unmatchedLaneX,
  ]);

  const canvasEdges = useMemo(() => {
    const edges: CanvasEdge[] = [
      {
        id: "trigger-conditions",
        from: "trigger",
        to: "conditions",
        enabled: Boolean(flow.trigger),
      },
      {
        id: "conditions-matched",
        from: "conditions",
        to: "matched-actions",
        branch: "matched",
        label: labels.matchedBranch,
        enabled: outcomeEnabled,
      },
      {
        id: "conditions-unmatched",
        from: "conditions",
        to: "unmatched-end",
        branch: "unmatched",
        label: labels.unmatchedBranch,
        enabled: outcomeEnabled,
      },
    ];

    if (errorBranchVisible) {
      edges.push({
        id: "conditions-error",
        from: "conditions",
        to: "error-actions",
        branch: "error",
        label: labels.errorBranch,
        enabled: outcomeEnabled,
      });
    }
    return edges;
  }, [
    errorBranchVisible,
    flow.trigger,
    labels,
    outcomeEnabled,
  ]);

  const nodeKey = canvasNodes.map((node) => node.id).join("|");

  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const measure = () => {
      setCanvasWidth(canvas.clientWidth);
      setCanvasViewportHeight(canvas.clientHeight);
      setNodeHeights((current) => {
        const next = { ...current };
        let changed = false;
        nodeRefs.current.forEach((element, id) => {
          const height = element.offsetHeight;
          if (height && height !== next[id]) {
            next[id] = height;
            changed = true;
          }
        });
        return changed ? next : current;
      });
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(canvas);
    nodeRefs.current.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [nodeKey]);

  const nodeWidthFor = useCallback(
    (node: CanvasNode) =>
      Math.min(node.width, Math.max(drawingWidth - canvasPadding * 2, 1)),
    [drawingWidth],
  );

  const visualTops = useMemo(() => {
    const placed: Array<{
      left: number;
      right: number;
      top: number;
      bottom: number;
    }> = [];
    const tops = new Map<string, number>();
    const orderedNodes = [...canvasNodes].sort(
      (left, right) => left.position.y - right.position.y,
    );

    for (const node of orderedNodes) {
      const nodeWidth = nodeWidthFor(node);
      const centerX = clamp(
        node.position.x * drawingWidth,
        nodeWidth / 2 + canvasPadding,
        drawingWidth - nodeWidth / 2 - canvasPadding,
      );
      const left = centerX - nodeWidth / 2;
      const right = centerX + nodeWidth / 2;
      const height = nodeHeights[node.id] ?? estimatedNodeHeight;
      let top = Math.max(canvasPadding, node.position.y);

      if (!compactLayout && node.id === "unmatched-end") {
        const conditionVisualTop = tops.get("conditions");
        if (conditionVisualTop !== undefined) {
          top =
            conditionVisualTop +
            ((nodeHeights.conditions ?? estimatedNodeHeight) - height) / 2;
        }
      }

      for (const previous of placed) {
        const overlapsHorizontally =
          left < previous.right + canvasPadding &&
          right > previous.left - canvasPadding;
        if (overlapsHorizontally) {
          top = Math.max(top, previous.bottom + nodeCollisionGap);
        }
      }

      tops.set(node.id, top);
      placed.push({ left, right, top, bottom: top + height });
    }

    return tops;
  }, [canvasNodes, compactLayout, drawingWidth, nodeHeights, nodeWidthFor]);

  const placedNode = useCallback(
    (node: CanvasNode) => {
      const nodeWidth = nodeWidthFor(node);
      const centerX = clamp(
        node.position.x * drawingWidth,
        nodeWidth / 2 + canvasPadding,
        drawingWidth - nodeWidth / 2 - canvasPadding,
      );
      return {
        centerX,
        nodeWidth,
        top: visualTops.get(node.id) ?? node.position.y,
      };
    },
    [drawingWidth, nodeWidthFor, visualTops],
  );

  const contentHeight = Math.max(
    0,
    ...canvasNodes.map(
      (node) =>
        (visualTops.get(node.id) ?? node.position.y) +
        (nodeHeights[node.id] ?? estimatedNodeHeight) +
        canvasPadding,
    ),
  );
  const drawingHeight = Math.max(
    canvasViewportHeight,
    contentHeight,
    minHeight ?? 560,
  );

  const dragRef = useRef<{
    id: string;
    pointerId: number;
    startClientX: number;
    startClientY: number;
    startPosition: RuleFlowPosition;
  } | null>(null);

  const moveNode = useCallback(
    (nodeId: string, deltaX: number, deltaY: number) => {
      const node = canvasNodes.find((candidate) => candidate.id === nodeId);
      if (!node?.draggable) return;
      const { nodeWidth } = placedNode(node);
      const minimumX = (nodeWidth / 2 + canvasPadding) / drawingWidth;
      const maximumX =
        (drawingWidth - nodeWidth / 2 - canvasPadding) / drawingWidth;
      const currentPosition =
        flowRef.current.layout?.nodePositions[nodeId] ?? node.position;
      updateFlow((current) => ({
        ...current,
        layout: {
          nodePositions: {
            ...current.layout?.nodePositions,
            [nodeId]: {
              x: clamp(
                currentPosition.x + deltaX / drawingWidth,
                minimumX,
                maximumX,
              ),
              y: Math.max(
                canvasPadding,
                (visualTops.get(nodeId) ?? currentPosition.y) + deltaY,
              ),
            },
          },
        },
      }));
    },
    [canvasNodes, drawingWidth, placedNode, updateFlow, visualTops],
  );

  const beginDrag =
    (node: CanvasNode) => (event: PointerEvent<HTMLElement>) => {
      if (readOnly || !node.draggable) return;
      const target = event.target as HTMLElement;
      const explicitHandle = target.closest("[data-flow-drag-handle]");
      if (target.closest("[data-flow-control]") && !explicitHandle) return;
      if (
        event.pointerType === "touch" &&
        !target.closest("[data-flow-drag-region]")
      ) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      selectNode(node.id);
      dragRef.current = {
        id: node.id,
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        startPosition:
          flowRef.current.layout?.nodePositions[node.id] ?? node.position,
      };
      event.currentTarget.setPointerCapture?.(event.pointerId);
    };

  const continueDrag = (event: PointerEvent<HTMLElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const node = canvasNodes.find((candidate) => candidate.id === drag.id);
    if (!node) return;
    const { nodeWidth } = placedNode(node);
    const minimumX = (nodeWidth / 2 + canvasPadding) / drawingWidth;
    const maximumX =
      (drawingWidth - nodeWidth / 2 - canvasPadding) / drawingWidth;
    updateFlow((current) => ({
      ...current,
      layout: {
        nodePositions: {
          ...current.layout?.nodePositions,
          [drag.id]: {
            x: clamp(
              drag.startPosition.x +
                (event.clientX - drag.startClientX) / drawingWidth,
              minimumX,
              maximumX,
            ),
            y: Math.max(
              canvasPadding,
              drag.startPosition.y + event.clientY - drag.startClientY,
            ),
          },
        },
      },
    }));
  };

  const endDrag = (event: PointerEvent<HTMLElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
    }
  };

  const moveNodeWithKeyboard =
    (node: CanvasNode) => (event: KeyboardEvent<HTMLButtonElement>) => {
      if (
        readOnly ||
        !node.draggable ||
        !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
          event.key,
        )
      ) {
        return;
      }
      event.preventDefault();
      selectNode(node.id);
      const distance = event.shiftKey ? 40 : 12;
      moveNode(
        node.id,
        event.key === "ArrowLeft"
          ? -distance
          : event.key === "ArrowRight"
            ? distance
            : 0,
        event.key === "ArrowUp"
          ? -distance
          : event.key === "ArrowDown"
            ? distance
            : 0,
      );
    };

  const nodeById = useMemo(
    () => new Map(canvasNodes.map((node) => [node.id, node])),
    [canvasNodes],
  );
  const renderedEdges = canvasEdges.flatMap((edge) => {
    const fromNode = nodeById.get(edge.from);
    const toNode = nodeById.get(edge.to);
    if (!fromNode || !toNode) return [];
    const from = placedNode(fromNode);
    const to = placedNode(toNode);
    const exceptionNode = nodeById.get("error-actions");
    const exception = exceptionNode ? placedNode(exceptionNode) : null;
    const sourceHeight = nodeHeights[fromNode.id] ?? estimatedNodeHeight;
    const targetHeight = nodeHeights[toNode.id] ?? estimatedNodeHeight;
    const startsFromConditionBottomCenter =
      edge.branch === "error" && edge.from === "conditions";
    const startsFromConditionRightCenter =
      edge.branch === "unmatched" && edge.from === "conditions";
    const start = {
      x: startsFromConditionRightCenter
        ? from.centerX + from.nodeWidth / 2
        : startsFromConditionBottomCenter
          ? from.centerX
          : from.centerX - from.nodeWidth / 2 + edgeAnchorInset,
      y: startsFromConditionRightCenter
        ? from.top + sourceHeight / 2
        : from.top + sourceHeight,
    };
    const end = {
      x:
        startsFromConditionRightCenter
          ? to.centerX - to.nodeWidth / 2
          : to.centerX - to.nodeWidth / 2 + edgeAnchorInset,
      y: startsFromConditionRightCenter
        ? to.top + targetHeight / 2
        : to.top + kindLabelOffset,
    };
    const routesUnmatchedDirectly =
      startsFromConditionRightCenter && !compactLayout;
    const routesAroundCompactCards =
      compactLayout &&
      edge.from === "conditions" &&
      edge.branch === "error";
    const outerRightRailX = drawingWidth - canvasPadding / 2;
    const railX = startsFromConditionRightCenter
      ? exception
        ? Math.min(
            outerRightRailX,
            Math.max(
              end.x,
              start.x + branchCardGap / 2,
              exception.centerX + exception.nodeWidth / 2 + branchCardGap / 2,
            ),
          )
        : end.x
      : outerRightRailX;
    const isVertical = Math.abs(start.x - end.x) < 0.5;
    const verticalDirection = end.y >= start.y ? 1 : -1;
    const turnDistance = Math.min(
      Math.abs(end.y - start.y) / 2,
      edge.branch === "error" ? 72 : 48,
    );
    const turnY = start.y + verticalDirection * turnDistance;
    const compactApproachY = end.y - verticalDirection * 24;
    const path = routesUnmatchedDirectly
      ? `M ${start.x} ${start.y} H ${end.x}`
      : startsFromConditionRightCenter
      ? `M ${start.x} ${start.y} H ${railX} V ${end.y} H ${end.x}`
      : routesAroundCompactCards
        ? `M ${start.x} ${start.y} V ${turnY} H ${railX} V ${compactApproachY} H ${end.x} V ${end.y}`
        : isVertical
          ? `M ${start.x} ${start.y} V ${end.y}`
          : `M ${start.x} ${start.y} V ${turnY} H ${end.x} V ${end.y}`;
    return [
      {
        edge,
        path,
        labelX: routesUnmatchedDirectly
          ? (start.x + end.x) / 2
          : startsFromConditionRightCenter
            ? (start.x + railX) / 2
          : isVertical
            ? start.x
            : (start.x + end.x) / 2,
        labelY: startsFromConditionRightCenter
          ? start.y
          : isVertical
            ? (start.y + end.y) / 2
            : turnY,
      },
    ];
  });

  const kindMeta = {
    trigger: {
      badge: labels.trigger,
      color: "blue" as const,
      Icon: TriggerIcon,
      iconClass: "bg-info-surface text-fg-brand",
    },
    condition: {
      badge: labels.condition,
      color: "amber" as const,
      Icon: ConditionIcon,
      iconClass: "bg-warning-surface text-fg-warning",
    },
    "matched-actions": {
      badge: labels.matchedAction,
      color: "green" as const,
      Icon: ActionIcon,
      iconClass: "bg-success-surface text-fg-success",
    },
    "error-actions": {
      badge: labels.errorAction,
      color: "red" as const,
      Icon: ActionIcon,
      iconClass: "bg-danger-surface text-fg-danger",
    },
    unmatched: {
      badge: labels.unmatched,
      color: "gray" as const,
      Icon: ConditionIcon,
      iconClass: "bg-surface-raised text-fg-muted",
    },
  };

  return (
    <section
      aria-label={labels.ariaLabel}
      className={cn("h-full min-h-0 w-full min-w-0", className)}
      data-slot="rule-flow-editor"
      {...props}
    >
      <div
        className="relative h-full min-h-0 w-full overflow-auto rounded-xl border border-border-subtle bg-surface-base"
        ref={canvasRef}
        style={{
          minHeight,
          backgroundImage:
            "radial-gradient(var(--border) 1px, transparent 1px)",
          backgroundPosition: "center",
          backgroundSize: "22px 22px",
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none opacity-0"
          style={{ height: drawingHeight, width: drawingWidth }}
        />

        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0"
          height={drawingHeight}
          width={drawingWidth}
        >
          {renderedEdges.map(({ edge, path }) => {
            const active =
              selectedNodeId === edge.from || selectedNodeId === edge.to;
            return (
              <path
                className="transition-[stroke,stroke-width,opacity] duration-fast"
                data-edge-id={edge.id}
                d={path}
                fill="none"
                key={edge.id}
                opacity={edge.enabled ? 1 : 0.38}
                stroke={
                  edge.branch === "error"
                    ? "var(--danger-border)"
                    : active
                      ? "var(--brand)"
                      : "var(--border)"
                }
                strokeDasharray={edge.branch === "error" ? "5 5" : undefined}
                strokeWidth={active ? 1.75 : 1.25}
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>

        {renderedEdges.map(({ edge, labelX, labelY }) =>
          edge.label && (!compactLayout || edge.branch === "matched") ? (
            <Badge
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
              color={
                edge.branch === "error"
                  ? "red"
                  : edge.branch === "matched"
                    ? "green"
                    : "gray"
              }
              key={`${edge.id}-label`}
              size="sm"
              style={{ left: labelX, opacity: edge.enabled ? 1 : 0.55, top: labelY }}
            >
              {edge.label}
            </Badge>
          ) : null,
        )}

        {canvasNodes.map((node) => {
          const { centerX, nodeWidth, top } = placedNode(node);
          const meta = kindMeta[node.kind];
          const primaryFlowBadge =
            node.kind === "condition" || node.kind === "matched-actions";
          const selected = selectedNodeId === node.id;
          const cardDisabled =
            (node.kind === "condition" && !flow.trigger) ||
            (node.kind === "matched-actions" && !outcomeEnabled) ||
            (node.kind === "error-actions" && !outcomeEnabled);

          return (
            <div
              className="absolute flex -translate-x-1/2 flex-col items-start gap-1.5"
              key={node.id}
              onFocusCapture={() => selectNode(node.id)}
              ref={(element) => {
                if (element) nodeRefs.current.set(node.id, element);
                else nodeRefs.current.delete(node.id);
              }}
              style={{
                left: centerX,
                top,
                width: nodeWidth,
                zIndex: selected ? 2 : 1,
              }}
            >
              <Badge
                color={primaryFlowBadge ? primaryFlowBadgeColor : meta.color}
                size="sm"
                variant={primaryFlowBadge ? "strong" : "solid"}
              >
                {meta.badge}
              </Badge>
              <Card
                className={cn(
                  "w-full border-[0.5px] bg-surface-floating shadow-raised transition-[border-color,box-shadow,opacity] duration-fast [&_[data-flow-control]]:cursor-auto [&_[data-flow-control]]:select-text",
                  node.draggable &&
                    !readOnly &&
                    "cursor-grab select-none active:cursor-grabbing",
                  node.kind === "condition" ||
                  node.kind === "matched-actions" ||
                  node.kind === "error-actions"
                    ? "pb-0"
                    : "pb-3",
                  cardDisabled && "opacity-60",
                  selected
                    ? "border-brand shadow-floating [&>[aria-hidden]]:bg-surface-floating"
                    : "border-border-subtle",
                )}
                label={labels.selectNode(node.title)}
                onClick={
                  node.kind === "unmatched"
                    ? () => selectNode(node.id)
                    : undefined
                }
                onLostPointerCapture={endDrag}
                onPointerCancel={endDrag}
                onPointerDown={beginDrag(node)}
                onPointerMove={continueDrag}
                onPointerUp={endDrag}
                selected={selected}
              >
                <CardHeader
                  className="touch-none gap-y-0 px-3 pt-3"
                  data-flow-drag-region
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span
                      className={cn(
                        "grid size-9 shrink-0 place-items-center rounded-lg",
                        meta.iconClass,
                      )}
                    >
                      <meta.Icon aria-hidden size={18} strokeWidth={1.5} />
                    </span>
                    <span className="min-w-0">
                      <CardTitle className="block truncate">
                        {node.title}
                      </CardTitle>
                      {node.description && (
                        <CardDescription className="mt-0.5 line-clamp-2 text-label">
                          {node.description}
                        </CardDescription>
                      )}
                    </span>
                  </div>
                  {!readOnly &&
                    node.draggable &&
                    node.kind !== "condition" && (
                      <CardAction
                        className="flex items-center gap-1"
                        data-flow-control
                      >
                        <Button
                          aria-label={labels.moveNode(node.title)}
                          className="cursor-grab touch-none active:cursor-grabbing"
                          data-flow-drag-handle
                          iconOnly
                          onKeyDown={moveNodeWithKeyboard(node)}
                          size="md"
                          title={labels.moveNode(node.title)}
                          type="button"
                          variant="ghost"
                        >
                          <MoveIcon aria-hidden size={15} />
                        </Button>
                      </CardAction>
                    )}
                </CardHeader>

                {node.kind === "trigger" && (
                  <CardContent className="px-3 pt-3" data-flow-control>
                    <Select
                      disabled={readOnly || triggers.length === 0}
                      onValueChange={(triggerType) =>
                        updateFlow((current) => ({
                          ...current,
                          trigger: { type: triggerType },
                        }))
                      }
                      size="md"
                      value={flow.trigger?.type ?? ""}
                    >
                      <SelectTrigger
                        aria-label={labels.chooseTrigger}
                        className="w-full min-w-0"
                        placeholder={labels.chooseTrigger}
                      />
                      <SelectContent
                        animated={false}
                        className="min-w-64"
                        data-flow-control
                      >
                        {triggers.map((trigger) => (
                          <SelectItem key={trigger.value} value={trigger.value}>
                            {trigger.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                )}

                {node.kind === "condition" && (
                  <ConditionEditor
                    conditions={flow.conditions}
                    enabled={Boolean(flow.trigger)}
                    errorBranchAvailable={exceptionOptions.length > 0}
                    errorBranchVisible={errorBranchVisible}
                    fields={fields}
                    labels={labels}
                    onChange={(update) =>
                      updateFlow((current) => ({
                        ...current,
                        conditions: update(current.conditions),
                      }))
                    }
                    onShowErrorBranch={() => setErrorBranchRequested(true)}
                    operators={operators}
                    readOnly={readOnly}
                  />
                )}

                {node.kind === "matched-actions" && (
                  <MatchedActionsEditor
                    actions={flow.outcomes.matched}
                    enabled={outcomeEnabled}
                    labels={labels}
                    onChange={(update) =>
                      updateFlow((current) => ({
                        ...current,
                        outcomes: {
                          ...current.outcomes,
                          matched: update(current.outcomes.matched),
                        },
                      }))
                    }
                    options={matchedOptions}
                    readOnly={readOnly}
                  />
                )}

                {node.kind === "error-actions" && (
                  <ExceptionPoliciesEditor
                    actions={flow.outcomes.error}
                    enabled={outcomeEnabled}
                    labels={labels}
                    onChange={(update) =>
                      updateFlow((current) => ({
                        ...current,
                        outcomes: {
                          ...current.outcomes,
                          error: update(current.outcomes.error),
                        },
                      }))
                    }
                    options={exceptionOptions}
                    readOnly={readOnly}
                  />
                )}
              </Card>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export type { RuleFlowEditorProps };
