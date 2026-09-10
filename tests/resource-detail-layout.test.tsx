// @vitest-environment jsdom

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ResourceDetailLayout } from "@zeron/ui/resource-detail-layout";

afterEach(cleanup);

describe("ResourceDetailLayout", () => {
  it("keeps the detail body full width and gives the primary column remaining space", () => {
    render(
      <ResourceDetailLayout
        actions={<button type="button">Edit</button>}
        aside={<p>Metadata</p>}
        asideLabel="Resource metadata"
        asideSide="left"
        asideWidth="25rem"
        navigation={<span>Resources / Detail</span>}
        recordNavigation={<button type="button">Close</button>}
        scrollMode="columns"
        status={<span>Published</span>}
        tabs={<nav>Overview</nav>}
        title="Feishu"
      >
        <article>Markdown content</article>
      </ResourceDetailLayout>
    );

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "Feishu" })).toBeTruthy();
    expect(screen.getByRole("complementary", { name: "Resource metadata" })).toBeTruthy();

    const layout = document.querySelector('[data-slot="page-layout"]');
    const body = document.querySelector('[data-slot="page-body"]');
    const columns = document.querySelector('[data-slot="page-columns"]') as HTMLElement;
    const primary = document.querySelector('[data-slot="page-primary"]');
    const aside = document.querySelector('[data-slot="page-aside"]');
    const recordNavigation = document.querySelector(
      '[data-slot="resource-detail-navigation"]'
    );

    expect(layout?.className).toContain("max-w-none");
    expect(body?.className).toContain("max-w-none");
    expect(body?.className).not.toContain("max-w-[1620px]");
    expect(body?.className).toContain("xl:overflow-hidden");
    expect(columns.className).toContain(
      "xl:grid-rows-[minmax(0,1fr)]"
    );
    expect(primary?.className).toContain("xl:overflow-y-auto");
    expect(aside?.className).toContain("xl:overflow-y-auto");
    expect(recordNavigation?.className).toContain("justify-start");
    expect(columns.style.getPropertyValue("--page-aside-width")).toBe("25rem");
    expect(columns.className).toContain(
      "xl:[&:has(>_[data-slot=page-aside])]:grid-cols-[var(--page-aside-width)_minmax(0,1fr)]"
    );
  });

  it("does not leave empty optional regions", () => {
    render(
      <ResourceDetailLayout title="Resource">
        Content
      </ResourceDetailLayout>
    );

    expect(document.querySelector('[data-slot="page-header"]')).toBeNull();
    expect(
      document.querySelector('[data-slot="resource-detail-navigation"]')
    ).toBeNull();
    expect(document.querySelector('[data-slot="resource-detail-tabs"]')).toBeNull();
    expect(document.querySelector('[data-slot="page-aside"]')).toBeNull();
  });
});
