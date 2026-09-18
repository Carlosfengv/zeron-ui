---
name: swap-to-zeronui
description: Migrate an existing React application's UI to Zeron while preserving business behavior. Use for requests such as swap to zeronui, replace the design system, or 全部替换为 Zeron UI. Supports scoped migrations and reports gaps; use zeron-page-builder for ordinary new pages.
---

# Swap to Zeron UI

Migrate the user's specified application region and prove what was replaced. Preserve routes, data, permissions, validation and product behavior. Full migration allows replacing the existing shell and theme implementation; it does not authorize framework upgrades, business redesign, publication or unrelated changes.

Read [scope and completion](references/scope-and-completion.md) first. Use the paired [Zeron Page Builder](../zeron-page-builder/SKILL.md) for component selection, public APIs and layout contracts. Both skill directories must be distributed together. If the paired skill is missing, locate it; do not invent its contracts or silently use a different design system.

## Establish the migration

- Inspect project instructions, current edits, actual installed React/Tailwind versions, framework, aliases, theme, providers and existing component sources. Target React 19 and Tailwind 4; Next-only blocks cannot be used in Vite.
- Freeze the target routes/files and the impact on shared consumers. For Vite, explicitly discover the router; entry files alone do not establish route coverage.
- Record baseline checks and representative screenshots before editing. Preserve pre-existing changes and failures.
- Pin CLI and Registry sources. A hash of an arbitrary existing component is not an official baseline.
- Create `.zeron/migrations/<id>/plan.json` using the [plan schema](assets/migration-plan.schema.json). Read [inventory and mapping](references/inventory-and-mapping.md) for its operational fields and scan/check semantics. Missing evidence remains unchecked.

## Map and migrate

Read [migration workflow](references/migration-workflow.md) before writes. For shadcn-style sources, read the [source profile](references/source-profiles/shadcn.md), then verify local modifications and installed target APIs.

Classify each task as direct, adapt, compose or gap. Trace all callers, including re-exports and shared wrappers. Preserve real integrations; do not replace them with block demos. Inspect hidden states and overlays as well as visible pages.

Reuse the supported installer and inspect the full dependency closure. A same-name file is not API compatibility. Resolve every conflict in a batch before using `--overwrite`; migrate affected callers with it. Public Zeron primitives remain managed; business adaptations belong in project compositions.

Follow dependency order in verifiable batches. Replace the old shell when requested while preserving navigation behavior. Keep one layout/scroll owner and verify portal theme context. Track temporary bridges and remove them before claiming complete migration.

Continue routine decisions already authorized by the task. Ask only for an unresolved product choice, broader scope or otherwise unauthorized action; finish independent work first. If capabilities are missing, record the exact requirement and smallest viable resolution without inventing props or silently dropping functionality.

## Verify and finish

Read [verification and recovery](references/verification-and-recovery.md). Re-scan after cleanup; inspect old imports, styles, providers, direct dependencies and shared consumers. Typecheck, build and exercise the affected business flows, narrow/wide layouts, keyboard focus and overlays.

Use scan/check only if the installed CLI exposes them. They are read-only aids, not migration engines or proofs of business equivalence. A passing static check never substitutes for runtime evidence. Unknown routes, unresolved references, missing provenance and stale checks prevent a complete result.

Deliver the [report](assets/report-template.md) with actual counts and one of: **complete and verified**, **migrated with accepted exceptions**, or **partial / awaiting verification**. Keep the result proportional to the task, link evidence and state remaining actions. Do not publish, deploy or claim a universal migration success rate.
