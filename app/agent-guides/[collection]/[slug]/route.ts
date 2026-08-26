import { readFile } from "node:fs/promises";
import { join } from "node:path";

// Keep every path literal so Next.js can trace only these files into the
// serverless function. A path assembled from dynamic route params makes the
// file tracer conservatively include the entire project directory, including
// .next/cache, which can make the Vercel function several gigabytes large.
const guideLoaders: Record<string, () => Promise<string>> = {
  "blocks/infinite-log-table-01.md": () =>
    readFile(
      join(
        process.cwd(),
        "docs/agent-guides/blocks/infinite-log-table-01.md",
      ),
      "utf8",
    ),
  "components/button.md": () =>
    readFile(
      join(process.cwd(), "docs/agent-guides/components/button.md"),
      "utf8",
    ),
  "components/input.md": () =>
    readFile(
      join(process.cwd(), "docs/agent-guides/components/input.md"),
      "utf8",
    ),
  "components/select.md": () =>
    readFile(
      join(process.cwd(), "docs/agent-guides/components/select.md"),
      "utf8",
    ),
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ collection: string; slug: string }> },
) {
  const { collection, slug } = await context.params;
  const loadGuide = guideLoaders[`${collection}/${slug}`];

  if (!loadGuide) {
    return new Response("Agent guide not found.\n", {
      status: 404,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  try {
    const markdown = await loadGuide();
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
