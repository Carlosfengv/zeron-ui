# GPT-6 Astra model page behaviors

## Page navigation

- Interaction model: click and scroll driven.
- Local navigation links update the URL hash and scroll the matching section
  into view.
- `IntersectionObserver` updates the active local navigation item while the
  page body scrolls.
- The desktop sidebar is sticky within the page content. On narrow screens it
  becomes a horizontally scrollable `PageSubnav`.

## Filters and charts

- Provider routing mode and percentile are finite controlled `Select` values.
- Pricing source, metric, and range are controlled `Tabs` groups.
- Pricing provider switches toggle individual chart lines.
- Performance location, percentile, and period are controlled `Select` values.
- Performance summary cards remain visible while filters update the chart set.
- Activity metric is a controlled `Select`; the captured demo supplies Tokens.
- Every chart supplies a tooltip and an accessible label through Zeron's chart
  wrapper.

## FAQ and related content

- FAQ uses a single, collapsible Zeron `AccordionGroup`.
- Explore and related-model cards are semantic links. Duplicate responsive DOM
  clones from the source page are not copied into the data set.
- Back to top is an icon-only Zeron Button with an accessible label.

## Responsive behavior

- Desktop: two-track page layout with a 200px local sidebar and a main content
  surface.
- Tablet: local navigation moves above content; multi-column chart grids reduce
  to two columns where space allows.
- Mobile: actions and metric cards stack, tables scroll horizontally, chart
  grids and related-model cards become one column.

## Explicit visual override

OpenRouter's fonts, palette, radii, shadows, and exact CSS measurements are not
part of the implementation. The user explicitly requires Zeron's component
recipes and default semantic tokens instead.

