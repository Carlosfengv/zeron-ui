"use client";

import { createContext, memo, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ChangeEvent } from "react";
import ZoomOutIcon from "@hugeicons/core-free-icons/ZoomOutIcon";
import ZoomInIcon from "@hugeicons/core-free-icons/ZoomInIcon";
import { Background, BackgroundVariant, Handle, MiniMap, NodeToolbar, Panel, Position, ReactFlow, ReactFlowProvider, applyEdgeChanges, applyNodeChanges, useReactFlow, useKeyPress, useNodesInitialized, useUpdateNodeInternals, useViewport, type Connection, type NodeProps, type Viewport } from "@xyflow/react";
import { AppShell, AppShellHeader, AppShellMain, AppShellSidebar } from "@zeron/ui/app-shell";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarProvider } from "@zeron/ui/sidebar";
import { NavMenu } from "@zeron/ui/nav-menu";
import { NavItem, NavItemContent, NavItemLabel, NavItemLeading, NavItemTrigger } from "@zeron/ui/nav-item";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@zeron/ui/breadcrumb";
import { Card, CardAction, CardContent, CardDescription, CardEyebrow, CardFooter, CardHeader, CardMedia, CardTitle } from "@zeron/ui/card";
import { Badge } from "@zeron/ui/badge";
import { Button } from "@zeron/ui/button";
import { Tooltip } from "@zeron/ui/tooltip";
import { toast } from "@zeron/ui/toast";
import { historyReducer } from "./workflow-history";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@zeron/ui/dialog";
import { DropdownMenu, DropdownTrigger, DropdownContent } from "@zeron/ui/dropdown";
import { MenuItem } from "@zeron/ui/menu-item";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel, Fieldset, FieldsetLegend } from "@zeron/ui/field";
import { Alert, AlertTitle } from "@zeron/ui/alert";
import { Separator } from "@zeron/ui/separator";
import { Kbd, KbdGroup } from "@zeron/ui/kbd";
import { ScrollArea } from "@zeron/ui/scroll-area";
import { Input } from "@zeron/ui/input";
import { Textarea } from "@zeron/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@zeron/ui/select";
import { Tabs, TabsList, TabItem, TabPanel } from "@zeron/ui/tabs";
import { CodeBlock } from "@zeron/ui/code-block";
import { Elevated } from "@zeron/ui/system/elevated";
import { useIcon, type IconName } from "@zeron/ui/system/icon-context";
import { createHugeIcon } from "@zeron/ui/system/huge-icon";
import { useThemeContext } from "@zeron/ui/system/theme-context";
import { canConnect, createNode, initialGraph, kindLabels, parseStoredWorkflow, serializableGraph, simulate, validateGraph, PUBLISHED_KEY, STORAGE_KEY, type BranchRule, type NodeKind, type WorkflowGraph, type WorkflowNode } from "./workflow-model";
import "@xyflow/react/dist/base.css";
import styles from "./workflow.module.css";

const FEEDBACK_ID = "workflow-feedback";
const SAVE_ERROR_ID = "workflow-save-error";
const ZoomOut = createHugeIcon(ZoomOutIcon);
const ZoomIn = createHugeIcon(ZoomInIcon);
function notify(message: string, status: "info" | "success" | "error" = "info", id = FEEDBACK_ID) {
  if (!message) { toast.dismiss(id); return; }
  toast[status](message, { id, ...(status === "error" ? { duration: 0 } : {}) });
}

const nodeIcons: Record<NodeKind, IconName> = { trigger: "play", action: "doc-stepper", agent: "brain", branch: "corner-down-right" };
function Glyph({ name, className }: { name: IconName; className?: string }) { const Icon = useIcon(name); return <Icon aria-hidden className={className ?? styles.glyph} />; }
function IconButton({ name, label, onClick, disabled = false }: { name: IconName; label: string; onClick: () => void; disabled?: boolean }) {
  return <Tooltip content={label}><Button aria-label={label} iconOnly size="sm" variant="ghost" onClick={onClick} disabled={disabled}><Glyph name={name} /></Button></Tooltip>;
}

type NodeActions = { configure: (id: string) => void; duplicate: (id: string) => void; remove: (id: string) => void; addFrom: (id: string) => void; runNodes: Set<string>; toolbarOffset: number };
const NodeActionContext = createContext<NodeActions | null>(null);
const WorkflowCard = memo(function WorkflowCard({ id, data, selected, sourcePosition }: NodeProps<WorkflowNode>) {
  const actions = useContext(NodeActionContext)!;
  const NodeIcon = useIcon(nodeIcons[data.kind]);
  const updateInternals = useUpdateNodeInternals();
  const nodeRef = useRef<HTMLDivElement>(null);
  const [portOffsets, setPortOffsets] = useState<number[]>([]);
  useEffect(() => {
    if (!nodeRef.current || data.kind !== "branch") return;
    const element = nodeRef.current;
    const measure = () => {
      const offsets = Array.from(element.querySelectorAll<HTMLElement>(`.${styles.branchRow}`)).map((row) => row.offsetTop + row.offsetHeight / 2);
      setPortOffsets((previous) => JSON.stringify(previous) === JSON.stringify(offsets) ? previous : offsets);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [data.branches, data.kind]);
  useEffect(() => { updateInternals(id); }, [id, data.branches, portOffsets, updateInternals]);
  return <div ref={nodeRef} className={styles.node} data-selected={selected || undefined} data-running={actions.runNodes.has(id) || undefined} data-kind={data.kind}>
    <NodeToolbar isVisible={selected} position={Position.Top} offset={actions.toolbarOffset}>
      <Elevated className={styles.nodeToolbar} surface="overlay" shadow="floating">
        <div className={styles.interactive}>
          <IconButton name="pencil" label="配置节点" onClick={() => actions.configure(id)} />
          <IconButton name="plus" label="添加下游节点" onClick={() => actions.addFrom(id)} />
          <IconButton name="copy" label="复制节点" onClick={() => actions.duplicate(id)} disabled={data.kind === "trigger"} />
          <IconButton name="trash" label="删除节点" onClick={() => actions.remove(id)} />
        </div>
      </Elevated>
    </NodeToolbar>
    {data.kind !== "trigger" && <Handle type="target" position={data.kind === "branch" ? Position.Top : Position.Left} id="in" className={styles.handle} aria-label={`${data.title}输入`} />}
    <Card selected={selected}>
      <CardHeader>
        <div className={styles.nodeHeading}>
          <CardMedia className="mb-0" icon={(props) => <NodeIcon {...props} className={data.kind === "trigger" ? "text-fg-success" : data.kind === "branch" ? "text-fg-warning" : "text-fg-brand"} />} />
          <div className={styles.nodeText}><CardEyebrow>{kindLabels[data.kind]}</CardEyebrow><CardTitle>{data.title}</CardTitle></div>
        </div>
        <CardDescription>{data.description}</CardDescription>
      </CardHeader>
      {data.kind === "branch" && <CardContent><div className={styles.branches}>{data.branches?.map((rule) => <div key={rule.id} className={styles.branchRow}>
        <span className={styles.branchDot} /><span className={styles.branchLabel}>{rule.label}</span>
      </div>)}</div></CardContent>}
      <CardFooter><div className={styles.nodeFooter}>
        <Badge size="sm">{data.kind === "branch" ? `${data.branches?.length ?? 0} 个出口` : "1 个出口"}</Badge>
        <span className={styles.interactive}><IconButton name="ellipsis" label={`配置${data.title}`} onClick={() => actions.configure(id)} /></span>
      </div></CardFooter>
    </Card>
    {data.kind === "branch" ? data.branches?.map((rule, index) => <Handle key={rule.id} type="source" position={Position.Right} id={rule.id} className={styles.handle} style={{ top: portOffsets[index] ?? `${((index + 1) / ((data.branches?.length ?? 0) + 1)) * 100}%` }} aria-label={`${data.title}：${rule.label}`} />) : <Handle type="source" position={sourcePosition ?? Position.Right} id="out" className={styles.handle} aria-label={`${data.title}输出`} />}
  </div>;
});
const nodeTypes = { workflow: WorkflowCard };
function NodeKindButton({ kind, disabled, onClick }: { kind: NodeKind; disabled: boolean; onClick: () => void }) {
  const Icon = useIcon(nodeIcons[kind]);
  return <Button variant="tertiary" leadingIcon={Icon} disabled={disabled} onClick={onClick}>{kindLabels[kind]}</Button>;
}

function WorkspaceNav({ onHelp }: { onHelp: () => void }) {
  const { theme, setTheme } = useThemeContext();
  return <AppShellSidebar><Sidebar collapsible="icon" variant="sidebar">
    <SidebarHeader><div className={styles.logo} aria-label="Zeron 工作流"><Glyph name="doc-stepper" /></div></SidebarHeader>
    <SidebarContent><NavMenu activeValue="workflow" aria-label="工作区导航">
      <NavItem value="home"><NavItemTrigger href="/" tooltip="组件库首页"><NavItemLeading><Glyph name="home" /></NavItemLeading><NavItemContent><NavItemLabel>组件库首页</NavItemLabel></NavItemContent></NavItemTrigger></NavItem>
      <NavItem value="pages"><NavItemTrigger href="/docs/pages" tooltip="页面与模块"><NavItemLeading><Glyph name="square-library" /></NavItemLeading><NavItemContent><NavItemLabel>页面与模块</NavItemLabel></NavItemContent></NavItemTrigger></NavItem>
      <NavItem value="workflow"><NavItemTrigger href="/workflow" tooltip="自动化工作流"><NavItemLeading><Glyph name="doc-stepper" /></NavItemLeading><NavItemContent><NavItemLabel>自动化工作流</NavItemLabel></NavItemContent></NavItemTrigger></NavItem>
    </NavMenu></SidebarContent>
    <SidebarFooter><div className={styles.navFooter}><IconButton name={theme === "dark" ? "sun" : "moon"} label="切换明暗主题" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} /><IconButton name="lightbulb" label="使用说明" onClick={onHelp} /></div></SidebarFooter>
  </Sidebar></AppShellSidebar>;
}

function CanvasControls({ onFit, miniMap, onToggleMiniMap }: { onFit: () => void; miniMap: boolean; onToggleMiniMap: () => void }) {
  const { zoomIn, zoomOut } = useReactFlow();
  const { zoom } = useViewport();
  return <Elevated className={styles.canvasControls} shadow="raised">
    <IconButton name="rectangle-horizontal" label={miniMap ? "隐藏小地图" : "显示小地图"} onClick={onToggleMiniMap} /><Separator orientation="vertical" />
    <Tooltip content="缩小画布"><Button aria-label="缩小画布" iconOnly size="sm" variant="ghost" onClick={() => void zoomOut()} disabled={zoom <= 0.25}><ZoomOut aria-hidden className={styles.glyph} /></Button></Tooltip>
    <span className={styles.zoom}>{Math.round(zoom * 100)}%</span>
    <Tooltip content="放大画布"><Button aria-label="放大画布" iconOnly size="sm" variant="ghost" onClick={() => void zoomIn()} disabled={zoom >= 2}><ZoomIn aria-hidden className={styles.glyph} /></Button></Tooltip>
    <Separator orientation="vertical" /><IconButton name="monitor" label="适应全部节点" onClick={onFit} />
  </Elevated>;
}

function NodeSettings({ node, onSave, onClose, onDelete }: { node: WorkflowNode; onSave: (data: WorkflowNode["data"]) => void; onClose: () => void; onDelete: () => void }) {
  const [data, setData] = useState(() => structuredClone(node.data));
  const [submitted, setSubmitted] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const X = useIcon("x");
  const titleError = data.title.trim() ? "" : "请填写节点名称。";
  const operationError = data.operation.trim() ? "" : "请填写操作标识。";
  const ruleErrors = (data.branches ?? []).map((rule) => {
    let min = "", max = "";
    if ((rule.mode === "range" || rule.mode === "gte") && (rule.min === undefined || !Number.isFinite(rule.min) || rule.min < 0)) min = "请输入大于等于 0 的下限。";
    if (rule.mode === "range" || rule.mode === "lt") {
      if (rule.max === undefined || !Number.isFinite(rule.max) || rule.max <= 0) max = "请输入大于 0 的上限。";
      else if (rule.mode === "range" && rule.min !== undefined && rule.max <= rule.min) max = "上限必须大于下限。";
    }
    return { label: rule.label.trim() ? "" : "请填写条件名称。", min, max };
  });
  const invalid = !!titleError || !!operationError || ruleErrors.some((error) => error.label || error.min || error.max);
  const changeRule = (id: string, patch: Partial<BranchRule>) => setData((current) => ({ ...current, branches: current.branches?.map((r) => r.id === id ? { ...r, ...patch } : r) }));
  const save = () => {
    setSubmitted(true);
    if (invalid) {
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLInputElement>('input[aria-invalid="true"]')?.focus());
      return;
    }
    onSave({ ...data, title: data.title.trim(), operation: data.operation.trim() });
  };
  return <aside className={styles.inspector} aria-label="节点配置">
    <Card className="min-h-0 flex-1 overflow-hidden pb-0 shadow-floating">
    <CardHeader className="p-3"><CardEyebrow>{kindLabels[node.data.kind]}</CardEyebrow><h2><CardTitle className="text-title">节点配置</CardTitle></h2><CardAction><Button aria-label="关闭节点配置" iconOnly variant="ghost" onClick={onClose}><X /></Button></CardAction></CardHeader>
    <form ref={formRef} className={styles.inspectorForm} noValidate onSubmit={(event) => { event.preventDefault(); save(); }}>
      <ScrollArea className="min-h-0 flex-1" aria-label="节点配置表单">
      <CardContent className="p-3"><FieldGroup className="gap-3">
        <Field name="title" invalid={submitted && !!titleError}><FieldLabel>节点名称</FieldLabel><Input name="title" value={data.title} maxLength={80} aria-invalid={submitted && !!titleError} onChange={(e) => setData({ ...data, title: e.target.value })} required />{submitted && titleError && <FieldError match>{titleError}</FieldError>}</Field>
        <Field><FieldLabel>说明</FieldLabel><Textarea value={data.description} maxLength={300} rows={3} onChange={(e) => setData({ ...data, description: e.target.value })} /></Field>
        <Field name="operation" invalid={submitted && !!operationError}><FieldLabel>{data.kind === "trigger" ? "触发事件" : data.kind === "branch" ? "金额字段" : "操作标识"}</FieldLabel><Input name="operation" value={data.operation} maxLength={120} aria-invalid={submitted && !!operationError} onChange={(e) => setData({ ...data, operation: e.target.value })} required /><FieldDescription>{data.kind === "branch" ? "当前模拟器使用下方输入的交易金额；字段用于导出的流程定义。" : "保存为流程配置。演示页面不会调用外部服务。"}</FieldDescription>{submitted && operationError && <FieldError match>{operationError}</FieldError>}</Field>
        {data.branches && <Fieldset><FieldsetLegend>出口条件</FieldsetLegend><p className="text-label text-fg-subtle">按顺序匹配，金额范围包含下限、不包含上限。</p>{data.branches.map((rule, index) => <FieldGroup key={rule.id} className="gap-3 py-3">
          <Field name={`${rule.id}.label`} invalid={submitted && !!ruleErrors[index].label}><FieldLabel>{rule.mode === "fallback" ? "默认出口" : "条件名称"}</FieldLabel><Input name={`${rule.id}.label`} value={rule.label} aria-invalid={submitted && !!ruleErrors[index].label} onChange={(e) => changeRule(rule.id, { label: e.target.value })} maxLength={80} />{submitted && ruleErrors[index].label && <FieldError match>{ruleErrors[index].label}</FieldError>}</Field>
          {rule.mode !== "fallback" && <Field><FieldLabel>匹配方式</FieldLabel><Select value={rule.mode} onValueChange={(value) => { if (value) changeRule(rule.id, { mode: value as BranchRule["mode"], min: rule.min ?? 0, max: rule.max ?? 50000 }); }}><SelectTrigger /><SelectContent><SelectItem value="gte">大于等于</SelectItem><SelectItem value="range">金额范围</SelectItem><SelectItem value="lt">小于</SelectItem><SelectItem value="missing">未填写</SelectItem></SelectContent></Select></Field>}
          {(rule.mode === "range" || rule.mode === "gte") && <Field name={`${rule.id}.min`} invalid={submitted && !!ruleErrors[index].min}><FieldLabel>下限（美元）</FieldLabel><Input name={`${rule.id}.min`} type="number" min={0} step="any" value={rule.min ?? ""} aria-invalid={submitted && !!ruleErrors[index].min} onChange={(e) => changeRule(rule.id, { min: e.target.value === "" ? undefined : Number(e.target.value) })} />{submitted && ruleErrors[index].min && <FieldError match>{ruleErrors[index].min}</FieldError>}</Field>}
          {(rule.mode === "range" || rule.mode === "lt") && <Field name={`${rule.id}.max`} invalid={submitted && !!ruleErrors[index].max}><FieldLabel>上限（美元）</FieldLabel><Input name={`${rule.id}.max`} type="number" min={0} step="any" value={rule.max ?? ""} aria-invalid={submitted && !!ruleErrors[index].max} onChange={(e) => changeRule(rule.id, { max: e.target.value === "" ? undefined : Number(e.target.value) })} />{submitted && ruleErrors[index].max && <FieldError match>{ruleErrors[index].max}</FieldError>}</Field>}
        </FieldGroup>)}</Fieldset>}
        {submitted && invalid && <Alert status="danger"><AlertTitle>请修正标记的字段后再保存。</AlertTitle></Alert>}
      </FieldGroup></CardContent>
      </ScrollArea>
      <CardFooter className="justify-between p-3"><Button variant="destructive" onClick={onDelete} type="button">删除节点</Button><Button variant="primary" type="submit">保存配置</Button></CardFooter>
    </form>
    </Card>
  </aside>;
}

function EditorWorkspace() {
  const [history, dispatch] = useReducer(historyReducer, undefined, () => ({ past: [], present: initialGraph(), future: [] }));
  const graph = history.present;
  const { theme } = useThemeContext();
  // React Flow's system mode reads matchMedia during hydration, producing a
  // different class from SSR. Host CSS handles system mode; start consistently.
  const flowColorMode = theme === "dark" ? "dark" : "light";
  const graphRef = useRef(graph); graphRef.current = graph;
  const flow = useReactFlow<WorkflowNode>();
  const panKeyPressed = useKeyPress("Space", { actInsideInputWithModifier: false });
  const workspaceRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const viewportRef = useRef<Viewport>({ x: 0, y: 0, zoom: 1 });
  const restoredViewport = useRef<Viewport | null>(null);
  const viewInitialized = useRef(false);
  const nodesInitialized = useNodesInitialized();
  const dragBefore = useRef<WorkflowGraph | null>(null);
  const [ready, setReady] = useState(false);
  const [canvasMetrics, setCanvasMetrics] = useState<{ gap: number; dot: number } | null>(null);
  const [storageBlocked, setStorageBlocked] = useState(false);
  const [saveStatus, setSaveStatus] = useState("正在读取草稿");
  const [saveRetry, setSaveRetry] = useState(0);
  const [editing, setEditing] = useState<string | null>(null);
  const [picker, setPicker] = useState<{ source?: string } | null>(null);
  const [help, setHelp] = useState(false);
  const [rename, setRename] = useState(false);
  const [name, setName] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [published, setPublished] = useState<{ revision: number; fingerprint: string } | null>(null);
  const [miniMap, setMiniMap] = useState(true);
  const [panel, setPanel] = useState<"run" | "code" | null>(null);
  const [amount, setAmount] = useState("300000");
  const [result, setResult] = useState<ReturnType<typeof simulate> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const fingerprint = useMemo(() => JSON.stringify(serializableGraph(graph)), [graph]);
  const dialogOpen = !!picker || help || rename || publishOpen || resetOpen;
  const publishedCurrent = published?.fingerprint === fingerprint;
  const Pencil = useIcon("pencil"), Undo = useIcon("rotate-ccw"), Bulb = useIcon("lightbulb");
  const Plus = useIcon("plus"), Play = useIcon("play"), Upload = useIcon("upload"), Check = useIcon("check"), Arrow = useIcon("arrow-right");

  useEffect(() => {
    const header = headerRef.current, workspace = workspaceRef.current;
    if (!header || !workspace) return;
    const updateHeaderHeight = () => workspace.style.setProperty("--workflow-header-height", `${header.getBoundingClientRect().height}px`);
    updateHeaderHeight();
    const observer = new ResizeObserver(updateHeaderHeight);
    observer.observe(header);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const probe = document.createElement("span");
    probe.style.cssText = "position:absolute;visibility:hidden;width:calc(var(--spacing) * 6);height:calc(var(--border-width-hairline) * 2)";
    document.body.appendChild(probe);
    const metrics = getComputedStyle(probe);
    setCanvasMetrics({ gap: parseFloat(metrics.width), dot: parseFloat(metrics.height) });
    probe.remove();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = parseStoredWorkflow(raw);
        dispatch({ type: "restore", graph: stored.graph });
        viewportRef.current = stored.viewport;
        restoredViewport.current = stored.viewport;
      }
      const snapshot = localStorage.getItem(PUBLISHED_KEY);
      if (snapshot) {
        try { const p = JSON.parse(snapshot); const valid = parseStoredWorkflow(JSON.stringify(p.document)); if (Number.isInteger(p.revision) && p.revision > 0) setPublished({ revision: p.revision, fingerprint: JSON.stringify(valid.graph) }); } catch { /* A damaged snapshot does not discard an otherwise valid draft. */ }
      }
    } catch (error) {
      setStorageBlocked(true);
      setSaveStatus("草稿恢复失败");
      notify(`${error instanceof Error ? error.message : "浏览器存储不可用。"} 原草稿未被覆盖，可导出当前内容、导入备份或重置示例。`, "error");
    }
    setReady(true);
  }, [flow]);

  useEffect(() => {
    if (!ready || (!nodesInitialized && graph.nodes.length > 0) || viewInitialized.current) return;
    viewInitialized.current = true;
    if (restoredViewport.current) void flow.setViewport(restoredViewport.current);
    else void flow.fitView({ padding: 0.12 });
  }, [ready, nodesInitialized, flow, graph.nodes.length]);

  const saveDraft = useCallback(() => {
    if (!ready || storageBlocked || !viewInitialized.current) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, graph: serializableGraph(graphRef.current), viewport: viewportRef.current })); setSaveStatus("草稿已保存到此浏览器"); toast.dismiss(SAVE_ERROR_ID); }
    catch { setSaveStatus("保存失败"); notify("浏览器存储不可用或空间不足，请导出流程备份，或重试保存。", "error", SAVE_ERROR_ID); }
  }, [ready, storageBlocked]);
  useEffect(() => {
    if (!ready || storageBlocked) return;
    setSaveStatus("正在保存草稿…");
    const timer = setTimeout(saveDraft, 450);
    return () => clearTimeout(timer);
  }, [fingerprint, ready, storageBlocked, saveRetry, saveDraft]);
  useEffect(() => {
    if (!ready || storageBlocked) return;
    const flush = () => saveDraft();
    window.addEventListener("pagehide", flush);
    return () => window.removeEventListener("pagehide", flush);
  }, [ready, storageBlocked, saveDraft]);
  useEffect(() => { setResult(null); }, [fingerprint]);
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLElement && (event.target.closest("input,textarea,select,[contenteditable=true],[role=dialog]"))) return;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") { event.preventDefault(); dispatch({ type: event.shiftKey ? "redo" : "undo" }); setEditing(null); }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") { event.preventDefault(); saveDraft(); }
      if (event.key === "Escape") setEditing(null);
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [saveDraft]);

  const remove = useCallback((id: string) => { dispatch({ type: "change", update: (current) => ({ ...current, nodes: current.nodes.filter((n) => n.id !== id), edges: current.edges.filter((e) => e.source !== id && e.target !== id) }) }); setEditing((current) => current === id ? null : current); }, []);
  const duplicate = useCallback((id: string) => { dispatch({ type: "change", update: (current) => {
    const node = current.nodes.find((n) => n.id === id);
    if (!node || node.data.kind === "trigger") return current;
    return { ...current, nodes: [...current.nodes.map((n) => ({ ...n, selected: false })), { ...structuredClone(node), id: crypto.randomUUID(), selected: true, position: { x: node.position.x + 48, y: node.position.y + 48 }, data: { ...structuredClone(node.data), title: `${node.data.title} · 副本` } }] };
  } }); }, []);
  const configure = useCallback((id: string) => setEditing(id), []);
  const addFrom = useCallback((id: string) => setPicker({ source: id }), []);
  const runNodes = useMemo(() => new Set(result?.nodeIds ?? []), [result]);
  const nodeActions = useMemo(() => ({ configure, duplicate, remove, addFrom, runNodes, toolbarOffset: (canvasMetrics?.gap ?? 0) / 2 }), [configure, duplicate, remove, addFrom, runNodes, canvasMetrics]);
  const displayedNodes = useMemo(() => {
    const byId = new Map(graph.nodes.map((node) => [node.id, node]));
    const downwardSources = new Set(graph.edges.filter((edge) => {
      const source = byId.get(edge.source), target = byId.get(edge.target);
      return target?.data.kind === "branch" && target.position.x === source?.position.x;
    }).map((edge) => edge.source));
    return graph.nodes.map((node) => ({ ...node, ariaLabel: `${kindLabels[node.data.kind]}：${node.data.title}`, dragHandle: "[data-slot=card-header]", sourcePosition: downwardSources.has(node.id) ? Position.Bottom : Position.Right }));
  }, [graph.nodes, graph.edges]);
  const displayedEdges = useMemo(() => graph.edges.map((e) => ({ ...e, style: { stroke: result?.edgeIds.includes(e.id) ? "var(--brand)" : undefined } })), [graph.edges, result]);
  const settingsNode = graph.nodes.find((n) => n.id === editing);
  const beginDrag = () => { dragBefore.current = graphRef.current; };
  const endDrag = () => {
    if (dragBefore.current) dispatch({ type: "checkpoint", before: dragBefore.current });
    dragBefore.current = null;
  };

  const connect = (connection: Connection) => {
    if (!canConnect(graphRef.current, connection.source, connection.target, connection.sourceHandle)) { notify("连接无效：每个出口只能连接一个下游，且不能形成循环或连接到触发器。", "error"); return; }
    dispatch({ type: "change", update: (current) => ({ ...current, edges: [...current.edges, { ...connection, id: crypto.randomUUID(), type: "default" }] }) });
  };
  const addNode = (kind: NodeKind) => {
    const id = crypto.randomUUID();
    const source = graph.nodes.find((n) => n.id === picker?.source);
    const screen = document.querySelector("[data-workflow-canvas]")?.getBoundingClientRect();
    const position = source ? { x: source.position.x + 360, y: source.position.y + 180 } : flow.screenToFlowPosition({ x: (screen?.left ?? 0) + (screen?.width ?? 1000) / 2, y: (screen?.top ?? 0) + (screen?.height ?? 700) / 2 });
    const node = { ...createNode(kind, id, position), selected: true };
    const sourceHandle = source?.data.kind === "branch" ? source.data.branches?.find((r) => !graph.edges.some((e) => e.source === source.id && e.sourceHandle === r.id))?.id : "out";
    const newGraph = { ...graph, nodes: [...graph.nodes.map((n) => ({ ...n, selected: false })), node] };
    const canAttach = source && kind !== "trigger" && sourceHandle && canConnect(newGraph, source.id, id, sourceHandle);
    dispatch({ type: "change", update: () => ({ ...newGraph, edges: canAttach ? [...graph.edges, { id: crypto.randomUUID(), source: source.id, target: id, sourceHandle, targetHandle: "in", type: "default" }] : graph.edges }) });
    if (source && !canAttach) notify("节点已添加。当前出口已有连接，请删除原连线后重新连接。");
    setPicker(null); setEditing(id);
  };
  const exportGraph = () => {
    const blob = new Blob([JSON.stringify({ schemaVersion: 1, graph: serializableGraph(graph), viewport: flow.getViewport() }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "zeron-workflow.json"; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); notify("流程已导出，包含节点配置、连线和画布位置。", "success");
  };
  const importGraph = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; event.target.value = "";
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error("文件超过 2 MB，请选择有效的流程文件。");
      const imported = parseStoredWorkflow(await file.text());
      dispatch({ type: "change", update: () => imported.graph }); viewportRef.current = imported.viewport; void flow.setViewport(imported.viewport); setStorageBlocked(false); setEditing(null); notify("已导入流程，可通过撤销恢复之前的内容。", "success");
    } catch (error) { notify(error instanceof Error ? error.message : "导入失败。", "error"); }
  };
  const publish = () => {
    const issues = validateGraph(graph);
    if (issues.length) { notify(`无法发布：${issues[0]}${issues.length > 1 ? `，另有 ${issues.length - 1} 项待完善。` : "。"}`, "error"); setPublishOpen(false); return; }
    try { const revision = (published?.revision ?? 0) + 1; localStorage.setItem(PUBLISHED_KEY, JSON.stringify({ revision, createdAt: new Date().toISOString(), document: { schemaVersion: 1, graph: serializableGraph(graph), viewport: flow.getViewport() } })); setPublished({ revision, fingerprint }); notify(`已保存本地版本 v${revision}。外部运行服务尚未连接。`, "success"); setPublishOpen(false); }
    catch { notify("版本保存失败，请检查浏览器存储或导出流程备份。", "error"); }
  };
  const run = () => {
    try { setResult(simulate(graph, amount.trim() === "" ? null : Number(amount))); notify(""); }
    catch (error) { setResult(null); notify(error instanceof Error ? error.message : "模拟失败。", "error"); }
  };

  return <NodeActionContext.Provider value={nodeActions}>
    <SidebarProvider defaultOpen={false} breakpointBehavior="collapse">
      <AppShell ref={workspaceRef} className={styles.workspace}>
        <WorkspaceNav onHelp={() => setHelp(true)} />
        <AppShellHeader ref={headerRef} className={styles.header}><div className={styles.topbar}>
          <div className={styles.titleGroup}><Glyph name="folder" /><Breadcrumb><BreadcrumbList><BreadcrumbItem><BreadcrumbLink href="/docs/pages">自动化</BreadcrumbLink></BreadcrumbItem><BreadcrumbSeparator /><BreadcrumbItem><BreadcrumbPage>{graph.name}</BreadcrumbPage></BreadcrumbItem></BreadcrumbList></Breadcrumb><div className={styles.titleMeta}><Badge size="sm" status={publishedCurrent ? "success" : "warning"}>{publishedCurrent ? `本地 v${published?.revision}` : "草稿"}</Badge><span role="status" className={styles.saveState}><span className={styles.saveDot} data-error={saveStatus.includes("失败") || undefined} />{saveStatus}{saveStatus === "保存失败" && <Button size="xs" variant="link" onClick={() => setSaveRetry((v) => v + 1)}>重试</Button>}</span></div></div>
          <div className={styles.topActions}><span className={styles.localLabel}>本地演示</span><Button variant="tertiary" leadingIcon={Upload} onClick={exportGraph}>导出</Button><DropdownMenu><DropdownTrigger render={<Button aria-label="更多工作流操作" iconOnly variant="tertiary"><Glyph name="ellipsis" /></Button>} /><DropdownContent><MenuItem index={0} label="重命名工作流" icon={Pencil} onSelect={() => { setName(graph.name); setRename(true); }} /><MenuItem index={1} label="导入流程 JSON" icon={Upload} onSelect={() => fileRef.current?.click()} /><MenuItem index={2} label="恢复初始示例" icon={Undo} onSelect={() => setResetOpen(true)} /><MenuItem index={3} label="使用说明" icon={Bulb} onSelect={() => setHelp(true)} /></DropdownContent></DropdownMenu><Button variant="primary" disabled={publishedCurrent || !ready} onClick={() => setPublishOpen(true)}>发布</Button></div>
        </div></AppShellHeader>
        <AppShellMain landmark={false} className={styles.main}>
          <div className={styles.canvasRow}>
            <section className={styles.canvas} data-workflow-canvas aria-label="工作流画布">
              <ReactFlow<WorkflowNode> className={styles.flow} data-pan={panKeyPressed || undefined} colorMode={flowColorMode} nodes={displayedNodes} edges={displayedEdges} nodeTypes={nodeTypes} minZoom={0.25} maxZoom={2} onlyRenderVisibleElements={false} noPanClassName={styles.noPan} noWheelClassName={styles.scrollable}
                onNodesChange={(changes) => { const mutations = changes.filter((c) => c.type !== "remove"); dispatch({ type: "change", record: mutations.some((change) => change.type === "position") && dragBefore.current === null, update: (current) => ({ ...current, nodes: applyNodeChanges(mutations, current.nodes) }) }); }}
                onEdgesChange={(changes) => { const mutations = changes.filter((c) => c.type !== "remove"); dispatch({ type: "change", record: false, update: (current) => ({ ...current, edges: applyEdgeChanges(mutations, current.edges) }) }); }}
                onBeforeDelete={async ({ nodes, edges }) => { const nodeIds = new Set(nodes.map((n) => n.id)), edgeIds = new Set(edges.map((e) => e.id)); dispatch({ type: "change", update: (current) => ({ ...current, nodes: current.nodes.filter((n) => !nodeIds.has(n.id)), edges: current.edges.filter((e) => !edgeIds.has(e.id) && !nodeIds.has(e.source) && !nodeIds.has(e.target)) }) }); setEditing((id) => id && nodeIds.has(id) ? null : id); return false; }}
                onNodeDragStart={beginDrag} onNodeDragStop={endDrag} onSelectionDragStart={beginDrag} onSelectionDragStop={endDrag}
                onNodeDoubleClick={(_, node) => setEditing(node.id)} onPaneClick={() => setEditing(null)} onConnect={connect} isValidConnection={(connection) => canConnect(graphRef.current, connection.source, connection.target, connection.sourceHandle ?? null)}
                onMoveEnd={(_, viewport) => { viewportRef.current = viewport; saveDraft(); }} nodesDraggable={ready && !panKeyPressed} nodesConnectable={ready && !panKeyPressed} elementsSelectable={!panKeyPressed} deleteKeyCode={dialogOpen ? null : ["Backspace", "Delete"]} selectionOnDrag={!panKeyPressed} selectionKeyCode={panKeyPressed ? null : "Shift"} panActivationKeyCode={null} panOnDrag={panKeyPressed ? true : [1, 2]} panOnScroll zoomOnDoubleClick={false}
                ariaLabelConfig={{ "node.a11yDescription.default": "按 Enter 选择节点，方向键移动，Delete 删除。双击打开配置。", "controls.zoomIn.ariaLabel": "放大", "controls.zoomOut.ariaLabel": "缩小", "minimap.ariaLabel": "工作流小地图" }}>
                {canvasMetrics && <Background variant={BackgroundVariant.Dots} gap={canvasMetrics.gap} size={canvasMetrics.dot} />}
                <Panel position="bottom-center"><Elevated className={styles.dock} shadow="floating"><Button leadingIcon={Play} onClick={() => setPanel(panel === "run" ? null : "run")}>试运行</Button><Button variant="secondary" leadingIcon={Plus} onClick={() => setPicker({})}>添加节点</Button><Separator orientation="vertical" /><IconButton name="rotate-ccw" label="撤销" disabled={!history.past.length} onClick={() => { dispatch({ type: "undo" }); setEditing(null); }} /><span className={styles.redo}><IconButton name="rotate-ccw" label="重做" disabled={!history.future.length} onClick={() => { dispatch({ type: "redo" }); setEditing(null); }} /></span></Elevated></Panel>
                {miniMap && <MiniMap className={styles.minimap} position="bottom-right" pannable zoomable nodeColor={(n) => n.selected ? "var(--brand)" : "var(--fg-subtle)"} nodeStrokeColor="var(--border)" maskColor="var(--scrim)" maskStrokeColor="var(--brand)" ariaLabel="工作流小地图" />}
                <Panel position="bottom-right"><CanvasControls miniMap={miniMap} onToggleMiniMap={() => setMiniMap((v) => !v)} onFit={() => void flow.fitView({ padding: 0.15 })} /></Panel>
              </ReactFlow>
            </section>
            {settingsNode && <NodeSettings key={settingsNode.id} node={settingsNode} onClose={() => setEditing(null)} onDelete={() => remove(settingsNode.id)} onSave={(data) => { dispatch({ type: "change", update: (current) => ({ ...current, nodes: current.nodes.map((n) => n.id === settingsNode.id ? { ...n, data } : n) }) }); setEditing(null); }} />}
          </div>
          {panel && <section className={styles.bottomPanel} aria-label="运行与代码"><Tabs value={panel} onValueChange={(value) => setPanel(value as "run" | "code")} variant="underline"><div className={styles.panelHeader}><TabsList><TabItem value="run" label="模拟运行" /><TabItem value="code" label="流程 JSON" /></TabsList><IconButton name="x" label="关闭底部面板" onClick={() => setPanel(null)} /></div><TabPanel value="run"><div className={styles.runPanel}><div className={styles.runForm}><Field><FieldLabel>交易金额（美元）</FieldLabel><Input type="number" min={0} step="any" value={amount} placeholder="留空表示未填写" onChange={(e) => { setAmount(e.target.value); setResult(null); }} /><FieldDescription>仅模拟路径，不调用 AI、Slack 或 CRM。</FieldDescription></Field><Button leadingIcon={Play} onClick={run}>模拟运行</Button></div>{result ? <div className={styles.runResult}><Badge status="success">路径模拟完成</Badge><span className="text-body text-fg-muted">{result.branchLabel}</span><ol className={styles.runSteps}>{result.nodeIds.map((id, index) => <li key={id}><Check className="size-4 text-fg-success" /><span>{graph.nodes.find((n) => n.id === id)?.data.title}</span>{index < result.nodeIds.length - 1 && <Arrow className="size-4 text-fg-subtle" />}</li>)}</ol></div> : <p className="text-body text-fg-subtle">输入金额，查看这笔交易将经过哪些节点。</p>}</div></TabPanel><TabPanel value="code"><div className={styles.codePanel}><CodeBlock file={{ name: "workflow.json", contents: JSON.stringify(serializableGraph(graph), null, 2) }} /></div></TabPanel></Tabs></section>}
        </AppShellMain>
      </AppShell>
    </SidebarProvider>

    <input ref={fileRef} type="file" accept="application/json,.json" className="sr-only" aria-label="导入流程文件" onChange={importGraph} />
    <Dialog open={!!picker} onOpenChange={(open) => { if (!open) setPicker(null); }}><DialogContent size="sm"><DialogHeader><DialogTitle>添加节点</DialogTitle><DialogDescription>{picker?.source ? "选择节点类型，空闲出口会自动连接。" : "选择节点类型，随后在画布中连接它。"}</DialogDescription></DialogHeader><div className={styles.nodePicker}>{(["trigger", "action", "agent", "branch"] as NodeKind[]).map((kind) => <NodeKindButton key={kind} kind={kind} disabled={kind === "trigger" && graph.nodes.some((n) => n.data.kind === "trigger")} onClick={() => addNode(kind)} />)}</div></DialogContent></Dialog>
    <Dialog open={rename} onOpenChange={setRename}><DialogContent size="sm"><DialogHeader><DialogTitle>重命名工作流</DialogTitle></DialogHeader><form onSubmit={(event) => { event.preventDefault(); if (name.trim()) { dispatch({ type: "change", update: (current) => ({ ...current, name: name.trim() }) }); setRename(false); } }}><Field><FieldLabel>工作流名称</FieldLabel><Input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} required /></Field><DialogFooter><Button type="button" variant="tertiary" onClick={() => setRename(false)}>取消</Button><Button type="submit" disabled={!name.trim()}>保存名称</Button></DialogFooter></form></DialogContent></Dialog>
    <Dialog open={publishOpen} onOpenChange={setPublishOpen}><DialogContent size="sm"><DialogHeader><DialogTitle>发布本地流程版本</DialogTitle><DialogDescription>校验流程并在此浏览器保存独立版本快照。当前页面是本地演示，发布不会启动自动化或调用外部服务。</DialogDescription></DialogHeader><DialogFooter><Button variant="tertiary" onClick={() => setPublishOpen(false)}>取消</Button><Button onClick={publish}>校验并保存版本</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={resetOpen} onOpenChange={setResetOpen}><DialogContent size="sm"><DialogHeader><DialogTitle>恢复初始示例？</DialogTitle><DialogDescription>当前画布将替换为交易分配示例。正常草稿可以通过撤销恢复；建议先导出重要内容。</DialogDescription></DialogHeader><DialogFooter><Button variant="tertiary" onClick={() => setResetOpen(false)}>取消</Button><Button onClick={() => { dispatch({ type: "change", update: () => initialGraph() }); setStorageBlocked(false); setEditing(null); setResetOpen(false); notify(""); requestAnimationFrame(() => void flow.fitView({ padding: 0.15 })); }}>恢复示例</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={help} onOpenChange={setHelp}><DialogContent size="sm"><DialogHeader><DialogTitle>编排你的自动化流程</DialogTitle><DialogDescription>所有界面使用 Zeron 现有组件与主题变量。</DialogDescription></DialogHeader><ul className={styles.helpList}><li>拖动节点标题移动；双击打开配置，选中后使用上方工具栏。</li><li>从右侧出口拖到下游节点的左侧输入。</li><li>默认点击选择，拖动空白区域框选；按住 <Kbd>Space</Kbd> 空格键后拖动画布，也可使用中键、右键或滚轮平移。</li><li>每个出口连接一个下游；首期不支持循环与合流。</li><li><KbdGroup><Kbd>⌘ / Ctrl</Kbd><Kbd>Z</Kbd></KbdGroup> 撤销，加 <Kbd>Shift</Kbd> 重做；<KbdGroup><Kbd>⌘ / Ctrl</Kbd><Kbd>S</Kbd></KbdGroup> 保存。</li><li>选择节点或连线后按 <Kbd>Delete</Kbd> 删除。</li><li>草稿保存在此浏览器，可导出 JSON 备份。</li><li>试运行只验证金额分流，不执行外部动作。</li></ul></DialogContent></Dialog>
  </NodeActionContext.Provider>;
}

export function WorkflowEditor() { return <ReactFlowProvider><EditorWorkspace /></ReactFlowProvider>; }
