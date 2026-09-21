# Composition contracts

Use this reference when adding or changing application shells, page structure, columns, navigation, surfaces, or scrolling. Verify exact exports against the installed version.

## Layout ownership

| Component family | Owns | Avoid |
| --- | --- | --- |
| `AppShell` | application shell layout, sidebar or stacked tracks, header and main landmarks | adding a second shell inside the same application region |
| `PageLayout` | page width, outer gutter, local sidebar/content relationship | duplicating its padding or breaking its direct-child structure |
| page headers | title, description, contextual actions at the correct page level | placing action controls inside navigation landmarks |
| `PageContent` and `PageBody` | content surface and page-body scrolling | arbitrary extra scroll containers without height ownership |
| `PageColumns` | primary and auxiliary columns and their responsive switch | recreating the same grid with local CSS when its API fits |
| `Container` | a cohesive raised work surface with header, body, and footer | treating every page or section as a required container |
| `Sidebar`, `TopNav`, `NavMenu` | navigation interaction, state, density, and responsive behavior | recreating navigation interaction or dropping required context |

These responsibilities guide selection; they are not a mandatory nesting template. Ordinary `div`, `section`, and stack or grid classes remain appropriate for local content arrangement that no semantic Zeron layout owns.

## AppShell

`AppShell` supports sidebar and stacked application layouts. Its child components represent the sidebar, header, and main region. Use one shell for one application region; preserve an existing host for ordinary work, or replace it when authorized by full migration scope.

The current source uses direct-child `data-slot` selectors to place header, main, and sidebar tracks. A real DOM wrapper between the shell and these parts can change the layout. A React Fragment does not create a DOM node, so judge the rendered structure rather than JSX indentation alone.

Keep the main landmark for a real application shell. Use the public landmark escape hatch only when the shell is deliberately embedded in another document landmark, such as a preview.

Do not infer mobile navigation solely from a desktop sidebar width. Check the installed Sidebar's responsive and off-canvas contract and the host's provider setup.

## PageLayout

Use `PageLayout` inside the shell or host page region. Current public controls include:

- `size`: page maximum width choices;
- `gutter`: standard outer gutter or none;
- `PageSidebar.width`: local sidebar track width;
- `PageColumns.asideWidth`: auxiliary column width;
- `PageColumns.columnsAt`: responsive column breakpoint;
- `PageSubnavList.labelVisibility`: full or active-only labels where icons support the collapsed state.

Use the public controls instead of duplicating the same page max-width, padding, or column grid. A specific `asideWidth` is an intended layout value, not automatically a design-token violation.

`PageLayout` detects `PageSidebar` and `PageContent` through direct-child slots. `PageColumns` similarly expects `PagePrimary` and `PageAside` as direct rendered children for its column selectors. Avoid extra DOM wrappers around these structural parts.

Choose the correct header level using the shared [list/detail header contracts](page-header-contracts.md):

- `PageHeader` holds outer page context: path/navigation or the page title group and actions, according to the selected structure. A detail layout may own the resource title in an inner summary instead.
- `PageContentHeader` holds controls or navigation belonging to the content surface.
- `PageSubnav` remains a navigation landmark; sibling actions belong in `PageActions` rather than inside it.

The header reference defines `PageHeaderContent` text grouping, `PageTitle` styling behavior, detail-layout slots and acceptance checks. Do not flatten a detail summary into a list header or add another header around an existing owner.

## Resource list pages

Follow the [resource-list structure contract](resource-list-structure.md), which specifies public components and ownership rather than a required named block/page.

- Keep context in `PageHeader`, peer navigation in an optional `PageContentHeader`, and the table region in `PageContent > PageBody`.
- Keep one application shell and one page-body vertical scroll owner; DataTable owns local horizontal table overflow and its built-in pagination.
- Supply one standard or selection-mode toolbar through DataTable's public composition. Do not duplicate search, filtering, selection actions or pagination at the page level.
- Use one create entry point and no extra project Card/Container frame around a table already inside `PageContent`; preserve the installed DataTable's own border and surface.
- For actual master-detail requirements, use `PageColumns` with direct `PagePrimary`/`PageAside` children and an appropriate mobile detail presentation. A normal list does not need an empty aside or demo tabs.

## Container and surfaces

`Container` is a surface component for one cohesive area of work. Its raised frame can hold a header and footer while the body provides a floating, scrollable content surface. It does not replace `PageLayout`, `PageContent`, or ordinary grouping.

Use `ContainerBody.maxHeight` only when a content-driven body needs a vertical cap. A max height creates a deliberate nested scrolling area, which must remain usable with keyboard navigation and at narrow widths.

Preserve surface nesting and tokens. Do not replace raised or floating roles with arbitrary background and shadow classes at each use site.

## Scroll and height ownership

Before adding `overflow-*`, identify:

1. the ancestor that provides a bounded height;
2. the region that should remain fixed;
3. the one region expected to scroll;
4. whether a nested data grid, log viewer, or popover intentionally owns another scroll area.

Use `min-h-0` and `min-w-0` where the established layout needs children to shrink, but retain the component's existing constraints. Test long content, a short viewport, and narrow width. Accidental nested scrollbars, clipped focus rings, and page-wide horizontal overflow are failures.

## Responsive and accessibility checks

- Verify narrow and wide layouts using actual representative widths.
- Check long localized labels and page titles, sparse and dense content, and large values.
- Preserve header, navigation, main, and aside semantics.
- Keep keyboard focus visible and controls reachable after stacking or overflow changes.
- Verify touch targets and off-canvas navigation where applicable.
- Confirm overlays use the correct portal and theme context and remain visible above surfaces.

Use browser evidence when available. Source inspection alone cannot prove computed layout, portal placement, or interaction behavior.

## Check selection against the rendered page

For each selected region, record its public layout components, direct DOM-child/slot relationship, bounded-height ancestor and intended vertical/horizontal scroll owner. Compare those decisions with the final DOM and computed layout at representative widths, including long content and short viewports. If a matching block already owns these responsibilities, reuse its structure instead of wrapping it in a second page layout.

| Case | Contract judgment |
| --- | --- |
| Plan selects `PageLayout` for a workspace, but only `AppShellMain` padding/overflow is used and there is no justified alternative | Failed adoption; installation or import presence is not sufficient. |
| `PageLayout` is installed transitively but the route correctly uses an auth layout | No violation from unused installation alone. |
| A route-aware project header wraps official header/title/actions and adds domain breadcrumbs | Valid business/framework composition if rendered structure and styling obey the installed contract. |
| A DOM wrapper separates compound parts needed by a direct-child selector | Failed structure even if JSX includes the expected names; a Fragment alone adds no DOM wrapper. |
| Page body owns vertical scrolling while a table owns horizontal overflow | Valid when height constraints, keyboard access and narrow layout are verified. |

Authentication, independent terminals and immersive workspaces can have different layout owners. Do not require every route to render `PageLayout`; fail an unfulfilled selection or actual contract violation, not a component-count heuristic.
