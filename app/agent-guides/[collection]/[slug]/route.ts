import { agentGuideLoaders } from "@docs/generated/agent-guide-loaders.generated";
import { snapshots } from "@/lib/agent-catalog/runtime";
import { guideMarkdownForRuntime } from "@/lib/agent-catalog/guides";

export async function GET(
  _request: Request,
  context: { params: Promise<{ collection: string; slug: string }> },
) {
  const { collection, slug } = await context.params;
  const key = `${collection}/${slug}`;
  const current = snapshots.versions.find(version => version.catalog.catalogVersion === snapshots.currentVersion)!;
  let markdown: string;
  if (current.catalog.mode === "release" || current.guideRoutes) {
    const published = guideMarkdownForRuntime(current, collection, slug);
    if (published === null) return new Response("Agent guide not found.\n", { status: 404 });
    markdown = published;
  } else {
    if (!Object.hasOwn(agentGuideLoaders, key)) return new Response("Agent guide not found.\n", { status: 404 });
    markdown = await agentGuideLoaders[key]();
  }
  return new Response(markdown, {
    headers: {
      "cache-control": "public, max-age=300, stale-while-revalidate=86400",
      "content-disposition": `inline; filename="${slug}"`,
      "content-type": "text/markdown; charset=utf-8",
    },
  });
}
