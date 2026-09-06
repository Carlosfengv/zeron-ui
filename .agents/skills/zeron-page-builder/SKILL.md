---
name: zeron-page-builder
description: Create or adapt working product pages with Zeron blocks, layouts, and components. Use for page implementation and integration in projects that use Zeron, or when the user explicitly asks to introduce it. Preserve component contracts while adapting business data, routes, and themes. Skip unrelated design critique and projects whose chosen design system excludes Zeron.
---

# Zeron Page Builder

Deliver the requested working page or change. Preserve the user's scope, product behavior, stack, routes, and explicit visual direction. Make routine implementation choices without asking again for decisions already supplied.

## Ground the work

Read the target project's instructions and relevant implementation. Identify:

- whether this is the Zeron source repository or a consumer project;
- the affected page or integration area, existing shell, theme, and providers;
- framework, React/Tailwind compatibility, component aliases, and installed files;
- the component source or release when available, plus unresolved provenance or conflicts.

Read [Zeron integration](references/zeron-integration.md) when resolving installation, imports, versions, or consumer compatibility. Preserve the project's package manager and conventions. Do not introduce Zeron into an unrelated design system without the user's direction.

Discover components from the current source catalogs or the consumer's matching Registry release. Use the installed version's public exports and types to verify APIs. Do not infer consumer imports from workspace examples or assume the newest guide describes an older installation.

If a matching guide is unavailable, inspect the actual source and applicable shared rules. Continue work that can be grounded safely and identify missing evidence. Resolve unknown file ownership before replacing existing files.

## Model and select

Establish the primary task, page archetype, content hierarchy, navigation scope, relevant states, and responsive behavior. Keep this proportional to the requested change; a small edit does not require a separate planning artifact.

Read [Selection guide](references/selection-guide.md) when choosing blocks and components. Preserve an existing host shell, then prefer:

1. A block whose core task, information structure, and public integration points fit.
2. Appropriate page layouts and semantic components for the remaining regions.
3. Project-owned business compositions that connect those components to domain behavior.

A business composition may reuse several existing components without representing a library gap. Reimplementing an existing primitive's appearance and interactions requires a different justification.

Read the selected items' agent guides where available. Compare template and configurable data-block capabilities before editing. Use source types to verify every proposed prop, slot, render function, and callback.

## Respect layout ownership

Read [Composition contracts](references/composition-contracts.md) when building or changing page structure.

- Use the existing shell or one suitable `AppShell` for the application region.
- Let page-layout components own their documented width, gutter, header, content, and column behavior.
- Use `Container` for a cohesive surface region when needed; it is not a required wrapper for every page.
- Preserve direct DOM-child relationships required by layout selectors. Check what wrappers actually render.
- Identify which region owns scrolling and where height is constrained. Verify intentional nested scroll areas.
- Use ordinary elements for content arrangement where no semantic layout component is needed.

## Adapt within public boundaries

Read [Project adaptation](references/project-adaptation.md) when connecting business behavior, changing templates or themes, or handling a capability gap.

In consumer projects, preserve managed UI, layout, and shared-system implementations. Adapt through existing props and slots, controlled state, data and route adapters, business compositions, and documented theme or icon providers. Do not assume every component exposes the same extension points.

Template business files can be edited for the product; their managed dependencies remain protected. Apply ownership per file, including shared dependencies. In the source repository, user-authorized library changes belong in canonical sources and their associated contracts and Registry artifacts.

Use `className` or `style` only within the selected component's customization contract. External layout adjustments and scoped business styles can be appropriate. Preserve internal semantic colors, focus, disabled and loading behavior, interaction feedback, and surface relationships. Use the library's existing token and spacing systems.

For a consumer install, use the verified Zeron CLI and the project's actual aliases. Inspect the plan when files, dependencies, or theme changes are material. Installation conflicts need a concrete resolution; do not silently overwrite, duplicate a primitive under a new name, or bypass required installation processing.

If public capabilities cannot satisfy the request, identify the attempted components, missing capability, and smallest viable business implementation or library change. Complete independent work. Ask only for a missing decision that changes scope or authorizes an otherwise unapproved action; do not turn routine adapters into approval gates.

Replace demo data and actions with the requested integration. If external services or credentials are unavailable, expose that remaining boundary accurately rather than presenting mocks as completed business behavior.

## Verify and hand off

Read [Verification](references/verification.md) before selecting checks. Discover which verification commands actually exist; do not assume a proposed CLI checker or MCP is installed.

Review the diff for changes to managed files, duplicated primitives, internal style overrides, and changes outside the requested scope. Run available usage checks and the narrowest meaningful type, build, or interaction checks. When the page can run, exercise the primary flow and relevant states at representative narrow and wide widths.

In the source repository, regenerate Registry artifacts when canonical Registry content changes. In consumer projects, verify installed paths and dependencies rather than relying on the source repository's successful build.

Report what passed, failed, or could not be checked, including the affected scope. A missing baseline or unavailable browser is not a passing result. Do not reset component baselines or add policy exceptions to make checks pass.

Hand off the selected layout and components with reasons, business adaptations, changed files, verification evidence, and any capability or external-integration gaps. Keep the handoff concise and proportional to the task.
