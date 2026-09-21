---
name: swap-to-zeronui
description: Migrate an existing React application's UI to Zeron while preserving business behavior. Use for requests such as swap to zeronui, replace the design system, or 全部替换为 Zeron UI. Supports scoped migrations and reports gaps; use zeron-page-builder for ordinary new pages.
---

# Swap to Zeron UI

Migrate the user's specified application region and prove what was replaced. Preserve routes, data, permissions, validation and product behavior. Establish the mode from the request: scoped migration replaces only the agreed region; full design-system migration prefers Zeron structure, interactions and styling over old UI implementations, including the shell and theme. Neither authorizes framework upgrades, business redesign, publication or unrelated changes.

Read [scope and completion](references/scope-and-completion.md) first. Use the paired [Zeron Page Builder](../zeron-page-builder/SKILL.md) for component selection, public APIs and layout contracts. Both skill directories must be distributed together. If the paired skill is missing, locate it; do not invent its contracts or silently use a different design system.

## Establish the migration

- Inspect project instructions, current edits, actual installed React/Tailwind versions, framework, aliases, theme, providers and existing component sources. Target React 19 and Tailwind 4. Do not install Next-only blocks into Vite; evaluate eligible template porting through the builder's [project adaptation](../zeron-page-builder/references/project-adaptation.md#port-a-template-across-frameworks) procedure.
- Freeze the target routes/files and the impact on shared consumers. For Vite, explicitly discover the router; entry files alone do not establish route coverage.
- Record baseline checks and representative screenshots before editing. Preserve pre-existing changes and failures.
- Pin CLI and Registry sources. A hash of an arbitrary existing component is not an official baseline.
- Create `.zeron/migrations/<id>/plan.json` using the [plan schema](assets/migration-plan.schema.json). Read [inventory and mapping](references/inventory-and-mapping.md) for its operational fields and scan/check semantics. Missing evidence remains unchecked.

## Map and migrate

Read [migration workflow](references/migration-workflow.md) before writes. For shadcn-style sources, read the [source profile](references/source-profiles/shadcn.md), then verify local modifications and installed target APIs.

Select by semantic region before mapping individual controls. Follow the builder's [selection guide](../zeron-page-builder/references/selection-guide.md) and record candidates, pinned source, public API fit, adoption and reasons for rejecting a matching block. Classify each task as direct, adapt, compose or gap. Trace all callers, including re-exports and shared wrappers. Preserve real integrations; do not replace them with block demos or add unsupported product features. Inspect hidden states and overlays as well as visible pages.

For standard resource lists, follow the builder's [component-level structure contract](../zeron-page-builder/references/resource-list-structure.md). Public component composition is a first choice without a named-block requirement; embedded lists preserve their host.

For list/detail headers, apply the builder's [page header contracts](../zeron-page-builder/references/page-header-contracts.md). Record component sources and region owners, migrate legacy header wrappers through public composition, and verify the rendered header against the selected structure. A PageLayout import alone does not satisfy header adoption.

For in-scope charts, follow the builder's [chart rules](../zeron-page-builder/references/charts.md): prefer shadcn Chart / Recharts through Zeron Chart, record per-chart mappings, and preserve data and required interactions. Unsupported capabilities remain explicit gaps or accepted exceptions.

Reuse the supported installer and inspect the full dependency closure. A same-name file is not API compatibility. Resolve every conflict in a batch before using `--overwrite`; migrate affected callers with it. Public Zeron primitives remain managed; business adaptations belong in project compositions.

Follow dependency order in verifiable batches. Replace the old shell when requested while preserving navigation behavior. Keep one layout/scroll owner and verify portal theme context. Track callers and exit conditions for temporary old-API bridges; remove them before claiming complete migration. Retain project compositions for domain or framework responsibilities, not solely to preserve an old design system's generic API.

Apply the builder's [control composition rules](../zeron-page-builder/references/control-composition.md) during replacement: Zeron size/variant and icon slots take precedence over legacy geometry and styles; preserve only justified public customization and shared styles still needed outside scope.

Continue routine decisions already authorized by the task. Ask only for an unresolved product choice, broader scope or otherwise unauthorized action; finish independent work first. If capabilities are missing, record the exact requirement and smallest viable resolution without inventing props or silently dropping functionality.

## Verify and finish

Read [verification and recovery](references/verification-and-recovery.md). Re-scan after cleanup; inspect old imports, styles, providers, direct dependencies and shared consumers. Typecheck, build and exercise the affected business flows, narrow/wide layouts, keyboard focus and overlays.

Record installation/provenance, functional regression, design contracts and browser verification separately. Installed files and passing functional tests do not prove Zeron adoption. Verify selected layouts in the rendered DOM and review remaining CSS and adapters by responsibility. Use the [evidence procedure](references/verification-and-recovery.md#bind-reports-and-attachments) to bind reports and attachments without changing the plan schema.

Use the control reference's browser acceptance gate on replaced controls and shared-adapter callers. Unintended icon/text stacking, clipping or broken state styling fails acceptance; missing browser evidence stays unchecked.

Use scan/check only if the installed CLI exposes them. They are read-only aids, not migration engines or proofs of business equivalence. A passing static check never substitutes for runtime evidence. Unknown routes, unresolved references, missing provenance and stale checks prevent a complete result. Preserve original tool failures, including false positives; report manual findings separately.

Reconcile plan status, mapping states, scope-wide checks and report conclusions using the [completion reconciliation](references/verification-and-recovery.md#reconcile-completion) procedure. A reviewed subset cannot pass an entire migration's contract or cleanup gate. Remaining generic adapters and capability gaps must appear in plan mappings, not only report prose.

Deliver the [report](assets/report-template.md) with actual counts and one of: **complete and verified**, **migrated with accepted exceptions**, or **partial / awaiting verification**. Keep the result proportional to the task, link evidence and state remaining actions. Do not publish, deploy or claim a universal migration success rate.
