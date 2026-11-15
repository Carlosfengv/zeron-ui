---
schema_version: 1
name: decision-tree
kind: component
status: stable
locale: en
summary: A queue of agent decisions with branching options, flagged consequences, follow-up choices and custom instructions.
registry_import: "@/components/ui/decision-tree"
source: packages/ui/src/components/decision-tree.tsx
registry: packages/ui/registry.json
related: [ask-user-questions, alert, tooltip]
---

# DecisionTree

Use when a person must choose how an agent proceeds and needs to compare the consequences. Give every pending decision a stable `id`, a short `question`, `agent`, and two to four `options`. Add a `context`, `model`, or `risk` when it helps the user decide.

An option has a `label`, optional `effects`, `pick`, `icon`, and `apps`. Flag a consequence with `{ text, note, source? }`. Use `next: { question, options }` for one follow-up question. Mark one recommendation per question. `icon` and `apps` accept decorative React nodes.

`onChoose` is called after the final option is selected. It receives `{ index, option, then? }` or `{ other }`. A returned string is shown as the reply to a custom instruction. An exception or rejected promise keeps the decision available for retry. Successful decisions are removed from the local queue. New IDs append to it. Use `allowOther={false}` to hide free-text input. Pass `labels` and `title` for localization. Keyboard shortcuts operate while focus is within the tree.

```tsx
import { DecisionTree } from "@/components/ui/decision-tree";

export function ReleaseDecision() {
  return <DecisionTree decisions={[{
    id: "release-12", agent: "Release agent", risk: "medium",
    question: "How should we release version 12?",
    options: [
      { label: "Roll out to 10%", pick: true, effects: "Limits the initial impact" },
      { label: "Wait for review", effects: "Keeps the current version live" },
    ],
  }]} onChoose={(_, choice) => {
    if ("other" in choice) return "I received your instruction.";
  }} />;
}
```
