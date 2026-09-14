"use client";

import {
  useMemo,
  useState,
  type FormEvent,
} from "react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@zeron/ui/select";
import { Tooltip } from "@zeron/ui/tooltip";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { useDialogFocus } from "./use-dialog-focus";
import {
  capabilityIds,
  gatewayModels,
  guardActions,
  guardTemplates,
  limitPolicyOptions,
  trafficLabelDisabledReason,
} from "./gateway-policy-data";

import {
  actionTypes,
  afterActionTypes,
  conditionComplete,
  conditionDefinitions,
  conditionGroups,
  conditionSummary,
  createCondition,
  definitionMap,
  hydrateActions,
  hydrateConditions,
  newId,
  type ActionItem,
  type ConditionGroupId,
  type ConditionItem,
  type ConditionKind,
  type RuleFormValue,
} from "./rule-config";

export type { RuleFormValue } from "./rule-config";

const fieldClass =
  "h-9 w-full rounded-lg border border-black/[0.12] bg-white px-2.5 text-[13px] text-[#00030a] outline-none transition-[border-color,box-shadow] placeholder:text-black/35 hover:border-black/25 focus:border-focus-ring focus:ring-1 focus:ring-focus-ring";
const primaryClass =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#00030a] px-3 text-[14px] text-white transition-colors hover:bg-[#20242b] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-40";
const secondaryClass =
  "inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-black/[0.12] bg-white px-3 text-[14px] transition-colors hover:border-black/20 hover:bg-[#f6f8fb] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus-ring";
const iconButtonClass =
  "grid size-8 shrink-0 place-items-center rounded-lg text-black/45 transition-colors hover:bg-black/[0.05] hover:text-black/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus-ring disabled:cursor-not-allowed disabled:opacity-25";

type SelectFieldOption = string | { label: string; value: string };

function SelectField({
  ariaLabel,
  className,
  defaultValue,
  onValueChange,
  options,
  placeholder = "请选择",
  value,
}: {
  ariaLabel: string;
  className?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  options: SelectFieldOption[];
  placeholder?: string;
  value?: string;
}) {
  return (
    <Select defaultValue={defaultValue} itemDensity="compact" onValueChange={onValueChange} size="md" value={value}>
      <SelectTrigger aria-label={ariaLabel} className="w-full min-w-0" placeholder={placeholder} wrapperClassName={cn("w-full min-w-0", className)} />
      <SelectContent>
        {options.map((option) => {
          const item = typeof option === "string" ? { label: option, value: option } : option;
          return <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>;
        })}
      </SelectContent>
    </Select>
  );
}

function SectionHeading({
  count,
  description,
  required,
  title,
}: {
  count?: number;
  description: string;
  required?: boolean;
  title: string;
}) {
  return (
    <div className="mb-3 flex items-start justify-between gap-4">
      <div>
        <h3 className="text-[14px] font-semibold leading-5">
          {title} {required ? <span className="text-[#b0140c]">*</span> : null}
        </h3>
        <p className="mt-0.5 text-[12px] leading-5 text-black/50">{description}</p>
      </div>
      {count !== undefined ? (
        <span className="mt-0.5 shrink-0 rounded-md bg-[#eef4ff] px-2 py-1 text-[11px] font-medium text-[#075fce]">
          {count} 项
        </span>
      ) : null}
    </div>
  );
}

function ValueControl({
  ariaLabel,
  onChange,
  options,
  placeholder,
  value,
}: {
  ariaLabel: string;
  onChange: (value: string) => void;
  options?: string[];
  placeholder: string;
  value: string;
}) {
  if (options) {
    return (
      <SelectField
        ariaLabel={ariaLabel}
        onValueChange={onChange}
        options={options}
        placeholder={placeholder}
        value={value}
      />
    );
  }

  return (
    <input
      aria-label={ariaLabel}
      className={fieldClass}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      value={value}
    />
  );
}

export function ConditionEditor({
  condition,
  onChange,
}: {
  condition: ConditionItem;
  onChange: (next: ConditionItem) => void;
}) {
  const definition = definitionMap.get(condition.kind)!;
  const needsSecondary = Boolean(definition.secondaryLabel && condition.operator !== "存在");

  return (
    <div className="grid gap-3 border-t border-black/[0.08] bg-[#fbfcfe] px-4 py-4 sm:grid-cols-[132px_minmax(0,1fr)]">
      <label className="block text-[11px] font-medium text-black/55">
        运算符
        <SelectField
          ariaLabel={`${definition.label}运算符`}
          className="mt-1"
          onValueChange={(operator) => onChange({ ...condition, operator })}
          options={definition.operators}
          value={condition.operator}
        />
      </label>
      <div className={cn("grid gap-3", needsSecondary && "md:grid-cols-2")}>
        <label className="block text-[11px] font-medium text-black/55">
          {definition.primaryLabel}
          <span className="mt-1 block">
            <ValueControl
              ariaLabel={definition.primaryLabel}
              onChange={(primary) => onChange({ ...condition, primary })}
              options={definition.primaryOptions}
              placeholder={definition.primaryPlaceholder}
              value={condition.primary}
            />
          </span>
        </label>
        {needsSecondary ? (
          <label className="block text-[11px] font-medium text-black/55">
            {definition.secondaryLabel}
            <span className="mt-1 block">
              <ValueControl
                ariaLabel={definition.secondaryLabel!}
                onChange={(secondary) => onChange({ ...condition, secondary })}
                options={definition.secondaryOptions}
                placeholder={definition.secondaryPlaceholder!}
                value={condition.secondary ?? ""}
              />
            </span>
          </label>
        ) : null}
      </div>
    </div>
  );
}

function ConditionRow({
  condition,
  editing,
  onChange,
  onEdit,
  onRemove,
}: {
  condition: ConditionItem;
  editing: boolean;
  onChange: (next: ConditionItem) => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const Chevron = useIcon("chevron-down");
  const Trash = useIcon("trash");
  const definition = definitionMap.get(condition.kind)!;
  const complete = conditionComplete(condition);

  return (
    <div className={cn("border-t border-black/[0.08] first:border-t-0", editing && "bg-[#fbfcfe]")}>
      <div className="flex min-h-12 items-stretch gap-1 px-2 py-1.5 sm:px-3">
        <button
          aria-expanded={editing}
          className="grid min-w-0 flex-1 items-center gap-1 rounded-lg px-2 py-1.5 text-left hover:bg-black/[0.025] sm:grid-cols-[136px_minmax(0,1fr)_20px] sm:gap-3"
          onClick={onEdit}
          type="button"
        >
          <span className="text-[12px] font-medium text-[#00030a]">{definition.label}</span>
          <span className={cn("min-w-0 truncate text-[12px]", complete ? "text-black/60" : "text-[#9a5b00]")}>
            {conditionSummary(condition)}
          </span>
          <Chevron className={cn("hidden size-4 text-black/35 transition-transform sm:block", editing && "rotate-180")} />
        </button>
        <button
          aria-label={`删除条件：${definition.label}`}
          className={iconButtonClass}
          onClick={onRemove}
          type="button"
        >
          <Trash className="size-4" />
        </button>
      </div>
      {editing ? <ConditionEditor condition={condition} onChange={onChange} /> : null}
    </div>
  );
}

function ConditionGroup({
  conditions,
  group,
  onConditionChange,
  onEdit,
  onOpenChange,
  onRemove,
  open,
  editingId,
}: {
  conditions: ConditionItem[];
  group: (typeof conditionGroups)[number];
  onConditionChange: (next: ConditionItem) => void;
  onEdit: (id: string | null) => void;
  onOpenChange: () => void;
  onRemove: (id: string) => void;
  open: boolean;
  editingId: string | null;
}) {
  const Chevron = useIcon("chevron-down");
  const GroupIcon = useIcon(group.icon);

  return (
    <section className="overflow-hidden rounded-xl border border-black/[0.10] bg-white">
      <button
        aria-expanded={open}
        className="flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-[#fbfcfe]"
        onClick={onOpenChange}
        type="button"
      >
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-[#eef3fb] text-[#29486d]">
          <GroupIcon className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-[13px] font-semibold">
            {group.label}
            <span className="rounded-md bg-black/[0.045] px-1.5 py-0.5 text-[10px] font-medium text-black/50">
              {conditions.length}
            </span>
          </span>
          <span className="block truncate text-[11px] leading-4 text-black/45">{group.description}</span>
        </span>
        <Chevron className={cn("size-4 text-black/35 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        conditions.length ? (
          <div className="border-t border-black/[0.08]">
            {conditions.map((condition) => (
              <ConditionRow
                condition={condition}
                editing={editingId === condition.id}
                key={condition.id}
                onChange={onConditionChange}
                onEdit={() => onEdit(editingId === condition.id ? null : condition.id)}
                onRemove={() => onRemove(condition.id)}
              />
            ))}
          </div>
        ) : (
          <p className="border-t border-black/[0.08] px-4 py-3 text-[12px] text-black/45">本组尚未添加条件</p>
        )
      ) : null}
    </section>
  );
}

export function AddConditionPanel({
  onAdd,
  onClose,
}: {
  onAdd: (kind: ConditionKind) => void;
  onClose: () => void;
}) {
  const Search = useIcon("search");
  const X = useIcon("x");
  const [query, setQuery] = useState("");
  const visibleDefinitions = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return conditionDefinitions;
    return conditionDefinitions.filter((definition) =>
      `${definition.label} ${definition.description}`.toLowerCase().includes(normalizedQuery),
    );
  }, [query]);

  return (
    <div className="rounded-xl border border-[#0878ff]/25 bg-white p-3 shadow-[0_12px_30px_rgba(22,48,82,0.10)]">
      <div className="flex items-center gap-2">
        <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border border-black/[0.12] px-2.5 focus-within:border-focus-ring focus-within:ring-1 focus-within:ring-focus-ring">
          <Search className="size-4 shrink-0 text-black/35" />
          <span className="sr-only">搜索条件</span>
          <input
            autoFocus
            className="min-w-0 flex-1 bg-transparent text-[13px] outline-none placeholder:text-black/35"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索条件，例如请求头、模型或 CIDR"
            value={query}
          />
        </label>
        <button aria-label="关闭条件选择" className={iconButtonClass} onClick={onClose} type="button">
          <X className="size-4" />
        </button>
      </div>
      {visibleDefinitions.length ? (
        <div className="mt-3 grid gap-1 sm:grid-cols-2">
          {visibleDefinitions.map((definition) => {
            const group = conditionGroups.find((item) => item.id === definition.group)!;
            const optionClass = "flex min-h-14 items-center gap-3 rounded-lg px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-focus-ring";
            const optionContent = <>
              <span className="min-w-0 flex-1">
                <span className="block text-[12px] font-medium">{definition.label}</span>
                <span className="block truncate text-[11px] text-black/45">{definition.description}</span>
              </span>
              <span className="shrink-0 rounded-md bg-black/[0.045] px-1.5 py-0.5 text-[10px] text-black/50">
                {definition.kind === "traffic-label" ? "仅存量" : group.label}
              </span>
            </>;
            if (definition.kind === "traffic-label") {
              return (
                <Tooltip className="max-w-[280px] whitespace-normal text-left leading-5" content={trafficLabelDisabledReason} key={definition.kind} side="top">
                  <div
                    aria-label={`流量标签不可用：${trafficLabelDisabledReason}`}
                    className={cn(optionClass, "cursor-not-allowed opacity-50")}
                    role="button"
                    tabIndex={0}
                    title={trafficLabelDisabledReason}
                  >
                    {optionContent}
                  </div>
                </Tooltip>
              );
            }
            return (
              <button
                className={cn(optionClass, "hover:bg-[#f1f3f9]")}
                key={definition.kind}
                onClick={() => onAdd(definition.kind)}
                type="button"
              >
                {optionContent}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="py-6 text-center text-[12px] text-black/45">没有找到匹配的条件</p>
      )}
    </div>
  );
}

export function ActionParameters({
  action,
  onChange,
}: {
  action: ActionItem;
  onChange: (next: ActionItem) => void;
}) {
  if (action.type === "拒绝本次调用") {
    return <ValueControl ariaLabel="原因代码" onChange={(primary) => onChange({ ...action, primary })} placeholder="例如 policy_access_denied" value={action.primary ?? ""} />;
  }

  if (action.type === "转发到") {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        <ValueControl ariaLabel="转发目标" onChange={(primary) => onChange({ ...action, primary })} options={[...gatewayModels]} placeholder="请选择网关模型" value={action.primary ?? ""} />
        <ValueControl ariaLabel="分流策略" onChange={(secondary) => onChange({ ...action, secondary })} options={["weightedHash", "weightedRoundRobin"]} placeholder="请选择分流策略" value={action.secondary ?? ""} />
      </div>
    );
  }

  if (action.type === "内容检测（护栏）") {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        <ValueControl
          ariaLabel="检测模板"
          onChange={(primary) => onChange({ ...action, primary })}
          options={[...guardTemplates]}
          placeholder="请选择检测模板"
          value={action.primary ?? ""}
        />
        <ValueControl
          ariaLabel="命中后的处理"
          onChange={(secondary) => onChange({ ...action, secondary })}
          options={[...guardActions]}
          placeholder="请选择处理方式"
          value={action.secondary ?? ""}
        />
      </div>
    );
  }

  if (action.type === "应用限额") {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        <ValueControl
          ariaLabel="限额策略"
          onChange={(primary) => onChange({ ...action, primary })}
          options={[...limitPolicyOptions]}
          placeholder="请选择限额策略"
          value={action.primary ?? ""}
        />
        <ValueControl
          ariaLabel="超限处理"
          onChange={(secondary) => onChange({ ...action, secondary })}
          options={["拒绝（429）"]}
          placeholder="请选择超限处理"
          value={action.secondary ?? ""}
        />
      </div>
    );
  }

  if (action.type === "改写请求头" || action.type === "改写响应头") {
    return (
      <div className="grid gap-2 sm:grid-cols-2">
        <ValueControl
          ariaLabel="Header 名称"
          onChange={(primary) => onChange({ ...action, primary })}
          placeholder="Header 名称"
          value={action.primary ?? ""}
        />
        <ValueControl
          ariaLabel="Header 值"
          onChange={(secondary) => onChange({ ...action, secondary })}
          placeholder="填写新的值"
          value={action.secondary ?? ""}
        />
      </div>
    );
  }

  if (["改写请求字段", "改写请求正文", "改写响应字段"].includes(action.type)) {
    return <div className="grid gap-2 sm:grid-cols-2"><ValueControl ariaLabel="改写操作" onChange={(primary) => onChange({ ...action, primary })} options={action.type === "改写响应字段" ? ["add", "set", "remove", "copy", "move", "project"] : ["add", "set", "remove", "copy", "move", "cast"]} placeholder="选择操作" value={action.primary ?? ""} /><ValueControl ariaLabel="JSON 指针" onChange={(secondary) => onChange({ ...action, secondary })} placeholder="例如 /metadata/region" value={action.secondary ?? ""} /></div>;
  }

  if (action.type === "改写失败时") return <ValueControl ariaLabel="改写失败处理" onChange={(primary) => onChange({ ...action, primary })} options={["reject", "passthrough"]} placeholder="请选择失败处理" value={action.primary ?? ""} />;
  if (action.type === "挂载插件") return <ValueControl ariaLabel="插件绑定 ID" onChange={(primary) => onChange({ ...action, primary })} placeholder="例如 plugin-binding-audit" value={action.primary ?? ""} />;
  if (action.type === "状态码映射") return <div className="grid gap-2 sm:grid-cols-2"><ValueControl ariaLabel="上游状态码" onChange={(primary) => onChange({ ...action, primary })} placeholder="例如 502,503,504" value={action.primary ?? ""} /><ValueControl ariaLabel="返回状态码" onChange={(secondary) => onChange({ ...action, secondary })} placeholder="例如 503" value={action.secondary ?? ""} /></div>;
  if (action.type === "镜像复制") return <div className="grid gap-2 sm:grid-cols-2"><ValueControl ariaLabel="镜像目标端点" onChange={(primary) => onChange({ ...action, primary })} options={[...capabilityIds]} placeholder="请选择能力端点" value={action.primary ?? ""} /><ValueControl ariaLabel="采样比例" onChange={(secondary) => onChange({ ...action, secondary })} placeholder="1–100%" value={action.secondary ?? ""} /></div>;
  if (action.type === "跳过意图识别") return <p className="text-[11px] leading-5 text-black/45">保存为 intentRecognition = disabled；仅允许路径、模型名和模型服务条件。</p>;
  if (action.type === "失败姿态") return <ValueControl ariaLabel="失败姿态" onChange={(primary) => onChange({ ...action, primary })} options={["deny", "allow"]} placeholder="请选择失败姿态" value={action.primary ?? ""} />;

  return (
    <ValueControl
      ariaLabel="上游失败条件"
      onChange={(primary) => onChange({ ...action, primary })}
      options={["上游状态码 500、502、503、504", "响应体指针 /error/code 等于 timeout"]}
      placeholder="请选择失败判定条件"
      value={action.primary ?? ""}
    />
  );
}

function ActionRow({
  action,
  canMoveDown,
  canMoveUp,
  onChange,
  onMove,
  onRemove,
}: {
  action: ActionItem;
  canMoveDown: boolean;
  canMoveUp: boolean;
  onChange: (next: ActionItem) => void;
  onMove: (direction: -1 | 1) => void;
  onRemove: () => void;
}) {
  const ArrowDown = useIcon("arrow-down");
  const ArrowUp = useIcon("arrow-up");
  const Trash = useIcon("trash");

  return (
    <div className="grid gap-3 border-t border-black/[0.08] px-3 py-3 first:border-t-0 sm:grid-cols-[40px_minmax(170px,0.8fr)_minmax(240px,1.2fr)_32px] sm:items-center">
      <div className="hidden grid-cols-2 gap-0.5 sm:grid sm:grid-cols-1">
        <button aria-label="上移动作" className="grid size-5 place-items-center rounded text-black/35 hover:bg-black/5 hover:text-black/70 disabled:opacity-20" disabled={!canMoveUp} onClick={() => onMove(-1)} type="button"><ArrowUp className="size-3" /></button>
        <button aria-label="下移动作" className="grid size-5 place-items-center rounded text-black/35 hover:bg-black/5 hover:text-black/70 disabled:opacity-20" disabled={!canMoveDown} onClick={() => onMove(1)} type="button"><ArrowDown className="size-3" /></button>
      </div>
      <SelectField
        ariaLabel="动作类型"
        onValueChange={(type) => {
          onChange({
            ...action,
            type,
            phase: afterActionTypes.has(type) ? "after" : "before",
            primary: "",
            secondary: "",
          });
        }}
        options={actionTypes}
        value={action.type}
      />
      <ActionParameters action={action} onChange={onChange} />
      <button aria-label={`删除动作：${action.type}`} className={iconButtonClass} onClick={onRemove} type="button"><Trash className="size-4" /></button>
    </div>
  );
}

function ActionGroup({
  actions,
  label,
  onChange,
  onMove,
  onRemove,
}: {
  actions: ActionItem[];
  label: string;
  onChange: (next: ActionItem) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onRemove: (id: string) => void;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-black/[0.10] bg-white">
      <header className="flex min-h-11 items-center justify-between bg-[#f6f8fb] px-4 py-2">
        <div>
          <h4 className="text-[12px] font-semibold">{label}</h4>
          <p className="text-[10px] leading-4 text-black/45">
            {label === "转发前执行" ? "在目标模型服务收到请求前" : "在网关收到上游响应后"}
          </p>
        </div>
        <span className="text-[11px] tabular-nums text-black/45">{actions.length} 项</span>
      </header>
      {actions.length ? (
        <div>
          {actions.map((action, index) => (
            <ActionRow
              action={action}
              canMoveDown={index < actions.length - 1}
              canMoveUp={index > 0}
              key={action.id}
              onChange={onChange}
              onMove={(direction) => onMove(action.id, direction)}
              onRemove={() => onRemove(action.id)}
            />
          ))}
        </div>
      ) : (
        <p className="px-4 py-3 text-[12px] text-black/45">此阶段没有动作</p>
      )}
    </section>
  );
}

function RuleSectionNav({ modal }: { modal?: boolean }) {
  const Check = useIcon("check");
  const items = [
    { href: "#rule-basic", label: "基本信息" },
    { href: "#rule-conditions", label: "条件因子" },
    { href: "#rule-actions", label: "处置动作" },
    { href: "#rule-exceptions", label: "异常处理" },
  ];

  return (
    <aside className={cn("hidden self-stretch border-r border-black/[0.08] bg-[#f7f9fc] lg:block", modal ? "w-[176px]" : "w-[196px]")}>
      <nav aria-label="规则表单章节" className="sticky top-0 space-y-1 p-4">
        <p className="mb-2 px-2 text-[11px] font-medium text-black/40">规则配置</p>
        {items.map((item, index) => (
          <a className="flex h-9 items-center gap-2 rounded-lg px-2 text-[12px] text-black/60 hover:bg-white hover:text-black" href={item.href} key={item.href}>
            <span className={cn("grid size-5 place-items-center rounded-md text-[10px] font-semibold", index === 1 ? "bg-[#0878ff] text-white" : "bg-white text-black/45")}>
              {index === 0 ? <Check className="size-3" /> : index + 1}
            </span>
            {item.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}

function RuleFormContent({
  actions,
  addPanelOpen,
  conditions,
  editingId,
  name,
  onActionsChange,
  onAddPanelOpenChange,
  onConditionsChange,
  onEditingIdChange,
  onNameChange,
  openGroups,
  onOpenGroupsChange,
}: {
  actions: ActionItem[];
  addPanelOpen: boolean;
  conditions: ConditionItem[];
  editingId: string | null;
  name: string;
  onActionsChange: (actions: ActionItem[]) => void;
  onAddPanelOpenChange: (open: boolean) => void;
  onConditionsChange: (conditions: ConditionItem[]) => void;
  onEditingIdChange: (id: string | null) => void;
  onNameChange: (name: string) => void;
  openGroups: Record<ConditionGroupId, boolean>;
  onOpenGroupsChange: (groups: Record<ConditionGroupId, boolean>) => void;
}) {
  const Plus = useIcon("plus");
  const beforeActions = actions.filter((action) => action.phase === "before");
  const afterActions = actions.filter((action) => action.phase === "after");

  const updateCondition = (next: ConditionItem) => {
    onConditionsChange(conditions.map((condition) => condition.id === next.id ? next : condition));
  };

  const updateAction = (next: ActionItem) => {
    onActionsChange(actions.map((action) => action.id === next.id ? next : action));
  };

  const moveAction = (id: string, direction: -1 | 1) => {
    const current = actions.find((action) => action.id === id);
    if (!current) return;
    const phaseActions = actions.filter((action) => action.phase === current.phase);
    const currentPhaseIndex = phaseActions.findIndex((action) => action.id === id);
    const target = phaseActions[currentPhaseIndex + direction];
    if (!target) return;
    const currentIndex = actions.findIndex((action) => action.id === current.id);
    const targetIndex = actions.findIndex((action) => action.id === target.id);
    const nextActions = [...actions];
    [nextActions[currentIndex], nextActions[targetIndex]] = [nextActions[targetIndex]!, nextActions[currentIndex]!];
    onActionsChange(nextActions);
  };

  return (
    <div className="min-w-0 flex-1 space-y-8 p-4 sm:p-6">
      <section id="rule-basic" className="scroll-mt-4">
        <SectionHeading description="使用能说明规则意图的名称，方便后续检索与审计。" required title="基本信息" />
        <label className="block text-[12px] font-medium">
          规则名称 <span className="text-[#b0140c]">*</span>
          <input
            className={cn(fieldClass, "mt-1.5")}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="例如：生产环境高优先级流量"
            required
            value={name}
          />
        </label>
      </section>

      <section id="rule-conditions" className="scroll-mt-4">
        <SectionHeading
          count={conditions.length}
          description="先浏览规则摘要，需要修改时再展开单项。"
          required
          title="条件因子"
        />
        <div className="mb-3 flex flex-col gap-3 rounded-xl border border-black/[0.08] bg-[#f6f8fb] px-4 py-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-medium">条件关系</p>
            <p className="mt-0.5 text-[11px] text-black/45">请求需要满足这里定义的判断方式</p>
          </div>
          <p className="text-[12px] leading-5 text-black/45">全部条件均需满足（AND）</p>
        </div>
        <div className="space-y-3">
          {conditionGroups.map((group) => (
            <ConditionGroup
              conditions={conditions.filter((condition) => definitionMap.get(condition.kind)?.group === group.id)}
              editingId={editingId}
              group={group}
              key={group.id}
              onConditionChange={updateCondition}
              onEdit={onEditingIdChange}
              onOpenChange={() => onOpenGroupsChange({ ...openGroups, [group.id]: !openGroups[group.id] })}
              onRemove={(id) => {
                onConditionsChange(conditions.filter((condition) => condition.id !== id));
                if (editingId === id) onEditingIdChange(null);
              }}
              open={openGroups[group.id]}
            />
          ))}
          {addPanelOpen ? (
            <AddConditionPanel
              onAdd={(kind) => {
                const next = createCondition(kind);
                const group = definitionMap.get(kind)!.group;
                onConditionsChange([...conditions, next]);
                onOpenGroupsChange({ ...openGroups, [group]: true });
                onEditingIdChange(next.id);
                onAddPanelOpenChange(false);
              }}
              onClose={() => onAddPanelOpenChange(false)}
            />
          ) : (
            <button className={secondaryClass} onClick={() => onAddPanelOpenChange(true)} type="button">
              <Plus className="size-4" />添加条件
            </button>
          )}
        </div>
      </section>

      <section id="rule-actions" className="scroll-mt-4">
        <SectionHeading
          count={actions.length}
          description="动作会按列表顺序执行，并按请求生命周期分阶段展示。"
          required
          title="处置动作"
        />
        <div className="space-y-3">
          <ActionGroup actions={beforeActions} label="转发前执行" onChange={updateAction} onMove={moveAction} onRemove={(id) => onActionsChange(actions.filter((action) => action.id !== id))} />
          <ActionGroup actions={afterActions} label="收到响应后执行" onChange={updateAction} onMove={moveAction} onRemove={(id) => onActionsChange(actions.filter((action) => action.id !== id))} />
          <button
            className={secondaryClass}
            onClick={() => onActionsChange([
              ...actions,
              { id: newId("action"), type: "拒绝本次调用", phase: "before" },
            ])}
            type="button"
          >
            <Plus className="size-4" />添加动作
          </button>
        </div>
      </section>

      <section id="rule-exceptions" className="scroll-mt-4">
        <SectionHeading description="未命中和下游不可用时，使用稳定且可预期的兜底行为。" title="异常处理" />
        <div className="overflow-hidden rounded-xl border border-black/[0.10] bg-white">
          <div className="grid gap-1 border-b border-black/[0.08] px-4 py-3 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-center sm:gap-4">
            <span className="text-[12px] font-medium">条件不满足时</span>
            <span className="text-[12px] text-black/55">不做处理，交由下一条规则继续判定</span>
          </div>
          <div className="grid gap-3 bg-[#fbfcfe] px-4 py-3 sm:grid-cols-[160px_minmax(0,1fr)] sm:items-center sm:gap-4">
            <span className="text-[12px] font-medium">组件不可用时</span>
            <SelectField ariaLabel="组件不可用时的处理方式" defaultValue="放行" options={["放行", "拒绝本次调用", "转到兜底模型服务"]} />
          </div>
        </div>
      </section>
    </div>
  );
}

export function RuleForm({
  initial,
  modal,
  onCancel,
  onSave,
}: {
  initial?: RuleFormValue;
  modal?: boolean;
  onCancel: () => void;
  onSave: (rule: RuleFormValue) => void;
}) {
  const ArrowLeft = useIcon("arrow-left");
  const X = useIcon("x");
  const [name, setName] = useState(initial?.name ?? "");
  const [conditions, setConditions] = useState<ConditionItem[]>(() => hydrateConditions(initial));
  const [actions, setActions] = useState<ActionItem[]>(() => hydrateActions(initial));
  const [editingId, setEditingId] = useState<string | null>(() => initial ? null : "demo-header");
  const [addPanelOpen, setAddPanelOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<ConditionGroupId, boolean>>({
    request: true,
    identity: true,
    model: true,
  });
  const dialogRef = useDialogFocus(Boolean(modal), onCancel);

  const canSave = Boolean(name.trim() && conditions.length > 0 && actions.length > 0);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!canSave) return;
    const path = conditions.find((condition) => condition.kind === "path" && condition.primary.trim());
    onSave({
      id: initial?.id ?? `rule-${Date.now()}`,
      priority: initial?.priority ?? 1,
      name: name.trim(),
      matcher: path?.primary.trim() || "全部请求",
      enabled: initial?.enabled ?? false,
      conditions: conditions
        .filter((condition) => condition.kind !== "path")
        .map((condition) => `${definitionMap.get(condition.kind)!.label} · ${conditionSummary(condition)}`),
      actions: actions.map((action) => action.type),
    });
  };

  const content = (
    <form
      className={cn(
        "flex min-h-0 flex-col bg-white",
        modal ? "max-h-[calc(100svh-32px)]" : "min-h-[calc(100svh-56px)]",
      )}
      onSubmit={submit}
    >
      <header className="flex min-h-[68px] shrink-0 items-center justify-between gap-4 border-b border-black/[0.10] px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          {!modal ? (
            <button aria-label="返回规则详情" className={iconButtonClass} onClick={onCancel} type="button">
              <ArrowLeft className="size-4" />
            </button>
          ) : null}
          <div className="min-w-0">
            <h2 className="truncate text-[17px] font-semibold leading-6" id="rule-form-title">{modal ? "新建规则" : `编辑 ${initial?.name}`}</h2>
            <p className="truncate text-[11px] leading-4 text-black/45">将请求事实组合成一条清晰、可审计的流量规则</p>
          </div>
        </div>
        {modal ? (
          <button aria-label="关闭" className={iconButtonClass} onClick={onCancel} type="button"><X className="size-4" /></button>
        ) : (
          <div className="flex shrink-0 gap-2">
            <button className={secondaryClass} onClick={onCancel} type="button">取消</button>
            <button className={primaryClass} disabled={!canSave} type="submit">保存</button>
          </div>
        )}
      </header>
      <div className="flex min-h-0 flex-1 overflow-y-auto scroll-smooth">
        <RuleSectionNav modal={modal} />
        <RuleFormContent
          actions={actions}
          addPanelOpen={addPanelOpen}
          conditions={conditions}
          editingId={editingId}
          name={name}
          onActionsChange={setActions}
          onAddPanelOpenChange={setAddPanelOpen}
          onConditionsChange={setConditions}
          onEditingIdChange={setEditingId}
          onNameChange={setName}
          onOpenGroupsChange={setOpenGroups}
          openGroups={openGroups}
        />
      </div>
      {modal ? (
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-black/[0.10] bg-white px-4 py-3 sm:px-6">
          <p className="text-[11px] text-black/45">
            已添加 {conditions.length} 个条件 · {actions.length} 个动作
          </p>
          <div className="flex gap-2">
            <button className={secondaryClass} onClick={onCancel} type="button">取消</button>
            <button className={cn(primaryClass, "bg-[#0060d2] px-5 hover:bg-[#0757b8]")} disabled={!canSave} type="submit">保存规则</button>
          </div>
        </footer>
      ) : null}
    </form>
  );

  if (!modal) return <section className="min-h-[calc(100svh-56px)] overflow-hidden rounded-t-2xl border-[0.5px] border-black/[0.12] bg-white">{content}</section>;

  return (
    <div
      className="fixed inset-0 z-[60] grid place-items-center bg-[#00040d]/60 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div aria-labelledby="rule-form-title" aria-modal="true" className="w-full max-w-[960px] overflow-hidden rounded-2xl bg-white shadow-[0_24px_72px_rgba(0,0,0,0.24)]" ref={dialogRef} role="dialog" tabIndex={-1}>
        {content}
      </div>
    </div>
  );
}
