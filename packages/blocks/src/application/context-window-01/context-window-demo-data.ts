import type { ContextWindowData } from "./context-window-types";

/** Fixed local example. No model service or cache billing API is connected. */
export function createContextWindowDemoData(): ContextWindowData {
  return {
    capacity: 200_000, systemTokens: 3200, toolTokens: 11_900, tokensPerTurn: 1470,
    docs: [
      { id: "migration", title: "ledger_v3_migration.sql", source: "REPO", detail: "41m ago", tokens: 18_200 },
      { id: "webhooks", title: "Payment webhooks guide", source: "RAG", detail: "33m ago", tokens: 14_900 },
      { id: "reconcile", title: "billing/reconcile.ts", source: "REPO", detail: "27m ago", tokens: 9400 },
      { id: "incident", title: "Incident 2291 postmortem", source: "RAG", detail: "19m ago", tokens: 6100 },
      { id: "errors", title: "api-errors.md", source: "REPO", detail: "8m ago", tokens: 3600 },
    ],
    memory: [
      { id: "architecture", title: "Ledger architecture decisions", source: "PROJECT", detail: "2h ago", tokens: 3200 },
      { id: "preferences", title: "Coding conventions & preferences", source: "USER", detail: "1d ago", tokens: 2100 },
      { id: "checklist", title: "Migration safety checklist", source: "PROJECT", detail: "49m ago", tokens: 1900 },
      { id: "schema", title: "Schema constraints", source: "SESSION", detail: "37m ago", tokens: 1300 },
    ],
    history: [
      { id: "turn-8", title: "Diffed v2 and v3 schemas", source: "TURN 8", detail: "1h ago", tokens: 4200 },
      { id: "turn-40", title: "Drafted the cut-over plan", source: "TURN 40", detail: "26m ago", tokens: 3800 },
      { id: "turn-43", title: "Compared row counts per shard", source: "TURN 43", detail: "18m ago", tokens: 3700 },
      { id: "turn-11", title: "Explained the double-post bug", source: "TURN 11", detail: "1h ago", tokens: 3700 },
      ...Array.from({ length: 44 }, (_, index) => ({ id: `history-${index}`, title: `Migration discussion ${index + 1}`, source: `TURN ${index + 1}`, tokens: index === 43 ? 1189 : 1170 })),
    ],
    cache: { hitRate: 0.85, saved: 10.99, cachedTokens: 142_000, newTokens: 570 },
    session: { model: "Kestrel 2", turn: 48, name: "Ledger-v3 migration" },
  };
}
