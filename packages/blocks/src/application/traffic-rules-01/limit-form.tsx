"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Checkbox } from "@zeron/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@zeron/ui/dialog";
import { Input } from "@zeron/ui/input";
import { RadioGroup, RadioGroupItem } from "@zeron/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@zeron/ui/select";
import { TabItem, TabPanel, Tabs, TabsList } from "@zeron/ui/tabs";
import { Textarea } from "@zeron/ui/textarea";
import { DateTimePicker, instantToZonedDateTime, parseISODateTime } from "@zeron/ui/temporal-picker";
import { Tooltip } from "@zeron/ui/tooltip";
import { useIcon } from "@zeron/ui/system/icon-context";
import { PortalContainerProvider } from "@zeron/ui/system/portal-container-context";
import { cn } from "@zeron/ui/system/utils";
import type { GlobalLimit, LimitAction, LimitCondition, LimitWindow } from "./traffic-types";
import { FlowConnector, WorkflowNode } from "./workflow-node";
import { WorkflowZoomSelect } from "./workflow-zoom-select";
import { useDialogFocus } from "./use-dialog-focus";
import flowStyles from "./rule-workflow.module.css";
import styles from "./limit-workflow.module.css";
import { limitConditionFields, limitDimensions, policySets } from "./gateway-policy-data";

const fieldOptions = [...limitConditionFields];
const operatorOptions = ["等于", "属于", "不等于", "不属于"];
const unitOptions = ["秒", "分钟", "小时"];
const allNodeIds = ["start", "scope", "windows", "action", "result"];

function makeCondition(index: number): LimitCondition {
  return { id: `condition-${Date.now()}-${index}`, field: "策略集", operator: "等于", value: index === 0 ? "model-gateway" : "" };
}

function makeWindow(index: number): LimitWindow {
  return { id: `window-${Date.now()}-${index}`, unit: index === 0 ? "秒" : "分钟", count: 1, burst: 1 };
}

export function createDefaultLimit(): GlobalLimit {
  return {
    id: `limit-${Date.now()}`,
    name: "",
    limitType: "限速（GCRA）",
    dimension: "网关模型密钥",
    conditionLogic: "and",
    conditions: [makeCondition(0)],
    windows: [{ ...makeWindow(0), count: 20, burst: 30 }, { ...makeWindow(1), count: 600, burst: 720 }],
    temporaryEnabled: false,
    temporaryWindows: [
      { id: `temporary-window-${Date.now()}-0`, unit: "秒", count: 30, burst: 40 },
      { id: `temporary-window-${Date.now()}-1`, unit: "分钟", count: 900, burst: 1000 },
    ],
    temporaryStart: "2026-09-11T14:38",
    temporaryEnd: "2026-09-11T15:38",
    action: "reject",
    queueSize: 64,
    queueWaitMs: 3000,
    replyContent: "服务繁忙，请稍后重试。",
    reasonCode: "TRAFFIC_RATE_LIMITED",
    enabled: true,
    order: 1000,
    code: `tenant-${Date.now().toString(36)}`,
  };
}

function FieldSelect({ ariaLabel, onChange, options, value }: { ariaLabel: string; onChange: (value: string) => void; options: string[]; value: string }) {
  return (
    <Select itemDensity="compact" onValueChange={onChange} size="md" value={value}>
      <SelectTrigger aria-label={ariaLabel} className="w-full min-w-0" placeholder="请选择" />
      <SelectContent>{options.map((option) => <SelectItem key={option} value={option}>{option}</SelectItem>)}</SelectContent>
    </Select>
  );
}

function FieldLabel({ children, required }: { children: ReactNode; required?: boolean }) {
  return <span className={styles.fieldLabel}>{children}{required ? <span className="text-fg-danger">*</span> : null}</span>;
}

function ConditionRows({ conditions, onChange }: { conditions: LimitCondition[]; onChange: (conditions: LimitCondition[]) => void }) {
  const Chevron = useIcon("chevron-down");
  const Plus = useIcon("plus");
  const Trash = useIcon("trash");
  const [editingId, setEditingId] = useState<string | null>(null);
  const update = (id: string, patch: Partial<LimitCondition>) => onChange(conditions.map((item) => item.id === id ? { ...item, ...patch } : item));
  return (
    <div className={styles.rowGroup}>
      {conditions.map((condition, index) => (
        <div className={cn(styles.configItem, editingId === condition.id && styles.configItemEditing)} key={condition.id}>
          <div className={styles.configSummary}>
            <button aria-expanded={editingId === condition.id} aria-label={`配置第 ${index + 1} 个匹配条件`} onClick={() => setEditingId(editingId === condition.id ? null : condition.id)} type="button">
              {index > 0 ? <span className={styles.logicBadge}>且</span> : null}
              <span className={styles.summaryTitle}>{condition.field}</span>
              <span className={cn(styles.summaryValue, !condition.value.trim() && styles.summaryPlaceholder)}>{condition.operator} {condition.value.trim() || "未填写匹配值"}</span>
              <Chevron aria-hidden className={cn(styles.summaryChevron, editingId === condition.id && styles.summaryChevronOpen)} />
            </button>
            <Button aria-label={`删除第 ${index + 1} 个条件`} iconOnly onClick={() => onChange(conditions.filter((item) => item.id !== condition.id))} size="xs" type="button" variant="ghost"><Trash /></Button>
          </div>
          {editingId === condition.id ? <div className={styles.conditionEditor}>
            <label><FieldLabel>条件字段</FieldLabel><FieldSelect ariaLabel={`第 ${index + 1} 个条件字段`} onChange={(field) => update(condition.id, { field })} options={fieldOptions} value={condition.field} /></label>
            <label><FieldLabel>判断方式</FieldLabel><FieldSelect ariaLabel={`第 ${index + 1} 个条件运算符`} onChange={(operator) => update(condition.id, { operator })} options={operatorOptions} value={condition.operator} /></label>
            <label><FieldLabel required>匹配值</FieldLabel>{condition.field === "策略集" ? <FieldSelect ariaLabel={`第 ${index + 1} 个条件值`} onChange={(value) => update(condition.id, { value })} options={[...policySets]} value={condition.value} /> : <Input aria-label={`第 ${index + 1} 个条件值`} onChange={(event) => update(condition.id, { value: event.target.value })} placeholder="请输入稳定 ID 或字段值" size="md" value={condition.value} />}</label>
          </div> : null}
        </div>
      ))}
      <Button className={styles.addButton} leadingIcon={Plus} onClick={() => { const condition = makeCondition(conditions.length); onChange([...conditions, condition]); setEditingId(condition.id); }} size="sm" type="button" variant="ghost">添加条件</Button>
    </div>
  );
}

function WindowRows({ windows, onChange }: { windows: LimitWindow[]; onChange: (windows: LimitWindow[]) => void }) {
  const Chevron = useIcon("chevron-down");
  const Plus = useIcon("plus");
  const Trash = useIcon("trash");
  const [editingId, setEditingId] = useState<string | null>(null);
  const update = (id: string, patch: Partial<LimitWindow>) => onChange(windows.map((item) => item.id === id ? { ...item, ...patch } : item));
  return (
    <div className={styles.rowGroup}>
      {windows.map((windowItem, index) => (
        <div className={cn(styles.configItem, editingId === windowItem.id && styles.configItemEditing)} key={windowItem.id}>
          <div className={styles.configSummary}>
            <button aria-expanded={editingId === windowItem.id} aria-label={`配置第 ${index + 1} 个时间窗口`} onClick={() => setEditingId(editingId === windowItem.id ? null : windowItem.id)} type="button">
              {index > 0 ? <span className={styles.logicBadge}>且</span> : null}
              <span className={styles.summaryTitle}>每{windowItem.unit}</span>
              <span className={styles.summaryValue}>最多 {windowItem.count} 次 · 突发 {windowItem.burst} 次</span>
              <Chevron aria-hidden className={cn(styles.summaryChevron, editingId === windowItem.id && styles.summaryChevronOpen)} />
            </button>
            <Button aria-label={`删除第 ${index + 1} 个时间窗口`} iconOnly onClick={() => onChange(windows.filter((item) => item.id !== windowItem.id))} size="xs" type="button" variant="ghost"><Trash /></Button>
          </div>
          {editingId === windowItem.id ? <div className={styles.windowEditor}>
            <label><FieldLabel>窗口单位</FieldLabel><FieldSelect ariaLabel={`第 ${index + 1} 个时间窗口`} onChange={(unit) => update(windowItem.id, { unit })} options={unitOptions} value={windowItem.unit} /></label>
            <label><FieldLabel required>最多请求数</FieldLabel><Input aria-label={`第 ${index + 1} 个时间窗口频次`} min={1} onChange={(event) => update(windowItem.id, { count: Number(event.target.value) || 1 })} size="md" type="number" value={windowItem.count} /></label>
            <label><FieldLabel required>突发请求数</FieldLabel><Input aria-label={`第 ${index + 1} 个时间窗口突发数`} min={1} onChange={(event) => update(windowItem.id, { burst: Number(event.target.value) || 1 })} size="md" type="number" value={windowItem.burst} /></label>
          </div> : null}
        </div>
      ))}
      <Button className={styles.addButton} leadingIcon={Plus} onClick={() => { const windowItem = makeWindow(windows.length); onChange([...windows, windowItem]); setEditingId(windowItem.id); }} size="sm" type="button" variant="ghost">添加时间窗口</Button>
    </div>
  );
}

function TemporaryThresholdFields({ value, onChange }: { value: GlobalLimit; onChange: (patch: Partial<GlobalLimit>) => void }) {
  const timeZone = "Asia/Shanghai";
  const from = parseISODateTime(`${value.temporaryStart}:00+08:00`);
  const to = parseISODateTime(`${value.temporaryEnd}:00+08:00`);
  const updateDateTime = (key: "temporaryStart" | "temporaryEnd", next: Parameters<typeof instantToZonedDateTime>[0] | undefined) => {
    if (!next) { onChange({ [key]: "" }); return; }
    const local = instantToZonedDateTime(next, timeZone);
    onChange({ [key]: `${local.date}T${local.time.slice(0, 5)}` });
  };
  const updateWindow = (id: string, patch: Partial<LimitWindow>) => onChange({
    temporaryWindows: value.temporaryWindows.map((item) => item.id === id ? { ...item, ...patch } : item),
  });
  return (
    <div className={styles.temporaryPanel}>
      <div className={styles.temporaryRows}>
        {value.temporaryWindows.map((windowItem, index) => (
          <div className={styles.temporaryRow} key={windowItem.id}>
            <span>临时提高每{windowItem.unit}</span>
            <Input aria-label={`第 ${index + 1} 个临时窗口最多请求数`} min={1} onChange={(event) => updateWindow(windowItem.id, { count: Number(event.target.value) || 1 })} size="md" type="number" value={windowItem.count} />
            <span>次、冲高</span>
            <Input aria-label={`第 ${index + 1} 个临时窗口突发请求数`} min={1} onChange={(event) => updateWindow(windowItem.id, { burst: Number(event.target.value) || 1 })} size="md" type="number" value={windowItem.burst} />
            <span>次</span>
          </div>
        ))}
      </div>
      <div className={styles.temporaryDates}>
        <div><FieldLabel required>开始时间</FieldLabel><DateTimePicker aria-label="临时阈值开始时间" className="w-full" commitMode="apply" granularity="minute" hourCycle={24} locale="zh-CN" maxValue={to} messages={{ apply: "确定", cancel: "取消", clear: "清除", invalidValue: "请输入有效时间", selectDateTime: "选择开始时间" }} minuteStep={1} onValueChange={(next) => updateDateTime("temporaryStart", next)} timeZone={timeZone} value={from} /></div>
        <div><FieldLabel required>结束时间</FieldLabel><DateTimePicker aria-label="临时阈值结束时间" className="w-full" commitMode="apply" granularity="minute" hourCycle={24} locale="zh-CN" messages={{ apply: "确定", cancel: "取消", clear: "清除", invalidValue: "请输入有效时间", selectDateTime: "选择结束时间" }} minValue={from} minuteStep={1} onValueChange={(next) => updateDateTime("temporaryEnd", next)} timeZone={timeZone} value={to} /></div>
      </div>
    </div>
  );
}

const actionCopy: Array<{ value: LimitAction; title: string; description: string }> = [
  { value: "reject", title: "拒绝（返回 429）", description: "返回 TRAFFIC_RATE_LIMITED 与 Retry-After" },
  { value: "queue", title: "排队等一会儿", description: "等待可用配额" },
  { value: "reply", title: "返回固定答复", description: "不再调用模型" },
];

function actionTitle(action: LimitAction) {
  return actionCopy.find((item) => item.value === action)?.title ?? "未配置";
}

function ActionFields({ value, onChange }: { value: GlobalLimit; onChange: (patch: Partial<GlobalLimit>) => void }) {
  return (
    <div className={styles.actionFields}>
      <RadioGroup className={styles.actionOptions} onValueChange={(next) => onChange({ action: next as LimitAction })} value={value.action}>
        {actionCopy.map((item) => (
          <label className={cn(styles.actionOption, value.action === item.value && styles.actionOptionSelected)} key={item.value}>
            <RadioGroupItem value={item.value} />
            <span><strong>{item.title}</strong><small>{item.description}</small></span>
          </label>
        ))}
      </RadioGroup>
      {value.action === "queue" ? (
        <div className={styles.parameterGrid}>
          <label><FieldLabel required>队列容量</FieldLabel><Input max={512} min={1} onChange={(event) => onChange({ queueSize: Number(event.target.value) || 1 })} size="md" type="number" value={value.queueSize} /></label>
          <label><FieldLabel required>最长等待（毫秒）</FieldLabel><Input max={30000} min={100} onChange={(event) => onChange({ queueWaitMs: Number(event.target.value) || 100 })} size="md" type="number" value={value.queueWaitMs} /></label>
        </div>
      ) : null}
      {value.action === "reply" ? (
        <div className={styles.parameterGrid}>
          <label className={styles.fullField}><FieldLabel required>助手回复内容</FieldLabel><Textarea onChange={(event) => onChange({ replyContent: event.target.value })} rows={3} value={value.replyContent} /></label>
          <label className={styles.fullField}><FieldLabel required>原因代码</FieldLabel><Input maxLength={64} onChange={(event) => onChange({ reasonCode: event.target.value })} size="md" value={value.reasonCode} /></label>
        </div>
      ) : null}
    </div>
  );
}

type LimitIssue = { nodeId: string; message: string };

function validateLimit(value: GlobalLimit): LimitIssue[] {
  const issues: LimitIssue[] = [];
  if (!value.conditions.length) issues.push({ nodeId: "scope", message: "至少添加一个计数对象条件" });
  else if (value.conditions.some((condition) => !condition.value.trim())) issues.push({ nodeId: "scope", message: "请填写每个计数对象条件的匹配值" });
  if (!value.windows.length) issues.push({ nodeId: "windows", message: "至少添加一个限额时间窗口" });
  else if (value.windows.length > 3) issues.push({ nodeId: "windows", message: "限速最多配置 3 个时间桶" });
  else if (new Set(value.windows.map((windowItem) => windowItem.unit)).size !== value.windows.length) issues.push({ nodeId: "windows", message: "每秒、每分钟、每小时各只能配置一个时间桶" });
  if (value.temporaryEnabled && (!value.temporaryStart || !value.temporaryEnd)) issues.push({ nodeId: "windows", message: "请填写临时阈值的开始和结束时间" });
  else if (value.temporaryEnabled && value.temporaryEnd <= value.temporaryStart) issues.push({ nodeId: "windows", message: "临时阈值结束时间应晚于开始时间" });
  else if (value.temporaryEnabled && new Date(value.temporaryEnd).getTime() - new Date(value.temporaryStart).getTime() > 30 * 24 * 60 * 60 * 1000) issues.push({ nodeId: "windows", message: "临时抬高最长只能持续 30 天" });
  else if (value.temporaryEnabled && value.temporaryWindows.some((item) => { const base = value.windows.find((windowItem) => windowItem.unit === item.unit); return base && (item.count < base.count || item.burst < base.burst); })) issues.push({ nodeId: "windows", message: "临时阈值只能抬高，不能低于基线额度" });
  if (value.action === "queue" && (value.queueSize < 1 || value.queueSize > 512 || value.queueWaitMs < 100 || value.queueWaitMs > 30000)) issues.push({ nodeId: "action", message: "队列容量须为 1–512，最长等待须为 100–30000 毫秒" });
  if (value.action === "reply" && !value.replyContent.trim()) issues.push({ nodeId: "action", message: "请填写超限后的固定答复内容" });
  if (value.action === "reply" && (!value.reasonCode.trim() || value.reasonCode.length > 64)) issues.push({ nodeId: "action", message: "固定答复需要 1–64 字节的原因代码" });
  return issues;
}

function limitResult(value: GlobalLimit) {
  const windows = value.windows.length ? value.windows.map((item) => `每${item.unit} ${item.count} 次（突发 ${item.burst}）`).join("、") : "尚未配置额度";
  const temporary = value.temporaryEnabled
    ? `；${value.temporaryStart.replace("T", " ")} 至 ${value.temporaryEnd.replace("T", " ")} 临时调整为 ${value.temporaryWindows.map((item) => `每${item.unit} ${item.count} 次（突发 ${item.burst}）`).join("、")}`
    : "";
  if (value.action === "queue") return `${windows}${temporary}；超限后最多排队 ${value.queueSize} 个请求，每个等待 ${value.queueWaitMs} 毫秒。`;
  if (value.action === "reply") return `${windows}${temporary}；超限后直接返回固定答复，不再调用模型。`;
  return `${windows}${temporary}；任一窗口超限后返回 429 TRAFFIC_RATE_LIMITED，并附带 Retry-After。`;
}

function LimitPreview({ issues, onFocusNode, onTabChange, tab, value }: { issues: LimitIssue[]; onFocusNode: (id: string) => void; onTabChange: (tab: "test" | "check") => void; tab: "test" | "check"; value: GlobalLimit }) {
  const Check = useIcon("check");
  const Checklist = useIcon("list-checks");
  const Info = useIcon("doc-info-item");
  const Play = useIcon("play");
  const [scenario, setScenario] = useState<"within" | "exceeded">("within");
  const [result, setResult] = useState<"within" | "exceeded" | null>(null);
  const runTest = () => {
    if (issues.length) {
      onTabChange("check");
      return;
    }
    setResult(scenario);
  };
  return <div className={styles.previewPanel}>
    <header className={styles.previewHeader}><h2>调试与预览</h2></header>
    <Tabs className={styles.previewTabs} color="brand" onValueChange={(next) => onTabChange(next === "check" ? "check" : "test")} value={tab === "test" ? "run" : "check"} variant="underline">
      <div className={styles.previewTabList}><TabsList aria-label="限额调试工具" className="w-full"><TabItem className="flex-1 justify-center" icon={Play} label="试运行" value="run" /><TabItem badge={issues.length ? { children: issues.length, status: "warning" } : undefined} className="flex-1 justify-center" icon={Checklist} label="配置检查" value="check" /></TabsList></div>
      <TabPanel className={styles.previewScroll} value="run">
        <div className={styles.testBody}>
          <p>在本地模拟一次计数结果，确认达到限额时网关如何处理请求。</p>
          <label><FieldLabel>模拟情景</FieldLabel><Select itemDensity="compact" onValueChange={(next) => { setScenario(next as "within" | "exceeded"); setResult(null); }} size="md" value={scenario}><SelectTrigger aria-label="限额模拟情景" className="w-full" /><SelectContent><SelectItem value="within">未达到限额</SelectItem><SelectItem value="exceeded">达到任一窗口上限</SelectItem></SelectContent></Select></label>
          <Button className="w-full" leadingIcon={Play} onClick={runTest} size="md" type="button" variant="primary">运行测试</Button>
          {issues.length ? <button className={styles.testIssue} onClick={() => onTabChange("check")} type="button">还有 {issues.length} 项配置待完善，查看配置检查</button> : null}
        </div>
        <section aria-live="polite" className={styles.testResult}>
          <h3>运行结果</h3>
          {result ? <div className={styles.testResultCard}><Badge size="sm" status={result === "exceeded" ? "warning" : "success"} variant="dot">{result === "exceeded" ? "已达到限额" : "配额充足"}</Badge><p>{result === "exceeded" ? limitResult(value) : "请求未达到任何限额窗口，将继续执行后续网关路由。"}</p></div> : <div className={styles.testEmpty}><Play aria-hidden /><strong>等待试运行</strong><p>选择模拟情景并运行，查看请求最终结果。</p></div>}
        </section>
      </TabPanel>
      <TabPanel className={styles.previewScroll} value="check">
        <div className={styles.previewBody}>
          <section>
            <div className={styles.sectionTitle}><h3>配置检查</h3><Badge size="sm" status={issues.length ? "warning" : "success"} variant="dot">{issues.length ? `${issues.length} 项待完善` : "已完成"}</Badge></div>
            {issues.length ? <div className={styles.issueList}>{issues.map((issue, index) => <button key={`${issue.nodeId}-${index}`} onClick={() => onFocusNode(issue.nodeId)} type="button"><Info aria-hidden /><span>{issue.message}</span></button>)}</div> : <div className={styles.successState}><Check aria-hidden /><span>必填配置完整，可以保存并启用限额。</span></div>}
          </section>
          <section>
            <h3>生效预览</h3>
            <dl className={styles.previewFacts}>
              <div><dt>计数方式</dt><dd>{value.limitType} · {value.dimension}</dd></div>
              <div><dt>匹配范围</dt><dd>{value.conditions.length ? `${value.conditions.length} 个条件全部满足` : "未配置"}</dd></div>
              <div><dt>额度窗口</dt><dd>{value.windows.length ? `${value.windows.length} 个窗口，任一达到即超限` : "未配置"}</dd></div>
              <div><dt>临时阈值</dt><dd>{value.temporaryEnabled ? `${value.temporaryStart.replace("T", " ")} 至 ${value.temporaryEnd.replace("T", " ")}` : "未启用"}</dd></div>
              <div><dt>超限动作</dt><dd>{actionTitle(value.action)}</dd></div>
            </dl>
          </section>
          <section><h3>最终结果</h3><p className={styles.resultCopy}>{limitResult(value)}</p></section>
        </div>
      </TabPanel>
    </Tabs>
  </div>;
}

function DiscardDialog({ onDiscard, onKeep }: { onDiscard: () => void; onKeep: () => void }) {
  return <Dialog onOpenChange={(open) => { if (!open) onKeep(); }} open><DialogContent size="sm"><DialogHeader><DialogTitle>退出限额编辑？</DialogTitle><DialogDescription>本次修改尚未保存，退出后将丢失这些修改。</DialogDescription></DialogHeader><DialogFooter><Button onClick={onKeep} variant="tertiary">继续编辑</Button><Button onClick={onDiscard} variant="destructive">放弃修改</Button></DialogFooter></DialogContent></Dialog>;
}

export function LimitForm({ initial, onCancel, onSave }: { initial?: GlobalLimit; onCancel: () => void; onSave: (limit: GlobalLimit) => void }) {
  const Close = useIcon("x");
  const Check = useIcon("check");
  const Gauge = useIcon("clock");
  const Play = useIcon("play");
  const initialValue = useMemo(() => initial ? { ...structuredClone(initial), conditionLogic: "and" as const } : createDefaultLimit(), [initial]);
  const original = useRef(JSON.stringify(initialValue));
  const [value, setValue] = useState(initialValue);
  const [expanded, setExpanded] = useState<string[]>(["scope"]);
  const [showIssues, setShowIssues] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(true);
  const [previewTab, setPreviewTab] = useState<"test" | "check">("test");
  const [discardOpen, setDiscardOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [compact, setCompact] = useState(() => typeof window !== "undefined" && window.innerWidth <= 900);
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const panelRef = useDialogFocus(compact && previewOpen, () => setPreviewOpen(false));
  const issues = validateLimit(value);
  const dirty = JSON.stringify(value) !== original.current;
  const requestExit = () => dirty ? setDiscardOpen(true) : onCancel();
  const dialogRef = useDialogFocus(!discardOpen, requestExit);
  const attachDialog = useCallback((element: HTMLDivElement | null) => { dialogRef.current = element; setPortalContainer(element); }, [dialogRef]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 900px)");
    const update = () => {
      setCompact(media.matches);
      if (media.matches) setPreviewOpen(false);
    };
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const patchValue = (patch: Partial<GlobalLimit>) => { setValue((current) => ({ ...current, ...patch })); };
  const toggle = (id: string) => setExpanded((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const issueFor = (id: string) => showIssues ? issues.find((issue) => issue.nodeId === id)?.message : undefined;
  const focusNode = (id: string) => {
    setExpanded((current) => current.includes(id) ? current : [...current, id]);
    if (compact) setPreviewOpen(false);
    window.requestAnimationFrame(() => canvasRef.current?.querySelector<HTMLElement>(`[data-node-id="${id}"]`)?.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }));
  };
  const checkConfiguration = () => {
    setShowIssues(true);
    setPreviewOpen(true);
    setPreviewTab("check");
    if (issues.length) focusNode(issues[0]!.nodeId);
  };
  const openTest = () => {
    setPreviewOpen(true);
    setPreviewTab("test");
  };
  const submit = (event: FormEvent) => { event.preventDefault(); if (issues.length) { checkConfiguration(); return; } onSave(value); };
  const overview = () => { setExpanded([]); setZoom(100); canvasRef.current?.scrollTo({ top: 0, left: 0 }); };

  return <div className={flowStyles.workspace} ref={attachDialog} role="dialog" aria-modal="true" aria-labelledby="limit-workflow-title" tabIndex={-1}>
    <PortalContainerProvider value={portalContainer}>
      <form className={styles.form} onSubmit={submit}>
        <header className={`${flowStyles.topbar} ${flowStyles.editorTopbar}`}>
          <Button aria-label={initial ? "关闭限额编辑" : "关闭限额创建"} iconOnly onClick={requestExit} type="button" variant="tertiary"><Close aria-hidden /></Button>
          <div className={flowStyles.heading}><h1 className="sr-only" id="limit-workflow-title">{initial ? "编辑全局限额" : "新建全局限额"}</h1><Input aria-label="限额名称" className={flowStyles.titleInput} onChange={(event) => patchValue({ name: event.target.value })} placeholder="未命名限额" title={value.name || "未命名限额"} value={value.name} variant="ghost" /><span className={flowStyles.draftLabel}>{initial ? "编辑中" : "草稿"}</span></div>
          <div className={flowStyles.topActions}><span className={flowStyles.savedState}>{dirty ? "有未保存的修改" : initial ? "已保存" : "尚未保存"}</span>{issues.length ? <Button aria-label={`配置异常，共 ${issues.length} 项，跳转到第一处`} onClick={checkConfiguration} size="md" tone="warning" type="button" variant="tertiary"><span className="inline-flex items-center gap-1.5"><span>配置异常</span><Badge aria-hidden size="sm" status="warning">{issues.length}</Badge></span></Button> : <span className="inline-flex h-control-md items-center gap-1.5 rounded-lg px-2 text-body text-fg-default"><Check aria-hidden className="size-4 text-fg-brand" />配置正常</span>}<Button active={previewOpen && previewTab === "test"} leadingIcon={Play} onClick={openTest} size="md" type="button" variant="tertiary">试运行</Button><Button onClick={requestExit} size="md" type="button" variant="tertiary">取消</Button>{issues.length ? <Tooltip content={`还有 ${issues.length} 项配置需要完善`}><span aria-label={`保存限额不可用，还有 ${issues.length} 项配置需要完善`} className="inline-flex" tabIndex={0}><Button disabled size="md" type="submit" variant="primary">保存限额</Button></span></Tooltip> : <Button size="md" type="submit" variant="primary">保存限额</Button>}</div>
        </header>
        <div className={flowStyles.body}>
          <section aria-label="全局限额编排画布" className={flowStyles.canvasPanel}>
            <header className={flowStyles.toolbar}><div className={flowStyles.toolbarTitle}><Gauge aria-hidden className="size-4 text-fg-subtle" /><strong>限额编排</strong><span className={flowStyles.toolbarHint}>从计数对象到超限结果，看清配额如何生效</span></div><Button onClick={() => setExpanded(expanded.length ? [] : allNodeIds)} size="sm" type="button" variant="ghost">{expanded.length ? "收起节点" : "展开节点"}</Button></header>
            <div className={flowStyles.canvasFrame}>
              <div aria-label="全局限额流程画布，可横向和纵向滚动" className={flowStyles.canvas} ref={canvasRef} role="region" tabIndex={0}>
                <div className={cn(flowStyles.flow, styles.flow)} style={{ zoom: zoom / 100 } as CSSProperties}>
                  <WorkflowNode description={`${value.limitType} · ${value.dimension}`} expanded={expanded.includes("start")} footer={<>节点输出 <code>request_count</code></>} icon="globe" id="start" onToggle={() => toggle("start")} title="请求计数入口">
                    <div className={styles.fields}><label><FieldLabel>限额名称</FieldLabel><Input onChange={(event) => patchValue({ name: event.target.value })} placeholder="例如：生产环境模型调用限速" size="md" value={value.name} /></label><label><FieldLabel required>保护家族</FieldLabel><FieldSelect ariaLabel="保护家族" onChange={(limitType) => patchValue({ limitType })} options={["限速（GCRA）"]} value={value.limitType} /></label></div>
                  </WorkflowNode>
                  <FlowConnector><span>确定计数对象</span></FlowConnector>
                  <WorkflowNode description={value.conditions.length ? `${value.dimension} · ${value.conditions.length} 个匹配条件` : "尚未配置计数对象"} expanded={expanded.includes("scope")} footer={<>节点输出 <code>quota_key</code><span className="ml-auto">{value.conditions.filter((item) => item.value.trim()).length}/{value.conditions.length} 已配置</span></>} icon="users" id="scope" issue={issueFor("scope")} onToggle={() => toggle("scope")} title="计数对象" tone="purple">
                    <div className={styles.fields}><label><FieldLabel required>计数维度</FieldLabel><FieldSelect ariaLabel="计数维度" onChange={(dimension) => patchValue({ dimension })} options={[...limitDimensions]} value={value.dimension} /></label><div><div className={styles.conditionHeader}><FieldLabel required>本限额的匹配条件</FieldLabel><span className={styles.conditionHint}>全部条件均需满足（AND）</span></div><ConditionRows conditions={value.conditions} onChange={(conditions) => patchValue({ conditions })} /></div></div>
                  </WorkflowNode>
                  <FlowConnector><span>按窗口累计用量</span></FlowConnector>
                  <WorkflowNode description={value.windows.length ? value.windows.map((item) => `每${item.unit} ${item.count} 次`).join(" · ") : "尚未配置限额窗口"} expanded={expanded.includes("windows")} footer={<>节点输出 <code>quota_exceeded: boolean</code><span className="ml-auto">{value.windows.length} 个窗口</span></>} icon="clock" id="windows" issue={issueFor("windows")} onToggle={() => toggle("windows")} title="限额窗口" tone="purple">
                    <div className={styles.fields}><div><FieldLabel required>时间窗口</FieldLabel><WindowRows onChange={(windows) => patchValue({ windows })} windows={value.windows} /></div><label className={styles.checkboxRow}><Checkbox checked={value.temporaryEnabled} onCheckedChange={(checked) => patchValue({ temporaryEnabled: Boolean(checked) })} />启用临时阈值</label>{value.temporaryEnabled ? <TemporaryThresholdFields onChange={patchValue} value={value} /> : null}</div>
                  </WorkflowNode>
                  <FlowConnector><span>超限时执行</span></FlowConnector>
                  <WorkflowNode description={actionTitle(value.action)} expanded={expanded.includes("action")} footer={<>执行条件 <code>quota_exceeded = true</code></>} icon="shield" id="action" issue={issueFor("action")} onToggle={() => toggle("action")} title="超限处置" tone="amber"><ActionFields onChange={patchValue} value={value} /></WorkflowNode>
                  <FlowConnector />
                  <WorkflowNode description={limitResult(value)} expanded={expanded.includes("result")} footer={<>节点输出 <code>gateway_response</code></>} icon="check-square" id="result" onToggle={() => toggle("result")} title="处理结果" tone="green"><p className={styles.result}>{limitResult(value)}</p><p className={styles.help}>未达到限额时，请求不受影响，继续执行后续网关路由。</p></WorkflowNode>
                </div>
              </div>
              <div className={flowStyles.canvasControls}><WorkflowZoomSelect ariaLabel="限额画布缩放" onChange={setZoom} value={zoom} /><span className="h-4 border-r border-border" /><Button onClick={overview} size="sm" type="button" variant="ghost">流程总览</Button></div>
            </div>
          </section>
          {previewOpen ? <><button aria-label="关闭调试与预览" className={styles.previewBackdrop} onClick={() => setPreviewOpen(false)} tabIndex={-1} type="button" /><aside aria-label="调试与预览" aria-modal={compact || undefined} className={flowStyles.preview} ref={panelRef} role={compact ? "dialog" : "complementary"}><LimitPreview issues={issues} onFocusNode={focusNode} onTabChange={setPreviewTab} tab={previewTab} value={value} /></aside></> : null}
        </div>
      </form>
      {discardOpen ? <DiscardDialog onDiscard={onCancel} onKeep={() => setDiscardOpen(false)} /> : null}
    </PortalContainerProvider>
  </div>;
}
