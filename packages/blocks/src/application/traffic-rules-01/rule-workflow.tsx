"use client";

import { Fragment, useCallback, useRef, useState, type CSSProperties } from "react";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@zeron/ui/dialog";
import { Input } from "@zeron/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@zeron/ui/select";
import { Tooltip } from "@zeron/ui/tooltip";
import { useIcon, type IconName } from "@zeron/ui/system/icon-context";
import { PortalContainerProvider } from "@zeron/ui/system/portal-container-context";
import { ActionParameters, AddConditionPanel, ConditionEditor } from "./rule-form";
import {
  actionTypes, afterActionTypes, conditionComplete, conditionSummary, createCondition,
  definitionMap, newId, ruleSkipExplanation, type ActionItem, type RuleFormValue, type RuleWorkflowDraft,
} from "./rule-config";
import { createWorkflowDraft, serializeWorkflow, validateWorkflow } from "./workflow-model";
import { WorkflowNode, FlowConnector, WorkflowConditionBranch } from "./workflow-node";
import { WorkflowMoveUpIcon, WorkflowMoveDownIcon } from "./workflow-move-icon";
import { WorkflowPreview } from "./workflow-preview";
import { WorkflowZoomSelect } from "./workflow-zoom-select";
import { useDialogFocus } from "./use-dialog-focus";
import styles from "./rule-workflow.module.css";

function actionIcon(action: ActionItem): IconName {
  if (action.type === "内容检测（护栏）") return "shield";
  if (action.type === "应用限额") return "clock";
  if (action.type === "拒绝本次调用") return "x";
  if (action.type.includes("头")) return "file-text";
  if (action.type === "镜像复制") return "copy";
  return "doc-stepper";
}

function actionDescription(action: ActionItem) {
  if (action.type === "拒绝本次调用") return "终止当前请求，不再执行后续动作";
  if (action.type === "跳过意图识别") return "关闭意图识别，仅允许路径、模型名与模型服务条件";
  return [action.primary, action.secondary].filter(Boolean).join(" · ") || "点击配置动作参数";
}

function WorkflowSelect({ label, value, options, onChange }: { label: string; value: string; options: Array<{value: string; label: string}>; onChange: (value: string) => void }) {
  return <Select value={value} onValueChange={onChange} size="md"><SelectTrigger aria-label={label} /><SelectContent>{options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select>;
}

function DiscardDialog({ onKeep, onDiscard }: { onKeep: () => void; onDiscard: () => void }) {
  return <Dialog onOpenChange={(open) => { if (!open) onKeep(); }} open><DialogContent size="sm"><DialogHeader><DialogTitle>退出规则编辑？</DialogTitle><DialogDescription>本次修改尚未保存，退出后将丢失这些修改。</DialogDescription></DialogHeader><DialogFooter><Button onClick={onKeep} variant="tertiary">继续编辑</Button><Button onClick={onDiscard} variant="destructive">放弃修改</Button></DialogFooter></DialogContent></Dialog>;
}

export function RuleWorkflow({ initial, onSave, onCancel }: { initial?: RuleFormValue; onSave: (rule: RuleFormValue) => void; onCancel: () => void }) {
  const Workflow = useIcon("doc-stepper");
  const Check = useIcon("check");
  const Play = useIcon("play");
  const Plus = useIcon("plus");
  const Trash = useIcon("trash");
  const Chevron = useIcon("chevron-down");
  const Undo = useIcon("rotate-ccw");
  const X = useIcon("x");
  const [history, setHistory] = useState(() => ({ past: [] as RuleWorkflowDraft[], present: createWorkflowDraft(initial), future: [] as RuleWorkflowDraft[] }));
  const original = useRef(JSON.stringify(history.present));
  const draft = history.present;
  const [expanded, setExpanded] = useState<string[]>(["conditions"]);
  const [editingCondition, setEditingCondition] = useState<string | null>(null);
  const [addingCondition, setAddingCondition] = useState(false);
  const [addingAction, setAddingAction] = useState<{ afterId: string | null } | null>(null);
  const [showPreview, setShowPreview] = useState(() => typeof window !== "undefined" && window.innerWidth >= 1100);
  const [previewTab, setPreviewTab] = useState<"test" | "check">("test");
  const [discardOpen, setDiscardOpen] = useState(false);
  const [showIssues, setShowIssues] = useState(false);
  const [zoom, setZoom] = useState(100);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);
  const dirty = JSON.stringify(draft) !== original.current;
  const requestExit = () => dirty ? setDiscardOpen(true) : onCancel();
  const dialogRef = useDialogFocus(!discardOpen, requestExit);
  const attachDialog = useCallback((element: HTMLDivElement | null) => {
    dialogRef.current = element;
    setPortalContainer(element);
  }, [dialogRef]);
  const issues = validateWorkflow(draft);
  const actions = [...draft.actions.filter((action) => action.phase === "before"), ...draft.actions.filter((action) => action.phase === "after")];
  const actionGroups = (["before", "after"] as const).map((phase) => ({
    phase,
    title: phase === "before" ? "请求转发前" : "收到上游响应后",
    items: actions.map((action, index) => ({ action, index })).filter(({ action }) => action.phase === phase),
  })).filter((group) => group.items.length > 0);
  const terminalAction = actions.find((action) => action.type === "拒绝本次调用");
  const targetAction = actions.find((action) => action.type === "转发到");

  const update = (patch: Partial<RuleWorkflowDraft>) => {
    const normalizedPatch = patch.actions ? {
      ...patch,
      actions: [...patch.actions.filter((action) => action.phase === "before"), ...patch.actions.filter((action) => action.phase === "after")],
    } : patch;
    setHistory((current) => ({ past: [...current.past.slice(-49), current.present], present: { ...current.present, ...normalizedPatch }, future: [] }));
  };
  const toggle = (id: string) => setExpanded((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const issueFor = (id: string) => showIssues ? issues.find((issue) => issue.nodeId === id)?.message : undefined;
  const focusNode = (requestedId: string) => {
    const id = draft.conditions.some((condition) => condition.id === requestedId) ? "conditions" : requestedId === "actions" ? actions[0]?.id ?? "result" : requestedId;
    setExpanded((current) => current.includes(id) ? current : [...current, id]);
    if (id === "conditions" && requestedId !== id) setEditingCondition(requestedId);
    window.requestAnimationFrame(() => {
      const node = Array.from(canvasRef.current?.querySelectorAll<HTMLElement>("[data-node-id]") ?? []).find((item) => item.dataset.nodeId === id);
      node?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "center" });
    });
  };
  const openPreview = (tab: "test" | "check") => { setPreviewTab(tab); setShowPreview(true); };
  const focusFromPreview = (nodeId: string) => {
    if (window.matchMedia("(max-width: 900px)").matches) setShowPreview(false);
    focusNode(nodeId);
  };
  const checkConfiguration = () => {
    setShowIssues(true); openPreview("check");
    if (issues.length) focusNode(issues[0]!.nodeId);
  };
  const save = () => {
    if (issues.length) { checkConfiguration(); return; }
    onSave(serializeWorkflow(draft, initial));
  };
  const updateAction = (next: ActionItem) => update({ actions: draft.actions.map((action) => action.id === next.id ? next : action) });
  const moveAction = (id: string, direction: -1 | 1) => {
    const next = [...actions];
    const index = next.findIndex((action) => action.id === id);
    const destination = next[index + direction];
    if (!destination || destination.phase !== next[index]!.phase) return;
    [next[index], next[index + direction]] = [destination, next[index]!];
    update({ actions: next });
  };
  const insertAction = (type: string) => {
    if (!addingAction) return;
    const action: ActionItem = { id: newId("action"), type, phase: afterActionTypes.has(type) ? "after" : "before", primary: "", secondary: "" };
    const next = [...actions];
    const anchorIndex = next.findIndex((item) => item.id === addingAction.afterId);
    next.splice(anchorIndex + 1, 0, action);
    update({ actions: next });
    setAddingAction(null);
    focusNode(action.id);
  };
  const actionPicker = addingAction ? <div className={styles.actionPicker} aria-label="选择要插入的处置动作">
    <div className={styles.pickerHeading}><strong>添加处置动作</strong><Button aria-label="关闭动作选择" iconOnly variant="ghost" size="sm" onClick={() => setAddingAction(null)}><X /></Button></div>
    <p className="mb-3 text-label text-fg-subtle">同阶段动作插入此处，跨阶段动作归入对应的执行阶段。</p>
    <div className={styles.pickerItems}>{actionTypes.map((type) => <button type="button" key={type} onClick={() => insertAction(type)}><Plus className="size-4 shrink-0 text-fg-brand" /><span>{type}</span></button>)}</div>
  </div> : null;

  return <div className={styles.workspace} ref={attachDialog} role="dialog" aria-modal="true" aria-labelledby="workflow-title" tabIndex={-1}><PortalContainerProvider value={portalContainer}>
    <header className={`${styles.topbar} ${styles.editorTopbar}`}>
      <Button aria-label={initial ? "关闭规则编辑" : "关闭规则创建"} iconOnly onClick={requestExit} type="button" variant="tertiary"><X aria-hidden /></Button>
      <div className={styles.heading}>
        <h1 id="workflow-title" className="sr-only">{initial ? "编辑流量规则" : "新建流量规则"}</h1>
        <Input aria-label="规则名称" className={styles.titleInput} title={draft.name || "未命名规则"} variant="ghost" value={draft.name} placeholder="未命名规则" onChange={(event) => update({ name: event.target.value })} />
        <span className={styles.draftLabel}>{initial ? "编辑中" : "草稿"}</span>
      </div>
      <div className={styles.topActions}>
        <span className={styles.savedState}>{dirty ? "有未保存的修改" : initial ? "已保存" : "尚未保存"}</span>
        {issues.length ? <Button aria-label={`配置异常，共 ${issues.length} 项，跳转到第一处`} onClick={checkConfiguration} size="md" tone="warning" type="button" variant="tertiary"><span className="inline-flex items-center gap-1.5"><span>配置异常</span><Badge aria-hidden size="sm" status="warning">{issues.length}</Badge></span></Button> : <span className="inline-flex h-control-md items-center gap-1.5 rounded-lg px-2 text-body text-fg-default"><Check aria-hidden className="size-4 text-fg-brand" />配置正常</span>}
        <Button onClick={() => openPreview("test")} variant="tertiary" leadingIcon={Play} size="md">试运行</Button>
        <Button onClick={requestExit} variant="tertiary" size="md">取消</Button>
        {issues.length ? <Tooltip content={`还有 ${issues.length} 项配置需要完善`}><span aria-label={`保存规则不可用，还有 ${issues.length} 项配置需要完善`} className="inline-flex" tabIndex={0}><Button disabled onClick={save} variant="primary" size="md">保存规则</Button></span></Tooltip> : <Button onClick={save} variant="primary" size="md">保存规则</Button>}
      </div>
    </header>
    <div className={styles.body}>
      <section className={styles.canvasPanel} aria-label="规则编排画布">
        <div className={styles.toolbar}>
          <div className={styles.toolbarTitle}><Workflow className="size-4 text-fg-subtle" /><strong>规则编排</strong><span className={styles.toolbarHint}>从条件到动作，看清每一次请求的去向</span></div>
          <div className="flex items-center gap-1">
            <Button aria-label="撤销修改" title="撤销修改" disabled={!history.past.length} iconOnly size="sm" variant="ghost" onClick={() => setHistory((current) => ({ past: current.past.slice(0, -1), present: current.past.at(-1)!, future: [current.present, ...current.future] }))}><Undo /></Button>
            <Button aria-label="重做修改" title="重做修改" disabled={!history.future.length} iconOnly size="sm" variant="ghost" onClick={() => setHistory((current) => ({ past: [...current.past, current.present], present: current.future[0]!, future: current.future.slice(1) }))}><Undo className="-scale-x-100" /></Button>
            <span className="mx-2 h-4 border-r border-border" />
            <Button size="sm" variant="ghost" onClick={() => setExpanded(expanded.length ? [] : ["start", "conditions", ...actions.map((action) => action.id), "result", "fallback"])}>{expanded.length ? "收起节点" : "展开节点"}</Button>
          </div>
        </div>
        <div className={`${styles.canvasFrame} relative flex min-h-0 flex-1 flex-col`}>
          <p className={styles.canvasPanHint}>左右滑动画布查看分支</p>
          <div className={styles.canvas} ref={canvasRef} tabIndex={0} aria-label="流程画布，可横向和纵向滚动">
            <div className={styles.flow} style={{ zoom: zoom / 100 } as CSSProperties}>
              <WorkflowNode id="start" title="请求进入" description="接收进入网关的请求" icon="globe" expanded={expanded.includes("start")} onToggle={() => toggle("start")} issue={issueFor("start")} footer={<>节点输出 <code>request</code></>}>
                <div className={styles.fields}><label className={styles.fieldLabel}>规则名称 <Input value={draft.name} aria-label="节点规则名称" placeholder="例如：企业请求优先路由" onChange={(event) => update({ name: event.target.value })} /></label>
                  <div><p>流量入口：进入当前网关的请求</p><p className={styles.help}>请求路径、调用身份和模型信息将作为条件判断的输入。</p></div></div>
              </WorkflowNode>
              <FlowConnector />
              <WorkflowConditionBranch expanded={expanded.includes("conditions")}>
              <WorkflowNode id="conditions" title="条件判断" description={`满足全部 ${draft.conditions.length} 个条件后执行动作`} icon="list-checks" tone="purple" expanded={expanded.includes("conditions")} onToggle={() => toggle("conditions")} issue={issueFor("conditions")} footer={<>节点输出 <code>matched: boolean</code><span className="ml-auto">{draft.conditions.filter(conditionComplete).length}/{draft.conditions.length} 已配置</span></>}>
                <div className={styles.conditionHeader}><span>本规则的匹配条件</span><span className={styles.conditionHint}>全部条件均需满足（AND）</span></div>
                {draft.conditions.length ? <div className={styles.conditionList}>{draft.conditions.map((condition, index) => <div key={condition.id} className={styles.condition}>
                  <div className={styles.conditionSummary}><button type="button" onClick={() => setEditingCondition(editingCondition === condition.id ? null : condition.id)} aria-expanded={editingCondition === condition.id} aria-label={`配置${definitionMap.get(condition.kind)!.label}`}>
                    {index > 0 ? <span className={styles.logicBadge}>且</span> : null}
                    <span className={styles.conditionLabel}>{definitionMap.get(condition.kind)!.label}</span><span className={styles.conditionValue}>{conditionSummary(condition)}</span><Chevron className="ml-auto size-3 shrink-0 text-fg-subtle" />
                  </button><Button aria-label={`删除条件：${definitionMap.get(condition.kind)!.label}`} iconOnly size="xs" variant="ghost" onClick={() => update({conditions:draft.conditions.filter((item) => item.id !== condition.id)})}><Trash /></Button></div>
                  {editingCondition === condition.id ? <ConditionEditor condition={condition} onChange={(next) => update({conditions:draft.conditions.map((item) => item.id === next.id ? next : item)})} /> : null}
                </div>)}</div> : <p className="mb-4 leading-5 text-fg-subtle">添加请求路径、请求头或调用方等条件，定义这条规则何时生效。</p>}
                {addingCondition ? <AddConditionPanel onClose={() => setAddingCondition(false)} onAdd={(kind) => { const condition = createCondition(kind); update({conditions:[...draft.conditions,condition]}); setEditingCondition(condition.id); setAddingCondition(false); }} /> : <Button leadingIcon={Plus} variant="ghost" size="sm" onClick={() => setAddingCondition(true)}>添加条件</Button>}
              </WorkflowNode>
              </WorkflowConditionBranch>
              {actionGroups.map((group) => <section key={group.phase} className={`${styles.actionGroup} flex w-full flex-col items-center`} aria-label={`处置动作：${group.title}`} data-expanded={group.items.some(({ action }) => expanded.includes(action.id))}>
                <h2 className={`${styles.phaseHeading} mb-3 w-[336px] max-w-full text-label font-medium leading-5 text-fg-muted`}>处置动作 · {group.title}</h2>
                {group.items.map(({ action, index }) => <Fragment key={action.id}>
                <WorkflowNode id={action.id} title={action.type} description={actionDescription(action)} icon={actionIcon(action)} tone="purple" expanded={expanded.includes(action.id)} onToggle={() => toggle(action.id)} issue={issueFor(action.id)} footer={<>执行阶段 <code>{action.phase === "before" ? "before_upstream" : "after_response"}</code></>} tools={<div className={styles.actionTools}>
                  <Button aria-label={`上移动作：${action.type}`} title="上移" iconOnly size="xs" variant="ghost" disabled={index === 0 || actions[index - 1]?.phase !== action.phase} onClick={() => moveAction(action.id,-1)}><WorkflowMoveUpIcon /></Button>
                  <Button aria-label={`下移动作：${action.type}`} title="下移" iconOnly size="xs" variant="ghost" disabled={index === actions.length - 1 || actions[index + 1]?.phase !== action.phase} onClick={() => moveAction(action.id,1)}><WorkflowMoveDownIcon /></Button>
                  <Button aria-label={`删除动作：${action.type}`} title="删除" iconOnly size="xs" variant="ghost" onClick={() => update({actions:draft.actions.filter((item) => item.id !== action.id)})}><Trash /></Button>
                </div>}>
                  <div className={styles.fields}><label className={styles.fieldLabel}>动作类型<WorkflowSelect label="动作类型" value={action.type} options={actionTypes.map((type) => ({value:type,label:type}))} onChange={(type) => updateAction({...action,type,phase:afterActionTypes.has(type)?"after":"before",primary:"",secondary:""})} /></label>
                    <div><p className="mb-2 text-fg-muted">{action.type === "转发到" ? "目标模型服务" : "动作参数"}</p><ActionParameters action={action} onChange={updateAction} /></div>
                  </div>
                </WorkflowNode>
                <FlowConnector onAdd={() => setAddingAction((current) => current?.afterId === action.id ? null : { afterId: action.id })} />
                {addingAction?.afterId === action.id ? <>{actionPicker}<FlowConnector /></> : null}
                </Fragment>)}
              </section>)}
              {!actions.length ? <>
                <FlowConnector addLabel="添加处置动作" onAdd={() => setAddingAction((current) => current ? null : { afterId: null })} />
                {addingAction ? <>{actionPicker}<FlowConnector /></> : null}
              </> : null}
              <WorkflowNode id="result" title="处理结果" description={terminalAction ? "终止请求，返回拒绝结果" : targetAction?.primary ? `返回 ${targetAction.primary} 的响应` : "按配置完成处理，返回响应"} icon="check-square" tone="green" expanded={expanded.includes("result")} onToggle={() => toggle("result")}>
                <p className={styles.result}>当请求满足<strong>全部条件</strong>时，{terminalAction ? <>执行到“拒绝本次调用”后立即终止请求，后续动作不再执行。</> : targetAction?.primary ? <>请求交给 <strong>{targetAction.primary}</strong> 处理{actions.some((action) => action.phase === "after") ? "，再执行响应阶段动作" : ""}，最终返回响应。</> : <>依次执行已配置动作，继续网关既有路由并返回响应。</>}</p>
                <p className={styles.help}>条件不满足时，{ruleSkipExplanation}。</p>
                <Button className="mt-3" variant="tertiary" size="sm" leadingIcon={Play} onClick={() => openPreview("test")}>用示例请求验证结果</Button>
              </WorkflowNode>
              <div className="mt-8 w-full max-w-[552px] border-t border-dashed border-border pt-6 flex flex-col items-center">
                <WorkflowNode id="fallback" title="异常处理" description={`组件不可用时${draft.fallback === "allow" ? "放行，继续网关路由" : "拒绝本次调用"}`} icon="shield" tone="amber" expanded={expanded.includes("fallback")} onToggle={() => toggle("fallback")} issue={issueFor("fallback")}>
                  <label className={styles.fieldLabel}>组件不可用时<WorkflowSelect label="组件不可用时" value={draft.fallback} options={[{value:"allow",label:"放行，继续网关路由"},{value:"reject",label:"拒绝本次调用"}]} onChange={(fallback)=>update({fallback:fallback as "allow"|"reject"})} /></label>
                  <p className={styles.help}>仅在执行组件不可用时触发。内容检测命中、触发限额时，按对应动作中设置的策略处理。</p>
                </WorkflowNode>
              </div>
            </div>
          </div>
          <div className={styles.canvasControls}><WorkflowZoomSelect ariaLabel="画布缩放" value={zoom} onChange={setZoom} /><span className="h-4 border-r border-border" /><Button variant="ghost" size="sm" onClick={()=>{setZoom(100);setExpanded([]);canvasRef.current?.scrollTo({top:0,left:0});}}>流程总览</Button></div>
        </div>
      </section>
      {showPreview ? <aside className={styles.preview}><WorkflowPreview closeButtonClassName="hidden max-[900px]:inline-flex" tab={previewTab} onTabChange={setPreviewTab} draft={draft} onClose={() => setShowPreview(false)} onFocusNode={focusFromPreview} /></aside> : null}
    </div>
    {discardOpen ? <DiscardDialog onKeep={()=>setDiscardOpen(false)} onDiscard={onCancel} /> : null}
  </PortalContainerProvider></div>;
}
