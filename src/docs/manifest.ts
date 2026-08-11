export type DocGroup = "root" | "system" | "components" | "ai-agent" | "legacy";

export interface DocRouteManifestEntry {
  id: string;
  pathname: "/" | "/docs" | `/docs/${string}`;
  kind: "page" | "redirect";
  group: DocGroup;
  name: string;
  description?: string;
  messageNamespace: "home" | `docs/${string}` | null;
  indexable: boolean;
  isNew?: boolean;
  isUpdated?: boolean;
  dotColor?: string;
  gridSize?: "large" | "medium" | "small";
  redirectTo?: "/docs" | `/docs/${string}`;
}

const page = (
  entry: Omit<DocRouteManifestEntry, "kind" | "indexable" | "messageNamespace">,
): DocRouteManifestEntry => ({
  ...entry,
  kind: "page",
  indexable: true,
  messageNamespace: entry.pathname === "/" ? "home" : `docs/${entry.id}`,
});

export const docManifest = [
  page({ id: "home", pathname: "/", group: "root", name: "Showcase", description: "Open Source UI components created by Zeron Design" }),
  page({ id: "introduction", pathname: "/docs", group: "root", name: "Introduction", description: "Why these components feel different." }),
  page({ id: "surfaces", pathname: "/docs/surfaces", group: "system", name: "Surfaces", description: "Five semantic surfaces with purpose-based shadows for light and dark mode." }),
  page({ id: "semantic-tokens", pathname: "/docs/semantic-tokens", group: "system", name: "Semantic Tokens", description: "The complete runtime contract for color, surface, type, shape, and layering.", isNew: true }),
  page({ id: "scrollbars", pathname: "/docs/scrollbars", group: "system", name: "Scrollbars", description: "A scrollbar that stays out of the way but never disappears, over shadcn's scroll-fade baseline — restyled to the shape system, native scroll on touch.", isNew: true }),
  page({ id: "motion", pathname: "/docs/motion", group: "system", name: "Motion", description: "Spring tokens, faster exits, and reflow-free weight animation — the motion rules shared by every component." }),
  page({ id: "accordion", pathname: "/docs/accordion", group: "components", name: "Accordion", description: "Collapsible sections with animated expand/collapse and proximity hover in grouped mode.", gridSize: "large" }),
  page({ id: "badge", pathname: "/docs/badge", group: "components", name: "Badge", description: "Compact label with solid and dot variants, Tailwind color palette, and three sizes.", gridSize: "small" }),
  page({ id: "badge-overflow", pathname: "/docs/badge-overflow", group: "components", name: "BadgeOverflow", description: "Responsive badge list that collapses hidden items into an overflow count.", isNew: true, gridSize: "medium" }),
  page({ id: "breadcrumb", pathname: "/docs/breadcrumb", group: "components", name: "Breadcrumb", description: "Composable path navigation with separators, current-page state, and collapsed levels.", isNew: true, gridSize: "medium" }),
  page({ id: "button", pathname: "/docs/button", group: "components", name: "Button", description: "Versatile button with variants, sizes, loading state, and icon support.", gridSize: "small" }),
  page({ id: "card", pathname: "/docs/card", group: "components", name: "Card", description: "shadcn's compositional card, dressed in Zeron Design — stacked, inline, and grid layouts, borderless dividers, and 2-D proximity hover.", isNew: true, gridSize: "large" }),
  page({ id: "checkbox", pathname: "/docs/checkbox", group: "components", name: "Checkbox", description: "Compact checkbox with checked, mixed, disabled, validation, and form states.", isNew: true, gridSize: "small" }),
  page({ id: "checkbox-group", pathname: "/docs/checkbox-group", group: "components", name: "CheckboxGroup", description: "Checkbox group with merged backgrounds for contiguous selections.", gridSize: "small" }),
  page({ id: "color-picker", pathname: "/docs/color-picker", group: "components", name: "ColorPicker", description: "Color picker with HEX/RGB/HSL/OKLCH formats, alpha, swatches, and popover trigger.", gridSize: "large" }),
  page({ id: "data-grid", pathname: "/docs/data-grid", group: "components", name: "DataGrid", description: "Virtualized spreadsheet grid with inline editing, range selection, search, copy and paste, and pinned columns.", isNew: true, gridSize: "large" }),
  page({ id: "data-table", pathname: "/docs/data-table", group: "components", name: "DataTable", description: "TanStack data table with sorting, filters, pagination, selection, visibility, and pinning.", isNew: true, gridSize: "large" }),
  page({ id: "dialog", pathname: "/docs/dialog", group: "components", name: "Dialog", description: "Modal dialog with smooth enter/exit animations and overlay.", gridSize: "small" }),
  page({ id: "dropdown", pathname: "/docs/dropdown", group: "components", name: "Dropdown", description: "Menu-style dropdown with proximity hover and animated backgrounds.", gridSize: "medium" }),
  page({ id: "input", pathname: "/docs/input", group: "components", name: "Input", description: "Text input with three variants, four sizes, and accessible validation states.", isNew: true, gridSize: "small" }),
  page({ id: "input-copy", pathname: "/docs/input-copy", group: "components", name: "InputCopy", description: "Read-only input with copy-to-clipboard button and animated feedback.", gridSize: "small" }),
  page({ id: "input-group", pathname: "/docs/input-group", group: "components", name: "InputGroup", description: "Composable input with addons, compact actions, textarea support, and validation.", isUpdated: true, gridSize: "small" }),
  page({ id: "kbd", pathname: "/docs/kbd", group: "components", name: "Kbd", description: "Compact keycaps and shortcut groups for keyboard commands and interaction hints.", isNew: true, gridSize: "small" }),
  page({ id: "popover", pathname: "/docs/popover", group: "components", name: "Popover", description: "Collision-aware floating content with a liquid anchor-to-panel transition.", isNew: true, gridSize: "small" }),
  page({ id: "radio-group", pathname: "/docs/radio-group", group: "components", name: "RadioGroup", description: "Composable radio controls with form support and enhanced proximity-hover rows.", isUpdated: true, gridSize: "small" }),
  page({ id: "select", pathname: "/docs/select", group: "components", name: "Select", description: "Animated select menu with bordered/borderless variants and optional icons.", gridSize: "medium" }),
  page({ id: "slider", pathname: "/docs/slider", group: "components", name: "Slider", description: "Range slider with step snapping, range mode, and animated thumb.", gridSize: "medium" }),
  page({ id: "stepper", pathname: "/docs/stepper", group: "components", name: "Stepper", description: "Accessible multi-step navigation with validation, completion states, and keyboard controls.", isNew: true, gridSize: "medium" }),
  page({ id: "switch", pathname: "/docs/switch", group: "components", name: "Switch", description: "Toggle switch with animated thumb and label.", gridSize: "small" }),
  page({ id: "table", pathname: "/docs/table", group: "components", name: "Table", description: "Data table with row hover effects and semantic markup.", gridSize: "large" }),
  page({ id: "tabs", pathname: "/docs/tabs", group: "components", name: "Tabs", description: "Pill, segment, and underline tabs with a sliding active indicator.", gridSize: "medium" }),
  page({ id: "tooltip", pathname: "/docs/tooltip", group: "components", name: "Tooltip", description: "Floating tooltip with spring-based animations and configurable placement.", gridSize: "small" }),
  page({ id: "ask-user-questions", pathname: "/docs/ask-user-questions", group: "ai-agent", name: "AskUserQuestions", description: "Stepped question flow with single/multi-select, optional 'other' input, and skip.", gridSize: "large" }),
  page({ id: "chat-message", pathname: "/docs/chat-message", group: "ai-agent", name: "ChatMessage", description: "Chat transcript bubble with baked-in motion, user/assistant alignment, and file attachments.", gridSize: "small" }),
  page({ id: "input-message", pathname: "/docs/input-message", group: "ai-agent", name: "InputMessage", description: "Chat-style message composer with auto-resizing textarea and configurable action slots.", gridSize: "medium" }),
  page({ id: "thinking-indicator", pathname: "/docs/thinking-indicator", group: "ai-agent", name: "ThinkingIndicator", description: "Animated status indicator with morphing SVG and cycling text.", gridSize: "small" }),
  page({ id: "thinking-steps", pathname: "/docs/thinking-steps", group: "ai-agent", name: "ThinkingSteps", description: "Chain-of-thought display with sequential animation and collapsible steps.", gridSize: "large" }),
  {
    id: "tabs-subtle",
    pathname: "/docs/tabs-subtle",
    kind: "redirect",
    group: "legacy",
    name: "TabsSubtle",
    messageNamespace: null,
    indexable: false,
    redirectTo: "/docs/tabs",
  },
] as const satisfies readonly DocRouteManifestEntry[];

export const pageDocEntries = docManifest.filter(
  (entry): entry is DocRouteManifestEntry & { kind: "page" } => entry.kind === "page",
);

export const detailDocEntries = pageDocEntries.filter(
  (entry) => entry.pathname.startsWith("/docs/"),
);

export const legacyDocEntries = docManifest.filter(
  (entry): entry is DocRouteManifestEntry & { kind: "redirect" } => entry.kind === "redirect",
);

export function getDocEntry(slug: string) {
  return docManifest.find((entry) => entry.id === slug);
}
