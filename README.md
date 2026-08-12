# Zeron Design

Refined UI components with satisfying hover. Built on [shadcn/ui](https://ui.shadcn.com) and Base UI primitives — every transition exists to make a state change legible.

[Live docs & demos](https://zeron-ui.vercel.app) | [Browse components](https://zeron-ui.vercel.app/docs)

## Install

Initialize shadcn in a project that does not already have a `components.json`:

```bash
npx zeron-ui init
```

Install one or more components:

```bash
npx zeron-ui add button
npx zeron-ui add button dialog popover
```

The Zeron CLI installs from the live Registry and delegates file placement,
dependencies, CSS, and design tokens to a pinned shadcn installation engine.
To inspect the catalog or preview a component without writing files:

```bash
npx zeron-ui list
npx zeron-ui add button --dry-run
```

The Registry remains directly compatible with shadcn as a fallback:

```bash
npx shadcn@latest add https://zeron-ui.vercel.app/r/button.json
```

Dependencies resolve automatically. Font weight animations require the [Inter](https://fonts.google.com/specimen/Inter) variable font.

## Icons

Components render icons through named slots with HugeIcons Stroke Rounded defaults. To use another icon library, wrap your app in the installed `IconProvider` and override any slot; names you leave out keep their HugeIcons default:

```tsx
import { IconProvider } from "@/lib/icon-context";
import { CaretRight, MagnifyingGlass } from "@phosphor-icons/react";

<IconProvider icons={{ "chevron-right": CaretRight, "search": MagnifyingGlass }}>
  <App />
</IconProvider>
```

The site and default Registry components use only the public HugeIcons packages, so installs and builds do not require a license token. The optional `pro-icon-provider` Registry item adds HugeIcons Stroke Standard, Bulk Rounded, and Duotone Rounded. It requires a HugeIcons Pro subscription and is intentionally excluded from the site's dependency graph.

To opt in, copy the local registry configuration, provide your own token, install the Registry item, and use `ProIconProvider` at the app root. Keep `.npmrc` local; it is ignored by Git. Pro icon definitions are never included in this Registry.

```bash
cp .npmrc.example .npmrc
export HUGEICONS_TOKEN="your-token"
npx zeron-ui add pro-icon-provider
```

```tsx
import { ProIconProvider } from "@/lib/pro-icon-provider";

<ProIconProvider>
  <App />
</ProIconProvider>
```

## Components

| Component | Description |
|---|---|
| [Accordion](https://zeron-ui.vercel.app/docs/accordion) | Collapsible sections with animated expand/collapse and proximity hover |
| [AskUserQuestions](https://zeron-ui.vercel.app/docs/ask-user-questions) | Stepped question flow with single/multi-select, inline "other" input, and multi-question navigation |
| [Badge](https://zeron-ui.vercel.app/docs/badge) | Compact label with solid and dot variants, Tailwind color palette |
| [BadgeOverflow](https://zeron-ui.vercel.app/docs/badge-overflow) | Responsive badge list that collapses hidden items into an overflow count |
| [Breadcrumb](https://zeron-ui.vercel.app/docs/breadcrumb) | Composable path navigation with separators, current-page state, and collapsed levels |
| [Button](https://zeron-ui.vercel.app/docs/button) | Variants, sizes, loading state, and icon support |
| [Card](https://zeron-ui.vercel.app/docs/card) | One prop-driven card — stacked, inline, or grid layouts, borderless dividers, media/logo/feature slots, and 2-D proximity hover |
| [Checkbox](https://zeron-ui.vercel.app/docs/checkbox) | Compact checkbox with checked, mixed, disabled, validation, and form states |
| [CheckboxGroup](https://zeron-ui.vercel.app/docs/checkbox-group) | Merged backgrounds for contiguous selections |
| [ColorPicker](https://zeron-ui.vercel.app/docs/color-picker) | HEX, RGB, HSL, and OKLCH formats with alpha, swatches, and eyedropper; inline or popover |
| [DataGrid](https://zeron-ui.vercel.app/docs/data-grid) | Virtualized spreadsheet grid with inline editing, range selection, search, copy and paste, and pinned columns |
| [DataTable](https://zeron-ui.vercel.app/docs/data-table) | TanStack data table with sorting, filters, pagination, selection, visibility, and pinning |
| [Dialog](https://zeron-ui.vercel.app/docs/dialog) | Modal with smooth enter/exit animations and overlay |
| [Dropdown](https://zeron-ui.vercel.app/docs/dropdown) | Menu-style dropdown with proximity hover |
| [Input](https://zeron-ui.vercel.app/docs/input) | Text input with three variants, four sizes, and accessible validation states |
| [InputCopy](https://zeron-ui.vercel.app/docs/input-copy) | Read-only input with copy-to-clipboard and animated feedback |
| [InputGroup](https://zeron-ui.vercel.app/docs/input-group) | Composable input with addons, compact actions, textarea support, and validation |
| [Kbd](https://zeron-ui.vercel.app/docs/kbd) | Compact keycaps and shortcut groups for keyboard commands and interaction hints |
| [InputMessage](https://zeron-ui.vercel.app/docs/input-message) | Chat-style composer with auto-resizing textarea, action slots, and built-in send button |
| [Popover](https://zeron-ui.vercel.app/docs/popover) | Collision-aware floating content with a liquid anchor-to-panel transition |
| [RadioGroup](https://zeron-ui.vercel.app/docs/radio-group) | Composable radio controls with form support and enhanced proximity-hover rows |
| [Select](https://zeron-ui.vercel.app/docs/select) | Animated select with bordered/borderless variants |
| [Slider](https://zeron-ui.vercel.app/docs/slider) | Range slider with step snapping, range mode, animated thumb |
| [Stepper](https://zeron-ui.vercel.app/docs/stepper) | Multi-step navigation with validation, completion states, and keyboard controls |
| [Surfaces](https://zeron-ui.vercel.app/docs/surfaces) | Semantic elevation roles with relative nesting so popovers, dropdowns, and dialogs stay distinct at any depth |
| [Switch](https://zeron-ui.vercel.app/docs/switch) | Toggle with animated thumb and label |
| [Table](https://zeron-ui.vercel.app/docs/table) | Data table with row hover effects |
| [Tabs](https://zeron-ui.vercel.app/docs/tabs) | Pill, segment, and underline tabs with sliding indicators and proximity hover |
| [ThinkingIndicator](https://zeron-ui.vercel.app/docs/thinking-indicator) | Animated status indicator with morphing SVG |
| [ThinkingSteps](https://zeron-ui.vercel.app/docs/thinking-steps) | Chain-of-thought display with sequential animation |
| [Tooltip](https://zeron-ui.vercel.app/docs/tooltip) | Spring-based floating tooltip with configurable placement |

## What makes these different

- **Motion as information** — transitions make state changes legible, nothing moves for decoration
- **Hover as preview** — proximity highlights show where your action will land before you click
- **Spring physics** — springs replace fixed durations, adapting naturally to interruption
- **Drop-in compatible** — your existing shadcn theme and tokens apply automatically

## Tech stack

- [Next.js](https://nextjs.org) 15 + React 19
- [Tailwind CSS](https://tailwindcss.com) v4
- [Framer Motion](https://www.framer.com/motion/)
- [Base UI](https://base-ui.com) primitives
- [shadcn/ui](https://ui.shadcn.com) registry protocol

## License

[MIT](LICENSE) © Zeron Design
