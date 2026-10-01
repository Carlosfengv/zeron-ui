import { describe, expect, it } from "vitest";
import { historyReducer, type History } from "../app/(internal)/workflow/_components/workflow-history";
import { initialGraph } from "../app/(internal)/workflow/_components/workflow-model";

const initial = (): History => ({ past: [], present: initialGraph(), future: [] });

describe("workflow history", () => {
  it("records one undo step for a multi-node drag with many position updates", () => {
    let state = initial();
    const before = state.present;
    for (let step = 0; step < 10; step++) state = historyReducer(state, {
      type: "change", record: false,
      update: (graph) => ({ ...graph, nodes: graph.nodes.map((node, index) => index < 2 ? { ...node, position: { ...node.position, x: node.position.x + 10 } } : node) }),
    });
    state = historyReducer(state, { type: "checkpoint", before });
    expect(state.past).toHaveLength(1);
    expect(historyReducer(state, { type: "undo" }).present).toEqual(before);
    expect(historyReducer(historyReducer(state, { type: "undo" }), { type: "redo" }).present).toEqual(state.present);
  });
  it("does not consume undo history or clear redo for selection and no-op updates", () => {
    let state = historyReducer(initial(), { type: "change", update: (graph) => ({ ...graph, name: "Renamed" }) });
    state = historyReducer(state, { type: "undo" });
    expect(historyReducer(state, { type: "change", update: (graph) => graph })).toBe(state);
    const selected = historyReducer(state, { type: "change", update: (graph) => ({ ...graph, nodes: graph.nodes.map((node) => ({ ...node, selected: true })) }) });
    expect(selected.past).toHaveLength(0);
    expect(selected.future).toHaveLength(1);
  });
  it("bounds history and leaves clicks without movement out of the undo stack", () => {
    let state = initial();
    expect(historyReducer(state, { type: "checkpoint", before: state.present })).toBe(state);
    for (let index = 0; index < 60; index++) state = historyReducer(state, { type: "change", update: (graph) => ({ ...graph, name: String(index) }) });
    expect(state.past).toHaveLength(50);
  });
});
