import { describe, expect, it } from "vitest";
import { canConnect, createNode, initialGraph, parseStoredWorkflow, serializableGraph, simulate, validateConnections, validateGraph } from "../app/(internal)/workflow/_components/workflow-model";

describe("standalone workflow graph", () => {
  it("validates the initial workflow and preserves its logical output identifiers", () => {
    const graph = initialGraph();
    expect(validateGraph(graph)).toEqual([]);
    const stored = { schemaVersion: 1, graph, viewport: { x: 10, y: -20, zoom: 0.75 } };
    expect(parseStoredWorkflow(JSON.stringify(stored))).toEqual(stored);
  });
  it.each([
    [300000, "enterprise", ["trigger", "enrich", "branch", "enterprise", "notify", "crm"]],
    [250000, "enterprise", ["trigger", "enrich", "branch", "enterprise", "notify", "crm"]],
    [249999, "midmarket", ["trigger", "enrich", "branch", "midmarket"]],
    [50000, "midmarket", ["trigger", "enrich", "branch", "midmarket"]],
    [49999, "small", ["trigger", "enrich", "branch", "small"]],
    [0, "small", ["trigger", "enrich", "branch", "small"]],
    [null, "missing", ["trigger", "enrich", "branch", "missing"]],
  ])("routes amount %s to %s without invoking external actions", (amount, _branch, path) => {
    expect(simulate(initialGraph(), amount as number | null).nodeIds).toEqual(path);
  });
  it("uses the fallback only when no condition matches", () => {
    const graph = initialGraph();
    graph.nodes.find((n) => n.id === "branch")!.data.branches!.find((r) => r.id === "small")!.max = 1;
    expect(simulate(graph, 500).nodeIds.at(-1)).toBe("fallback");
  });
  it("prevents cycles, self connections, occupied outputs, and implicit joins", () => {
    const graph = initialGraph();
    expect(canConnect(graph, "crm", "trigger", "out")).toBe(false);
    expect(canConnect(graph, "crm", "branch", "out")).toBe(false);
    expect(canConnect(graph, "crm", "crm", "out")).toBe(false);
    expect(canConnect(graph, "trigger", "small", "out")).toBe(false);
    expect(canConnect(graph, "small", "crm", "out")).toBe(false);
    graph.edges = graph.edges.filter((e) => e.target !== "crm");
    expect(canConnect(graph, "small", "crm", "out")).toBe(true);
    expect(canConnect(graph, "branch", "crm", "nonexistent")).toBe(false);
  });
  it("reports dangling nodes and an unconnected branch when an action is removed", () => {
    const graph = initialGraph();
    graph.nodes = graph.nodes.filter((n) => n.id !== "enterprise");
    graph.edges = graph.edges.filter((e) => e.source !== "enterprise" && e.target !== "enterprise");
    expect(validateGraph(graph).some((issue) => issue.includes("尚未连接"))).toBe(true);
    expect(validateGraph(graph).some((issue) => issue.includes("未连接到触发器"))).toBe(true);
    expect(() => simulate(graph, 300000)).toThrow();
  });
  it("rejects duplicate IDs, invalid references, corrupted viewports, and unknown versions", () => {
    const stored = { schemaVersion: 1, graph: initialGraph(), viewport: { x: 0, y: 0, zoom: 1 } };
    expect(() => parseStoredWorkflow(JSON.stringify({ ...stored, schemaVersion: 2 }))).toThrow();
    expect(() => parseStoredWorkflow(JSON.stringify({ ...stored, viewport: { x: 0, y: 0, zoom: 20 } }))).toThrow();
    stored.graph.nodes.push(stored.graph.nodes[0]);
    expect(() => parseStoredWorkflow(JSON.stringify(stored))).toThrow();
    stored.graph = initialGraph();
    stored.graph.edges[0].target = "unknown";
    expect(() => parseStoredWorkflow(JSON.stringify(stored))).toThrow();
  });
  it("exports business data and geometry while discarding transient React Flow state", () => {
    const graph = initialGraph();
    graph.nodes[0].selected = true;
    graph.nodes[0].dragging = true;
    graph.nodes[0].measured = { width: 272, height: 160 };
    expect(serializableGraph(graph).nodes[0]).not.toHaveProperty("selected");
    expect(serializableGraph(graph).nodes[0]).not.toHaveProperty("dragging");
    expect(serializableGraph(graph).nodes[0]).not.toHaveProperty("measured");
  });
  it("rejects negative and nonfinite simulation amounts", () => {
    expect(() => simulate(initialGraph(), -1)).toThrow();
    expect(() => simulate(initialGraph(), NaN)).toThrow();
  });
  it("accepts incomplete drafts while rejecting structural cycles and duplicate outputs", () => {
    const stored = { schemaVersion: 1, graph: initialGraph(), viewport: { x: 0, y: 0, zoom: 1 } };
    stored.graph.edges = [];
    expect(parseStoredWorkflow(JSON.stringify(stored)).graph.edges).toEqual([]);
    stored.graph.edges = [
      { id: "a", source: "enrich", target: "crm", sourceHandle: "out", targetHandle: "in" },
      { id: "b", source: "crm", target: "enrich", sourceHandle: "out", targetHandle: "in" },
    ];
    expect(validateConnections(stored.graph)).toContain("连线形成循环");
    expect(() => parseStoredWorkflow(JSON.stringify(stored))).toThrow("连接关系");
    stored.graph = initialGraph();
    stored.graph.edges.push({ id: "extra", source: "trigger", target: "crm", sourceHandle: "out", targetHandle: "in" });
    expect(() => parseStoredWorkflow(JSON.stringify(stored))).toThrow("连接关系");
  });
  it("rejects unsupported edge renderers and branches on non-branch nodes", () => {
    expect(() => parseStoredWorkflow("{broken")).toThrow("JSON 格式无效");
    const stored = { schemaVersion: 1, graph: initialGraph(), viewport: { x: 0, y: 0, zoom: 1 } };
    stored.graph.edges[0].type = "unknown-renderer";
    expect(() => parseStoredWorkflow(JSON.stringify(stored))).toThrow("连线");
    stored.graph = initialGraph();
    stored.graph.nodes[0].data.branches = [];
    expect(() => parseStoredWorkflow(JSON.stringify(stored))).toThrow("节点");
  });
  it("validates and simulates the supported maximum-size chain without recursive traversal", () => {
    const graph = {
      name: "Long workflow", nodes: Array.from({ length: 500 }, (_, index) => createNode(index === 0 ? "trigger" : "action", String(index), { x: index * 300, y: 0 })),
      edges: Array.from({ length: 499 }, (_, index) => ({ id: String(index), source: String(index), target: String(index + 1), sourceHandle: "out", targetHandle: "in" })),
    };
    expect(validateGraph(graph)).toEqual([]);
    expect(simulate(graph, 100).nodeIds).toHaveLength(500);
    expect(canConnect(graph, "499", "1")).toBe(false);
  });
});
