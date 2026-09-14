"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "@zeron/ui/dropdown";
import { MenuItem } from "@zeron/ui/menu-item";
import { Switch } from "@zeron/ui/switch";
import { useIcon, type IconName } from "@zeron/ui/system/icon-context";
import { PortalContainerProvider } from "@zeron/ui/system/portal-container-context";
import { cn } from "@zeron/ui/system/utils";
import type { RuleFormValue } from "./rule-config";
import { buildRuleDetail, type RuleDetail } from "./rule-detail-model";
import { DetailFields, RuleWorkflowSummary } from "./rule-workflow-summary";
import { WorkflowPreview } from "./workflow-preview";
import { WorkflowZoomSelect } from "./workflow-zoom-select";
import { useDialogFocus } from "./use-dialog-focus";
import flowStyles from "./rule-workflow.module.css";
import styles from "./rule-detail.module.css";

function SectionLink({ icon, label, count, onClick }: { icon: IconName; label: string; count?: number; onClick: () => void }) {
  const Icon = useIcon(icon);
  const Arrow = useIcon("chevron-right");
  return <button type="button" onClick={onClick}><Icon aria-hidden /><span>{label}</span><small>{count === undefined ? "查看" : `${count} 项`}</small><Arrow aria-hidden /></button>;
}

function RuleInfo({ rule, detail, onClose, onToggle, onLocate }: {
  rule: RuleFormValue; detail: RuleDetail; onClose: () => void; onToggle: () => void; onLocate: (id: string) => void;
}) {
  const Close = useIcon("x");
  return <div className={styles.infoPanel}>
    <header className={styles.infoHeader}><h2>规则信息</h2><Button iconOnly aria-label="关闭规则信息" size="sm" variant="ghost" onClick={onClose}><Close /></Button></header>
    <div className={styles.infoBody}>
      <section className={styles.infoSection}>
        <DetailFields fields={[{ label: "规则名称", value: rule.name || "未命名规则" }, { label: "规则 ID", value: rule.id }, { label: "优先级", value: String(rule.priority) }]} />
        <div className={styles.enableRow}><Badge size="sm" variant="dot" color={rule.enabled ? "green" : "red"}>{rule.enabled ? "已启用" : "已停用"}</Badge><Switch checked={rule.enabled} label="启用规则" onCheckedChange={onToggle} /></div>
        <p className={styles.stateNote}>{rule.enabled ? "已参与规则匹配。优先级数值越小，越先检查。" : "当前不参与请求匹配。下方展示的是启用后的配置预期。"}</p>
      </section>
      <section className={styles.infoSection}>
        <h3>快速定位</h3>
        <nav className={styles.navigation} aria-label="规则详情章节">
          <SectionLink icon="list-checks" label="条件判断" count={detail.conditions.length} onClick={() => onLocate("conditions")} />
          <SectionLink icon="doc-stepper" label="处置动作" count={detail.actions.length} onClick={() => onLocate(detail.actions[0]?.id ?? "result")} />
          <SectionLink icon="check-square" label="处理结果" onClick={() => onLocate("result")} />
          <SectionLink icon="shield" label="异常处理" onClick={() => onLocate("fallback")} />
        </nav>
      </section>
      <section className={styles.infoSection}>
        <h3>{rule.enabled ? "命中后的配置预期" : "启用且命中后的配置预期"}</h3>
        <p className={styles.paragraph}>{detail.result}</p>
      </section>
      {detail.legacy ? <section className={styles.infoSection}><h3>历史规则</h3><p className={styles.note}>已保留原始匹配范围和动作。未保存的条件关系、动作参数及异常策略标为“未记录”，编辑并保存后可查看完整流程。</p></section> : null}
    </div>
  </div>;
}

export function RuleDetailView({ rule, onBack, onEdit, onHistory, onDelete, onToggle, onValidate }: {
  rule: RuleFormValue; onBack: () => void; onEdit: () => void; onHistory: () => void; onDelete: () => void; onToggle: () => void; onValidate: () => void;
}) {
  const ArrowLeft = useIcon("arrow-left");
  const Workflow = useIcon("doc-stepper");
  const Play = useIcon("play");
  const Edit = useIcon("pencil");
  const More = useIcon("ellipsis");
  const detail = useMemo(() => buildRuleDetail(rule), [rule]);
  const [expanded, setExpanded] = useState(() => ["conditions", ...detail.actions.map((action) => action.id), "result"]);
  const [zoom, setZoom] = useState(100);
  const [compact, setCompact] = useState(() => typeof window !== "undefined" && window.innerWidth <= 900);
  const [panel, setPanel] = useState<"info" | "test" | null>(() => typeof window !== "undefined" && window.innerWidth > 900 ? "info" : null);
  const [previewTab, setPreviewTab] = useState<"test" | "check">("test");
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const panelRef = useDialogFocus(compact && panel !== null, () => setPanel(null));
  const allNodeIds = ["start", "conditions", ...detail.actions.map((action) => action.id), "result", "fallback"];

  useEffect(() => {
    backRef.current?.focus({ preventScroll: true });
    const media = window.matchMedia("(max-width: 900px)");
    const update = () => setCompact(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const toggle = (id: string) => setExpanded((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const locate = (requestedId: string) => {
    const id = detail.conditions.some((condition) => condition.id === requestedId) ? "conditions" : requestedId;
    setExpanded((current) => current.includes(id) ? current : [...current, id]);
    if (compact) setPanel(null);
    window.requestAnimationFrame(() => {
      const node = Array.from(canvasRef.current?.querySelectorAll<HTMLElement>("[data-node-id]") ?? []).find((element) => element.dataset.nodeId === id);
      node?.scrollIntoView({ block: "center", inline: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
      node?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    });
  };
  const overview = () => { setExpanded([]); setZoom(100); canvasRef.current?.scrollTo({ top: 0, left: 0 }); };

  return <div className={cn(flowStyles.workspace, styles.page)} ref={setPortalContainer} role="region" aria-label="规则详情">
    <PortalContainerProvider value={portalContainer}>
      <header className={flowStyles.topbar}>
        <Button ref={backRef} aria-label="返回规则清单" leadingIcon={ArrowLeft} size="sm" variant="ghost" onClick={onBack}>返回</Button>
        <div className={styles.name}><span className={flowStyles.appIcon}><Workflow aria-hidden className="size-5" /></span><h1 title={rule.name}>{rule.name || "未命名规则"}</h1><Badge size="sm" variant="dot" color={rule.enabled ? "green" : "red"}>{rule.enabled ? "已启用" : "已停用"}</Badge><span className={styles.readOnly}>只读</span></div>
        <div className={styles.topActions}>
          <Button variant="tertiary" size="md" active={panel === "info"} aria-pressed={panel === "info"} onClick={() => setPanel((current) => current === "info" ? null : "info")}>规则信息</Button>
          {rule.workflow ? <Button variant="tertiary" size="md" leadingIcon={Play} active={panel === "test"} onClick={() => { setPanel("test"); setPreviewTab("test"); }}>试运行</Button> : null}
          <DropdownMenu><DropdownTrigger render={<Button aria-label="更多规则操作" iconOnly variant="ghost" size="md"><More /></Button>} /><DropdownContent align="end" className="w-40">
            <MenuItem index={0} label="修改记录" onSelect={onHistory} />
            <MenuItem index={1} label="验证规则" onSelect={onValidate} />
            <MenuItem index={2} label="删除规则" className="text-fg-danger" onSelect={onDelete} />
          </DropdownContent></DropdownMenu>
          <Button variant="primary" size="md" leadingIcon={Edit} onClick={onEdit}>编辑规则</Button>
        </div>
      </header>
      <div className={flowStyles.body}>
        <section className={flowStyles.canvasPanel} aria-label="规则详情流程">
          <header className={flowStyles.toolbar}>
            <div className={flowStyles.toolbarTitle}><Workflow aria-hidden className="size-4 text-fg-subtle" /><strong>规则流程</strong><span className={flowStyles.toolbarHint}>查看条件、动作与请求去向</span></div>
            <div className={styles.toolbarActions}><Button variant="ghost" size="sm" onClick={() => setExpanded(expanded.length ? [] : allNodeIds)}>{expanded.length ? "收起全部" : "展开全部"}</Button></div>
          </header>
          <div className={flowStyles.canvasFrame}>
            <p className={flowStyles.canvasPanHint}>左右滑动画布查看分支</p>
            <div className={flowStyles.canvas} ref={canvasRef} role="region" aria-label="只读流程画布，可横向和纵向滚动" tabIndex={0}>
              <div className={flowStyles.flow} style={{ zoom: zoom / 100 } as CSSProperties}>
                <RuleWorkflowSummary detail={detail} enabled={rule.enabled} expanded={expanded} onToggle={toggle} />
              </div>
            </div>
            <div className={flowStyles.canvasControls}><WorkflowZoomSelect ariaLabel="详情画布缩放" value={zoom} onChange={setZoom} /><span className="h-4 border-r border-border" /><Button variant="ghost" size="sm" onClick={overview}>流程总览</Button></div>
          </div>
        </section>
        {panel !== null ? <>
          <button className={styles.panelBackdrop} aria-label="关闭详情侧栏" onClick={() => setPanel(null)} tabIndex={-1} />
          <div className={flowStyles.preview} ref={panelRef} role={compact ? "dialog" : "complementary"} aria-modal={compact || undefined} aria-label={panel === "info" ? "规则信息面板" : "规则试运行面板"}>
            {panel === "info" ? <RuleInfo rule={rule} detail={detail} onClose={() => setPanel(null)} onToggle={() => { if (compact) setPanel(null); onToggle(); }} onLocate={locate} /> : rule.workflow ? <WorkflowPreview draft={rule.workflow} tab={previewTab} onTabChange={setPreviewTab} onClose={() => setPanel(null)} onFocusNode={locate} /> : null}
          </div>
        </> : null}
      </div>
    </PortalContainerProvider>
  </div>;
}
