import type { IconName } from "@zeron/icons/context";

export const docCollections = ["components", "blocks", "icons"] as const;
export type DocCollection = (typeof docCollections)[number];

export const docSections = [
  "foundations", "layout", "components", "ai-agent", "application",
  "overview", "usage", "catalog", "providers",
] as const;
export type DocSection = (typeof docSections)[number];

export interface DocCollectionDefinition {
  id: DocCollection;
  order: number;
  navigationKey: string;
}

export const collectionDefinitions: readonly DocCollectionDefinition[] = [
  { id: "components", order: 100, navigationKey: "components" },
  { id: "blocks", order: 200, navigationKey: "blocks" },
  { id: "icons", order: 300, navigationKey: "icons" },
];

export interface DocSectionDefinition {
  id: DocSection;
  collection: DocCollection;
  order: number;
  navigationKey: string;
}

export const sectionDefinitions: readonly DocSectionDefinition[] = [
  { id: "foundations", collection: "components", order: 100, navigationKey: "foundations" },
  { id: "layout", collection: "components", order: 200, navigationKey: "layout" },
  { id: "components", collection: "components", order: 300, navigationKey: "components" },
  { id: "ai-agent", collection: "components", order: 400, navigationKey: "aiAgent" },
  { id: "application", collection: "blocks", order: 100, navigationKey: "application" },
  { id: "overview", collection: "icons", order: 100, navigationKey: "overview" },
  { id: "usage", collection: "icons", order: 200, navigationKey: "usage" },
  { id: "catalog", collection: "icons", order: 300, navigationKey: "catalog" },
  { id: "providers", collection: "icons", order: 400, navigationKey: "providers" },
];

export interface DocEntry {
  slug: string;
  collection: DocCollection;
  section: DocSection;
  name: string;
  icon: IconName;
  description?: string;
  indexable: boolean;
  order: number;
  isNew?: boolean;
  isUpdated?: boolean;
  dotColor?: string;
  gridSize?: "large" | "medium" | "small";
  registryItem?: { name: string; type: "registry:ui" | "registry:block" };
}

export interface DocLegacyRedirect {
  legacySlug: string;
  destination: { collection: DocCollection; slug: string };
}

const entry = (value: Omit<DocEntry, "collection" | "indexable" | "order"> & { order?: number }): DocEntry => ({
  ...value,
  collection: "components",
  indexable: true,
  order: value.order ?? 100,
});

const blockEntry = (value: Omit<DocEntry, "collection" | "indexable" | "order"> & { order?: number }): DocEntry => ({
  ...value,
  collection: "blocks",
  indexable: true,
  order: value.order ?? 100,
});

const iconEntry = (value: Omit<DocEntry, "collection" | "indexable" | "order"> & { order?: number }): DocEntry => ({
  ...value,
  collection: "icons",
  indexable: true,
  order: value.order ?? 100,
});

export const docEntries = [
  entry({ slug: "surfaces", section: "foundations", icon: "doc-surfaces", name: "Surfaces", description: "Five semantic surfaces with purpose-based shadows for light and dark mode." }),
  entry({ slug: "semantic-tokens", section: "foundations", icon: "doc-semantic-tokens", name: "Semantic Tokens", description: "The complete runtime contract for color, surface, type, shape, and layering.", isNew: true, order: 200 }),
  entry({ slug: "scrollbars", section: "foundations", icon: "doc-scrollbars", name: "Scrollbars", description: "A scrollbar that stays out of the way but never disappears, over shadcn's scroll-fade baseline — restyled to the shape system, native scroll on touch.", isNew: true, order: 300 }),
  entry({ slug: "motion", section: "foundations", icon: "doc-motion", name: "Motion", description: "Spring tokens, faster exits, and reflow-free weight animation — the motion rules shared by every component.", order: 400 }),
  entry({ slug: "app-shell", section: "layout", icon: "doc-app-shell", name: "AppShell", description: "Composable application frame for Sidebar, header, and main content." }),
  entry({ slug: "page-layout", section: "layout", icon: "doc-page-layout", name: "PageLayout", description: "Responsive composition for optional page information, route navigation, content, and asides.", order: 200 }),
  entry({ slug: "sidebar", section: "layout", icon: "doc-sidebar", name: "Sidebar", description: "Responsive navigation rail with desktop collapse and a mobile drawer.", order: 300 }),
  entry({ slug: "top-nav", section: "layout", icon: "doc-top-nav", name: "TopNav", description: "Composable top navigation with brand, primary links, and actions.", order: 400 }),
  entry({ slug: "nav-menu", section: "layout", icon: "doc-nav-menu", name: "NavMenu", description: "Router-agnostic navigation primitives shared by Sidebar and TopNav.", order: 500 }),
  entry({ slug: "accordion", section: "components", icon: "doc-accordion", name: "Accordion", description: "Collapsible sections with animated expand/collapse and proximity hover in grouped mode.", gridSize: "large" }),
  entry({ slug: "alert", section: "components", icon: "doc-info-item", name: "Alert", description: "Composable in-context callout with semantic statuses, optional icon, supporting detail, and action.", isNew: true, gridSize: "medium", order: 150 }),
  entry({ slug: "inline-notice", section: "components", icon: "doc-badge", name: "InlineNotice", description: "Quiet inline emphasis that composes with Badge, with an optional semantic emphasized variant.", isNew: true, gridSize: "medium", order: 175 }),
  entry({ slug: "badge", section: "components", icon: "doc-badge", name: "Badge", description: "Compact label with categorical colors, custom recipes, semantic statuses, and soft, strong, or dot variants.", gridSize: "small", order: 200 }),
  entry({ slug: "badge-overflow", section: "components", icon: "doc-badge-overflow", name: "BadgeOverflow", description: "Responsive badge list that collapses hidden items into an overflow count.", isNew: true, gridSize: "medium", order: 300 }),
  entry({ slug: "breadcrumb", section: "components", icon: "doc-breadcrumb", name: "Breadcrumb", description: "Composable path navigation with separators, current-page state, and collapsed levels.", isNew: true, gridSize: "medium", order: 400 }),
  entry({ slug: "button", section: "components", icon: "doc-button", name: "Button", description: "Versatile button with variants, sizes, loading state, and icon support.", gridSize: "small", order: 500 }),
  entry({ slug: "button-group", section: "components", icon: "doc-button", name: "ButtonGroup", description: "Connected horizontal and vertical action groups with split-button, separator, and contextual-addon composition.", isNew: true, gridSize: "small", order: 550 }),
  entry({ slug: "card", section: "components", icon: "doc-card", name: "Card", description: "shadcn's compositional card, dressed in Zeron Design — stacked, inline, and grid layouts, borderless dividers, and 2-D proximity hover.", isNew: true, gridSize: "large", order: 600 }),
  entry({ slug: "container", section: "components", icon: "doc-card", name: "Container", description: "Composable raised container with an optional header and footer around a floating content body.", isNew: true, gridSize: "medium", order: 650 }),
  entry({ slug: "checkbox", section: "components", icon: "doc-checkbox", name: "Checkbox", description: "Compact checkbox with checked, mixed, disabled, validation, and form states.", isNew: true, gridSize: "small", order: 700 }),
  entry({ slug: "checkbox-group", section: "components", icon: "doc-checkbox-group", name: "CheckboxGroup", description: "Checkbox group with merged backgrounds for contiguous selections.", gridSize: "small", order: 800 }),
  entry({ slug: "color-picker", section: "components", icon: "doc-color-picker", name: "ColorPicker", description: "Color picker with HEX/RGB/HSL/OKLCH formats, alpha, swatches, and popover trigger.", gridSize: "large", order: 900 }),
  entry({ slug: "data-grid", section: "components", icon: "doc-data-grid", name: "DataGrid", description: "Virtualized spreadsheet grid with inline editing, range selection, search, copy and paste, and pinned columns.", isNew: true, gridSize: "large", order: 1000 }),
  entry({ slug: "data-table", section: "components", icon: "doc-data-table", name: "DataTable", description: "TanStack data table with sorting, filters, pagination, selection, visibility, and pinning.", isNew: true, gridSize: "large", order: 1100 }),
  entry({ slug: "detail-list", section: "components", icon: "doc-info-item", name: "DetailList", description: "Framed label-value list with grouped sections and separators for compact resource and entity details.", isNew: true, gridSize: "medium", order: 1150 }),
  entry({ slug: "metric-card", section: "components", icon: "doc-card", name: "MetricCard", description: "Self-sizing single-metric card with optional breakdown, trend visualization, data states, and whole-card interaction.", isNew: true, gridSize: "medium", order: 1175 }),
  entry({ slug: "dialog", section: "components", icon: "doc-dialog", name: "Dialog", description: "Modal dialog with smooth enter/exit animations and overlay.", gridSize: "small", order: 1200 }),
  entry({ slug: "dropdown", section: "components", icon: "doc-dropdown", name: "Dropdown", description: "Menu-style dropdown with proximity hover and animated backgrounds.", gridSize: "medium", order: 1300 }),
  entry({ slug: "field", section: "components", icon: "doc-input", name: "Field", description: "Accessible form composition for labels, descriptions, validation messages, groups, and fieldsets.", isNew: true, gridSize: "medium", order: 1350 }),
  entry({ slug: "input", section: "components", icon: "doc-input", name: "Input", description: "Text input with three variants, five sizes, and accessible validation states.", isNew: true, gridSize: "small", order: 1400 }),
  entry({ slug: "input-copy", section: "components", icon: "doc-input-copy", name: "InputCopy", description: "Read-only input with copy-to-clipboard button and animated feedback.", gridSize: "small", order: 1500 }),
  entry({ slug: "input-group", section: "components", icon: "doc-input-group", name: "InputGroup", description: "Composable input with addons, compact actions, textarea support, and validation.", isUpdated: true, gridSize: "small", order: 1600 }),
  entry({ slug: "info-item", section: "components", icon: "doc-info-item", name: "InfoItem", description: "Composable information row with leading media, primary and supporting text, and a flexible trailing value or detail.", isNew: true, gridSize: "medium", order: 1700 }),
  entry({ slug: "kbd", section: "components", icon: "doc-kbd", name: "Kbd", description: "Compact keycaps and shortcut groups for keyboard commands and interaction hints.", isNew: true, gridSize: "small", order: 1800 }),
  entry({ slug: "popover", section: "components", icon: "doc-popover", name: "Popover", description: "Collision-aware floating content with a liquid anchor-to-panel transition.", isNew: true, gridSize: "small", order: 1900 }),
  entry({ slug: "radio-group", section: "components", icon: "doc-radio-group", name: "RadioGroup", description: "Composable radio controls with form support and enhanced proximity-hover rows.", isUpdated: true, gridSize: "small", order: 2000 }),
  entry({ slug: "resizable", section: "components", icon: "doc-separator", name: "Resizable", description: "Accessible split-pane layouts with pointer and keyboard resizing, semantic constraints, and optional visual grips.", isNew: true, gridSize: "medium", order: 2025 }),
  entry({ slug: "separator", section: "components", icon: "doc-separator", name: "Separator", description: "Accessible horizontal and vertical rules with a semantic border color and layout-safe gutter.", isNew: true, gridSize: "small", order: 2050 }),
  entry({ slug: "select", section: "components", icon: "doc-select", name: "Select", description: "Animated select menu with bordered/borderless variants and optional icons.", gridSize: "medium", order: 2100 }),
  entry({ slug: "slider", section: "components", icon: "doc-slider", name: "Slider", description: "Range slider with step snapping, range mode, and animated thumb.", gridSize: "medium", order: 2200 }),
  entry({ slug: "stepper", section: "components", icon: "doc-stepper", name: "Stepper", description: "Accessible multi-step navigation with validation, completion states, and keyboard controls.", isNew: true, gridSize: "medium", order: 2300 }),
  entry({ slug: "switch", section: "components", icon: "doc-switch", name: "Switch", description: "Toggle switch with animated thumb and label.", gridSize: "small", order: 2400 }),
  entry({ slug: "table", section: "components", icon: "doc-table", name: "Table", description: "Data table with row hover effects and semantic markup.", gridSize: "large", order: 2500 }),
  entry({ slug: "tabs", section: "components", icon: "doc-tabs", name: "Tabs", description: "Pill, segment, and underline tabs with a sliding active indicator.", gridSize: "medium", order: 2600 }),
  entry({ slug: "textarea", section: "components", icon: "doc-input-group", name: "Textarea", description: "Multi-line text input with semantic variants, two content sizes, resizing, and field validation support.", isNew: true, gridSize: "small", order: 2650 }),
  entry({ slug: "toast", section: "components", icon: "doc-toast", name: "Toast", description: "Animated notification stack with statuses, automatic dismissal, actions, and drag gestures.", isNew: true, gridSize: "medium", order: 2700 }),
  entry({ slug: "tooltip", section: "components", icon: "doc-tooltip", name: "Tooltip", description: "Floating tooltip with spring-based animations and configurable placement.", gridSize: "small", order: 2800 }),
  entry({ slug: "ask-user-questions", section: "ai-agent", icon: "doc-ask-user-questions", name: "AskUserQuestions", description: "Stepped question flow with single/multi-select, optional 'other' input, and skip." }),
  entry({ slug: "chat-message", section: "ai-agent", icon: "doc-chat-message", name: "ChatMessage", description: "Chat transcript bubble with baked-in motion, user/assistant alignment, and file attachments.", order: 200 }),
  entry({ slug: "input-message", section: "ai-agent", icon: "doc-input-message", name: "InputMessage", description: "Chat-style message composer with auto-resizing textarea and configurable action slots.", order: 300 }),
  entry({ slug: "thinking-indicator", section: "ai-agent", icon: "doc-thinking-indicator", name: "ThinkingIndicator", description: "Animated status indicator with morphing SVG and cycling text.", order: 400 }),
  entry({ slug: "thinking-steps", section: "ai-agent", icon: "doc-thinking-steps", name: "ThinkingSteps", description: "Chain-of-thought display with sequential animation and collapsible steps.", gridSize: "large", order: 500 }),
  blockEntry({ slug: "agent-trace-01", section: "application", icon: "doc-showcase", name: "Agent Trace 1", description: "A turn-aware agent execution trace with local JSON upload and raw-record inspection.", registryItem: { name: "agent-trace-01", type: "registry:block" }, isNew: true, order: 20 }),
  blockEntry({ slug: "provider-create-form-01", section: "application", icon: "doc-stepper", name: "Provider Create Form 1", description: "A three-step provider setup workflow with credential verification, model discovery, per-model availability, and final review.", registryItem: { name: "provider-create-form-01", type: "registry:block" }, order: 25 }),
  blockEntry({ slug: "cluster-environment-detail-01", section: "application", icon: "doc-data-table", name: "Cluster Environment Detail 1", description: "An inspection-report workspace that combines environment context, resource health, and incident follow-up.", registryItem: { name: "cluster-environment-detail-01", type: "registry:block" }, isNew: true, order: 28 }),
  blockEntry({ slug: "cluster-environment-list-01", section: "application", icon: "doc-data-table", name: "Cluster Environment List 1", description: "A filterable cluster-environment overview with critical, warning, normal, offline, and data-freshness states.", registryItem: { name: "cluster-environment-list-01", type: "registry:block" }, isNew: true, order: 30 }),
  blockEntry({ slug: "personal-settings-01", section: "application", icon: "doc-sidebar", name: "个人设置", description: "A personal settings workspace for model services, API keys, credentials, profile details, and usage.", registryItem: { name: "personal-settings-01", type: "registry:block" }, isNew: true, order: 35 }),
  blockEntry({ slug: "personal-model-usage-01", section: "application", icon: "doc-data-table", name: "个人模型用量", description: "A standalone model billing dashboard with consumption trends, attribution, and usage details.", registryItem: { name: "personal-model-usage-01", type: "registry:block" }, isNew: true, order: 36 }),
  blockEntry({ slug: "personal-usage-01", section: "application", icon: "doc-data-table", name: "个人使用情况", description: "A standalone dashboard for calls, activity, and token usage.", registryItem: { name: "personal-usage-01", type: "registry:block" }, isNew: true, order: 37 }),
  blockEntry({ slug: "resource-settings-01", section: "application", icon: "doc-sidebar", name: "模型服务设置", description: "A standalone page for reviewing personal model-service access.", registryItem: { name: "resource-settings-01", type: "registry:block" }, isNew: true, order: 38 }),
  blockEntry({ slug: "resource-catalog-01", section: "application", icon: "doc-card", name: "模型和 MCP 广场", description: "A responsive model and MCP marketplace with search, sorting, page-local filters, and resource cards.", registryItem: { name: "model-mcp-marketplace-01", type: "registry:block" }, isNew: true, order: 45 }),
  blockEntry({ slug: "mcp-detail-01", section: "application", icon: "doc-info-item", name: "MCP Detail", description: "An MCP resource detail page with safe connection generation and a minimal tool test panel.", registryItem: { name: "mcp-detail-01", type: "registry:block" }, isNew: true, order: 47 }),
  blockEntry({ slug: "model-detail-01", section: "application", icon: "doc-card", name: "Model Detail", description: "A model detail page with API-key handoff, code samples, benchmark data, and endpoint information.", registryItem: { name: "model-detail-01", type: "registry:block" }, isNew: true, order: 48 }),
  blockEntry({ slug: "resource-details-01", section: "application", icon: "doc-info-item", name: "Resource Details", description: "A grouped resource metadata panel with health, configuration, usage, and API compatibility details.", registryItem: { name: "resource-details-01", type: "registry:block" }, order: 50 }),
  blockEntry({ slug: "resource-list-table-01", section: "application", icon: "doc-data-table", name: "Resource List Table 1", description: "A searchable, selectable resource inventory with status filtering and reusable row actions.", registryItem: { name: "resource-list-table-01", type: "registry:block" }, order: 70 }),
  blockEntry({ slug: "resource-metric-list-01", section: "application", icon: "doc-data-table", name: "Resource Metric List 1", description: "A compact resource inventory with status distribution bars for infrastructure health at a glance.", registryItem: { name: "resource-metric-list-01", type: "registry:block" }, order: 75 }),
  blockEntry({ slug: "resource-status-all-01", section: "application", icon: "doc-data-table", name: "Resource Status All 1", description: "A resource-status summary with a circular distribution, detailed counts, and determinate-state coverage.", registryItem: { name: "resource-status-all-01", type: "registry:block" }, order: 100 }),
  blockEntry({ slug: "top-nav-app-shell-01", section: "application", icon: "doc-top-nav", name: "TopNav App Shell", description: "A stacked application shell with a centered TopNav and focused content area.", registryItem: { name: "top-nav-app-shell-01", type: "registry:block" } }),
  blockEntry({ slug: "zaiops-operations-01", section: "application", icon: "doc-sidebar", name: "ZAIops Operations", description: "An operations workspace recipe with a responsive Sidebar, organization switcher, and grouped navigation.", registryItem: { name: "zaiops-operations-01", type: "registry:block" }, order: 200 }),
  blockEntry({ slug: "zlrlist", section: "application", icon: "doc-data-table", name: "ZLR Protection Groups", description: "A ZS Live Recovery protection-group workspace with site switching, search, selection, row actions, and Chinese pagination.", registryItem: { name: "zlrlist", type: "registry:block" }, isNew: true, order: 205 }),
  iconEntry({ slug: "overview", section: "overview", icon: "doc-showcase", name: "Icons Overview", description: "The provider, public API, and style model behind Zeron Design icons." }),
  iconEntry({ slug: "usage", section: "usage", icon: "doc-button", name: "Icon Usage", description: "Use named icon slots without coupling application code to a source icon library." }),
  iconEntry({ slug: "catalog", section: "catalog", icon: "doc-data-grid", name: "Icon Catalog", description: "Searchable names generated from the free icon provider's actual exports." }),
  iconEntry({ slug: "providers", section: "providers", icon: "doc-semantic-tokens", name: "Icon Providers", description: "Free and licensed icon styles, plus the boundary for optional Pro packages." }),
] as const satisfies readonly DocEntry[];

export const legacyDocRedirects: readonly DocLegacyRedirect[] = [
  ...docEntries
    .filter((entry) => entry.collection === "components")
    .map(({ slug }) => ({ legacySlug: slug, destination: { collection: "components" as const, slug } })),
  { legacySlug: "tabs-subtle", destination: { collection: "components", slug: "tabs" } },
];

export const pageDocEntries = docEntries;
export const detailDocEntries = docEntries;

export function pathnameOf(entry: Pick<DocEntry, "collection" | "slug">) {
  return `/docs/${entry.collection}/${entry.slug}` as const;
}

export function contentKeyOf(entry: Pick<DocEntry, "collection" | "slug">) {
  return `${entry.collection}/${entry.slug}` as const;
}

export function pageKeyOf(entry: Pick<DocEntry, "collection" | "slug">) {
  return `${entry.collection}/${entry.slug}` as const;
}

export function getDocEntry(collection: string, slug: string) {
  return docEntries.find((entry) => entry.collection === collection && entry.slug === slug);
}

export function getLegacyDocRedirect(slug: string) {
  return legacyDocRedirects.find((entry) => entry.legacySlug === slug);
}
