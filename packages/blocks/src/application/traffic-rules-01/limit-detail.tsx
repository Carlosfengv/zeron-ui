"use client";

import { useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "@zeron/ui/dropdown";
import { MenuItem } from "@zeron/ui/menu-item";
import { Switch } from "@zeron/ui/switch";
import { useIcon } from "@zeron/ui/system/icon-context";
import { PortalContainerProvider } from "@zeron/ui/system/portal-container-context";
import { cn } from "@zeron/ui/system/utils";
import type { GlobalLimit } from "./traffic-types";
import { FlowConnector, WorkflowNode } from "./workflow-node";
import { WorkflowZoomSelect } from "./workflow-zoom-select";
import flowStyles from "./rule-workflow.module.css";
import styles from "./limit-detail.module.css";

const nodeIds = ["start", "scope", "windows", "action", "result"];

function actionTitle(limit: GlobalLimit) {
  if (limit.action === "queue") return `进入队列，最多等待 ${limit.queueWaitMs} 毫秒`;
  if (limit.action === "reply") return "返回固定答复，不再调用模型";
  return "返回 429 TRAFFIC_RATE_LIMITED，并附带 Retry-After";
}

function resultText(limit: GlobalLimit) {
  const windows = limit.windows.map((item) => `每${item.unit} ${item.count} 次（突发 ${item.burst}）`).join("、") || "未配置限额窗口";
  const temporary = limit.temporaryEnabled
    ? `；${limit.temporaryStart.replace("T", " ")} 至 ${limit.temporaryEnd.replace("T", " ")} 临时调整为 ${limit.temporaryWindows.map((item) => `每${item.unit} ${item.count} 次（突发 ${item.burst}）`).join("、")}`
    : "";
  return `${windows}${temporary}；${actionTitle(limit)}。`;
}

function ReadonlyRows({ children }: { children: ReactNode }) {
  return <dl className={styles.fields}>{children}</dl>;
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return <div><dt>{label}</dt><dd>{value}</dd></div>;
}

function LimitInfo({ limit, onToggle }: { limit: GlobalLimit; onToggle: () => void }) {
  return <aside className={styles.infoPanel} aria-label="限额信息">
    <header className={styles.infoHeader}><h2>限额信息</h2></header>
    <div className={styles.infoBody}>
      <section className={styles.infoSection}>
        <ReadonlyRows>
          <Field label="限额名称" value={limit.name || "未命名限额"} />
          <Field label="限额 ID" value={<span className={styles.breakValue}>{limit.code}</span>} />
          <Field label="顺序号" value={limit.order} />
        </ReadonlyRows>
        <div className={styles.statusRow}><span>当前状态</span><span className={styles.statusControls}><Badge color={limit.enabled ? "green" : "red"} size="sm" variant="dot">{limit.enabled ? "已启用" : "已停用"}</Badge><Switch checked={limit.enabled} label="启用限额" onCheckedChange={onToggle} /></span></div>
        <p className={styles.stateNote}>{limit.enabled ? "已参与全局请求计数，命中条件后按下方窗口累计用量。" : "当前不参与请求计数，下方展示的是启用后的配置预期。"}</p>
      </section>
      <section className={styles.infoSection}>
        <h3>生效摘要</h3>
        <p className={styles.paragraph}>{resultText(limit)}</p>
      </section>
      <section className={styles.infoSection}>
        <h3>未达到限额时</h3>
        <p className={styles.paragraph}>请求不受影响，继续执行后续网关路由。</p>
      </section>
    </div>
  </aside>;
}

export function LimitDetailView({ limit, onBack, onDelete, onEdit, onHistory, onToggle }: { limit: GlobalLimit; onBack: () => void; onDelete: () => void; onEdit: () => void; onHistory: () => void; onToggle: () => void }) {
  const ArrowLeft = useIcon("arrow-left");
  const Gauge = useIcon("clock");
  const Edit = useIcon("pencil");
  const More = useIcon("ellipsis");
  const [expanded, setExpanded] = useState(nodeIds);
  const [zoom, setZoom] = useState(100);
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const configuredConditions = useMemo(() => limit.conditions.filter((item) => item.value.trim()).length, [limit.conditions]);
  const toggle = (id: string) => setExpanded((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const overview = () => { setExpanded([]); setZoom(100); canvasRef.current?.scrollTo({ top: 0, left: 0 }); };

  return <div className={cn(flowStyles.workspace, styles.page)} ref={setPortalContainer} role="region" aria-label="全局限额详情">
    <PortalContainerProvider value={portalContainer}>
      <header className={flowStyles.topbar}>
        <Button aria-label="返回全局限额" leadingIcon={ArrowLeft} onClick={onBack} size="sm" variant="ghost">返回</Button>
        <div className={styles.name}><h1 title={limit.name || "未命名限额"}>{limit.name || "未命名限额"}</h1><Badge color={limit.enabled ? "green" : "red"} size="sm" variant="dot">{limit.enabled ? "已启用" : "已停用"}</Badge><span className={styles.readOnly}>只读</span></div>
        <div className={styles.topActions}>
          <DropdownMenu><DropdownTrigger render={<Button aria-label="更多限额操作" iconOnly size="md" variant="ghost"><More /></Button>} /><DropdownContent align="end" className="w-40"><MenuItem index={0} label="修改记录" onSelect={onHistory} /><MenuItem className="text-fg-danger" index={1} label="删除限额" onSelect={onDelete} /></DropdownContent></DropdownMenu>
          <Button leadingIcon={Edit} onClick={onEdit} size="md" variant="primary">编辑限额</Button>
        </div>
      </header>
      <div className={flowStyles.body}>
        <section className={flowStyles.canvasPanel} aria-label="全局限额详情流程">
          <header className={flowStyles.toolbar}><div className={flowStyles.toolbarTitle}><Gauge aria-hidden className="size-4 text-fg-subtle" /><strong>限额流程</strong><span className={flowStyles.toolbarHint}>从计数对象到超限结果，看清限额如何生效</span></div><Button onClick={() => setExpanded(expanded.length ? [] : nodeIds)} size="sm" variant="ghost">{expanded.length ? "收起节点" : "展开节点"}</Button></header>
          <div className={flowStyles.canvasFrame}>
            <div aria-label="只读限额流程画布，可横向和纵向滚动" className={flowStyles.canvas} ref={canvasRef} role="region" tabIndex={0}>
              <div className={cn(flowStyles.flow, styles.flow)} style={{ zoom: zoom / 100 } as CSSProperties}>
                <WorkflowNode description={`${limit.limitType} · ${limit.dimension}`} expanded={expanded.includes("start")} footer={<>节点输出 <code>request_count</code></>} icon="globe" id="start" onToggle={() => toggle("start")} title="请求计数入口">
                  <ReadonlyRows><Field label="限制类型" value={limit.limitType} /><Field label="计数维度" value={limit.dimension} /></ReadonlyRows>
                </WorkflowNode>
                <FlowConnector><span>确定计数对象</span></FlowConnector>
                <WorkflowNode description={`${limit.dimension} · ${limit.conditions.length} 个匹配条件`} expanded={expanded.includes("scope")} footer={<>节点输出 <code>quota_key</code><span className="ml-auto">{configuredConditions}/{limit.conditions.length} 已配置</span></>} icon="users" id="scope" onToggle={() => toggle("scope")} title="计数对象" tone="purple">
                  <div className={styles.sectionHeading}><span>本限额的匹配条件</span><Badge color="purple" size="sm">{limit.conditionLogic === "and" ? "全部条件（AND）" : "任一条件（OR）"}</Badge></div>
                  <div className={styles.rowList}>{limit.conditions.map((condition, index) => <div className={styles.summaryRow} key={condition.id}>{index ? <span className={styles.logic}>{limit.conditionLogic === "and" ? "且" : "或"}</span> : <span aria-hidden />}<strong>{condition.field}</strong><span>{condition.operator} {condition.value || "未填写匹配值"}</span></div>)}</div>
                </WorkflowNode>
                <FlowConnector><span>按窗口累计用量</span></FlowConnector>
                <WorkflowNode description={limit.windows.map((item) => `每${item.unit} ${item.count} 次`).join(" · ")} expanded={expanded.includes("windows")} footer={<>节点输出 <code>quota_exceeded: boolean</code><span className="ml-auto">{limit.windows.length} 个窗口</span></>} icon="clock" id="windows" onToggle={() => toggle("windows")} title="限额窗口" tone="purple">
                  <div className={styles.rowList}>{limit.windows.map((item) => <div className={styles.windowRow} key={item.id}><strong>每{item.unit}</strong><span>最多 {item.count} 次</span><span>突发 {item.burst} 次</span></div>)}</div>
                  <div className={cn(styles.temporary, !limit.temporaryEnabled && styles.temporaryOff)}><div><strong>临时阈值</strong><span>{limit.temporaryEnabled ? `${limit.temporaryStart.replace("T", " ")} 至 ${limit.temporaryEnd.replace("T", " ")}` : "未启用"}</span></div>{limit.temporaryEnabled ? <p>{limit.temporaryWindows.map((item) => `每${item.unit} ${item.count} 次（突发 ${item.burst}）`).join("、")}</p> : null}</div>
                </WorkflowNode>
                <FlowConnector><span>超限时执行</span></FlowConnector>
                <WorkflowNode description={actionTitle(limit)} expanded={expanded.includes("action")} footer={<>执行条件 <code>quota_exceeded = true</code></>} icon="shield" id="action" onToggle={() => toggle("action")} title="超限处置" tone="amber">
                  <ReadonlyRows><Field label="处置方式" value={actionTitle(limit)} />{limit.action === "queue" ? <><Field label="队列容量" value={`${limit.queueSize} 个请求`} /><Field label="最长等待" value={`${limit.queueWaitMs} 毫秒`} /></> : null}{limit.action === "reply" ? <><Field label="固定答复" value={limit.replyContent} /><Field label="原因代码" value={limit.reasonCode || "—"} /></> : null}</ReadonlyRows>
                </WorkflowNode>
                <FlowConnector />
                <WorkflowNode description={resultText(limit)} expanded={expanded.includes("result")} footer={<>节点输出 <code>gateway_response</code></>} icon="check-square" id="result" onToggle={() => toggle("result")} title="处理结果" tone="green"><p className={styles.result}>{resultText(limit)}</p><p className={styles.help}>未达到限额时，请求不受影响，继续执行后续网关路由。</p></WorkflowNode>
              </div>
            </div>
            <div className={flowStyles.canvasControls}><WorkflowZoomSelect ariaLabel="限额详情画布缩放" onChange={setZoom} value={zoom} /><span className="h-4 border-r border-border" /><Button onClick={overview} size="sm" variant="ghost">流程总览</Button></div>
          </div>
        </section>
        <LimitInfo limit={limit} onToggle={onToggle} />
      </div>
    </PortalContainerProvider>
  </div>;
}
