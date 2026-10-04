import type { AgentRuntime } from "./schema";

/** Explicit routes use only the selected snapshot; older snapshots keep their original lookup. */
export function guideMarkdownForRuntime(runtime: AgentRuntime, collection: string, slug: string): string | null {
  const key = `${collection}/${slug}`;
  if (runtime.guideRoutes) {
    const route = runtime.guideRoutes.routes.find(route => route.path === key);
    return route ? runtime.details[route.itemId]?.guide ?? null : null;
  }
  return Object.values(runtime.details).find(detail => detail.guide !== null
    && `${detail.item.id.startsWith("component:") ? "components" : "blocks"}/${detail.item.registryName}.md` === key)?.guide ?? null;
}

/** Legacy website aliases select current published bytes; historical bytes keep fixed URLs. */
export function publishedGuideMarkdown(snapshots: { currentVersion: string; versions: AgentRuntime[] }, collection: string, slug: string): string | null {
  const current = snapshots.versions.find(version => version.catalog.catalogVersion === snapshots.currentVersion);
  if (current?.catalog.mode !== "release") return null;
  return guideMarkdownForRuntime(current, collection, slug);
}
