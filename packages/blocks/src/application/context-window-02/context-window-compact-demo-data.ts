import type { ContextWindowData } from "../context-window-01/context-window-types";

/** Fixed reference snapshot. No model service is connected. */
export function createContextWindowCompactDemoData(): ContextWindowData {
  return {
    capacity: 200_000, systemTokens: 4200, toolTokens: 12_800,
    docs: [
      { id: "guide", title: "AGENTS.md", tokens: 6200 },
      { id: "tokens", title: "tokens.css", tokens: 12_400 },
      { id: "components", title: "Component library", tokens: 27_500 },
    ],
    history: [
      { id: "pinned", title: "Project instructions", tokens: 8600, pinned: true },
      { id: "conversation", title: "Current conversation", tokens: 100_000 },
    ],
    memory: [{ id: "preferences", title: "Project preferences", tokens: 3900 }],
    session: { model: "claude-sonnet", turn: 24, name: "Component design" },
  };
}
