import type { IconName } from "@/lib/icon-context";

export type DocGroup = "root" | "system" | "layout" | "components" | "ai-agent" | "legacy";

export interface DocRouteManifestEntry {
  id: string;
  pathname: "/" | "/docs" | `/docs/${string}`;
  kind: "page" | "redirect";
  group: DocGroup;
  name: string;
  icon: IconName;
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
  page({ id: "home", pathname: "/", icon: "doc-showcase", group: "root", name: "Showcase", description: "Open Source UI components created by Zeron Design" }),
  page({ id: "introduction", pathname: "/docs", icon: "doc-introduction", group: "root", name: "Introduction", description: "Why these components feel different." }),
  page({ id: "surfaces", pathname: "/docs/surfaces", icon: "doc-surfaces", group: "system", name: "Surfaces", description: "Five semantic surfaces with purpose-based shadows for light and dark mode." }),
  page({ id: "semantic-tokens", pathname: "/docs/semantic-tokens", icon: "doc-semantic-tokens", group: "system", name: "Semantic Tokens", description: "The complete runtime contract for color, surface, type, shape, and layering.", isNew: true }),
  page({ id: "scrollbars", pathname: "/docs/scrollbars", icon: "doc-scrollbars", group: "system", name: "Scrollbars", description: "A scrollbar that stays out of the way but never disappears, over shadcn's scroll-fade baseline — restyled to the shape system, native scroll on touch.", isNew: true }),
  page({ id: "motion", pathname: "/docs/motion", icon: "doc-motion", group: "system", name: "Motion", description: "Spring tokens, faster exits, and reflow-free weight animation — the motion rules shared by every component." }),
  page({ id: "app-shell", pathname: "/docs/app-shell", icon: "doc-app-shell", group: "layout", name: "AppShell", description: "Composable application frame for Sidebar, header, and main content." }),
  page({ id: "page-layout", pathname: "/docs/page-layout", icon: "doc-page-layout", group: "layout", name: "PageLayout", description: "Responsive composition for optional page information, route navigation, content, and asides." }),
  page({ id: "sidebar", pathname: "/docs/sidebar", icon: "doc-sidebar", group: "layout", name: "Sidebar", description: "Responsive navigation rail with desktop collapse and a mobile drawer." }),
  page({ id: "top-nav", pathname: "/docs/top-nav", icon: "doc-top-nav", group: "layout", name: "TopNav", description: "Composable top navigation with brand, primary links, and actions." }),
  page({ id: "nav-menu", pathname: "/docs/nav-menu", icon: "doc-nav-menu", group: "layout", name: "NavMenu", description: "Router-agnostic navigation primitives shared by Sidebar and TopNav." }),
  page({ id: "accordion", pathname: "/docs/accordion", icon: "doc-accordion", group: "components", name: "Accordion", description: "Collapsible sections with animated expand/collapse and proximity hover in grouped mode.", gridSize: "large" }),
  page({ id: "badge", pathname: "/docs/badge", icon: "doc-badge", group: "components", name: "Badge", description: "Compact label with categorical colors, semantic statuses, solid and dot variants, and three sizes.", gridSize: "small" }),
  page({ id: "badge-overflow", pathname: "/docs/badge-overflow", icon: "doc-badge-overflow", group: "components", name: "BadgeOverflow", description: "Responsive badge list that collapses hidden items into an overflow count.", isNew: true, gridSize: "medium" }),
  page({ id: "breadcrumb", pathname: "/docs/breadcrumb", icon: "doc-breadcrumb", group: "components", name: "Breadcrumb", description: "Composable path navigation with separators, current-page state, and collapsed levels.", isNew: true, gridSize: "medium" }),
  page({ id: "button", pathname: "/docs/button", icon: "doc-button", group: "components", name: "Button", description: "Versatile button with variants, sizes, loading state, and icon support.", gridSize: "small" }),
  page({ id: "card", pathname: "/docs/card", icon: "doc-card", group: "components", name: "Card", description: "shadcn's compositional card, dressed in Zeron Design — stacked, inline, and grid layouts, borderless dividers, and 2-D proximity hover.", isNew: true, gridSize: "large" }),
  page({ id: "checkbox", pathname: "/docs/checkbox", icon: "doc-checkbox", group: "components", name: "Checkbox", description: "Compact checkbox with checked, mixed, disabled, validation, and form states.", isNew: true, gridSize: "small" }),
  page({ id: "checkbox-group", pathname: "/docs/checkbox-group", icon: "doc-checkbox-group", group: "components", name: "CheckboxGroup", description: "Checkbox group with merged backgrounds for contiguous selections.", gridSize: "small" }),
  page({ id: "color-picker", pathname: "/docs/color-picker", icon: "doc-color-picker", group: "components", name: "ColorPicker", description: "Color picker with HEX/RGB/HSL/OKLCH formats, alpha, swatches, and popover trigger.", gridSize: "large" }),
  page({ id: "data-grid", pathname: "/docs/data-grid", icon: "doc-data-grid", group: "components", name: "DataGrid", description: "Virtualized spreadsheet grid with inline editing, range selection, search, copy and paste, and pinned columns.", isNew: true, gridSize: "large" }),
  page({ id: "data-table", pathname: "/docs/data-table", icon: "doc-data-table", group: "components", name: "DataTable", description: "TanStack data table with sorting, filters, pagination, selection, visibility, and pinning.", isNew: true, gridSize: "large" }),
  page({ id: "dialog", pathname: "/docs/dialog", icon: "doc-dialog", group: "components", name: "Dialog", description: "Modal dialog with smooth enter/exit animations and overlay.", gridSize: "small" }),
  page({ id: "dropdown", pathname: "/docs/dropdown", icon: "doc-dropdown", group: "components", name: "Dropdown", description: "Menu-style dropdown with proximity hover and animated backgrounds.", gridSize: "medium" }),
  page({ id: "input", pathname: "/docs/input", icon: "doc-input", group: "components", name: "Input", description: "Text input with three variants, four sizes, and accessible validation states.", isNew: true, gridSize: "small" }),
  page({ id: "input-copy", pathname: "/docs/input-copy", icon: "doc-input-copy", group: "components", name: "InputCopy", description: "Read-only input with copy-to-clipboard button and animated feedback.", gridSize: "small" }),
  page({ id: "input-group", pathname: "/docs/input-group", icon: "doc-input-group", group: "components", name: "InputGroup", description: "Composable input with addons, compact actions, textarea support, and validation.", isUpdated: true, gridSize: "small" }),
  page({ id: "info-item", pathname: "/docs/info-item", icon: "doc-info-item", group: "components", name: "InfoItem", description: "Composable information row with leading media, primary and supporting text, and a flexible trailing value or detail.", isNew: true, gridSize: "medium" }),
  page({ id: "kbd", pathname: "/docs/kbd", icon: "doc-kbd", group: "components", name: "Kbd", description: "Compact keycaps and shortcut groups for keyboard commands and interaction hints.", isNew: true, gridSize: "small" }),
  page({ id: "popover", pathname: "/docs/popover", icon: "doc-popover", group: "components", name: "Popover", description: "Collision-aware floating content with a liquid anchor-to-panel transition.", isNew: true, gridSize: "small" }),
  page({ id: "radio-group", pathname: "/docs/radio-group", icon: "doc-radio-group", group: "components", name: "RadioGroup", description: "Composable radio controls with form support and enhanced proximity-hover rows.", isUpdated: true, gridSize: "small" }),
  page({ id: "select", pathname: "/docs/select", icon: "doc-select", group: "components", name: "Select", description: "Animated select menu with bordered/borderless variants and optional icons.", gridSize: "medium" }),
  page({ id: "slider", pathname: "/docs/slider", icon: "doc-slider", group: "components", name: "Slider", description: "Range slider with step snapping, range mode, and animated thumb.", gridSize: "medium" }),
  page({ id: "stepper", pathname: "/docs/stepper", icon: "doc-stepper", group: "components", name: "Stepper", description: "Accessible multi-step navigation with validation, completion states, and keyboard controls.", isNew: true, gridSize: "medium" }),
  page({ id: "switch", pathname: "/docs/switch", icon: "doc-switch", group: "components", name: "Switch", description: "Toggle switch with animated thumb and label.", gridSize: "small" }),
  page({ id: "table", pathname: "/docs/table", icon: "doc-table", group: "components", name: "Table", description: "Data table with row hover effects and semantic markup.", gridSize: "large" }),
  page({ id: "tabs", pathname: "/docs/tabs", icon: "doc-tabs", group: "components", name: "Tabs", description: "Pill, segment, and underline tabs with a sliding active indicator.", gridSize: "medium" }),
  page({ id: "tooltip", pathname: "/docs/tooltip", icon: "doc-tooltip", group: "components", name: "Tooltip", description: "Floating tooltip with spring-based animations and configurable placement.", gridSize: "small" }),
  page({ id: "ask-user-questions", pathname: "/docs/ask-user-questions", icon: "doc-ask-user-questions", group: "ai-agent", name: "AskUserQuestions", description: "Stepped question flow with single/multi-select, optional 'other' input, and skip.", gridSize: "large" }),
  page({ id: "chat-message", pathname: "/docs/chat-message", icon: "doc-chat-message", group: "ai-agent", name: "ChatMessage", description: "Chat transcript bubble with baked-in motion, user/assistant alignment, and file attachments.", gridSize: "small" }),
  page({ id: "input-message", pathname: "/docs/input-message", icon: "doc-input-message", group: "ai-agent", name: "InputMessage", description: "Chat-style message composer with auto-resizing textarea and configurable action slots.", gridSize: "medium" }),
  page({ id: "thinking-indicator", pathname: "/docs/thinking-indicator", icon: "doc-thinking-indicator", group: "ai-agent", name: "ThinkingIndicator", description: "Animated status indicator with morphing SVG and cycling text.", gridSize: "small" }),
  page({ id: "thinking-steps", pathname: "/docs/thinking-steps", icon: "doc-thinking-steps", group: "ai-agent", name: "ThinkingSteps", description: "Chain-of-thought display with sequential animation and collapsible steps.", gridSize: "large" }),
  {
    id: "tabs-subtle",
    pathname: "/docs/tabs-subtle",
    kind: "redirect",
    group: "legacy",
    name: "TabsSubtle",
    icon: "doc-tabs",
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
