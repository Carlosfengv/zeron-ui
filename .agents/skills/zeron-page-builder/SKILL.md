---
name: zeron-page-builder
description: Create or adapt working product pages with Zeron blocks, layouts, and components. Use for page implementation and integration in projects that use Zeron, or when the user explicitly asks to introduce it. Preserve component contracts while adapting business data, routes, and themes. Skip unrelated design critique and projects whose chosen design system excludes Zeron.
---

# Zeron Page Builder

Deliver the requested working page or change. Preserve the user's scope, product behavior, stack, routes, and explicit visual direction. Make routine implementation choices without asking again for decisions already supplied.

For an explicit migration of an existing design system, use the paired [Swap to Zeron UI](../swap-to-zeronui/SKILL.md) workflow when available. It owns scope, inventory, cleanup and completion evidence; this skill supplies component contracts. Full migration may replace the existing shell/theme implementation while preserving navigation and business behavior. Ordinary page work still preserves the host shell.

## Ground the work

Read the target project's instructions and relevant implementation. Identify:

- whether this is the Zeron source repository or a consumer project;
- the affected page or integration area, existing shell, theme, and providers;
- framework, React/Tailwind compatibility, component aliases, and installed files;
- the component source or release when available, plus unresolved provenance or conflicts.

Read [Zeron integration](references/zeron-integration.md) when resolving installation, imports, versions, or consumer compatibility. Preserve the project's package manager and conventions. Do not introduce Zeron into an unrelated design system without the user's direction.

Discover components from the current source catalogs or the consumer's matching Registry release. Use the installed version's public exports and types to verify APIs. Do not infer consumer imports from workspace examples or assume the newest guide describes an older installation.

When design lint is configured, read its active component contracts and file scope before choosing styling overrides. Use the installed component API to interpret those policies; a linter's suggested prop or token is not proof that it exists or fits the product intent.

If a matching guide is unavailable, inspect the actual source and applicable shared rules. Continue work that can be grounded safely and identify missing evidence. Resolve unknown file ownership before replacing existing files.

## Model and select

Establish the primary task, page archetype, content hierarchy, navigation scope, relevant states, and responsive behavior. Keep this proportional to the requested change; a small edit does not require a separate planning artifact.

Read [Selection guide](references/selection-guide.md) when choosing blocks and components. Preserve the host shell for ordinary page work and outside a scoped migration; for an authorized full migration, reassess it against Zeron's layout contracts. For standard resource lists, prefer the component-level structure below. For other semantic regions, select in this order:

1. A block whose core task, information structure, and public integration points fit.
2. Appropriate page layouts and semantic components for the remaining regions.
3. Project-owned business compositions that connect those components to domain behavior.

A business composition may reuse several existing components without representing a library gap. Reimplementing an existing primitive's appearance and interactions requires a different justification.

For standard resource lists, follow the [resource-list structure contract](references/resource-list-structure.md). Public page/DataTable composition is a first choice; no named block or rejection rationale is required. Embedded lists reuse the host layout and apply only the relevant table/toolbar rules.

For migration, record the region's required states, candidate source/version, integration fit, adoption and any concrete reason for rejecting a matching block. Different business fields or text usually call for adaptation. Do not introduce demo-only product capabilities to fit a block.

Read the selected items' agent guides where available. Compare template and configurable data-block capabilities before editing. Use source types to verify every proposed prop, slot, render function, and callback.

For chart work, follow [Chart selection and migration](references/charts.md): use shadcn Chart / Recharts compositions through Zeron Chart, preserving data and required interactions within installed public APIs.

## Respect layout ownership

Read [Composition contracts](references/composition-contracts.md) when building or changing page structure.

For list/detail headers, read [Page header contracts](references/page-header-contracts.md). Select path, title/summary, navigation and action owners explicitly; respect title/description grouping and the installed layout's slots rather than recreating a generic header.

- Use the scope-appropriate host or one suitable `AppShell` for the application region; avoid adding a second shell when a selected block already owns it.
- Let page-layout components own their documented width, gutter, header, content, and column behavior.
- Use `Container` for a cohesive surface region when needed; it is not a required wrapper for every page.
- Preserve direct DOM-child relationships required by layout selectors. Check what wrappers actually render.
- Identify which region owns scrolling and where height is constrained. Verify intentional nested scroll areas.
- Use ordinary elements for content arrangement where no semantic layout component is needed.

## Adapt within public boundaries

Read [Project adaptation](references/project-adaptation.md) when connecting business behavior, changing templates or themes, or handling a capability gap.

For migrated controls, follow [Control composition and visual acceptance](references/control-composition.md): use public icon slots, remove legacy geometry overrides and verify rendered alignment and state styling. Working callbacks do not establish correct presentation.

In consumer projects, preserve managed UI, layout, and shared-system implementations. Adapt through existing props and slots, controlled state, data and route adapters, business compositions, and documented theme or icon providers. Do not assume every component exposes the same extension points.

Template business files can be edited for the product; their managed dependencies remain protected. Apply ownership per file, including shared dependencies. For a cross-framework template, follow [template porting](references/project-adaptation.md#port-a-template-across-frameworks); a port is project-owned adaptation, not proof that the original block supports that framework. In the source repository, user-authorized library changes belong in canonical sources and their associated contracts and Registry artifacts.

Use `className` or `style` only within the selected component's customization contract. External layout adjustments and scoped business styles can be appropriate. Preserve internal semantic colors, focus, disabled and loading behavior, interaction feedback, and surface relationships. Use the library's existing token and spacing systems.

When replacing old UI, Zeron's public size/variant and icon-slot rules take precedence over legacy styling. Retain only justified product customization within public boundaries, and inspect remaining consumers before removing shared CSS. Detailed geometry and adapter rules live in the control reference above.

Use `border-hairline` and its directional forms for intentional 0.5px dividers. Keep ordinary control borders and focus indicators at their component-defined width. For CSS transitions, use the semantic `duration-fast`, `duration-moderate`, or `duration-slow` tier and the corresponding `*-exit` tier when the exit is shorter. A duration class still needs a transition property or an animation utility. Preserve existing JavaScript spring ownership, and use `motion-reduce:*` when a nonessential CSS animation should stop.

For a consumer install, use the verified Zeron CLI and the project's actual aliases. Inspect the plan when files, dependencies, or theme changes are material. Installation conflicts need a concrete resolution; do not silently overwrite, duplicate a primitive under a new name, or bypass required installation processing.

If public capabilities cannot satisfy the request, identify the attempted components, missing capability, and smallest viable business implementation or library change. Complete independent work. Ask only for a missing decision that changes scope or authorizes an otherwise unapproved action; do not turn routine adapters into approval gates.

Replace demo data and actions with the requested integration. If external services or credentials are unavailable, expose that remaining boundary accurately rather than presenting mocks as completed business behavior.

## Verify and hand off

Read [Verification](references/verification.md) before selecting checks. Discover which verification commands actually exist; do not assume a proposed CLI checker or MCP is installed.

Use the [design-lint feedback loop](references/verification.md#design-lint-feedback-loop) when the target project has Zeron design lint. Check the affected files, repair task-introduced violations through public APIs and semantic tokens, then recheck. Keep pre-existing findings separate and retain runtime verification; a clean static check does not establish correct layout or interaction.

Review the diff for changes to managed files, duplicated primitives, internal style overrides, and changes outside the requested scope. Run available usage checks and the narrowest meaningful type, build, or interaction checks. When the page can run, exercise the primary flow and relevant states at representative narrow and wide widths.

In the source repository, regenerate Registry artifacts when canonical Registry content changes. In consumer projects, verify installed paths and dependencies rather than relying on the source repository's successful build.

Report installation/provenance, functional regression, design contracts and browser findings separately, including scope and uncovered states. An installed but unused dependency is not itself a violation; an unfulfilled region-selection decision is. A missing baseline or unavailable browser is not a passing result. Do not reset component baselines or add policy exceptions to make checks pass.

Hand off the selected layout and components with reasons, business adaptations, changed files, verification evidence, and any capability or external-integration gaps. Keep the handoff concise and proportional to the task.
