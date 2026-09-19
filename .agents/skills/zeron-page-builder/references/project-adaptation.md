# Project adaptation

Use this reference when adapting installed files, business data, routes, permissions, localization, icons, or themes, and when deciding whether a capability belongs in the project or the Zeron library.

## Apply ownership per file

| Role | Typical contents | Default handling in a consumer project |
| --- | --- | --- |
| Managed | UI primitives, layouts, shared hooks, icon and surface systems, configurable block cores | Consume through public APIs; preserve the trusted installed baseline |
| Template | page-specific application structure, demo data, demo routes, placeholder actions | Adapt to the product; keep managed dependencies intact |
| Project | domain adapters, route modules, business compositions, application state | Modify according to project conventions and selected component contracts |
| Theme-owned region | installer-managed tokens or surface definitions inside shared CSS | Preserve the managed region; customize through the project's documented theme entrypoint |

Item classification and file ownership are different. A template may install managed Button, Select, hooks, or system files. Shared dependencies keep the strongest applicable managed role even when also referenced by a template.

In the Zeron source repository, an explicitly authorized primitive change is library work. Edit the canonical source and associated guide, tests, Registry metadata, and generated artifacts required by that repository.

## Port a template across frameworks

An incompatible Registry item must not be installed unchanged. A project-owned port can be appropriate when its editable template differs only in links, route entrypoints, fields or business wiring. First inspect the pinned Registry metadata, actual source, dependency closure and file ownership; item-level `template` metadata does not make its dependencies editable.

1. Prefer an available same-framework block or framework-independent public API. If the candidate relies on server components, server actions or another substantive framework capability, record the gap and use compatible official layout composition; do not describe that as direct block adoption.
2. Preserve the eligible template's downloaded source and release/hash as provenance. Identify only its editable business files and which imports must change. Do not change the item's framework metadata or add a fake Next dependency to defeat compatibility checks.
3. Use the supported installer to preview and install the compatible managed dependencies as separate Registry items at the pinned source. Inspect their entire closure, aliases, CSS and required packages. If any required dependency remains incompatible, stop this port and record the gap or choose another compatible composition.
4. Create adapted template files in a project-owned location, outside managed UI/data-block cores. Rewrite source/workspace imports to the actual installed consumer aliases, replace framework-only links/entrypoints, and connect the existing product flow. Keep applicable official layout, component and default styling responsibilities. Do not manually copy managed dependencies or edit install-state to claim the port is an official installation.
5. Remove unsupported demo actions and their unused dependencies. Keep existing validation, pending/error states, accessibility and outcomes. For example, an email login template adapted to username/password needs changes to names, types, autocomplete, validation and submission values, not just its visible label.
6. Record source release and source-file hashes, port paths, changed framework imports/dependencies, business differences and verification. Verify the port's consumer build and interaction; keep managed dependency provenance separate from the intentionally edited template. Do not put the port under an unchanged-managed-file baseline.

For a Next login template whose only framework import is `next/link`, a Vite port may install compatible `AuthLayout`, `Card`, `Field` and its other required public dependencies, then adapt only the template source. Use the project's router or ordinary links as appropriate. Remove unsupported social login, signup and legal links rather than creating product features or dead destinations. If the examined release has additional framework requirements, reassess instead of applying this example mechanically.

## Adapt in this order

1. Existing props, variants, sizes, controlled state, and events.
2. Documented children, slots, render functions, or data interfaces.
3. Project-side data, route, permission, localization, and state adapters.
4. Project-owned business composition that continues to use managed components.
5. Public theme, token, icon, and font configuration.
6. A documented capability gap and the smallest project or library change that resolves it.

Verify that every extension point exists in the installed types or source. Do not infer a generic `asChild`, slot, render prop, or class contract from another component.

Avoid a universal wrapper around all Zeron components. A wrapper is useful when it represents a repeated business concept or connects a project framework; otherwise it obscures the public API and creates an extra styling layer.

During migration, a temporary old-API adapter needs a caller inventory, remaining blocker, target Zeron API and exit condition. Full migration removes wrappers whose only role is retaining an old design system's generic props, variants or interactions. A domain-specific filter or router-aware header can remain. A headless data/state engine can remain when needed, but does not justify recreating an existing Table, Stepper or Select interface.

Adapter correctness includes rendered structure and styling. In particular, forwarding an old `icon` node next to text in Zeron Button children can nest both inside its label and stack them. Follow the [control composition rules](control-composition.md) and verify the affected callers in-browser; matching events and TypeScript types is insufficient.

## Data and business behavior

Replace sample data and no-op handlers with the requested behavior. For a block, identify its supported integration mode before editing:

- Use the documented data source, record, field, callback, or controlled-state contract.
- Respect mutually exclusive modes and required stable identifiers.
- Preserve loading, empty, error, disabled, permission, pagination, and retry behavior.
- Do not modify an internal mock array and call the backend connected.
- Do not claim authentication, billing, analytics, or live data is complete without exercising the actual integration.

Business compositions are expected. For example, an `OrderFilters` component may combine Input, Select, and Button with URL query state. It remains project-owned because its purpose and behavior are domain-specific. Recreating Select's keyboard behavior, Button variants, or DataTable mechanics would duplicate managed primitives.

## Styling boundaries

Use the selected component's own agent guide when available. Common principles are:

### Usually appropriate

- Width, flex behavior, alignment, or placement explicitly intended for the component's outer box.
- Local content layout using existing spacing scales.
- A documented size, density, variant, side, alignment, or column-width prop.
- Scoped styles for a project-specific visualization or domain composition.
- Central theme and semantic-token mappings through supported entrypoints.

### Requires a component-specific contract or library change

- Replacing semantic colors, focus rings, disabled opacity, loading structure, or press and hover feedback.
- Rebuilding a component's height and padding instead of using its size API.
- Styling internal `data-slot` nodes from global or ancestor selectors.
- Adding `!important` to win against managed states.
- Recreating portal positioning, collision handling, selection markers, or motion at each use site.
- Establishing a second palette, shadow, radius, spacing, or icon system for the same Zeron area.

Do not ban all `className`, inline style, native elements, or Tailwind arbitrary values. Some layout APIs intentionally accept concrete dimensions. Judge the property against the component's responsibility and documented customization surface.

Trace remaining CSS to actual callers, including old authentication panels, headers, navigation and surfaces. Remove unused old rules; document the responsibility of retained visualization, terminal and domain styles. Absence of old package prefixes does not prove the old visual system is gone.

## Theme and icon adaptation

Use semantic tokens rather than fixed visual values when the token expresses the purpose. Keep foreground and background state pairs together, including hover, active, disabled, and dark mode. Do not duplicate the repository's brand-contrast derivation in project code.

Use the installed IconProvider and named icon slots for library controls. Replace project-specific content icons through the provider or documented component prop. Do not introduce paid icon definitions without the user's explicit choice and credentials.

During replacement, old icon sizes, stroke values, control dimensions and visual classes do not take precedence over Zeron. Apply the [control/icon geometry rules](control-composition.md#zeron-owns-migrated-control-and-icon-geometry): remove legacy overrides, honor slot-supplied props and verify computed styles at the selected Zeron size. Preserve intrinsic artwork geometry and documented business-layout needs separately from old control styling.

When Zeron coexists with another theme, define the intended scope and inspect:

- token and reset collisions;
- root and provider placement;
- overlays rendered through portals;
- typography and font loading;
- dark-mode selector behavior;
- which shared CSS regions are installer-managed.

## Capability gaps and exceptions

Record a real gap only when the public API cannot express the requested behavior. State:

- the requirement;
- components and version examined;
- why their public extension points do not fit;
- the smallest project implementation or canonical library change;
- verification and maintenance impact.

If the user explicitly chooses a consumer fork, record the exact files, trusted baseline or provenance, reason, and maintenance owner. Do not add an exception, update a baseline, or relabel a managed file merely to remove a diagnostic.

When a missing decision changes the product architecture or authorizes a broader library migration, finish independent work and ask for that decision with concrete options and impact. Routine business adapters and changes already authorized by the task do not require another confirmation.
