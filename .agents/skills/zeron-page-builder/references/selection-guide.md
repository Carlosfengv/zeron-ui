# Selection guide

Use this reference after discovering the current catalog and actual component release. Names below describe established Zeron concepts; verify availability before importing or installing them.

## Start with the host and task

Preserve routing, data flow and explicit product constraints. Determine whether this is ordinary page work, a scoped migration or a full design-system migration. Preserve the surrounding shell/theme for ordinary work and outside a scoped migration. For full migration, reassess the shell/theme against Zeron contracts instead of preserving the old implementation by default.

| Need | Start with | Common supporting pieces |
| --- | --- | --- |
| Multi-section workspace without an existing shell | `AppShell` with `Sidebar` | `NavMenu`, `NavItem`, `PageLayout`, mobile drawer behavior |
| Lightweight product with a few peer destinations | stacked `AppShell` with `TopNav` | `NavMenu`, `PageLayout`, search, cards, badges |
| Detail or inspection page inside a host | `PageLayout` | breadcrumb, content header, tabs, detail lists, optional aside |
| Searchable inventory | `PageLayout` and `DataTable` under the resource-list structure contract | search, faceted filters, identity/status cells, selection, row actions, pagination |
| Dense editable dataset | `DataGrid` | toolbar, search, validation, selection, pinned columns |
| Operational overview | matching dashboard or metrics block | metric cards, charts, status summaries, resource lists |
| Settings | matching settings block or `PageLayout` | local navigation, field controls, save and error feedback |
| Ordered setup | matching form block or `Stepper` | fields, validation, review, toast |
| Catalog or gallery | matching catalog block | search, filters, cards, badges, paging or progressive loading |
| Agent or chat experience | matching agent block | chat messages, composer, thinking states, trace or tool-call views |
| Authentication or focused standalone task | matching auth layout or block | fields, actions, alternate sign-in, errors |

Use no application shell for an embedded region, authentication, focused wizard, or page whose host already supplies it. Never nest two full application shells for the same region.

## Choose a resource page structure

First decide whether the request is a complete page or an embedded content region. Reuse the selected host shell; replace an old shell only when the migration scope includes it.

Choose public layout and content components by the page's primary task:

- Browse, search, filter or manage multiple objects: follow the [resource-list structure contract](resource-list-structure.md). Full pages compose page header/content/body with DataTable, toolbar and pagination; embedded lists reuse the host layout. Add public navigation only when required by scope.
- Inspect one identified object: evaluate the installed `ResourceDetailLayout` and its public slots using the [detail header contract](page-header-contracts.md#compose-the-detail-header). If unavailable or incompatible, compose installed primitives with a recorded reason; keep path, record navigation, summary and tabs distinct.
- Add one object in a single-page form: use `ResourceCreateLayout` only when the installed version exports it; otherwise compose the current `PageLayout` primitives.

Do not import a planned preset that is absent from the installed version. Multi-step creation, authentication, master-detail workspaces, and embedded cards need their matching block or the base layout primitives instead.

Within the requested region, assign each responsibility one owner: page context and peer navigation when building a page, search/filter/actions with the table, one pagination region and a scope-appropriate scroll owner. A named list block is optional. Do not inherit an example's MCP/category tabs, fields, status enum or business actions unless they belong to the product.

## Decide whether a block fits

A block is a good starting point when its core user task, section hierarchy, responsive structure, and integration surface match the request. Visual similarity is insufficient.

- Adapt a block when domain content, fields, columns, data sources, callbacks, or secondary sections differ.
- Recompose from primitives when the block's main task, navigation model, or responsive structure conflicts with the requirement.
- Do not edit mock arrays inside a block and present that as a real data integration.

For migrations, keep one selection row per meaningful in-scope region (including account controls and important overlays), not per primitive. For a small ordinary edit, a concise rationale is sufficient.

| Region / mapping ID | Required capabilities and states | Candidate and pinned source/version | Framework / public API fit | Adoption | Rejection reason or gap | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| Account | Current user, language, sign-out, pending/error | Matching account block at target release | Verify user data, controlled locale, callbacks and navigation context | Public API integration | None if compatible | Actual identity, switch, failure/retry and sign-out checks |

Prefer a matching block, then official layouts/semantic components, then project business composition. Content, field names or data-source differences normally need adaptation. Reject a candidate for a verified core-task mismatch, incompatible interaction model, missing extension point, substantive framework requirement or explicit user constraint; “easier to write ourselves” is not sufficient. A catalog with no matching block is also a valid finding when the inspected release and required capability are recorded.

For standard resource lists, the component-level contract above is the selection target. Choosing public page and DataTable components that satisfy it does not require proving a named block inadequate. Record the chosen structure and integration; retain the no-primitive-duplication and evidence requirements.

Record the region's target header/surface/scroll owners as part of adoption so final review can compare the decision with the rendered result. Do not add registration, social login, notifications or theme switching merely because a template includes them. Account placement follows the project's established navigation requirements; no universal corner or sidebar position is required.

Check the Registry capability for the installed version:

- A `template` is an application starting point. Its project-specific business files may be edited, while installed primitives and shared systems remain managed.
- A `data-block` should expose a documented data or behavior contract. Use it only when that contract fits; do not reach inside to bypass it.
- This classification is at item level. Apply file ownership separately when dependencies are shared.

For an eligible cross-framework template, follow [template porting](project-adaptation.md#port-a-template-across-frameworks). Do not treat a framework label as permission either to force-install its closure or to skip evaluation of reusable official structure.

When combining blocks, choose one structural owner. Remove duplicate shells, titles, breadcrumbs, toolbars, and scroll containers. Reuse the secondary block's public content region or rebuild that region from its public dependencies.

## Choose components by semantics

- `Card`: grouped content with a coherent boundary, not every section.
- `Container`: one cohesive raised work area with a floating body, not a general page-layout wrapper.
- `Tabs`: a small set of peer views that preserve page context, not sequential progress.
- `Stepper`: ordered work with progress, validation, or completion.
- `Dialog`: a short interrupting task; use a route or page for complex, linkable work.
- `Popover`: compact contextual content anchored to a control.
- `Dropdown`: contextual commands or choices, not a persistent form value.
- `Select`: one value from a finite, preloaded set.
- `Combobox`: searchable, remote, large, or createable option sets.
- `RadioGroup`: a small set of visible alternatives where comparison matters.
- `Switch`: an immediate boolean setting.
- `DataTable`: structured records with sorting, filtering, selection, or pagination.
- `Table`: mostly static tabular presentation.
- `DataGrid`: spreadsheet-like editing, range selection, or very large datasets.
- `DetailList` and `InfoItem`: label-value facts and inspection metadata.
- `MetricCard` and charts: quantities that support a decision, not decorative dashboards. For chart selection, use the [chart rules](charts.md): prefer shadcn Chart / Recharts compositions through Zeron Chart, mapped to the existing data and interaction requirements.
- `InlineNotice`, alert, and toast: contextual guidance, prominent status, and transient confirmation respectively.
- `Badge`: compact status or category; critical meaning requires more than color.
- `Button`: an immediate action. Choose its variant by intent and priority.

Read a selected component's matching agent guide when available. In the Zeron source repository these live under `docs/agent-guides/components` and `docs/agent-guides/blocks`. The source and exported types remain authoritative for exact APIs.

## Business composition versus primitive duplication

A project-owned component is appropriate when it binds Zeron components to one domain concept or project framework. Examples include an order filter toolbar, an account permissions form, or a route-aware resource header.

It is likely duplicating a primitive when it recreates an existing component's interaction mechanics, variants, focus behavior, loading state, portal behavior, or token palette. A similar name or use of a native element is only a signal; inspect responsibility and behavior before deciding.

If the catalog lacks a reusable capability, record the requirement, components considered, missing public extension point, and the smallest viable project implementation or library change. Do not invent a prop or internal selector to make a component appear to support it.

## Composition quality checks

Before considering the page complete, confirm that:

- one primary task and dominant content region are apparent;
- navigation, page title, toolbar, filters, content, and pagination follow a coherent order;
- all visible controls work or are intentionally disabled with a clear reason;
- loading, empty, error, permission, and overflow states match the task;
- mobile behavior and scroll ownership were designed deliberately;
- repeated business patterns use shared project compositions;
- block demo content, fake logos, placeholder metrics, and no-op actions were replaced or clearly identified as remaining integration work.
