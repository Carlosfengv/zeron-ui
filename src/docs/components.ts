export interface ComponentEntry {
  slug: string;
  name: string;
  description: string;
  isNew?: boolean;
  isUpdated?: boolean;
  /** Tailwind bg class overriding the default blue `isNew` dot in the sidebar. */
  dotColor?: string;
  gridSize?: "large" | "medium" | "small";
}

export interface SystemEntry {
  slug: string;
  name: string;
  description: string;
  isNew?: boolean;
  isUpdated?: boolean;
}

export const systemList: SystemEntry[] = [
  { slug: "surfaces", name: "Surfaces", description: "Five semantic surfaces with purpose-based shadows for light and dark mode." },
  { slug: "semantic-tokens", name: "Semantic Tokens", description: "The complete runtime contract for color, surface, type, shape, and layering.", isNew: true },
  { slug: "scrollbars", name: "Scrollbars", description: "A scrollbar that stays out of the way but never disappears, over shadcn's scroll-fade baseline — restyled to the shape system, native scroll on touch.", isNew: true },
  { slug: "motion", name: "Motion", description: "Spring tokens, faster exits, and reflow-free weight animation — the motion rules shared by every component." },
];

export const componentList: ComponentEntry[] = [
  { slug: "accordion", name: "Accordion", description: "Collapsible sections with animated expand/collapse and proximity hover in grouped mode.", gridSize: "large" },
  { slug: "badge", name: "Badge", description: "Compact label with solid and dot variants, Tailwind color palette, and three sizes.", gridSize: "small" },
  { slug: "badge-overflow", name: "BadgeOverflow", description: "Responsive badge list that collapses hidden items into an overflow count.", isNew: true, gridSize: "medium" },
  { slug: "breadcrumb", name: "Breadcrumb", description: "Composable path navigation with separators, current-page state, and collapsed levels.", isNew: true, gridSize: "medium" },
  { slug: "button", name: "Button", description: "Versatile button with variants, sizes, loading state, and icon support.", gridSize: "small" },
  { slug: "card", name: "Card", description: "shadcn's compositional card, dressed in Zeron Design — stacked, inline, and grid layouts, borderless dividers, and 2-D proximity hover.", isNew: true, gridSize: "large" },
  { slug: "checkbox", name: "Checkbox", description: "Compact checkbox with checked, mixed, disabled, validation, and form states.", isNew: true, gridSize: "small" },
  { slug: "checkbox-group", name: "CheckboxGroup", description: "Checkbox group with merged backgrounds for contiguous selections.", gridSize: "small" },
  { slug: "color-picker", name: "ColorPicker", description: "Color picker with HEX/RGB/HSL/OKLCH formats, alpha, swatches, and popover trigger.", gridSize: "large" },
  { slug: "data-grid", name: "DataGrid", description: "Virtualized spreadsheet grid with inline editing, range selection, search, copy and paste, and pinned columns.", isNew: true, gridSize: "large" },
  { slug: "data-table", name: "DataTable", description: "TanStack data table with sorting, filters, pagination, selection, visibility, and pinning.", isNew: true, gridSize: "large" },
  { slug: "dialog", name: "Dialog", description: "Modal dialog with smooth enter/exit animations and overlay.", gridSize: "small" },
  { slug: "dropdown", name: "Dropdown", description: "Menu-style dropdown with proximity hover and animated backgrounds.", gridSize: "medium" },
  { slug: "input", name: "Input", description: "Text input with three variants, four sizes, and accessible validation states.", isNew: true, gridSize: "small" },
  { slug: "input-copy", name: "InputCopy", description: "Read-only input with copy-to-clipboard button and animated feedback.", gridSize: "small" },
  { slug: "input-group", name: "InputGroup", description: "Composable input with addons, compact actions, textarea support, and validation.", isUpdated: true, gridSize: "small" },
  { slug: "kbd", name: "Kbd", description: "Compact keycaps and shortcut groups for keyboard commands and interaction hints.", isNew: true, gridSize: "small" },
  { slug: "popover", name: "Popover", description: "Collision-aware floating content with a liquid anchor-to-panel transition.", isNew: true, gridSize: "small" },
  { slug: "radio-group", name: "RadioGroup", description: "Composable radio controls with form support and enhanced proximity-hover rows.", isUpdated: true, gridSize: "small" },
  { slug: "select", name: "Select", description: "Animated select menu with bordered/borderless variants and optional icons.", gridSize: "medium" },
  { slug: "slider", name: "Slider", description: "Range slider with step snapping, range mode, and animated thumb.", gridSize: "medium" },
  { slug: "stepper", name: "Stepper", description: "Accessible multi-step navigation with validation, completion states, and keyboard controls.", isNew: true, gridSize: "medium" },
  { slug: "switch", name: "Switch", description: "Toggle switch with animated thumb and label.", gridSize: "small" },
  { slug: "table", name: "Table", description: "Data table with row hover effects and semantic markup.", gridSize: "large" },
  { slug: "tabs", name: "Tabs", description: "Pill, segment, and underline tabs with a sliding active indicator.", gridSize: "medium" },
  { slug: "tooltip", name: "Tooltip", description: "Floating tooltip with spring-based animations and configurable placement.", gridSize: "small" },
];

export const aiAgentList: ComponentEntry[] = [
  { slug: "ask-user-questions", name: "AskUserQuestions", description: "Stepped question flow with single/multi-select, optional 'other' input, and skip.", gridSize: "large" },
  { slug: "chat-message", name: "ChatMessage", description: "Chat transcript bubble with baked-in motion, user/assistant alignment, and file attachments.", gridSize: "small" },
  { slug: "input-message", name: "InputMessage", description: "Chat-style message composer with auto-resizing textarea and configurable action slots.", gridSize: "medium" },
  { slug: "thinking-indicator", name: "ThinkingIndicator", description: "Animated status indicator with morphing SVG and cycling text.", gridSize: "small" },
  { slug: "thinking-steps", name: "ThinkingSteps", description: "Chain-of-thought display with sequential animation and collapsible steps.", gridSize: "large" },
];

/** Kept as redirects so existing documentation links remain valid. */
export const legacyDocSlugs = ["tabs-subtle"] as const;

/** Every installable component, for overview and demo pages without grouping. */
export const allComponentList: ComponentEntry[] = [...componentList, ...aiAgentList];

/** Combined prev/next navigation order for doc pages.
 *  Used by DocPage's arrow nav. Keep in sync with the sidebar order in
 *  `app/components/sidebar.tsx` (Introduction → systemList → componentList → aiAgentList). */
export const docOrder: Array<{ slug: string; name: string }> = [
  ...systemList.map((s) => ({ slug: s.slug, name: s.name })),
  ...componentList.map((c) => ({ slug: c.slug, name: c.name })),
  ...aiAgentList.map((c) => ({ slug: c.slug, name: c.name })),
];
