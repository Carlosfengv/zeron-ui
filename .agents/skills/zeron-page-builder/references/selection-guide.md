# Selection guide

Use this reference after discovering the current catalog and actual component release. Names below describe established Zeron concepts; verify availability before importing or installing them.

## Start with the host and task

Preserve the surrounding application's shell, routing, data flow, and theme. Determine whether the requested change is a full application region, a page inside an existing shell, or an embedded section.

| Need | Start with | Common supporting pieces |
| --- | --- | --- |
| Multi-section workspace without an existing shell | `AppShell` with `Sidebar` | `NavMenu`, `NavItem`, `PageLayout`, mobile drawer behavior |
| Lightweight product with a few peer destinations | stacked `AppShell` with `TopNav` | `NavMenu`, `PageLayout`, search, cards, badges |
| Detail or inspection page inside a host | `PageLayout` | breadcrumb, content header, tabs, detail lists, optional aside |
| Searchable inventory | matching list block or `DataTable` | filters, input, badges, selection, row actions, pagination |
| Dense editable dataset | `DataGrid` | toolbar, search, validation, selection, pinned columns |
| Operational overview | matching dashboard or metrics block | metric cards, charts, status summaries, resource lists |
| Settings | matching settings block or `PageLayout` | local navigation, field controls, save and error feedback |
| Ordered setup | matching form block or `Stepper` | fields, validation, review, toast |
| Catalog or gallery | matching catalog block | search, filters, cards, badges, paging or progressive loading |
| Agent or chat experience | matching agent block | chat messages, composer, thinking states, trace or tool-call views |
| Authentication or focused standalone task | matching auth layout or block | fields, actions, alternate sign-in, errors |

Use no application shell for an embedded region, authentication, focused wizard, or page whose host already supplies it. Never nest two full application shells for the same region.

## Choose a resource page preset

First decide whether the request is a complete page or an embedded content region. Reuse the existing host shell in either case.

For a complete page, prefer an already matching full-page block when that block owns the required title, navigation, surface, and scrolling behavior. Otherwise select an available resource preset by the page's primary task:

- Start a generic resource-management page with responsive application navigation: `resource-list-page-01`.
- Browse, search, filter, or act on multiple objects: `ResourceListLayout`.
- Inspect one identified object: use `ResourceDetailLayout` only when the installed version exports it; otherwise compose the current `PageLayout` primitives.
- Add one object in a single-page form: use `ResourceCreateLayout` only when the installed version exports it; otherwise compose the current `PageLayout` primitives.

Do not import a planned preset that is absent from the installed version. Multi-step creation, authentication, master-detail workspaces, and embedded cards need their matching block or the base layout primitives instead.

After selecting a page preset, choose the list, detail, or form content and assign each visible region one owner. `ResourceListTable` owns its own toolbar and pagination. When placing it in `ResourceListLayout`, omit the layout's `toolbar` and `pagination`, use `surface="plain"`, and set `showCreateAction={false}` when the page header owns creation.

`resource-list-page-01` uses the standard Sidebar Basic shell and replaces its overview content with `ResourceListTable`. Do not place it inside another application shell. In an application that already has navigation, use `ResourceListLayout` or `ResourceListTable` directly instead.

## Decide whether a block fits

A block is a good starting point when its core user task, section hierarchy, responsive structure, and integration surface match the request. Visual similarity is insufficient.

- Adapt a block when domain content, fields, columns, data sources, callbacks, or secondary sections differ.
- Recompose from primitives when the block's main task, navigation model, or responsive structure conflicts with the requirement.
- Do not edit mock arrays inside a block and present that as a real data integration.

Check the Registry capability for the installed version:

- A `template` is an application starting point. Its project-specific business files may be edited, while installed primitives and shared systems remain managed.
- A `data-block` should expose a documented data or behavior contract. Use it only when that contract fits; do not reach inside to bypass it.
- This classification is at item level. Apply file ownership separately when dependencies are shared.

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
- `MetricCard` and charts: quantities that support a decision, not decorative dashboards.
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
