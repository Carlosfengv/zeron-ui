import type { Edge, Node } from "@xyflow/react";

export type NodeKind = "trigger" | "action" | "agent" | "branch";
export type BranchRule = { id: string; label: string; mode: "gte" | "range" | "lt" | "missing" | "fallback"; min?: number; max?: number };
export type WorkflowData = { kind: NodeKind; title: string; description: string; operation: string; branches?: BranchRule[] };
export type WorkflowNode = Node<WorkflowData, "workflow">;
export type WorkflowGraph = { name: string; nodes: WorkflowNode[]; edges: Edge[] };
export type StoredWorkflow = { schemaVersion: 1; graph: WorkflowGraph; viewport: { x: number; y: number; zoom: number } };
export const STORAGE_KEY = "zeron.workflow.draft.v1";
export const PUBLISHED_KEY = "zeron.workflow.published.v1";
export const kindLabels: Record<NodeKind, string> = { trigger: "触发器", action: "动作", agent: "AI 智能体", branch: "条件分支" };

const initialBranches: BranchRule[] = [
  { id: "enterprise", label: "大于等于 $250k", mode: "gte", min: 250000 },
  { id: "midmarket", label: "$50k – $250k", mode: "range", min: 50000, max: 250000 },
  { id: "small", label: "低于 $50k", mode: "lt", max: 50000 },
  { id: "missing", label: "尚未填写金额", mode: "missing" },
  { id: "fallback", label: "兜底 · 人工审核", mode: "fallback" },
];

export function createNode(kind: NodeKind, id: string, position: { x: number; y: number }): WorkflowNode {
  return { id, type: "workflow", position, data: {
    kind, title: { trigger: "交易创建或更新", action: "新的处置动作", agent: "分配企业销售团队", branch: "按交易金额分流" }[kind],
    description: { trigger: "关键交易字段发生变化时", action: "选择并配置这一步的动作", agent: "根据客户信息推荐负责人", branch: "按顺序匹配，使用第一个符合的出口" }[kind],
    operation: { trigger: "deal.updated", action: "custom.action", agent: "agent.assign", branch: "deal.value" }[kind],
    ...(kind === "branch" ? { branches: initialBranches.map((rule) => ({ ...rule })) } : {}),
  } };
}

export function initialGraph(): WorkflowGraph {
  const definitions: Array<[string, NodeKind, string, string, string, number, number]> = [
    ["trigger", "trigger", "交易创建或更新", "关键交易字段发生变化时", "deal.updated", 0, 150],
    ["enrich", "action", "补全公司信息", "获取公司资料与技术栈数据", "company.enrich", 340, 240],
    ["branch", "branch", "按交易金额分流", "条件按顺序匹配", "deal.value", 340, 470],
    ["enterprise", "agent", "分配企业销售团队", "根据客户信息推荐负责人", "agent.assign", 850, 60],
    ["midmarket", "action", "轮询分配销售代表", "结合区域与当前可用状态", "owner.round-robin", 850, 245],
    ["small", "action", "保留在待领取队列", "等待销售代表领取这笔交易", "queue.enqueue", 850, 430],
    ["missing", "action", "提醒负责人填写金额", "发送一条交易信息补充提醒", "owner.remind", 850, 615],
    ["fallback", "action", "标记为人工审核", "将异常交易交给运营团队", "review.flag", 850, 800],
    ["notify", "action", "发送到 #deal-flow", "通知团队已分配的负责人", "slack.notify", 1190, 245],
    ["crm", "action", "更新 CRM 记录", "记录分配结果与执行轨迹", "crm.update", 1530, 245],
  ];
  const nodes = definitions.map(([id, kind, title, description, operation, x, y]) => {
    const node = createNode(kind, id, { x, y });
    return { ...node, data: { ...node.data, title, description, operation } };
  });
  const edge = (source: string, target: string, sourceHandle = "out"): Edge => ({ id: `${source}-${sourceHandle}-${target}`, source, target, sourceHandle, targetHandle: "in", type: "default" });
  return { name: "大额交易自动分配", nodes, edges: [edge("trigger", "enrich"), edge("enrich", "branch"), ...initialBranches.map((rule) => edge("branch", rule.id, rule.id)), edge("enterprise", "notify"), edge("notify", "crm")] };
}

export function serializableGraph(graph: WorkflowGraph): WorkflowGraph {
  return {
    name: graph.name,
    nodes: graph.nodes.map(({ id, position, data }) => ({
      id, type: "workflow", position: { x: position.x, y: position.y },
      data: {
        kind: data.kind, title: data.title, description: data.description, operation: data.operation,
        ...(data.kind === "branch" ? { branches: data.branches?.map(({ id, label, mode, min, max }) => ({ id, label, mode, ...(min !== undefined ? { min } : {}), ...(max !== undefined ? { max } : {}) })) } : {}),
      },
    })),
    edges: graph.edges.map(({ id, source, target, sourceHandle, targetHandle }) => ({ id, source, target, sourceHandle, targetHandle, type: "default" })),
  };
}

function edgesBySource(graph: WorkflowGraph): Map<string, Edge[]> {
  const outgoing = new Map<string, Edge[]>();
  for (const edge of graph.edges) {
    const edges = outgoing.get(edge.source) ?? [];
    edges.push(edge);
    outgoing.set(edge.source, edges);
  }
  return outgoing;
}

function validRule(value: unknown): value is BranchRule {
  if (!value || typeof value !== "object") return false;
  const r = value as BranchRule;
  return typeof r.id === "string" && !!r.id && typeof r.label === "string" && ["gte", "range", "lt", "missing", "fallback"].includes(r.mode)
    && (r.min === undefined || Number.isFinite(r.min)) && (r.max === undefined || Number.isFinite(r.max));
}

export function parseStoredWorkflow(raw: string): StoredWorkflow {
  let value: StoredWorkflow;
  try { value = JSON.parse(raw) as StoredWorkflow; }
  catch { throw new Error("无法读取草稿：JSON 格式无效。"); }
  if (value?.schemaVersion !== 1 || !value.graph || typeof value.graph.name !== "string" || !Array.isArray(value.graph.nodes) || !Array.isArray(value.graph.edges) || value.graph.nodes.length > 500 || value.graph.edges.length > 2000) throw new Error("无法读取草稿：文件格式不受支持。");
  for (const n of value.graph.nodes) {
    if (!n || typeof n.id !== "string" || !n.id || n.type !== "workflow" || !Number.isFinite(n.position?.x) || !Number.isFinite(n.position?.y) || !n.data || !Object.hasOwn(kindLabels, n.data.kind) || ![n.data.title, n.data.description, n.data.operation].every((s) => typeof s === "string") || (n.data.branches !== undefined && n.data.kind !== "branch") || (n.data.kind === "branch" && (!Array.isArray(n.data.branches) || !n.data.branches.every(validRule)))) throw new Error("草稿包含无法读取的节点。");
  }
  for (const e of value.graph.edges) {
    if (!e || typeof e.id !== "string" || !e.id || (e.type !== undefined && e.type !== "default") || typeof e.source !== "string" || typeof e.target !== "string" || (e.sourceHandle != null && typeof e.sourceHandle !== "string") || (e.targetHandle != null && typeof e.targetHandle !== "string")) throw new Error("草稿包含无法读取的连线。");
  }
  if (!value.viewport || ![value.viewport.x, value.viewport.y, value.viewport.zoom].every(Number.isFinite) || value.viewport.zoom < 0.25 || value.viewport.zoom > 2) throw new Error("草稿的视口信息无效。");
  if (validateConnections(value.graph).length) throw new Error("草稿的节点连接关系已损坏。");
  return { schemaVersion: 1, graph: serializableGraph(value.graph), viewport: value.viewport };
}

export function canConnect(graph: WorkflowGraph, source: string, target: string, sourceHandle: string | null = "out", ignoreEdgeId?: string): boolean {
  if (source === target) return false;
  const from = graph.nodes.find((n) => n.id === source);
  const to = graph.nodes.find((n) => n.id === target);
  if (!from || !to || to.data.kind === "trigger") return false;
  if (from.data.kind === "branch" ? !from.data.branches?.some((r) => r.id === sourceHandle) : sourceHandle !== "out") return false;
  const edges = graph.edges.filter((e) => e.id !== ignoreEdgeId);
  // First version has one continuation per logical output and no implicit joins.
  if (edges.some((e) => (e.source === source && e.sourceHandle === sourceHandle) || e.target === target)) return false;
  const outgoing = edgesBySource({ ...graph, edges });
  const visited = new Set<string>(), pending = [target];
  while (pending.length) {
    const id = pending.pop()!;
    if (id === source) return false;
    if (visited.has(id)) continue;
    visited.add(id);
    for (const edge of outgoing.get(id) ?? []) pending.push(edge.target);
  }
  return true;
}

/** Structural validity is independent of whether an editable draft is ready to publish. */
export function validateConnections(graph: WorkflowGraph): string[] {
  const issues: string[] = [];
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  if (nodes.size !== graph.nodes.length || new Set(graph.edges.map((edge) => edge.id)).size !== graph.edges.length) issues.push("节点或连线标识重复");
  for (const node of graph.nodes) {
    if (node.data.kind === "branch") {
      const rules = node.data.branches ?? [];
      if (!rules.length || new Set(rules.map((rule) => rule.id)).size !== rules.length) issues.push(`${node.data.title}：条件出口标识无效`);
    }
  }
  const incoming = new Set<string>(), outputs = new Map<string, Set<string>>();
  const indegree = new Map(graph.nodes.map((node) => [node.id, 0]));
  for (const edge of graph.edges) {
    const from = nodes.get(edge.source), to = nodes.get(edge.target);
    if (!from || !to) { issues.push("连线引用的节点不存在"); continue; }
    const handle = edge.sourceHandle ?? "";
    const used = outputs.get(edge.source) ?? new Set<string>();
    if (edge.targetHandle !== "in" || to.data.kind === "trigger" || edge.source === edge.target || incoming.has(edge.target) || used.has(handle)
      || (from.data.kind === "branch" ? !from.data.branches?.some((rule) => rule.id === handle) : handle !== "out")) issues.push("连线出口无效或存在重复连接");
    incoming.add(edge.target); used.add(handle); outputs.set(edge.source, used);
    indegree.set(edge.target, indegree.get(edge.target)! + 1);
  }
  const outgoing = edgesBySource(graph);
  const pending = [...indegree].filter(([, count]) => count === 0).map(([id]) => id);
  let visited = 0;
  for (let index = 0; index < pending.length; index++) {
    visited++;
    for (const edge of outgoing.get(pending[index]) ?? []) {
      if (!nodes.has(edge.target)) continue;
      const remaining = indegree.get(edge.target)! - 1;
      indegree.set(edge.target, remaining);
      if (remaining === 0) pending.push(edge.target);
    }
  }
  if (visited !== nodes.size) issues.push("连线形成循环");
  return [...new Set(issues)];
}

export function validateGraph(graph: WorkflowGraph): string[] {
  const issues = validateConnections(graph);
  const outgoing = edgesBySource(graph);
  if (!graph.name.trim()) issues.push("请填写工作流名称");
  const triggers = graph.nodes.filter((n) => n.data.kind === "trigger");
  if (triggers.length !== 1) issues.push("工作流需要且只能有一个触发器");
  for (const n of graph.nodes) {
    if (!n.data.title.trim() || !n.data.operation.trim()) issues.push(`${n.data.title || "未命名节点"}：请填写名称与操作标识`);
    if (n.data.kind === "branch") {
      const rules = n.data.branches ?? [];
      if (rules.filter((r) => r.mode === "fallback").length !== 1 || rules.at(-1)?.mode !== "fallback") issues.push(`${n.data.title}：最后一项必须是唯一的兜底出口`);
      for (const r of rules) {
        if (!r.label.trim() || (r.mode === "gte" && (!Number.isFinite(r.min) || r.min! < 0)) || (r.mode === "lt" && (!Number.isFinite(r.max) || r.max! <= 0)) || (r.mode === "range" && (!Number.isFinite(r.min) || !Number.isFinite(r.max) || r.min! < 0 || r.min! >= r.max!))) issues.push(`${n.data.title}：条件「${r.label}」参数无效`);
        if (!(outgoing.get(n.id) ?? []).some((e) => e.sourceHandle === r.id)) issues.push(`${n.data.title}：出口「${r.label}」尚未连接`);
      }
    }
  }
  if (triggers.length === 1) {
    const reachable = new Set<string>();
    const pending = [triggers[0].id];
    while (pending.length) {
      const id = pending.pop()!;
      if (reachable.has(id)) continue;
      reachable.add(id);
      for (const edge of outgoing.get(id) ?? []) pending.push(edge.target);
    }
    graph.nodes.filter((n) => !reachable.has(n.id)).forEach((n) => issues.push(`${n.data.title}：未连接到触发器`));
  }
  return [...new Set(issues)];
}

export function simulate(graph: WorkflowGraph, amount: number | null): { nodeIds: string[]; edgeIds: string[]; branchLabel?: string } {
  const issues = validateGraph(graph);
  if (issues.length) throw new Error(issues[0]);
  if (amount !== null && (!Number.isFinite(amount) || amount < 0)) throw new Error("请输入有效的非负交易金额。");
  const nodeIds: string[] = [], edgeIds: string[] = [];
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const outgoing = edgesBySource(graph);
  const visited = new Set<string>();
  let current = graph.nodes.find((n) => n.data.kind === "trigger");
  let branchLabel: string | undefined;
  while (current && !visited.has(current.id)) {
    visited.add(current.id);
    nodeIds.push(current.id);
    let handle = "out";
    if (current.data.kind === "branch") {
      const rule = current.data.branches?.find((r) => r.mode === "fallback" || (r.mode === "missing" ? amount === null : amount !== null && (r.mode === "gte" ? amount >= r.min! : r.mode === "lt" ? amount < r.max! : amount >= r.min! && amount < r.max!)));
      if (!rule) break;
      handle = rule.id; branchLabel = rule.label;
    }
    const e = outgoing.get(current.id)?.find((item) => item.sourceHandle === handle);
    if (!e) break;
    edgeIds.push(e.id);
    current = nodes.get(e.target);
  }
  return { nodeIds, edgeIds, branchLabel };
}
