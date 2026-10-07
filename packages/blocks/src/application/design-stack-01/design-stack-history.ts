"use client";

import { useCallback, useReducer } from "react";
import type { DesignStackItem } from "./design-stack-types";

interface History {
  past: DesignStackItem[][];
  items: DesignStackItem[];
  future: DesignStackItem[][];
}
type Action = { type: "change" | "reset"; items: DesignStackItem[] } | { type: "undo" | "redo" };
const snapshot = (items: DesignStackItem[]) => items.map((item) => ({ ...item }));
const historyLimit = 100;

function reducer(state: History, action: Action): History {
  if (action.type === "reset") return { past: [], items: snapshot(action.items), future: [] };
  if (action.type === "change") {
    if (state.items.length === action.items.length && state.items.every((item, index) => {
      const next = action.items[index];
      return item.id === next.id && item.tool === next.tool && item.category === next.category
        && item.website === next.website && item.renews === next.renews && item.logoSrc === next.logoSrc;
    })) return state;
    return { past: [...state.past, state.items].slice(-historyLimit), items: snapshot(action.items), future: [] };
  }
  if (action.type === "undo") {
    if (!state.past.length) return state;
    return { past: state.past.slice(0, -1), items: state.past[state.past.length - 1], future: [state.items, ...state.future] };
  }
  if (!state.future.length) return state;
  return { past: [...state.past, state.items].slice(-historyLimit), items: state.future[0], future: state.future.slice(1) };
}

/** Local synchronous history; use reset when replacing the host dataset. */
export function useDesignStackHistory(initialItems: DesignStackItem[]) {
  const [state, dispatch] = useReducer(reducer, initialItems, (items) => ({ past: [], items: snapshot(items), future: [] }));
  const onItemsChange = useCallback((items: DesignStackItem[]) => dispatch({ type: "change", items }), []);
  const onUndo = useCallback(() => dispatch({ type: "undo" }), []);
  const onRedo = useCallback(() => dispatch({ type: "redo" }), []);
  const reset = useCallback((items: DesignStackItem[]) => dispatch({ type: "reset", items }), []);
  return { items: state.items, onItemsChange, reset, history: { canUndo: state.past.length > 0, canRedo: state.future.length > 0, onUndo, onRedo } };
}
