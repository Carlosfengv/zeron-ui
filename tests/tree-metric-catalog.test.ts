import { describe, expect, it } from "vitest";
import metricCatalogData from "../docs/pages/components/tree/metric-catalog.json";

type Catalog = readonly {
  id: string;
  metricCount: number;
  listedMetricCount?: number;
  resources: readonly {
    id: string;
    metricCount: number;
    listedMetricCount?: number;
    partial?: boolean;
    groups: readonly {
      id: string;
      metrics: readonly { id: string }[];
    }[];
  }[];
}[];

const catalog = metricCatalogData as Catalog;

describe("Tree metrics catalog fixture", () => {
  it("keeps declared and listed metric counts explicit", () => {
    let declaredTotal = 0;
    let listedTotal = 0;

    for (const source of catalog) {
      const sourceListed = source.resources.reduce((sourceCount, resource) => {
        const resourceListed = resource.groups.reduce(
          (resourceCount, group) => resourceCount + group.metrics.length,
          0,
        );
        expect(resourceListed).toBe(resource.listedMetricCount ?? resource.metricCount);
        return sourceCount + resourceListed;
      }, 0);

      expect(sourceListed).toBe(source.listedMetricCount ?? source.metricCount);
      declaredTotal += source.metricCount;
      listedTotal += sourceListed;
    }

    expect(declaredTotal).toBe(236);
    expect(listedTotal).toBe(224);
  });

  it("uses stable, unique paths and records the incomplete ceph_osd source", () => {
    const keys = catalog.flatMap((source) => source.resources.flatMap((resource) =>
      resource.groups.flatMap((group) => group.metrics.map((metric) =>
        `${source.id}:${resource.id}:${group.id}:${metric.id}`,
      )),
    ));
    const cephOsd = catalog
      .find((source) => source.id === "zbs")
      ?.resources.find((resource) => resource.id === "ceph-osd");

    expect(new Set(keys).size).toBe(keys.length);
    expect(cephOsd).toMatchObject({ metricCount: 14, listedMetricCount: 2, partial: true });
  });
});
