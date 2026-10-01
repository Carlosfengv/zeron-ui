import { serializableGraph, type WorkflowGraph } from "./workflow-model";

export type History = { past: WorkflowGraph[]; present: WorkflowGraph; future: WorkflowGraph[] };
export type HistoryAction = { type: "change"; update: (graph: WorkflowGraph) => WorkflowGraph; record?: boolean } | { type: "checkpoint"; before: WorkflowGraph } | { type: "restore"; graph: WorkflowGraph } | { type: "undo" } | { type: "redo" };
export function historyReducer(state: History, action: HistoryAction): History {
  if (action.type === "restore") return { past: [], present: action.graph, future: [] };
  if (action.type === "undo") return state.past.length ? { past: state.past.slice(0, -1), present: state.past.at(-1)!, future: [state.present, ...state.future] } : state;
  if (action.type === "redo") return state.future.length ? { past: [...state.past, state.present], present: state.future[0], future: state.future.slice(1) } : state;
  if (action.type === "checkpoint") return JSON.stringify(serializableGraph(action.before)) === JSON.stringify(serializableGraph(state.present)) ? state : { ...state, past: [...state.past.slice(-49), action.before], future: [] };
  const next = action.update(state.present);
  if (next === state.present) return state;
  const unchanged = action.record !== false && JSON.stringify(serializableGraph(next)) === JSON.stringify(serializableGraph(state.present));
  return action.record === false || unchanged ? { ...state, present: next } : { past: [...state.past.slice(-49), state.present], present: next, future: [] };
}
