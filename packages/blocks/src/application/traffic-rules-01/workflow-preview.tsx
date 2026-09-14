"use client";

import { useId, useState } from "react";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Input } from "@zeron/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@zeron/ui/select";
import { TabItem, TabPanel, Tabs, TabsList } from "@zeron/ui/tabs";
import { useIcon } from "@zeron/ui/system/icon-context";
import { cn } from "@zeron/ui/system/utils";
import { conditionSummary, definitionMap, type ConditionItem, type RuleWorkflowDraft } from "./rule-config";
import styles from "./rule-workflow.module.css";
import { createWorkflowSamples, simulateWorkflow, validateWorkflow, workflowSampleHint } from "./workflow-model";

type Scenario = "normal" | "unavailable" | "sensitive" | "quota";
type Simulation = ReturnType<typeof simulateWorkflow>;

const scenarios: Array<{ value: Scenario; label: string }> = [
  { value: "normal", label: "正常请求" },
  { value: "unavailable", label: "组件不可用" },
  { value: "sensitive", label: "命中敏感内容" },
  { value: "quota", label: "超过限额" },
];

const focusClass = "cursor-pointer outline-none transition-colors duration-150 hover:bg-hover focus-visible:ring-1 focus-visible:ring-focus-ring motion-reduce:transition-none";

function sampleLabel(condition: ConditionItem) {
  const label = definitionMap.get(condition.kind)?.label ?? "请求事实";
  if (["header", "query", "cookie"].includes(condition.kind) && condition.primary.trim()) {
    return `${label} · ${condition.primary}`;
  }
  return label;
}

function factKey(condition: ConditionItem) {
  if (condition.kind === "header") return `header:${condition.primary.trim().toLowerCase()}`;
  if (condition.kind === "query" || condition.kind === "cookie") return `${condition.kind}:${condition.primary.trim()}`;
  return condition.kind;
}

function sharedRequestSamples(draft: RuleWorkflowDraft, samples: Record<string, string>) {
  const facts = new Map<string, string>();
  for (const condition of draft.conditions) {
    const key = factKey(condition);
    if (!facts.has(key) && Object.hasOwn(samples, condition.id)) facts.set(key, samples[condition.id]!);
  }
  return Object.fromEntries(draft.conditions.flatMap((condition) => {
    const key = factKey(condition);
    return facts.has(key) ? [[condition.id, facts.get(key)!]] : [];
  }));
}

function RunResult({ result, onFocusNode }: { result: Simulation; onFocusNode: (nodeId: string) => void }) {
  const Check = useIcon("check");
  const Skip = useIcon("skip-forward");
  const Blocked = useIcon("circle-x");
  const Arrow = useIcon("chevron-right");
  const cannotEvaluate = result.steps.some((step) => step.id === "conditions" && step.status === "blocked");

  return (
    <div className="space-y-5">
      <div className="space-y-2 rounded-lg bg-surface-base p-3">
        <Badge size="sm" status={cannotEvaluate ? "warning" : result.matched ? "success" : "neutral"} variant="dot">
          {cannotEvaluate ? "请求事实待完善" : result.matched ? "规则命中" : "规则未命中"}
        </Badge>
        <p className="break-words text-body leading-5 text-fg-default">{result.outcome}</p>
      </div>

      {result.checks.length > 0 ? (
        <div>
          <h4 className="mb-2 text-label font-medium text-fg-subtle">条件求值</h4>
          <div className="divide-y divide-border-subtle">
            {result.checks.map((check) => (
              <button
                aria-label={`定位条件：${check.label}，${check.error ? "无法判断" : check.matched ? "匹配" : "不匹配"}`}
                className={cn("flex w-full items-start gap-2 rounded-lg p-2 text-left", focusClass)}
                key={check.id}
                onClick={() => onFocusNode(check.id)}
                type="button"
              >
                {check.matched ? <Check aria-hidden className="mt-1 size-4 shrink-0 text-fg-success" /> : <Blocked aria-hidden className="mt-1 size-4 shrink-0 text-fg-warning" />}
                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2 text-label leading-5">
                    <span className="font-medium text-fg-default">{check.label}</span>
                    <span className={cn("shrink-0", check.matched ? "text-fg-success" : "text-fg-warning")}>{check.error ? "无法判断" : check.matched ? "匹配" : "不匹配"}</span>
                  </span>
                  <span className="mt-1 block break-words text-label leading-4 text-fg-subtle">实际：{check.actual || "空值"}</span>
                  <span className="mt-1 block break-words text-label leading-4 text-fg-subtle">预期：{check.expected}</span>
                  {check.error ? <span className="mt-1 block break-words text-label leading-4 text-fg-warning">{check.error}</span> : null}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div>
        <div className="mb-2 flex items-center justify-between gap-2">
          <h4 className="text-label font-medium text-fg-subtle">执行轨迹</h4>
          <span className="text-label text-fg-subtle">点击定位节点</span>
        </div>
        <ol className="space-y-1">
          {result.steps.map((step, index) => {
            const StatusIcon = step.status === "success" ? Check : step.status === "blocked" ? Blocked : Skip;
            const statusLabel = step.status === "success" ? "已执行" : step.status === "blocked" ? "已阻断" : "已跳过";
            return (
              <li className="relative" key={step.id}>
                {index < result.steps.length - 1 ? <span aria-hidden className="pointer-events-none absolute bottom-[-4px] left-4 top-8 w-px bg-border" /> : null}
                <button className={cn("flex w-full items-start gap-3 rounded-lg p-2 text-left", focusClass)} onClick={() => onFocusNode(step.id)} type="button">
                  <StatusIcon aria-hidden className={cn("mt-1 size-4 shrink-0", step.status === "success" ? "text-fg-success" : step.status === "blocked" ? "text-fg-danger" : "text-fg-subtle")} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2 text-label leading-5">
                      <span className="font-medium text-fg-default">{step.label}</span>
                      <span className="shrink-0 text-fg-subtle">{statusLabel}</span>
                    </span>
                    <span className="mt-1 block break-words text-label leading-4 text-fg-subtle">{step.detail}</span>
                  </span>
                  <Arrow aria-hidden className="mt-1 size-4 shrink-0 text-fg-subtle" />
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

function ConfigurationCheck({ draft, onFocusNode }: { draft: RuleWorkflowDraft; onFocusNode: (nodeId: string) => void }) {
  const Check = useIcon("check");
  const Info = useIcon("doc-info-item");
  const Arrow = useIcon("chevron-right");
  const issues = validateWorkflow(draft);
  const affectedNodes = new Set(issues.map((issue) => issue.nodeId));
  const completed = [
    { nodeId: "start", label: "规则名称", detail: draft.name },
    { nodeId: "conditions", label: "条件配置", detail: `${draft.conditions.length} 个条件 · ${draft.logic === "and" ? "全部满足" : "满足任一"}` },
    ...draft.actions.map((action) => ({ nodeId: action.id, label: action.type, detail: action.phase === "before" ? "转发前执行" : "收到响应后执行" })),
    { nodeId: "fallback", label: "异常处理", detail: draft.fallback === "allow" ? "组件不可用时放行" : "组件不可用时拒绝调用" },
  ].filter((item) => !affectedNodes.has(item.nodeId));

  return (
    <div className="space-y-5 p-4">
      <div className="space-y-2">
        <Badge size="sm" status={issues.length ? "warning" : "success"} variant="dot">{issues.length ? `${issues.length} 项待完善` : "配置检查通过"}</Badge>
        <p className="text-label leading-5 text-fg-subtle">{issues.length ? "点击问题，定位并完善对应节点的配置。" : "必填配置已完整，可切换到试运行验证请求走向。"}</p>
      </div>

      {issues.length > 0 ? (
        <section aria-label="待完善配置">
          <h3 className="mb-2 text-label font-medium text-fg-default">待完善</h3>
          <div className="flex flex-col gap-1">
            {issues.map((issue, index) => (
              <button className={cn("flex w-full items-center gap-2 rounded-lg border-[0.5px] border-border bg-warning-surface p-3 text-left shadow-none", focusClass, styles.configurationIssueItem)} key={`${issue.nodeId}-${index}`} onClick={() => onFocusNode(issue.nodeId)} type="button">
                <Info aria-hidden className="size-4 shrink-0 text-fg-warning" />
                <span className="min-w-0 flex-1 break-words text-label leading-5 text-fg-default">{issue.message}</span>
                <Arrow aria-hidden className="size-4 shrink-0 text-fg-subtle" />
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {completed.length > 0 ? (
        <section aria-label="已完成配置">
          <h3 className="mb-2 text-label font-medium text-fg-default">已完成</h3>
          <div className="flex flex-col gap-1">
            {completed.map((item) => (
              <button className={cn("flex w-full items-start gap-2 rounded-lg border border-border p-3 text-left shadow-none", focusClass)} key={item.nodeId} onClick={() => onFocusNode(item.nodeId)} type="button">
                <Check aria-hidden className="mt-1 size-4 shrink-0 text-fg-success" />
                <span className="min-w-0 flex-1">
                  <span className="block text-label font-medium leading-5 text-fg-default">{item.label}</span>
                  <span className="mt-1 block break-words text-label leading-4 text-fg-subtle">{item.detail}</span>
                </span>
                <Arrow aria-hidden className="mt-1 size-4 shrink-0 text-fg-subtle" />
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function WorkflowPreview({ draft, tab, onTabChange, onClose, onFocusNode, closeButtonClassName }: { draft: RuleWorkflowDraft; tab: "test" | "check"; onTabChange: (tab: "test" | "check") => void; onClose?: () => void; onFocusNode: (nodeId: string) => void; closeButtonClassName?: string }) {
  const Close = useIcon("x");
  const Play = useIcon("play");
  const Refresh = useIcon("rotate-ccw");
  const Checklist = useIcon("list-checks");
  const fieldId = useId();
  const [samples, setSamples] = useState<Record<string, string>>({});
  const [scenario, setScenario] = useState<Scenario>("normal");
  const [lastRun, setLastRun] = useState<{ draftSignature: string; inputSignature: string; result: Simulation } | null>(null);
  const requestSamples = sharedRequestSamples(draft, samples);
  const draftSignature = JSON.stringify(draft);
  const inputSignature = JSON.stringify({ samples: requestSamples, scenario });
  const configChanged = Boolean(lastRun && lastRun.draftSignature !== draftSignature);
  const inputChanged = Boolean(lastRun && lastRun.inputSignature !== inputSignature);
  const result = lastRun && !configChanged && !inputChanged ? lastRun.result : null;
  const issues = validateWorkflow(draft);

  const changeSample = (condition: ConditionItem, value: string | undefined) => {
    setSamples((current) => {
      const next = { ...current };
      draft.conditions.filter((item) => factKey(item) === factKey(condition)).forEach((item) => {
        if (value === undefined) delete next[item.id];
        else next[item.id] = value;
      });
      return next;
    });
  };

  const runTest = () => {
    if (issues.length) {
      onTabChange("check");
      return;
    }
    setLastRun({ draftSignature, inputSignature, result: simulateWorkflow(draft, requestSamples, scenario) });
  };

  return (
    <aside aria-label="调试与预览" className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-surface-floating text-fg-default">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 px-4">
        <h2 className="text-body font-semibold">调试与预览</h2>
        {onClose ? <Button aria-label="关闭调试与预览" className={closeButtonClassName} iconOnly onClick={onClose} size="md" type="button" variant="tertiary"><Close /></Button> : null}
      </header>

      <Tabs className="flex min-h-0 flex-1 flex-col" color="brand" onValueChange={(value) => onTabChange(value === "check" ? "check" : "test")} value={tab === "test" ? "run" : "check"} variant="underline">
        <div className="shrink-0 px-4">
          <TabsList aria-label="调试工具" className="w-full">
            <TabItem className="flex-1 justify-center" icon={Play} label="试运行" value="run" />
            <TabItem badge={issues.length ? { children: issues.length, status: "warning" } : undefined} className="flex-1 justify-center" icon={Checklist} label="配置检查" value="check" />
          </TabsList>
        </div>

        <TabPanel className="min-h-0 flex-1 overflow-y-auto overscroll-contain" value="run">
          <div className="space-y-4 p-4">
            <p className="text-label leading-5 text-fg-subtle">使用示例请求在本地模拟规则，检查条件与动作走向。</p>
            <section aria-labelledby={`${fieldId}-facts-title`}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-label font-medium" id={`${fieldId}-facts-title`}>请求事实</h3>
                <Button onClick={() => setSamples(createWorkflowSamples(draft))} size="sm" type="button" variant="ghost">示例请求</Button>
              </div>
              {draft.conditions.length ? (
                <div className="max-h-64 space-y-3 overflow-y-auto overscroll-contain pr-1">
                  {draft.conditions.map((condition, index) => (
                    <div key={condition.id}>
                      <div className="mb-1 flex min-h-6 items-center justify-between gap-2">
                        <label className="min-w-0 break-words text-label leading-4 text-fg-muted" htmlFor={`${fieldId}-fact-${index}`}>{sampleLabel(condition)}</label>
                        {Object.hasOwn(requestSamples, condition.id) ? <Button aria-label={`不提供${sampleLabel(condition)}`} onClick={() => changeSample(condition, undefined)} size="xs" type="button" variant="ghost">不提供</Button> : <span className="shrink-0 text-label text-fg-subtle">未提供</span>}
                      </div>
                      <Input
                        autoComplete="off"
                        id={`${fieldId}-fact-${index}`}
                        onChange={(event) => changeSample(condition, event.target.value)}
                        placeholder={workflowSampleHint(condition)}
                        size="md"
                        title={`规则条件：${conditionSummary(condition)}`}
                        value={requestSamples[condition.id] ?? ""}
                      />
                    </div>
                  ))}
                </div>
              ) : <p className="rounded-lg bg-surface-base p-3 text-label leading-5 text-fg-subtle">在画布中添加条件后，可填写对应的请求事实。</p>}
            </section>

            <div>
              <label className="mb-1 block text-label leading-4 text-fg-muted" htmlFor={`${fieldId}-scenario`}>模拟情景</label>
              <Select itemDensity="compact" onValueChange={(value) => setScenario(value as Scenario)} size="md" value={scenario}>
                <SelectTrigger aria-label="模拟情景" className="w-full" id={`${fieldId}-scenario`} />
                <SelectContent>{scenarios.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>

            <Button className="w-full" leadingIcon={Play} onClick={runTest} size="md" type="button" variant="primary">运行测试</Button>
            {issues.length ? <button className={cn("w-full rounded-lg text-left text-label leading-5 text-fg-warning", focusClass)} onClick={() => onTabChange("check")} type="button">还有 {issues.length} 项配置待完善，查看配置检查</button> : null}
          </div>

          <section aria-label="运行结果" aria-live="polite" className="border-t border-border p-4">
            <h3 className="mb-3 text-label font-medium">运行结果</h3>
            {result ? <RunResult onFocusNode={onFocusNode} result={result} /> : (
              <div className="flex min-h-36 flex-col items-center justify-center gap-2 px-4 py-6 text-center">
                {lastRun ? <Refresh aria-hidden className="mb-1 size-6 text-fg-subtle" /> : <Play aria-hidden className="mb-1 size-6 text-fg-subtle" />}
                <p className="text-body font-medium">{lastRun ? "请重新运行测试" : "等待试运行"}</p>
                <p className="max-w-[248px] text-label leading-5 text-fg-subtle">{lastRun ? configChanged ? "配置已更改，请重新运行以查看最新结果。" : "请求事实或模拟情景已更改，运行后更新结果。" : "填写请求事实或载入示例请求，运行后查看条件命中与执行轨迹。"}</p>
              </div>
            )}
          </section>
        </TabPanel>

        <TabPanel className="min-h-0 flex-1 overflow-y-auto overscroll-contain" value="check">
          <ConfigurationCheck draft={draft} onFocusNode={onFocusNode} />
        </TabPanel>
      </Tabs>
    </aside>
  );
}
