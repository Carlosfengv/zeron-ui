---
name: filter-rule-builder-01
type: data-block
framework: react
---

# Filter Rule Builder

Use this block for a compact filtering task where users need to review existing clauses, start from presets, draft one clause at a time, and explicitly apply the result. It is an embedded work surface and does not own an application shell or dialog.

## Data contract

- `fields` uses Zeron filter-core field definitions for text, number, select, multi-select, and boolean values. Supply stable field and option IDs. Add `color` for categorical rule accents and `unit` for number values.
- `value` and `onValueChange` provide controlled working state. `defaultValue` provides uncontrolled initial state. `onApply` is the persistence boundary and may return a promise; the block supplies its loading state and prevents duplicate submission.
- `presets` replace the complete working filter set. Preset clause IDs must be stable within the preset.
- `defaultDraft` opens one initial draft for a guided demo or known entry point. Draft state remains separate from `value` until the user selects Add rule.
- `onCancel` receives the most recently applied clauses after the block restores them. A successful `onApply` advances that restoration point.
- `labels` replaces visible copy and accessible action names. Functions receive counts, field labels, and numeric limits so localized messages remain specific.
- `resultCount` supplies the current matched-record total shown in the header; update it from the host query response when filters change.

## Behavior

- A draft requires a value. Number fields additionally enforce their declared minimum and maximum before insertion.
- Apply never silently drops a draft. The user must add or cancel it first.
- Read-only mode preserves presets and summaries while hiding mutation controls and the footer.
- `maxRules` prevents creating another draft after the limit is reached.
- Unknown clause field IDs remain in the data contract but do not render a misleading summary. Validate server-provided fields at the application boundary.

## Composition boundaries

`Container` owns the raised work surface, fixed header and footer, and capped scrolling body. Rule summaries use `Card` and `Badge`. Draft property and operator values use `Select`; multi-value fields use the multiple `Combobox` contract; number units use `InputGroup`. Actions use public `Button` variants and icon slots. Do not restyle control geometry, replace popup positioning, or add a second scroll owner around the body.

The default body height fits a viewport-hosted panel. Override `maxBodyHeight` when the host already provides a smaller bounded region, and verify popup visibility and keyboard reachability at that real height.
