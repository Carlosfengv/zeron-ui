"use client";

import { memo, useMemo } from "react";
import { Handle, Position, ReactFlow, type NodeProps } from "@xyflow/react";
import { Card, CardContent, CardDescription, CardEyebrow, CardHeader, CardTitle } from "@zeron/ui/card";
import { useThemeContext } from "@zeron/ui/system/theme-context";
import { initialGraph, kindLabels, type WorkflowNode } from "./workflow-model";
import "@xyflow/react/dist/base.css";
import styles from "./workflow.module.css";

const PreviewNode = memo(function PreviewNode({ data, sourcePosition }: NodeProps<WorkflowNode>) {
  return <div className={styles.node}>
    {data.kind !== "trigger" && <Handle type="target" id="in" position={data.kind === "branch" ? Position.Top : Position.Left} className={styles.handle} isConnectable={false} />}
    <Card>
      <CardHeader><CardEyebrow>{kindLabels[data.kind]}</CardEyebrow><CardTitle>{data.title}</CardTitle><CardDescription>{data.description}</CardDescription></CardHeader>
      {data.branches && <CardContent><div className={styles.branches}>{data.branches.map((rule) => <div className={styles.branchRow} key={rule.id}>{rule.label}</div>)}</div></CardContent>}
    </Card>
    {data.kind === "branch" ? data.branches?.map((rule, index) => <Handle key={rule.id} type="source" id={rule.id} position={Position.Right} className={styles.handle} style={{ top: `${((index + 1) / ((data.branches?.length ?? 0) + 1)) * 100}%` }} isConnectable={false} />) : <Handle type="source" id="out" position={sourcePosition ?? Position.Right} className={styles.handle} isConnectable={false} />}
  </div>;
});
const nodeTypes = { workflow: PreviewNode };

/** A read-only cover never mounts the editor's storage or keyboard handlers. */
export function WorkflowPreview() {
  const { theme } = useThemeContext();
  const graph = useMemo(() => {
    const graph = initialGraph();
    const downwardSources = new Set(graph.edges.filter((edge) => {
      const source = graph.nodes.find((node) => node.id === edge.source);
      const target = graph.nodes.find((node) => node.id === edge.target);
      return target?.data.kind === "branch" && target.position.x === source?.position.x;
    }).map((edge) => edge.source));
    return { ...graph, nodes: graph.nodes.map((node) => ({ ...node, sourcePosition: downwardSources.has(node.id) ? Position.Bottom : Position.Right })) };
  }, []);
  return <div className="h-full w-full"><ReactFlow<WorkflowNode>
    className={styles.flow} colorMode={theme === "dark" ? "dark" : "light"} nodes={graph.nodes} edges={graph.edges} nodeTypes={nodeTypes}
    fitView fitViewOptions={{ padding: 0.12 }} nodesDraggable={false} nodesConnectable={false} elementsSelectable={false}
    nodesFocusable={false} edgesFocusable={false} panOnDrag={false} panOnScroll={false} zoomOnScroll={false}
    zoomOnPinch={false} zoomOnDoubleClick={false} preventScrolling={false}
  /></div>;
}
