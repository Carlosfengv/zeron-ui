---
name: rule-flow-editor-01
type: data-block
framework: react
---

# Rule Flow Editor

Use this block to define a rule with one traffic trigger, one AND condition group, matched actions, a fixed unmatched exit, and exception-handling policies. It is a controlled business composition, not a general-purpose infinite canvas.

## Data contract

- `defaultRuleFlow` contains no sample business selection. Its trigger, conditions, matched actions, and exception-policy values are empty; the unmatched outcome is explicitly fixed to `{ behavior: "skip-rule" }`.
- Pass `value` and `onValueChange` when rule edits and card positions must be persisted.
- Supply `triggers`, `fields`, `operators`, `actions`, and `errorActions` from the product rule schema. Option values are stable business identifiers, not localized labels. Matched-action definitions may declare a `phase` and `select` or `input` fields. Exception definitions use `group`, `resultLabel`, `resultColor`, and the same field schema. All selected field values persist under `RuleFlowAction.config`.
- Conditions always use `conditionMatch: "all"`. The UI intentionally does not expose an AND/OR switch.
- Matched outcomes contain ordered actions. They render together in one card and use `SortableCollection`; drag order is persisted directly to `outcomes.matched`. The two fixed execution stages—before forwarding upstream and after receiving a response—sort independently so an action cannot cross an invalid runtime boundary. Exception policies render together in one non-sortable card and persist only configured values to `outcomes.error`. The unmatched outcome cannot contain actions and always ends without executing the rule.
- Business definition and `layout.nodePositions` are stored separately. Repositioning a card must not alter trigger, condition, or action semantics.
- The editor fills the width and bounded height of its parent. Give the parent an explicit or flex-owned height; taller or wider content scrolls inside the canvas.
- Use `readOnly` for inspection surfaces. It preserves the complete rule graph while hiding drag and mutation controls.

## Empty-state behavior

An empty rule renders the primary instructional skeleton first:

1. Choose a traffic trigger.
2. Add one or more blank AND conditions.
3. Configure and reorder matched actions inside one card in the left-aligned primary lane.
4. Show the fixed unmatched endpoint: “结束——不执行本规则.”

Exception handling is optional and hidden by default. The user can reveal it from the condition card; configured policy values always keep it visible directly to the right of the matched-action card with a fixed 24px gap. The unmatched endpoint stays in the far-right lane aligned horizontally with the condition card. One card groups `matched-result` policies above `execution-failure` policies. Its rows follow the condition/action one-line rhythm and are not sortable. In compact layouts the result cards stack as matched actions, exception handling, then unmatched.

Skeleton cards do not add values automatically. A newly added condition starts with empty field, operator, and value selections.

The default matched-action catalog mirrors the model-gateway rule form: reject the call, forward to an upstream, bypass intent recognition, inspect sensitive content, rate limit, rewrite request or response headers, map upstream failures to 502, and copy traffic to another gateway. The block intentionally leaves product-owned dropdown catalogs empty; inject their options through each action field instead of replacing the block controls.

Action parameters follow the same compact horizontal rhythm as condition rows: visible field label, 32px control, consistent gap, and a trailing remove action. Each action stays on one line and its controls share the available row width without changing parameter order.

Matched-action rows keep the canonical `SortableCollectionItem` surface, padding, alignment, drag handle, and state styles. Do not reach into the component with descendant selectors to restyle those item slots.

## Composition boundaries

The canvas and SVG connectors are block-owned visualization code. The primary connector attaches 24px from each card's left edge. In wide layouts, the unmatched connector is one horizontal line from the condition card's right-side midpoint to the unmatched card's left-side midpoint. The exception branch starts at the horizontal center of the condition card's bottom edge and approaches the exception card near its left edge with 90-degree turns. Cards, badges, buttons, selects, icons, focus treatments, surfaces, and shadows come from Zeron components and semantic tokens. Controls use the standard 32px `md` size. Card borders remain 0.5px and selected cards retain the floating surface fill.

Select popups render through a Portal. Keep `data-flow-control` on popup content so portaled pointer events cannot be captured by card dragging.

This release does not provide OR or nested condition groups, freehand edge creation, per-action error edges, zoom, minimaps, multi-selection, loops, or automatic graph layout. Preserve the `RuleFlowValue` boundary if a future release evaluates a dedicated graph engine.
