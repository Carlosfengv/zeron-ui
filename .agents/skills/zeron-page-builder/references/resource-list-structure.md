# Standard resource-list structure

Use this for a standard resource inventory with search, filters, row actions and pagination. The contract is expressed in public base components and responsibilities. It does not mandate a named block or page template. Domain columns, statuses, filters and create/edit forms remain project-owned; table mechanics, control styles and page layout use Zeron's public components.

Inspect the installed version's types and matching component guides before implementation. The structural outline below is not a set of new props, nor authorization to add CRUD capabilities the product does not support.

Apply the full page hierarchy only when the page layout is in scope. A list embedded in a dashboard, tab, dialog or existing page body reuses that host: apply the relevant toolbar/table/query rules without adding another PageLayout, header or scroll owner. Read-only lists do not need selection or mutations that the product lacks.

## Page hierarchy and ownership

```text
One existing or scope-authorized application shell
└─ PageLayout
   ├─ PageHeader
   │  ├─ PageHeaderContent: path-only content OR an explicit title/description text group
   │  └─ PageActions: optional page-level actions
   └─ PageContent
      ├─ PageContentHeader: optional peer Tabs or navigation
      └─ PageBody
         └─ DataTable, backed by useDataTable
            ├─ Toolbar: search + filters | refresh + create + other actions
            │  OR selection mode: selected count + clear | bulk actions
            ├─ Rows / loading / empty or error presentation
            └─ Built-in pagination
```

Follow [page header contracts](page-header-contracts.md#compose-the-list-header) for this choice. `PageHeaderContent` is a horizontal row; title and description need a text-group wrapper. Do not add a title to a path-only header or place table query controls in the page header merely to fill the outline.

- Reuse the existing host for scoped work. Full migration may replace it through public shell/navigation components, but never nest a second application shell around the list.
- Use `PageLayout` for page width/gutter, `PageHeader` for context, `PageContent` for the bordered content surface and `PageBody` for its vertical scrolling. Preserve their installed direct-child/slot contracts. Allow the list to use available content width through supported layout controls; do not copy old max-width, margin or padding systems.
- Keep optional headers optional. Add peer tabs only for real product views; do not invent a classification-management tab because an example contains one. Do not duplicate titles, breadcrumbs or creation buttons across headers and toolbar.
- On a full page the normal vertical scroll owner is `PageBody`; embedded regions retain their host's scroll contract. DataTable owns local horizontal overflow and pagination. Keep height constrained by the host and allow flex/grid children to shrink. Avoid extra fixed-height scroll wrappers and page-wide horizontal overflow. Preserve DataTable's built-in border/surface inside PageContent; the no-duplicate-frame rule forbids extra project Card/Container wrappers, not the components' own surfaces.
- Add `PageColumns > PagePrimary + PageAside` only for an actual master-detail task, preserving direct DOM children. On narrow screens, use a verified public drawer/detail pattern with focus return instead of squeezing an unreadable aside.

## Toolbar and base components

| Region | Public components and rules |
| --- | --- |
| Search | `InputGroup`, `InputGroupAddon`, `InputGroupInput`, or the installed `DataTableToolbar` text-filter support; one controlled search value and accessible label |
| Discrete filters | `DataTableFacetedFilter` bound to the appropriate column; single/multiple choice and clear/reset behavior follow the business model |
| Other filters | Verified public date/select/query components when the business needs them; do not force all domains into a fixed status/category model |
| Actions | `Button` and verified menu components; refresh and one create action where supported, with real handlers and permission behavior |
| Identity cell | `InfoItem` with appropriate leading/title/description pieces when needed; stable IDs separate from localized display names |
| Status cell | `Badge` using the domain's actual status meanings and Zeron semantics; do not coerce all statuses to an example's enum |
| Selection | `Checkbox` and table row-selection state; clear selection and selected count when bulk actions are available |
| Row actions | Public buttons/menus connected to edit, delete or navigation by stable resource ID; nested controls must not accidentally activate the row |

Use the installed `DataTableToolbar` when its column metadata and public API fit. Otherwise pass a project-owned toolbar as DataTable children, assembled from these primitives. There must be one toolbar owner, not a generated toolbar plus a duplicate custom search row. Normal toolbar: search/filters at the start, actions at the end; allow groups to reflow on small screens. Match control sizes and follow [control composition](control-composition.md) for icons, labels and legacy-style removal.

When rows are selected and the product supports bulk operations, use a deliberate selection mode in the same toolbar region: count and clear action at the start, permitted bulk actions at the end. Preserve search/filter state when switching modes and restore it on clearing. If using DataTable's public `actionBar` instead, verify its actual placement and avoid showing the same bulk actions twice.

Put creation in the toolbar by default. If the product requires a page-header create action, make it the sole create entry. A read-only or unauthorized view need not expose create/edit/delete merely to match the structure.

## Table, queries and pagination

Use `useDataTable` with domain `ColumnDef` definitions, then `DataTable` for rendering, loading/empty states, row activation and pagination. Do not reimplement table selection, sorting or pagination mechanics with ad hoc HTML. Verify public APIs; the current DataTable already renders its pagination region and accepts `paginationProps`, so adding a second `DataTablePagination` would duplicate it.

- Use a stable backend identifier in `getRowId`, not an array index or translated label. Keep column IDs stable independently from column captions. Define actual domain columns instead of mapping unrelated values into a template's fixed fields.
- For a complete client dataset, use local table filtering, sorting and pagination. For backend pagination, control the relevant state slices and callbacks, set `manualFiltering`, `manualSorting` and `manualPagination` as appropriate to the actual server contract, and provide authoritative `rowCount` or the installed supported total mechanism. Never filter/sort just the fetched page and present it as a whole-dataset result.
- Preserve existing URL/query persistence, search semantics, sort order and page-size behavior. Reset/clamp pagination appropriately when filters, sorting, page size or mutations change the valid result range. Use authoritative remote facet options when required; do not derive a supposedly complete option list from one fetched page.
- Keep async query responses scoped to the current filters and workspace; cancel or ignore stale responses so old results do not overwrite newer ones.
- Define whether selection means current page, explicitly selected IDs across pages, or all matching records. A current-page select-all checkbox must not imply server-wide selection. In server mode, do not assume the table's current row model contains selected records on other pages; retain required IDs/data in the domain layer. Clear or reconcile selection on workspace/permission changes and after mutations according to the existing product contract.

## Create, edit, delete and refresh

These are business integrations attached to the standard components, not built-in backend operations. Do not invent props such as `DataTable.onDelete` or consider a demo-local mutation a completed integration.

- Create opens the existing or authorized form/route; edit targets the exact resource. Use public form/dialog/drawer/page components according to task complexity, preserving validation, permissions and submission values.
- Delete and bulk delete use the existing confirmation policy, show which IDs/count are affected, and invoke real mutations. Respect per-row authorization; selection does not grant permission to delete every selected row.
- Show pending state and prevent duplicate submission. Retain form input/selection and display actionable errors when a request fails; do not report success or remove rows permanently before success. If using an existing optimistic flow, preserve its rollback semantics.
- On success, invalidate/refetch the relevant query or apply a verified cache update, reconcile selection and pagination, and retain appropriate filters and route context. Handle deleting the last row of the last page without leaving an invalid page index.
- Refresh reloads the current query, respecting loading and error state. Distinguish initial loading, empty inventory, no matches, failure/retry and refreshing with existing rows. DataTable's `emptyState` applies only when no rows exist; use a public notice for an error alongside retained rows rather than hiding it behind a nonexistent generic error prop.

## Migration evidence and acceptance

Record region ownership, chosen components, columns/IDs, query mode and totals, selection scope, CRUD/permission mappings, retained URL state and evidence under the existing migration mapping IDs. Component composition satisfying this contract is a valid implementation, not an exception for failing to use a particular block.

Verify on representative data and states:

- One scope-appropriate host, toolbar, creation entry (when applicable) and pagination region; no duplicate page layout, extra surface wrappers or vertical scroll owners. Built-in page and table surfaces may coexist.
- Search/filter/sort changes reach the correct data source; total counts and pagination remain correct across zero results, retries and mutations.
- Stable selection and correct row/bulk action targets after filtering, paging, refresh and workspace changes; unauthorized operations remain unavailable.
- Create/edit/delete flows preserve validation, pending, failure and success behavior. Mocked tests and real-backend checks are reported separately.
- Narrow/wide layouts, long localized labels, many columns, header/body alignment, keyboard focus and overlays; icon buttons stay correctly composed and no old control sizing/styles override Zeron.

Failed structure, data semantics or interaction checks prevent complete migration even when the page compiles. Missing browser/backend coverage remains explicitly unchecked. Adapt the structure for a nonstandard task only with a concrete product requirement; never silently drop columns or actions to fit a sample.
