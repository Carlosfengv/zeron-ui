"use client";

import { Fragment } from "react";
import { Badge } from "@zeron/ui/badge";
import type { IconName } from "@zeron/ui/system/icon-context";
import type { RuleDetail } from "./rule-detail-model";
import { ruleSkipExplanation } from "./rule-config";
import { FlowConnector, WorkflowConditionBranch, WorkflowNode } from "./workflow-node";
import flowStyles from "./rule-workflow.module.css";

const paragraphClassName = "whitespace-pre-wrap text-body leading-6 [overflow-wrap:anywhere]";
const noteClassName = "mt-3 text-label leading-5 text-fg-subtle [overflow-wrap:anywhere]";

export function DetailFields({ fields }: { fields: Array<{ label: string; value: string }> }) {
  return <dl className="flex flex-col gap-2">{fields.map((field, index) => (
    <div className="grid grid-cols-[minmax(80px,28%)_minmax(0,1fr)] items-start gap-3" key={`${field.label}-${index}`}>
      <dt className="text-label leading-5 text-fg-subtle">{field.label}</dt>
      <dd className="min-w-0 whitespace-pre-wrap text-body leading-5 text-fg-default [overflow-wrap:anywhere]">{field.value}</dd>
    </div>
  ))}</dl>;
}

function actionIcon(title: string): IconName {
  if (title === "拒绝本次调用") return "circle-x";
  if (title === "敏感内容信息检测") return "shield";
  if (title === "应用限额") return "clock";
  if (title.includes("头")) return "file-text";
  if (title === "复制流量到") return "copy";
  return "doc-stepper";
}

export function RuleWorkflowSummary({ detail, enabled, expanded, onToggle }: {
  detail: RuleDetail;
  enabled: boolean;
  expanded: string[];
  onToggle: (id: string) => void;
}) {
  const groups = (["before", "after", null] as const).map((phase) => ({
    phase,
    title: phase === "before" ? "请求转发前" : phase === "after" ? "收到上游响应后" : "执行阶段未记录",
    actions: detail.actions.map((action, index) => ({ action, index })).filter(({ action }) => action.phase === phase),
  })).filter((group) => group.actions.length > 0);

  return <>
    <WorkflowNode id="start" title="请求进入" description="按规则清单中的优先级检查请求" icon="globe" expanded={expanded.includes("start")} onToggle={() => onToggle("start")}>
      <p className={paragraphClassName}>请求进入当前网关后，按「规则清单」中的优先级依次检查规则。</p>
      {!enabled ? <p className={noteClassName}>这条规则当前已停用，不参与请求匹配。</p> : null}
    </WorkflowNode>
    <FlowConnector />
    <WorkflowConditionBranch expanded={expanded.includes("conditions")}>
      <WorkflowNode id="conditions" title="条件判断" description={`${detail.relationLabel} · ${detail.conditions.length} 项`} icon="list-checks" tone="purple" expanded={expanded.includes("conditions")} onToggle={() => onToggle("conditions")} footer={<><span>匹配条件</span><span className="ml-auto">{detail.conditions.length} 项</span></>}>
        <div className="mb-4 flex items-center justify-between gap-3 text-fg-muted max-[600px]:flex-col max-[600px]:items-start max-[600px]:gap-2">
          <span>本规则的匹配条件</span>
          <Badge color={detail.legacy ? "gray" : "purple"} size="sm">{detail.relationLabel}</Badge>
        </div>
        {detail.conditions.length ? <div className="flex flex-col">
          {detail.conditions.map((condition, index) => <section className="border-t border-border-subtle py-4 last:pb-0" key={condition.id} aria-label={condition.label}>
            <h3 className="mb-3 flex items-center gap-2 text-body font-medium leading-5"><span className="grid h-5 min-w-5 place-items-center rounded bg-brand/10 px-1 text-label text-fg-brand">{detail.logic ? index === 0 ? "当" : detail.logic === "and" ? "且" : "或" : index + 1}</span>{condition.label}</h3>
            <DetailFields fields={condition.fields} />
          </section>)}
        </div> : <p className={noteClassName}>没有保存匹配条件，请进入编辑确认规则范围。</p>}
      </WorkflowNode>
    </WorkflowConditionBranch>

    {groups.map((group) => <section className={`${flowStyles.actionGroup} flex w-full flex-col items-center`} key={group.phase ?? "unknown"} data-expanded={group.actions.some(({ action }) => expanded.includes(action.id))} aria-label={`处置动作：${group.title}`}>
      <h2 className={`${flowStyles.phaseHeading} mb-3 w-[336px] max-w-full text-label font-medium leading-5 text-fg-muted`}>处置动作 · {group.title}</h2>
      {group.actions.map(({ action, index }) => <Fragment key={action.id}>
        <WorkflowNode id={action.id} title={action.title} description={action.description} icon={actionIcon(action.title)} tone="purple" expanded={expanded.includes(action.id)} onToggle={() => onToggle(action.id)} footer={<><span>执行顺序 {index + 1} / {detail.actions.length}</span><span className="ml-auto">{group.title}</span></>}>
          {action.fields.length ? <DetailFields fields={action.fields} /> : <p className={paragraphClassName}>{action.description}</p>}
          {action.unreachable ? <p className="mt-3 text-label leading-5 text-fg-warning">前序动作已拒绝请求，本动作不再执行。</p> : null}
        </WorkflowNode>
        <FlowConnector />
      </Fragment>)}
    </section>)}
    {!detail.actions.length ? <p className="mb-8 w-[var(--expanded-node-width)] max-w-full text-center text-label text-fg-subtle">没有保存处置动作</p> : null}

    <WorkflowNode id="result" title="处理结果" description={detail.resultSummary} icon="check-square" tone="green" expanded={expanded.includes("result")} onToggle={() => onToggle("result")}>
      <p className="mb-2 text-label leading-5 text-fg-success">{enabled ? "命中后的配置预期" : "启用且命中后的配置预期"}</p>
      <p className={paragraphClassName}>{detail.result}</p>
      <p className={noteClassName}>条件不满足时，{ruleSkipExplanation}。</p>
    </WorkflowNode>

    <div className="mt-8 flex w-full max-w-[var(--expanded-node-width)] flex-col items-center border-t border-dashed border-border pt-6">
      <WorkflowNode id="fallback" title="异常处理" description={`组件不可用时：${detail.fallback}`} icon="shield" tone="amber" expanded={expanded.includes("fallback")} onToggle={() => onToggle("fallback")}>
        <DetailFields fields={[{ label: "组件不可用时", value: detail.fallback }]} />
        <p className={noteClassName}>{detail.legacy ? "历史规则未保存异常策略，编辑并保存后可查看完整配置。" : "仅在执行组件不可用时触发；内容检测命中或触发限额时，按对应动作的配置处理。"}</p>
      </WorkflowNode>
    </div>
  </>;
}
