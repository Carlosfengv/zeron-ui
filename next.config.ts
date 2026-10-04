import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { legacyBlockRedirects, legacyDocRedirects, pathnameOf } from "./docs/manifest";
import { resolveBuildVersion } from "./docs/components/shell/site/build-version.server";

import { getPreviewSourceAssetUrls } from "./docs/lib/block-preview-sources.generated";

const buildVersion = resolveBuildVersion();

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_VERSION_COMMIT_ID: buildVersion.commitId,
    NEXT_PUBLIC_VERSION_COMMIT_MESSAGE: buildVersion.commitMessage,
    NEXT_PUBLIC_VERSION_UPDATED_AT: buildVersion.updatedAt,
  },
  transpilePackages: ["@zeron/ui", "@zeron/blocks", "@zeron/icons"],
  // Keep production builds below Vercel's memory limit. This trades a small
  // amount of compilation time for a lower Webpack peak-memory footprint.
  experimental: {
    webpackMemoryOptimizations: true,
    // Keep compilation isolated even with the scheduler customization below.
    webpackBuildWorker: true,
    cpus: 2,
  },
  webpack(config) {
    // The docs include many independently loaded examples and language grammars.
    // Limit concurrent module work rather than dropping routes or validation.
    config.parallelism = 16;
    return config;
  },
  // Keep the long-running dev server isolated from `next build`. Both commands
  // otherwise write to `.next`, and a production build can invalidate the
  // active Turbopack cache and turn every dev request into a 500 response.
  distDir: process.env.NODE_ENV === "development" ? ".next-dev" : ".next",
  // An unrelated lockfile in the parent directory otherwise makes Next scan
  // the whole home workspace during development, which can leave the test
  // server compiling indefinitely.
  turbopack: {
    root: process.cwd(),
  },
  outputFileTracingRoot: process.cwd(),
  async headers() {
    return [
      ...getPreviewSourceAssetUrls().map((source) => ({
      source,
      headers: [
        { key: "Content-Type", value: "text/plain; charset=utf-8" },
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
      ],
    })),
      { source: "/ai/catalog.json", headers: [{ key: "Cache-Control", value: "public, max-age=60, stale-while-revalidate=60" }] },
      { source: "/ai/items/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=60, stale-while-revalidate=60" }] },
      { source: "/ai/releases/:path*", headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }] },
    ];
  },
  async redirects() {
    return [
      ...[
        { source: "/docs/blocks", destination: "/docs/pages" },
        { source: "/en/docs/blocks", destination: "/en/docs/pages" },
        { source: "/zh-cn/docs/blocks", destination: "/docs/pages" },
      ].map(({ source, destination }) => ({
        source,
        has: [{ type: "query" as const, key: "kind", value: "(?:page|prototype)" }],
        destination,
        permanent: false,
      })),
      ...legacyDocRedirects.flatMap(({ legacySlug, destination }) => {
        const pathname = pathnameOf(destination);
        return [
          { source: `/docs/${legacySlug}`, destination: pathname, permanent: true },
          { source: `/zh-cn/docs/${legacySlug}`, destination: `/zh-cn${pathname}`, permanent: true },
        ];
      }),
      ...legacyBlockRedirects.flatMap(({ source, destination }) =>
        ["", "/en", "/zh-cn"].map((prefix) => ({
          source: `${prefix}${source}`,
          destination: `${prefix === "/en" ? prefix : ""}${destination}`,
          permanent: true,
        }))),
    ];
  },
  async rewrites() {
    return [
      {
        source: "/figma-capture.js",
        destination: "https://mcp.figma.com/mcp/html-to-design/capture.js",
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin("./app/_i18n/request.ts");

export default withNextIntl(nextConfig);
