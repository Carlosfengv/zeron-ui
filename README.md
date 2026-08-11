# Zeron Design

Refined UI components with satisfying hover. Built on [shadcn/ui](https://ui.shadcn.com) and Base UI primitives — every transition exists to make a state change legible.

[Live docs & demos](https://www.zerondesign.com) | [Browse components](https://www.zerondesign.com/docs)

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
npx shadcn@latest add https://www.zerondesign.com/r/button.json
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

The optional `pro-icon-provider` Registry item adds HugeIcons Stroke Standard, Bulk Rounded, and Duotone Rounded. It requires a HugeIcons Pro subscription and private npm registry configuration; install it only after configuring your own license token, then use `ProIconProvider` at the app root. Pro icon definitions are never included in this Registry.

```bash
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
| [Accordion](https://www.zerondesign.com/docs/accordion) | Collapsible sections with animated expand/collapse and proximity hover |
| [AskUserQuestions](https://www.zerondesign.com/docs/ask-user-questions) | Stepped question flow with single/multi-select, inline "other" input, and multi-question navigation |
| [Badge](https://www.zerondesign.com/docs/badge) | Compact label with solid and dot variants, Tailwind color palette |
| [BadgeOverflow](https://www.zerondesign.com/docs/badge-overflow) | Responsive badge list that collapses hidden items into an overflow count |
| [Breadcrumb](https://www.zerondesign.com/docs/breadcrumb) | Composable path navigation with separators, current-page state, and collapsed levels |
| [Button](https://www.zerondesign.com/docs/button) | Variants, sizes, loading state, and icon support |
| [Card](https://www.zerondesign.com/docs/card) | One prop-driven card — stacked, inline, or grid layouts, borderless dividers, media/logo/feature slots, and 2-D proximity hover |
| [Checkbox](https://www.zerondesign.com/docs/checkbox) | Compact checkbox with checked, mixed, disabled, validation, and form states |
| [CheckboxGroup](https://www.zerondesign.com/docs/checkbox-group) | Merged backgrounds for contiguous selections |
| [ColorPicker](https://www.zerondesign.com/docs/color-picker) | HEX, RGB, HSL, and OKLCH formats with alpha, swatches, and eyedropper; inline or popover |
| [DataGrid](https://www.zerondesign.com/docs/data-grid) | Virtualized spreadsheet grid with inline editing, range selection, search, copy and paste, and pinned columns |
| [DataTable](https://www.zerondesign.com/docs/data-table) | TanStack data table with sorting, filters, pagination, selection, visibility, and pinning |
| [Dialog](https://www.zerondesign.com/docs/dialog) | Modal with smooth enter/exit animations and overlay |
| [Dropdown](https://www.zerondesign.com/docs/dropdown) | Menu-style dropdown with proximity hover |
| [Input](https://www.zerondesign.com/docs/input) | Text input with three variants, four sizes, and accessible validation states |
| [InputCopy](https://www.zerondesign.com/docs/input-copy) | Read-only input with copy-to-clipboard and animated feedback |
| [InputGroup](https://www.zerondesign.com/docs/input-group) | Composable input with addons, compact actions, textarea support, and validation |
| [Kbd](https://www.zerondesign.com/docs/kbd) | Compact keycaps and shortcut groups for keyboard commands and interaction hints |
| [InputMessage](https://www.zerondesign.com/docs/input-message) | Chat-style composer with auto-resizing textarea, action slots, and built-in send button |
| [Popover](https://www.zerondesign.com/docs/popover) | Collision-aware floating content with a liquid anchor-to-panel transition |
| [RadioGroup](https://www.zerondesign.com/docs/radio-group) | Composable radio controls with form support and enhanced proximity-hover rows |
| [Select](https://www.zerondesign.com/docs/select) | Animated select with bordered/borderless variants |
| [Slider](https://www.zerondesign.com/docs/slider) | Range slider with step snapping, range mode, animated thumb |
| [Stepper](https://www.zerondesign.com/docs/stepper) | Multi-step navigation with validation, completion states, and keyboard controls |
| [Surfaces](https://www.zerondesign.com/docs/surfaces) | Semantic elevation roles with relative nesting so popovers, dropdowns, and dialogs stay distinct at any depth |
| [Switch](https://www.zerondesign.com/docs/switch) | Toggle with animated thumb and label |
| [Table](https://www.zerondesign.com/docs/table) | Data table with row hover effects |
| [Tabs](https://www.zerondesign.com/docs/tabs) | Pill, segment, and underline tabs with sliding indicators and proximity hover |
| [ThinkingIndicator](https://www.zerondesign.com/docs/thinking-indicator) | Animated status indicator with morphing SVG |
| [ThinkingSteps](https://www.zerondesign.com/docs/thinking-steps) | Chain-of-thought display with sequential animation |
| [Tooltip](https://www.zerondesign.com/docs/tooltip) | Spring-based floating tooltip with configurable placement |

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
