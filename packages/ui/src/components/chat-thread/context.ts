"use client";

import { createContext, useContext } from "react";
import type { ChatCheckpointData, ChatThreadLabels } from "./types";

export interface ThreadEntry {
  id: string;
  role: "user" | "assistant";
  text: string;
  element: HTMLElement;
  checkpoint?: ChatCheckpointData;
}

export interface ThreadContextValue {
  labels: ChatThreadLabels;
  locale: string;
  busy: boolean;
  pending: boolean;
  entries: ThreadEntry[];
  restorePreview: string | null;
  register: (entry: ThreadEntry) => () => void;
  pin: (id: string) => void;
  previewRestore: (id: string | null) => void;
  restore?: (id: string, code: boolean) => Promise<boolean>;
}

export const ThreadContext = createContext<ThreadContextValue | null>(null);

export function useThread() {
  const context = useContext(ThreadContext);
  if (!context)
    throw new Error("Chat messages must be rendered inside ChatThread.");
  return context;
}
