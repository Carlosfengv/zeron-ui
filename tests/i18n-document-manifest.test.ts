import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  collectionDefinitions,
  contentKeyOf,
  detailDocEntries,
  legacyDocRedirects,
  navigationDocEntries,
  pageDocEntries,
  pageKeyOf,
  pathnameOf,
} from "../docs/manifest";

const ROOT = new URL("..", import.meta.url).pathname;

describe("documentation manifest", () => {
  it("ships the new collection labels in the messages actually loaded by the site shell", () => {
    for (const locale of ["en", "zh-CN"]) {
      const common = JSON.parse(readFileSync(join(ROOT, "docs/content", locale, "common.json"), "utf8"));
      const slim = JSON.parse(readFileSync(join(ROOT, "docs/content", locale, "common-slim.json"), "utf8"));
      for (const key of ["blocks", "pages", "charts"]) {
        expect(slim.navigation[key]).toBeTruthy();
        expect(slim.navigation[key]).toBe(common.navigation[key]);
      }
    }
  });

  it("defines the complete public documentation surface exactly once", () => {
    expect(collectionDefinitions.map(({ id }) => id)).toEqual(["components", "blocks", "pages", "icons"]);
    expect(pageDocEntries).toHaveLength(160);
    expect(detailDocEntries).toHaveLength(160);
    expect(pageDocEntries.find((entry) => entry.slug === "artifact-01")?.collection).toBe("blocks");
    expect(pageDocEntries.find((entry) => entry.slug === "chat-workspace-01")?.collection).toBe("blocks");
    expect(pageDocEntries.find((entry) => entry.slug === "chat-thread-01")?.collection).toBe("blocks");
    expect(pageDocEntries.find((entry) => entry.slug === "tool-calls-01")?.collection).toBe("blocks");
    expect(pageDocEntries.find((entry) => entry.collection === "blocks")?.slug).toBe("chat-markdown-01");
    expect(pageDocEntries.find((entry) => entry.collection === "components")?.slug).toBe("time-window-timeline");
    expect(pageDocEntries.find((entry) => entry.slug === "message-navigation")?.collection).toBe("components");
    expect(pageDocEntries.find((entry) => entry.slug === "markdown")?.collection).toBe("components");
    expect(pageDocEntries.find((entry) => entry.slug === "grouped-data-table-02")?.collection).toBe("blocks");
    expect(pageDocEntries.find((entry) => entry.slug === "grouped-data-table-01")?.collection).toBe("blocks");
    expect(pageDocEntries.find((entry) => entry.slug === "model-selector-01")?.collection).toBe("blocks");
    expect(pageDocEntries.find((entry) => entry.slug === "local-models-01")?.collection).toBe("blocks");
    expect(pageDocEntries.find((entry) => entry.slug === "appearance-settings-01")?.collection).toBe("blocks");
    expect(pageDocEntries.find((entry) => entry.slug === "usage-forecast-01")?.collection).toBe("blocks");
    expect(pageDocEntries.find((entry) => entry.slug === "usage-forecast-02")?.collection).toBe("blocks");
    expect(pageDocEntries.find((entry) => entry.slug === "usage-timeline-01")?.collection).toBe("blocks");
    expect(pageDocEntries.find((entry) => entry.slug === "time-window-timeline")?.collection).toBe("components");
    expect(pageDocEntries.find((entry) => entry.slug === "plan-usage-01")?.collection).toBe("blocks");
    expect(pageDocEntries.find((entry) => entry.slug === "context-window-01")?.collection).toBe("blocks");
    expect(pageDocEntries.some((entry) => entry.slug === "availability-monitor-01")).toBe(false);
    expect(pageDocEntries.find((entry) => entry.slug === "website-analytics-01")?.collection).toBe("blocks");
    expect(pageDocEntries.find((entry) => entry.slug === "sales-conversion-funnel-01")?.collection).toBe("blocks");
    expect(legacyDocRedirects).toHaveLength(88);
    expect(pageDocEntries.some(entry => entry.slug === "error-state" || entry.slug === "status-indicator")).toBe(false);
    expect(new Set(pageDocEntries.map(pathnameOf)).size).toBe(pageDocEntries.length);
  });

  it("groups chart references together and preserves the status component identity", () => {
    const charts = navigationDocEntries.filter((entry) => entry.collection === "components" && entry.section === "charts");
    expect(charts.map((entry) => entry.slug)).toEqual([
      "line-chart", "area-chart", "bar-chart", "pie-chart", "heatmap-chart", "live-line-chart", "radar-chart", "ring-chart", "funnel-chart", "status-overview",
      "time-range-histogram", "chart-primitives", "chart-tokens",
    ]);
    expect(charts.find((entry) => entry.slug === "status-overview")?.name).toBe("StatusBarChart");
    expect(charts.find((entry) => entry.slug === "area-chart")?.registryItem?.name).toBe("area-chart");
    expect(["line-chart", "area-chart", "bar-chart", "pie-chart", "heatmap-chart", "live-line-chart", "radar-chart", "ring-chart", "funnel-chart"].every(slug => charts.find(entry => entry.slug === slug)?.registryItem?.name === slug)).toBe(true);
    expect(pageDocEntries.some(entry => entry.slug === "donut-chart")).toBe(false);
    expect(legacyDocRedirects.find(entry => entry.legacySlug === "donut-chart")?.destination).toEqual({ collection: "components", slug: "pie-chart" });
    expect(pageDocEntries.some(entry => entry.slug === "activity-matrix-chart")).toBe(false);
    expect(legacyDocRedirects.find(entry => entry.legacySlug === "activity-matrix-chart")?.destination).toEqual({ collection: "components", slug: "heatmap-chart" });
    expect(pageDocEntries.some((entry) => entry.slug === "status-bar-chart")).toBe(false);
  });

  it("provides a compatibility route for the Base UI combobox reference path", () => {
    expect(
      existsSync(
        join(
          ROOT,
          "app/[locale]/docs/components/base/combobox/page.tsx",
        ),
      ),
    ).toBe(true);
  });

  it("gives each component and artifact a split route that defers its document import", () => {
    expect(existsSync(join(ROOT, "app/[locale]/docs/icons/[slug]/page.tsx"))).toBe(true);
    const loaders = readFileSync(join(ROOT, "docs/generated/page-loaders.generated.ts"), "utf8");
    for (const entry of detailDocEntries) {
      expect(loaders).toContain(`\"${pageKeyOf(entry)}\"`);
      expect(existsSync(join(ROOT, "docs/pages", pageKeyOf(entry), "page.tsx")), entry.slug).toBe(true);
      if (entry.collection === "icons") continue;
      const route = join(ROOT, "app/[locale]/docs", entry.collection, "(detail)", entry.slug, "page.tsx");
      expect(existsSync(route), entry.slug).toBe(true);
      expect(readFileSync(route, "utf8")).toContain(`loadPage: () => import("@docs/pages/${pageKeyOf(entry)}/page")`);
    }
  });

  it("tracks and supplies both message files for every formal page", () => {
    const messageLoaders = readFileSync(
      join(ROOT, "docs/i18n/content-loaders.generated.ts"),
      "utf8",
    );

    expect(existsSync(join(ROOT, "docs/content/en/home.json"))).toBe(true);
    expect(existsSync(join(ROOT, "docs/content/zh-CN/home.json"))).toBe(true);
    expect(messageLoaders).toContain("@docs/content/en/components/combobox.json");
    expect(messageLoaders).toContain("@docs/content/zh-CN/components/combobox.json");
    for (const entry of pageDocEntries) {
      const filename = `${contentKeyOf(entry)}.json`;
      expect(existsSync(join(ROOT, "docs/content/en", filename)), `en:${entry.slug}`).toBe(true);
      expect(existsSync(join(ROOT, "docs/content/zh-CN", filename)), `zh-CN:${entry.slug}`).toBe(true);
    }
  });
});
