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

`AppShell` supports sidebar and stacked application layouts. Its child components represent the sidebar, header, and main region. Use one shell for one application region and reuse an existing host shell when present.

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

Choose the correct header level:

- `PageHeader` holds page-level title, description, and actions.
- `PageContentHeader` holds controls or navigation belonging to the content surface.
- `PageSubnav` remains a navigation landmark; sibling actions belong in `PageActions` rather than inside it.

The current `PageTitle` applies a compact default style when no custom class is supplied and a heading style when a class is supplied. Inspect the installed version before styling it; do not add a class solely for positioning without considering that behavior.

## Resource list pages

`ResourceListLayout` is the complete-page preset for browsing and managing a collection. It composes `PageLayout` with one page header and one content surface. Its fixed order is title/actions, optional toolbar, scrolling summary and results, then optional caller-owned pagination.

For a copy-ready full application page, `resource-list-page-01` reuses the standard Sidebar Basic shell and places the `resource-list-table-01` data block in its overview `PageBody`. Use that Block when no existing application shell is present; do not nest it inside another shell.

- The host owns the application shell and bounded height; the preset does not create `AppShell`, `main`, or viewport height.
- The layout owns the single h1 and page-level actions. The result component must not add another page title or duplicate create action.
- The `toolbar` and `pagination` slots stay outside `PageBody`; `summary` and `children` scroll together inside it.
- A child that already owns a toolbar or pagination keeps those regions. Omit the matching layout slots instead of hiding duplicate controls with CSS.
- `ResourceListTable` uses `surface="plain"` inside this page surface and can set `showCreateAction={false}` when creation belongs in the page header.
- The default page width is `size="full"`, the default gutter is `default`, and the inner `PageBody` uses `max-w-[1620px]` with `p-3` and `gap-3`.

Use the base `PageLayout` family for unbounded document pages or for structures that do not match this ownership model.

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
