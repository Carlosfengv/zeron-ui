export const blockCatalog = [
  {
    name: "resource-details-01",
    title: "Resource Details",
    description: "A grouped resource metadata panel with health, configuration, usage, and API compatibility details.",
    categories: ["application", "details"],
    dependencies: ["detail-list", "switch", "badge"],
  },
  {
    name: "resource-metric-list-01",
    title: "Resource Metric List 1",
    description: "A compact resource inventory with status distribution bars for infrastructure health at a glance.",
    categories: ["application", "metrics"],
    dependencies: ["detail-list"],
  },
  {
    name: "top-nav-app-shell-01",
    title: "TopNav App Shell",
    description: "A stacked application shell with a centered TopNav and focused content area.",
    categories: ["application", "navigation"],
    dependencies: ["app-shell", "page-layout", "top-nav", "nav-menu", "nav-item"],
  },
  {
    name: "zaiops-operations-01",
    title: "ZAIops Operations",
    description: "An operations workspace recipe with a responsive Sidebar, organization switcher, and grouped navigation.",
    categories: ["application", "operations"],
    dependencies: ["sidebar", "page-layout", "nav-menu", "nav-item"],
  },
] as const;
