"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Alert, AlertDescription } from "@zeron/ui/alert";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { DetailList, DetailListItem, DetailListLabel, DetailListSeparator, DetailListValue } from "@zeron/ui/detail-list";
import { DropdownContent, DropdownMenu, DropdownTrigger } from "@zeron/ui/dropdown";
import { MenuItem } from "@zeron/ui/menu-item";
import { PageActions, PageBody, PageContent, PageContentHeader } from "@zeron/ui/page-layout";
import { Switch } from "@zeron/ui/switch";
import { useIcon, type IconName } from "@zeron/ui/system/icon-context";
import { PortalContainerProvider } from "@zeron/ui/system/portal-container-context";
import type { RuleFormValue } from "./rule-config";
import { buildRuleDetail, type RuleDetail } from "./rule-detail-model";
import { RuleWorkflowSummary } from "./rule-workflow-summary";
import { WorkflowPreview } from "./workflow-preview";
import { WorkflowCanvasToolbar } from "./workflow-canvas-toolbar";
import { useDialogFocus } from "./use-dialog-focus";
import flowStyles from "./rule-workflow.module.css";

type MinimapViewport = { left: number; top: number; width: number; height: number };

function WorkflowMinimap({ nodeCount, viewport }: { nodeCount: number; viewport: MinimapViewport }) {
  const markers = Array.from({ length: Math.min(Math.max(nodeCount, 4), 7) });
  return <div className="pointer-events-none relative size-40 overflow-hidden rounded-lg border border-border bg-surface-floating shadow-floating" data-slot="workflow-minimap" role="img" aria-label="流程缩略图，方框表示当前显示区域">
    <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(var(--border)_0.75px,transparent_0.75px)] [background-size:8px_8px]" />
    <div className="absolute inset-x-0 bottom-2 top-2 flex flex-col items-center justify-between" aria-hidden>
      <span className="absolute bottom-1 top-1 w-px bg-border" />
      {markers.map((_, index) => <span className={`relative h-1.5 rounded-sm border border-border bg-surface-base ${index === 1 ? "w-14" : index === markers.length - 1 ? "w-10" : "w-12"}`} key={index} />)}
    </div>
    <div className="absolute inset-1" aria-hidden>
      <span
        className="absolute rounded-sm border border-brand bg-brand/15 ring-1 ring-inset ring-surface-floating"
        data-slot="workflow-minimap-viewport"
        style={{ left: `${viewport.left}%`, top: `${viewport.top}%`, width: `${viewport.width}%`, height: `${viewport.height}%` }}
      />
    </div>
  </div>;
}

function SectionLink({ icon, label, count, onClick }: { icon: IconName; label: string; count?: number; onClick: () => void }) {
  const Icon = useIcon(icon);
  const Arrow = useIcon("chevron-right");
  return <button className="flex w-full cursor-pointer items-center gap-2 rounded-lg p-2 text-left text-body text-fg-muted transition-colors duration-150 hover:bg-surface-raised focus-visible:outline focus-visible:outline-1 focus-visible:outline-focus-ring motion-reduce:transition-none [&_svg]:size-4 [&_svg]:shrink-0" type="button" onClick={onClick}><Icon aria-hidden /><span>{label}</span><small className="ml-auto text-label text-fg-subtle">{count === undefined ? "查看" : `${count} 项`}</small><Arrow aria-hidden /></button>;
}

function RuleInfo({ rule, detail, onToggle, onLocate }: {
  rule: RuleFormValue; detail: RuleDetail; onToggle: () => void; onLocate: (id: string) => void;
}) {
  return <div className="flex h-full min-h-0 flex-col">
    <header className="flex min-h-12 shrink-0 items-center px-4 py-2"><h2 className="text-body font-semibold">规则信息</h2></header>
    <div className="min-h-0 overflow-y-auto p-3 pt-0 [scrollbar-color:var(--scrollbar-thumb)_transparent] [scrollbar-width:thin] [&_h3]:mb-3 [&_h3]:text-body [&_h3]:font-medium [&_h3]:leading-5 [&_h3]:text-fg-default [&>section+section]:mt-6 [&>section+section]:border-t [&>section+section]:border-border-subtle [&>section+section]:pt-6">
      <section>
        <DetailList className="w-full max-w-none">
          <DetailListItem><DetailListLabel>规则名称</DetailListLabel><DetailListValue>{rule.name || "未命名规则"}</DetailListValue></DetailListItem>
          <DetailListItem><DetailListLabel>规则 ID</DetailListLabel><DetailListValue>{rule.id}</DetailListValue></DetailListItem>
          <DetailListItem><DetailListLabel>优先级</DetailListLabel><DetailListValue>{rule.priority}</DetailListValue></DetailListItem>
          <DetailListSeparator />
          <DetailListItem><DetailListLabel>启用规则</DetailListLabel><DetailListValue><Switch checked={rule.enabled} className="w-fit gap-0 p-0" label="启用规则" labelVisibility="sr-only" onCheckedChange={onToggle} /></DetailListValue></DetailListItem>
        </DetailList>
        <Alert className="mt-3" status="info"><AlertDescription>{rule.enabled ? "已参与规则匹配。优先级数值越小，越先检查。" : "当前不参与请求匹配。下方展示的是启用后的配置预期。"}</AlertDescription></Alert>
      </section>
      <section>
        <h3>快速定位</h3>
        <nav className="flex flex-col gap-1" aria-label="规则详情章节">
          <SectionLink icon="list-checks" label="条件判断" count={detail.conditions.length} onClick={() => onLocate("conditions")} />
          <SectionLink icon="doc-stepper" label="处置动作" count={detail.actions.length} onClick={() => onLocate(detail.actions[0]?.id ?? "result")} />
          <SectionLink icon="check-square" label="处理结果" onClick={() => onLocate("result")} />
          <SectionLink icon="shield" label="异常处理" onClick={() => onLocate("fallback")} />
        </nav>
      </section>
      <section>
        <h3>{rule.enabled ? "命中后的配置预期" : "启用且命中后的配置预期"}</h3>
        <p className="whitespace-pre-wrap text-body leading-6 [overflow-wrap:anywhere]">{detail.result}</p>
      </section>
      {detail.legacy ? <section><h3>历史规则</h3><p className="mt-3 text-label leading-5 text-fg-subtle [overflow-wrap:anywhere]">已保留原始匹配范围和动作。未保存的条件关系、动作参数及异常策略标为“未记录”，编辑并保存后可查看完整流程。</p></section> : null}
    </div>
  </div>;
}

export function RuleDetailView({ rule, onBack, onEdit, onHistory, onDelete, onToggle }: {
  rule: RuleFormValue; onBack: () => void; onEdit: () => void; onHistory: () => void; onDelete: () => void; onToggle: () => void;
}) {
  const Close = useIcon("x");
  const Workflow = useIcon("doc-stepper");
  const Play = useIcon("play");
  const Edit = useIcon("pencil");
  const More = useIcon("ellipsis");
  const Collapse = useIcon("chevron-up");
  const Expand = useIcon("chevron-down");
  const detail = useMemo(() => buildRuleDetail(rule), [rule]);
  const [expanded, setExpanded] = useState(() => ["conditions", ...detail.actions.map((action) => action.id), "result"]);
  const [zoom, setZoom] = useState(100);
  const [compact, setCompact] = useState(() => typeof window !== "undefined" && window.innerWidth <= 900);
  const [panel, setPanel] = useState<"info" | "test">("info");
  const [previewTab, setPreviewTab] = useState<"test" | "check">("test");
  const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(null);
  const [minimapViewport, setMinimapViewport] = useState<MinimapViewport>({ left: 0, top: 0, width: 100, height: 100 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLButtonElement>(null);
  const panelRef = useDialogFocus(compact && panel === "test", () => setPanel("info"));
  const allNodeIds = ["start", "conditions", ...detail.actions.map((action) => action.id), "result", "fallback"];

  useEffect(() => {
    backRef.current?.focus({ preventScroll: true });
    const media = window.matchMedia("(max-width: 900px)");
    const update = () => setCompact(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let frame = 0;
    const updateViewport = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const scrollWidth = Math.max(canvas.scrollWidth, 1);
        const scrollHeight = Math.max(canvas.scrollHeight, 1);
        const next = {
          left: Math.min(100, (canvas.scrollLeft / scrollWidth) * 100),
          top: Math.min(100, (canvas.scrollTop / scrollHeight) * 100),
          width: Math.min(100, (canvas.clientWidth / scrollWidth) * 100),
          height: Math.min(100, (canvas.clientHeight / scrollHeight) * 100),
        };
        setMinimapViewport((current) => Object.keys(next).every((key) => Math.abs(current[key as keyof MinimapViewport] - next[key as keyof MinimapViewport]) < 0.01) ? current : next);
      });
    };
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateViewport);
    canvas.addEventListener("scroll", updateViewport, { passive: true });
    resizeObserver?.observe(canvas);
    if (canvas.firstElementChild) resizeObserver?.observe(canvas.firstElementChild);
    updateViewport();
    return () => {
      window.cancelAnimationFrame(frame);
      canvas.removeEventListener("scroll", updateViewport);
      resizeObserver?.disconnect();
    };
  }, [expanded, panel, zoom]);

  const toggle = (id: string) => setExpanded((current) => current.includes(id) ? current.filter((value) => value !== id) : [...current, id]);
  const locate = (requestedId: string) => {
    const id = detail.conditions.some((condition) => condition.id === requestedId) ? "conditions" : requestedId;
    setExpanded((current) => current.includes(id) ? current : [...current, id]);
    window.requestAnimationFrame(() => {
      const node = Array.from(canvasRef.current?.querySelectorAll<HTMLElement>("[data-node-id]") ?? []).find((element) => element.dataset.nodeId === id);
      node?.scrollIntoView({ block: "center", inline: "nearest", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
      node?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    });
  };
  const overview = () => { setExpanded([]); setZoom(100); canvasRef.current?.scrollTo({ top: 0, left: 0 }); };

  return <PageContent className="relative text-fg-default" ref={setPortalContainer} role="region" aria-label="规则详情">
    <PortalContainerProvider value={portalContainer}>
      <PageContentHeader>
        <Button ref={backRef} aria-label="返回规则清单" iconOnly type="button" variant="tertiary" onClick={onBack}><Close aria-hidden /></Button>
        <div className="flex min-w-0 flex-1 items-center gap-3 max-[600px]:gap-2"><span className="grid size-8 shrink-0 place-items-center rounded-lg bg-info-surface text-fg-info"><Workflow aria-hidden className="size-5" /></span><h2 className="min-w-0 truncate text-body font-semibold" title={rule.name}>{rule.name || "未命名规则"}</h2><Badge color={rule.enabled ? "green" : "red"} size="sm" variant="strong">{rule.enabled ? "已启用" : "已停用"}</Badge><span className="whitespace-nowrap rounded bg-surface-raised px-2 py-1 text-label text-fg-subtle max-[600px]:hidden">只读</span></div>
        <PageActions className="flex items-center gap-2 max-[600px]:col-span-full max-[600px]:justify-end">
          {rule.workflow ? <Button variant="tertiary" size="md" leadingIcon={Play} active={panel === "test"} onClick={() => { setPanel("test"); setPreviewTab("test"); }}>试运行</Button> : null}
          <Button variant="primary" size="md" leadingIcon={Edit} onClick={onEdit}>编辑规则</Button>
          <DropdownMenu><DropdownTrigger render={<Button aria-label="更多规则操作" iconOnly variant="ghost" size="md"><More /></Button>} /><DropdownContent align="end" className="w-40">
            <MenuItem index={0} label="修改记录" onSelect={onHistory} />
            <MenuItem index={1} label="删除规则" className="text-fg-danger" onSelect={onDelete} />
          </DropdownContent></DropdownMenu>
        </PageActions>
      </PageContentHeader>
      <PageBody className="flex min-h-0 flex-1 max-w-none gap-0 overflow-hidden bg-surface-raised !p-0 [background-image:radial-gradient(var(--border)_1px,transparent_1px)] [background-position:center] [background-size:22px_22px]">
        <section className="flex min-w-0 flex-1 flex-col overflow-hidden" aria-label="规则详情流程">
          <header className="flex h-12 shrink-0 items-center justify-between gap-3 px-5 max-[600px]:px-3">
            <div className="flex items-center gap-2 text-label"><Workflow aria-hidden className="size-4 text-fg-subtle" /><strong className="text-body font-semibold">规则流程</strong><span className="text-label text-fg-subtle max-[1100px]:hidden">查看条件、动作与请求去向</span></div>
            <div className="flex items-center gap-2"><Button leadingIcon={expanded.length ? Collapse : Expand} variant="ghost" size="sm" onClick={() => setExpanded(expanded.length ? [] : allNodeIds)}>{expanded.length ? "收起全部" : "展开全部"}</Button></div>
          </header>
          <div className={`${flowStyles.canvasFrame} relative flex min-h-0 flex-1 flex-col`}>
            <p className={flowStyles.canvasPanHint}>左右滑动画布查看分支</p>
            <div className="min-h-0 flex-1 overflow-auto overscroll-contain [scrollbar-color:var(--scrollbar-thumb)_transparent] [scrollbar-width:thin] focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-1px] focus-visible:outline-focus-ring" ref={canvasRef} role="region" aria-label="只读流程画布，可横向和纵向滚动" tabIndex={0}>
              <div className={flowStyles.flow} style={{ zoom: zoom / 100 } as CSSProperties}>
                <RuleWorkflowSummary detail={detail} enabled={rule.enabled} expanded={expanded} onToggle={toggle} />
              </div>
            </div>
            <div className="absolute bottom-5 right-5 flex flex-col items-end gap-2 max-[600px]:bottom-3 max-[600px]:right-3">
              <WorkflowMinimap nodeCount={allNodeIds.length} viewport={minimapViewport} />
              <WorkflowCanvasToolbar ariaLabel="详情画布缩放" onOverview={overview} onZoomChange={setZoom} zoom={zoom} />
            </div>
          </div>
        </section>
        <div className="flex min-h-0 shrink-0 p-2 max-[900px]:contents">
          <div className="h-full w-[360px] shrink-0 overflow-hidden rounded-xl border-[0.5px] border-border bg-surface-floating min-[1600px]:w-[400px] max-[1100px]:w-[320px] max-[900px]:absolute max-[900px]:bottom-2 max-[900px]:right-2 max-[900px]:top-[72px] max-[900px]:z-[4] max-[900px]:h-auto max-[900px]:shadow-floating max-[600px]:inset-x-1 max-[600px]:bottom-1 max-[600px]:top-[116px] max-[600px]:w-auto" ref={panelRef} role={compact && panel === "test" ? "dialog" : "complementary"} aria-modal={compact && panel === "test" ? true : undefined} aria-label={panel === "info" ? "规则信息面板" : "规则试运行面板"}>
            {panel === "info" ? <RuleInfo rule={rule} detail={detail} onToggle={onToggle} onLocate={locate} /> : rule.workflow ? <WorkflowPreview draft={rule.workflow} tab={previewTab} onTabChange={setPreviewTab} onClose={() => setPanel("info")} onFocusNode={locate} /> : null}
          </div>
        </div>
      </PageBody>
    </PortalContainerProvider>
  </PageContent>;
}
