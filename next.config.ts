import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { legacyDocRedirects, pathnameOf } from "./docs/manifest";

const nextConfig: NextConfig = {
  transpilePackages: ["@zeron/ui", "@zeron/blocks", "@zeron/icons"],
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
  async redirects() {
    return legacyDocRedirects.flatMap(({ legacySlug, destination }) => {
      const pathname = pathnameOf(destination);
      return [
        { source: `/docs/${legacySlug}`, destination: pathname, permanent: true },
        { source: `/zh-cn/docs/${legacySlug}`, destination: `/zh-cn${pathname}`, permanent: true },
      ];
    });
  },
};

const withNextIntl = createNextIntlPlugin("./app/_i18n/request.ts");

export default withNextIntl(nextConfig);
