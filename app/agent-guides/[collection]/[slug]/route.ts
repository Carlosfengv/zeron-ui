import { readFile } from "node:fs/promises";
import { join } from "node:path";

const guideDirectories = {
  components: "docs/agent-guides/components",
  blocks: "docs/agent-guides/blocks",
} as const;

type GuideCollection = keyof typeof guideDirectories;

function resolveGuideFile(collection: string, slug: string) {
  if (!(collection in guideDirectories)) return undefined;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/.test(slug)) return undefined;
  return join(
    process.cwd(),
    guideDirectories[collection as GuideCollection],
    slug,
  );
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ collection: string; slug: string }> },
) {
  const { collection, slug } = await context.params;
  const guideFile = resolveGuideFile(collection, slug);

  if (!guideFile) {
    return new Response("Agent guide not found.\n", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  try {
    const markdown = await readFile(guideFile, "utf8");
    return new Response(markdown, {
      headers: {
        "cache-control": "public, max-age=300, stale-while-revalidate=86400",
        "content-disposition": `inline; filename="${slug}"`,
        "content-type": "text/markdown; charset=utf-8",
      },
    });
  } catch {
    return new Response("Agent guide not found.\n", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }
}
