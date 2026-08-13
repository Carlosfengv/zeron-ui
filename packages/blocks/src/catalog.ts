export const blockCatalog = [
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
