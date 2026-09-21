# List and detail page headers

Read this when creating or migrating the header of a standard resource list or detail page. It defines component responsibilities, not a mandatory block/page name. Apply only to the requested page region; an embedded list or detail panel reuses its host context rather than adding a second page header. Inspect the installed exports, types and rendered structure before using the APIs below.

## Select the header owner

| Region | Component or public boundary | Keep separate |
| --- | --- | --- |
| Application navigation | Existing shell header/navigation | Resource identity and list query controls |
| Page path/context above the content surface | `PageHeader` with `PageHeaderContent`; verified Breadcrumb components or existing route-aware navigation | Table search/filters and bulk actions |
| List page title, when this header owns it | `PageTitle`, optional `PageDescription` in a text group | Breadcrumb links, badges and action controls |
| Page-level actions | `PageActions`, beside the context/text group | Navigation landmark and title element |
| Content-level peer navigation | Optional `PageContentHeader` with appropriate navigation or Tabs components | Record previous/next controls and table filters |
| Detail resource identity | A distinct summary region inside the content surface, owned by the selected detail layout | Top-level path and record navigation |
| List query/selection actions | DataTable's single toolbar owner | Page header and peer navigation |

For standard lists, creation belongs in the toolbar by default; if the product requires a header create action, keep it as the sole create entry. For details, edit/delete and other resource actions belong beside the resource summary through `PageActions` or the selected layout's action slot. Preserve business scope and permissions; do not invent actions, tabs, breadcrumbs or record navigation to populate empty regions.

## Compose the list header

Choose a path-only header or a titled header from the product's existing information hierarchy. A path-only header must not acquire a duplicate large title merely to match an example; when a page title is required, give it one owner. Do not render a second `PageTitle` in a wrapper around a layout that already provides it. Section titles and embedded panels use the appropriate heading level instead of another page h1.

`PageHeaderContent` is a horizontal flex row, not an automatic title/description stack. Its current `icon` prop accepts an `IconComponent` type. Keep title and description in a project-owned text group; optional breadcrumbs above the title belong in that same vertical group using verified navigation components. Actions are a sibling of `PageHeaderContent`, not children of the heading or breadcrumb navigation.

For a titled header, this is the composition shape (imports follow the consumer's installed aliases; `ResourceIcon` must satisfy the installed icon type):

```tsx
<PageHeader>
  <PageHeaderContent icon={ResourceIcon}>
    <div className="min-w-0">
      <PageTitle>{title}</PageTitle>
      {description && <PageDescription>{description}</PageDescription>}
    </div>
  </PageHeaderContent>
  {pageActions && <PageActions>{pageActions}</PageActions>}
</PageHeader>
```

The text-group wrapper above is intentional and does not separate any direct-child layout slots. Do not directly place title, description and breadcrumb nodes as flex siblings and expect vertical stacking. Use ordinary grouping elements for composition, but do not replace supported title/description/actions components with a generic Typography or legacy PageHeader clone just to reproduce the old styling.

`PageTitle` currently changes its default typography when a `className` is provided. Keep its default styling unless a verified public customization is required; putting `min-w-0` or layout-only classes on the text-group wrapper avoids accidentally changing the title style. Do not retain old heading sizes, margins, icon dimensions or global header rules by default. Public header icon sizing and the [control/icon rules](control-composition.md) take precedence over legacy values.

When `PageContentHeader` contains `PageSubnav` and `PageActions`, keep those parts as direct rendered children: its current selectors normalize navigation padding and align actions by their slots. Route navigation uses links and active-route semantics; local panel switching uses the installed Tabs provider/list/trigger/content contract. Do not wrap route changes in fake local Tabs or put edit/delete buttons inside `PageSubnav` to obtain alignment.

## Compose the detail header

A detail page separates path/context, optional record navigation, resource summary and optional business tabs. Do not apply the list page's title placement to all four regions. The summary groups resource artwork, title with adjacent status, description below, and resource actions alongside it. Status is outside the h1; a description is not a subtitle inserted into the title text.

If using the installed `ResourceDetailLayout`, it owns `PageLayout`, its headers and `PageContent`. Supply these verified public inputs rather than nesting another page layout or copying its internal summary markup:

| Public input | Responsibility in the current implementation |
| --- | --- |
| `navigation` | Path/breadcrumb content in the outer `PageHeaderContent`; supply content, not another `PageHeader` |
| `recordNavigation` | Close/back and adjacent-record controls in a dedicated content-header region, only when supported by the product |
| `leading` | Resource artwork/icon as a React node; this differs from `PageHeaderContent.icon`, which accepts a component type |
| `title` | Non-empty resource-name string; the layout renders `PageTitle` itself |
| `status` | Status content beside and outside the title |
| `description` | Supporting content rendered by the layout's `PageDescription` |
| `actions` | Buttons/menus; the layout supplies `PageActions`, so do not nest another action wrapper |
| `tabs` | Appropriate route navigation or TabsList; the caller still owns routing or the required Tabs provider, state and content |

Do not pass a `PageTitle` node as `title`, another `PageDescription` as `description`, or a complete header as `navigation`. These slots accept content for an existing owner, not a replacement hierarchy. Link destinations, previous/next record boundaries, permissions, pending state and mutations remain project responsibilities. Use public controls with real handlers and accessible names, not click-enabled spans.

If this layout is unavailable or demonstrably incompatible, compose the same responsibilities through installed public page/header/title/actions/navigation primitives and project-owned grouping. Keep the reason and actual owner map in the selection record. This is not a requirement to install a named full-page block, patch managed internals, or invent props such as `PageHeader.title` or `PageHeader.onBack`.

## Header acceptance

For every affected header composition, record the actual component imports/re-exports, installed version, owner of each region and covered routes/states. During migration, attach this to existing region/mapping IDs and contract/visual evidence; do not add schema fields.

- Inspect the rendered structure: title/description grouping, status outside h1, actions outside navigation, required direct-child slots and no duplicate page layout/header/title/actions introduced by wrappers.
- Compare the selected layout with the rendered result, including path-only list headers and detail summaries inside the content surface. `PageLayout` import presence alone does not pass adoption.
- Inspect narrow/wide layouts and long names/localized labels. Titles, descriptions and actions must remain usable without overlap, clipped focus or page-wide overflow. Allow whole action groups to reflow; do not shrink icons/text to preserve old geometry or modify managed styles to force a fit.
- Exercise applicable breadcrumb/back/record links, tabs, disabled boundaries, permission-dependent actions and pending/failure behavior. Preserve list query context when returning from details if the product already supports it.
- Check icon slots, accessible names, keyboard focus and Button composition using the control reference. An ordinary icon/text action must not stack unexpectedly.

Known structural/style/interaction defects fail the corresponding check; unavailable browser or required state evidence remains unchecked. A source-only review or passing build cannot establish rendered header correctness.
