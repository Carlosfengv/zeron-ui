"use client";

import * as React from "react";
import type { FilterQueryHistoryEntry } from "../filter-query-core/filter-query-types";

export interface UseFilterQueryHistoryOptions {
  storageKey: string;
  limit?: number;
}

function isHistoryEntry(value: unknown): value is FilterQueryHistoryEntry {
  return Boolean(value)
    && typeof value === "object"
    && typeof (value as FilterQueryHistoryEntry).id === "string"
    && typeof (value as FilterQueryHistoryEntry).query === "string"
    && typeof (value as FilterQueryHistoryEntry).committedAt === "number";
}

/**
 * A small optional persistence adapter. FilterQueryInput itself never reads storage;
 * consumers opt in by spreading this return value into its controlled history props.
 */
export function useFilterQueryHistory({ limit = 5, storageKey }: UseFilterQueryHistoryOptions) {
  const [history, setHistory] = React.useState<FilterQueryHistoryEntry[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const parsed: unknown = JSON.parse(window.localStorage.getItem(storageKey) ?? "[]");
      return Array.isArray(parsed)
        ? parsed.filter(isHistoryEntry).sort((left, right) => right.committedAt - left.committedAt).slice(0, limit)
        : [];
    } catch {
      return [];
    }
  });

  const onHistoryChange = React.useCallback((next: FilterQueryHistoryEntry[]) => {
    setHistory([...next].sort((left, right) => right.committedAt - left.committedAt).slice(0, limit));
  }, [limit]);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(history));
    } catch {
      // Storage can be disabled or full; persistence is intentionally best-effort.
    }
  }, [history, storageKey]);

  return { history, onHistoryChange };
}
